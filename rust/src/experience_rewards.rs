//! PRINCIPIA learning experience rewards.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RewardError { UnknownActivity }

pub fn experience_reward(activity: &str) -> Result<u32, RewardError> {
    match activity {
        "focus-session" | "lesson-completed" | "ai-transcript" => Ok(10),
        "lesson-review" | "inline-quiz-correct" => Ok(15),
        "ai-quiz-generated" => Ok(20),
        "assignment-submitted" => Ok(30),
        "lesson-mastered" => Ok(50),
        _ => Err(RewardError::UnknownActivity),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reward_catalog_has_explicit_values() {
        assert_eq!(experience_reward("focus-session"), Ok(10));
        assert_eq!(experience_reward("lesson-review"), Ok(15));
        assert_eq!(experience_reward("ai-quiz-generated"), Ok(20));
        assert_eq!(experience_reward("assignment-submitted"), Ok(30));
        assert_eq!(experience_reward("lesson-mastered"), Ok(50));
        assert!(experience_reward("unknown").is_err());
    }
}
