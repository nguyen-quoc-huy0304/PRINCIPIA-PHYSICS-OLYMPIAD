//! Rust-owned scoring for PRINCIPIA's learning-science strategy registry.
use serde_json::{json, Value};
use std::collections::HashSet;

const MAX_METHODS: usize = 128;
const MAX_RECENT: usize = 16;

fn strings<'a>(value: Option<&'a Value>) -> impl Iterator<Item = &'a str> {
    value.and_then(Value::as_array).into_iter().flatten().filter_map(Value::as_str)
}

fn flag(context: &Value, key: &str) -> bool {
    context.get(key).and_then(Value::as_bool).unwrap_or(false)
}

fn score(method: &Value, context: &Value, recent: &HashSet<String>) -> i32 {
    let id = method.get("id").and_then(Value::as_str).unwrap_or("");
    let group = method.get("group").and_then(Value::as_str).unwrap_or("");
    let goal = context.get("goal").and_then(Value::as_str).unwrap_or("understand");
    let weight = method.get("weight").and_then(Value::as_i64).unwrap_or(1).clamp(1, 10) as i32;
    let mut result = if strings(method.get("goals")).any(|item| item == goal) { weight } else { 0 };
    let topic = context.get("topic").and_then(Value::as_str).unwrap_or("").to_lowercase();
    if strings(method.get("triggers")).any(|item| topic.contains(&item.to_lowercase())) { result += 1; }
    let errors = context.get("errorCount").and_then(Value::as_u64).unwrap_or(0);
    let percent = context.get("percent").and_then(Value::as_f64);
    let energy = context.get("energy").and_then(Value::as_u64).unwrap_or(2);
    let confidence = context.get("confidence").and_then(Value::as_u64).unwrap_or(3);
    if errors >= 2 && ["error-analysis", "deliberate-practice", "faded-guidance", "chinese-error-notebook"].contains(&id) { result += 5; }
    if percent.is_some_and(|value| value >= 85.0) && ["transfer-practice", "interleaving", "multiple-solutions"].contains(&id) { result += 4; }
    if energy == 1 && ["chunking", "worked-examples", "pomodoro-flexible", "environment-design"].contains(&id) { result += 4; }
    if energy == 3 && ["deep-work", "deliberate-practice", "polya-problem-solving"].contains(&id) { result += 3; }
    if confidence <= 2 && ["worked-examples", "faded-guidance", "growth-mindset"].contains(&id) { result += 4; }
    if flag(context, "fatigue") && ["sleep-recovery", "attention-restoration", "ultradian-breaks"].contains(&id) { result += 8; }
    if flag(context, "distracted") && ["attention-restoration", "environment-design", "pomodoro-flexible"].contains(&id) { result += 6; }
    if flag(context, "socialLearning") && id == "social-comparison" { result += 5; }
    if id == "social-comparison" && !flag(context, "socialLearning") { return -100; }
    if recent.contains(id) { result -= 5; }
    let _ = group;
    result
}

/// Selects up to four complementary strategies. Strategy definitions remain data;
/// ranking, context weighting, diversity and recent-use penalties execute in Rust.
pub fn select(input: &Value) -> Result<Value, String> {
    let context = input.get("context").ok_or("missing learning context")?;
    let methods = input.get("methods").and_then(Value::as_array).ok_or("methods must be an array")?;
    if methods.is_empty() || methods.len() > MAX_METHODS { return Err("method count must be 1..=128".into()); }
    let recent: HashSet<String> = strings(input.get("recentIds")).take(MAX_RECENT)
        .map(|id| id.chars().take(80).collect()).collect();
    let mut ranked: Vec<(i32, &Value)> = methods.iter()
        .filter(|method| method.get("id").and_then(Value::as_str).is_some_and(|id| !id.is_empty() && id.len() <= 80))
        .map(|method| (score(method, context, &recent), method)).collect();
    ranked.sort_by(|a, b| b.0.cmp(&a.0).then_with(|| {
        a.1.get("id").and_then(Value::as_str).unwrap_or("").cmp(b.1.get("id").and_then(Value::as_str).unwrap_or(""))
    }));
    let mut selected = Vec::new();
    let mut groups = HashSet::new();
    for (value, method) in &ranked {
        if selected.len() >= 4 { break; }
        let group = method.get("group").and_then(Value::as_str).unwrap_or("general");
        if *value <= 0 || (groups.contains(group) && selected.len() < 3) { continue; }
        groups.insert(group.to_owned());
        selected.push(json!({
            "id": method.get("id").and_then(Value::as_str).unwrap_or(""),
            "group": group,
            "guide": method.get("guide").and_then(Value::as_str).unwrap_or("")
        }));
    }
    if selected.len() < 2 {
        for (_, method) in &ranked {
            if selected.len() >= 2 { break; }
            let id = method.get("id").and_then(Value::as_str).unwrap_or("");
            if !selected.iter().any(|item: &Value| item.get("id").and_then(Value::as_str) == Some(id)) {
                selected.push(json!({
                    "id": id,
                    "group": method.get("group").and_then(Value::as_str).unwrap_or("general"),
                    "guide": method.get("guide").and_then(Value::as_str).unwrap_or("")
                }));
            }
        }
    }
    Ok(Value::Array(selected))
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn ranks_by_goal_and_context_and_returns_diverse_strategies() {
        let input = json!({
            "context": {"goal":"recover","topic":"động lực học","energy":1,"errorCount":5,"fatigue":true},
            "recentIds": [],
            "methods": [
                {"id":"error-analysis","group":"practice","goals":["recover"],"triggers":["error"],"weight":5,"guide":"Phân tích lỗi"},
                {"id":"sleep-recovery","group":"wellbeing","goals":["recover"],"triggers":["fatigue"],"weight":3,"guide":"Nghỉ phục hồi"},
                {"id":"retrieval","group":"memory","goals":["remember"],"triggers":["recall"],"weight":5,"guide":"Truy xuất"}
            ]
        });
        let result = select(&input).unwrap();
        assert_eq!(result[0]["id"], "error-analysis");
        assert!(result.iter().any(|item| item["id"] == "sleep-recovery"));
    }

    #[test]
    fn social_comparison_requires_explicit_opt_in() {
        let input = json!({
            "context":{"goal":"teach","topic":"group"},
            "methods":[{"id":"social-comparison","group":"social","goals":["teach"],"weight":5,"guide":"Opt-in"}]
        });
        assert!(select(&input).unwrap().is_empty());
    }

    #[test]
    fn rejects_oversized_registry() {
        let methods = (0..129).map(|id| json!({"id":id.to_string(),"group":"x","weight":1})).collect::<Vec<_>>();
        let input = json!({"context":{"goal":"understand"},"methods":methods});
        assert!(select(&input).is_err());
    }
}
