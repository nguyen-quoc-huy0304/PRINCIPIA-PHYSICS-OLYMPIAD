//! Assessment domain service: deterministic quiz scoring and attempt validation.
use std::collections::HashSet;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Question {
    pub prompt: String,
    pub options: Vec<String>,
    pub correct_index: usize,
    pub explanation: Option<String>,
    pub points: u32,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Quiz {
    pub id: String,
    pub title: String,
    pub questions: Vec<Question>,
    pub pass_percent: u8,
    pub time_limit_seconds: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Answer {
    pub question_index: usize,
    pub selected_option: Option<usize>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Grade {
    pub earned_points: u32,
    pub total_points: u32,
    pub percent: f64,
    pub correct_count: usize,
    pub unanswered_count: usize,
    pub passed: bool,
    pub details: Vec<QuestionResult>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct QuestionResult {
    pub question_index: usize,
    pub selected_option: Option<usize>,
    pub correct_option: usize,
    pub is_correct: bool,
    pub explanation: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum AssessmentError {
    EmptyQuiz,
    EmptyPrompt(usize),
    TooFewOptions(usize),
    InvalidCorrectOption(usize),
    InvalidPassPercent,
    DuplicateAnswer(usize),
    AnswerOutOfRange(usize),
    OptionOutOfRange(usize),
}

impl Quiz {
    pub fn validate(&self) -> Result<(), AssessmentError> {
        if self.questions.is_empty() { return Err(AssessmentError::EmptyQuiz); }
        if self.pass_percent > 100 { return Err(AssessmentError::InvalidPassPercent); }
        for (i, q) in self.questions.iter().enumerate() {
            if q.prompt.trim().is_empty() { return Err(AssessmentError::EmptyPrompt(i)); }
            if q.options.len() < 2 { return Err(AssessmentError::TooFewOptions(i)); }
            if q.correct_index >= q.options.len() { return Err(AssessmentError::InvalidCorrectOption(i)); }
        }
        Ok(())
    }

    /// Grade a complete or partial attempt. Missing answers are never treated as correct.
    pub fn grade(&self, answers: &[Answer]) -> Result<Grade, AssessmentError> {
        self.validate()?;
        let mut seen = HashSet::new();
        for a in answers {
            if a.question_index >= self.questions.len() { return Err(AssessmentError::AnswerOutOfRange(a.question_index)); }
            if !seen.insert(a.question_index) { return Err(AssessmentError::DuplicateAnswer(a.question_index)); }
            if let Some(option) = a.selected_option {
                if option >= self.questions[a.question_index].options.len() {
                    return Err(AssessmentError::OptionOutOfRange(a.question_index));
                }
            }
        }
        let mut earned = 0u32;
        let total: u32 = self.questions.iter().map(|q| q.points).sum();
        let mut correct = 0usize;
        let mut unanswered = 0usize;
        let mut details = Vec::with_capacity(self.questions.len());
        for (i, q) in self.questions.iter().enumerate() {
            let selected = answers.iter().find(|a| a.question_index == i).and_then(|a| a.selected_option);
            let is_correct = selected == Some(q.correct_index);
            if selected.is_none() { unanswered += 1; }
            if is_correct { earned = earned.saturating_add(q.points); correct += 1; }
            details.push(QuestionResult { question_index: i, selected_option: selected,
                correct_option: q.correct_index, is_correct, explanation: q.explanation.clone() });
        }
        let percent = if total == 0 { 0.0 } else { earned as f64 * 100.0 / total as f64 };
        Ok(Grade { earned_points: earned, total_points: total, percent, correct_count: correct,
            unanswered_count: unanswered, passed: percent >= self.pass_percent as f64, details })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    fn sample() -> Quiz {
        Quiz { id: "q1".into(), title: "Newton".into(), pass_percent: 50, time_limit_seconds: None,
            questions: vec![
                Question { prompt: "F = ?".into(), options: vec!["ma".into(), "mv".into()], correct_index: 0, explanation: Some("Định luật II Newton".into()), points: 2 },
                Question { prompt: "p = ?".into(), options: vec!["mv".into(), "ma".into()], correct_index: 0, explanation: None, points: 1 },
            ] }
    }
    #[test] fn grades_weighted_partial_attempt() {
        let g = sample().grade(&[Answer { question_index: 0, selected_option: Some(0) }]).unwrap();
        assert_eq!(g.earned_points, 2); assert_eq!(g.total_points, 3);
        assert_eq!(g.correct_count, 1); assert_eq!(g.unanswered_count, 1); assert!(g.passed);
    }
    #[test] fn rejects_duplicate_answers() {
        let a = Answer { question_index: 0, selected_option: Some(0) };
        assert_eq!(sample().grade(&[a.clone(), a]), Err(AssessmentError::DuplicateAnswer(0)));
    }
    #[test] fn rejects_invalid_correct_index() {
        let mut q = sample(); q.questions[0].correct_index = 9;
        assert_eq!(q.validate(), Err(AssessmentError::InvalidCorrectOption(0)));
    }
    #[test] fn zero_point_quiz_is_safe() {
        let mut q = sample(); for x in &mut q.questions { x.points = 0; }
        assert_eq!(q.grade(&[]).unwrap().percent, 0.0);
    }
}
