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
import android.media.AudioManager
import android.os.Build
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

@TauriPlugin(
  permissions = [
    Permission(strings = ["android.permission.READ_MEDIA_AUDIO"], alias = ALIAS_AUDIO),
    Permission(strings = ["android.permission.READ_EXTERNAL_STORAGE"], alias = ALIAS_STORAGE)
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

  override fun load(webView: WebView) {
    super.load(webView)
    val filter = IntentFilter(AudioManager.ACTION_AUDIO_BECOMING_NOISY)
    val ctx = webView.context
    // API 33+ requires an explicit export flag for context-registered receivers.
    // NOT_EXPORTED is correct: only the system delivers this protected broadcast.
    if (Build.VERSION.SDK_INT >= 33) {
      ctx.registerReceiver(becomingNoisyReceiver, filter, Context.RECEIVER_NOT_EXPORTED)
    } else {
      @Suppress("UnspecifiedRegisterReceiverFlag")
      ctx.registerReceiver(becomingNoisyReceiver, filter)
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
}
