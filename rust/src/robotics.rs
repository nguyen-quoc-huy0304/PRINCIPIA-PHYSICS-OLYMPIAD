//! Two-link planar robot arm kinematics (SI units).
//! Analytical inverse/forward kinematics with explicit reachability checks.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum RoboticsError { NonFiniteInput, InvalidLinkLength, UnreachableTarget, InvalidElbowBranch }
#[derive(Debug, Clone, Copy, PartialEq)]
pub struct RobotArmSolution {
    pub shoulder_rad:f64, pub elbow_rad:f64, pub shoulder_deg:f64, pub elbow_deg:f64,
    pub end_x_m:f64, pub end_y_m:f64, pub target_error_m:f64, pub singular:bool,
}
fn finite(v:&[f64])->bool { v.iter().all(|x|x.is_finite()) }

/// Solve a planar 2R arm. elbow_branch: +1 elbow-up, -1 elbow-down.
pub fn inverse_kinematics(l1_m:f64,l2_m:f64,x:f64,y:f64,elbow_branch:i32)->Result<RobotArmSolution,RoboticsError>{
    if !finite(&[l1_m,l2_m,x,y]) { return Err(RoboticsError::NonFiniteInput); }
    if l1_m<=0.0||l2_m<=0.0 { return Err(RoboticsError::InvalidLinkLength); }
    if elbow_branch!=1&&elbow_branch!=-1 { return Err(RoboticsError::InvalidElbowBranch); }
    let r2=x*x+y*y; let r=r2.sqrt(); let reach=l1_m+l2_m; let min=(l1_m-l2_m).abs();
    let tol=1e-12*reach.max(1.0);
    if r>reach+tol||r<min-tol { return Err(RoboticsError::UnreachableTarget); }
    let c=((r2-l1_m*l1_m-l2_m*l2_m)/(2.0*l1_m*l2_m)).clamp(-1.0,1.0);
    let elbow=elbow_branch as f64*c.acos();
    let shoulder=y.atan2(x)-(l2_m*elbow.sin()).atan2(l1_m+l2_m*elbow.cos());
    let ex=l1_m*shoulder.cos()+l2_m*(shoulder+elbow).cos();
    let ey=l1_m*shoulder.sin()+l2_m*(shoulder+elbow).sin();
    let error=(ex-x).hypot(ey-y);
    if !finite(&[shoulder,elbow,ex,ey,error]) { return Err(RoboticsError::NonFiniteInput); }
    Ok(RobotArmSolution{shoulder_rad:shoulder,elbow_rad:elbow,shoulder_deg:shoulder.to_degrees(),
        elbow_deg:elbow.to_degrees(),end_x_m:ex,end_y_m:ey,target_error_m:error,singular:elbow.sin().abs()<1e-10})
}
/// Forward kinematics; angles are radians.
pub fn forward_kinematics(l1:f64,l2:f64,shoulder:f64,elbow:f64)->Result<[f64;2],RoboticsError>{
    if !finite(&[l1,l2,shoulder,elbow]) { return Err(RoboticsError::NonFiniteInput); }
    if l1<=0.0||l2<=0.0 { return Err(RoboticsError::InvalidLinkLength); }
    let x=l1*shoulder.cos()+l2*(shoulder+elbow).cos();
    let y=l1*shoulder.sin()+l2*(shoulder+elbow).sin();
    if !finite(&[x,y]) { return Err(RoboticsError::NonFiniteInput); } Ok([x,y])
}
#[cfg(test)]
mod tests{
 use super::*;
 #[test] fn both_elbow_branches_reach_target(){for b in [1,-1]{let s=inverse_kinematics(0.8,0.6,0.7,0.5,b).unwrap();assert!(s.target_error_m<1e-10);}}
 #[test] fn forward_inverse_roundtrip(){let p=forward_kinematics(1.0,0.5,0.4,-0.8).unwrap();let s=inverse_kinematics(1.0,0.5,p[0],p[1],-1).unwrap();assert!(s.target_error_m<1e-10);}
 #[test] fn rejects_unreachable_and_invalid_lengths(){assert_eq!(inverse_kinematics(1.0,1.0,3.0,0.0,1),Err(RoboticsError::UnreachableTarget));assert_eq!(inverse_kinematics(0.0,1.0,0.5,0.0,1),Err(RoboticsError::InvalidLinkLength));}
 #[test] fn detects_singularity(){assert!(inverse_kinematics(1.0,1.0,2.0,0.0,1).unwrap().singular);}
}
