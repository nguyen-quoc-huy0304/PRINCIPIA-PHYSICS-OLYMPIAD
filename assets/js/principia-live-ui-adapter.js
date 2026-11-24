/* PRINCIPIA Live UI Adapter
 * Applies reusable patterns to existing app nodes; does not create or replace page structure.
 * Pattern lineage: Uiverse (MIT button), Animate UI (segmented transitions),
 * Kokonut UI (thinking state), Libraries.dev (spotlight), FeralUI (spring response),
 * ThreeUI (pointer tilt), Anime.js (existing entrance runtime), Hairline (fine-line accents).
 */
(() => {
  'use strict';

  const ROOT = '#app';
  const EXCLUDED = '#proSiteEditorPanel,#principiaM3ECanvasWorkspace,[role="dialog"],.modal,.modal-card,.principia-mobile-nav,.chat-box,.cl-shell';
  const SELECTORS = [
    ['.main .panel,.main .stat,.main .tile,.main .feature-card,.main .learning-card,.main .dashboard-card,.main .module-card', 'spotlight'],
    ['.main button.primary,.main .primary,.main .btn-primary', 'press'],
    ['.main .tabs', 'segmented'],
    ['.main details,.main .accordion,.main .faq-item', 'accordion'],
    ['.main [aria-busy="true"],.main [data-ai-state="thinking"],.main .ai-thinking,.main .ai-loading,.main .thinking,.main .typing-indicator', 'thinking'],
    ['.main .progress,.main .xpbar,.main [role="progressbar"]', 'progress'],
    ['.main .search-box,.main .search-field,.main .search', 'search']
  ];
  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const finePointer = () => window.matchMedia?.('(hover: hover) and (pointer: fine)').matches ?? false;

  function mark(root = document) {
    if (!(root instanceof Element) && root !== document) return;
    for (const [selector, type] of SELECTORS) {
      const nodes = [];
      if (root instanceof Element && root.matches(selector)) nodes.push(root);
      root.querySelectorAll?.(selector).forEach(node => nodes.push(node));
      nodes.forEach(node => {
        if (node.closest(EXCLUDED) || node.dataset.prLiveUi) return;
        node.dataset.prLiveUi = type;
        if (type === 'segmented') {
          node.querySelectorAll(':scope > .tab').forEach(tab => tab.dataset.prLiveTab = '1');
        }
      });
    }
  }

  function updateSpotlight(event) {
    if (!finePointer() || reduced() || !(event.target instanceof Element)) return;
    const card = event.target.closest('#app [data-pr-live-ui="spotlight"]');
    if (!card || card.closest(EXCLUDED)) return;
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
    const tiltX = Math.max(-1.8, Math.min(1.8, (50 - y) * 0.036));
    const tiltY = Math.max(-2.2, Math.min(2.2, (x - 50) * 0.044));
    card.style.setProperty('--pr-live-x', x.toFixed(1) + '%');
    card.style.setProperty('--pr-live-y', y.toFixed(1) + '%');
    card.style.setProperty('--pr-live-rx', tiltX.toFixed(2) + 'deg');
    card.style.setProperty('--pr-live-ry', tiltY.toFixed(2) + 'deg');
  }

  function resetSpotlight(event) {
    if (!(event.target instanceof Element)) return;
    const card = event.target.closest('#app [data-pr-live-ui="spotlight"]');
    if (card && !card.contains(event.relatedTarget)) {
      card.style.removeProperty('--pr-live-x');
      card.style.removeProperty('--pr-live-y');
    }
  }

  function init() {
    const app = document.querySelector(ROOT);
    if (!app || app.dataset.prLiveUiReady) return;
    app.dataset.prLiveUiReady = '1';
    mark(app);
    const observer = new MutationObserver(records => {
      records.forEach(record => record.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) mark(node);
      }));
    });
    observer.observe(app, { childList: true, subtree: true });
    app.addEventListener('pointermove', updateSpotlight, { passive: true });
    app.addEventListener('pointerout', resetSpotlight, { passive: true });
    document.addEventListener('principia:rendered', () => mark(app));
    document.addEventListener('principia:page-changed', () => mark(app));
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
    window.PrincipiaLiveUI = Object.freeze({ refresh: () => mark(app), reducedMotion: reduced() });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
