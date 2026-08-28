// MediaPermissionPlugin — runtime media-permission bridge for library scanning.
//
// Source of truth lives in src-tauri/android-extras/ (committed); the build
// copies it into gen/android/app/src/main/java/com/audhd/resonance_compass/plugin/
// via scripts/sync-android-extras.mjs because gen/ is gitignored and wiped by
// `tauri android init`. Loaded reflectively from Rust (media_permission.rs) —
// the @TauriPlugin annotation both drives the permission machinery in the
// app.tauri Plugin base class and matches the R8 keep rule for plugin classes.

package com.audhd.resonance_compass.plugin

import android.app.Activity
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.webkit.WebView
import app.tauri.PermissionState
import app.tauri.annotation.Command
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

private const val ALIAS_AUDIO = "audio"
private const val ALIAS_STORAGE = "storage"
private const val ALIAS_MIC = "mic"

@TauriPlugin(
  permissions = [
    Permission(strings = ["android.permission.READ_MEDIA_AUDIO"], alias = ALIAS_AUDIO),
    Permission(strings = ["android.permission.READ_EXTERNAL_STORAGE"], alias = ALIAS_STORAGE),
    Permission(strings = ["android.permission.RECORD_AUDIO"], alias = ALIAS_MIC)
  ]
)
class MediaPermissionPlugin(activity: Activity) : Plugin(activity) {
  companion object {
    @Volatile private var ndkContextInitialized = false
  }

  init {
    // cpal (rodio's Android audio backend) reads the JNI context via Rust's
    // ndk-context crate, which nothing in the tauri stack initializes — hand
    // it over once so audio output can open. The native lib is already loaded:
    // plugin construction is driven from Rust.
    if (!ndkContextInitialized) {
      ndkContextInitialized = true
      nativeInitNdkContext(activity.applicationContext)
    }
  }

  // Pause playback when audio output is about to route to the phone speaker —
  // a Bluetooth device dropping or wired headphones being unplugged. Android's
  // ACTION_AUDIO_BECOMING_NOISY is the canonical signal; we relay it to the
  // webview, which calls the player's pause(). By design nothing auto-plays on
  // reconnect — the frontend only ever pauses on this event.
  private val becomingNoisyReceiver = object : BroadcastReceiver() {
    override fun onReceive(context: Context?, intent: Intent?) {
      if (intent?.action == AudioManager.ACTION_AUDIO_BECOMING_NOISY) {
        trigger("audioBecomingNoisy", JSObject())
      }
    }
  }

  // When the set of available audio devices changes — Bluetooth headset
  // connected, wired headphones plugged, USB DAC attached — the default output
  // route may shift. Rodio's OutputStream is bound to the device that was
  // default when it opened, so the frontend must rebuild it and reload the
  // current track. We emit on both add and remove so reconnects are caught.
  private val audioDeviceCallback = object : AudioDeviceCallback() {
    override fun onAudioDevicesAdded(addedDevices: Array<AudioDeviceInfo>) {
      trigger("audioOutputChanged", JSObject())
    }

    override fun onAudioDevicesRemoved(removedDevices: Array<AudioDeviceInfo>) {
      trigger("audioOutputChanged", JSObject())
    }
  }

  override fun load(webView: WebView) {
    super.load(webView)
    val ctx = webView.context

    val filter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
    // API 33+ requires an explicit export flag for context-registered receivers.
    // NOT_EXPORTED is correct: only the system delivers this protected broadcast.
    if (Build.VERSION.SDK_INT >= 33) {
      ctx.registerReceiver(becomingNoisyReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag")
      ctx.registerReceiver(becomingNoisyReceiver, filter)
    }

    // API 23+: listen for changes to the available audio devices so playback
    // can follow Bluetooth/wired/USB routing changes without an app restart.
    if (Build.VERSION.SDK_INT >= 23) {
      val audioManager = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      audioManager.registerAudioDeviceCallback(audioDeviceCallback, Handler(Looper.getMainLooper()))
    }
  }

  override fun unload(webView: WebView) {
    super.unload(webView)
    val ctx = webView.context
    try {
      ctx.unregisterReceiver(becomingNoisyReceiver)
    } catch (_: IllegalArgumentException) {
      // Receiver was not registered; ignore.
    }
    if (Build.VERSION.SDK_INT >= 23) {
      val audioManager = ctx.getSystemService(Context.AUDIO_SERVICE) as AudioManager
      audioManager.unregisterAudioDeviceCallback(audioDeviceCallback)
    }
  }

  private external fun nativeInitNdkContext(context: Context)

  // READ_MEDIA_AUDIO exists only on API 33+; older Androids use the legacy
  // storage permission (requesting the wrong one is silently auto-denied).
  private val alias: String
    get() = if (Build.VERSION.SDK_INT >= 33) ALIAS_AUDIO else ALIAS_STORAGE

  @Command
  fun checkAudioPermission(invoke: Invoke) {
    invoke.resolve(stateResult())
  }

  @Command
  fun requestAudioPermission(invoke: Invoke) {
    if (getPermissionState(alias) == PermissionState.GRANTED) {
      invoke.resolve(stateResult())
    } else {
      requestPermissionForAlias(alias, invoke, "audioPermissionCallback")
    }
  }

  @PermissionCallback
  fun audioPermissionCallback(invoke: Invoke) {
    invoke.resolve(stateResult())
  }

  private fun stateResult(): JSObject {
    val res = JSObject()
    res.put("granted", getPermissionState(alias) == PermissionState.GRANTED)
    return res
  }

  // ── The microphone (RECORD_AUDIO) — v3 Phase 2 ──────────────────────────────

  @Command
  fun checkMicPermission(invoke: Invoke) {
    invoke.resolve(micStateResult())
  }

  @Command
  fun requestMicPermission(invoke: Invoke) {
    if (getPermissionState(ALIAS_MIC) == PermissionState.GRANTED) {
      invoke.resolve(micStateResult())
    } else {
      requestPermissionForAlias(ALIAS_MIC, invoke, "micPermissionCallback")
    }
  }

  @PermissionCallback
  fun micPermissionCallback(invoke: Invoke) {
    invoke.resolve(micStateResult())
  }

  private fun micStateResult(): JSObject {
    val res = JSObject()
    res.put("granted", getPermissionState(ALIAS_MIC) == PermissionState.GRANTED)
    return res
  }
}
