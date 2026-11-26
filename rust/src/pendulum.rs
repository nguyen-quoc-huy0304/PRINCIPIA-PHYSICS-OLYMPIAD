//! Validated simple-pendulum calculations using SI units.
use std::f64::consts::PI;

#[derive(Debug, Clone, Copy, PartialEq)]
pub enum PendulumError {
    NonFinite,
    InvalidLength,
    InvalidGravity,
    InvalidAmplitude,
}

#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PendulumResult {
    pub angular_frequency_rad_s: f64,
    pub period_seconds: f64,
    pub frequency_hz: f64,
    pub max_speed_mps: f64,
    pub max_acceleration_mps2: f64,
}

pub fn calculate(length_m: f64, gravity_mps2: f64, amplitude_degrees: f64) -> Result<PendulumResult, PendulumError> {
    if ![length_m, gravity_mps2, amplitude_degrees].iter().all(|value| value.is_finite()) {
        return Err(PendulumError::NonFinite);
    }
    if length_m <= 0.0 { return Err(PendulumError::InvalidLength); }
    if gravity_mps2 <= 0.0 { return Err(PendulumError::InvalidGravity); }
    if amplitude_degrees.abs() >= 90.0 { return Err(PendulumError::InvalidAmplitude); }

    let angular_frequency = (gravity_mps2 / length_m).sqrt();
    let period = 2.0 * PI / angular_frequency;
    let theta = amplitude_degrees.to_radians();
    let max_speed = (2.0 * gravity_mps2 * length_m * (1.0 - theta.cos())).sqrt();
    let max_acceleration = gravity_mps2 * theta.sin();
    let values = [angular_frequency, period, 1.0 / period, max_speed, max_acceleration];
    if !values.iter().all(|value| value.is_finite()) { return Err(PendulumError::NonFinite); }

    Ok(PendulumResult {
        angular_frequency_rad_s: angular_frequency,
        period_seconds: period,
        frequency_hz: 1.0 / period,
        max_speed_mps: max_speed,
        max_acceleration_mps2: max_acceleration,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_metre_pendulum_matches_small_angle_period() {
        let result = calculate(1.0, 9.81, 12.0).unwrap();
        assert!((result.period_seconds - 2.006).abs() < 0.01);
        assert!((result.frequency_hz - 1.0 / result.period_seconds).abs() < 1e-12);
        assert!(result.max_speed_mps > 0.0);
    }

    #[test]
    fn rejects_non_physical_inputs() {
        assert_eq!(calculate(0.0, 9.81, 10.0), Err(PendulumError::InvalidLength));
        assert_eq!(calculate(1.0, 0.0, 10.0), Err(PendulumError::InvalidGravity));
        assert_eq!(calculate(1.0, 9.81, 90.0), Err(PendulumError::InvalidAmplitude));
        assert_eq!(calculate(f64::NAN, 9.81, 10.0), Err(PendulumError::NonFinite));
    }

    #[test]
    fn rejects_overflowed_intermediate_results() {
        assert_eq!(calculate(f64::MIN_POSITIVE, f64::MAX, 10.0), Err(PendulumError::NonFinite));
    }
}
