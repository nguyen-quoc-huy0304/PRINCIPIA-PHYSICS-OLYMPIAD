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

#[wasm_bindgen]
pub fn physics_linear_regression_json(points_json: &str) -> Result<String, JsValue> {
    let points: Vec<[f64; 2]> = serde_json::from_str(points_json)
        .map_err(|error| JsValue::from_str(&format!("Invalid regression points: {error}")))?;
    if points.len() < 2 || points.len() > 10_000 {
        return Err(JsValue::from_str("Regression requires 2 to 10000 points"));
    }
    let pairs: Vec<(f64, f64)> = points.iter().map(|point| (point[0], point[1])).collect();
    let fit = crate::data_analysis::linear_regression(&pairs)
        .map_err(|error| JsValue::from_str(&format!("Regression failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "slope": fit.slope,
        "intercept": fit.intercept,
        "rSquared": fit.r_squared,
        "rmse": fit.rmse,
        "count": fit.count
    })).map_err(|error| JsValue::from_str(&error.to_string()))
}

#[wasm_bindgen]
pub fn physics_robot_arm_json(
    l1_m: f64,
    l2_m: f64,
    target_x_m: f64,
    target_y_m: f64,
    elbow_branch: i32,
) -> Result<String, JsValue> {
    let solution = crate::robotics::inverse_kinematics(
        l1_m, l2_m, target_x_m, target_y_m, elbow_branch
    ).map_err(|error| JsValue::from_str(&format!("Robot kinematics failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "shoulderRad": solution.shoulder_rad,
        "elbowRad": solution.elbow_rad,
        "shoulderDeg": solution.shoulder_deg,
        "elbowDeg": solution.elbow_deg,
        "endXM": solution.end_x_m,
        "endYM": solution.end_y_m,
        "targetErrorM": solution.target_error_m,
        "singular": solution.singular
    })).map_err(|error| JsValue::from_str(&error.to_string()))
}
