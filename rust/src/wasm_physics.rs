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
        "nextAction": plan.next_action
    })).map_err(|error| input_error(&error.to_string()))
}

#[wasm_bindgen]
pub fn learning_review_schedule_json(quality: u8, previous_interval_days: u32, ease_factor: f64) -> Result<String, JsValue> {
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
