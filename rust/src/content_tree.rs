//! Rust-owned operations for the hierarchical lesson, quiz and activity catalog.
use serde_json::{json, Value};
use std::collections::HashSet;

const MAX_BYTES: usize = 2 * 1024 * 1024;
const MAX_NODES: usize = 20_000;
const MAX_DEPTH: usize = 32;

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum TreeError {
    InvalidJson, InvalidRoot, TooLarge, TooManyNodes, TooDeep,
    InvalidNode, DuplicateId, MissingTarget, InvalidTarget, Cycle, UnsupportedOperation,
}

pub fn execute(input: &str, operation: &str, target: &str) -> Result<Value, TreeError> {
    if input.len() > MAX_BYTES { return Err(TreeError::TooLarge); }
    if target.len() > 512 { return Err(TreeError::InvalidNode); }
    let mut catalog: Value = serde_json::from_str(input).map_err(|_| TreeError::InvalidJson)?;
    let nodes = catalog.as_array().ok_or(TreeError::InvalidRoot)?;
    validate_nodes(nodes)?;
    match operation {
        "find" => Ok(find(nodes, target).cloned().unwrap_or(Value::Null)),
        "parent" => Ok(parent(nodes, target).cloned().unwrap_or(Value::Null)),
        "siblings" => Ok(json!(siblings(nodes, target).unwrap_or_default())),
        "chain" => {
            let mut path = Vec::new();
            if !build_chain(nodes, target, &mut path) { return Err(TreeError::MissingTarget); }
            Ok(json!(path))
        }
        "lessons" => {
            let mut output = Vec::new();
            collect_lessons(nodes, &mut output);
            Ok(json!(output))
        }
        "count" => Ok(json!({ "count": count_nodes(nodes) })),
        "remove" => {
            if !remove_node(catalog.as_array_mut().ok_or(TreeError::InvalidRoot)?, target) {
                return Err(TreeError::MissingTarget);
            }
            Ok(json!({ "removed": true, "catalog": catalog }))
        }
        "reorder" => {
            let (id, delta) = parse_reorder(target)?;
            let nodes = catalog.as_array_mut().ok_or(TreeError::InvalidRoot)?;
            let siblings = locate_mut(nodes, &id).ok_or(TreeError::MissingTarget)?;
            let from = siblings.iter().position(|node| node.get("id").and_then(Value::as_str) == Some(&id))
                .ok_or(TreeError::MissingTarget)?;
            let to = from as isize + delta;
            if to >= 0 && (to as usize) < siblings.len() { siblings.swap(from, to as usize); }
            Ok(json!({ "catalog": catalog }))
        }
        "move" => {
            let (id, target_id) = parse_move(target)?;
            let nodes = catalog.as_array_mut().ok_or(TreeError::InvalidRoot)?;
            let moving = find(nodes, &id).cloned().ok_or(TreeError::MissingTarget)?;
            if !target_id.is_empty() {
                let destination = find(nodes, &target_id).ok_or(TreeError::InvalidTarget)?;
                if destination.get("type").and_then(Value::as_str) != Some("tab") {
                    return Err(TreeError::InvalidTarget);
                }
                if contains_id(&moving, &target_id) { return Err(TreeError::Cycle); }
            }
            let source = locate_mut(nodes, &id).ok_or(TreeError::MissingTarget)?;
            let index = source.iter().position(|node| node.get("id").and_then(Value::as_str) == Some(&id))
                .ok_or(TreeError::MissingTarget)?;
            let item = source.remove(index);
            if target_id.is_empty() {
                nodes.push(item);
            } else {
                let destination = find_mut(nodes, &target_id).ok_or(TreeError::InvalidTarget)?;
                let children = destination.as_object_mut().ok_or(TreeError::InvalidTarget)?
                    .entry("children").or_insert_with(|| json!([]));
                children.as_array_mut().ok_or(TreeError::InvalidTarget)?.push(item);
            }
            Ok(json!({ "catalog": catalog }))
        }
        "drop" => {
            let (id, target_id) = parse_move(target)?;
            if id == target_id { return Ok(json!({ "catalog": catalog })); }
            let nodes = catalog.as_array_mut().ok_or(TreeError::InvalidRoot)?;
            let moving = find(nodes, &id).cloned().ok_or(TreeError::MissingTarget)?;
            let target = find(nodes, &target_id).ok_or(TreeError::InvalidTarget)?;
            if target.get("type").and_then(Value::as_str) != Some("tab") {
                return Err(TreeError::InvalidTarget);
            }
            if contains_id(&moving, &target_id) { return Err(TreeError::Cycle); }
            let source_parent = parent_id(nodes, &id).ok_or(TreeError::MissingTarget)?;
            let target_parent = parent_id(nodes, &target_id).ok_or(TreeError::InvalidTarget)?;
            if source_parent == target_parent {
                let siblings = locate_mut(nodes, &id).ok_or(TreeError::MissingTarget)?;
                let from = siblings.iter().position(|node| node.get("id").and_then(Value::as_str) == Some(&id))
                    .ok_or(TreeError::MissingTarget)?;
                let item = siblings.remove(from);
                let to = siblings.iter().position(|node| node.get("id").and_then(Value::as_str) == Some(&target_id))
                    .ok_or(TreeError::InvalidTarget)?;
                siblings.insert(to, item);
            } else {
                let source = locate_mut(nodes, &id).ok_or(TreeError::MissingTarget)?;
                let from = source.iter().position(|node| node.get("id").and_then(Value::as_str) == Some(&id))
                    .ok_or(TreeError::MissingTarget)?;
                let item = source.remove(from);
                let destination = find_mut(nodes, &target_id).ok_or(TreeError::InvalidTarget)?;
                let children = destination.as_object_mut().ok_or(TreeError::InvalidTarget)?
                    .entry("children").or_insert_with(|| json!([]));
                children.as_array_mut().ok_or(TreeError::InvalidTarget)?.push(item);
            }
            Ok(json!({ "catalog": catalog }))
        }
        _ => Err(TreeError::UnsupportedOperation),
    }
}

fn validate_nodes(nodes: &[Value]) -> Result<(), TreeError> {
    let mut ids = HashSet::new();
    let mut visited = 0usize;
    validate_level(nodes, 0, &mut visited, &mut ids)
}

fn validate_level(
    nodes: &[Value], depth: usize, visited: &mut usize, ids: &mut HashSet<String>,
) -> Result<(), TreeError> {
    if depth > MAX_DEPTH { return Err(TreeError::TooDeep); }
    for node in nodes {
        *visited += 1;
        if *visited > MAX_NODES { return Err(TreeError::TooManyNodes); }
        let object = node.as_object().ok_or(TreeError::InvalidNode)?;
        let id = object.get("id").and_then(Value::as_str)
            .filter(|value| !value.trim().is_empty() && value.len() <= 128)
            .ok_or(TreeError::InvalidNode)?;
        let name = object.get("name").and_then(Value::as_str)
            .filter(|value| !value.trim().is_empty() && value.len() <= 512)
            .ok_or(TreeError::InvalidNode)?;
        let kind = object.get("type").and_then(Value::as_str)
            .filter(|value| !value.trim().is_empty() && value.len() <= 32)
            .ok_or(TreeError::InvalidNode)?;
        let _ = (name, kind);
        if !ids.insert(id.to_owned()) { return Err(TreeError::DuplicateId); }
        if let Some(children) = object.get("children") {
            let children = children.as_array().ok_or(TreeError::InvalidNode)?;
            validate_level(children, depth + 1, visited, ids)?;
        }
    }
    Ok(())
}

fn find<'a>(nodes: &'a [Value], target: &str) -> Option<&'a Value> {
    for node in nodes {
        if node.get("id").and_then(Value::as_str) == Some(target) { return Some(node); }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            if let Some(found) = find(children, target) { return Some(found); }
        }
    }
    None
}

fn parent<'a>(nodes: &'a [Value], target: &str) -> Option<&'a Value> {
    for node in nodes {
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            if children.iter().any(|child| child.get("id").and_then(Value::as_str) == Some(target)) {
                return Some(node);
            }
            if let Some(found) = parent(children, target) { return Some(found); }
        }
    }
    None
}

fn siblings(nodes: &[Value], target: &str) -> Option<Vec<Value>> {
    if nodes.iter().any(|node| node.get("id").and_then(Value::as_str) == Some(target)) {
        return Some(nodes.to_vec());
    }
    for node in nodes {
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            if let Some(found) = siblings(children, target) { return Some(found); }
        }
    }
    None
}

fn build_chain(nodes: &[Value], target: &str, path: &mut Vec<Value>) -> bool {
    for node in nodes {
        path.push(node.clone());
        if node.get("id").and_then(Value::as_str) == Some(target) { return true; }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            if build_chain(children, target, path) { return true; }
        }
        path.pop();
    }
    false
}

fn collect_lessons(nodes: &[Value], output: &mut Vec<Value>) {
    for node in nodes {
        if node.get("type").and_then(Value::as_str) == Some("lesson") {
            output.push(node.clone());
        }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            collect_lessons(children, output);
        }
    }
}

fn count_nodes(nodes: &[Value]) -> usize {
    nodes.iter().map(|node| {
        let kind = node.get("type").and_then(Value::as_str).unwrap_or("");
        if matches!(kind, "lesson" | "quiz" | "fun" | "game") { return 1; }
        node.get("children").and_then(Value::as_array).map_or(0, |children| count_nodes(children))
    }).sum()
}


fn parse_reorder(raw: &str) -> Result<(String, isize), TreeError> {
    let value: Value = serde_json::from_str(raw).map_err(|_| TreeError::InvalidTarget)?;
    let id = value.get("id").and_then(Value::as_str)
        .filter(|id| !id.trim().is_empty() && id.len() <= 128)
        .ok_or(TreeError::InvalidTarget)?.to_owned();
    let delta = value.get("delta").and_then(Value::as_i64)
        .filter(|delta| (-1..=1).contains(delta) && *delta != 0)
        .ok_or(TreeError::InvalidTarget)? as isize;
    Ok((id, delta))
}

fn parse_move(raw: &str) -> Result<(String, String), TreeError> {
    let value: Value = serde_json::from_str(raw).map_err(|_| TreeError::InvalidTarget)?;
    let id = value.get("id").and_then(Value::as_str)
        .filter(|id| !id.trim().is_empty() && id.len() <= 128)
        .ok_or(TreeError::InvalidTarget)?.to_owned();
    let target = value.get("targetId").and_then(Value::as_str).unwrap_or("");
    if target.len() > 128 { return Err(TreeError::InvalidTarget); }
    Ok((id, target.to_owned()))
}

fn locate_mut(nodes: &mut Vec<Value>, target: &str) -> Option<&mut Vec<Value>> {
    if nodes.iter().any(|node| node.get("id").and_then(Value::as_str) == Some(target)) {
        return Some(nodes);
    }
    for node in nodes {
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            if let Some(found) = locate_mut(children, target) { return Some(found); }
        }
    }
    None
}

fn find_mut(nodes: &mut [Value], target: &str) -> Option<&mut Value> {
    for node in nodes {
        if node.get("id").and_then(Value::as_str) == Some(target) { return Some(node); }
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            if let Some(found) = find_mut(children, target) { return Some(found); }
        }
    }
    None
}


fn parent_id(nodes: &[Value], target: &str, parent: Option<&str>) -> Option<String> {
    for node in nodes {
        let id = node.get("id").and_then(Value::as_str)?;
        if id == target { return Some(parent.unwrap_or("").to_owned()); }
        if let Some(children) = node.get("children").and_then(Value::as_array) {
            if let Some(found) = parent_id(children, target, Some(id)) { return Some(found); }
        }
    }
    None
}

fn contains_id(node: &Value, target: &str) -> bool {
    if node.get("id").and_then(Value::as_str) == Some(target) { return true; }
    node.get("children").and_then(Value::as_array)
        .is_some_and(|children| children.iter().any(|child| contains_id(child, target)))
}

fn remove_node(nodes: &mut Vec<Value>, target: &str) -> bool {
    if let Some(index) = nodes.iter().position(|node| node.get("id").and_then(Value::as_str) == Some(target)) {
        nodes.remove(index);
        return true;
    }
    for node in nodes {
        if let Some(children) = node.get_mut("children").and_then(Value::as_array_mut) {
            if remove_node(children, target) { return true; }
        }
    }
    false
}

#[cfg(test)]
mod tests {
    use super::*;

    const SAMPLE: &str = r#"[{"id":"physics","name":"Vật lý","type":"tab","children":[{"id":"mechanics","name":"Cơ học","type":"tab","children":[{"id":"newton","name":"Định luật Newton","type":"lesson"}]},{"id":"quiz","name":"Kiểm tra","type":"quiz"}]}]"#;

    #[test]
    fn finds_parent_chain_and_siblings() {
        assert_eq!(execute(SAMPLE, "find", "newton").unwrap()["name"], "Định luật Newton");
        assert_eq!(execute(SAMPLE, "parent", "newton").unwrap()["id"], "mechanics");
        assert_eq!(execute(SAMPLE, "chain", "newton").unwrap().as_array().unwrap().len(), 3);
        assert_eq!(execute(SAMPLE, "siblings", "mechanics").unwrap().as_array().unwrap().len(), 2);
    }

    #[test]
    fn counts_lessons_and_removes_without_mutating_input() {
        assert_eq!(execute(SAMPLE, "count", "").unwrap()["count"], 2);
        assert_eq!(execute(SAMPLE, "lessons", "").unwrap().as_array().unwrap().len(), 1);
        let removed = execute(SAMPLE, "remove", "mechanics").unwrap();
        assert_eq!(removed["catalog"][0]["children"].as_array().unwrap().len(), 1);
        assert!(execute(SAMPLE, "find", "mechanics").is_ok());
    }

    #[test]
    fn rejects_invalid_catalogs_and_unknown_operations() {
        assert_eq!(execute("{}", "find", "x"), Err(TreeError::InvalidRoot));
        assert_eq!(execute(SAMPLE, "unknown", ""), Err(TreeError::UnsupportedOperation));
        let duplicate = r#"[{"id":"x","name":"A","type":"tab"},{"id":"x","name":"B","type":"tab"}]"#;
        assert_eq!(execute(duplicate, "count", ""), Err(TreeError::DuplicateId));
    }

    #[test]
    fn reorders_and_moves_nodes_without_breaking_tree_invariants() {
        let reordered = execute(SAMPLE, "reorder", r#"{"id":"quiz","delta":-1}"#).unwrap();
        assert_eq!(reordered["catalog"][0]["children"][0]["id"], "quiz");
        let moved = execute(SAMPLE, "move", r#"{"id":"newton","targetId":"physics"}"#).unwrap();
        assert_eq!(moved["catalog"][0]["children"][2]["id"], "newton");
        let cycle = execute(SAMPLE, "move", r#"{"id":"physics","targetId":"mechanics"}"#);
        assert_eq!(cycle, Err(TreeError::Cycle));
        let invalid = execute(SAMPLE, "move", r#"{"id":"newton","targetId":"quiz"}"#);
        assert_eq!(invalid, Err(TreeError::InvalidTarget));
    }

    #[test]
    fn drag_drop_reorders_siblings_or_moves_into_tabs() {
        let reordered = execute(SAMPLE, "drop", r#"{"id":"quiz","targetId":"mechanics"}"#).unwrap();
        assert_eq!(reordered["catalog"][0]["children"][0]["id"], "quiz");
        let moved = execute(SAMPLE, "drop", r#"{"id":"newton","targetId":"physics"}"#).unwrap();
        assert_eq!(moved["catalog"][0]["children"][2]["id"], "newton");
        assert_eq!(execute(SAMPLE, "drop", r#"{"id":"physics","targetId":"mechanics"}"#), Err(TreeError::Cycle));
    }

    #[test]
    fn rejects_missing_targets_and_limits() {
        assert_eq!(execute(SAMPLE, "remove", "missing"), Err(TreeError::MissingTarget));
        assert_eq!(execute(&" ".repeat(MAX_BYTES + 1), "find", ""), Err(TreeError::TooLarge));
    }
}
