//! Rust-owned reward and ranked-result rules for PRINCIPIA Gameverse.
use serde_json::{json, Value};
use std::collections::BTreeMap;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameverseError { InvalidScore, InvalidMode, InvalidRating, UnknownRecipe, AlreadyCrafted, InsufficientMaterials, InvalidInventory }

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
