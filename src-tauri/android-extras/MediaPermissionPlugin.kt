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
import android.content.Context
import android.os.Build
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
