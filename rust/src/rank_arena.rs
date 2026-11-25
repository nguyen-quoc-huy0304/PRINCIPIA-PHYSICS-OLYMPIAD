//! Ranked Arena match outcomes, MMR and tier progression.
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

fn count(value: Option<&Value>) -> u64 {
    value.and_then(Value::as_u64).unwrap_or(0)
}

pub fn tier(rp: u64) -> Value {
    let index = TIERS.iter().enumerate().skip(1)
        .filter(|(_, (_, _, _, minimum))| rp >= *minimum)
        .map(|(index, _)| index).last().unwrap_or(0);
    let (id, name, icon, minimum) = TIERS[index];
    let next = TIERS.get(index + 1);
    let progress = next.map(|next| (rp.saturating_sub(minimum) as f64 / (next.3 - minimum) as f64).clamp(0.0, 1.0)).unwrap_or(1.0);
    let division = if next.is_some() {
        Some(if progress >= 2.0 / 3.0 { "I" } else if progress >= 1.0 / 3.0 { "II" } else { "III" })
    } else { None };
    let label = division.map(|value| format!("{name} {value}")).unwrap_or_else(|| name.to_owned());
    json!({
        "id":id,"name":name,"icon":icon,"min":minimum,
        "next":next.map(|(id,name,icon,min)|json!({"id":id,"name":name,"icon":icon,"min":min})),
        "division":division,"label":label,"progress":progress
    })
}

pub fn finish_match(state_json: &str, match_json: &str) -> Result<String, &'static str> {
    if state_json.len() > 64 * 1024 || match_json.len() > 4096 {
        return Err("rank arena payload exceeds size limit");
    }
    let mut state: Value = serde_json::from_str(state_json).map_err(|_| "invalid rank state JSON")?;
    let input: Value = serde_json::from_str(match_json).map_err(|_| "invalid match JSON")?;
    if !state.is_object() || !input.is_object() { return Err("rank state and match must be objects"); }
    let correct = count(input.get("correct"));
    let rival_correct = count(input.get("rivalCorrect"));
    let best_combo = count(input.get("bestCombo"));
    let mode = input.get("mode").and_then(Value::as_str).ok_or("match mode is required")?;
    if !matches!(mode, "accuracy" | "combo" | "balanced") || correct > 5 ||
        !(1..=5).contains(&rival_correct) || best_combo > 5 {
        return Err("rank match values are outside supported bounds");
    }
    let rival = input.get("rival").and_then(Value::as_str).filter(|value| !value.trim().is_empty() && value.len() <= 80)
        .ok_or("rival name is required")?;
    let date = input.get("date").and_then(Value::as_str).filter(|value| value.len() <= 40)
        .ok_or("match date is required")?;
    let accuracy = correct as f64 / 5.0;
    let mode_bonus = if mode == "combo" { best_combo as f64 * 0.025 } else { 0.0 };
    let rival_score = rival_correct as f64 / 5.0 + if mode == "accuracy" { 0.02 } else { 0.0 };
    let user_score = accuracy + mode_bonus;
    let won = user_score > rival_score || (user_score == rival_score && correct >= 4);
    let rp_change: i64 = if won { 20 } else { -8 };
    let rp = count(state.get("rp"));
    let next_rp = if won { rp.saturating_add(20) } else { rp.saturating_sub(8) };
    let mmr = count(state.get("mmr")).clamp(100, 3000);
    let performance = ((accuracy - 0.5) * 20.0).round() as i64;
    let mmr_delta = (if won { 18 } else { -12 }) + performance;
    let next_mmr = (mmr as i64 + mmr_delta).clamp(100, 3000) as u64;
    let daily_matches = count(state.get("dailyMatches")).saturating_add(1);
    let wins = count(state.get("wins")).saturating_add(if won { 1 } else { 0 });
    let losses = count(state.get("losses")).saturating_add(if won { 0 } else { 1 });
    state["rp"] = json!(next_rp);
    state["mmr"] = json!(next_mmr);
    state["dailyMatches"] = json!(daily_matches);
    state["wins"] = json!(wins);
    state["losses"] = json!(losses);
    let record = json!({
        "date":date,"rival":rival,"mode":mode,"correct":correct,"total":5,
        "rivalCorrect":rival_correct,"result":if won {"win"} else {"loss"},
        "rpChange":rp_change,"bestCombo":best_combo
    });
    if !state.get("matches").is_some_and(Value::is_array) { state["matches"] = json!([]); }
    let matches = state.get_mut("matches").and_then(Value::as_array_mut).ok_or("matches must be an array")?;
    matches.push(record.clone());
    if matches.len() > 100 { matches.drain(0..matches.len()-100); }
    let result = json!({
        "won":won,"correct":correct,"rivalCorrect":rival_correct,
        "rpChange":rp_change,"rp":next_rp,"mmr":next_mmr,
        "dailyMatches":daily_matches,"wins":wins,"losses":losses,
        "record":record,"tier":tier(next_rp)
    });
    serde_json::to_string(&json!({"state":state,"result":result}))
        .map_err(|_| "could not encode ranked match result")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn state() -> Value {
        json!({"rp":100,"mmr":500,"dailyMatches":0,"wins":0,"losses":0,"matches":[]})
    }

    #[test]
    fn ranked_match_updates_rp_mmr_and_history() {
        let result: Value = serde_json::from_str(&finish_match(
            &state().to_string(),
            r#"{"rival":"NOVA","mode":"accuracy","correct":5,"rivalCorrect":3,"bestCombo":5,"date":"2026-11-25T12:00:00Z"}"#
        ).unwrap()).unwrap();
        assert_eq!(result["result"]["won"], true);
        assert_eq!(result["state"]["rp"], 120);
        assert_eq!(result["state"]["mmr"], 538);
        assert_eq!(result["state"]["wins"], 1);
        assert_eq!(result["state"]["matches"].as_array().unwrap().len(), 1);
    }

    #[test]
    fn loss_clamps_rp_and_mmr_to_minimum() {
        let mut original = state();
        original["rp"] = json!(0);
        original["mmr"] = json!(100);
        let result: Value = serde_json::from_str(&finish_match(
            &original.to_string(),
            r#"{"rival":"ZERO","mode":"balanced","correct":0,"rivalCorrect":5,"bestCombo":0,"date":"2026-11-25"}"#
        ).unwrap()).unwrap();
        assert_eq!(result["result"]["won"], false);
        assert_eq!(result["state"]["rp"], 0);
        assert_eq!(result["state"]["mmr"], 100);
    }

    #[test]
    fn tiers_preserve_division_boundaries() {
        assert_eq!(tier(100)["label"], "Bạc III");
        assert_eq!(tier(150)["label"], "Bạc II");
        assert_eq!(tier(200)["label"], "Bạc I");
        assert_eq!(tier(1900)["label"], "Thách đấu");
    }

    #[test]
    fn rejects_invalid_match_contracts() {
        assert!(finish_match(&state().to_string(), r#"{"rival":"x","mode":"other","correct":5,"rivalCorrect":3,"bestCombo":0,"date":"today"}"#).is_err());
        assert!(finish_match(&state().to_string(), r#"{"rival":"x","mode":"combo","correct":9,"rivalCorrect":3,"bestCombo":0,"date":"today"}"#).is_err());
    }
}
