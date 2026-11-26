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
