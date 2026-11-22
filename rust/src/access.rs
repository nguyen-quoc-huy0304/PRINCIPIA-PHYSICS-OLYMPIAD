//! Central authorization policy. The client UI must never be treated as authority.
pub const OWNER_EMAIL: &str = "huyquocnguyen03042011@gmail.com";

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Role { Owner, Viewer }

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Action {
    Read, Learn, RunSimulation, SubmitWork, EditContent, ManageUsers, ChangeSettings,
}

pub fn role_for(email: Option<&str>) -> Role {
    match email.map(str::trim).map(str::to_ascii_lowercase) {
        Some(value) if value == OWNER_EMAIL => Role::Owner,
        _ => Role::Viewer,
    }
}

pub fn allowed(role: Role, action: Action) -> bool {
    match role {
        Role::Owner => true,
        Role::Viewer => matches!(action,
            Action::Read | Action::Learn | Action::RunSimulation | Action::SubmitWork
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn only_owner_can_edit() {
        assert_eq!(role_for(Some(OWNER_EMAIL)), Role::Owner);
        assert!(allowed(Role::Owner, Action::EditContent));
        assert!(!allowed(Role::Viewer, Action::EditContent));
        assert!(allowed(Role::Viewer, Action::RunSimulation));
    }
}
