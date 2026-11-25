//! Small wasm-bindgen boundary for browser clients. Game rules stay in Rust.
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn score_projectile_json(
    speed: f64,
    angle_degrees: f64,
    target_m: f64,
    gravity: f64,
) -> Result<String, JsValue> {
    let shot = crate::game::score_projectile(speed, angle_degrees, target_m, gravity)
        .map_err(|_| JsValue::from_str("Thông số bắn không hợp lệ"))?;
    serde_json::to_string(&serde_json::json!({
        "rangeM": shot.range_m,
        "errorM": shot.error_m,
        "points": shot.points
    }))
    .map_err(|error| JsValue::from_str(&error.to_string()))
}


#[wasm_bindgen]
pub fn generate_game_challenge_json(seed: u64) -> Result<String, JsValue> {
    let challenge = crate::game_challenge::generate_challenge(seed);
    serde_json::to_string(&serde_json::json!({
        "speed": challenge.speed_mps,
        "gravity": challenge.gravity_mps2,
        "target": challenge.target_m
    })).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn clamp_game_target(target_m: f64, speed_mps: f64, gravity_mps2: f64) -> Result<f64, JsValue> {
    crate::game_challenge::clamp_target(target_m, speed_mps, gravity_mps2)
        .map_err(|_| JsValue::from_str("Thông số mục tiêu không hợp lệ"))
}

#[wasm_bindgen]
pub fn game_trajectory_json(speed_mps: f64, angle_degrees: f64, gravity_mps2: f64, samples: usize) -> Result<String, JsValue> {
    let points = crate::game_challenge::trajectory(speed_mps, angle_degrees, gravity_mps2, samples)
        .map_err(|_| JsValue::from_str("Thông số quỹ đạo không hợp lệ"))?;
    serde_json::to_string(&points).map_err(|error| JsValue::from_str(&error.to_string()))
}
