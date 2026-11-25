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
        let current=day_number(day).ok_or("day must be a valid YYYY-MM-DD date")?;
        if self.last_activity_day.as_deref()!=Some(day) {
            self.study_streak_days=match self.last_activity_day.as_deref().and_then(day_number) {
                None=>1, Some(previous) if current==previous+1=>self.study_streak_days.saturating_add(1),
                Some(_) => 1,
            };
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
fn day_number(day: &str) -> Option<i64> {
    let bytes = day.as_bytes();
    if bytes.len() != 10
        || bytes[4] != b'-'
        || bytes[7] != b'-'
        || !bytes.iter().enumerate().all(|(index, byte)| {
            matches!(index, 4 | 7) || byte.is_ascii_digit()
        })
    {
        return None;
    }
    let parts: Vec<i64> = day.split('-').map(str::parse).collect::<Result<_,_>>().ok()?;
    if parts.len()!=3 { return None; }
    let (mut y,m,d)=(parts[0],parts[1],parts[2]);
    if !(1..=12).contains(&m) { return None; }
    let leap=(y%4==0 && y%100!=0) || y%400==0;
    let month_days=match m {1|3|5|7|8|10|12=>31,4|6|9|11=>30,2=>if leap {29} else {28},_=>return None};
    if d<1 || d>month_days { return None; }
    y -= i64::from(m <= 2);
    let era=(if y>=0 {y} else {y-399})/400;
    let yoe=y-era*400;
    let mp=m+if m>2 {-3} else {9};
    let doy=(153*mp+2)/5+d-1;
    let doe=yoe*365+yoe/4-yoe/100+doy;
    Some(era*146097+doe)
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn rejects_non_canonical_or_impossible_dates() {
        for invalid in ["2026-1-01", "2026-01-1", "26-01-01", "2026/01/01", "2026-02-29", "2026-13-01", "2026-00-10", "2026-04-31"] {
            assert!(day_number(invalid).is_none(), "accepted invalid date: {invalid}");
        }
        assert!(day_number("2024-02-29").is_some());
        assert!(day_number("2026-11-25").is_some());
    }

    #[test] fn awards_experience_and_counts_lesson() {
        let mut p=Progress::default();
        p.record(Activity::LessonCompleted,"2026-11-22").unwrap();
        assert_eq!(p.experience,50); assert_eq!(p.completed_lessons,1);
        assert_eq!(p.study_streak_days,1);
        p.record(Activity::QuizSubmitted,"2026-11-24").unwrap();
        assert_eq!(p.study_streak_days,1);
        p.record(Activity::LessonCompleted,"2026-11-25").unwrap();
        assert_eq!(p.study_streak_days,2);
    }
}
