#[derive(Debug, Clone, PartialEq, Eq)]
pub struct GrantDecision { pub email: String, pub role: String, pub remove: bool }

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum GrantError { InvalidEmail, OwnerCannotBeGranted, InvalidRole }

pub fn validate_grant(email: &str, role: &str, owner_email: &str) -> Result<GrantDecision, GrantError> {
    let normalized = email.trim().to_ascii_lowercase();
    if normalized.len() > 254 || !valid_email(&normalized) { return Err(GrantError::InvalidEmail); }
    if normalized == owner_email.trim().to_ascii_lowercase() { return Err(GrantError::OwnerCannotBeGranted); }
    if !matches!(role, "viewer" | "editor" | "media") { return Err(GrantError::InvalidRole); }
    Ok(GrantDecision { email: normalized, role: role.to_owned(), remove: role == "viewer" })
}

fn valid_email(value: &str) -> bool {
    let mut parts = value.split('@');
    let local = match parts.next() { Some(v) if !v.is_empty() && v.len() <= 64 => v, _ => return false };
    let domain = match parts.next() { Some(v) if !v.is_empty() && !v.starts_with('.') && !v.ends_with('.') => v, _ => return false };
    if parts.next().is_some() || local.starts_with('.') || local.ends_with('.') || local.contains("..") { return false; }
    let mut labels = domain.split('.');
    labels.clone().all(|label| !label.is_empty() && label.len() <= 63
        && label.chars().all(|c| c.is_ascii_alphanumeric() || c == '-')
        && !label.starts_with('-') && !label.ends_with('-')) && labels.count() >= 2
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn normalizes_and_removes_viewer() {
        let grant = validate_grant(" User@Example.COM ", "viewer", "owner@example.com").unwrap();
        assert_eq!(grant.email, "user@example.com"); assert!(grant.remove);
    }
    #[test] fn rejects_owner_and_unknown_roles() {
        assert_eq!(validate_grant("owner@example.com", "editor", "owner@example.com"), Err(GrantError::OwnerCannotBeGranted));
        assert_eq!(validate_grant("user@example.com", "admin", "owner@example.com"), Err(GrantError::InvalidRole));
    }
    #[test] fn rejects_malformed_addresses() {
        for email in ["", "x", "x@", "@example.com", "x..y@example.com", "x@example", "x@-bad.com"] {
            assert_eq!(validate_grant(email, "editor", "owner@example.com"), Err(GrantError::InvalidEmail));
        }
    }
}