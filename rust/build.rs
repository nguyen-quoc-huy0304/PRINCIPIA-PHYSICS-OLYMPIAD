fn main() {
    println!("cargo:rerun-if-changed=../src/physics/engine.cpp");
    println!("cargo:rerun-if-changed=../src/physics/engine_test.cpp");

    // cc handles MSVC, GNU and Apple toolchains without hard-coded Unix tools.
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
