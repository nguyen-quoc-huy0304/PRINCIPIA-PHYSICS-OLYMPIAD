//! Rust-owned weekly learning season missions and claim validation.
use serde_json::{json, Value};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SeasonError { InvalidWeek, InvalidMetric, UnknownMission }

#[derive(Debug, Clone, Copy)]
struct Mission {
    id: &'static str,
    name: &'static str,
    description: &'static str,
    target: u64,
    reward: u32,
}

const MISSIONS: [Mission; 3] = [
    Mission { id: "practice", name: "Chiến binh luyện tập", description: "Hoàn thành 3 lượt luyện", target: 3, reward: 60 },
    Mission { id: "questions", name: "Bậc thầy câu hỏi", description: "Trả lời 30 câu hỏi", target: 30, reward: 80 },
    Mission { id: "notes", name: "Nhà ghi chép", description: "Lưu 2 ghi chú học tập", target: 2, reward: 40 },
];

fn validate_week(week: &str) -> Result<(), SeasonError> {
    let bytes = week.as_bytes();
    if bytes.len() != 10 || bytes[4] != b'-' || bytes[7] != b'-'
        || !bytes.iter().enumerate().all(|(index, byte)| [4, 7].contains(&index) || byte.is_ascii_digit())
    { return Err(SeasonError::InvalidWeek); }
    let month = week[5..7].parse::<u8>().map_err(|_| SeasonError::InvalidWeek)?;
    let day = week[8..10].parse::<u8>().map_err(|_| SeasonError::InvalidWeek)?;
    if !(1..=12).contains(&month) || !(1..=31).contains(&day) { return Err(SeasonError::InvalidWeek); }
    Ok(())
}

pub fn missions(week: &str, sessions: u64, questions: u64, notes: u64) -> Result<Value, SeasonError> {
    validate_week(week)?;
    if [sessions, questions, notes].iter().any(|value| *value > 1_000_000) {
        return Err(SeasonError::InvalidMetric);
    }
    let values = [sessions, questions, notes];
    let rows: Vec<Value> = MISSIONS.iter().zip(values).map(|(mission, value)| {
        let progress = ((value.min(mission.target) as f64 / mission.target as f64) * 100.0).round() as u32;
        json!({
            "id":mission.id,"name":mission.name,"description":mission.description,
            "value":value,"target":mission.target,"xp":mission.reward,
            "complete":value >= mission.target,"progress":progress,"week":week
        })
    }).collect();
    Ok(Value::Array(rows))
}

fn date_prefix(value: &Value) -> Option<&str> {
    let date = value.get("date").and_then(Value::as_str)?;
    let bytes = date.as_bytes();
    if bytes.len() < 10 || !bytes[..10].iter().all(|byte| byte.is_ascii_digit() || *byte == b'-') {
        return None;
    }
    std::str::from_utf8(&bytes[..10]).ok()
}

/// Derive weekly metrics from raw locally stored records without browser-side aggregation.
pub fn missions_from_records(
    week: &str,
    week_end: &str,
    attempts: &[Value],
    notes: &[Value],
) -> Result<Value, SeasonError> {
    validate_week(week)?;
    validate_week(week_end)?;
    if week_end <= week || attempts.len() > 10_000 || notes.len() > 10_000 {
        return Err(SeasonError::InvalidMetric);
    }
    let mut sessions = 0u64;
    let mut questions = 0u64;
    for attempt in attempts {
        let Some(date) = date_prefix(attempt) else { continue };
        if date < week || date >= week_end { continue; }
        let total = attempt.get("total").and_then(Value::as_u64).ok_or(SeasonError::InvalidMetric)?;
        if total > 1_000_000 { return Err(SeasonError::InvalidMetric); }
        sessions = sessions.checked_add(1).ok_or(SeasonError::InvalidMetric)?;
        questions = questions.checked_add(total).ok_or(SeasonError::InvalidMetric)?;
    }
    let notes_count = notes.iter().filter(|note| {
        date_prefix(note).is_some_and(|date| date >= week && date < week_end)
    }).count() as u64;
    missions(week, sessions, questions, notes_count)
}

pub fn claim(id: &str, value: u64, already_claimed: bool) -> Result<Value, SeasonError> {
    if value > 1_000_000 { return Err(SeasonError::InvalidMetric); }
    let mission = MISSIONS.iter().find(|mission| mission.id == id).ok_or(SeasonError::UnknownMission)?;
    let allowed = value >= mission.target && !already_claimed;
    Ok(json!({"allowed":allowed,"reward":if allowed {mission.reward} else {0},"target":mission.target}))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn weekly_mission_progress_and_rewards_are_canonical() {
        let result = missions("2026-11-23", 2, 15, 2).unwrap();
        assert_eq!(result[0]["progress"], 67);
        assert_eq!(result[0]["complete"], false);
        assert_eq!(result[2]["complete"], true);
        assert_eq!(result[2]["xp"], 40);
    }

    #[test]
    fn raw_records_are_filtered_and_aggregated_by_week_in_rust() {
        let attempts = vec![
            json!({"date":"2026-11-23T10:00:00Z","total":10}),
            json!({"date":"2026-11-29T10:00:00Z","total":20}),
            json!({"date":"2026-11-30T00:00:00Z","total":100}),
        ];
        let notes = vec![
            json!({"date":"2026-11-23T12:00:00Z"}),
            json!({"date":"2026-11-30T00:00:00Z"}),
        ];
        let result = missions_from_records("2026-11-23", "2026-11-30", &attempts, &notes).unwrap();
        assert_eq!(result[0]["value"], 2);
        assert_eq!(result[1]["value"], 30);
        assert_eq!(result[2]["value"], 1);
    }

    #[test]
    fn claims_require_threshold_and_are_one_time() {
        assert_eq!(claim("practice", 2, false).unwrap()["allowed"], false);
        assert_eq!(claim("practice", 3, false).unwrap()["reward"], 60);
        assert_eq!(claim("practice", 3, true).unwrap()["allowed"], false);
        assert!(claim("unknown", 10, false).is_err());
    }

    #[test]
    fn invalid_dates_and_counters_are_rejected() {
        assert!(missions("2026-13-44", 0, 0, 0).is_err());
        assert!(missions("not-a-date", 0, 0, 0).is_err());
        assert!(missions("2026-11-23", 1_000_001, 0, 0).is_err());
    }
}
