//! Deterministic game-economy transitions for PRINCIPIA Gameverse.
use serde_json::{json, Map, Value};

fn number(value: Option<&Value>) -> u64 {
    value.and_then(Value::as_u64).unwrap_or(0)
}

fn ensure_object<'a>(value: &'a mut Value, key: &str) -> &'a mut Map<String, Value> {
    if !value.get(key).is_some_and(Value::is_object) {
        value[key] = Value::Object(Map::new());
    }
    value.get_mut(key).and_then(Value::as_object_mut).expect("object initialized")
}

fn ensure_array<'a>(value: &'a mut Value, key: &str) -> &'a mut Vec<Value> {
    if !value.get(key).is_some_and(Value::is_array) {
        value[key] = Value::Array(Vec::new());
    }
    value.get_mut(key).and_then(Value::as_array_mut).expect("array initialized")
}

fn contains(array: &[Value], value: &Value) -> bool {
    array.iter().any(|item| item == value)
}

fn add_nested(state: &mut Value, object: &str, field: &str, amount: u64) {
    let map = ensure_object(state, object);
    let current = number(map.get(field));
    map.insert(field.to_owned(), json!(current.saturating_add(amount)));
}

fn award(state: &mut Value, xp: u64, coins: u64) {
    let total_xp = number(state.get("xp")).saturating_add(xp);
    state["xp"] = json!(total_xp);
    let total_coins = number(state.get("coins")).saturating_add(coins);
    state["coins"] = json!(total_coins);
    let level = 1 + ((total_xp as f64 / 120.0).sqrt().floor() as u64);
    state["level"] = json!(level);
    add_nested(state, "season", "xp", xp);

    let pet = ensure_object(state, "pet");
    let mut pet_xp = number(pet.get("xp")).saturating_add(xp);
    let mut pet_level = number(pet.get("level")).max(1);
    while pet_level < 10_000 && pet_xp >= pet_level.saturating_mul(100) {
        pet_xp -= pet_level.saturating_mul(100);
        pet_level += 1;
    }
    let pet = ensure_object(state, "pet");
    pet.insert("xp".to_owned(), json!(pet_xp));
    pet.insert("level".to_owned(), json!(pet_level));
    pet.insert("form".to_owned(), json!((pet_level / 3).min(4)));
}

fn add_material(state: &mut Value, id: &str, amount: u64) -> Result<(), &'static str> {
    if !matches!(id, "wood" | "crystal" | "gear" | "star" | "energy") {
        return Err("unknown material");
    }
    add_nested(state, "materials", id, amount);
    Ok(())
}

fn push_unique(state: &mut Value, field: &str, value: Value) -> bool {
    let values = ensure_array(state, field);
    if contains(values, &value) { return false; }
    values.push(value);
    true
}

fn valid_day(day: &str) -> bool {
    crate::season::week_key(day).is_ok()
}

fn unlock(state: &mut Value, id: &str) -> Result<bool, &'static str> {
    let cost = match id {
        "camp" | "stadium" => 0,
        "city" => 120,
        "craft" => 180,
        "arena" => 250,
        "space" => 400,
        _ => return Err("unknown game zone"),
    };
    if contains(ensure_array(state, "unlocked"), &json!(id)) { return Ok(false); }
    let coins = number(state.get("coins"));
    if coins < cost { return Ok(false); }
    state["coins"] = json!(coins - cost);
    ensure_array(state, "unlocked").push(json!(id));
    Ok(true)
}

fn craft(state: &mut Value, id: &str) -> Result<bool, &'static str> {
    let costs: &[(&str, u64)] = match id {
        "desk" => &[("wood", 3)],
        "lamp" => &[("crystal", 2), ("gear", 1)],
        "portal" => &[("wood", 2), ("crystal", 3), ("gear", 2)],
        "trophy" => &[("star", 3), ("gear", 1)],
        "rocket" => &[("gear", 3), ("crystal", 5), ("energy", 2)],
        _ => return Err("unknown recipe"),
    };
    if contains(ensure_array(state, "crafted"), &json!(id)) { return Ok(false); }
    let materials = state.get("materials").and_then(Value::as_object);
    if costs.iter().any(|(key, amount)| number(materials.and_then(|map| map.get(*key))) < *amount) {
        return Ok(false);
    }
    for (key, amount) in costs {
        let materials = ensure_object(state, "materials");
        let current = number(materials.get(*key));
        materials.insert((*key).to_owned(), json!(current - amount));
    }
    ensure_array(state, "crafted").push(json!(id));
    award(state, 20, 5);
    Ok(true)
}

fn complete_daily(state: &mut Value, id: &str, day: &str, bonus: u64, material: &str) -> Result<bool, &'static str> {
    if id.is_empty() || id.len() > 80 || !valid_day(day) { return Err("invalid daily quest"); }
    if !matches!(material, "wood" | "crystal" | "gear" | "star" | "energy") { return Err("unknown material"); }
    let daily = ensure_object(state, "daily");
    if daily.get("date").and_then(Value::as_str) != Some(day) {
        daily.insert("date".to_owned(), json!(day));
        daily.insert("done".to_owned(), json!([]));
    }
    let done = daily.get("done").and_then(Value::as_array).cloned().unwrap_or_default();
    if contains(&done, &json!(id)) { return Ok(false); }
    ensure_array(state.get_mut("daily").expect("daily initialized"), "done").push(json!(id));
    award(state, 30, 50_u64.saturating_add(bonus));
    add_material(state, material, 1)?;
    Ok(true)
}

fn quiz_result(state: &mut Value, score: u64, total: u64, mode: &str) -> Result<Value, &'static str> {
    if total == 0 || total > 100 || score > total { return Err("invalid quiz result"); }
    let win = score.saturating_mul(10) >= total.saturating_mul(6);
    let played = number(state.get("played")).saturating_add(1);
    let wins = number(state.get("win")).saturating_add(score);
    state["played"] = json!(played);
    state["win"] = json!(wins);
    if mode == "rank" {
        let rank = ensure_object(state, "rank");
        let rating = number(rank.get("rating"));
        let next_rating = if win {
            rating.saturating_add(24).saturating_add(score.saturating_mul(5))
        } else { rating.saturating_sub(8) };
        rank.insert("rating".to_owned(), json!(next_rating));
        let wins = number(rank.get("wins")) + u64::from(win);
        let losses = number(rank.get("losses")) + u64::from(!win);
        rank.insert("wins".to_owned(), json!(wins));
        rank.insert("losses".to_owned(), json!(losses));
    }
    let xp = score.saturating_mul(35).saturating_add(20);
    let coins = score.saturating_mul(25);
    award(state, xp, coins);
    let rating = number(state.get("rank").and_then(|rank| rank.get("rating")));
    let rank_name = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"]
        [((rating / 150).min(5)) as usize];
    Ok(json!({"win":win,"xp":xp,"coins":coins,"rating":rating,"rank":rank_name}))
}

fn claim_pass(state: &mut Value, tier: u64) -> Result<bool, &'static str> {
    if tier == 0 || tier > 100 { return Err("invalid season tier"); }
    let season = ensure_object(state, "season");
    let claimed = season.get("claimed").and_then(Value::as_array).cloned().unwrap_or_default();
    let key = tier.to_string();
    if contains(&claimed, &json!(key)) || number(season.get("xp")) < tier.saturating_mul(100) { return Ok(false); }
    ensure_array(state.get_mut("season").expect("season initialized"), "claimed").push(json!(key));
    award(state, 0, 40_u64.saturating_add(tier.saturating_mul(5)));
    add_material(state, "crystal", 1)?;
    Ok(true)
}

fn buy_skill(state: &mut Value, id: &str) -> Result<bool, &'static str> {
    let cost = match id { "focus" => 80, "recall" => 100, "craft" => 120, "explorer" => 150, _ => return Err("unknown skill") };
    let skills = ensure_object(state, "skills");
    if skills.get(id).and_then(Value::as_bool) == Some(true) { return Ok(false); }
    let coins = number(state.get("coins"));
    if coins < cost { return Ok(false); }
    state["coins"] = json!(coins - cost);
    ensure_object(state, "skills").insert(id.to_owned(), json!(true));
    award(state, 15, 0);
    Ok(true)
}

fn treasure(state: &mut Value, day: &str, correct: bool) -> Result<bool, &'static str> {
    if !valid_day(day) { return Err("invalid treasure date"); }
    let events = ensure_object(state, "events");
    if events.get("treasure").and_then(Value::as_str) == Some(day) || !correct { return Ok(false); }
    ensure_object(state, "events").insert("treasure".to_owned(), json!(day));
    let count = number(state.get("treasures")).saturating_add(1);
    state["treasures"] = json!(count);
    add_material(state, "star", 1)?;
    award(state, 60, 90);
    Ok(true)
}

fn random_event(state: &mut Value, day: &str, event_id: &str) -> Result<bool, &'static str> {
    if !valid_day(day) { return Err("invalid event date"); }
    let (material, amount) = match event_id {
        "meteor" => ("star", 2),
        "materials" => ("wood", 3),
        "energy" => ("energy", 2),
        _ => return Err("unknown random event"),
    };
    let events = ensure_object(state, "events");
    if events.get("random").and_then(Value::as_str) == Some(day) { return Ok(false); }
    ensure_object(state, "events").insert("random".to_owned(), json!(day));
    add_material(state, material, amount)?;
    award(state, 20, 35);
    Ok(true)
}

fn contribute_guild(state: &mut Value) -> bool {
    let xp = number(state.get("xp"));
    if xp < 50 { return false; }
    state["xp"] = json!(xp - 50);
    add_nested(state, "guild", "contrib", 50);
    let new_xp = number(state.get("xp"));
    state["level"] = json!(1 + ((new_xp as f64 / 120.0).sqrt().floor() as u64));
    true
}

fn learning_activity(state: &mut Value, kind: &str, amount: u64) -> Result<(), &'static str> {
    if !matches!(kind, "practice" | "recall" | "explore" | "teach" | "review") {
        return Err("unsupported learning activity");
    }
    let amount = amount.min(10);
    award(state, amount.saturating_mul(5), amount.saturating_mul(2));
    Ok(())
}

pub fn apply_action(state_json: &str, action_json: &str) -> Result<String, &'static str> {
    if state_json.len() > 64 * 1024 || action_json.len() > 4096 { return Err("gameverse payload exceeds size limit"); }
    let mut state: Value = serde_json::from_str(state_json).map_err(|_| "invalid gameverse state JSON")?;
    let action: Value = serde_json::from_str(action_json).map_err(|_| "invalid gameverse action JSON")?;
    if !state.is_object() || !action.is_object() { return Err("gameverse state and action must be objects"); }
    let kind = action.get("type").and_then(Value::as_str).ok_or("gameverse action type is required")?;
    let result = match kind {
        "award" => {
            let xp = number(action.get("xp"));
            let coins = number(action.get("coins"));
            award(&mut state, xp, coins);
            json!({"ok":true,"xp":xp,"coins":coins})
        }
        "unlock" => json!({"ok":unlock(&mut state, action.get("id").and_then(Value::as_str).ok_or("zone id is required")?)?}),
        "craft" => json!({"ok":craft(&mut state, action.get("id").and_then(Value::as_str).ok_or("recipe id is required")?)?}),
        "daily" => json!({"ok":complete_daily(
            &mut state,
            action.get("id").and_then(Value::as_str).ok_or("quest id is required")?,
            action.get("day").and_then(Value::as_str).ok_or("quest day is required")?,
            number(action.get("bonus")),
            action.get("material").and_then(Value::as_str).ok_or("reward material is required")?,
        )?}),
        "quizResult" => quiz_result(
            &mut state, number(action.get("score")), number(action.get("total")),
            action.get("mode").and_then(Value::as_str).unwrap_or("quick"),
        )?,
        "claimPass" => json!({"ok":claim_pass(&mut state, number(action.get("tier")))?}),
        "buySkill" => json!({"ok":buy_skill(&mut state, action.get("id").and_then(Value::as_str).ok_or("skill id is required")?)?}),
        "treasure" => json!({"ok":treasure(
            &mut state,
            action.get("day").and_then(Value::as_str).ok_or("treasure day is required")?,
            action.get("correct").and_then(Value::as_bool).unwrap_or(false),
        )?}),
        "randomEvent" => json!({"ok":random_event(
            &mut state,
            action.get("day").and_then(Value::as_str).ok_or("event day is required")?,
            action.get("eventId").and_then(Value::as_str).ok_or("event id is required")?,
        )?}),
        "guildContribute" => json!({"ok":contribute_guild(&mut state)}),
        "learningActivity" => {
            learning_activity(&mut state, action.get("kind").and_then(Value::as_str).ok_or("activity kind is required")?,
                number(action.get("amount")))?;
            json!({"ok":true})
        }
        _ => return Err("unsupported gameverse action"),
    };
    serde_json::to_string(&json!({"state":state,"result":result}))
        .map_err(|_| "could not encode gameverse state")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn state() -> Value {
        json!({
            "xp":0,"coins":0,"level":1,"unlocked":["camp","stadium"],
            "materials":{"wood":3,"crystal":5,"gear":3,"star":3,"energy":2},
            "crafted":[],"played":0,"win":0,"rank":{"rating":0,"wins":0,"losses":0},
            "season":{"id":"S1","xp":0,"claimed":[]},"pet":{"name":"Nova","level":1,"xp":0,"form":0},
            "daily":{"date":"2026-11-25","done":[]},"events":{},"skills":{},"guild":{"contrib":0}
        })
    }

    fn apply(state: &Value, action: Value) -> Value {
        let result = apply_action(&state.to_string(), &action.to_string()).unwrap();
        serde_json::from_str(&result).unwrap()
    }

    #[test]
    fn awards_update_level_season_and_pet() {
        let result = apply(&state(), json!({"type":"award","xp":240,"coins":15}));
        let next = &result["state"];
        assert_eq!(next["xp"], 240);
        assert_eq!(next["coins"], 15);
        assert_eq!(next["level"], 2);
        assert_eq!(next["season"]["xp"], 240);
        assert_eq!(next["pet"]["xp"], 40);
        assert_eq!(next["pet"]["level"], 2);
    }

    #[test]
    fn crafting_is_atomic_and_awards_once() {
        let original = state();
        let result = apply(&original, json!({"type":"craft","id":"desk"}));
        assert_eq!(result["result"]["ok"], true);
        assert_eq!(result["state"]["materials"]["wood"], 0);
        assert_eq!(result["state"]["xp"], 20);
        let repeated = apply(&result["state"], json!({"type":"craft","id":"desk"}));
        assert_eq!(repeated["result"]["ok"], false);
        assert_eq!(repeated["state"]["xp"], 20);
    }

    #[test]
    fn rank_quiz_result_updates_rating_and_reward() {
        let result = apply(&state(), json!({"type":"quizResult","score":4,"total":5,"mode":"rank"}));
        assert_eq!(result["result"]["win"], true);
        assert_eq!(result["state"]["rank"]["rating"], 44);
        assert_eq!(result["state"]["xp"], 160);
        assert_eq!(result["state"]["coins"], 100);
    }

    #[test]
    fn daily_rewards_are_idempotent_and_reset_on_new_day() {
        let original = state();
        let action = json!({"type":"daily","id":"study","day":"2026-11-25","bonus":0,"material":"wood"});
        let first = apply(&original, action.clone());
        let second = apply(&first["state"], action);
        assert_eq!(first["result"]["ok"], true);
        assert_eq!(second["result"]["ok"], false);
        assert_eq!(second["state"]["xp"], 30);
    }

    #[test]
    fn rejects_unknown_actions_and_invalid_days() {
        assert!(apply_action(&state().to_string(), r#"{"type":"other"}"#).is_err());
        assert!(apply_action(&state().to_string(), r#"{"type":"daily","id":"x","day":"2026-02-30","bonus":0,"material":"wood"}"#).is_err());
    }
}
