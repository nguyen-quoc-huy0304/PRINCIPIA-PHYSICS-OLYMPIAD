//! Rust-owned validation and scoring for the modular robot assembly challenge.
use crate::robotics::{forward_kinematics, RoboticsError};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum AssemblyError { InvalidLinkLength, InvalidAngle, InvalidTarget, NumericOverflow, Robotics(RoboticsError) }

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct AssemblyResult {
    pub correct: u32,
    pub total: u32,
    pub ready: bool,
    pub x_mm: f64,
    pub y_mm: f64,
    pub error_mm: f64,
    pub earned: u32,
}

pub fn evaluate(
    base: &str, joint: &str, link1: &str, link2: &str, tool: &str,
    link1_mm: f64, link2_mm: f64, shoulder_deg: f64, elbow_deg: f64,
    target_x_mm: f64, target_y_mm: f64,
) -> Result<AssemblyResult, AssemblyError> {
    if !link1_mm.is_finite() || !link2_mm.is_finite() || link1_mm <= 0.0 || link2_mm <= 0.0 {
        return Err(AssemblyError::InvalidLinkLength);
    }
    if !shoulder_deg.is_finite() || !elbow_deg.is_finite() { return Err(AssemblyError::InvalidAngle); }
    if !target_x_mm.is_finite() || !target_y_mm.is_finite() { return Err(AssemblyError::InvalidTarget); }
    let correct = [
        base == "fixed", joint == "revolute", link1 == "160",
        link2 == "120", tool == "parallel",
    ].into_iter().filter(|matches| *matches).count() as u32;
    let [x_mm, y_mm] = forward_kinematics(
        link1_mm, link2_mm, shoulder_deg.to_radians(), elbow_deg.to_radians()
    ).map_err(AssemblyError::Robotics)?;
    let error_mm = (x_mm - target_x_mm).hypot(y_mm - target_y_mm);
    if !x_mm.is_finite() || !y_mm.is_finite() || !error_mm.is_finite() {
        return Err(AssemblyError::NumericOverflow);
    }
    let ready = correct == 5;
    let earned = if ready && error_mm <= 15.0 { 100 }
        else if ready && error_mm <= 35.0 { 60 }
        else if correct >= 3 { 20 } else { 0 };
    Ok(AssemblyResult { correct, total: 5, ready, x_mm, y_mm, error_mm, earned })
}

#[cfg(test)]
mod tests {
    use super::*;
    const TARGET: [f64; 2] = [
        160.0 * 0.8191520442889918 + 120.0 * 0.9396926207859084,
        160.0 * 0.573576436351046 + 120.0 * -0.3420201433256687,
    ];
    #[test]
    fn correct_assembly_at_target_awards_full_score() {
        let r = evaluate("fixed","revolute","160","120","parallel",160.0,120.0,35.0,-55.0,TARGET[0],TARGET[1]).unwrap();
        assert!(r.ready);
        assert_eq!(r.correct, 5);
        assert!(r.error_mm < 1e-9);
        assert_eq!(r.earned, 100);
    }
    #[test]
    fn incorrect_parts_limit_score() {
        let r = evaluate("mobile","revolute","160","120","parallel",160.0,120.0,35.0,-55.0,TARGET[0],TARGET[1]).unwrap();
        assert_eq!(r.correct, 4);
        assert!(!r.ready);
        assert_eq!(r.earned, 20);
    }
    #[test]
    fn correct_parts_but_misaligned_arm_gets_partial_score() {
        let r = evaluate("fixed","revolute","160","120","parallel",160.0,120.0,0.0,0.0,TARGET[0],TARGET[1]).unwrap();
        assert!(r.ready);
        assert!(r.error_mm > 35.0);
        assert_eq!(r.earned, 20);
    }
    #[test]
    fn rejects_invalid_numbers_and_lengths() {
        assert_eq!(evaluate("fixed","revolute","160","120","parallel",0.0,120.0,35.0,-55.0,0.0,0.0),Err(AssemblyError::InvalidLinkLength));
        assert_eq!(evaluate("fixed","revolute","160","120","parallel",160.0,120.0,f64::NAN,-55.0,0.0,0.0),Err(AssemblyError::InvalidAngle));
    }
}
