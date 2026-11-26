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
        if op == "uiSnapshot" {
            let mut state = principia_core::ui_state::UiState::default();
            let route = request.get("route").and_then(Value::as_str).unwrap_or("home");
            state.navigate(route).map_err(|_| "invalid UI route".to_string())?;
            if let Some(width) = request.get("width").and_then(Value::as_u64) {
                let width = u32::try_from(width).map_err(|_| "width is out of range")?;
                state.set_width(width).map_err(|_| "invalid viewport width".to_string())?;
            }
            if let Some(open) = request.get("sidebarOpen").and_then(Value::as_bool) { state.sidebar_open = open && state.layout() != principia_core::ui_state::LayoutMode::Compact; }
            if request.get("searchOpen").and_then(Value::as_bool).unwrap_or(false) { state.open_search(); }
            if let Some(query) = request.get("searchQuery").and_then(Value::as_str) { state.set_search(query); }
            if let Some(dialog) = request.get("dialog").and_then(Value::as_str) {
                state.open_dialog(dialog).map_err(|_| "invalid dialog name".to_string())?;
            }
            return Ok(Value::String(state.snapshot_json()));
        }
        if op == "linearRegression" {
            let values = request.get("points").and_then(Value::as_array)
                .ok_or("points must be an array of [x, y] pairs")?;
            if values.len() > 10000 { return Err("at most 10000 data points are supported".to_string()); }
            let mut points = Vec::with_capacity(values.len());
            for pair in values {
                let pair = pair.as_array().filter(|p| p.len() == 2)
                    .ok_or("each point must contain exactly [x, y]")?;
                let x = pair[0].as_f64().filter(|v| v.is_finite()).ok_or("point x must be finite")?;
                let y = pair[1].as_f64().filter(|v| v.is_finite()).ok_or("point y must be finite")?;
                points.push((x, y));
            }
            let fit = principia_core::data_analysis::linear_regression(&points)
                .map_err(|error| format!("Regression rejected: {error:?}"))?;
            return Ok(json!({"slope":fit.slope,"intercept":fit.intercept,"rSquared":fit.r_squared,"rmse":fit.rmse,"count":fit.count}));
        }
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
        if op == "gradeQuiz" {
            let values = request.get("questions").and_then(Value::as_array)
                .ok_or("questions must be an array")?;
            if values.len() > 500 { return Err("at most 500 questions are supported".to_string()); }
            let mut questions = Vec::with_capacity(values.len());
            for value in values {
                let id = value.get("id").and_then(Value::as_str)
                    .ok_or("each question requires a string id")?.to_string();
                let selected = value.get("selectedIndex").and_then(Value::as_u64)
                    .and_then(|v| usize::try_from(v).ok()).ok_or("selectedIndex must be a non-negative integer")?;
                let correct = value.get("correctIndex").and_then(Value::as_u64)
                    .and_then(|v| usize::try_from(v).ok()).ok_or("correctIndex must be a non-negative integer")?;
                let option_count = value.get("optionCount").and_then(Value::as_u64)
                    .and_then(|v| usize::try_from(v).ok()).ok_or("optionCount must be an integer from 2 to 16")?;
                let points = value.get("points").and_then(Value::as_f64)
                    .filter(|v| v.is_finite()).ok_or("points must be finite")?;
                questions.push((id, selected, correct, option_count, points));
            }
            let pass_percent = request.get("passPercent").and_then(Value::as_f64)
                .filter(|v| v.is_finite()).ok_or("passPercent must be a finite number")?;
            let result = principia_core::quiz::grade_attempt(&questions, pass_percent)
                .map_err(|error| format!("Quiz attempt rejected: {error:?}"))?;
            let details: Vec<Value> = result.results.iter().map(|item| json!({
                "questionId": item.question_id,
                "correct": item.correct,
                "earnedPoints": item.earned_points,
                "availablePoints": item.available_points
            })).collect();
            return Ok(json!({
                "score": result.score,
                "maxScore": result.max_score,
                "percent": result.percent,
                "passed": result.passed,
                "correctCount": result.correct_count,
                "questionCount": result.question_count,
                "results": details
            }));
        }
        if op == "studyPlan" {
            use principia_core::learning::{LearnerContext, LearningGoal};
            let goal = match request.get("goal").and_then(Value::as_str) {
                None | Some("") => None,
                Some("understand") => Some(LearningGoal::Understand),
                Some("remember") => Some(LearningGoal::Remember),
                Some("solve") => Some(LearningGoal::Solve),
                Some("olympiad") => Some(LearningGoal::Olympiad),
                Some("teach") => Some(LearningGoal::Teach),
                Some("recover") => Some(LearningGoal::Recover),
                Some(_) => return Err("goal must be understand, remember, solve, olympiad, teach, or recover".to_string()),
            };
            let percent = match request.get("percent") {
                None | Some(Value::Null) => None,
                Some(value) => Some(value.as_f64().filter(|v| v.is_finite())
                    .ok_or("percent must be a finite number or null")?),
            };
            let energy = request.get("energy").and_then(Value::as_u64)
                .and_then(|v| u8::try_from(v).ok()).ok_or("energy must be an integer from 1 to 3")?;
            let confidence = request.get("confidence").and_then(Value::as_u64)
                .and_then(|v| u8::try_from(v).ok()).ok_or("confidence must be an integer from 1 to 5")?;
            let error_count = request.get("errorCount").and_then(Value::as_u64)
                .and_then(|v| u32::try_from(v).ok()).ok_or("errorCount must be a non-negative 32-bit integer")?;
            let phase = request.get("phase").and_then(Value::as_str).unwrap_or("");
            let topic = request.get("topic").and_then(Value::as_str).unwrap_or("");
            if phase.len() > 120 || topic.len() > 120 {
                return Err("phase and topic must be at most 120 bytes".to_string());
            }
            let plan = principia_core::study_engine::build_plan(&LearnerContext {
                goal, percent, error_count, phase: phase.to_string(),
                energy, confidence, topic: topic.to_string(),
            }).map_err(|error| format!("Study context rejected: {error:?}"))?;
            return Ok(json!({
                "goal": format!("{:?}", plan.goal).to_lowercase(),
                "difficulty": plan.difficulty,
                "focusMinutes": plan.focus_minutes,
                "topic": plan.topic,
                "steps": plan.steps,
                "nextAction": plan.next_action
            }));
        }
        if op == "scheduleReview" {
            let quality = request.get("quality").and_then(Value::as_u64)
                .and_then(|v| u8::try_from(v).ok()).ok_or("quality must be an integer from 0 to 5")?;
            let interval = request.get("previousIntervalDays").and_then(Value::as_u64)
                .and_then(|v| u32::try_from(v).ok()).ok_or("previousIntervalDays must be a non-negative 32-bit integer")?;
            let ease = number(request, "easeFactor")?;
            let schedule = principia_core::study_engine::next_review(quality, interval, ease)
                .map_err(|error| format!("Review schedule rejected: {error:?}"))?;
            return Ok(json!({
                "intervalDays": schedule.interval_days,
                "dueAfterDays": schedule.due_after_days,
                "easeFactor": schedule.ease_factor,
                "mastered": schedule.mastered
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
    fn dispatches_adaptive_study_plan() {
        let response = dispatch(&json!({
            "id": 21, "op": "studyPlan", "percent": 35.0,
            "errorCount": 4, "phase": "practice", "energy": 2,
            "confidence": 3, "topic": "Cơ học"
        }));
        assert_eq!(response["ok"], true);
        assert_eq!(response["value"]["goal"], "recover");
        assert_eq!(response["value"]["nextAction"], "retry_error");
        assert_eq!(response["value"]["focusMinutes"], 20);
    }

    #[test]
    fn dispatches_spaced_review_schedule() {
        let response = dispatch(&json!({
            "id": 22, "op": "scheduleReview", "quality": 1,
            "previousIntervalDays": 12, "easeFactor": 2.5
        }));
        assert_eq!(response["ok"], true);
        assert_eq!(response["value"]["dueAfterDays"], 1);
        assert_eq!(response["value"]["mastered"], false);
    }

    #[test]
    fn rejects_invalid_study_plan_energy() {
        let response = dispatch(&json!({
            "op": "studyPlan", "energy": 0, "confidence": 3,
            "errorCount": 0, "percent": 80.0
        }));
        assert_eq!(response["ok"], false);
        assert!(response["error"].as_str().unwrap().contains("Study context rejected"));
    }

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
    fn dispatches_linear_regression() {
        let response = dispatch(&json!({"id":14,"op":"linearRegression","points":[[0.0,1.0],[1.0,3.0],[2.0,5.0]]}));
        assert_eq!(response["ok"], true);
        assert!((response["value"]["slope"].as_f64().unwrap()-2.0).abs()<1e-12);
        assert!((response["value"]["intercept"].as_f64().unwrap()-1.0).abs()<1e-12);
    }
    #[test]
    fn rejects_regression_with_constant_x() {
        let response = dispatch(&json!({"id":15,"op":"linearRegression","points":[[2.0,1.0],[2.0,4.0]]}));
        assert_eq!(response["ok"], false);
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
    fn dispatches_rust_ui_snapshot_for_mobile() {
        let response = dispatch(&json!({"id":21,"op":"uiSnapshot","route":"learn","width":390,"searchOpen":true,"searchQuery":"momentum"}));
        assert_eq!(response["ok"], true);
        let snapshot: Value = serde_json::from_str(response["value"].as_str().unwrap()).unwrap();
        assert_eq!(snapshot["route"], "learn");
        assert_eq!(snapshot["layout"], "compact");
        assert_eq!(snapshot["sidebarOpen"], false);
        assert_eq!(snapshot["searchQuery"], "momentum");
    }
    #[test]
    fn ui_snapshot_rejects_invalid_route() {
        let response = dispatch(&json!({"id":22,"op":"uiSnapshot","route":"not-a-route","width":900}));
        assert_eq!(response["ok"], false);
    }
    #[test]
    fn rejects_unsupported_operations() {
        let response = dispatch(&json!({"id":8,"op":"deleteEverything"}));
        assert_eq!(response["ok"], false);
        assert!(response["error"].as_str().unwrap().contains("Unsupported operation"));
    }

    #[test]
    fn dispatches_weighted_quiz_grading() {
        let response = dispatch(&json!({
            "id": 31, "op": "gradeQuiz", "passPercent": 75.0,
            "questions": [
                {"id":"q1","selectedIndex":1,"correctIndex":1,"optionCount":4,"points":2.0},
                {"id":"q2","selectedIndex":0,"correctIndex":2,"optionCount":4,"points":1.0},
                {"id":"q3","selectedIndex":3,"correctIndex":3,"optionCount":4,"points":1.0}
            ]
        }));
        assert_eq!(response["ok"], true);
        assert_eq!(response["value"]["score"], 3.0);
        assert_eq!(response["value"]["maxScore"], 4.0);
        assert_eq!(response["value"]["passed"], true);
        assert_eq!(response["value"]["correctCount"], 2);
    }

    #[test]
    fn rejects_quiz_with_duplicate_question_ids() {
        let response = dispatch(&json!({
            "op": "gradeQuiz", "passPercent": 60.0,
            "questions": [
                {"id":"q1","selectedIndex":0,"correctIndex":0,"points":1.0},
                {"id":"q1","selectedIndex":1,"correctIndex":1,"points":1.0}
            ]
        }));
        assert_eq!(response["ok"], false);
    }

    #[test]
    fn rejects_invalid_physics_domain() {
        let response = dispatch(&json!({"id":9,"op":"kineticEnergy","massKg":-1.0,"speedMps":3.0}));
        assert_eq!(response["ok"], false);
    }
}
