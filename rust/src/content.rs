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

use serde_json::{json, Value};
use std::collections::HashSet;

const MAX_CATALOG_BYTES: usize = 2 * 1024 * 1024;
const MAX_CATALOG_NODES: usize = 20_000;
const MAX_TREE_DEPTH: usize = 32;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CatalogError { InvalidJson, InvalidRoot, TooLarge, TooManyNodes, TooDeep, InvalidNode, DuplicateId }

/// Validate the hierarchical content tree used by the legacy browser application.
/// Returns a normalized flat index; all traversal and hierarchy checks execute in Rust.
pub fn index_catalog_json(input: &str, query: &str) -> Result<Value, CatalogError> {
    if input.len() > MAX_CATALOG_BYTES { return Err(CatalogError::TooLarge); }
    let root: Value = serde_json::from_str(input).map_err(|_| CatalogError::InvalidJson)?;
    let nodes = root.as_array().ok_or(CatalogError::InvalidRoot)?;
    let needle = query.trim().to_lowercase();
    if needle.len() > 512 { return Err(CatalogError::InvalidNode); }
    let mut ids = HashSet::new();
    let mut flat = Vec::new();
    for node in nodes {
        visit_node(node, None, 0, &needle, &mut ids, &mut flat)?;
    }
    Ok(json!({ "count": flat.len(), "items": flat }))
}

fn visit_node(
    node: &Value,
    parent_id: Option<&str>,
    depth: usize,
    query: &str,
    ids: &mut HashSet<String>,
    output: &mut Vec<Value>,
) -> Result<(), CatalogError> {
    if depth > MAX_TREE_DEPTH { return Err(CatalogError::TooDeep); }
    if output.len() >= MAX_CATALOG_NODES { return Err(CatalogError::TooManyNodes); }
    let object = node.as_object().ok_or(CatalogError::InvalidNode)?;
    let id = object.get("id").and_then(Value::as_str)
        .filter(|v| !v.trim().is_empty() && v.len() <= 128).ok_or(CatalogError::InvalidNode)?;
    let name = object.get("name").and_then(Value::as_str)
        .filter(|v| !v.trim().is_empty() && v.len() <= 512).ok_or(CatalogError::InvalidNode)?;
    let kind = object.get("type").and_then(Value::as_str)
        .filter(|v| v.len() <= 32).ok_or(CatalogError::InvalidNode)?;
    if !ids.insert(id.to_owned()) { return Err(CatalogError::DuplicateId); }
    let content = object.get("content").and_then(Value::as_str).unwrap_or("");
    if content.len() > 256 * 1024 { return Err(CatalogError::InvalidNode); }
    let matched = query.is_empty() || name.to_lowercase().contains(query)
        || content.to_lowercase().contains(query) || id.to_lowercase().contains(query);
    if matched {
        output.push(json!({
            "id": id, "name": name, "type": kind,
            "parentId": parent_id, "depth": depth,
            "icon": object.get("icon").and_then(Value::as_str).unwrap_or(""),
            "content": content
        }));
    }
    if let Some(children) = object.get("children") {
        let children = children.as_array().ok_or(CatalogError::InvalidNode)?;
        for child in children {
            visit_node(child, Some(id), depth + 1, query, ids, output)?;
        }
    }
    Ok(())
}

#[cfg(test)]
mod catalog_tests {
    use super::*;
    #[test]
    fn indexes_nested_content_and_searches_in_rust() {
        let input = r#"[{"id":"physics","name":"Vật lý","type":"tab","children":[{"id":"newton","name":"Định luật Newton","type":"lesson","content":"F = ma"}]}]"#;
        let result = index_catalog_json(input, "newton").unwrap();
        assert_eq!(result["count"], 1);
        assert_eq!(result["items"][0]["parentId"], "physics");
    }
    #[test]
    fn rejects_duplicate_ids_and_deep_trees() {
        let duplicate = r#"[{"id":"x","name":"A","type":"tab"},{"id":"x","name":"B","type":"tab"}]"#;
        assert_eq!(index_catalog_json(duplicate, ""), Err(CatalogError::DuplicateId));
        let mut nested = r#"{"id":"n","name":"N","type":"tab"}"#.to_string();
        for _ in 0..34 { nested = format!(r#"{{"id":"n{}","name":"N","type":"tab","children":[{}]}}"#, nested.len(), nested); }
        assert_eq!(index_catalog_json(&format!("[{}]", nested), ""), Err(CatalogError::TooDeep));
    }
    #[test]
    fn rejects_oversized_payload() {
        let input = format!("[{{\"id\":\"x\",\"name\":\"{}\",\"type\":\"tab\"}}]", "x".repeat(MAX_CATALOG_BYTES));
        assert_eq!(index_catalog_json(&input, ""), Err(CatalogError::TooLarge));
    }
}
