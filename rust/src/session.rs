//! Authentication identity mapping and role policy. Identity tokens are verified by platform adapters.
pub const OWNER_EMAIL:&str="huyquocnguyen03042011@gmail.com";
#[derive(Debug,Clone,PartialEq,Eq)]
pub struct Principal { pub subject:String, pub email:String, pub display_name:String }
#[derive(Debug,Clone,Copy,PartialEq,Eq)]
pub enum Role { Owner, Viewer }
#[derive(Debug,Clone,Copy,PartialEq,Eq)]
pub enum Capability { Read, Learn, Submit, RunLab, ManageUsers, EditContent, ManageSettings, Publish }
pub fn role_for(p:&Principal)->Role{
 if p.email.trim().eq_ignore_ascii_case(OWNER_EMAIL){Role::Owner}else{Role::Viewer}
}
pub fn allowed(role:Role,cap:Capability)->bool{
 match role { Role::Owner=>true, Role::Viewer=>matches!(cap,Capability::Read|Capability::Learn|Capability::Submit|Capability::RunLab) }
}
#[cfg(test)]mod tests{
 use super::*;
 fn p(email:&str)->Principal{Principal{subject:"u".into(),email:email.into(),display_name:"Learner".into()}}
 #[test]fn owner_is_exact_email(){assert_eq!(role_for(&p(OWNER_EMAIL)),Role::Owner);assert_eq!(role_for(&p("other@example.com")),Role::Viewer)}
 #[test]fn viewers_cannot_edit_or_manage(){assert!(!allowed(Role::Viewer,Capability::EditContent));assert!(!allowed(Role::Viewer,Capability::ManageUsers));assert!(allowed(Role::Viewer,Capability::Learn))}
}
