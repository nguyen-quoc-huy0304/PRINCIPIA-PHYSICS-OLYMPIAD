//! Study orchestration facade for adaptive study plans and spaced repetition.
use crate::learning::{self, LearnerContext, LearningError, LearningPlan, ReviewSchedule};

/// Build a validated study plan from the learner's current state.
pub fn build_plan(context: &LearnerContext) -> Result<LearningPlan, LearningError> {
    learning::recommend(context)
}

/// Calculate the next review interval after a recall attempt.
pub fn next_review(
    quality: u8,
    previous_interval_days: u32,
    ease_factor: f64,
) -> Result<ReviewSchedule, LearningError> {
    learning::schedule_review(quality, previous_interval_days, ease_factor)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::learning::LearningGoal;

    fn learner() -> LearnerContext {
        LearnerContext {
            goal: None,
            percent: Some(42.0),
            error_count: 3,
            phase: "practice".into(),
            energy: 2,
            confidence: 3,
            topic: "Cơ học Newton".into(),
        }
    }

    #[test]
    fn recovery_plan_requires_an_independent_retry() {
        let plan = build_plan(&learner()).unwrap();
        assert_eq!(plan.goal, LearningGoal::Recover);
        assert_eq!(plan.next_action, "retry_error");
        assert!(plan.steps[2].contains("Lặp lại"));
    }

    #[test]
    fn strong_learner_gets_olympiad_difficulty() {
        let mut context = learner();
        context.goal = Some(LearningGoal::Olympiad);
        context.percent = Some(92.0);
        context.error_count = 0;
        context.energy = 3;
        context.confidence = 5;
        let plan = build_plan(&context).unwrap();
        assert_eq!(plan.difficulty, 4);
        assert_eq!(plan.focus_minutes, 30);
    }

    #[test]
    fn failed_recall_is_scheduled_for_next_day() {
        let schedule = next_review(1, 20, 2.5).unwrap();
        assert_eq!(schedule.due_after_days, 1);
        assert!(!schedule.mastered);
    }

    #[test]
    fn invalid_review_quality_is_rejected() {
        assert_eq!(next_review(6, 1, 2.5), Err(LearningError::InvalidQuality));
    }
}
