//! Weekly season mission derivation with ISO-8601 week boundaries.
use serde_json::{json, Value};

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct SeasonMission {
    pub id: &'static str,
    pub name: &'static str,
    pub description: &'static str,
    pub value: u64,
    pub target: u64,
    pub xp: u64,
    pub complete: bool,
    pub progress: u8,
    pub week: String,
}

fn days_from_civil(year: i64, month: i64, day: i64) -> i64 {
    let y = year - i64::from(month <= 2);
    let era = if y >= 0 { y } else { y - 399 } / 400;
    let yoe = y - era * 400;
    let mp = month + if month > 2 { -3 } else { 9 };
    let doy = (153 * mp + 2) / 5 + day - 1;
    let doe = yoe * 365 + yoe / 4 - yoe / 100 + doy;
    era * 146097 + doe - 719468
}

fn parse_day(value: &str) -> Result<(i64, i64, i64), &'static str> {
    let mut parts = value.split('-');
    let (Some(y), Some(m), Some(d), None) = (parts.next(), parts.next(), parts.next(), parts.next()) else {
        return Err("date must use YYYY-MM-DD");
    };
    let (Ok(year), Ok(month), Ok(day)) = (y.parse::<i64>(), m.parse::<i64>(), d.parse::<i64>()) else {
        return Err("date must use YYYY-MM-DD");
    };
    if year < 1 || !(1..=12).contains(&month) { return Err("date is invalid"); }
    let leap = year % 4 == 0 && (year % 100 != 0 || year % 400 == 0);
    let month_days = match month {
        1|3|5|7|8|10|12 => 31, 4|6|9|11 => 30, 2 if leap => 29, 2 => 28, _ => 0
    };
    if day < 1 || day > month_days { return Err("date is invalid"); }
    Ok((year, month, day))
}

pub fn iso_week_key(date: &str) -> Result<String, &'static str> {
    let (year, month, day) = parse_day(date)?;
    let ordinal = days_from_civil(year, month, day);
    let week_start = |y: i64| {
        let jan4 = days_from_civil(y, 1, 4);
        let weekday = (jan4 + 3).rem_euclid(7);
        jan4 - weekday
    };
    let mut iso_year = year;
    if ordinal < week_start(iso_year) { iso_year -= 1; }
    else if ordinal >= week_start(iso_year + 1) { iso_year += 1; }
    let week = (ordinal - week_start(iso_year)).div_euclid(7) + 1;
    Ok(format!("{iso_year}-W{week:02}"))
}

fn count_metric(value: Option<&Value>) -> u64 {
    let max = 9_007_199_254_740_991_u64;
    value.and_then(|value| value.as_f64())
        .filter(|number| number.is_finite() && *number > 0.0)
        .map(|number| number.floor().min(max as f64) as u64)
        .unwrap_or(0)
}

pub fn missions(metrics: &Value, date: &str) -> Result<Vec<SeasonMission>, &'static str> {
    let week = iso_week_key(date)?;
    let sessions = count_metric(metrics.get("sessions"));
    let questions = count_metric(metrics.get("questions"));
    let notes = count_metric(metrics.get("notes"));
    let definitions = [
        ("practice", "Chiến binh luyện tập", "Hoàn thành 3 lượt luyện", sessions, 3, 60),
        ("questions", "Bậc thầy câu hỏi", "Trả lời 30 câu hỏi", questions, 30, 80),
        ("notes", "Nhà ghi chép", "Lưu 2 ghi chú học tập", notes, 2, 40),
    ];
    Ok(definitions.into_iter().map(|(id, name, description, value, target, xp)| {
        let progress = ((value as f64 / target as f64) * 100.0).round().clamp(0.0, 100.0) as u8;
        SeasonMission { id, name, description, value, target, xp, complete: value >= target, progress, week: week.clone() }
    }).collect())
}

pub fn missions_json(metrics_json: &str, date: &str) -> Result<String, &'static str> {
    if metrics_json.len() > 4096 { return Err("season metrics exceed 4 KiB"); }
    let metrics: Value = serde_json::from_str(metrics_json).map_err(|_| "season metrics must be valid JSON")?;
    let missions = missions(&metrics, date)?;
    serde_json::to_string(&missions.iter().map(|item| json!({
        "id": item.id, "name": item.name, "description": item.description,
        "value": item.value, "target": item.target, "xp": item.xp,
        "complete": item.complete, "progress": item.progress, "week": item.week
    })).collect::<Vec<_>>()).map_err(|_| "could not encode season missions")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn iso_week_changes_on_monday_and_handles_year_boundary() {
        assert_eq!(iso_week_key("2026-11-16"), Ok("2026-W47".into()));
        assert_eq!(iso_week_key("2026-11-22"), Ok("2026-W47".into()));
        assert_eq!(iso_week_key("2026-11-23"), Ok("2026-W48".into()));
        assert_eq!(iso_week_key("2021-01-01"), Ok("2020-W53".into()));
    }

    #[test]
    fn derives_mission_progress_and_completion() {
        let metrics = json!({"sessions":2,"questions":15,"notes":2});
        let result = missions(&metrics, "2026-11-22").unwrap();
        assert_eq!(result[0].progress, 67);
        assert!(!result[0].complete);
        assert!(result[2].complete);
    }

    #[test]
    fn caps_counters_and_rejects_invalid_dates() {
        let metrics = json!({"sessions":9_007_199_254_740_991_u64,"questions":-1,"notes":"bad"});
        let result = missions(&metrics, "2026-11-22").unwrap();
        assert_eq!(result[0].value, 9_007_199_254_740_991_u64);
        assert_eq!(result[1].value, 0);
        assert!(missions(&metrics, "2023-02-29").is_err());
    }
}
