//! Validated quiz-attempt scoring for the PRINCIPIA learning engine.

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum QuizError {
    EmptyAttempt,
    TooManyQuestions,
    InvalidQuestion,
    InvalidAnswer,
    InvalidPassThreshold,
}

#[derive(Debug, Clone, PartialEq)]
pub struct QuestionResult {
    pub question_id: String,
    pub correct: bool,
    pub earned_points: f64,
    pub available_points: f64,
}

#[derive(Debug, Clone, PartialEq)]
pub struct QuizResult {
    pub score: f64,
    pub max_score: f64,
    pub percent: f64,
    pub passed: bool,
    pub correct_count: usize,
    pub question_count: usize,
    pub results: Vec<QuestionResult>,
}

/// Grades an attempt. Correct answers must come from trusted server-side content,
/// never from values submitted by an untrusted browser client.
pub fn grade_attempt(
    questions: &[(String, usize, usize, usize, f64)],
    pass_percent: f64,
) -> Result<QuizResult, QuizError> {
    if questions.is_empty() { return Err(QuizError::EmptyAttempt); }
    if questions.len() > 500 { return Err(QuizError::TooManyQuestions); }
    if !pass_percent.is_finite() || !(0.0..=100.0).contains(&pass_percent) {
        return Err(QuizError::InvalidPassThreshold);
    }

    let mut seen = std::collections::HashSet::with_capacity(questions.len());
    let mut results = Vec::with_capacity(questions.len());
    let mut score = 0.0;
    let mut max_score = 0.0;
    let mut correct_count = 0;

    for (id, selected, correct, option_count, points) in questions {
        if id.is_empty() || id.len() > 128 || !seen.insert(id) ||
            !(2..=16).contains(option_count) || selected >= option_count || correct >= option_count ||
            !points.is_finite() || *points <= 0.0 || *points > 1_000_000.0 {
            return Err(QuizError::InvalidQuestion);
        }
        let is_correct = selected == correct;
        let earned = if is_correct { *points } else { 0.0 };
        if is_correct { correct_count += 1; }
        score += earned;
        max_score += points;
        results.push(QuestionResult {
            question_id: id.clone(),
            correct: is_correct,
            earned_points: earned,
            available_points: *points,
        });
    }

    if !score.is_finite() || !max_score.is_finite() || max_score <= 0.0 {
        return Err(QuizError::InvalidQuestion);
    }
    let percent = score / max_score * 100.0;
    Ok(QuizResult {
        score, max_score, percent, passed: percent >= pass_percent,
        correct_count, question_count: questions.len(), results,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn grades_weighted_questions_and_passes_threshold() {
        let attempt = vec![
            ("q1".into(), 1, 1, 4, 2.0),
            ("q2".into(), 0, 2, 4, 1.0),
            ("q3".into(), 3, 3, 4, 3.0),
        ];
        let result = grade_attempt(&attempt, 80.0).unwrap();
        assert_eq!(result.score, 5.0);
        assert_eq!(result.max_score, 6.0);
        assert!((result.percent - 83.3333333333).abs() < 1e-8);
        assert!(result.passed);
        assert_eq!(result.correct_count, 2);
    }

    #[test]
    fn rejects_duplicate_question_ids() {
        let attempt = vec![("q1".into(), 0, 0, 4, 1.0), ("q1".into(), 1, 1, 4, 1.0)];
        assert_eq!(grade_attempt(&attempt, 50.0), Err(QuizError::InvalidQuestion));
    }

    #[test]
    fn rejects_empty_attempt_and_bad_threshold() {
        assert_eq!(grade_attempt(&[], 50.0), Err(QuizError::EmptyAttempt));
        assert_eq!(grade_attempt(&[("q".into(), 0, 0, 4, 1.0)], 101.0), Err(QuizError::InvalidPassThreshold));
    }

    #[test]
    fn rejects_non_finite_and_non_positive_points() {
        assert_eq!(grade_attempt(&[("q".into(), 0, 0, 4, f64::NAN)], 50.0), Err(QuizError::InvalidQuestion));
        assert_eq!(grade_attempt(&[("q".into(), 0, 0, 4, 0.0)], 50.0), Err(QuizError::InvalidQuestion));
    }
}

    #[test]
    fn rejects_answer_indices_outside_option_range() {
        let attempt = vec![("q1".into(), 4, 1, 4, 1.0)];
        assert_eq!(grade_attempt(&attempt, 50.0), Err(QuizError::InvalidQuestion));
    }
