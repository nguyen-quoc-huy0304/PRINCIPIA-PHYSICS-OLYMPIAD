use std::{env, path::PathBuf, process::Command};

fn run(command: &mut Command, label: &str) {
    let status = command.status().unwrap_or_else(|e| panic!("failed to start {label}: {e}"));
    assert!(status.success(), "{label} failed with {status}");
}

fn main() {
    println!("cargo:rerun-if-changed=../src/physics/engine.cpp");
    let out = PathBuf::from(env::var_os("OUT_DIR").expect("OUT_DIR"));
    let object = out.join("principia_physics.o");
    let archive = out.join("libprincipia_physics.a");
    let cxx = env::var("CXX").unwrap_or_else(|_| "c++".into());
    let ar = env::var("AR").unwrap_or_else(|_| "ar".into());

    run(Command::new(cxx)
        .arg("-std=c++17").arg("-O3").arg("-DNDEBUG").arg("-fPIC").arg("-fvisibility=hidden")
        .arg("-I../src/physics").arg("-c").arg("../src/physics/engine.cpp")
        .arg("-o").arg(&object), "C++ physics compilation");
    run(Command::new(ar).arg("crus").arg(&archive).arg(&object), "C++ static archive");

    println!("cargo:rustc-link-search=native={}", out.display());
    println!("cargo:rustc-link-lib=static=principia_physics");
    println!("cargo:rustc-link-lib=m");
}
