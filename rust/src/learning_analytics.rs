//! Rust-owned aggregation for PRINCIPIA learning analytics.
use serde_json::{json, Value};
use std::collections::{BTreeMap, BTreeSet};

const MAX_ROWS: usize = 10_000;
const MAX_TOTAL: u64 = 1_000_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AnalyticsError {
    InvalidInput,
    TooManyRows,
    InvalidAttempt,
    InvalidSession,
    InvalidTask,
}

fn rows<'a>(input: &'a Value, key: &str) -> Result<&'a Vec<Value>, AnalyticsError> {
    let value = input.get(key).and_then(Value::as_array).ok_or(AnalyticsError::InvalidInput)?;
    if value.len() > MAX_ROWS { return Err(AnalyticsError::TooManyRows); }
    Ok(value)
}

fn number(row: &Value, key: &str) -> Option<u64> {
    row.get(key).and_then(Value::as_u64)
}

fn topic(row: &Value) -> Result<String, AnalyticsError> {
    let explicit = row.get("topic").and_then(Value::as_str).unwrap_or("");
    let source = if explicit.is_empty() {
        row.get("path").and_then(Value::as_str).unwrap_or("")
    } else { explicit };
    let source = if source.is_empty() {
        let body = row.get("body").and_then(Value::as_str).unwrap_or("");
        body.lines().find_map(|line| line.trim().strip_prefix("Nguồn:").map(str::trim)).unwrap_or("")
    } else { source };
    let first = source.split(&['›', '/', '>'][..]).next().unwrap_or("").trim();
    let normalized = if first.is_empty() { "Chưa phân loại" } else { first };
    if normalized.len() > 128 { return Err(AnalyticsError::InvalidInput); }
    Ok(normalized.to_owned())
}

/// Summarize already date-filtered attempts, sessions, errors and plan tasks.
pub fn summarize(input: &Value) -> Result<Value, AnalyticsError> {
    let attempts = rows(input, "attempts")?;
    let sessions = rows(input, "focusSessions")?;
    let errors = rows(input, "errors")?;
    let tasks = rows(input, "tasks")?;
    let today = input.get("today").and_then(Value::as_str).ok_or(AnalyticsError::InvalidInput)?;
    if today.len() != 10 { return Err(AnalyticsError::InvalidInput); }

    let mut total = 0u64;
    let mut correct = 0u64;
    for attempt in attempts {
        let count = number(attempt, "total").ok_or(AnalyticsError::InvalidAttempt)?;
        let score = number(attempt, "score").ok_or(AnalyticsError::InvalidAttempt)?;
        if count == 0 || count > MAX_TOTAL || score > count { return Err(AnalyticsError::InvalidAttempt); }
        total = total.checked_add(count).ok_or(AnalyticsError::InvalidAttempt)?;
        correct = correct.checked_add(score).ok_or(AnalyticsError::InvalidAttempt)?;
    }
    let accuracy = if total == 0 { 0 } else { ((correct as f64 / total as f64) * 100.0).round() as u32 };

    let mut focus_seconds = 0u64;
    let mut active_days = BTreeSet::new();
    for session in sessions {
        let seconds = number(session, "seconds").ok_or(AnalyticsError::InvalidSession)?;
        let date = session.get("date").and_then(Value::as_str).ok_or(AnalyticsError::InvalidSession)?;
        if seconds == 0 || seconds > 86_400 || date.len() != 10 { return Err(AnalyticsError::InvalidSession); }
        focus_seconds = focus_seconds.checked_add(seconds).ok_or(AnalyticsError::InvalidSession)?;
        active_days.insert(date);
    }

    let mut topics = BTreeMap::<String, u32>::new();
    for error in errors {
        let name = topic(error)?;
        let count = topics.entry(name).or_default();
        *count = count.checked_add(1).ok_or(AnalyticsError::InvalidInput)?;
    }
    let mut weak: Vec<(String, u32)> = topics.into_iter().collect();
    weak.sort_by(|left, right| right.1.cmp(&left.1).then_with(|| left.0.cmp(&right.0)));
    weak.truncate(5);

    let mut open_tasks = 0u32;
    let mut overdue = 0u32;
    for task in tasks {
        let done = task.get("done").and_then(Value::as_bool).ok_or(AnalyticsError::InvalidTask)?;
        if !done {
            open_tasks += 1;
            if let Some(due) = task.get("due").and_then(Value::as_str) {
                if due.len() > 10 { return Err(AnalyticsError::InvalidTask); }
                if !due.is_empty() && due < today { overdue += 1; }
            }
        }
    }

    let mut recommendations = Vec::new();
    if attempts.is_empty() {
        recommendations.push("Làm một bài luyện ngắn để PRINCIPIA có dữ liệu đánh giá tiến bộ.");
    } else if accuracy < 60 {
        recommendations.push("Ôn lại kiến thức nền và giải chậm từng bước trước khi tăng độ khó.");
    } else if accuracy < 85 {
        recommendations.push("Tập trung sửa lỗi sai, sau đó làm lại câu tương tự để củng cố.");
    } else {
        recommendations.push("Độ chính xác đang tốt; thử một bộ câu hỏi khó hơn để kiểm tra chiều sâu hiểu bài.");
    }
    if let Some((name, _)) = weak.first() {
        recommendations.push(Box::leak(format!("Ưu tiên ôn {name} vì đây là chủ đề xuất hiện nhiều nhất trong lỗi sai tuần này.").into_boxed_str()));
    }
    if focus_seconds < 3_600 {
        recommendations.push("Thử chia việc học thành các phiên tập trung 15–25 phút.");
    }
    if overdue > 0 {
        recommendations.push(Box::leak(format!("Xử lý hoặc dời {overdue} nhiệm vụ học tập đã quá hạn.").into_boxed_str()));
    }

    Ok(json!({
        "attempts": attempts.len(), "questions": total, "correct": correct, "accuracy": accuracy,
        "focusSeconds": focus_seconds, "focusSessions": sessions.len(), "focusDays": active_days.len(),
        "openTasks": open_tasks, "overdue": overdue,
        "weakTopics": weak.iter().map(|(name,count)| json!({"topic":name,"count":count})).collect::<Vec<_>>(),
        "recommendations": recommendations
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aggregates_attempts_focus_errors_and_tasks() {
        let input = json!({
            "today":"2026-11-26",
            "attempts":[{"total":10,"score":8},{"total":5,"score":4}],
            "focusSessions":[{"seconds":1800,"date":"2026-11-25"},{"seconds":900,"date":"2026-11-25"}],
            "errors":[{"path":"Cơ học › Động lực học"},{"path":"Cơ học / Lực"},{"path":"Điện học"}],
            "tasks":[{"done":false,"due":"2026-11-25"},{"done":false,"due":"2026-11-26"},{"done":true,"due":"2026-11-20"}]
        });
        let result = summarize(&input).unwrap();
        assert_eq!(result["accuracy"], 80);
        assert_eq!(result["focusSeconds"], 2700);
        assert_eq!(result["focusDays"], 1);
        assert_eq!(result["overdue"], 1);
        assert_eq!(result["weakTopics"][0]["topic"], "Cơ học");
        assert_eq!(result["weakTopics"][0]["count"], 2);
    }

    #[test]
    fn rejects_invalid_scores_and_oversized_collections() {
        assert_eq!(summarize(&json!({"today":"2026-11-26","attempts":[{"total":2,"score":3}],"focusSessions":[],"errors":[],"tasks":[]})), Err(AnalyticsError::InvalidAttempt));
        let many = vec![json!({"total":1,"score":1}); MAX_ROWS + 1];
        assert_eq!(summarize(&json!({"today":"2026-11-26","attempts":many,"focusSessions":[],"errors":[],"tasks":[]})), Err(AnalyticsError::TooManyRows));
    }
}
