//! Rust-owned reward and ranked-result rules for PRINCIPIA Gameverse.
use serde_json::{json, Value};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameverseError { InvalidScore, InvalidMode, InvalidRating, UnknownRecipe, AlreadyCrafted, InsufficientMaterials, InvalidInventory, InvalidPetProgress, UnknownZone, AlreadyUnlocked, InsufficientCoins, UnknownSkill, AlreadyOwned, InsufficientSeasonXp, AlreadyClaimed }

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
    Ok(json!({"coins":coins-cost,"skills":next_skills,"skillId":skill_id,"cost":cost}))
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
