//! Ranked Arena rules. Browser code owns presentation and persistence only.
use serde_json::{json, Value};

const TIERS: [(&str, &str, &str, u64); 8] = [
    ("bronze", "Đồng", "🥉", 0),
    ("silver", "Bạc", "🥈", 100),
    ("gold", "Vàng", "🥇", 250),
    ("platinum", "Bạch kim", "💠", 450),
    ("diamond", "Kim cương", "💎", 700),
    ("elite", "Tinh anh", "⚔️", 1000),
    ("master", "Cao thủ", "👑", 1400),
    ("challenger", "Thách đấu", "🏆", 1900),
];

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ArenaError { InvalidRating, InvalidScore, InvalidMode, InvalidMission }

pub fn tier(rp: u64) -> Value {
    let index = TIERS.iter().rposition(|tier| rp >= tier.3).unwrap_or(0);
    let (id, name, icon, minimum) = TIERS[index];
    let next = TIERS.get(index + 1);
    let progress = next.map(|tier| {
        (rp.saturating_sub(minimum) as f64 / (tier.3 - minimum) as f64).clamp(0.0, 1.0)
    }).unwrap_or(1.0);
    let division = if next.is_some() {
        Some(if progress >= 2.0 / 3.0 { "I" } else if progress >= 1.0 / 3.0 { "II" } else { "III" })
    } else { None };
    json!({
        "id": id, "name": name, "icon": icon, "minimum": minimum,
        "next": next.map(|tier| json!({"id":tier.0,"name":tier.1,"minimum":tier.3})),
        "division": division,
        "label": division.map(|value| format!("{name} {value}")).unwrap_or_else(|| name.to_owned()),
        "progress": progress,
        "rpToNext": next.map(|tier| tier.3.saturating_sub(rp)).unwrap_or(0)
    })
}

pub fn resolve_match(
    rp: u64,
    mmr: u32,
    correct: u8,
    rival_correct: u8,
    best_combo: u8,
    mode: &str,
) -> Result<Value, ArenaError> {
    if rp > 1_000_000 || !(100..=3000).contains(&mmr) { return Err(ArenaError::InvalidRating); }
    if correct > 5 || rival_correct > 5 || best_combo > 5 { return Err(ArenaError::InvalidScore); }
    if !matches!(mode, "balanced" | "accuracy" | "combo") { return Err(ArenaError::InvalidMode); }
    let accuracy = correct as f64 / 5.0;
    let mode_bonus = if mode == "combo" { best_combo as f64 * 0.025 } else { 0.0 };
    let user_score = accuracy + mode_bonus;
    let rival_score = rival_correct as f64 / 5.0 + if mode == "accuracy" { 0.02 } else { 0.0 };
    let won = user_score > rival_score || (user_score == rival_score && correct >= 4);
    let rp_change: i64 = if won { 20 } else { -8 };
    let next_rp = if won { rp.saturating_add(20).min(1_000_000) } else { rp.saturating_sub(8) };
    let mmr_delta = if won { 18 } else { -12 } + ((accuracy - 0.5) * 20.0).round() as i32;
    let next_mmr = (mmr as i32 + mmr_delta).clamp(100, 3000) as u32;
    Ok(json!({
        "won": won, "rp": next_rp, "rpChange": rp_change,
        "mmr": next_mmr, "userScore": user_score, "rivalScore": rival_score,
        "tier": tier(next_rp)
    }))
}

pub fn mission_reward(id: &str, progress: u32, already_claimed: bool) -> Result<Value, ArenaError> {
    let (target, reward) = match id {
        "daily-1" => (1, 15), "daily-3" => (3, 25), "wins-2" => (2, 30),
        "weekly-play5" => (5, 40), "weekly-win3" => (3, 60),
        _ => return Err(ArenaError::InvalidMission),
    };
    let allowed = progress >= target && !already_claimed;
    Ok(json!({"allowed":allowed,"target":target,"reward":if allowed {reward} else {0}}))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tier_boundaries_and_divisions_match_arena_rules() {
        assert_eq!(tier(99)["id"], "bronze");
        assert_eq!(tier(100)["label"], "Bạc III");
        assert_eq!(tier(150)["label"], "Bạc II");
        assert_eq!(tier(200)["label"], "Bạc I");
        assert_eq!(tier(1900)["id"], "challenger");
        assert_eq!(tier(1900)["progress"], 1.0);
    }

    #[test]
    fn match_resolution_clamps_ratings_and_respects_mode() {
        let win = resolve_match(0, 100, 5, 4, 5, "balanced").unwrap();
        assert_eq!(win["won"], true);
        assert_eq!(win["rp"], 20);
        assert_eq!(win["mmr"], 128);
        let loss = resolve_match(5, 2999, 1, 5, 1, "accuracy").unwrap();
        assert_eq!(loss["won"], false);
        assert_eq!(loss["rp"], 0);
        assert_eq!(loss["mmr"], 3000);
        assert!(resolve_match(0, 500, 6, 0, 0, "balanced").is_err());
    }

    #[test]
    fn mission_claims_are_validated_and_one_time() {
        assert_eq!(mission_reward("daily-3", 3, false).unwrap()["reward"], 25);
        assert_eq!(mission_reward("daily-3", 3, true).unwrap()["allowed"], false);
        assert_eq!(mission_reward("daily-3", 2, false).unwrap()["allowed"], false);
        assert!(mission_reward("unknown", 10, false).is_err());
    }
}
