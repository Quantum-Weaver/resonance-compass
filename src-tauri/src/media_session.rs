// media_session.rs — Android MediaSession bridge (THE-UX-WALK U1).
//
// Fronts the app-local Kotlin MediaSessionPlugin (android-extras/, synced
// into gen/ at build time), the sibling of MediaPermissionPlugin on the same
// proven road. The session gives Bluetooth/AVRCP, headset buttons, and the
// lockscreen's media controls a real target for the rodio engine, which
// otherwise plays invisible to Android's media layer.
//
// Every command no-ops Ok on desktop, so the frontend calls unconditionally —
// no platform detection leaks into the player store.

use tauri::{AppHandle, Runtime};

#[cfg(target_os = "android")]
pub use android::init;

// The payloads exist only where the plugin does — desktop's command arms
// never construct them.
#[cfg(target_os = "android")]
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct MetadataPayload {
    title: String,
    artist: String,
    album: String,
    duration_ms: i64,
    art_base64: Option<String>,
}

#[cfg(target_os = "android")]
#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct PlaybackPayload {
    is_playing: bool,
    position_ms: i64,
}

#[tauri::command]
pub fn media_update_metadata<R: Runtime>(
    app: AppHandle<R>,
    title: String,
    artist: String,
    album: String,
    duration_ms: i64,
    art_base64: Option<String>,
) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        return android::update_metadata(
            &app,
            MetadataPayload { title, artist, album, duration_ms, art_base64 },
        );
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (app, title, artist, album, duration_ms, art_base64);
        Ok(())
    }
}

#[tauri::command]
pub fn media_update_playback<R: Runtime>(
    app: AppHandle<R>,
    is_playing: bool,
    position_ms: i64,
) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        return android::update_playback(&app, PlaybackPayload { is_playing, position_ms });
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = (app, is_playing, position_ms);
        Ok(())
    }
}

#[tauri::command]
pub fn media_release<R: Runtime>(app: AppHandle<R>) -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        return android::release(&app);
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = app;
        Ok(())
    }
}

/// POST_NOTIFICATIONS (API 33+) gates the lockscreen's MediaStyle controls;
/// the session itself (Bluetooth, headset buttons) works without it. May
/// block on the system dialog, so it rides spawn_blocking like the sibling
/// permission requests in lib.rs.
#[tauri::command]
pub async fn request_notification_permission<R: Runtime>(
    app: AppHandle<R>,
) -> Result<bool, String> {
    #[cfg(target_os = "android")]
    {
        return tauri::async_runtime::spawn_blocking(move || android::request_notifications(&app))
            .await
            .map_err(|e| e.to_string())?;
    }
    #[cfg(not(target_os = "android"))]
    {
        let _ = app;
        Ok(true)
    }
}

#[cfg(target_os = "android")]
mod android {
    use super::{MetadataPayload, PlaybackPayload};
    use serde::Deserialize;
    use tauri::{
        plugin::{Builder, PluginHandle, TauriPlugin},
        AppHandle, Manager, Runtime,
    };

    struct MediaSessionHandle<R: Runtime>(PluginHandle<R>);

    #[derive(Deserialize)]
    struct PermissionResponse {
        granted: bool,
    }

    #[derive(Deserialize)]
    struct Empty {}

    pub fn init<R: Runtime>() -> TauriPlugin<R> {
        Builder::new("media-session")
            .setup(|app, api| {
                let handle = api.register_android_plugin(
                    "com.audhd.resonance_compass.plugin",
                    "MediaSessionPlugin",
                )?;
                app.manage(MediaSessionHandle(handle));
                Ok(())
            })
            .build()
    }

    pub fn update_metadata<R: Runtime>(
        app: &AppHandle<R>,
        payload: MetadataPayload,
    ) -> Result<(), String> {
        app.state::<MediaSessionHandle<R>>()
            .0
            .run_mobile_plugin::<Empty>("updateMetadata", payload)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    pub fn update_playback<R: Runtime>(
        app: &AppHandle<R>,
        payload: PlaybackPayload,
    ) -> Result<(), String> {
        app.state::<MediaSessionHandle<R>>()
            .0
            .run_mobile_plugin::<Empty>("updatePlayback", payload)
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    pub fn release<R: Runtime>(app: &AppHandle<R>) -> Result<(), String> {
        app.state::<MediaSessionHandle<R>>()
            .0
            .run_mobile_plugin::<Empty>("releaseSession", ())
            .map(|_| ())
            .map_err(|e| e.to_string())
    }

    pub fn request_notifications<R: Runtime>(app: &AppHandle<R>) -> Result<bool, String> {
        app.state::<MediaSessionHandle<R>>()
            .0
            .run_mobile_plugin::<PermissionResponse>("requestNotificationPermission", ())
            .map(|r| r.granted)
            .map_err(|e| e.to_string())
    }
}
