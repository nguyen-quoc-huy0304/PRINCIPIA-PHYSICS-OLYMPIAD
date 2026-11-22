//! Progress ledger primitives. Persistence and sync are supplied by adapters.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Progress {
    pub experience: u64,
    pub completed_lessons: u64,
    pub study_streak_days: u32,
    pub last_activity_day: Option<String>,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Activity { LessonCompleted, QuizSubmitted, AssignmentSubmitted, ExperimentCompleted }
impl Default for Progress {
    fn default() -> Self { Self { experience:0, completed_lessons:0, study_streak_days:0, last_activity_day:None } }
}
impl Progress {
    pub fn record(&mut self, activity: Activity, day: &str) -> Result<(), &'static str> {
        if day.len()!=10 || day.as_bytes().get(4)!=Some(&b'-') || day.as_bytes().get(7)!=Some(&b'-') {
            return Err("day must use YYYY-MM-DD");
        }
        if self.last_activity_day.as_deref()!=Some(day) {
            self.study_streak_days=if self.last_activity_day.is_none() {1} else {self.study_streak_days.saturating_add(1)};
            self.last_activity_day=Some(day.to_string());
        }
        self.experience=self.experience.saturating_add(match activity {
            Activity::LessonCompleted=>50, Activity::QuizSubmitted=>30,
            Activity::AssignmentSubmitted=>30, Activity::ExperimentCompleted=>40,
        });
        if activity==Activity::LessonCompleted { self.completed_lessons=self.completed_lessons.saturating_add(1); }
        Ok(())
    }
    pub fn level(&self) -> u64 { self.experience / 100 + 1 }
    pub fn experience_into_level(&self) -> u64 { self.experience % 100 }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn awards_experience_and_counts_lesson() {
        let mut p=Progress::default();
        p.record(Activity::LessonCompleted,"2026-11-22").unwrap();
        assert_eq!(p.experience,50); assert_eq!(p.completed_lessons,1);
        assert_eq!(p.study_streak_days,1);
    }
}
