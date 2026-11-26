//! Platform-neutral UI state and responsive layout decisions, owned by Rust.
use serde_json::json;
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum LayoutMode { Compact, Wide, Desktop }
impl LayoutMode {
 pub fn from_width(width:u32)->Self { match width {0..=599=>Self::Compact,600..=1023=>Self::Wide,_=>Self::Desktop} }
 pub fn as_str(self)-> &'static str { match self {Self::Compact=>"compact",Self::Wide=>"wide",Self::Desktop=>"desktop"} }
}
#[derive(Clone,Debug,PartialEq,Eq)]
pub struct UiState {pub route:String,pub search_open:bool,pub search_query:String,pub active_dialog:Option<String>,pub sidebar_open:bool,pub width:u32}
impl Default for UiState {fn default()->Self{Self{route:"home".into(),search_open:false,search_query:String::new(),active_dialog:None,sidebar_open:true,width:1280}}}
#[derive(Clone,Debug,PartialEq,Eq)] pub enum UiError {InvalidRoute,InvalidDialog,InvalidWidth}
const ROUTES:&[&str]=&["home","learn","practice","olympiad","lab","games","notebook","progress","settings"];
const DIALOGS:&[&str]=&["search","settings","profile","help","notifications"];
impl UiState {
 pub fn layout(&self)->LayoutMode{LayoutMode::from_width(self.width)}
 pub fn navigate(&mut self,route:&str)->Result<(),UiError>{if !ROUTES.contains(&route){return Err(UiError::InvalidRoute)}self.route=route.to_owned();if self.layout()==LayoutMode::Compact{self.sidebar_open=false}Ok(())}
 pub fn set_width(&mut self,width:u32)->Result<(),UiError>{if width==0||width>100_000{return Err(UiError::InvalidWidth)}self.width=width;if self.layout()==LayoutMode::Compact{self.sidebar_open=false}Ok(())}
 pub fn toggle_sidebar(&mut self){self.sidebar_open=!self.sidebar_open}
 pub fn open_dialog(&mut self,name:&str)->Result<(),UiError>{if !DIALOGS.contains(&name){return Err(UiError::InvalidDialog)}self.active_dialog=Some(name.into());Ok(())}
 pub fn close_dialog(&mut self){self.active_dialog=None}
 pub fn open_search(&mut self){self.search_open=true;self.active_dialog=Some("search".into())}
 pub fn set_search(&mut self,q:&str){self.search_query=q.chars().take(256).collect()}
 pub fn close_search(&mut self){self.search_open=false;self.search_query.clear();if self.active_dialog.as_deref()==Some("search"){self.active_dialog=None}}

 pub fn apply_event(&mut self,event:&str,value:&str,width:u32)->Result<(),UiError>{
  self.set_width(width)?;
  match event {
   "navigate"=>self.navigate(value),
   "toggle_sidebar"=>{self.toggle_sidebar();Ok(())},
   "open_search"=>{self.open_search();Ok(())},
   "close_search"=>{self.close_search();Ok(())},
   "search"=>{self.open_search();self.set_search(value);Ok(())},
   "open_dialog"=>self.open_dialog(value),
   "close_dialog"=>{self.close_dialog();Ok(())},
   _=>Err(UiError::InvalidDialog)
  }
 }
 pub fn snapshot_json(&self)->String{json!({"route":self.route,"layout":self.layout().as_str(),"width":self.width,"sidebarOpen":self.sidebar_open,"searchOpen":self.search_open,"searchQuery":self.search_query,"activeDialog":self.active_dialog}).to_string()}
}
#[cfg(test)]mod tests{use super::*;
#[test]fn breakpoints(){assert_eq!(LayoutMode::from_width(599),LayoutMode::Compact);assert_eq!(LayoutMode::from_width(600),LayoutMode::Wide);assert_eq!(LayoutMode::from_width(1023),LayoutMode::Wide);assert_eq!(LayoutMode::from_width(1024),LayoutMode::Desktop);}
#[test]fn route_validation_and_mobile_sidebar(){let mut s=UiState::default();assert!(s.navigate("learn").is_ok());assert!(s.navigate("bad").is_err());s.set_width(400).unwrap();assert!(!s.sidebar_open);}
#[test]fn search_bounded_and_closes_cleanly(){let mut s=UiState::default();s.open_search();s.set_search(&"x".repeat(400));assert_eq!(s.search_query.len(),256);s.close_search();assert!(!s.search_open);assert!(s.active_dialog.is_none());}
#[test]fn reducer_validates_and_updates_state(){let mut s=UiState::default();assert!(s.apply_event("navigate","lab",390).is_ok());assert_eq!(s.route,"lab");assert!(!s.sidebar_open);assert!(s.apply_event("search","force",390).is_ok());assert_eq!(s.search_query,"force");assert!(s.apply_event("unknown","",390).is_err());}
#[test]fn dialog_allowlist(){let mut s=UiState::default();assert!(s.open_dialog("profile").is_ok());assert!(s.open_dialog("bad").is_err());}
}
