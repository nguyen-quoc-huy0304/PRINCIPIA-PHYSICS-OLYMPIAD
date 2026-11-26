//! Rust-owned reward and ranked-result rules for PRINCIPIA Gameverse.
use serde_json::{json, Value};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameverseError { InvalidScore, InvalidMode, InvalidRating, UnknownRecipe, AlreadyCrafted, InsufficientMaterials, InvalidInventory, InvalidPetProgress, UnknownZone, AlreadyUnlocked, InsufficientCoins, UnknownSkill, AlreadyOwned, InsufficientSeasonXp, AlreadyClaimed, UnknownDailyQuest, InvalidRandomInput, InvalidQuestionCatalog }

pub fn quiz_reward(correct: u32, total: u32, mode: &str, rating: u64) -> Result<Value, GameverseError> {
    if total == 0 || total > 200 || correct > total { return Err(GameverseError::InvalidScore); }
    if !matches!(mode, "quick" | "rank") { return Err(GameverseError::InvalidMode); }
    if rating > 1_000_000 { return Err(GameverseError::InvalidRating); }

    let passed = u64::from(correct) * 100 >= u64::from(total) * 60;
    let xp = correct.saturating_mul(35).saturating_add(20);
    let coins = correct.saturating_mul(25);
    let rank_delta: i64 = if mode == "rank" {
        if passed { 24 + i64::from(correct) * 5 } else { -8 }
    } else { 0 };
    let next_rating = if rank_delta >= 0 {
        rating.saturating_add(rank_delta as u64).min(1_000_000)
    } else {
        rating.saturating_sub(rank_delta.unsigned_abs())
    };
    let tiers = ["Bronze", "Silver", "Gold", "Platinum", "Diamond", "Master"];
    let rank_name = tiers[((next_rating / 150).min(5)) as usize];

    Ok(json!({
        "passed": passed,
        "xp": xp,
        "coins": coins,
        "rankDelta": rank_delta,
        "rating": next_rating,
        "rankName": rank_name
    }))
}


pub fn select_quiz_questions(questions: &[Value], mode: &str, seed: u64) -> Result<Value, GameverseError> {
    if !matches!(mode, "quick" | "rank") { return Err(GameverseError::InvalidMode); }
    let count = if mode == "rank" { 5 } else { 3 };
    if questions.len() < count || questions.len() > 200 { return Err(GameverseError::InvalidQuestionCatalog); }
    for question in questions {
        let prompt = question.get("q").and_then(Value::as_str).filter(|text| !text.trim().is_empty() && text.len() <= 2048);
        let answers = question.get("a").and_then(Value::as_array);
        let correct = question.get("c").and_then(Value::as_u64);
        let Some(options) = answers else { return Err(GameverseError::InvalidQuestionCatalog); };
        if prompt.is_none() || !(2..=8).contains(&options.len()) || correct.map_or(true, |index| index >= options.len() as u64)
            || options.iter().any(|option| option.as_str().map_or(true, |text| text.len() > 1024))
        {
            return Err(GameverseError::InvalidQuestionCatalog);
        }
    }
    let mut indices: Vec<usize> = (0..questions.len()).collect();
    let mut state = if seed == 0 { 0x9E37_79B9_7F4A_7C15 } else { seed };
    for index in (1..indices.len()).rev() {
        state ^= state >> 12;
        state ^= state << 25;
        state ^= state >> 27;
        let random = state.wrapping_mul(0x2545_F491_4F6C_DD1D);
        let target = (random % (index as u64 + 1)) as usize;
        indices.swap(index, target);
    }
    let selected: Vec<Value> = indices.into_iter().take(count).map(|index| questions[index].clone()).collect();
    Ok(json!({"mode":mode,"questions":selected}))
}

pub fn treasure_question(roll: f64) -> Result<Value, GameverseError> {
    if !roll.is_finite() || !(0.0..1.0).contains(&roll) { return Err(GameverseError::InvalidRandomInput); }
    let riddles = [
        ("mercury", "Hành tinh nào gần Mặt Trời nhất?"),
        ("frequency", "Đơn vị đo tần số?"),
        ("gravity", "Lực hút giữ ta trên Trái Đất?"),
    ];
    let (id, question) = riddles[(roll * riddles.len() as f64).floor() as usize];
    Ok(json!({"id":id,"question":question}))
}

pub fn resolve_treasure(id: &str, answer: &str, already_found: bool) -> Result<Value, GameverseError> {
    if already_found { return Err(GameverseError::AlreadyClaimed); }
    let expected = match id {
        "mercury" => "sao thủy",
        "frequency" => "hz",
        "gravity" => "trọng lực",
        _ => return Err(GameverseError::UnknownDailyQuest),
    };
    let found = answer.trim().to_lowercase() == expected;
    Ok(json!({
        "found":found,
        "xp":if found {60} else {0},
        "coins":if found {90} else {0},
        "material":if found {"star"} else {""},
        "amount":if found {1} else {0}
    }))
}

pub fn random_event(roll: f64, already_triggered: bool) -> Result<Value, GameverseError> {
    if already_triggered { return Err(GameverseError::AlreadyClaimed); }
    if !roll.is_finite() || !(0.0..1.0).contains(&roll) { return Err(GameverseError::InvalidRandomInput); }
    let events = [
        ("meteor", "Mưa sao băng", "Thu thập sao +2", "star", 2),
        ("materials", "Hộp vật liệu", "Nhận gỗ +3", "wood", 3),
        ("energy", "Năng lượng bí ẩn", "Nhận energy +2", "energy", 2),
    ];
    let (id, title, description, material, amount) = events[(roll * events.len() as f64).floor() as usize];
    Ok(json!({"id":id,"title":title,"description":description,"material":material,"amount":amount,"xp":20,"coins":35}))
}

pub fn complete_daily_quest(id: &str, done: &[String], material_roll: f64) -> Result<Value, GameverseError> {
    if !matches!(id, "study" | "solve" | "teach" | "explore") { return Err(GameverseError::UnknownDailyQuest); }
    if done.len() > 100 || done.iter().any(|item| item.len() > 64) {
        return Err(GameverseError::InvalidInventory);
    }
    if done.iter().any(|item| item == id) { return Err(GameverseError::AlreadyClaimed); }
    if !material_roll.is_finite() || !(0.0..1.0).contains(&material_roll) {
        return Err(GameverseError::InvalidRandomInput);
    }
    let materials = ["wood", "crystal", "gear", "star", "energy"];
    let material = materials[(material_roll * materials.len() as f64).floor() as usize];
    let mut next_done = done.to_vec();
    next_done.push(id.to_owned());
    Ok(json!({"done":next_done,"xp":30,"coins":50,"material":material,"amount":1}))
}

pub fn unlock_zone(zone_id: &str, coins: u64, unlocked: &[String]) -> Result<Value, GameverseError> {
    let cost = match zone_id {
        "city" => 120, "craft" => 180, "arena" => 250, "space" => 400,
        "camp" | "stadium" => return Err(GameverseError::AlreadyUnlocked),
        _ => return Err(GameverseError::UnknownZone),
    };
    if unlocked.len() > 32 || unlocked.iter().any(|id| id.len() > 64) {
        return Err(GameverseError::InvalidInventory);
    }
    if unlocked.iter().any(|id| id == zone_id) { return Err(GameverseError::AlreadyUnlocked); }
    if coins < cost { return Err(GameverseError::InsufficientCoins); }
    let mut next_unlocked = unlocked.to_vec();
    next_unlocked.push(zone_id.to_owned());
    Ok(json!({"coins":coins-cost,"unlocked":next_unlocked,"zoneId":zone_id,"cost":cost}))
}

pub fn claim_pass(tier: u32, season_xp: u64, claimed: &[String]) -> Result<Value, GameverseError> {
    if !(1..=100).contains(&tier) || claimed.len() > 100 {
        return Err(GameverseError::InvalidInventory);
    }
    let id = tier.to_string();
    if claimed.iter().any(|item| item == &id) { return Err(GameverseError::AlreadyClaimed); }
    let threshold = u64::from(tier) * 100;
    if season_xp < threshold { return Err(GameverseError::InsufficientSeasonXp); }
    let mut next_claimed = claimed.to_vec();
    next_claimed.push(id);
    Ok(json!({"claimed":next_claimed,"coins":40 + u64::from(tier) * 5,"crystals":1,"tier":tier}))
}

pub fn buy_skill(skill_id: &str, coins: u64, skills: &[String]) -> Result<Value, GameverseError> {
    let cost = match skill_id {
        "focus" => 80, "recall" => 100, "craft" => 120, "explorer" => 150,
        _ => return Err(GameverseError::UnknownSkill),
    };
    if skills.len() > 32 || skills.iter().any(|id| id.len() > 64) {
        return Err(GameverseError::InvalidInventory);
    }
    if skills.iter().any(|id| id == skill_id) { return Err(GameverseError::AlreadyOwned); }
    if coins < cost { return Err(GameverseError::InsufficientCoins); }
    let mut next_skills = skills.to_vec();
    next_skills.push(skill_id.to_owned());
    Ok(json!({"coins":coins-cost,"skills":next_skills,"skillId":skill_id,"cost":cost,"xp":15}))
}

pub fn pet_progress(pet_xp: u32, pet_level: u32) -> Result<Value, GameverseError> {
    if pet_xp > 1_000_000 || !(1..=1000).contains(&pet_level) { return Err(GameverseError::InvalidPetProgress); }
    let mut remaining = pet_xp;
    let mut level = pet_level;
    while level < 1000 && remaining >= level.saturating_mul(100) {
        remaining -= level.saturating_mul(100);
        level += 1;
    }
    Ok(json!({"xp":remaining,"level":level,"form":(level / 3).min(4)}))
}

pub fn craft(recipe_id: &str, materials: &BTreeMap<String, u32>, crafted: &[String]) -> Result<Value, GameverseError> {
    let recipe: &[(&str, u32)] = match recipe_id {
        "desk" => &[("wood", 3)],
        "lamp" => &[("crystal", 2), ("gear", 1)],
        "portal" => &[("wood", 2), ("crystal", 3), ("gear", 2)],
        "trophy" => &[("star", 3), ("gear", 1)],
        "rocket" => &[("gear", 3), ("crystal", 5), ("energy", 2)],
        _ => return Err(GameverseError::UnknownRecipe),
    };
    if crafted.len() > 100 || crafted.iter().any(|id| id.len() > 64) {
        return Err(GameverseError::InvalidInventory);
    }
    if crafted.iter().any(|id| id == recipe_id) { return Err(GameverseError::AlreadyCrafted); }
    if materials.keys().any(|key| !matches!(key.as_str(), "wood" | "crystal" | "gear" | "star" | "energy")) {
        return Err(GameverseError::InvalidInventory);
    }
    if recipe.iter().any(|(key, amount)| materials.get(*key).copied().unwrap_or(0) < *amount) {
        return Err(GameverseError::InsufficientMaterials);
    }
    let mut next_materials = materials.clone();
    for (key, amount) in recipe {
        let current = next_materials.get_mut(*key).ok_or(GameverseError::InsufficientMaterials)?;
        *current -= *amount;
    }
    let mut next_crafted = crafted.to_vec();
    next_crafted.push(recipe_id.to_owned());
    Ok(json!({
        "materials": next_materials,
        "crafted": next_crafted,
        "xp": 20,
        "coins": 5,
        "recipeId": recipe_id
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn quiz_question_selection_is_seeded_and_schema_validated() {
        let questions: Vec<Value> = (0..8).map(|index| json!({
            "q":format!("Question {index}"),"a":["A","B","C"],"c":index % 3
        })).collect();
        let first = select_quiz_questions(&questions, "rank", 42).unwrap();
        let second = select_quiz_questions(&questions, "rank", 42).unwrap();
        assert_eq!(first, second);
        assert_eq!(first["questions"].as_array().unwrap().len(), 5);
        assert_eq!(select_quiz_questions(&questions, "quick", 42).unwrap()["questions"].as_array().unwrap().len(), 3);
        assert!(select_quiz_questions(&questions[..2], "quick", 42).is_err());
        assert!(select_quiz_questions(&questions, "unknown", 42).is_err());
    }

    #[test]
    fn treasure_answers_and_random_events_are_rust_validated() {
        let question = treasure_question(0.1).unwrap();
        assert_eq!(question["id"], "mercury");
        assert_eq!(resolve_treasure("mercury", " Sao Thủy ", false).unwrap()["found"], true);
        assert_eq!(resolve_treasure("mercury", "Mars", false).unwrap()["found"], false);
        assert!(resolve_treasure("mercury", "Sao Thủy", true).is_err());
        let event = random_event(0.5, false).unwrap();
        assert_eq!(event["id"], "materials");
        assert_eq!(event["material"], "wood");
        assert!(random_event(0.5, true).is_err());
        assert!(random_event(1.0, false).is_err());
    }

    #[test]
    fn daily_quest_rewards_are_one_time_and_bounded() {
        let done = vec!["study".to_owned()];
        let result = complete_daily_quest("solve", &done, 0.5).unwrap();
        assert_eq!(result["xp"], 30);
        assert_eq!(result["coins"], 50);
        assert_eq!(result["material"], "gear");
        assert!(complete_daily_quest("study", &done, 0.5).is_err());
        assert!(complete_daily_quest("unknown", &done, 0.5).is_err());
        assert!(complete_daily_quest("solve", &done, 1.0).is_err());
    }

    #[test]
    fn zone_unlocks_validate_cost_and_ownership() {
        let unlocked = vec!["camp".to_owned(), "stadium".to_owned()];
        let result = unlock_zone("city", 150, &unlocked).unwrap();
        assert_eq!(result["coins"], 30);
        assert!(result["unlocked"].as_array().unwrap().iter().any(|id| id == "city"));
        assert_eq!(unlock_zone("city", 500, &unlocked).unwrap()["cost"], 120);
        assert!(unlock_zone("city", 10, &unlocked).is_err());
        assert!(unlock_zone("camp", 500, &unlocked).is_err());
    }

    #[test]
    fn season_pass_and_skill_purchases_are_validated() {
        let claimed = vec!["1".to_owned()];
        assert_eq!(claim_pass(2, 200, &claimed).unwrap()["coins"], 50);
        assert!(claim_pass(1, 200, &claimed).is_err());
        assert!(claim_pass(3, 200, &claimed).is_err());
        let skills = vec!["focus".to_owned()];
        assert_eq!(buy_skill("recall", 120, &skills).unwrap()["coins"], 20);
        assert!(buy_skill("focus", 500, &skills).is_err());
        assert!(buy_skill("recall", 10, &skills).is_err());
    }

    #[test]
    fn pet_progression_levels_up_with_bounded_values() {
        let result = pet_progress(300, 1).unwrap();
        assert_eq!(result["level"], 3);
        assert_eq!(result["xp"], 0);
        assert_eq!(result["form"], 1);
        assert!(pet_progress(1_000_001, 1).is_err());
        assert!(pet_progress(0, 0).is_err());
        let capped = pet_progress(1_000_000, 1000).unwrap();
        assert_eq!(capped["level"], 1000);
        assert_eq!(capped["form"], 4);
    }

    #[test]
    fn quick_match_rewards_are_deterministic() {
        let result = quiz_reward(2, 3, "quick", 0).unwrap();
        assert_eq!(result["passed"], true);
        assert_eq!(result["xp"], 90);
        assert_eq!(result["coins"], 50);
        assert_eq!(result["rankDelta"], 0);
    }

    #[test]
    fn ranked_win_and_loss_update_rating() {
        let win = quiz_reward(4, 5, "rank", 100).unwrap();
        assert_eq!(win["passed"], true);
        assert_eq!(win["rankDelta"], 44);
        assert_eq!(win["rating"], 144);
        let loss = quiz_reward(2, 5, "rank", 100).unwrap();
        assert_eq!(loss["passed"], false);
        assert_eq!(loss["rankDelta"], -8);
        assert_eq!(loss["rating"], 92);
    }

    #[test]
    fn rating_and_score_boundaries_are_safe() {
        assert_eq!(quiz_reward(5, 5, "rank", 999_999).unwrap()["rating"], 1_000_000);
        assert_eq!(quiz_reward(0, 5, "rank", 0).unwrap()["rating"], 0);
        assert!(quiz_reward(6, 5, "rank", 0).is_err());
        assert!(quiz_reward(0, 0, "quick", 0).is_err());
        assert!(quiz_reward(1, 5, "unknown", 0).is_err());
        assert!(quiz_reward(1, 5, "quick", 1_000_001).is_err());
    }
}
