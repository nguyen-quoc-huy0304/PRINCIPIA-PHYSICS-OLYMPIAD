fn main() {
    println!("cargo:rerun-if-changed=../src/physics/engine.cpp");
    println!("cargo:rerun-if-changed=../src/physics/engine_test.cpp");

    // The web build uses the pure-Rust physics/game modules; do not invoke
    // the native C++ compiler for wasm32-unknown-unknown.
    let target = std::env::var("TARGET").unwrap_or_default();
    if target.starts_with("wasm32-") {
        return;
    }

    cc::Build::new()
        .cpp(true)
        .file("../src/physics/engine.cpp")
        .include("../src/physics")
        .opt_level(3)
        .define("NDEBUG", None)
        .flag_if_supported("-std=c++17")
        .flag_if_supported("-fvisibility=hidden")
        .compile("principia_physics");
}
