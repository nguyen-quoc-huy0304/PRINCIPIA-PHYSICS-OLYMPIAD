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
