//! Validation for user-authored PRINCIPIA physics levels.
use serde_json::{json, Value};

fn clean_text(value: Option<&Value>, max: usize) -> String {
    value.and_then(Value::as_str).unwrap_or("").trim().chars().take(max).collect()
}

fn answer_index(value: Option<&Value>) -> Option<usize> {
    value.and_then(|value| value.as_u64().and_then(|n| usize::try_from(n).ok())
        .or_else(|| value.as_str().and_then(|text| text.parse::<usize>().ok())))
}

pub fn validate_question(value: &Value) -> Result<Value, &'static str> {
    if !value.is_object() { return Err("question must be an object"); }
    let prompt = clean_text(value.get("prompt"), 1200);
    if prompt.is_empty() { return Err("question prompt is required"); }
    let choices_value = value.get("choices").and_then(Value::as_array)
        .ok_or("question choices are required")?;
    if !(2..=6).contains(&choices_value.len()) { return Err("question must contain 2 to 6 choices"); }
    let choices: Vec<String> = choices_value.iter().map(|item| {
        match item {
            Value::String(text) => text.trim().chars().take(300).collect(),
            Value::Number(number) => number.to_string(),
            _ => String::new(),
        }
    }).collect();
    if choices.iter().any(String::is_empty) { return Err("question choices cannot be empty"); }
    let answer = answer_index(value.get("answer")).ok_or("question answer index is invalid")?;
    if answer >= choices.len() { return Err("question answer index is out of range"); }
    let explanation = clean_text(value.get("explanation"), 1200);
    Ok(json!({"prompt":prompt,"choices":choices,"answer":answer,"explanation":explanation}))
}

pub fn validate_level(value: &Value) -> Result<Value, &'static str> {
    if !value.is_object() { return Err("level must be an object"); }
    let id = clean_text(value.get("id"), 80);
    if id.is_empty() || !id.chars().all(|ch| ch.is_ascii_alphanumeric() || ch == '_' || ch == '-') {
        return Err("level id contains unsupported characters");
    }
    let title = clean_text(value.get("title"), 100);
    if title.is_empty() { return Err("level title is required"); }
    let description = clean_text(value.get("description"), 300);
    let questions_value = value.get("questions").and_then(Value::as_array)
        .filter(|items| (1..=50).contains(&items.len()))
        .ok_or("level must contain 1 to 50 questions")?;
    let questions = questions_value.iter().map(validate_question).collect::<Result<Vec<_>, _>>()?;
    let updated_at = clean_text(value.get("updatedAt"), 40);
    Ok(json!({
        "id":id,"title":title,"description":description,
        "questions":questions,"updatedAt":updated_at
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample() -> Value {
        json!({"id":"m1","title":"Cơ học cơ bản","description":"Luyện tập","updatedAt":"2026-11-25T00:00:00Z",
            "questions":[{"prompt":"Đơn vị lực?","choices":["N","J"],"answer":0,"explanation":"Newton"}]})
    }

    #[test]
    fn validates_and_normalizes_levels() {
        let level = validate_level(&sample()).unwrap();
        assert_eq!(level["id"], "m1");
        assert_eq!(level["questions"][0]["choices"].as_array().unwrap().len(), 2);
    }

    #[test]
    fn rejects_unsafe_ids_and_invalid_answers() {
        let mut level = sample();
        level["id"] = Value::String("bad' onclick='alert(1)".into());
        assert!(validate_level(&level).is_err());
        let mut level = sample();
        level["questions"][0]["answer"] = json!(9);
        assert!(validate_level(&level).is_err());
    }

    #[test]
    fn enforces_choice_and_question_limits() {
        let mut level = sample();
        level["questions"][0]["choices"] = json!(["a", "b", "c", "d", "e", "f", "g"]);
        assert!(validate_level(&level).is_err());
        let mut level = sample();
        level["questions"] = Value::Array(vec![level["questions"][0].clone(); 51]);
        assert!(validate_level(&level).is_err());
    }
}
