//! Logic for deduction-style science mystery challenges.
//! Clues are revealed progressively; each clue identifies evidence and may eliminate a suspect.

use std::collections::HashSet;

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Suspect {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Clue {
    pub id: String,
    pub text: String,
    /// Suspect disproved by this evidence, if any.
    pub eliminates: Option<String>,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MysteryCase {
    pub id: String,
    pub title: String,
    pub suspects: Vec<Suspect>,
    pub clues: Vec<Clue>,
    pub culprit_id: String,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum MysteryError {
    EmptyId,
    EmptyTitle,
    NoSuspects,
    NoClues,
    DuplicateSuspect,
    DuplicateClue,
    UnknownSuspect,
    UnknownClue,
    CulpritNotFound,
    CulpritEliminated,
    AlreadySolved,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GuessOutcome {
    Correct { score: u32 },
    Incorrect,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct MysterySession {
    case: MysteryCase,
    revealed_clues: HashSet<String>,
    eliminated_suspects: HashSet<String>,
    hint_count: u32,
    solved: bool,
}

impl MysteryCase {
    pub fn validate(&self) -> Result<(), MysteryError> {
        if self.id.trim().is_empty() { return Err(MysteryError::EmptyId); }
        if self.title.trim().is_empty() { return Err(MysteryError::EmptyTitle); }
        if self.suspects.is_empty() { return Err(MysteryError::NoSuspects); }
        if self.clues.is_empty() { return Err(MysteryError::NoClues); }

        let mut suspect_ids = HashSet::new();
        for suspect in &self.suspects {
            if suspect.id.trim().is_empty() || suspect.name.trim().is_empty() {
                return Err(MysteryError::EmptyId);
            }
            if !suspect_ids.insert(suspect.id.as_str()) {
                return Err(MysteryError::DuplicateSuspect);
            }
        }
        if !suspect_ids.contains(self.culprit_id.as_str()) {
            return Err(MysteryError::CulpritNotFound);
        }

        let mut clue_ids = HashSet::new();
        for clue in &self.clues {
            if clue.id.trim().is_empty() || clue.text.trim().is_empty() {
                return Err(MysteryError::EmptyId);
            }
            if !clue_ids.insert(clue.id.as_str()) {
                return Err(MysteryError::DuplicateClue);
            }
            if let Some(eliminated) = clue.eliminates.as_deref() {
                if !suspect_ids.contains(eliminated) { return Err(MysteryError::UnknownSuspect); }
                if eliminated == self.culprit_id { return Err(MysteryError::CulpritEliminated); }
            }
        }
        Ok(())
    }
}

impl MysterySession {
    pub fn start(case: MysteryCase) -> Result<Self, MysteryError> {
        case.validate()?;
        Ok(Self {
            case,
            revealed_clues: HashSet::new(),
            eliminated_suspects: HashSet::new(),
            hint_count: 0,
            solved: false,
        })
    }

    /// Reveal a clue once; repeated requests are idempotent and do not award extra progress.
    pub fn reveal(&mut self, clue_id: &str) -> Result<&Clue, MysteryError> {
        let clue = self.case.clues.iter().find(|c| c.id == clue_id).ok_or(MysteryError::UnknownClue)?;
        self.revealed_clues.insert(clue.id.clone());
        if let Some(id) = clue.eliminates.as_ref() { self.eliminated_suspects.insert(id.clone()); }
        Ok(clue)
    }

    pub fn request_hint(&mut self) -> Result<String, MysteryError> {
        if self.solved { return Err(MysteryError::AlreadySolved); }
        self.hint_count = self.hint_count.saturating_add(1);
        let remaining: Vec<&Suspect> = self.case.suspects.iter()
            .filter(|s| !self.eliminated_suspects.contains(&s.id))
            .collect();
        if remaining.len() <= 1 {
            return Ok("Các manh mối đã thu hẹp đáp án; hãy kiểm tra bằng chứng còn lại.".to_string());
        }
        let hint = remaining.iter().find(|s| s.id == self.case.culprit_id)
            .map(|_| format!("Thủ phạm vẫn nằm trong nhóm {} người chưa bị loại.", remaining.len()))
            .unwrap_or_else(|| "Đối chiếu các manh mối đã mở với danh sách nghi phạm.".to_string());
        Ok(hint)
    }

    pub fn guess(&mut self, suspect_id: &str) -> Result<GuessOutcome, MysteryError> {
        if self.solved { return Err(MysteryError::AlreadySolved); }
        if !self.case.suspects.iter().any(|s| s.id == suspect_id) { return Err(MysteryError::UnknownSuspect); }
        if self.eliminated_suspects.contains(suspect_id) { return Ok(GuessOutcome::Incorrect); }
        if suspect_id != self.case.culprit_id { return Ok(GuessOutcome::Incorrect); }

        self.solved = true;
        let clue_penalty = (self.revealed_clues.len() as u32).saturating_sub(1).saturating_mul(10);
        let hint_penalty = self.hint_count.saturating_mul(15);
        let score = 100u32.saturating_sub(clue_penalty).saturating_sub(hint_penalty);
        Ok(GuessOutcome::Correct { score })
    }

    pub fn revealed_clue_count(&self) -> usize { self.revealed_clues.len() }
    pub fn eliminated_suspect_ids(&self) -> &HashSet<String> { &self.eliminated_suspects }
    pub fn is_solved(&self) -> bool { self.solved }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_case() -> MysteryCase {
        MysteryCase {
            id: "lab-01".into(),
            title: "Mẫu vật biến mất".into(),
            suspects: vec![
                Suspect { id: "a".into(), name: "An".into() },
                Suspect { id: "b".into(), name: "Bình".into() },
                Suspect { id: "c".into(), name: "Chi".into() },
            ],
            clues: vec![
                Clue { id: "c1".into(), text: "Dấu chân không khớp.".into(), eliminates: Some("a".into()) },
                Clue { id: "c2".into(), text: "Có vết dung dịch trên găng tay.".into(), eliminates: Some("b".into()) },
            ],
            culprit_id: "c".into(),
        }
    }

    #[test]
    fn case_validation_rejects_duplicate_ids() {
        let mut case = sample_case();
        case.suspects[1].id = "a".into();
        assert_eq!(case.validate(), Err(MysteryError::DuplicateSuspect));
    }

    #[test]
    fn revealing_clue_eliminates_suspect_and_is_idempotent() {
        let mut session = MysterySession::start(sample_case()).unwrap();
        session.reveal("c1").unwrap();
        session.reveal("c1").unwrap();
        assert_eq!(session.revealed_clue_count(), 1);
        assert!(session.eliminated_suspect_ids().contains("a"));
    }

    #[test]
    fn correct_guess_awards_full_score_without_clues() {
        let mut session = MysterySession::start(sample_case()).unwrap();
        assert_eq!(session.guess("c"), Ok(GuessOutcome::Correct { score: 100 }));
        assert!(session.is_solved());
    }

    #[test]
    fn revealed_clues_and_hints_reduce_score() {
        let mut session = MysterySession::start(sample_case()).unwrap();
        session.reveal("c1").unwrap();
        session.reveal("c2").unwrap();
        session.request_hint().unwrap();
        assert_eq!(session.guess("c"), Ok(GuessOutcome::Correct { score: 75 }));
    }

    #[test]
    fn eliminated_and_wrong_guesses_do_not_solve_case() {
        let mut session = MysterySession::start(sample_case()).unwrap();
        session.reveal("c1").unwrap();
        assert_eq!(session.guess("a"), Ok(GuessOutcome::Incorrect));
        assert_eq!(session.guess("b"), Ok(GuessOutcome::Incorrect));
        assert!(!session.is_solved());
    }

    #[test]
    fn solved_session_cannot_be_guessed_again() {
        let mut session = MysterySession::start(sample_case()).unwrap();
        session.guess("c").unwrap();
        assert_eq!(session.guess("c"), Err(MysteryError::AlreadySolved));
    }
}
