// folder_picker.rs — the SAF folder picker bridge (Android).
//
// Fronts the app-local Kotlin FolderPickerPlugin (android-extras/, synced into
// gen/ at build time), the third plugin on the media_permission / media_session
// road. tauri-plugin-dialog cannot open a folder on mobile, so this is how a
// vessel chooses a music folder on Android: the system's own chooser, a read
// grant Android keeps across restarts, and the tree walked into content://
// document URIs — which scan_paths and the player already open through
// tauri-plugin-fs's ContentResolver bridge. Built at KP's word, 2026-08-30
// ("SAF folder-picker plugin (#6 of the bunch) — yes let us fix this").
//
// Every call blocks until the plugin answers (the chooser waits on a person),
// so lib.rs's commands run these on spawn_blocking, never on the main looper.
// On desktop the types exist and nothing else does: the dialog plugin's own
// folder picker is that road, and the frontend keeps the branch it had.

use serde::{Deserialize, Serialize};

/// A folder the vessel chose, as Android names it.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct PickedFolder {
    pub uri: String,
    pub name: String,
}

/// One audio file inside a chosen folder — a content:// document URI the
/// existing scan opens as it opens any path.
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct FolderAudio {
    pub uri: String,
    pub name: String,
    #[serde(default)]
    pub mime: String,
    #[serde(default)]
    pub size: u64,
}

#[cfg(target_os = "android")]
pub use android::*;

#[cfg(target_os = "android")]
mod android {
    use super::{FolderAudio, PickedFolder};
    use serde::{Deserialize, Serialize};
    use tauri::{
        plugin::{Builder, PluginHandle, TauriPlugin},
        AppHandle, Manager, Runtime,
    };

    struct FolderPicker<R: Runtime>(PluginHandle<R>);

    #[derive(Deserialize)]
    struct PickResponse {
        uri: Option<String>,
        #[serde(default)]
        name: Option<String>,
    }

    #[derive(Deserialize)]
    struct ListResponse {
        files: Vec<FolderAudio>,
    }

    #[derive(Deserialize)]
    struct PersistedResponse {
        folders: Vec<PickedFolder>,
    }

    #[derive(Serialize)]
    struct TreeArgs {
        uri: String,
    }

    pub fn init<R: Runtime>() -> TauriPlugin<R> {
        Builder::new("folder-picker")
            .setup(|app, api| {
                let handle = api.register_android_plugin(
                    "com.audhd.resonance_compass.plugin",
                    "FolderPickerPlugin",
                )?;
                app.manage(FolderPicker(handle));
                Ok(())
            })
            .build()
    }

    /// The system chooser. `None` when the vessel backs out.
    pub fn pick<R: Runtime>(app: &AppHandle<R>) -> Result<Option<PickedFolder>, String> {
        let r = app
            .state::<FolderPicker<R>>()
            .0
            .run_mobile_plugin::<PickResponse>("pickFolder", ())
            .map_err(|e| e.to_string())?;
        Ok(r.uri.map(|uri| PickedFolder {
            name: r.name.unwrap_or_else(|| uri.clone()),
            uri,
        }))
    }

    /// Every audio file under one granted tree, walked by the provider.
    pub fn list_audio<R: Runtime>(app: &AppHandle<R>, uri: String) -> Result<Vec<FolderAudio>, String> {
        app.state::<FolderPicker<R>>()
            .0
            .run_mobile_plugin::<ListResponse>("listAudio", TreeArgs { uri })
            .map(|r| r.files)
            .map_err(|e| e.to_string())
    }

    /// The folders Android still lets this app read — the library's folders.
    pub fn persisted<R: Runtime>(app: &AppHandle<R>) -> Result<Vec<PickedFolder>, String> {
        app.state::<FolderPicker<R>>()
            .0
            .run_mobile_plugin::<PersistedResponse>("listPersisted", ())
            .map(|r| r.folders)
            .map_err(|e| e.to_string())
    }

    /// Give a grant back. Scanned rows stay; removal is the vessel's, by signature.
    pub fn release<R: Runtime>(app: &AppHandle<R>, uri: String) -> Result<(), String> {
        app.state::<FolderPicker<R>>()
            .0
            .run_mobile_plugin::<serde_json::Value>("releaseFolder", TreeArgs { uri })
            .map(|_| ())
            .map_err(|e| e.to_string())
    }
}
