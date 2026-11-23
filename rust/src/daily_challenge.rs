//! Daily science challenge completion and XP ledger.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DailyChallenge { pub id:String, pub title:String, pub description:String, pub xp_reward:u32 }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct DailyChallengeProgress { pub day:String, pub completed_ids:Vec<String>, pub xp_awarded:u64 }
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum DailyChallengeError { InvalidDay, EmptyId, DuplicateId, UnknownChallenge }
impl DailyChallengeProgress {
 pub fn for_day(day:impl Into<String>)->Result<Self,DailyChallengeError>{let day=day.into();if !valid_day(&day){return Err(DailyChallengeError::InvalidDay)}Ok(Self{day,completed_ids:vec![],xp_awarded:0})}
 pub fn complete(&mut self,catalog:&[DailyChallenge],id:&str)->Result<u32,DailyChallengeError>{if id.trim().is_empty(){return Err(DailyChallengeError::EmptyId)}let c=catalog.iter().find(|c|c.id==id).ok_or(DailyChallengeError::UnknownChallenge)?;if self.completed_ids.iter().any(|x|x==id){return Ok(0)}self.completed_ids.push(id.to_string());self.xp_awarded=self.xp_awarded.saturating_add(c.xp_reward as u64);Ok(c.xp_reward)}
 pub fn completion_count(&self)->usize{self.completed_ids.len()}
}
pub fn validate_catalog(c:&[DailyChallenge])->Result<(),DailyChallengeError>{let mut ids=std::collections::HashSet::new();for x in c{if x.id.trim().is_empty(){return Err(DailyChallengeError::EmptyId)}if !ids.insert(x.id.as_str()){return Err(DailyChallengeError::DuplicateId)}}Ok(())}
fn valid_day(s:&str)->bool{let mut i=s.split('-');let(Some(y),Some(m),Some(d),None)=(i.next(),i.next(),i.next(),i.next())else{return false};let(Ok(y),Ok(m),Ok(d))=(y.parse::<i32>(),m.parse::<u32>(),d.parse::<u32>())else{return false};if !(1..=12).contains(&m){return false}let leap=y%4==0&&y%100!=0||y%400==0;let max=match m{1|3|5|7|8|10|12=>31,4|6|9|11=>30,2=>if leap{29}else{28},_=>0};d>=1&&d<=max}
#[cfg(test)]mod tests{use super::*;fn cat()->Vec<DailyChallenge>{vec![DailyChallenge{id:"quiz".into(),title:"Quiz".into(),description:"Solve".into(),xp_reward:25},DailyChallenge{id:"lab".into(),title:"Lab".into(),description:"Experiment".into(),xp_reward:40}]}
#[test]fn leap_day_checked(){assert!(DailyChallengeProgress::for_day("2024-02-29").is_ok());assert!(DailyChallengeProgress::for_day("2023-02-29").is_err())}
#[test]fn xp_awarded_only_once(){let mut p=DailyChallengeProgress::for_day("2026-11-23").unwrap();assert_eq!(p.complete(&cat(),"quiz"),Ok(25));assert_eq!(p.complete(&cat(),"quiz"),Ok(0));assert_eq!(p.xp_awarded,25);assert_eq!(p.completion_count(),1)}
#[test]fn rejects_unknown_id(){let mut p=DailyChallengeProgress::for_day("2026-11-23").unwrap();assert_eq!(p.complete(&cat(),"x"),Err(DailyChallengeError::UnknownChallenge))}
#[test]fn duplicate_catalog_rejected(){let mut c=cat();c.push(c[0].clone());assert_eq!(validate_catalog(&c),Err(DailyChallengeError::DuplicateId))}}
