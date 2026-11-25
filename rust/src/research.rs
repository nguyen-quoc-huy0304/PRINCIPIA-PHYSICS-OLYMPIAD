//! Validated descriptive statistics for experimental research records.
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct ResearchSummary {
    pub count: usize,
    pub mean: f64,
    pub standard_deviation: f64,
    pub standard_error: f64,
    pub slope: Option<f64>,
    pub intercept: Option<f64>,
}

pub fn summarize(points: &[(f64, f64)]) -> Result<ResearchSummary, &'static str> {
    if points.len() < 2 || points.len() > 10_000 {
        return Err("research data must contain 2 to 10000 points");
    }
    if points.iter().any(|(x, y)| !x.is_finite() || !y.is_finite()) {
        return Err("research points must be finite");
    }
    let count = points.len();
    let n = count as f64;
    let sum_y = points.iter().map(|point| point.1).sum::<f64>();
    let sum_x = points.iter().map(|point| point.0).sum::<f64>();
    if !sum_x.is_finite() || !sum_y.is_finite() {
        return Err("research sum overflow");
    }
    let mean = sum_y / n;
    let mean_x = sum_x / n;
    let variance_sum = points.iter().map(|point| (point.1 - mean).powi(2)).sum::<f64>();
    let sxx = points.iter().map(|point| (point.0 - mean_x).powi(2)).sum::<f64>();
    let sxy = points.iter().map(|point| (point.0 - mean_x) * (point.1 - mean)).sum::<f64>();
    if !mean.is_finite() || !variance_sum.is_finite() || !sxx.is_finite() || !sxy.is_finite() {
        return Err("research statistics overflow");
    }
    let variance = variance_sum / (n - 1.0);
    let standard_deviation = variance.sqrt();
    let standard_error = standard_deviation / n.sqrt();
    let (slope, intercept) = if sxx == 0.0 {
        (None, None)
    } else {
        let slope = sxy / sxx;
        let intercept = mean - slope * mean_x;
        if !slope.is_finite() || !intercept.is_finite() {
            return Err("research regression overflow");
        }
        (Some(slope), Some(intercept))
    };
    if !variance.is_finite() || !standard_deviation.is_finite() || !standard_error.is_finite() {
        return Err("research variance overflow");
    }
    Ok(ResearchSummary { count, mean, standard_deviation, standard_error, slope, intercept })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn computes_sample_statistics_and_linear_fit() {
        let result = summarize(&[(0.0, 1.0), (1.0, 3.0), (2.0, 5.0)]).unwrap();
        assert_eq!(result.count, 3);
        assert!((result.mean - 3.0).abs() < 1e-12);
        assert!((result.standard_deviation - 2.0).abs() < 1e-12);
        assert_eq!(result.slope, Some(2.0));
        assert_eq!(result.intercept, Some(1.0));
    }

    #[test]
    fn constant_x_has_no_regression_but_valid_statistics() {
        let result = summarize(&[(1.0, 2.0), (1.0, 4.0)]).unwrap();
        assert_eq!(result.slope, None);
        assert_eq!(result.intercept, None);
        assert_eq!(result.mean, 3.0);
    }

    #[test]
    fn rejects_invalid_and_overflowing_points() {
        assert!(summarize(&[(1.0, 2.0)]).is_err());
        assert!(summarize(&[(0.0, f64::NAN), (1.0, 2.0)]).is_err());
        assert!(summarize(&[(0.0, f64::MAX), (1.0, f64::MAX)]).is_err());
    }
}
