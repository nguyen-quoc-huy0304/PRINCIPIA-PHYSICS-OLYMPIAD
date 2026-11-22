use serde_json::{json, Value};
use std::io::{self, BufRead, Write};

fn number(request: &Value, key: &str) -> Result<f64, String> {
    request.get(key).and_then(Value::as_f64)
        .filter(|value| value.is_finite())
        .ok_or_else(|| format!("Missing or invalid numeric field: {key}"))
}

fn dispatch(request: &Value) -> Value {
    let id = request.get("id").cloned().unwrap_or(Value::Null);
    let result: Result<Value, String> = (|| {
        let op = request.get("op").and_then(Value::as_str).ok_or("Missing operation")?;
        if op == "robotArmIK" {
            let branch_value = number(request, "elbowBranch")?;
            if branch_value.fract() != 0.0 || (branch_value != 1.0 && branch_value != -1.0) {
                return Err("elbowBranch must be +1 or -1".to_string());
            }
            let solution = principia_core::robotics::inverse_kinematics(
                number(request, "l1M")?, number(request, "l2M")?,
                number(request, "targetXM")?, number(request, "targetYM")?,
                branch_value as i32,
            ).map_err(|error| format!("Robot arm target rejected: {error:?}"))?;
            return Ok(json!({
                "shoulderRad": solution.shoulder_rad, "elbowRad": solution.elbow_rad,
                "shoulderDeg": solution.shoulder_deg, "elbowDeg": solution.elbow_deg,
                "endXM": solution.end_x_m, "endYM": solution.end_y_m,
                "targetErrorM": solution.target_error_m, "singular": solution.singular
            }));
        }
        if op == "rigidBodyDrop" {
            let steps_value = number(request, "steps")?;
            if steps_value < 0.0 || steps_value > 60000.0 || steps_value.fract() != 0.0 {
                return Err("steps must be an integer between 0 and 60000".to_string());
            }
            let mut lab = principia_core::rigid_body::RigidBodyLab::new(
                number(request, "initialHeightM")? as f32,
                number(request, "gravityMps2")? as f32,
                number(request, "radiusM")? as f32,
                number(request, "restitution")? as f32,
            ).map_err(|error| format!("Invalid rigid-body parameters: {error:?}"))?;
            lab.step(steps_value as u32);
            return Ok(json!({
                "positionM": lab.position_m(),
                "velocityMps": lab.velocity_mps(),
                "steps": lab.elapsed_steps()
            }));
        }
        if op == "gameProjectileScore" {
            let shot = principia_core::game::score_projectile(
                number(request,"speed")?, number(request,"angleDeg")?,
                number(request,"targetM")?, number(request,"gravity")?
            ).map_err(|_| "Game input is outside the supported domain".to_string())?;
            return Ok(json!({"rangeM":shot.range_m,"errorM":shot.error_m,"points":shot.points}));
        }
        let value = match op {
            "velocity" => principia_core::cpp_physics::velocity(number(request,"initial")?, number(request,"acceleration")?, number(request,"seconds")?),
            "displacement" => principia_core::cpp_physics::displacement(number(request,"initial")?, number(request,"acceleration")?, number(request,"seconds")?),
            "kineticEnergy" => principia_core::cpp_physics::kinetic_energy(number(request,"massKg")?, number(request,"speedMps")?),
            "projectileRange" => principia_core::cpp_physics::projectile_range(number(request,"speed")?, number(request,"angleDeg")?, number(request,"gravity")?),
            "projectileMaxHeight" => principia_core::cpp_physics::projectile_max_height(number(request,"speed")?, number(request,"angleDeg")?, number(request,"gravity")?),
            _ => return Err(format!("Unsupported operation: {op}")),
        };
        value.map(|v| json!(v)).map_err(|_| "Physics input is outside the supported domain".to_string())
    })();
    match result {
        Ok(value) => json!({"id": id, "ok": true, "value": value}),
        Err(error) => json!({"id": id, "ok": false, "error": error}),
    }
}

fn main() {
    for line in io::stdin().lock().lines() {
        let response = match line {
            Ok(line) => match serde_json::from_str::<Value>(&line) {
                Ok(request) => dispatch(&request),
                Err(error) => json!({"id": null, "ok": false, "error": format!("Invalid request: {error}")}),
            },
            Err(_) => break,
        };
        if let Ok(encoded) = serde_json::to_string(&response) {
            let stdout = io::stdout();
            let mut output = stdout.lock();
            if writeln!(output, "{encoded}").and_then(|_| output.flush()).is_err() { break; }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn dispatches_native_velocity_calculation() {
        let response = dispatch(&json!({"id":7,"op":"velocity","initial":3.0,"acceleration":2.0,"seconds":4.0}));
        assert_eq!(response["id"], 7);
        assert_eq!(response["ok"], true);
        assert_eq!(response["value"], 11.0);
    }
    #[test]
    fn dispatches_native_game_scoring() {
        let target = 20.0_f64 * 20.0 / 9.80665;
        let response = dispatch(&json!({"id":10,"op":"gameProjectileScore","speed":20.0,"angleDeg":45.0,"targetM":target,"gravity":9.80665}));
        assert_eq!(response["ok"], true);
        assert_eq!(response["value"]["points"], 100);
    }
    #[test]
    fn dispatches_robot_arm_inverse_kinematics() {
        let response = dispatch(&json!({"id":12,"op":"robotArmIK","l1M":0.8,"l2M":0.6,"targetXM":0.7,"targetYM":0.5,"elbowBranch":1.0}));
        assert_eq!(response["ok"], true);
        assert!(response["value"]["targetErrorM"].as_f64().unwrap() < 1e-10);
    }
    #[test]
    fn rejects_unreachable_robot_target() {
        let response = dispatch(&json!({"id":13,"op":"robotArmIK","l1M":0.8,"l2M":0.6,"targetXM":3.0,"targetYM":0.0,"elbowBranch":1.0}));
        assert_eq!(response["ok"], false);
    }
    #[test]
    fn dispatches_rapier_rigid_body_drop() {
        let response = dispatch(&json!({
            "id": 11, "op": "rigidBodyDrop",
            "initialHeightM": 10.0, "gravityMps2": 9.81,
            "radiusM": 0.5, "restitution": 0.7, "steps": 30
        }));
        assert_eq!(response["ok"], true);
        assert_eq!(response["value"]["steps"], 30);
        assert!(response["value"]["positionM"][1].as_f64().unwrap() < 10.0);
    }

    #[test]
    fn rejects_unsupported_operations() {
        let response = dispatch(&json!({"id":8,"op":"deleteEverything"}));
        assert_eq!(response["ok"], false);
        assert!(response["error"].as_str().unwrap().contains("Unsupported operation"));
    }
    #[test]
    fn rejects_invalid_physics_domain() {
        let response = dispatch(&json!({"id":9,"op":"kineticEnergy","massKg":-1.0,"speedMps":3.0}));
        assert_eq!(response["ok"], false);
    }
}
