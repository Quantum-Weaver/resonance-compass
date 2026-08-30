fn main() {
    // The three app-local Android plugins (media_permission.rs, media_session.rs,
    // folder_picker.rs) must be declared to the ACL or the webview's
    // addPluginListener is denied at the permission wall — "registerListener
    // not allowed. Plugin not found." That denial is exactly what killed
    // Bluetooth/AVRCP transport commands and the audio-becoming-noisy
    // auto-pause (found 2026-08-13, the car ride). Their capability grants
    // live in capabilities/default.json as media-session:default /
    // media-permission:default / folder-picker:default — every plugin its own
    // entry (ANDROID-BUILD-LAWS §1).
    tauri_build::try_build(
        tauri_build::Attributes::new()
            .plugin(
                "media-session",
                tauri_build::InlinedPlugin::new()
                    .commands(&["registerListener", "removeListener"])
                    .default_permission(tauri_build::DefaultPermissionRule::AllowAllCommands),
            )
            .plugin(
                "media-permission",
                tauri_build::InlinedPlugin::new()
                    .commands(&["registerListener", "removeListener"])
                    .default_permission(tauri_build::DefaultPermissionRule::AllowAllCommands),
            )
            .plugin(
                "folder-picker",
                tauri_build::InlinedPlugin::new()
                    .commands(&["registerListener", "removeListener"])
                    .default_permission(tauri_build::DefaultPermissionRule::AllowAllCommands),
            ),
    )
    .expect("failed to run tauri-build");

    if std::env::var("CARGO_CFG_TARGET_OS").as_deref() == Ok("android") {
        let manifest_dir = std::env::var("CARGO_MANIFEST_DIR").unwrap();
        let target = std::env::var("TARGET").unwrap_or_default();
        let abi = match target.as_str() {
            "aarch64-linux-android"   => "arm64-v8a",
            "armv7-linux-androideabi" => "armeabi-v7a",
            "i686-linux-android"      => "x86",
            "x86_64-linux-android"    => "x86_64",
            _                         => return,
        };

        // The jniLibs/<abi> dirs contain ONLY libc++_shared.so — not libc.a.
        // The NDK sysroot lib dir also has libc.a which embeds rust_eh_personality
        // (compiled into the NDK's bundled Rust stdlib), causing a duplicate-symbol
        // conflict with Rust's own libstd.  By pointing the linker only at jniLibs,
        // we get libc++_shared.so in NEEDED without pulling in libc.a.
        println!(
            "cargo:rustc-link-search=native={manifest_dir}/gen/android/app/src/main/jniLibs/{abi}"
        );
        println!("cargo:rustc-link-lib=c++_shared");
    }
}
