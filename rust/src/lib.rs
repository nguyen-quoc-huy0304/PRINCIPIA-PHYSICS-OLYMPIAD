//! PRINCIPIA — Rust-first application core.
//! The existing web/Electron clients are adapters; domain rules live here.

pub mod cpp_physics;
pub mod access;
pub mod content;
pub mod session;
pub mod assessment;
pub mod features;
pub mod physics;
pub mod virtual_lab;
pub mod progress;
pub mod store;

pub const APP_NAME: &str = "PRINCIPIA";
pub const CORE_VERSION: &str = env!("CARGO_PKG_VERSION");

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct CoreInfo {
    pub name: &'static str,
    pub version: &'static str,
    pub primary_language: &'static str,
    pub simulation_language: &'static str,
}

pub fn info() -> CoreInfo {
    CoreInfo {
        name: APP_NAME,
        version: CORE_VERSION,
        primary_language: "Rust",
        simulation_language: "C++",
    }
}
