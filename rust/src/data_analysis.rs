//! Least-squares linear regression for experimental data (SI-compatible units).
//! Uses centered sums to reduce cancellation for data with a large x offset.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RegressionError { TooFewPoints, NonFiniteInput, ZeroXVariance, NumericOverflow }
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct LinearFit {
    pub slope:f64, pub intercept:f64, pub r_squared:f64, pub rmse:f64, pub count:usize,
}
pub fn linear_regression(points:&[(f64,f64)])->Result<LinearFit,RegressionError>{
    if points.len()<2{return Err(RegressionError::TooFewPoints);}
    if points.iter().any(|(x,y)|!x.is_finite()||!y.is_finite()){return Err(RegressionError::NonFiniteInput);}
    let n=points.len() as f64;
    let mean_x=points.iter().map(|p|p.0).sum::<f64>()/n;
    let mean_y=points.iter().map(|p|p.1).sum::<f64>()/n;
    let sxx=points.iter().map(|p|(p.0-mean_x).powi(2)).sum::<f64>();
    let sxy=points.iter().map(|p|(p.0-mean_x)*(p.1-mean_y)).sum::<f64>();
    let syy=points.iter().map(|p|(p.1-mean_y).powi(2)).sum::<f64>();
    if !sxx.is_finite()||!sxy.is_finite()||!syy.is_finite(){return Err(RegressionError::NumericOverflow);}
    let scale=points.iter().map(|p|p.0.abs()).fold(1.0_f64,f64::max);
    if sxx<=f64::EPSILON*scale*scale*n{return Err(RegressionError::ZeroXVariance);}
    let slope=sxy/sxx;
    let intercept=mean_y-slope*mean_x;
    let sse=points.iter().map(|(x,y)|(y-(slope*x+intercept)).powi(2)).sum::<f64>();
    let rmse=(sse/n).sqrt();
    let r_squared=if syy<=f64::EPSILON*mean_y.abs().max(1.0).powi(2)*n {
        if sse<=f64::EPSILON*mean_y.abs().max(1.0).powi(2)*n {1.0}else{0.0}
    } else {(1.0-sse/syy).clamp(0.0,1.0)};
    if !slope.is_finite()||!intercept.is_finite()||!rmse.is_finite()||!r_squared.is_finite(){return Err(RegressionError::NumericOverflow);}
    Ok(LinearFit{slope,intercept,r_squared,rmse,count:points.len()})
}
#[cfg(test)]
mod tests{
 use super::*;
 #[test] fn exact_line_has_zero_error(){let f=linear_regression(&[(0.0,1.0),(1.0,3.0),(2.0,5.0),(3.0,7.0)]).unwrap();assert!((f.slope-2.0).abs()<1e-12);assert!((f.intercept-1.0).abs()<1e-12);assert!((f.r_squared-1.0).abs()<1e-12);assert!(f.rmse<1e-12);}
 #[test] fn shifted_x_values_remain_stable(){let f=linear_regression(&[(1e9,2.0),(1e9+1.0,4.0),(1e9+2.0,6.0)]).unwrap();assert!((f.slope-2.0).abs()<1e-8);}
 #[test] fn rejects_too_few_points_and_zero_variance(){assert_eq!(linear_regression(&[(1.0,2.0)]),Err(RegressionError::TooFewPoints));assert_eq!(linear_regression(&[(1.0,2.0),(1.0,3.0)]),Err(RegressionError::ZeroXVariance));}
 #[test] fn rejects_non_finite_values(){assert_eq!(linear_regression(&[(0.0,1.0),(1.0,f64::NAN)]),Err(RegressionError::NonFiniteInput));}
}
