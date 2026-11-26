//! PRINCIPIA unified XP levels, competitive ranks and achievements.
const LEVELS: [u64; 11] = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200, 4000];
const TITLES: [&str; 11] = ["Tân binh", "Tập sự", "Khám phá", "Nhà nghiên cứu", "Chuyên gia", "Bậc thầy", "Học giả", "Huyền thoại", "Thiên tài", "Olympian", "Grand Olympian"];
const RANKS: [(&str, &str, u64); 8] = [
    ("bronze", "Đồng", 0), ("silver", "Bạc", 250), ("gold", "Vàng", 600),
    ("platinum", "Bạch kim", 1100), ("diamond", "Kim cương", 1800),
    ("elite", "Tinh anh", 2700), ("master", "Cao thủ", 3800),
    ("challenger", "Thách đấu", 5200),
];

#[derive(Debug, Clone, PartialEq)]
pub struct LevelProgress {
    pub level: u8, pub title: &'static str, pub xp: u64, pub current_threshold: u64,
    pub next_threshold: Option<u64>, pub progress_percent: f64, pub xp_to_next: u64,
}
#[derive(Debug, Clone, PartialEq)]
pub struct RankProgress {
    pub id: &'static str, pub name: &'static str, pub xp: u64, pub division: Option<&'static str>,
    pub next_name: Option<&'static str>, pub xp_to_next: u64, pub progress_percent: f64,
}
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct AchievementInput {
    pub sessions: u64, pub questions: u64, pub best_percent: u8, pub lessons: u64,
    pub streak: u32, pub experiments: u64, pub levels_created: u64,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Achievement {
    pub id: &'static str, pub name: &'static str, pub unlocked: bool,
    pub value: u64, pub target: u64,
}

pub fn level_progress(xp: u64) -> LevelProgress {
    let index = LEVELS.iter().rposition(|threshold| xp >= *threshold).unwrap_or(0);
    let current = LEVELS[index];
    let next = LEVELS.get(index + 1).copied();
    let percent = next.map(|limit| ((xp - current) as f64 / (limit - current) as f64 * 100.0).clamp(0.0, 100.0)).unwrap_or(100.0);
    LevelProgress { level: (index + 1) as u8, title: TITLES[index], xp, current_threshold: current,
        next_threshold: next, progress_percent: percent, xp_to_next: next.map(|limit| limit.saturating_sub(xp)).unwrap_or(0) }
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct CourseCompletion {
    pub completed: u64,
    pub total: u64,
    pub percent: f64,
}

pub fn course_completion(completed: u64, total: u64) -> Result<CourseCompletion, &'static str> {
    if total > 1_000_000 || completed > total {
        return Err("course progress counts are outside supported bounds");
    }
    let percent = if total == 0 { 0.0 } else { completed as f64 / total as f64 * 100.0 };
    Ok(CourseCompletion { completed, total, percent })
}

pub fn rank_progress(xp: u64) -> RankProgress {
    let index = RANKS.iter().rposition(|rank| xp >= rank.2).unwrap_or(0);
    let (id, name, current) = RANKS[index];
    let next = RANKS.get(index + 1);
    let percent = next.map(|rank| ((xp - current) as f64 / (rank.2 - current) as f64 * 100.0).clamp(0.0, 100.0)).unwrap_or(100.0);
    let division = if next.is_some() { Some(if percent >= 66.6667 { "I" } else if percent >= 33.3333 { "II" } else { "III" }) } else { None };
    RankProgress { id, name, xp, division, next_name: next.map(|rank| rank.1),
        xp_to_next: next.map(|rank| rank.2.saturating_sub(xp)).unwrap_or(0), progress_percent: percent }
}

pub fn achievements(input: AchievementInput) -> Vec<Achievement> {
    let rows = [
        ("first-session", "Khởi động", input.sessions, 1),
        ("century-questions", "Trăm câu hỏi", input.questions, 100),
        ("olympic-ace", "Điểm sáng Olympic", input.best_percent as u64, 90),
        ("five-sessions", "Bền bỉ", input.sessions, 5),
        ("ten-lessons", "Chinh phục bài học", input.lessons, 10),
        ("streak-seven", "Một tuần khoa học", input.streak as u64, 7),
        ("researcher", "Nhà nghiên cứu", input.experiments, 5),
        ("creator", "Nhà kiến tạo", input.levels_created, 3),
    ];
    rows.iter().map(|(id, name, value, target)| Achievement {
        id, name, unlocked: value >= target, value: *value, target: *target,
    }).collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn level_boundaries_are_exact() {
        assert_eq!(level_progress(0).level, 1);
        assert_eq!(level_progress(100).level, 2);
        assert_eq!(level_progress(4000).level, 11);
        assert_eq!(level_progress(u64::MAX).progress_percent, 100.0);
    }
    #[test] fn course_completion_handles_empty_and_full_courses() {
        assert_eq!(course_completion(0, 0).unwrap().percent, 0.0);
        assert_eq!(course_completion(3, 4).unwrap().percent, 75.0);
        assert_eq!(course_completion(4, 4).unwrap().percent, 100.0);
        assert!(course_completion(5, 4).is_err());
        assert!(course_completion(0, 1_000_001).is_err());
    }
    #[test] fn rank_division_and_next_rank_are_consistent() {
        let rank = rank_progress(400);
        assert_eq!(rank.id, "silver");
        assert_eq!(rank.division, Some("II"));
        assert_eq!(rank.xp_to_next, 200);
    }
    #[test] fn achievements_are_derived_not_mutated() {
        let result = achievements(AchievementInput { sessions: 5, questions: 99, best_percent: 90, lessons: 10, streak: 7, experiments: 5, levels_created: 3 });
        assert!(result[0].unlocked);
        assert!(!result[1].unlocked);
        assert!(result[2].unlocked);
    }
}
