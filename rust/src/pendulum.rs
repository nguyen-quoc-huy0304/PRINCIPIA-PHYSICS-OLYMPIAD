//! Simple-pendulum energy and small-angle period model.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct PendulumResult {
    pub angular_frequency_rad_s: f64,
    pub period_seconds: f64,
    pub frequency_hz: f64,
    pub max_speed_mps: f64,
    pub max_acceleration_mps2: f64,
}

pub fn analyze(length_m: f64, gravity_mps2: f64, amplitude_degrees: f64) -> Result<PendulumResult, &'static str> {
    if !length_m.is_finite() || !gravity_mps2.is_finite() || !amplitude_degrees.is_finite() {
        return Err("pendulum inputs must be finite");
    }
    if length_m <= 0.0 || gravity_mps2 <= 0.0 || amplitude_degrees.abs() >= 90.0 {
        return Err("pendulum parameters are outside the supported domain");
    }
    let angular_frequency = (gravity_mps2 / length_m).sqrt();
    let period = 2.0 * std::f64::consts::PI / angular_frequency;
    let frequency = 1.0 / period;
    let angle = amplitude_degrees.to_radians();
    let max_speed = (2.0 * gravity_mps2 * length_m * (1.0 - angle.cos())).sqrt();
    let max_acceleration = gravity_mps2 * angle.sin();
    let result = [angular_frequency, period, frequency, max_speed, max_acceleration];
    if result.iter().any(|value| !value.is_finite()) {
        return Err("pendulum result overflow");
    }
    Ok(PendulumResult {
        angular_frequency_rad_s: angular_frequency,
        period_seconds: period,
        frequency_hz: frequency,
        max_speed_mps: max_speed,
        max_acceleration_mps2: max_acceleration,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn standard_pendulum_period_matches_small_angle_model() {
        let result = analyze(1.0, 9.81, 12.0).unwrap();
        assert!((result.period_seconds - 2.006066680710647).abs() < 1e-12);
        assert!((result.frequency_hz - 1.0 / result.period_seconds).abs() < 1e-12);
    }

    #[test]
    fn amplitude_changes_energy_derived_speed_and_acceleration() {
        let small = analyze(1.0, 9.81, 5.0).unwrap();
        let large = analyze(1.0, 9.81, 30.0).unwrap();
        assert!(large.max_speed_mps > small.max_speed_mps);
        assert!(large.max_acceleration_mps2 > small.max_acceleration_mps2);
        assert_eq!(large.period_seconds, small.period_seconds);
    }

    #[test]
    fn rejects_invalid_and_non_finite_parameters() {
        assert!(analyze(0.0, 9.81, 10.0).is_err());
        assert!(analyze(1.0, -1.0, 10.0).is_err());
        assert!(analyze(1.0, 9.81, 90.0).is_err());
        assert!(analyze(1.0, f64::NAN, 10.0).is_err());
    }
}
