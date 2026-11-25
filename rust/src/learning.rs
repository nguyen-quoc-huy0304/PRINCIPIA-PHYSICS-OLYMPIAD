//! PRINCIPIA learning-science domain engine.
//! Deterministic recommendations and spaced-repetition scheduling; UI text is rendered by adapters.

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LearningGoal { Understand, Remember, Solve, Olympiad, Teach, Recover }

#[derive(Debug, Clone, PartialEq)]
pub struct LearnerContext {
    pub goal: Option<LearningGoal>,
    pub percent: Option<f64>,
    pub error_count: u32,
    pub phase: String,
    pub energy: u8,
    pub confidence: u8,
    pub topic: String,
}

#[derive(Debug, Clone, PartialEq)]
pub struct LearningPlan {
    pub goal: LearningGoal,
    pub difficulty: u8,
    pub focus_minutes: u8,
    pub topic: String,
    pub steps: [&'static str; 3],
    pub next_action: &'static str,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ReviewSchedule {
    pub interval_days: u32,
    pub ease_factor: f64,
    pub due_after_days: u32,
    pub mastered: bool,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LearningError { InvalidPercent, InvalidEnergy, InvalidConfidence, InvalidEase, InvalidInterval, InvalidQuality }

pub fn recommend(context: &LearnerContext) -> Result<LearningPlan, LearningError> {
    if context.percent.is_some_and(|value| !value.is_finite() || !(0.0..=100.0).contains(&value)) {
        return Err(LearningError::InvalidPercent);
    }
    if !(1..=3).contains(&context.energy) { return Err(LearningError::InvalidEnergy); }
    if !(1..=5).contains(&context.confidence) { return Err(LearningError::InvalidConfidence); }
    let phase = context.phase.to_lowercase();
    let goal = context.goal.unwrap_or_else(|| {
        if context.error_count >= 3 || context.percent.is_some_and(|score| score < 50.0) {
            LearningGoal::Recover
        } else if phase.contains("teach") || phase.contains("giảng") || phase.contains("dạy") {
            LearningGoal::Teach
        } else if phase.contains("review") || phase.contains("ôn") || phase.contains("flashcard") {
            LearningGoal::Remember
        } else if phase.contains("olympiad") || phase.contains("bồi dưỡng") {
            LearningGoal::Olympiad
        } else if context.percent.is_some_and(|score| score >= 80.0) {
            LearningGoal::Solve
        } else {
            LearningGoal::Understand
        }
    });
    let difficulty = match goal {
        LearningGoal::Recover => 1,
        LearningGoal::Understand | LearningGoal::Remember => 2,
        LearningGoal::Solve | LearningGoal::Teach => 3,
        LearningGoal::Olympiad => 4,
    }.min(context.energy + 1).min(if context.confidence <= 2 { 2 } else { 4 });
    let focus_minutes = match context.energy { 1 => 10, 2 => 20, _ => 30 };
    let steps = match goal {
        LearningGoal::Recover => [
            "Xem lại một lỗi cụ thể và tự giải thích nguyên nhân.",
            "Làm một câu tương tự với gợi ý tối thiểu.",
            "Lặp lại câu hỏi sau một khoảng nghỉ ngắn.",
        ],
        LearningGoal::Remember => [
            "Đóng tài liệu và tự truy xuất kiến thức từ trí nhớ.",
            "Đối chiếu câu trả lời với tài liệu, ghi lại phần thiếu.",
            "Lặp lại bằng flashcard hoặc câu hỏi ngắn.",
        ],
        LearningGoal::Solve | LearningGoal::Olympiad => [
            "Tự xác định dữ kiện, ẩn số và nguyên lý có thể áp dụng.",
            "Lập kế hoạch giải, kiểm tra đơn vị và trường hợp biên.",
            "Giải một bài chuyển giao mà không xem lời giải.",
        ],
        LearningGoal::Teach => [
            "Giải thích khái niệm bằng ngôn ngữ đơn giản.",
            "Tạo ví dụ và phản ví dụ để kiểm tra hiểu biết.",
            "Trả lời câu hỏi phản biện mà không đọc tài liệu.",
        ],
        LearningGoal::Understand => [
            "Nêu điều đã biết và điều cần tìm trước khi xem gợi ý.",
            "Dùng hình ảnh hoặc mô hình để giải thích nguyên lý.",
            "Thử một câu tương tự và tự kiểm tra kết quả.",
        ],
    };
    let next_action = match goal {
        LearningGoal::Recover => "retry_error",
        LearningGoal::Remember => "active_recall",
        LearningGoal::Solve => "solve_transfer",
        LearningGoal::Olympiad => "olympiad_problem",
        LearningGoal::Teach => "teach_back",
        LearningGoal::Understand => "build_model",
    };
    let topic = context.topic.trim();
    Ok(LearningPlan {
        goal, difficulty, focus_minutes,
        topic: if topic.is_empty() { "Vật lý".to_owned() } else { topic.chars().take(120).collect() },
        steps, next_action,
    })
}

/// SM-2-inspired schedule. Quality 0–5; failed recall schedules a one-day retry.
pub fn schedule_review(
    quality: u8,
    previous_interval_days: u32,
    ease_factor: f64,
) -> Result<ReviewSchedule, LearningError> {
    if quality > 5 { return Err(LearningError::InvalidQuality); }
    if !(1.3..=3.0).contains(&ease_factor) || !ease_factor.is_finite() {
        return Err(LearningError::InvalidEase);
    }
    if previous_interval_days > 36_500 { return Err(LearningError::InvalidInterval); }
    let delta = 5.0 - quality as f64;
    let next_ease = (ease_factor + 0.1 - delta * (0.08 + delta * 0.02)).clamp(1.3, 3.0);
    let interval = if quality < 3 {
        1
    } else if previous_interval_days == 0 {
        1
    } else if previous_interval_days == 1 {
        6
    } else {
        ((previous_interval_days as f64 * next_ease).round() as u32).clamp(1, 36_500)
    };
    Ok(ReviewSchedule {
        interval_days: interval,
        ease_factor: next_ease,
        due_after_days: interval,
        mastered: quality >= 4 && interval >= 6,
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    fn context() -> LearnerContext {
        LearnerContext { goal: None, percent: Some(35.0), error_count: 4,
            phase: String::new(), energy: 2, confidence: 3, topic: "Cơ học".into() }
    }
    #[test] fn low_score_and_repeated_errors_trigger_recovery() {
        let plan = recommend(&context()).unwrap();
        assert_eq!(plan.goal, LearningGoal::Recover);
        assert_eq!(plan.next_action, "retry_error");
        assert_eq!(plan.topic, "Cơ học");
    }
    #[test] fn energy_limits_focus_duration() {
        let mut input = context(); input.energy = 1; input.goal = Some(LearningGoal::Understand);
        assert_eq!(recommend(&input).unwrap().focus_minutes, 10);
    }
    #[test] fn spaced_repetition_retries_failed_recall() {
        let result = schedule_review(1, 12, 2.5).unwrap();
        assert_eq!(result.interval_days, 1);
        assert!(!result.mastered);
    }
    #[test] fn spaced_repetition_increases_interval_after_success() {
        assert_eq!(schedule_review(5, 1, 2.5).unwrap().interval_days, 6);
    }
    #[test] fn rejects_invalid_context_and_schedule() {
        let mut input = context(); input.percent = Some(f64::NAN);
        assert_eq!(recommend(&input), Err(LearningError::InvalidPercent));
        assert_eq!(schedule_review(6, 1, 2.5), Err(LearningError::InvalidQuality));
    }
}
