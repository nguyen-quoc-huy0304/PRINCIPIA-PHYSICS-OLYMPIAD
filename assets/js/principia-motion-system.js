/* PRINCIPIA Motion System — progressive enhancement for the existing vanilla app. */
(() => {
  'use strict';

  const REDUCED_MOTION = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  const CARD_SELECTOR = '#app .main .panel, #app .main .stat, #app .main .tile';
  const POINTER_SELECTOR = '#app .main .panel, #app .main .stat, #app .main .tile';
  let revealObserver = null;
  let mutationObserver = null;

  function revealCandidates(root = document) {
    if (REDUCED_MOTION || !revealObserver) return;
    const nodes = [];
    if (root instanceof Element && root.matches(CARD_SELECTOR)) nodes.push(root);
    if (root.querySelectorAll) nodes.push(...root.querySelectorAll(CARD_SELECTOR));
    for (const node of nodes) {
      if (node.dataset.prMotionSeen === '1') continue;
      if (node.closest('.modalbg,.modal,#codelearnWorkspace,[role="dialog"],.chat-box')) continue;
      node.dataset.prMotionSeen = '1';
      node.classList.add('pr-motion-item');
      revealObserver.observe(node);
    }
  }

  function setupReveal() {
    if (REDUCED_MOTION || !('IntersectionObserver' in window)) return;
    revealObserver = new IntersectionObserver((entries, observer) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('pr-in-view');
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    revealCandidates();
    mutationObserver = new MutationObserver(records => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) revealCandidates(node);
        }
      }
    });
    const main = document.querySelector('#app');
    if (main) mutationObserver.observe(main, { childList: true, subtree: true });
  }

  function setupPointerGlow() {
    if (REDUCED_MOTION || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    document.addEventListener('pointermove', event => {
      const card = event.target instanceof Element ? event.target.closest(POINTER_SELECTOR) : null;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--pr-x', `${Math.round(event.clientX - rect.left)}px`);
      card.style.setProperty('--pr-y', `${Math.round(event.clientY - rect.top)}px`);
    }, { passive: true });
  }

  function setupButtonRipple() {
    if (REDUCED_MOTION) return;
    document.addEventListener('click', event => {
      const button = event.target instanceof Element ? event.target.closest('#app button') : null;
      if (!button || button.disabled || button.closest('.chat-box,#codelearnWorkspace')) return;
      const rect = button.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'pr-ripple';
      ripple.setAttribute('aria-hidden', 'true');
      ripple.style.left = `${event.clientX ? event.clientX - rect.left : rect.width / 2}px`;
      ripple.style.top = `${event.clientY ? event.clientY - rect.top : rect.height / 2}px`;
      button.append(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    }, { passive: true });
  }

  function init() {
    document.documentElement.classList.add('pr-motion-enabled');
    setupReveal();
    setupPointerGlow();
    setupButtonRipple();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  window.addEventListener('pagehide', () => {
    revealObserver?.disconnect();
    mutationObserver?.disconnect();
  }, { once: true });
})();
