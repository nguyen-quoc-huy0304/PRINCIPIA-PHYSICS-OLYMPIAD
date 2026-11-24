/* PRINCIPIA Experience System
 * One progressive-enhancement layer for motion, tactile UI, feedback and accessibility.
 * Vanilla JS; no React, third-party runtime, network calls or storage dependency.
 */
(() => {
  'use strict';

  const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const FINE_POINTER = window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;
  const CARD_SELECTOR = '#app .main .panel, #app .main .stat, #app .main .tile';
  const EXCLUDED = '.modal,.modalbg,[role="dialog"],#codelearnWorkspace,#principiaM3ECanvasWorkspace,#proSiteEditorPanel,.chat-box,.principia-mobile-nav';
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  let revealObserver = null;
  let mutationObserver = null;
  let toastHost = null;
  let toastSequence = 0;
  let favicon = null;
  const SETTINGS_KEY = 'principia_experience_settings_v1';
  let settings = readSettings();

  function readSettings() {
    const defaults = { motion: true, beams: true, tilt: true };
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      return { motion: saved.motion !== false, beams: saved.beams !== false, tilt: saved.tilt !== false };
    } catch (_) { return defaults; }
  }

  function applySettings() {
    const root = document.documentElement;
    root.classList.toggle('pr-experience-motion-off', !settings.motion);
    root.classList.toggle('pr-experience-beams-off', !settings.beams);
    root.classList.toggle('pr-experience-tilt-off', !settings.tilt);
  }

  function saveSettings(next) {
    settings = { ...settings, ...next };
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }
    catch (_) { notify('Không thể lưu cài đặt hiệu ứng trên thiết bị này.'); }
    applySettings();
  }

  function mountEditorSettings() {
    const panel = document.getElementById('proSiteEditorPanel');
    if (!panel || panel.querySelector('[data-pr-experience-settings]')) return;
    const section = document.createElement('section');
    section.dataset.prExperienceSettings = 'true';
    section.className = 'pr-experience-settings';
    const heading = document.createElement('strong');
    heading.textContent = 'Giao diện & hiệu ứng';
    section.append(heading);
    const options = [
      ['motion', 'Chuyển động mượt và phản hồi nút'],
      ['beams', 'Viền sáng chuyển động quanh thẻ'],
      ['tilt', 'Hiệu ứng 3D nghiêng theo chuột']
    ];
    options.forEach(([key, labelText]) => {
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.checked = settings[key];
      input.addEventListener('change', () => saveSettings({ [key]: input.checked }));
      const text = document.createElement('span');
      text.textContent = labelText;
      label.append(input, text);
      section.append(label);
    });
    const status = panel.querySelector('[data-status]');
    if (status) panel.insertBefore(section, status);
    else panel.append(section);
  }

  function safeElement(node) {
    return node instanceof Element && !node.closest(EXCLUDED);
  }

  function enhance(root = document) {
    const nodes = [];
    if (root instanceof Element && root.matches(CARD_SELECTOR)) nodes.push(root);
    if (root.querySelectorAll) nodes.push(...root.querySelectorAll(CARD_SELECTOR));

    nodes.forEach(card => {
      if (!safeElement(card) || card.dataset.prExperienceCard === '1') return;
      card.dataset.prExperienceCard = '1';
      card.dataset.prUiCard = '1';
      if (revealObserver && !REDUCED_MOTION) {
        card.classList.add('pr-motion-item');
        revealObserver.observe(card);
      } else {
        card.classList.add('pr-in-view');
      }
    });

    if (!root.querySelectorAll) return;
    root.querySelectorAll('#app button:not([data-pr-experience-button])').forEach(button => {
      if (!safeElement(button) || button.closest('.principia-mobile-nav')) return;
      button.dataset.prExperienceButton = '1';
      button.dataset.prUiButton = '1';
    });
    const busySelector = '[aria-busy="true"],[data-ai-state="thinking"],.ai-thinking,.ai-loading,.thinking,.typing-indicator';
    const progressSelector = '[role="progressbar"],.progress,.xpbar';
    if (root instanceof Element && root.matches(busySelector) && safeElement(root)) root.classList.add('pr-ref-thinking');
    if (root instanceof Element && root.matches(progressSelector) && safeElement(root)) root.classList.add('pr-ref-progress');
    root.querySelectorAll(busySelector).forEach(node => {
      if (safeElement(node)) node.classList.add('pr-ref-thinking');
    });
    root.querySelectorAll(progressSelector).forEach(node => {
      if (safeElement(node)) node.classList.add('pr-ref-progress');
    });
  }

  function setupReveal() {
    if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('pr-in-view');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.07, rootMargin: '0px 0px -28px 0px' });
  }

  function setupPointerEffects() {
    if (REDUCED_MOTION || !FINE_POINTER) return;
    document.addEventListener('pointermove', event => {
      const card = event.target instanceof Element ? event.target.closest(CARD_SELECTOR) : null;
      if (!safeElement(card)) return;
      const rect = card.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      card.style.setProperty('--pr-x', Math.round(event.clientX - rect.left) + 'px');
      card.style.setProperty('--pr-y', Math.round(event.clientY - rect.top) + 'px');
      if (!settings.tilt || !card.matches('#app .tile,#app .stat')) return;
      card.style.setProperty('--pr-tilt-x', clamp((0.5 - y) * 3.2, -1.8, 1.8).toFixed(2) + 'deg');
      card.style.setProperty('--pr-tilt-y', clamp((x - 0.5) * 4, -2.2, 2.2).toFixed(2) + 'deg');
    }, { passive: true });

    document.addEventListener('pointerout', event => {
      const card = event.target instanceof Element ? event.target.closest('#app .tile[data-pr-experience-card],#app .stat[data-pr-experience-card]') : null;
      if (card && !card.contains(event.relatedTarget)) {
        card.style.removeProperty('--pr-tilt-x');
        card.style.removeProperty('--pr-tilt-y');
      }
    }, { passive: true });
  }

  function setupRipple() {
    if (REDUCED_MOTION) return;
    document.addEventListener('click', event => {
      const button = event.target instanceof Element ? event.target.closest('#app button') : null;
      if (!button || button.disabled || button.closest(EXCLUDED)) return;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'pr-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = (event.clientX ? event.clientX - rect.left : rect.width / 2) + 'px';
      ripple.style.top = (event.clientY ? event.clientY - rect.top : rect.height / 2) + 'px';
      button.append(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }, { passive: true });
  }

  function ensureToastHost() {
    if (toastHost?.isConnected) return toastHost;
    toastHost = document.createElement('div');
    toastHost.id = 'principiaExperienceToasts';
    toastHost.setAttribute('aria-live', 'polite');
    toastHost.setAttribute('aria-relevant', 'additions');
    toastHost.setAttribute('aria-label', 'Thông báo PRINCIPIA');
    document.body.append(toastHost);
    return toastHost;
  }

  function notify(message, options = {}) {
    const text = String(message ?? '').trim().slice(0, 500);
    if (!text) return null;
    const host = ensureToastHost();
    const toast = document.createElement('div');
    const id = ++toastSequence;
    toast.className = 'pr-experience-toast';
    toast.dataset.toastId = String(id);
    toast.setAttribute('role', options.assertive ? 'alert' : 'status');

    const content = document.createElement('span');
    content.className = 'pr-experience-toast-message';
    content.textContent = text;
    toast.append(content);

    if (typeof options.action === 'function' && typeof options.actionLabel === 'string') {
      const action = document.createElement('button');
      action.type = 'button';
      action.className = 'pr-experience-toast-action';
      action.textContent = options.actionLabel.slice(0, 40);
      action.addEventListener('click', () => {
        try { options.action(); } finally { dismiss(); }
      }, { once: true });
      toast.append(action);
    }

    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'pr-experience-toast-close';
    close.setAttribute('aria-label', 'Đóng thông báo');
    close.textContent = '×';
    close.addEventListener('click', dismiss, { once: true });
    toast.append(close);
    host.append(toast);
    requestAnimationFrame(() => toast.classList.add('is-visible'));

    const duration = clamp(Number(options.duration) || 3600, 1200, 10000);
    const timer = window.setTimeout(dismiss, duration);
    function dismiss() {
      window.clearTimeout(timer);
      toast.classList.remove('is-visible');
      if (REDUCED_MOTION) toast.remove();
      else toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }
    while (host.children.length > 4) host.firstElementChild?.remove();
    return Object.freeze({ id, dismiss });
  }

  function animate(element, keyframes, options = {}) {
    if (!(element instanceof Element) || !Array.isArray(keyframes)) return null;
    if (REDUCED_MOTION || typeof element.animate !== 'function') return null;
    const duration = clamp(Number(options.duration) || 420, 80, 4000);
    return element.animate(keyframes, {
      duration,
      easing: typeof options.easing === 'string' ? options.easing : 'cubic-bezier(.22,1,.36,1)',
      fill: options.fill === 'none' ? 'none' : 'both',
      iterations: clamp(Number(options.iterations) || 1, 1, 20),
      direction: options.direction === 'alternate' ? 'alternate' : 'normal'
    });
  }

  function setBusy(target, busy, label) {
    const element = typeof target === 'string' ? document.querySelector(target) : target;
    if (!(element instanceof Element)) return false;
    const active = Boolean(busy);
    if (active) {
      if (!Object.prototype.hasOwnProperty.call(element.dataset, 'prPreviousAriaLabel')) {
        element.dataset.prPreviousAriaLabel = element.getAttribute('aria-label') || '';
      }
      element.setAttribute('aria-busy', 'true');
      element.dataset.aiState = 'thinking';
      if (typeof label === 'string' && label.trim()) element.setAttribute('aria-label', label.trim().slice(0, 120));
      element.classList.add('pr-ref-thinking');
    } else {
      element.removeAttribute('aria-busy');
      if (element.dataset.aiState === 'thinking') delete element.dataset.aiState;
      if (Object.prototype.hasOwnProperty.call(element.dataset, 'prPreviousAriaLabel')) {
        const previous = element.dataset.prPreviousAriaLabel;
        if (previous) element.setAttribute('aria-label', previous);
        else element.removeAttribute('aria-label');
        delete element.dataset.prPreviousAriaLabel;
      }
      element.classList.remove('pr-ref-thinking');
    }
    return true;
  }

  function setupFavicon() {
    favicon = document.querySelector('link[rel~="icon"]');
    if (!favicon) {
      favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/svg+xml';
      document.head.append(favicon);
    }
    const base = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x2="1" y2="1"><stop stop-color="#9c87f5"/><stop offset="1" stop-color="#55a8d8"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="#171a2b"/><path d="M15 46 28 13h9L24 46zm17 0 10-25h8L40 46z" fill="url(#g)"/></svg>';
    const baseUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(base);
    favicon.dataset.prBaseIcon = baseUrl;
    favicon.href = baseUrl;
  }

  function setFaviconBadge(value) {
    const count = clamp(Math.floor(Number(value) || 0), 0, 999);
    if (!favicon) setupFavicon();
    if (!count) {
      favicon.href = favicon.dataset.prBaseIcon;
      return;
    }
    const label = count > 99 ? '99+' : String(count);
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="18" fill="#171a2b"/><path d="M15 46 28 13h9L24 46zm17 0 10-25h8L40 46z" fill="#b9a8ff"/><circle cx="49" cy="15" r="14" fill="#ef476f"/><text x="49" y="20" text-anchor="middle" font-family="Arial,sans-serif" font-size="' + (label.length > 2 ? 10 : 15) + '" font-weight="700" fill="#fff">' + label + '</text></svg>';
    favicon.href = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  function init() {
    applySettings();
    setupReveal();
    enhance();
    if (revealObserver) document.querySelectorAll('#app .pr-motion-item').forEach(node => revealObserver.observe(node));
    setupPointerEffects();
    setupRipple();
    setupFavicon();

    mutationObserver = new MutationObserver(records => {
      records.forEach(record => {
        if (record.type === 'attributes' && record.target instanceof Element) enhance(record.target);
        record.addedNodes?.forEach(node => {
          if (node.nodeType === Node.ELEMENT_NODE) enhance(node);
        });
      });
      mountEditorSettings();
    });
    mutationObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-busy', 'data-ai-state'] });
    mountEditorSettings();
    document.addEventListener('principia:rendered', () => { enhance(); mountEditorSettings(); });
    document.addEventListener('principia:page-changed', () => { enhance(); mountEditorSettings(); });
    window.addEventListener('pagehide', () => {
      revealObserver?.disconnect();
      mutationObserver?.disconnect();
    }, { once: true });

    window.PrincipiaUI = Object.freeze({
      animate,
      notify,
      setBusy,
      setFaviconBadge,
      reducedMotion: REDUCED_MOTION
    });
    window.PrincipiaFavicon = Object.freeze({ setCount: setFaviconBadge });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
