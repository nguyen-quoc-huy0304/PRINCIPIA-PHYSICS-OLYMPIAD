//! Validated vector equilibrium and scoring for the force-balance puzzle.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ForceScore { pub error_n: f64, pub points: u32 }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ForceError { NonFiniteInput, InvalidPointScale }

pub fn balance_target(f1: [f64; 2], f2: [f64; 2]) -> Result<[f64; 2], ForceError> {
    let values = [f1[0], f1[1], f2[0], f2[1]];
    if !values.iter().all(|value| value.is_finite()) { return Err(ForceError::NonFiniteInput); }
    let target = [-(f1[0] + f2[0]), -(f1[1] + f2[1])];
    if !target.iter().all(|value| value.is_finite()) { return Err(ForceError::NonFiniteInput); }
    Ok(target)
}

pub fn score_candidate(candidate: [f64; 2], target: [f64; 2], points_per_newton: f64) -> Result<ForceScore, ForceError> {
    let values = [candidate[0], candidate[1], target[0], target[1], points_per_newton];
    if !values.iter().all(|value| value.is_finite()) { return Err(ForceError::NonFiniteInput); }
    if points_per_newton < 0.0 { return Err(ForceError::InvalidPointScale); }
    let error_n = (candidate[0] - target[0]).hypot(candidate[1] - target[1]);
    let penalty = error_n * points_per_newton;
    if !error_n.is_finite() || !penalty.is_finite() { return Err(ForceError::NonFiniteInput); }
    let points = (100.0 - penalty).round().max(0.0) as u32;
    Ok(ForceScore { error_n, points })
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn computes_balancing_vector() {
        assert_eq!(balance_target([3.0, -4.0], [-7.0, 2.0]), Ok([4.0, 2.0]));
    }
    #[test]
    fn exact_balance_gets_full_score() {
        assert_eq!(score_candidate([4.0, 2.0], [4.0, 2.0], 8.0), Ok(ForceScore { error_n: 0.0, points: 100 }));
    }
    #[test]
    fn uses_euclidean_error_and_clamps_score() {
        let score = score_candidate([3.0, 4.0], [0.0, 0.0], 8.0).unwrap();
        assert_eq!(score.error_n, 5.0);
        assert_eq!(score.points, 60);
        assert_eq!(score_candidate([20.0, 20.0], [-20.0, -20.0], 8.0).unwrap().points, 0);
    }
    #[test]
    fn rejects_non_finite_and_negative_scale() {
        assert_eq!(balance_target([f64::NAN, 0.0], [0.0, 0.0]), Err(ForceError::NonFiniteInput));
        assert_eq!(score_candidate([0.0, 0.0], [0.0, 0.0], -1.0), Err(ForceError::InvalidPointScale));
    }
}
