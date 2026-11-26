//! Native Rust spaced-repetition scheduling core.
#[derive(Clone,Debug,PartialEq)]
pub struct CardSchedule{pub repetitions:u32,pub ease:f64,pub interval_days:u32,pub due_at_ms:i64}
#[derive(Clone,Debug,PartialEq)]
pub enum ScheduleError{InvalidGrade,InvalidTimestamp}
pub fn schedule(c:&CardSchedule,grade:u8,now:i64)->Result<CardSchedule,ScheduleError>{
 if grade>5{return Err(ScheduleError::InvalidGrade)} if now<0{return Err(ScheduleError::InvalidTimestamp)}
 let ease=if c.ease.is_finite(){c.ease.clamp(1.3,3.0)}else{2.5};let d=5_i32-grade as i32;
 let next=(ease+0.1-d as f64*(0.08+d.max(0) as f64*0.02)).clamp(1.3,3.0);
 let (reps,days)=if grade<3{(0,1)}else if c.repetitions==0{(1,1)}else if c.repetitions==1{(2,6)}else{let interval=((c.interval_days as f64*next).round() as u32).max(1);(c.repetitions.saturating_add(1),interval)};
 let due=now.checked_add((days as i64).checked_mul(86_400_000).ok_or(ScheduleError::InvalidTimestamp)?).ok_or(ScheduleError::InvalidTimestamp)?;
 Ok(CardSchedule{repetitions:reps,ease:next,interval_days:days,due_at_ms:due})
}
#[cfg(test)]mod tests{use super::*;fn c()->CardSchedule{CardSchedule{repetitions:0,ease:2.5,interval_days:0,due_at_ms:0}}
#[test]fn first_review_day(){let x=schedule(&c(),4,100).unwrap();assert_eq!(x.interval_days,1);assert_eq!(x.repetitions,1);}
#[test]fn hard_grade_resets(){let x=schedule(&CardSchedule{repetitions:5,ease:2.4,interval_days:20,due_at_ms:0},1,10).unwrap();assert_eq!(x.interval_days,1);assert_eq!(x.repetitions,0);}
#[test]fn invalid_grade(){assert_eq!(schedule(&c(),6,10),Err(ScheduleError::InvalidGrade));}}
