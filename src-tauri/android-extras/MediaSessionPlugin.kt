// MediaSessionPlugin — the Android MediaSession bridge (THE-UX-WALK U1).
//
// Source of truth lives in src-tauri/android-extras/ (committed); the build
// copies it into gen/android/app/src/main/java/com/audhd/resonance_compass/plugin/
// via scripts/sync-android-extras.mjs because gen/ is gitignored and wiped by
// `tauri android init`. Loaded reflectively from Rust (media_session.rs).
//
// Platform android.media.session APIs only — deliberately no androidx.media
// dependency, so nothing here ever needs to touch gen/'s build.gradle. The
// session gives Bluetooth/AVRCP, headset buttons, and (via the MediaStyle
// notification) the system's lockscreen and quick-settings media controls a
// real target; transport commands flow back to the webview as `mediaCommand`
// events, the same road MediaPermissionPlugin's audioBecomingNoisy rides.
//
// On Android 13+ the system renders the media notification's controls from
// the session's PlaybackState actions itself. On 12 and below the MediaStyle
// notification shows metadata/art and the session still owns Bluetooth and
// headset buttons, but the notification carries no custom action buttons —
// wiring those needs a manifest-declared media-button receiver, which is the
// honest line this sitting drew (named in THE-UX-WALK's U1 row).

package com.audhd.resonance_compass.plugin

import android.app.Activity
import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.media.MediaMetadata
import android.media.session.MediaSession
import android.media.session.PlaybackState
import android.os.Build
import android.util.Base64
import app.tauri.PermissionState
import app.tauri.annotation.Command
import app.tauri.annotation.InvokeArg
import app.tauri.annotation.Permission
import app.tauri.annotation.PermissionCallback
import app.tauri.annotation.TauriPlugin
import app.tauri.plugin.Invoke
import app.tauri.plugin.JSObject
import app.tauri.plugin.Plugin

private const val ALIAS_NOTIFICATIONS = "notifications"
private const val CHANNEL_ID = "resonance_playback"
private const val NOTIFICATION_ID = 0xC0A55 // "COmpASS"

@InvokeArg
class MetadataArgs {
  var title: String = ""
  var artist: String = ""
  var album: String = ""
  var durationMs: Long = 0
  var artBase64: String? = null
}

@InvokeArg
class PlaybackArgs {
  var isPlaying: Boolean = false
  var positionMs: Long = 0
}

@TauriPlugin(
  permissions = [
    Permission(strings = ["android.permission.POST_NOTIFICATIONS"], alias = ALIAS_NOTIFICATIONS)
  ]
)
class MediaSessionPlugin(private val activity: Activity) : Plugin(activity) {
  private var session: MediaSession? = null
  private var lastMetadata: MetadataArgs? = null
  private var lastArt: Bitmap? = null
  private var isPlaying = false

  // Transport commands arriving from the system (Bluetooth, headset,
  // lockscreen) are relayed to the webview; the player store is the only
  // authority — this plugin never touches the audio engine directly.
  private val callback = object : MediaSession.Callback() {
    override fun onPlay() = emit("play")
    override fun onPause() = emit("pause")
    override fun onSkipToNext() = emit("next")
    override fun onSkipToPrevious() = emit("previous")
    override fun onStop() = emit("stop")
    override fun onSeekTo(pos: Long) {
      val data = JSObject()
      data.put("action", "seek")
      data.put("positionMs", pos)
      trigger("mediaCommand", data)
    }
  }

  private fun emit(action: String) {
    val data = JSObject()
    data.put("action", action)
    trigger("mediaCommand", data)
  }

  private fun ensureSession(): MediaSession {
    session?.let { return it }
    val s = MediaSession(activity.applicationContext, "ResonanceCompass")
    s.setCallback(callback)
    s.isActive = true
    session = s
    return s
  }

  @Command
  fun updateMetadata(invoke: Invoke) {
    val args = invoke.parseArgs(MetadataArgs::class.java)
    lastMetadata = args
    lastArt = decodeArt(args.artBase64)
    val builder = MediaMetadata.Builder()
      .putString(MediaMetadata.METADATA_KEY_TITLE, args.title)
      .putString(MediaMetadata.METADATA_KEY_ARTIST, args.artist)
      .putString(MediaMetadata.METADATA_KEY_ALBUM, args.album)
      .putLong(MediaMetadata.METADATA_KEY_DURATION, args.durationMs)
    lastArt?.let { builder.putBitmap(MediaMetadata.METADATA_KEY_ALBUM_ART, it) }
    ensureSession().setMetadata(builder.build())
    refreshNotification()
    invoke.resolve()
  }

  @Command
  fun updatePlayback(invoke: Invoke) {
    val args = invoke.parseArgs(PlaybackArgs::class.java)
    isPlaying = args.isPlaying
    val state = PlaybackState.Builder()
      .setActions(
        PlaybackState.ACTION_PLAY or PlaybackState.ACTION_PAUSE or
        PlaybackState.ACTION_PLAY_PAUSE or PlaybackState.ACTION_SKIP_TO_NEXT or
        PlaybackState.ACTION_SKIP_TO_PREVIOUS or PlaybackState.ACTION_SEEK_TO or
        PlaybackState.ACTION_STOP
      )
      .setState(
        if (args.isPlaying) PlaybackState.STATE_PLAYING else PlaybackState.STATE_PAUSED,
        args.positionMs,
        if (args.isPlaying) 1.0f else 0.0f
      )
      .build()
    ensureSession().setPlaybackState(state)
    refreshNotification()
    invoke.resolve()
  }

  // Stop surface: session released, notification withdrawn. The next
  // updateMetadata/updatePlayback recreates both — release is never terminal.
  @Command
  fun releaseSession(invoke: Invoke) {
    notificationManager().cancel(NOTIFICATION_ID)
    session?.let {
      it.isActive = false
      it.release()
    }
    session = null
    lastMetadata = null
    lastArt = null
    isPlaying = false
    invoke.resolve()
  }

  // ── POST_NOTIFICATIONS (API 33+; earlier Androids grant implicitly) ───────

  @Command
  fun checkNotificationPermission(invoke: Invoke) {
    invoke.resolve(notifStateResult())
  }

  @Command
  fun requestNotificationPermission(invoke: Invoke) {
    if (Build.VERSION.SDK_INT < 33 ||
      getPermissionState(ALIAS_NOTIFICATIONS) == PermissionState.GRANTED
    ) {
      invoke.resolve(notifStateResult())
    } else {
      requestPermissionForAlias(ALIAS_NOTIFICATIONS, invoke, "notificationPermissionCallback")
    }
  }

  @PermissionCallback
  fun notificationPermissionCallback(invoke: Invoke) {
    invoke.resolve(notifStateResult())
    // The hand may have just granted mid-track — surface the controls now.
    refreshNotification()
  }

  private fun notifStateResult(): JSObject {
    val res = JSObject()
    val granted = Build.VERSION.SDK_INT < 33 ||
      getPermissionState(ALIAS_NOTIFICATIONS) == PermissionState.GRANTED
    res.put("granted", granted)
    return res
  }

  // ── The MediaStyle notification — the lockscreen's handle on the session ──

  private fun notificationManager(): NotificationManager =
    activity.applicationContext.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

  private fun refreshNotification() {
    val meta = lastMetadata ?: return
    val s = session ?: return
    if (Build.VERSION.SDK_INT >= 33 &&
      getPermissionState(ALIAS_NOTIFICATIONS) != PermissionState.GRANTED
    ) return

    val ctx = activity.applicationContext
    val manager = notificationManager()
    if (Build.VERSION.SDK_INT >= 26 && manager.getNotificationChannel(CHANNEL_ID) == null) {
      // IMPORTANCE_LOW: visible controls, never a sound — the app's own
      // sound-opt-in law extends to its chrome.
      manager.createNotificationChannel(
        NotificationChannel(CHANNEL_ID, "Playback", NotificationManager.IMPORTANCE_LOW)
      )
    }

    val builder = if (Build.VERSION.SDK_INT >= 26) {
      Notification.Builder(ctx, CHANNEL_ID)
    } else {
      @Suppress("DEPRECATION")
      Notification.Builder(ctx)
    }
    builder
      .setSmallIcon(ctx.applicationInfo.icon)
      .setContentTitle(meta.title)
      .setContentText(meta.artist)
      .setVisibility(Notification.VISIBILITY_PUBLIC)
      .setOngoing(isPlaying)
      .setStyle(Notification.MediaStyle().setMediaSession(s.sessionToken))
    lastArt?.let { builder.setLargeIcon(it) }
    ctx.packageManager.getLaunchIntentForPackage(ctx.packageName)?.let { launch ->
      builder.setContentIntent(
        PendingIntent.getActivity(
          ctx, 0, launch,
          PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )
      )
    }
    manager.notify(NOTIFICATION_ID, builder.build())
  }

  // Cover art arrives as the frontend's data URI (data:image/…;base64,…) or
  // bare base64 — accept both, fail to null, never to a crash.
  private fun decodeArt(art: String?): Bitmap? {
    if (art.isNullOrEmpty()) return null
    return try {
      val b64 = art.substringAfter("base64,", art)
      val bytes = Base64.decode(b64, Base64.DEFAULT)
      BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
    } catch (_: Exception) {
      null
    }
  }
}
