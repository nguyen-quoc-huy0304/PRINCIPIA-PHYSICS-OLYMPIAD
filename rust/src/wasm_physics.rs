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
pub fn physics_robot_forward_json(
    l1: f64,
    l2: f64,
    shoulder_rad: f64,
    elbow_rad: f64,
) -> Result<String, JsValue> {
    let endpoint = crate::robotics::forward_kinematics(l1, l2, shoulder_rad, elbow_rad)
        .map_err(|error| JsValue::from_str(&format!("Robot forward kinematics failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "x": endpoint[0],
        "y": endpoint[1]
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



#[wasm_bindgen]
pub fn physics_pendulum_json(
    length_m: f64,
    gravity_mps2: f64,
    amplitude_degrees: f64,
) -> Result<String, JsValue> {
    let result = crate::pendulum::calculate(length_m, gravity_mps2, amplitude_degrees)
        .map_err(|error| input_error(&format!("Pendulum calculation failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "angularFrequencyRadS": result.angular_frequency_rad_s,
        "periodSeconds": result.period_seconds,
        "frequencyHz": result.frequency_hz,
        "maxSpeedMps": result.max_speed_mps,
        "maxAccelerationMps2": result.max_acceleration_mps2,
        "approximation": "small-angle"
    })).map_err(|error| input_error(&error.to_string()))
}


#[wasm_bindgen]
pub fn physics_collision_1d_json(
    mass_a: f64,
    velocity_a: f64,
    mass_b: f64,
    velocity_b: f64,
    restitution: f64,
) -> Result<String, JsValue> {
    let result = crate::collision::collide_1d(mass_a, velocity_a, mass_b, velocity_b, restitution)
        .map_err(|error| input_error(&format!("Collision calculation failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "v1": result.velocity_a,
        "v2": result.velocity_b,
        "momentumBefore": result.momentum_before,
        "momentumAfter": result.momentum_after,
        "momentumError": result.momentum_error,
        "kineticBefore": result.kinetic_before,
        "kineticAfter": result.kinetic_after,
        "kineticChange": result.kinetic_change,
        "energyLoss": result.energy_loss,
        "totalMass": result.total_mass
    })).map_err(|error| input_error(&error.to_string()))
}


fn parse_collision_disk(input: &str) -> Result<crate::collision::Disk, JsValue> {
    if input.len() > 4096 { return Err(input_error("Disk input exceeds 4 KiB")); }
    let value: serde_json::Value = serde_json::from_str(input)
        .map_err(|_| input_error("Disk input must be valid JSON"))?;
    let number = |key: &str| value.get(key).and_then(serde_json::Value::as_f64)
        .ok_or_else(|| input_error("Disk input contains a missing or invalid numeric field"));
    Ok(crate::collision::Disk {
        x: number("x")?,
        y: number("y")?,
        vx: number("vx")?,
        vy: number("vy")?,
        mass: number("mass")?,
        radius: number("radius")?,
    })
}

#[wasm_bindgen]
pub fn physics_disk_collision_json(
    body_a_json: &str,
    body_b_json: &str,
    restitution: f64,
) -> Result<String, JsValue> {
    let body_a = parse_collision_disk(body_a_json)?;
    let body_b = parse_collision_disk(body_b_json)?;
    let result = crate::collision::resolve_disks(body_a, body_b, restitution)
        .map_err(|error| input_error(&format!("Disk collision failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "collided": result.collided,
        "impulse": result.impulse,
        "a": { "x": result.a.x, "y": result.a.y, "vx": result.a.vx, "vy": result.a.vy },
        "b": { "x": result.b.x, "y": result.b.y, "vx": result.b.vx, "vy": result.b.vy }
    })).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn force_balance_target_json(
    force_a_x: f64,
    force_a_y: f64,
    force_b_x: f64,
    force_b_y: f64,
) -> Result<String, JsValue> {
    let target = crate::force_balance::balance_target(
        [force_a_x, force_a_y], [force_b_x, force_b_y]
    ).map_err(|error| input_error(&format!("Force balance target failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "x": target[0],
        "y": target[1]
    })).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn force_balance_score_json(
    candidate_x: f64,
    candidate_y: f64,
    target_x: f64,
    target_y: f64,
) -> Result<String, JsValue> {
    let score = crate::force_balance::score_candidate(
        [candidate_x, candidate_y], [target_x, target_y], 8.0
    ).map_err(|error| input_error(&format!("Force balance scoring failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "error": score.error_n,
        "points": score.points
    })).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn robot_assembly_evaluate_json(
    base: &str, joint: &str, link1: &str, link2: &str, tool: &str,
    link1_mm: f64, link2_mm: f64, shoulder_deg: f64, elbow_deg: f64,
    target_x_mm: f64, target_y_mm: f64,
) -> Result<String, JsValue> {
    let result = crate::robot_assembly::evaluate(
        base, joint, link1, link2, tool, link1_mm, link2_mm,
        shoulder_deg, elbow_deg, target_x_mm, target_y_mm
    ).map_err(|error| input_error(&format!("Robot assembly evaluation failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "correct": result.correct, "total": result.total, "ready": result.ready,
        "x": result.x_mm, "y": result.y_mm, "error": result.error_mm, "earned": result.earned
    })).map_err(|error| input_error(&error.to_string()))
}

fn input_error(message: &str) -> JsValue { JsValue::from_str(message) }

#[wasm_bindgen]
pub fn assessment_grade_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 256 * 1024 { return Err(input_error("Quiz payload exceeds 256 KiB")); }
    use crate::assessment::{Answer, Question, Quiz};
    let value: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Quiz payload must be valid JSON"))?;
    let object = value.as_object().ok_or_else(|| input_error("Quiz payload must be an object"))?;
    if object.get("id").and_then(serde_json::Value::as_str).is_some_and(|text| text.len() > 120)
        || object.get("title").and_then(serde_json::Value::as_str).is_some_and(|text| text.len() > 240) {
        return Err(input_error("Quiz metadata exceeds supported length"));
    }
    let questions_value = object.get("questions").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Quiz questions are required"))?;
    if questions_value.is_empty() || questions_value.len() > 200 {
        return Err(input_error("Quiz must contain 1 to 200 questions"));
    }
    let mut questions = Vec::with_capacity(questions_value.len());
    for (index, item) in questions_value.iter().enumerate() {
        let prompt = item.get("prompt").and_then(serde_json::Value::as_str)
            .filter(|text| !text.trim().is_empty() && text.len() <= 4000)
            .ok_or_else(|| input_error("Invalid question prompt"))?;
        let options_value = item.get("options").and_then(serde_json::Value::as_array)
            .filter(|options| (2..=12).contains(&options.len()))
            .ok_or_else(|| input_error("Each question needs 2 to 12 options"))?;
        let mut options = Vec::with_capacity(options_value.len());
        for option in options_value {
            let text = option.as_str().filter(|text| !text.trim().is_empty() && text.len() <= 1000)
                .ok_or_else(|| input_error("Invalid answer option"))?;
            options.push(text.to_owned());
        }
        let correct_index = item.get("correctIndex").and_then(serde_json::Value::as_u64)
            .and_then(|value| usize::try_from(value).ok())
            .ok_or_else(|| input_error("Invalid correct option index"))?;
        let points = item.get("points").and_then(serde_json::Value::as_u64)
            .unwrap_or(1).try_into().map_err(|_| input_error("Invalid question points"))?;
        if points == 0 || points > 1000 { return Err(input_error("Question points must be between 1 and 1000")); }
        let explanation = item.get("explanation").and_then(serde_json::Value::as_str)
            .map(str::to_owned);
        questions.push(Question { prompt: prompt.to_owned(), options, correct_index, explanation, points });
        if index >= 200 { return Err(input_error("Too many questions")); }
    }
    let answers_value = object.get("answers").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Quiz answers are required"))?;
    if answers_value.len() > questions.len() { return Err(input_error("Too many answers")); }
    let mut answers = Vec::with_capacity(answers_value.len());
    for item in answers_value {
        let question_index = item.get("questionIndex").and_then(serde_json::Value::as_u64)
            .and_then(|value| usize::try_from(value).ok())
            .ok_or_else(|| input_error("Invalid answer question index"))?;
        let selected_option = match item.get("selectedOption") {
            None | Some(serde_json::Value::Null) => None,
            Some(value) => Some(value.as_u64().and_then(|v| usize::try_from(v).ok())
                .ok_or_else(|| input_error("Invalid selected option"))?),
        };
        answers.push(Answer { question_index, selected_option });
    }
    let quiz = Quiz {
        id: object.get("id").and_then(serde_json::Value::as_str).unwrap_or("browser-quiz").to_owned(),
        title: object.get("title").and_then(serde_json::Value::as_str).unwrap_or("Quiz").to_owned(),
        questions,
        pass_percent: object.get("passPercent").and_then(serde_json::Value::as_u64)
            .unwrap_or(60).try_into().map_err(|_| input_error("Invalid pass percentage"))?,
        time_limit_seconds: None,
    };
    let grade = quiz.grade(&answers).map_err(|error| input_error(&format!("Quiz grading failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "earnedPoints": grade.earned_points,
        "totalPoints": grade.total_points,
        "percent": grade.percent,
        "correctCount": grade.correct_count,
        "unansweredCount": grade.unanswered_count,
        "passed": grade.passed,
        "details": grade.details.iter().map(|item| serde_json::json!({
            "questionIndex": item.question_index,
            "selectedOption": item.selected_option,
            "correctOption": item.correct_option,
            "isCorrect": item.is_correct,
            "explanation": item.explanation
        })).collect::<Vec<_>>()
    })).map_err(|error| input_error(&error.to_string()))
}

/// Record a study day without awarding XP or incrementing lesson counters.
#[wasm_bindgen]
pub fn progress_day_json(progress_json: &str, day: &str) -> Result<String, JsValue> {
    if progress_json.len() > 16 * 1024 { return Err(input_error("Progress payload exceeds 16 KiB")); }
    use crate::progress::Progress;
    if day.len() != 10 { return Err(input_error("Activity day must use YYYY-MM-DD")); }
    let value: serde_json::Value = serde_json::from_str(progress_json)
        .map_err(|_| input_error("Progress payload must be valid JSON"))?;
    let mut progress = Progress {
        experience: value.get("experience").and_then(serde_json::Value::as_u64).unwrap_or(0),
        completed_lessons: value.get("completedLessons").and_then(serde_json::Value::as_u64).unwrap_or(0),
        study_streak_days: value.get("studyStreakDays").and_then(serde_json::Value::as_u64)
            .unwrap_or(0).min(u32::MAX as u64) as u32,
        last_activity_day: value.get("lastActivityDay").and_then(serde_json::Value::as_str).map(str::to_owned),
    };
    progress.record_day(day).map_err(input_error)?;
    serde_json::to_string(&serde_json::json!({
        "experience": progress.experience,
        "completedLessons": progress.completed_lessons,
        "studyStreakDays": progress.study_streak_days,
        "lastActivityDay": progress.last_activity_day,
        "level": progress.level(),
        "experienceIntoLevel": progress.experience_into_level()
    })).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn progress_record_json(progress_json: &str, activity: &str, day: &str) -> Result<String, JsValue> {
    if progress_json.len() > 16 * 1024 { return Err(input_error("Progress payload exceeds 16 KiB")); }
    use crate::progress::{Activity, Progress};
    if day.len() != 10 { return Err(input_error("Activity day must use YYYY-MM-DD")); }
    let value: serde_json::Value = serde_json::from_str(progress_json)
        .map_err(|_| input_error("Progress payload must be valid JSON"))?;
    let mut progress = Progress {
        experience: value.get("experience").and_then(serde_json::Value::as_u64).unwrap_or(0),
        completed_lessons: value.get("completedLessons").and_then(serde_json::Value::as_u64).unwrap_or(0),
        study_streak_days: value.get("studyStreakDays").and_then(serde_json::Value::as_u64)
            .unwrap_or(0).min(u32::MAX as u64) as u32,
        last_activity_day: value.get("lastActivityDay").and_then(serde_json::Value::as_str).map(str::to_owned),
    };
    let activity = match activity {
        "lesson" => Activity::LessonCompleted,
        "quiz" => Activity::QuizSubmitted,
        "assignment" => Activity::AssignmentSubmitted,
        "experiment" => Activity::ExperimentCompleted,
        _ => return Err(input_error("Unsupported progress activity")),
    };
    progress.record(activity, day).map_err(input_error)?;
    serde_json::to_string(&serde_json::json!({
        "experience": progress.experience,
        "completedLessons": progress.completed_lessons,
        "studyStreakDays": progress.study_streak_days,
        "lastActivityDay": progress.last_activity_day,
        "level": progress.level(),
        "experienceIntoLevel": progress.experience_into_level()
    })).map_err(|error| input_error(&error.to_string()))
}


#[wasm_bindgen]
pub fn learning_recommend_json(context_json: &str) -> Result<String, JsValue> {
    if context_json.len() > 4096 { return Err(input_error("Learning context exceeds 4 KiB")); }
    use crate::learning::{recommend, LearningGoal, LearnerContext};
    let value: serde_json::Value = serde_json::from_str(context_json)
        .map_err(|_| input_error("Learning context must be valid JSON"))?;
    let goal = match value.get("goal").and_then(serde_json::Value::as_str) {
        None | Some("") | Some("auto") => None,
        Some("understand") => Some(LearningGoal::Understand),
        Some("remember") => Some(LearningGoal::Remember),
        Some("solve") => Some(LearningGoal::Solve),
        Some("olympiad") => Some(LearningGoal::Olympiad),
        Some("teach") => Some(LearningGoal::Teach),
        Some("recover") => Some(LearningGoal::Recover),
        _ => return Err(input_error("Unsupported learning goal")),
    };
    let percent = value.get("percent").and_then(serde_json::Value::as_f64);
    let context = LearnerContext {
        goal,
        percent,
        error_count: value.get("errorCount").and_then(serde_json::Value::as_u64)
            .unwrap_or(0).min(u32::MAX as u64) as u32,
        phase: value.get("phase").and_then(serde_json::Value::as_str)
            .unwrap_or("").chars().take(100).collect(),
        energy: value.get("energy").and_then(serde_json::Value::as_u64)
            .unwrap_or(2).min(u8::MAX as u64) as u8,
        confidence: value.get("confidence").and_then(serde_json::Value::as_u64)
            .unwrap_or(3).min(u8::MAX as u64) as u8,
        topic: value.get("topic").and_then(serde_json::Value::as_str)
            .unwrap_or("").chars().take(120).collect(),
    };
    let plan = recommend(&context)
        .map_err(|error| input_error(&format!("Learning recommendation failed: {error:?}")))?;
    let goal = match plan.goal {
        LearningGoal::Understand => "understand",
        LearningGoal::Remember => "remember",
        LearningGoal::Solve => "solve",
        LearningGoal::Olympiad => "olympiad",
        LearningGoal::Teach => "teach",
        LearningGoal::Recover => "recover",
    };
    serde_json::to_string(&serde_json::json!({
        "goal": goal,
        "difficulty": plan.difficulty,
        "focusMinutes": plan.focus_minutes,
        "topic": plan.topic,
        "steps": plan.steps,
        "nextAction": plan.next_action,
        "title": plan.title,
        "description": plan.description
    })).map_err(|error| input_error(&error.to_string()))
}


#[wasm_bindgen]
pub fn learning_orchestrate_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 65_536 { return Err(input_error("Learning orchestration input exceeds 64 KiB")); }
    use crate::learning::{recommend, select_method, LearningGoal, LearnerContext};
    let value: serde_json::Value = serde_json::from_str(input_json).map_err(|_| input_error("Learning orchestration input must be valid JSON"))?;
    let input = value.get("context").ok_or_else(|| input_error("Missing learning context"))?;
    let goal = match input.get("goal").and_then(serde_json::Value::as_str) {
        None | Some("") | Some("auto") => None,
        Some("understand") => Some(LearningGoal::Understand), Some("remember") => Some(LearningGoal::Remember),
        Some("solve") => Some(LearningGoal::Solve), Some("olympiad") => Some(LearningGoal::Olympiad),
        Some("teach") => Some(LearningGoal::Teach), Some("recover") => Some(LearningGoal::Recover),
        _ => return Err(input_error("Unsupported learning goal")),
    };
    let context = LearnerContext {
        goal, percent: input.get("percent").and_then(serde_json::Value::as_f64),
        error_count: input.get("errorCount").and_then(serde_json::Value::as_u64).unwrap_or(0).min(u32::MAX as u64) as u32,
        phase: input.get("phase").and_then(serde_json::Value::as_str).unwrap_or("").chars().take(100).collect(),
        energy: input.get("energy").and_then(serde_json::Value::as_u64).unwrap_or(2).min(u8::MAX as u64) as u8,
        confidence: input.get("confidence").and_then(serde_json::Value::as_u64).unwrap_or(3).min(u8::MAX as u64) as u8,
        topic: input.get("topic").and_then(serde_json::Value::as_str).unwrap_or("").chars().take(120).collect(),
    };
    let plan = recommend(&context).map_err(|error| input_error(&format!("Learning recommendation failed: {error:?}")))?;
    let catalog = value.get("catalog").and_then(serde_json::Value::as_array).ok_or_else(|| input_error("Learning catalog must be an array"))?;
    if catalog.len() > 500 { return Err(input_error("Learning catalog exceeds 500 methods")); }
    let recent: Vec<String> = value.get("recentIds").and_then(serde_json::Value::as_array).into_iter().flatten()
        .filter_map(serde_json::Value::as_str).take(12).map(|id| id.chars().take(80).collect()).collect();
    let sessions = value.get("sessions").and_then(serde_json::Value::as_u64).unwrap_or(0);
    let selected = select_method(&plan.topic, plan.goal, catalog, &recent, sessions);
    let goal_name = match plan.goal {
        LearningGoal::Understand => "understand", LearningGoal::Remember => "remember",
        LearningGoal::Solve => "solve", LearningGoal::Olympiad => "olympiad",
        LearningGoal::Teach => "teach", LearningGoal::Recover => "recover",
    };
    let steps: Vec<String> = selected.as_ref().filter(|item| !item.steps.is_empty())
        .map(|item| item.steps.clone()).unwrap_or_else(|| plan.steps.iter().map(|step| step.to_string()).collect());
    let method_id = selected.map(|item| item.method_id);
    serde_json::to_string(&serde_json::json!({
        "goal": goal_name, "difficulty": plan.difficulty, "focusMinutes": plan.focus_minutes,
        "topic": plan.topic, "steps": steps, "nextAction": plan.next_action,
        "title": plan.title, "description": plan.description, "methodId": method_id
    })).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn learning_review_schedule_json(quality: u32, previous_interval_days: u32, ease_factor: f64) -> Result<String, JsValue> {
    let quality = u8::try_from(quality).map_err(|_| input_error("Review quality must be an integer from 0 to 5"))?;
    let schedule = crate::learning::schedule_review(quality, previous_interval_days, ease_factor)
        .map_err(|error| input_error(&format!("Review schedule failed: {error:?}")))?;
    serde_json::to_string(&serde_json::json!({
        "intervalDays": schedule.interval_days,
        "dueAfterDays": schedule.due_after_days,
        "easeFactor": schedule.ease_factor,
        "mastered": schedule.mastered
    })).map_err(|error| input_error(&error.to_string()))
}


#[wasm_bindgen]
pub fn progression_summary_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Progression input exceeds 4 KiB")); }
    use crate::progression::{achievements, level_progress, rank_progress, AchievementInput};
    let value: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Progression input must be valid JSON"))?;
    let xp = value.get("xp").and_then(serde_json::Value::as_u64).unwrap_or(0);
    let metric = |key: &str| value.get(key).and_then(serde_json::Value::as_u64).unwrap_or(0);
    let input = AchievementInput {
        sessions: metric("sessions"),
        questions: metric("questions"),
        best_percent: metric("bestPercent").min(100) as u8,
        lessons: metric("lessons"),
        streak: metric("streak").min(u32::MAX as u64) as u32,
        experiments: metric("experiments"),
        levels_created: metric("levelsCreated"),
    };
    let level = level_progress(xp);
    let rank = rank_progress(xp);
    let achievements = achievements(input);
    serde_json::to_string(&serde_json::json!({
        "level": {
            "level": level.level, "title": level.title, "xp": level.xp,
            "currentThreshold": level.current_threshold, "nextThreshold": level.next_threshold,
            "progress": level.progress_percent, "xpToNext": level.xp_to_next
        },
        "rank": {
            "id": rank.id, "name": rank.name, "xp": rank.xp, "division": rank.division,
            "nextName": rank.next_name, "xpToNext": rank.xp_to_next,
            "progress": rank.progress_percent
        },
        "achievements": achievements.iter().map(|item| serde_json::json!({
            "id": item.id, "name": item.name, "unlocked": item.unlocked,
            "value": item.value, "target": item.target
        })).collect::<Vec<_>>()
    })).map_err(|error| input_error(&error.to_string()))
}


/// Return the canonical XP reward for a validated learning activity.
#[wasm_bindgen]
pub fn experience_reward(activity: &str) -> Result<u32, JsValue> {
    crate::experience_rewards::experience_reward(activity)
        .map_err(|error| input_error(&format!("Experience reward rejected: {error:?}")))
}

/// Calculate course completion metrics with Rust-owned rounding and bounds.
#[wasm_bindgen]
pub fn course_completion_json(completed: u32, total: u32) -> Result<String, JsValue> {
    let result = crate::progression::course_completion(u64::from(completed), u64::from(total))
        .map_err(input_error)?;
    serde_json::to_string(&serde_json::json!({
        "completed": result.completed,
        "total": result.total,
        "percent": result.percent
    })).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn learning_science_select_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 65_536 { return Err(input_error("Learning science input exceeds 64 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Learning science input must be valid JSON"))?;
    let selected = crate::learning_science::select(&input)
        .map_err(|error| input_error(&format!("Learning science selection failed: {error}")))?;
    serde_json::to_string(&selected).map_err(|error| input_error(&error.to_string()))
}

/// Calculate study streaks and normalize activity dates in Rust.
#[wasm_bindgen]
pub fn activity_calendar_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 256 * 1024 { return Err(input_error("Activity calendar payload exceeds 256 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Activity calendar payload must be valid JSON"))?;
    let today = input.get("today").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Activity calendar requires today"))?;
    let record_today = input.get("recordToday").and_then(serde_json::Value::as_bool).unwrap_or(false);
    let days = input.get("days").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Activity calendar requires a days array"))?;
    if days.len() > 10_000 { return Err(input_error("Activity calendar has too many dates")); }
    let parsed = days.iter().map(|day| day.as_str()
        .map(str::to_owned).ok_or_else(|| input_error("Activity dates must be strings")))
        .collect::<Result<Vec<_>, _>>()?;
    let result = crate::activity_calendar::activity_summary(&parsed, today, record_today)
        .map_err(|error| input_error(&format!("Activity calendar rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Calculate Gameverse season pass level and progress in Rust.
#[wasm_bindgen]
pub fn gameverse_season_progress_json(season_xp: u32) -> Result<String, JsValue> {
    serde_json::to_string(&crate::gameverse::season_progress(u64::from(season_xp)))
        .map_err(|error| input_error(&error.to_string()))
}

/// Validate a Gameverse card pack purchase and select an unowned card in Rust.
#[wasm_bindgen]
pub fn gameverse_card_pack_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Gameverse card pack payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse card pack payload must be valid JSON"))?;
    let coins = input.get("coins").and_then(serde_json::Value::as_u64)
        .ok_or_else(|| input_error("Invalid Gameverse coin balance"))?;
    let roll = input.get("roll").and_then(serde_json::Value::as_f64)
        .ok_or_else(|| input_error("Invalid Gameverse card selection roll"))?;
    let collection = input.get("collection").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Gameverse collection must be an array"))?
        .iter().map(|value| value.as_str().map(str::to_owned)
            .ok_or_else(|| input_error("Invalid collection card identifier")))
        .collect::<Result<Vec<_>, _>>()?;
    let result = crate::gameverse::open_card_pack(coins, &collection, roll)
        .map_err(|error| input_error(&format!("Gameverse card pack rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Validate and randomly select Gameverse quiz questions in Rust.
#[wasm_bindgen]
pub fn gameverse_quiz_select_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 256 * 1024 { return Err(input_error("Gameverse quiz catalog exceeds 256 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse quiz payload must be valid JSON"))?;
    let mode = input.get("mode").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing Gameverse quiz mode"))?;
    let seed = input.get("seed").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing Gameverse quiz seed"))?
        .parse::<u64>().map_err(|_| input_error("Invalid Gameverse quiz seed"))?;
    let questions = input.get("questions").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Gameverse quiz questions must be an array"))?;
    let result = crate::gameverse::select_quiz_questions(questions, mode, seed)
        .map_err(|error| input_error(&format!("Gameverse quiz selection rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Select a Gameverse treasure riddle using a validated random sample.
#[wasm_bindgen]
pub fn gameverse_treasure_question_json(roll: f64) -> Result<String, JsValue> {
    let result = crate::gameverse::treasure_question(roll)
        .map_err(|error| input_error(&format!("Gameverse treasure question rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Validate a Gameverse treasure answer and return its Rust-owned reward.
#[wasm_bindgen]
pub fn gameverse_treasure_answer_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Gameverse treasure payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse treasure payload must be valid JSON"))?;
    let id = input.get("id").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing treasure riddle identifier"))?;
    let answer = input.get("answer").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing treasure answer"))?;
    let already_found = input.get("alreadyFound").and_then(serde_json::Value::as_bool)
        .ok_or_else(|| input_error("Missing treasure claim state"))?;
    let result = crate::gameverse::resolve_treasure(id, answer, already_found)
        .map_err(|error| input_error(&format!("Gameverse treasure answer rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Select a daily Gameverse event and its reward in Rust.
#[wasm_bindgen]
pub fn gameverse_random_event_json(roll: f64, already_triggered: bool) -> Result<String, JsValue> {
    let result = crate::gameverse::random_event(roll, already_triggered)
        .map_err(|error| input_error(&format!("Gameverse random event rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Complete a Gameverse daily quest and select its material reward in Rust.
#[wasm_bindgen]
pub fn gameverse_daily_quest_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Gameverse daily quest payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse daily quest payload must be valid JSON"))?;
    let id = input.get("id").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing daily quest identifier"))?;
    let roll = input.get("materialRoll").and_then(serde_json::Value::as_f64)
        .ok_or_else(|| input_error("Invalid daily quest material roll"))?;
    let done = input.get("done").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Completed daily quests must be an array"))?
        .iter().map(|value| value.as_str().map(str::to_owned)
            .ok_or_else(|| input_error("Invalid completed quest identifier")))
        .collect::<Result<Vec<_>, _>>()?;
    let result = crate::gameverse::complete_daily_quest(id, &done, roll)
        .map_err(|error| input_error(&format!("Gameverse daily quest rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Validate and apply Gameverse zone unlock transactions in Rust.
#[wasm_bindgen]
pub fn gameverse_unlock_zone_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Gameverse unlock payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse unlock payload must be valid JSON"))?;
    let id = input.get("id").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing zone identifier"))?;
    let coins = input.get("coins").and_then(serde_json::Value::as_u64)
        .ok_or_else(|| input_error("Invalid coin balance"))?;
    let unlocked = input.get("unlocked").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Unlocked zones must be an array"))?
        .iter().map(|value| value.as_str().map(str::to_owned)
            .ok_or_else(|| input_error("Invalid unlocked zone identifier")))
        .collect::<Result<Vec<_>, _>>()?;
    let result = crate::gameverse::unlock_zone(id, coins, &unlocked)
        .map_err(|error| input_error(&format!("Gameverse zone unlock rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Validate and apply Gameverse season pass claims in Rust.
#[wasm_bindgen]
pub fn gameverse_claim_pass_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Gameverse pass payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse pass payload must be valid JSON"))?;
    let tier = input.get("tier").and_then(serde_json::Value::as_u64)
        .and_then(|value| u32::try_from(value).ok()).ok_or_else(|| input_error("Invalid pass tier"))?;
    let season_xp = input.get("seasonXp").and_then(serde_json::Value::as_u64)
        .ok_or_else(|| input_error("Invalid season XP"))?;
    let claimed = input.get("claimed").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Claimed pass tiers must be an array"))?
        .iter().map(|value| value.as_str().map(str::to_owned)
            .ok_or_else(|| input_error("Invalid claimed tier identifier")))
        .collect::<Result<Vec<_>, _>>()?;
    let result = crate::gameverse::claim_pass(tier, season_xp, &claimed)
        .map_err(|error| input_error(&format!("Gameverse pass claim rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Validate and apply Gameverse skill purchases in Rust.
#[wasm_bindgen]
pub fn gameverse_buy_skill_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Gameverse skill payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse skill payload must be valid JSON"))?;
    let id = input.get("id").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing skill identifier"))?;
    let coins = input.get("coins").and_then(serde_json::Value::as_u64)
        .ok_or_else(|| input_error("Invalid coin balance"))?;
    let skills = input.get("skills").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Owned skills must be an array"))?
        .iter().map(|value| value.as_str().map(str::to_owned)
            .ok_or_else(|| input_error("Invalid owned skill identifier")))
        .collect::<Result<Vec<_>, _>>()?;
    let result = crate::gameverse::buy_skill(id, coins, &skills)
        .map_err(|error| input_error(&format!("Gameverse skill purchase rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Calculate Gameverse pet XP remainder, level, and form in Rust.
#[wasm_bindgen]
pub fn gameverse_pet_progress_json(pet_xp: u32, pet_level: u32) -> Result<String, JsValue> {
    let result = crate::gameverse::pet_progress(pet_xp, pet_level)
        .map_err(|error| input_error(&format!("Gameverse pet progression rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Apply a Gameverse recipe and validate its inventory transaction in Rust.
#[wasm_bindgen]
pub fn gameverse_craft_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 16 * 1024 { return Err(input_error("Gameverse craft payload exceeds 16 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse craft payload must be valid JSON"))?;
    let recipe_id = input.get("recipeId").and_then(serde_json::Value::as_str)
        .filter(|id| id.len() <= 64).ok_or_else(|| input_error("Invalid recipe identifier"))?;
    let materials_value = input.get("materials").and_then(serde_json::Value::as_object)
        .ok_or_else(|| input_error("Craft materials must be an object"))?;
    let mut materials = std::collections::BTreeMap::new();
    for (key, value) in materials_value {
        let amount = u32::try_from(value.as_u64().ok_or_else(|| input_error("Invalid material amount"))?)
            .map_err(|_| input_error("Material amount is out of range"))?;
        materials.insert(key.clone(), amount);
    }
    let crafted_value = input.get("crafted").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Crafted item list is required"))?;
    if crafted_value.len() > 100 { return Err(input_error("Crafted item list is too large")); }
    let crafted = crafted_value.iter().map(|item| item.as_str()
        .filter(|id| id.len() <= 64)
        .map(str::to_owned).ok_or_else(|| input_error("Invalid crafted item identifier")))
        .collect::<Result<Vec<_>, _>>()?;
    let result = crate::gameverse::craft(recipe_id, &materials, &crafted)
        .map_err(|error| input_error(&format!("Gameverse craft rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Resolve Gameverse quiz rewards and ranked rating changes in Rust.
#[wasm_bindgen]
pub fn gameverse_quiz_reward_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Gameverse reward payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Gameverse reward payload must be valid JSON"))?;
    let number = |key: &str| input.get(key).and_then(serde_json::Value::as_u64)
        .ok_or_else(|| input_error(&format!("Missing or invalid {key}")));
    let correct = u32::try_from(number("correct")?)
        .map_err(|_| input_error("Correct answer count is out of range"))?;
    let total = u32::try_from(number("total")?)
        .map_err(|_| input_error("Question count is out of range"))?;
    let mode = input.get("mode").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing Gameverse mode"))?;
    let result = crate::gameverse::quiz_reward(correct, total, mode, number("rating")?)
        .map_err(|error| input_error(&format!("Gameverse reward rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Resolve deterministic AI league operations in the Rust core.
#[wasm_bindgen]
pub fn game_league_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Game league payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Game league payload must be valid JSON"))?;
    let operation = input.get("operation").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing game league operation"))?;
    let week = input.get("week").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing game league week"))?;
    let result = match operation {
        "bots" => crate::game_league::bots(week),
        "match" => {
            let number = |key: &str| input.get(key).and_then(serde_json::Value::as_u64)
                .ok_or_else(|| input_error(&format!("Missing or invalid {key}")));
            let random = |key: &str| input.get(key).and_then(serde_json::Value::as_f64)
                .ok_or_else(|| input_error(&format!("Missing or invalid {key}")));
            let points = number("points")?;
            let matches = u32::try_from(number("matches")?)
                .map_err(|_| input_error("Match count is outside supported bounds"))?;
            let wins = u32::try_from(number("wins")?)
                .map_err(|_| input_error("Win count is outside supported bounds"))?;
            crate::game_league::resolve_match(points, matches, wins, random("opponentRoll")?, random("resultRoll")?, week)
        }
        _ => return Err(input_error("Unsupported game league operation")),
    }.map_err(|error| input_error(&format!("Game league operation rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Return the canonical ranked arena tier for a rating-point total.
#[wasm_bindgen]
pub fn rank_arena_tier_json(rp: u64) -> Result<String, JsValue> {
    if rp > 1_000_000 { return Err(input_error("Rank points exceed the supported limit")); }
    serde_json::to_string(&crate::rank_arena::tier(rp))
        .map_err(|error| input_error(&error.to_string()))
}

/// Resolve a ranked arena match using Rust-owned scoring rules.
#[wasm_bindgen]
pub fn rank_arena_resolve_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 4096 { return Err(input_error("Ranked match payload exceeds 4 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Ranked match payload must be valid JSON"))?;
    let number = |key: &str| input.get(key).and_then(serde_json::Value::as_u64)
        .ok_or_else(|| input_error(&format!("Missing or invalid {key}")));
    let mode = input.get("mode").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing or invalid mode"))?;
    let mmr = u32::try_from(number("mmr")?)
        .map_err(|_| input_error("MMR is outside the supported range"))?;
    let correct = u8::try_from(number("correct")?)
        .map_err(|_| input_error("Correct answer count is invalid"))?;
    let rival_correct = u8::try_from(number("rivalCorrect")?)
        .map_err(|_| input_error("Rival answer count is invalid"))?;
    let best_combo = u8::try_from(number("bestCombo")?)
        .map_err(|_| input_error("Best combo count is invalid"))?;
    let result = crate::rank_arena::resolve_match(
        number("rp")?, mmr, correct, rival_correct, best_combo, mode,
    ).map_err(|error| input_error(&format!("Ranked match rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Validate ranked arena mission claims and return the reward decided by Rust.
#[wasm_bindgen]
pub fn rank_arena_claim_json(id: &str, progress: u32, already_claimed: bool) -> Result<String, JsValue> {
    if id.len() > 32 { return Err(input_error("Mission identifier is too long")); }
    let result = crate::rank_arena::mission_reward(id, progress, already_claimed)
        .map_err(|error| input_error(&format!("Mission claim rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Search lesson, quiz and discovery catalogs using the Rust content index.
#[wasm_bindgen]
pub fn global_search_index_json(
    input_json: &str,
    query: &str,
    default_kind: &str,
) -> Result<String, JsValue> {
    if query.len() > 512 { return Err(input_error("Global search query exceeds 512 bytes")); }
    let result = crate::content::global_search_index_json(input_json, query, default_kind)
        .map_err(|error| input_error(&format!("Global search indexing failed: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn content_catalog_index_json(input_json: &str, query: &str) -> Result<String, JsValue> {
    if query.len() > 512 { return Err(input_error("Catalog query exceeds 512 bytes")); }
    let result = crate::content::index_catalog_json(input_json, query)
        .map_err(|error| input_error(&format!("Catalog validation failed: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}


/// Execute hierarchical catalog operations in Rust for the browser presentation adapter.
#[wasm_bindgen]
pub fn content_tree_query_json(
    catalog_json: &str,
    operation: &str,
    target_id: &str,
) -> Result<String, JsValue> {
    if catalog_json.len() > 2 * 1024 * 1024 {
        return Err(input_error("Catalog payload exceeds 2 MiB"));
    }
    let result = crate::content_tree::execute(catalog_json, operation, target_id)
        .map_err(|error| input_error(&format!("Content tree operation failed: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}

/// Aggregate learning analytics in Rust; browser code supplies locally stored records.
#[wasm_bindgen]
pub fn learning_analytics_summary_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 1024 * 1024 { return Err(input_error("Learning analytics payload exceeds 1 MiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Learning analytics payload must be valid JSON"))?;
    let summary = crate::learning_analytics::summarize(&input)
        .map_err(|error| input_error(&format!("Learning analytics rejected: {error:?}")))?;
    serde_json::to_string(&summary).map_err(|error| input_error(&error.to_string()))
}

/// Generate weekly learning missions with Rust-owned targets and rewards.
#[wasm_bindgen]
pub fn season_missions_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 1024 * 1024 { return Err(input_error("Season mission input exceeds 1 MiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Season mission input must be valid JSON"))?;
    let text = |key: &str| input.get(key).and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error(&format!("Missing or invalid {key}")));
    let attempts = input.get("attempts").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Missing or invalid attempts"))?;
    let notes = input.get("notes").and_then(serde_json::Value::as_array)
        .ok_or_else(|| input_error("Missing or invalid notes"))?;
    let result = crate::season_missions::missions_from_records(text("week")?, text("weekEnd")?, attempts, notes)
        .map_err(|error| input_error(&format!("Season mission generation failed: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}
/// Validate a weekly learning mission claim and return its Rust-owned reward.
#[wasm_bindgen]
pub fn season_mission_claim_json(input_json: &str) -> Result<String, JsValue> {
    if input_json.len() > 2048 { return Err(input_error("Season claim input exceeds 2 KiB")); }
    let input: serde_json::Value = serde_json::from_str(input_json)
        .map_err(|_| input_error("Season claim input must be valid JSON"))?;
    let id = input.get("id").and_then(serde_json::Value::as_str)
        .ok_or_else(|| input_error("Missing or invalid mission id"))?;
    let value = input.get("value").and_then(serde_json::Value::as_u64)
        .ok_or_else(|| input_error("Missing or invalid mission progress"))?;
    let claimed = input.get("alreadyClaimed").and_then(serde_json::Value::as_bool)
        .ok_or_else(|| input_error("Missing or invalid claim state"))?;
    let result = crate::season_missions::claim(id, value, claimed)
        .map_err(|error| input_error(&format!("Season mission claim rejected: {error:?}")))?;
    serde_json::to_string(&result).map_err(|error| input_error(&error.to_string()))
}
