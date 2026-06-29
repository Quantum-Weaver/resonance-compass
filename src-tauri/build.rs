fn main() {
    tauri_build::build();

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
