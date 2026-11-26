//! PRINCIPIA — Rust-first application core.
 //! The existing web/Electron clients are adapters; domain rules live here.

#[cfg(not(target_arch = "wasm32"))]
pub mod cpp_physics;
pub mod access;
pub mod content;
pub mod session;
pub mod assessment;
pub mod features;
pub mod physics;
pub mod rigid_body;
pub mod robotics;
pub mod data_analysis;
pub mod game;
pub mod game_challenge;
pub mod science_mystery;
pub mod daily_challenge;
#[cfg(target_arch = "wasm32")]
mod wasm_api;
#[cfg(target_arch = "wasm32")]
mod wasm_physics;
pub mod virtual_lab;
pub mod progress;
pub mod learning;
pub mod study_engine;
pub mod progression;
pub mod store;
pub mod ui_state;
pub mod ui_renderer;

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
