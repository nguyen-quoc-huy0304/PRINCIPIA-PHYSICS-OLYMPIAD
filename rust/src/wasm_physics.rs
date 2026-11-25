//! Browser WebAssembly exports for validated physics primitives.
use wasm_bindgen::prelude::*;

fn js_error(error: crate::physics::PhysicsError) -> JsValue {
    JsValue::from_str(&format!("Invalid physics input: {error:?}"))
}

#[wasm_bindgen]
pub fn physics_velocity(initial_mps: f64, acceleration_mps2: f64, seconds: f64) -> Result<f64, JsValue> {
    crate::physics::velocity(initial_mps, acceleration_mps2, seconds).map_err(js_error)
}

#[wasm_bindgen]
pub fn physics_displacement(initial_mps: f64, acceleration_mps2: f64, seconds: f64) -> Result<f64, JsValue> {
    crate::physics::displacement(initial_mps, acceleration_mps2, seconds).map_err(js_error)
}

#[wasm_bindgen]
pub fn physics_kinetic_energy(mass_kg: f64, speed_mps: f64) -> Result<f64, JsValue> {
    crate::physics::kinetic_energy(mass_kg, speed_mps).map_err(js_error)
}

#[wasm_bindgen]
pub fn physics_projectile_json(speed_mps: f64, angle_degrees: f64, gravity_mps2: f64) -> Result<String, JsValue> {
    let result = crate::physics::projectile(speed_mps, angle_degrees, gravity_mps2).map_err(js_error)?;
    serde_json::to_string(&serde_json::json!({
        "range": result.range,
        "flightTime": result.flight_time,
        "maxHeight": result.max_height,
        "vx": result.horizontal_velocity,
        "vy": result.vertical_velocity,
        "impactSpeed": speed_mps
    })).map_err(|error| JsValue::from_str(&error.to_string()))
}
