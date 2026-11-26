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

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum SelectionError { EmptyCatalog, TooManyQuestions, InvalidCount, InvalidQuestion }

fn next_random(state: &mut u64, upper: usize) -> usize {
    *state = state.wrapping_mul(6_364_136_223_846_793_005).wrapping_add(1);
    ((*state as u128 * upper as u128) >> 64) as usize
}

fn shuffle<T>(items: &mut [T], state: &mut u64) {
    for index in (1..items.len()).rev() {
        let target = next_random(state, index + 1);
        items.swap(index, target);
    }
}

/// Select exam questions and shuffle answer choices using a reproducible secure seed.
pub fn select_exam_questions(
    questions: &[serde_json::Value],
    count: usize,
    seed: u64,
) -> Result<Vec<serde_json::Value>, SelectionError> {
    if questions.is_empty() { return Err(SelectionError::EmptyCatalog); }
    if questions.len() > 500 { return Err(SelectionError::TooManyQuestions); }
    if count == 0 || count > questions.len() { return Err(SelectionError::InvalidCount); }

    let mut order: Vec<usize> = (0..questions.len()).collect();
    let mut random_state = seed;
    shuffle(&mut order, &mut random_state);
    let mut selected = Vec::with_capacity(count);
    for index in order.into_iter().take(count) {
        let original = &questions[index];
        let question = original.get("q").and_then(serde_json::Value::as_str)
            .filter(|value| !value.trim().is_empty() && value.len() <= 4000)
            .ok_or(SelectionError::InvalidQuestion)?;
        let _ = question;
        let answers = original.get("a").and_then(serde_json::Value::as_array)
            .filter(|values| (2..=12).contains(&values.len()) && values.iter().all(|value| value.as_str().is_some_and(|text| !text.trim().is_empty() && text.len() <= 1000)))
            .ok_or(SelectionError::InvalidQuestion)?;
        let correct = original.get("correct").and_then(serde_json::Value::as_u64)
            .and_then(|value| usize::try_from(value).ok())
            .filter(|value| *value < answers.len())
            .ok_or(SelectionError::InvalidQuestion)?;
        let mut choices: Vec<(usize, serde_json::Value)> = answers.iter().cloned().enumerate().collect();
        shuffle(&mut choices, &mut random_state);
        let next_correct = choices.iter().position(|(original_index, _)| *original_index == correct)
            .ok_or(SelectionError::InvalidQuestion)?;
        let mut output = original.clone();
        output["a"] = serde_json::Value::Array(choices.into_iter().map(|(_, value)| value).collect());
        output["correct"] = serde_json::json!(next_correct);
        selected.push(output);
    }
    Ok(selected)
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
    fn exam_selection_is_seeded_and_remaps_shuffled_correct_answers() {
        let questions: Vec<serde_json::Value> = (0..12).map(|index| serde_json::json!({
            "q":format!("Question {index}"),"a":["A","B","C","D"],"correct":index % 4,"topic":"Physics"
        })).collect();
        let first = select_exam_questions(&questions, 8, 42).unwrap();
        let second = select_exam_questions(&questions, 8, 42).unwrap();
        assert_eq!(first, second);
        assert_eq!(first.len(), 8);
        for question in first {
            let answers = question["a"].as_array().unwrap();
            let correct = question["correct"].as_u64().unwrap() as usize;
            assert!((2..=12).contains(&answers.len()));
            assert!(correct < answers.len());
        }
    }

    #[test]
    fn exam_selection_rejects_invalid_catalog_and_count() {
        assert_eq!(select_exam_questions(&[], 1, 1), Err(SelectionError::EmptyCatalog));
        let question = serde_json::json!({"q":"Q","a":["A","B"],"correct":2});
        assert_eq!(select_exam_questions(&[question.clone()], 1, 1), Err(SelectionError::InvalidQuestion));
        assert_eq!(select_exam_questions(&[question], 0, 1), Err(SelectionError::InvalidCount));
    }

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
    #[test]
    fn rejects_answer_indices_outside_option_range() {
        let attempt = vec![("q1".into(), 4, 1, 4, 1.0)];
        assert_eq!(grade_attempt(&attempt, 50.0), Err(QuizError::InvalidQuestion));
    }
}
