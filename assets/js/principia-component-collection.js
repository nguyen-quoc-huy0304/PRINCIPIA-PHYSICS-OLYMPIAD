/* PRINCIPIA curated component pack — adapted to existing app markup. */
(() => {
  'use strict';
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const selectors = [
    ['.nav', 'nav-item'],
    ['.tabs .tab', 'tab'],
    ['.quiz-card,.quiz .option,.quiz .answer', 'quiz-option'],
    ['.lesson-content-panel,.lesson-content,.lesson-layout', 'lesson-surface'],
    ['.reward-card,.sticker-card,.pm-card,.tl-card', 'feature-card'],
    ['.chat-bubble-btn,.ai-chat-compose,.chat-box', 'chat-surface'],
    ['.modal,.modal-card,.modalbox,.pd-modal', 'dialog-surface'],
    ['.progress,.xpbar,[role="progressbar"]', 'progress'],
    ['.stat', 'metric'],
    ['.tile', 'app-card']
  ];
  const excluded = '.principia-mobile-nav,#proSiteEditorPanel,#principiaM3ECanvasWorkspace';
  function mark(root = document) {
    selectors.forEach(([selector, type]) => {
      const nodes = [];
      if (root instanceof Element && root.matches(selector)) nodes.push(root);
      root.querySelectorAll?.(selector).forEach(node => nodes.push(node));
      nodes.forEach(node => {
        if (node.closest(excluded) || node.dataset.prComponent) return;
        node.dataset.prComponent = type;
      });
    });
  }
  function setupQuizFeedback() {
    document.addEventListener('click', event => {
      const option = event.target instanceof Element ? event.target.closest('.quiz .option,.quiz .answer') : null;
      if (!option || option.closest(excluded)) return;
      const group = option.closest('.quiz');
      if (!group) return;
      group.querySelectorAll('.option,.answer').forEach(item => item.classList.toggle('pr-option-focus', item === option));
    }, true);
  }
  function init() {
    mark();
    setupQuizFeedback();
    const observer = new MutationObserver(records => records.forEach(record => {
      record.addedNodes.forEach(node => { if (node.nodeType === Node.ELEMENT_NODE) mark(node); });
    }));
    observer.observe(document.getElementById('app') || document.body, { childList: true, subtree: true });
    document.addEventListener('principia:rendered', () => mark());
    document.addEventListener('principia:page-changed', () => mark());
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
    window.PrincipiaComponents = Object.freeze({
      refresh: mark,
      reducedMotion: reduced,
      categories: Object.freeze(selectors.map(([, type]) => type))
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
