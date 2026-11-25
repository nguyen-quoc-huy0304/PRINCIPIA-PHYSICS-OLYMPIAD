//! Vector force equilibrium scoring for the interactive physics puzzle.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ForceBalanceResult {
    pub error_n: f64,
    pub points: u32,
    pub balanced: bool,
}

/// Compare a proposed force vector with the exact balancing force.
pub fn score(
    force_x_n: f64,
    force_y_n: f64,
    target_x_n: f64,
    target_y_n: f64,
) -> Result<ForceBalanceResult, &'static str> {
    let values = [force_x_n, force_y_n, target_x_n, target_y_n];
    if values.iter().any(|value| !value.is_finite()) {
        return Err("force components must be finite");
    }
    let error_n = (force_x_n - target_x_n).hypot(force_y_n - target_y_n);
    if !error_n.is_finite() {
        return Err("force error overflow");
    }
    let penalty = error_n * 8.0;
    if !penalty.is_finite() {
        return Err("force score overflow");
    }
    let points = (100.0 - penalty).round().max(0.0) as u32;
    Ok(ForceBalanceResult {
        error_n,
        points,
        balanced: error_n < 0.75,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn exact_balance_scores_one_hundred() {
        let result = score(3.0, -4.0, 3.0, -4.0).unwrap();
        assert_eq!(result.points, 100);
        assert!(result.balanced);
        assert_eq!(result.error_n, 0.0);
    }

    #[test]
    fn distant_force_has_zero_not_negative_points() {
        let result = score(20.0, 20.0, -20.0, -20.0).unwrap();
        assert_eq!(result.points, 0);
        assert!(!result.balanced);
    }

    #[test]
    fn balance_threshold_is_strict() {
        assert!(score(0.74, 0.0, 0.0, 0.0).unwrap().balanced);
        assert!(!score(0.75, 0.0, 0.0, 0.0).unwrap().balanced);
    }

    #[test]
    fn rejects_non_finite_and_overflowing_inputs() {
        assert!(score(f64::NAN, 0.0, 0.0, 0.0).is_err());
        assert!(score(f64::MAX, f64::MAX, -f64::MAX, -f64::MAX).is_err());
    }
}
