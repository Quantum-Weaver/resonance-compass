// media_permission.rs — runtime media-permission bridge (Android).
//
// Wraps the app-local Kotlin MediaPermissionPlugin (android-extras/, synced
// into gen/ at build time). No Tauri plugin in our dependency set exposes
// Android runtime permissions, so this tiny inline plugin fills the gap.
// Desktop platforms have no permission model for local files — always granted.

#[cfg(target_os = "android")]
pub use android::*;

#[cfg(target_os = "android")]
mod android {
    use serde::Deserialize;
    use tauri::{
        plugin::{Builder, PluginHandle, TauriPlugin},
        AppHandle, Manager, Runtime,
    };

    struct MediaPermission<R: Runtime>(PluginHandle<R>);

    #[derive(Deserialize)]
    struct PermissionResponse {
        granted: bool,
    }

    pub fn init<R: Runtime>() -> TauriPlugin<R> {
        Builder::new("media-permission")
            .setup(|app, api| {
                let handle = api.register_android_plugin(
                    "com.audhd.resonance_compass.plugin",
                    "MediaPermissionPlugin",
                )?;
                app.manage(MediaPermission(handle));
                Ok(())
            })
            .build()
    }

    pub fn check<R: Runtime>(app: &AppHandle<R>) -> Result<bool, String> {
        app.state::<MediaPermission<R>>()
            .0
            .run_mobile_plugin::<PermissionResponse>("checkAudioPermission", ())
            .map(|r| r.granted)
            .map_err(|e| e.to_string())
    }

    pub fn request<R: Runtime>(app: &AppHandle<R>) -> Result<bool, String> {
        app.state::<MediaPermission<R>>()
            .0
            .run_mobile_plugin::<PermissionResponse>("requestAudioPermission", ())
            .map(|r| r.granted)
            .map_err(|e| e.to_string())
    }

    /// Called once from MediaPermissionPlugin's init block (Kotlin). cpal's
    /// oboe backend reads the JNI context via the ndk-context crate, but
    /// nothing in the tauri/wry/tao stack initializes it — without this every
    /// OutputStream::try_default() panics ("android context was not
    /// initialized") and audio is permanently unavailable on Android.
    #[no_mangle]
    pub extern "system" fn Java_com_audhd_resonance_1compass_plugin_MediaPermissionPlugin_nativeInitNdkContext(
        env: jni::JNIEnv,
        _this: jni::objects::JObject,
        context: jni::objects::JObject,
    ) {
        use std::sync::atomic::{AtomicBool, Ordering};
        static INITIALIZED: AtomicBool = AtomicBool::new(false);
        // ndk-context asserts on double-init — guard hard.
        if INITIALIZED.swap(true, Ordering::SeqCst) {
            return;
        }
        let Ok(vm) = env.get_java_vm() else { return };
        let Ok(global) = env.new_global_ref(&context) else { return };
        let context_ptr = global.as_raw();
        // The global ref must outlive the process — cpal reads it at any time.
        std::mem::forget(global);
        unsafe {
            ndk_context::initialize_android_context(
                vm.get_java_vm_pointer().cast(),
                context_ptr.cast(),
            );
        }
    }
}
