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
    pub title: &'static str,
    pub description: &'static str,
}


#[derive(Debug, Clone, PartialEq)]
pub struct MethodSelection {
    pub method_id: String,
    pub steps: Vec<String>,
}

pub fn select_method(topic: &str, goal: LearningGoal, catalog: &[serde_json::Value], recent_ids: &[String], sessions: u64) -> Option<MethodSelection> {
    let terms: &[&str] = match goal {
        LearningGoal::Understand => &["hiểu khái niệm", "giải thích bằng hình", "mô hình hóa", "ví dụ cụ thể", "hiểu sâu", "feynman", "concept"],
        LearningGoal::Remember => &["ghi nhớ", "truy xuất", "ôn tập", "flashcard", "nhắc lại", "spaced", "retrieval"],
        LearningGoal::Solve => &["giải bài", "phân tích", "chiến lược", "luyện tập", "problem solving"],
        LearningGoal::Olympiad => &["olympiad", "bài tổng hợp", "bảo toàn", "đối xứng", "bất biến", "chứng minh", "trường hợp biên", "ước lượng"],
        LearningGoal::Teach => &["giảng", "dạy", "giải thích", "phản biện", "teach", "peer instruction"],
        LearningGoal::Recover => &["lỗi", "sửa lỗi", "thành thạo", "tự kiểm tra", "error", "deliberate practice"],
    };
    let topic_words: Vec<String> = topic.to_lowercase().split(|ch: char| !ch.is_alphanumeric())
        .filter(|word| word.chars().count() > 2).map(str::to_owned).collect();
    let recent: std::collections::HashSet<&str> = recent_ids.iter().map(String::as_str).collect();
    let mut scored: Vec<(i32, String, Vec<String>)> = catalog.iter().filter_map(|item| {
        let title = item.get("title")?.as_str()?.chars().take(180).collect::<String>();
        let desc = item.get("desc").and_then(serde_json::Value::as_str).unwrap_or("");
        let category = item.get("category").and_then(serde_json::Value::as_str).unwrap_or("");
        let haystack = format!("{title} {desc} {category}").to_lowercase();
        let topic_hits = topic_words.iter().filter(|word| haystack.contains(word.as_str())).count() as i32;
        let goal_hits = terms.iter().filter(|term| haystack.contains(**term)).count() as i32;
        let id = item.get("id").map(|value| match value {
            serde_json::Value::String(text) => text.clone(),
            other => other.to_string(),
        })?;
        let steps: Vec<String> = item.get("steps").and_then(serde_json::Value::as_array)
            .map(|values| values.iter().filter_map(serde_json::Value::as_str)
                .map(|step| step.chars().take(500).collect()).take(5).collect())
            .unwrap_or_default();
        let is_core = item.get("id").and_then(serde_json::Value::as_u64).is_some_and(|id| (1..=231).contains(&id));
        let score = topic_hits * 5 + goal_hits * 3 + if steps.is_empty() { 0 } else { 2 }
            + if is_core { 1 } else { 0 } - if recent.contains(id.as_str()) { 10 } else { 0 };
        Some((score, id, steps))
    }).collect();
    if scored.is_empty() { return None; }
    scored.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| a.1.cmp(&b.1)));
    let fresh: Vec<_> = scored.iter().filter(|entry| !recent.contains(entry.1.as_str())).cloned().collect();
    let pool = if fresh.is_empty() { &scored } else { &fresh };
    let chosen = &pool[(sessions as usize) % pool.len().min(8)];
    Some(MethodSelection { method_id: chosen.1.clone(), steps: chosen.2.clone() })
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
    let (title, description) = match goal {
        LearningGoal::Recover => ("Gỡ đúng chỗ đang vướng", "Ưu tiên tìm lỗ hổng kiến thức và sửa đúng bước đang sai."),
        LearningGoal::Remember => ("Kiểm tra trí nhớ trước khi xem lại", "Tự truy xuất kiến thức trước, sau đó đối chiếu và củng cố phần còn thiếu."),
        LearningGoal::Solve => ("Thử thách vận dụng tiếp theo", "Áp dụng nguyên lý vào bài toán có dữ kiện hoặc cách biểu diễn mới."),
        LearningGoal::Olympiad => ("Thử thách tư duy Olympic", "Nhận diện cấu trúc, tìm bất biến và kiểm tra trường hợp biên."),
        LearningGoal::Teach => ("Giải thích lại để kiểm tra hiểu sâu", "Giảng bằng lời của mình và tự bảo vệ từng lập luận."),
        LearningGoal::Understand => ("Xây nền tảng rồi tự thử", "Hình dung hiện tượng, xác định giả thiết rồi mới đi vào công thức."),
    };
    let topic = context.topic.trim();
    Ok(LearningPlan {
        goal, difficulty, focus_minutes,
        topic: if topic.is_empty() { "Vật lý".to_owned() } else { topic.chars().take(120).collect() },
        steps, next_action, title, description,
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
    #[test]
    fn method_selection_prefers_topic_and_goal_relevance() {
        let catalog = vec![
            serde_json::json!({"id": 1, "title": "Flashcard ghi nhớ quang học", "desc": "Ôn tập truy xuất", "steps": ["Tự nhớ lại"]}),
            serde_json::json!({"id": 2, "title": "Mô hình hóa cơ học", "desc": "Giải thích bằng hình", "steps": ["Vẽ sơ đồ"]}),
        ];
        let selected = select_method("cơ học", LearningGoal::Understand, &catalog, &[], 0).unwrap();
        assert_eq!(selected.method_id, "2");
        assert_eq!(selected.steps, vec!["Vẽ sơ đồ"]);
    }

    #[test]
    fn method_selection_avoids_recent_method_when_alternative_exists() {
        let catalog = vec![
            serde_json::json!({"id": "a", "title": "Hiểu khái niệm bằng mô hình", "steps": ["Bước A"]}),
            serde_json::json!({"id": "b", "title": "Hiểu sâu qua ví dụ", "steps": ["Bước B"]}),
        ];
        let selected = select_method("vật lý", LearningGoal::Understand, &catalog, &["a".into()], 0).unwrap();
        assert_eq!(selected.method_id, "b");
    }

    #[test]
    fn method_selection_handles_empty_catalog() {
        assert!(select_method("vật lý", LearningGoal::Understand, &[], &[], 0).is_none());
    }

    #[test] fn rejects_invalid_context_and_schedule() {
        let mut input = context(); input.percent = Some(f64::NAN);
        assert_eq!(recommend(&input), Err(LearningError::InvalidPercent));
        assert_eq!(schedule_review(6, 1, 2.5), Err(LearningError::InvalidQuality));
    }
}
