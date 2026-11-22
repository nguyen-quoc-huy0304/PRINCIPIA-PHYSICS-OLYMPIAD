//! Typed academic content model shared by lessons, documents and media adapters.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Discipline { Physics, Mathematics, Chemistry, Biology, Astronomy, Engineering, Computing, Languages, General }
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ContentKind { Course, Unit, Lesson, Quiz, Assignment, Document, Ebook, Video, Experiment }
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ContentItem {
 pub id:String, pub parent_id:Option<String>, pub title:String, pub discipline:Discipline,
 pub kind:ContentKind, pub body:String, pub language:String, pub published:bool, pub sort_order:u32,
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ContentError { EmptyId, EmptyTitle, EmptyLanguage, SelfParent, DuplicateId }
pub fn validate_item(item:&ContentItem)->Result<(),ContentError>{
 if item.id.trim().is_empty(){return Err(ContentError::EmptyId)}
 if item.title.trim().is_empty(){return Err(ContentError::EmptyTitle)}
 if item.language.trim().is_empty(){return Err(ContentError::EmptyLanguage)}
 if item.parent_id.as_deref()==Some(item.id.as_str()){return Err(ContentError::SelfParent)}
 Ok(())
}
pub fn validate_catalog(items:&[ContentItem])->Result<(),ContentError>{
 let mut ids=std::collections::HashSet::new();
 for item in items { validate_item(item)?; if !ids.insert(&item.id){return Err(ContentError::DuplicateId)} }
 Ok(())
}
#[cfg(test)] mod tests{
 use super::*;
 fn item(id:&str)->ContentItem{ContentItem{id:id.into(),parent_id:None,title:"Lesson".into(),discipline:Discipline::Physics,kind:ContentKind::Lesson,body:String::new(),language:"vi".into(),published:true,sort_order:0}}
 #[test]fn rejects_duplicate_catalog_ids(){assert_eq!(validate_catalog(&[item("a"),item("a")]),Err(ContentError::DuplicateId))}
 #[test]fn accepts_nested_lesson(){let mut x=item("b");x.parent_id=Some("a".into());assert!(validate_item(&x).is_ok())}
}
