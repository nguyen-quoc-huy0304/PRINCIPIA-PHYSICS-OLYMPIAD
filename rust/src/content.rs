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
    global_search_index_json(input, query, "lesson")
}

/// Rust-owned global search index. Traversal, inherited content kinds, question
/// normalization and matching all execute in the core rather than browser JS.
pub fn global_search_index_json(
    input: &str,
    query: &str,
    default_kind: &str,
) -> Result<Value, CatalogError> {
    if input.len() > MAX_CATALOG_BYTES { return Err(CatalogError::TooLarge); }
    if query.len() > 512 { return Err(CatalogError::InvalidNode); }
    if !matches!(default_kind, "lesson" | "quiz" | "fun") {
        return Err(CatalogError::InvalidNode);
    }
    let root: Value = serde_json::from_str(input).map_err(|_| CatalogError::InvalidJson)?;
    let nodes = root.as_array().ok_or(CatalogError::InvalidRoot)?;
    let needle = query.trim().to_lowercase();
    let mut ids = HashSet::new();
    let mut flat = Vec::new();
    let mut path = Vec::new();
    for node in nodes {
        visit_node(node, None, 0, default_kind, &needle, &mut path, &mut ids, &mut flat)?;
    }
    Ok(json!({ "count": flat.len(), "items": flat }))
}

fn visit_node(
    node: &Value,
    parent_id: Option<&str>,
    depth: usize,
    inherited_kind: &str,
    query: &str,
    path: &mut Vec<String>,
    ids: &mut HashSet<String>,
    output: &mut Vec<Value>,
) -> Result<(), CatalogError> {
    if depth > MAX_TREE_DEPTH { return Err(CatalogError::TooDeep); }
    if output.len() >= MAX_CATALOG_NODES { return Err(CatalogError::TooManyNodes); }
    let object = node.as_object().ok_or(CatalogError::InvalidNode)?;
    let id = object.get("id").and_then(Value::as_str)
        .filter(|v| !v.trim().is_empty() && v.len() <= 128).ok_or(CatalogError::InvalidNode)?;
    if !ids.insert(id.to_owned()) { return Err(CatalogError::DuplicateId); }
    let name = object.get("name").and_then(Value::as_str).unwrap_or("Không tên");
    if name.len() > 512 { return Err(CatalogError::InvalidNode); }
    let content = object.get("content").and_then(Value::as_str).unwrap_or("");
    if content.len() > 256 * 1024 { return Err(CatalogError::InvalidNode); }
    let kind = match object.get("type").and_then(Value::as_str) {
        Some("quiz") => "quiz",
        Some("fun") => "fun",
        Some("lesson") => "lesson",
        _ => inherited_kind,
    };
    path.push(name.to_owned());
    let path_text = path.join(" › ");
    let questions = normalize_search_questions(object.get("questions"))?;
    let question_text = questions.iter().map(|question| {
        let prompt = question.get("q").and_then(Value::as_str).unwrap_or("");
        let explanation = question.get("explanation").and_then(Value::as_str).unwrap_or("");
        let answers = question.get("a").and_then(Value::as_array)
            .map(|items| items.iter().filter_map(Value::as_str).collect::<Vec<_>>().join(" "))
            .unwrap_or_default();
        format!("{prompt} {answers} {explanation}")
    }).collect::<Vec<_>>().join(" ");
    let searchable = format!("{id} {name} {path_text} {content} {question_text}").to_lowercase();
    if query.is_empty() || searchable.contains(query) {
        output.push(json!({
            "id": id, "name": name, "type": kind, "kind": kind,
            "parentId": parent_id, "path": path_text, "depth": depth, "content": content,
            "icon": object.get("icon").and_then(Value::as_str).unwrap_or(""),
            "questions": questions
        }));
    }
    if let Some(children) = object.get("children") {
        let children = children.as_array().ok_or(CatalogError::InvalidNode)?;
        for child in children {
            visit_node(child, Some(id), depth + 1, kind, query, path, ids, output)?;
        }
    }
    path.pop();
    Ok(())
}

fn normalize_search_questions(value: Option<&Value>) -> Result<Vec<Value>, CatalogError> {
    let Some(value) = value else { return Ok(Vec::new()); };
    let items = value.as_array().filter(|items| items.len() <= 500)
        .ok_or(CatalogError::InvalidNode)?;
    let mut normalized = Vec::with_capacity(items.len());
    for item in items {
        let (prompt, answers, explanation) = if let Some(prompt) = item.as_str() {
            (prompt, Vec::new(), "")
        } else {
            let object = item.as_object().ok_or(CatalogError::InvalidNode)?;
            let prompt = object.get("q").and_then(Value::as_str).unwrap_or("");
            let explanation = object.get("explanation").and_then(Value::as_str).unwrap_or("");
            let answers = object.get("a").and_then(Value::as_array)
                .map(|values| values.iter().filter_map(|answer| match answer {
                    Value::String(value) => Some(value.clone()),
                    Value::Number(value) => Some(value.to_string()),
                    Value::Bool(value) => Some(value.to_string()),
                    _ => None,
                }).collect::<Vec<_>>()).unwrap_or_default();
            (prompt, answers, explanation)
        };
        if prompt.len() > 4096 || explanation.len() > 16_384
            || answers.iter().any(|answer| answer.len() > 2048) {
            return Err(CatalogError::InvalidNode);
        }
        normalized.push(json!({ "q": prompt, "a": answers, "explanation": explanation }));
    }
    Ok(normalized)
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
    fn global_search_matches_question_answers_and_inherited_kinds() {
        let input = r#"[{"id":"root","name":"Cơ học","type":"tab","children":[{"id":"quiz-1","name":"Ôn tập","type":"quiz","questions":[{"q":"Động lượng là gì?","a":["kg m/s"],"explanation":"Bảo toàn động lượng"}]},{"id":"lesson-1","name":"Bài Newton","type":"lesson","content":"F = ma"}]}]"#;
        let result = global_search_index_json(input, "bảo toàn", "lesson").unwrap();
        assert_eq!(result["count"], 1);
        assert_eq!(result["items"][0]["kind"], "quiz");
        assert_eq!(result["items"][0]["parentId"], "root");
        assert_eq!(result["items"][0]["path"], "Cơ học › Ôn tập");
        let all = global_search_index_json(input, "", "lesson").unwrap();
        assert_eq!(all["items"][2]["kind"], "lesson");
    }

    #[test]
    fn global_search_validates_query_and_default_kind() {
        let input = r#"[{"id":"a","name":"A","type":"lesson"}]"#;
        assert_eq!(global_search_index_json(input, "x".repeat(513).as_str(), "lesson"), Err(CatalogError::InvalidNode));
        assert_eq!(global_search_index_json(input, "", "unknown"), Err(CatalogError::InvalidNode));
    }

    #[test]
    fn rejects_oversized_payload() {
        let input = format!("[{{\"id\":\"x\",\"name\":\"{}\",\"type\":\"tab\"}}]", "x".repeat(MAX_CATALOG_BYTES));
        assert_eq!(index_catalog_json(&input, ""), Err(CatalogError::TooLarge));
    }
}
