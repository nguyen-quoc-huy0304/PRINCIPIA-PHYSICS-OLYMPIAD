//! Deterministic weekly AI league rules for the PRINCIPIA learning arena.
use serde_json::{json, Value};

const BOTS: [(&str, &str); 7] = [
    ("NewtonBot", "🤖"),
    ("Einstein AI", "🧠"),
    ("Gauss.exe", "🦾"),
    ("CurieBot", "👾"),
    ("Feynman AI", "⚙️"),
    ("TeslaMind", "🛰️"),
    ("NoetherBot", "🔬"),
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum LeagueError {
    InvalidWeek,
    InvalidPoints,
    InvalidRecord,
    InvalidRandomInput,
}

pub fn rank(points: u64) -> Value {
    let (name, icon, tier) = match points {
        900.. => ("Đại kiện tướng", "👑", "grandmaster"),
        600..=899 => ("Cao thủ", "💎", "master"),
        350..=599 => ("Chiến binh", "🥇", "warrior"),
        150..=349 => ("Kỳ thủ", "🥈", "strategist"),
        _ => ("Tân binh", "🌱", "rookie"),
    };
    json!({"name":name,"icon":icon,"tier":tier,"points":points})
}

pub fn bots(week: &str) -> Result<Value, LeagueError> {
    let bytes = week.as_bytes();
    if bytes.len() != 8 || &bytes[0..2] != b"20" || &bytes[4..6] != b"-W"
        || !bytes[2..4].iter().all(u8::is_ascii_digit)
        || !bytes[6..8].iter().all(u8::is_ascii_digit)
    {
        return Err(LeagueError::InvalidWeek);
    }
    let week_number = std::str::from_utf8(&bytes[6..8]).map_err(|_| LeagueError::InvalidWeek)?
        .parse::<u8>().map_err(|_| LeagueError::InvalidWeek)?;
    if !(1..=53).contains(&week_number) { return Err(LeagueError::InvalidWeek); }
    let mut seed = week.bytes().fold(0u32, |value, byte| value.wrapping_mul(31).wrapping_add(u32::from(byte)));
    let rows: Vec<Value> = BOTS.iter().map(|(name, avatar)| {
        seed = seed.wrapping_mul(1_664_525).wrapping_add(1_013_904_223);
        json!({"name":name,"points":150 + u64::from(seed % 650),"avatar":avatar})
    }).collect();
    let mut sorted = rows;
    sorted.sort_by(|left, right| {
        right["points"].as_u64().cmp(&left["points"].as_u64())
            .then_with(|| left["name"].as_str().cmp(&right["name"].as_str()))
    });
    Ok(Value::Array(sorted))
}

pub fn resolve_match(
    points: u64,
    matches: u32,
    wins: u32,
    opponent_roll: f64,
    result_roll: f64,
    week: &str,
) -> Result<Value, LeagueError> {
    if points > 1_000_000 { return Err(LeagueError::InvalidPoints); }
    if wins > matches || matches >= 1_000_000 { return Err(LeagueError::InvalidRecord); }
    if !opponent_roll.is_finite() || !result_roll.is_finite()
        || !(0.0..1.0).contains(&opponent_roll) || !(0.0..1.0).contains(&result_roll)
    {
        return Err(LeagueError::InvalidRandomInput);
    }
    let bot_list = bots(week)?;
    let opponent_index = (opponent_roll * BOTS.len() as f64).floor() as usize;
    let opponent = &bot_list[opponent_index];
    let won = result_roll < 0.62;
    let gain = if won { 30u64 } else { 12u64 };
    let next_points = points.saturating_add(gain).min(1_000_000);
    let next_wins = wins + if won { 1 } else { 0 };
    Ok(json!({
        "won":won,"gain":gain,"points":next_points,
        "matches":matches+1,"wins":next_wins,
        "opponent":opponent,
        "before":rank(points),"after":rank(next_points)
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rank_thresholds_are_exact() {
        assert_eq!(rank(149)["tier"], "rookie");
        assert_eq!(rank(150)["tier"], "strategist");
        assert_eq!(rank(350)["tier"], "warrior");
        assert_eq!(rank(600)["tier"], "master");
        assert_eq!(rank(900)["tier"], "grandmaster");
    }

    #[test]
    fn weekly_bots_are_deterministic_and_sorted() {
        let first = bots("2026-W48").unwrap();
        let second = bots("2026-W48").unwrap();
        assert_eq!(first, second);
        assert_eq!(first.as_array().unwrap().len(), 7);
        for pair in first.as_array().unwrap().windows(2) {
            assert!(pair[0]["points"].as_u64() >= pair[1]["points"].as_u64());
        }
        assert!(bots("2026-W00").is_err());
    }

    #[test]
    fn match_result_updates_record_and_uses_rust_rank_rules() {
        let result = resolve_match(340, 4, 2, 0.5, 0.1, "2026-W48").unwrap();
        assert_eq!(result["won"], true);
        assert_eq!(result["points"], 370);
        assert_eq!(result["matches"], 5);
        assert_eq!(result["wins"], 3);
        assert_eq!(result["before"]["tier"], "strategist");
        assert_eq!(result["after"]["tier"], "warrior");
        assert!(resolve_match(0, 1, 2, 0.5, 0.1, "2026-W48").is_err());
        assert!(resolve_match(0, 0, 0, 1.0, 0.1, "2026-W48").is_err());
    }
}
