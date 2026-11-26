//! Safe, platform-neutral HTML primitives for the Rust-owned PRINCIPIA navigation shell.
use crate::ui_state::UiState;

const NAV: &[(&str, &str, &str)] = &[
    ("home", "Trang chủ", "⌂"), ("learn", "Học tập", "▤"),
    ("practice", "Luyện tập", "✓"), ("olympiad", "Olympiad", "★"),
    ("lab", "Phòng thí nghiệm", "⚗"), ("games", "Trò chơi", "◇"),
    ("notebook", "Sổ tay", "▣"), ("progress", "Tiến độ", "↗"),
    ("settings", "Cài đặt", "⚙"),
];
fn escape_html(value: &str) -> String {
    value.chars().map(|ch| match ch {
        '&' => "&amp;".to_owned(), '<' => "&lt;".to_owned(),
        '>' => "&gt;".to_owned(), '"' => "&quot;".to_owned(),
        '\'' => "&#39;".to_owned(), _ => ch.to_string(),
    }).collect()
}
pub fn render_shell(state: &UiState) -> String {
    let layout = state.layout().as_str();
    let nav = NAV.iter().map(|(route, label, icon)| {
        let active = if state.route == *route { " is-active" } else { "" };
        format!("<button class=\"pr-nav-item{active}\" type=\"button\" data-pr-route=\"{route}\" aria-current=\"{}\"><span aria-hidden=\"true\">{icon}</span><span>{label}</span></button>", if active.is_empty() { "false" } else { "page" })
    }).collect::<String>();
    let query = escape_html(&state.search_query);
    let search = if state.search_open { format!("<form class=\"pr-search-form\" data-pr-search-form><input type=\"search\" maxlength=\"256\" name=\"q\" aria-label=\"Tìm kiếm\" value=\"{query}\" placeholder=\"Tìm nội dung…\"/><button type=\"submit\">Tìm</button></form>") } else { String::new() };
    format!("<section class=\"pr-rust-shell\" data-pr-layout=\"{layout}\" data-pr-route=\"{}\"><header class=\"pr-rust-header\"><a class=\"pr-brand\" href=\"#home\" data-pr-route=\"home\"><span class=\"pr-brand-mark\">P</span><span><strong>PRINCIPIA</strong><small>PHYSICS OLYMPIAD</small></span></a><button type=\"button\" class=\"pr-search-toggle\" data-pr-search aria-expanded=\"{}\">⌕ Tìm kiếm</button></header><div class=\"pr-rust-layout\"><nav class=\"pr-rust-nav\" aria-label=\"Điều hướng chính\">{nav}</nav><main class=\"pr-rust-content\"><div class=\"pr-route-heading\"><p>PRINCIPIA / LEARNING SYSTEM</p><h1>{}</h1><p>Không gian học tập và nghiên cứu khoa học.</p>{search}</div><div class=\"pr-route-card\"><span class=\"pr-route-icon\">✦</span><h2>{}</h2><p>Chọn một module để tiếp tục học, luyện tập, mô phỏng hoặc theo dõi tiến độ.</p><div class=\"pr-route-actions\"><button type=\"button\" data-pr-route=\"learn\">Bắt đầu học</button><button type=\"button\" data-pr-route=\"lab\">Mở phòng thí nghiệm</button></div></div></main></div></section>", escape_html(&state.route), state.search_open, route_label(&state.route), route_label(&state.route))
}
fn route_label(route: &str) -> &'static str { NAV.iter().find(|(key, _, _)| *key == route).map(|(_, label, _)| *label).unwrap_or("PRINCIPIA") }
#[cfg(test)]
mod tests {
 use super::*;
 #[test] fn shell_contains_validated_route_and_accessible_navigation() { let mut state=UiState::default(); state.navigate("learn").unwrap(); let html=render_shell(&state); assert!(html.contains("data-pr-layout=\"desktop\"")); assert!(html.contains("data-pr-route=\"learn\"")); assert!(html.contains("aria-current=\"page\"")); assert!(html.contains("Học tập")); }
 #[test] fn search_input_escapes_user_markup() { let mut state=UiState::default(); state.open_search(); state.set_search("<script>alert('x')</script>"); let html=render_shell(&state); assert!(!html.contains("<script>alert")); assert!(html.contains("&lt;script&gt;")); }
 #[test] fn compact_view_is_marked_for_css_layout() { let mut state=UiState::default(); state.set_width(390).unwrap(); assert!(render_shell(&state).contains("data-pr-layout=\"compact\"")); }
}

#[test]
fn empty_query_search_dialog_renders_search_form() {
    let mut state = UiState::default();
    state.open_search();
    let html = render_shell(&state);
    assert!(html.contains("data-pr-search-form"));
    assert!(html.contains("type=\"search\""));
}
