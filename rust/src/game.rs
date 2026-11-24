//! Native rules and scoring for PRINCIPIA's projectile arcade.
use crate::physics::{projectile, PhysicsError};

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ShotResult {
    pub range_m: f64,
    pub error_m: f64,
    pub points: u32,
}

pub fn score_projectile(speed: f64, angle_degrees: f64, target_m: f64, gravity: f64) -> Result<ShotResult, PhysicsError> {
    if !target_m.is_finite() || target_m < 0.0 {
        return Err(PhysicsError::NonFinite);
    }
    let flight = projectile(speed, angle_degrees, gravity)?;
    let error = (flight.range - target_m).abs();
    if !error.is_finite() { return Err(PhysicsError::NonFinite); }
    let score_delta = error * 5.0;
    if !score_delta.is_finite() { return Err(PhysicsError::NonFinite); }
    let points = (100.0 - score_delta).round().max(0.0) as u32;
    Ok(ShotResult { range_m: flight.range, error_m: error, points })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn perfect_shot_gets_full_score() {
        let shot = score_projectile(20.0, 45.0, 20.0 * 20.0 / 9.80665, 9.80665).unwrap();
        assert_eq!(shot.points, 100);
        assert!(shot.error_m < 1e-10);
    }
    #[test]
    fn distant_target_gives_zero_not_negative_score() {
        let shot = score_projectile(10.0, 45.0, 10000.0, 9.80665).unwrap();
        assert_eq!(shot.points, 0);
    }
    #[test]
    fn rejects_invalid_target() {
        assert!(score_projectile(10.0, 45.0, f64::NAN, 9.81).is_err());
    }
    #[test]
    fn rejects_overflow_in_target_error() {
        assert_eq!(score_projectile(0.0, 45.0, f64::MAX, 9.81), Err(PhysicsError::NonFinite));
    }
}
