/* PRINCIPIA Sidebar Collapse — independent, accessible desktop navigation control. */
(() => {
  'use strict';
  const ROOT = '#app';
  const STORAGE_KEY = 'principia_sidebar_collapsed_v1';
  const DESKTOP = '(min-width: 901px)';
  const SHELLS = ['#app > .layout', '#app > .principia-desktop-shell'];
  const isDesktop = () => window.matchMedia(DESKTOP).matches;
  let collapsed = false;
  let observer;

  function readPreference() {
    try { return window.localStorage.getItem(STORAGE_KEY) === '1'; }
    catch (error) { return false; }
  }

  function persistPreference(value) {
    try { window.localStorage.setItem(STORAGE_KEY, value ? '1' : '0'); }
    catch (error) { console.warn('[PRINCIPIA] Sidebar preference could not be saved', error); }
  }

  function getShells() {
    return SHELLS.flatMap(selector => Array.from(document.querySelectorAll(selector)));
  }

  function applyState(shell) {
    if (!shell) return;
    shell.classList.toggle('pr-sidebar-collapsed', collapsed);
    const sidebar = shell.querySelector(':scope > .sidebar');
    const button = sidebar?.querySelector(':scope > .principia-sidebar-toggle');
    if (!button) return;
    button.setAttribute('aria-expanded', String(!collapsed));
    button.setAttribute('aria-label', collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên');
    button.title = collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên';
    const icon = button.querySelector('.pr-sidebar-toggle-icon');
    const label = button.querySelector('.pr-sidebar-toggle-label');
    if (icon) icon.textContent = collapsed ? '›' : '‹';
    if (label) label.textContent = collapsed ? 'Mở rộng' : 'Thu gọn';
  }

  function createToggle(shell, sidebar) {
    if (sidebar.querySelector(':scope > .principia-sidebar-toggle')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'principia-sidebar-toggle';
    button.innerHTML = '<span class="pr-sidebar-toggle-icon" aria-hidden="true">‹</span><span class="pr-sidebar-toggle-label">Thu gọn</span>';
    button.addEventListener('click', () => {
      collapsed = !collapsed;
      persistPreference(collapsed);
      getShells().forEach(applyState);
    });
    const brand = sidebar.querySelector(':scope > .brand');
    if (brand) brand.insertAdjacentElement('afterend', button);
    else sidebar.insertAdjacentElement('afterbegin', button);
    sidebar.querySelectorAll('.nav').forEach(item => {
      const label = item.getAttribute('aria-label') || item.textContent.trim().replace(/\s+/g, ' ');
      if (label && !item.hasAttribute('title')) item.title = label.slice(0, 100);
      if (label && !item.hasAttribute('aria-label')) item.setAttribute('aria-label', label.slice(0, 100));
    });
    applyState(shell);
  }

  function mount() {
    if (!isDesktop()) return;
    getShells().forEach(shell => {
      const sidebar = shell.querySelector(':scope > .sidebar');
      if (sidebar) createToggle(shell, sidebar);
      applyState(shell);
    });
  }

  function init() {
    const root = document.querySelector(ROOT);
    if (!root || root.dataset.prSidebarCollapseReady) return;
    root.dataset.prSidebarCollapseReady = '1';
    collapsed = readPreference();
    mount();
    observer = new MutationObserver(records => {
      if (records.some(record => record.addedNodes.length || record.removedNodes.length)) mount();
    });
    observer.observe(root, { childList: true, subtree: true });
    const media = window.matchMedia(DESKTOP);
    media.addEventListener?.('change', mount);
    document.addEventListener('principia:rendered', mount);
    document.addEventListener('principia:page-changed', mount);
    document.addEventListener('keydown', event => {
      if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'b' && isDesktop()) {
        event.preventDefault();
        collapsed = !collapsed;
        persistPreference(collapsed);
        getShells().forEach(applyState);
      }
    });
    window.addEventListener('pagehide', () => observer?.disconnect(), { once: true });
    window.PrincipiaSidebar = Object.freeze({
      collapse: () => { collapsed = true; persistPreference(true); getShells().forEach(applyState); },
      expand: () => { collapsed = false; persistPreference(false); getShells().forEach(applyState); },
      toggle: () => { collapsed = !collapsed; persistPreference(collapsed); getShells().forEach(applyState); },
      isCollapsed: () => collapsed
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
