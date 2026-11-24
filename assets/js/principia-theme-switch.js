/* PRINCIPIA Day/Night Switch — persistent theme and accessible floating control. */
(() => {
  'use strict';
  const KEY = 'principia_theme_mode_v1';
  const root = document.documentElement;
  const valid = new Set(['dark', 'light']);
  const media = window.matchMedia?.('(prefers-color-scheme: light)');
  let mode = readMode();

  function readMode() {
    try {
      const stored = localStorage.getItem(KEY);
      return valid.has(stored) ? stored : 'dark';
    } catch (_) {
      return 'dark';
    }
  }

  function persist() {
    try { localStorage.setItem(KEY, mode); } catch (_) { /* Storage can be unavailable. */ }
  }

  function apply(next, animate = true) {
    if (!valid.has(next)) return;
    const update = () => {
      mode = next;
      root.dataset.prTheme = mode;
      root.dataset.theme = mode;
      root.style.colorScheme = mode;
      const button = document.getElementById('principiaThemeSwitch');
      if (button) {
        const light = mode === 'light';
        button.setAttribute('aria-label', light ? 'Chuyển sang giao diện ban đêm' : 'Chuyển sang giao diện ban ngày');
        button.setAttribute('aria-pressed', String(light));
        button.title = light ? 'Chuyển sang ban đêm' : 'Chuyển sang ban ngày';
        button.querySelector('.pr-theme-icon').textContent = light ? '☀' : '☾';
        button.querySelector('.pr-theme-label').textContent = light ? 'Ban ngày' : 'Ban đêm';
      }
    };
    if (animate && typeof document.startViewTransition === 'function') {
      document.startViewTransition(update);
    } else {
      root.classList.add('pr-theme-changing');
      update();
      if (animate) requestAnimationFrame(() => root.classList.remove('pr-theme-changing'));
      else root.classList.remove('pr-theme-changing');
    }
    persist();
  }

  function mount() {
    if (document.getElementById('principiaThemeSwitch')) return;
    const button = document.createElement('button');
    button.id = 'principiaThemeSwitch';
    button.type = 'button';
    button.className = 'pr-theme-switch';
    button.innerHTML = '<span class="pr-theme-icon" aria-hidden="true">☾</span><span class="pr-theme-label">Ban đêm</span>';
    button.addEventListener('click', () => apply(mode === 'dark' ? 'light' : 'dark'));
    document.body.append(button);
    apply(mode, false);
  }

  root.dataset.prTheme = mode;
  root.dataset.theme = mode;
  root.style.colorScheme = mode;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount, { once: true });
  else mount();

  window.PrincipiaTheme = Object.freeze({
    getMode: () => mode,
    setMode: (next) => apply(next),
    toggle: () => apply(mode === 'dark' ? 'light' : 'dark')
  });
})();
