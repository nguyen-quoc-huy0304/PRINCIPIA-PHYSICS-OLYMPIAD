/* PRINCIPIA adaptive performance layer.
 * Keeps the original CSS, visual effects, AI providers and feature set intact.
 * Focus: avoid loading off-screen media into memory on low-RAM devices and
 * provide an idle-task queue for non-urgent work.
 */
(function () {
  'use strict';

  const nav = window.navigator || {};
  const memory = Number(nav.deviceMemory) || 0;
  const cores = Number(nav.hardwareConcurrency) || 0;
  const connection = nav.connection || nav.mozConnection || nav.webkitConnection || null;
  const lowMemory = memory > 0 && memory <= 2;
  const constrained = lowMemory || (cores > 0 && cores <= 2) || !!(connection && connection.saveData);
  const idleQueue = [];
  const lazyScripts = new Map();
  let idleScheduled = false;
  let observer = null;

  function runIdleQueue(deadline) {
    idleScheduled = false;
    let ran = 0;
    while (idleQueue.length) {
      const hasBudget = !!deadline && deadline.timeRemaining() > 3;
      const timedOutFirstTask = !!deadline && deadline.didTimeout && ran === 0;
      const fallbackFirstTask = !deadline && ran === 0;
      if (!hasBudget && !timedOutFirstTask && !fallbackFirstTask) break;
      const task = idleQueue.shift();
      try { task(); } catch (error) { setTimeout(() => { throw error; }, 0); }
      ran += 1;
    }
    if (idleQueue.length) scheduleIdleDrain();
  }

  function scheduleIdleDrain() {
    if (idleScheduled || document.visibilityState === 'hidden') return;
    idleScheduled = true;
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(runIdleQueue, { timeout: 1200 });
    } else {
      window.setTimeout(() => runIdleQueue(null), 32);
    }
  }

  function schedule(task) {
    if (typeof task !== 'function') return;
    idleQueue.push(task);
    scheduleIdleDrain();
  }

  function prepareMedia(root) {
    if (!root || root.nodeType !== 1) return;
    const nodes = [];
    if (root.matches && root.matches('img,video,audio,iframe')) nodes.push(root);
    if (root.querySelectorAll) nodes.push(...root.querySelectorAll('img,video,audio,iframe'));

    for (const el of nodes) {
      if (el.tagName === 'IMG') {
        if (!el.hasAttribute('loading') && !el.hasAttribute('data-principia-eager')) el.loading = 'lazy';
        if (!el.decoding) el.decoding = 'async';
      } else if (el.tagName === 'VIDEO') {
        if (!el.hasAttribute('preload') && !el.autoplay) el.preload = 'none';
      } else if (el.tagName === 'AUDIO') {
        if (!el.hasAttribute('preload') && !el.autoplay) el.preload = 'none';
      } else if (el.tagName === 'IFRAME') {
        if (!el.hasAttribute('loading')) el.loading = 'lazy';
      }
    }
  }

  function start() {
    prepareMedia(document.documentElement);
    if ('MutationObserver' in window && document.body) {
      observer = new MutationObserver(records => {
        for (const record of records) {
          for (const node of record.addedNodes) prepareMedia(node);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') scheduleIdleDrain();
  }, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }

  function normalizeScriptURL(src) {
    const key = String(src || '').trim();
    if (!key) throw new TypeError('A script URL is required.');
    let parsed;
    try { parsed = new URL(key, window.location.href); }
    catch (_) { throw new TypeError('Invalid script URL.'); }
    const sameOriginHttp = parsed.protocol === 'http:' && parsed.origin === window.location.origin;
    if (parsed.protocol !== 'https:' && !sameOriginHttp) {
      throw new TypeError('Script URL must use HTTPS or same-origin HTTP.');
    }
    return key;
  }

  function loadScript(src) {
    let key;
    try { key = normalizeScriptURL(src); }
    catch (error) { return Promise.reject(error); }
    if (lazyScripts.has(key)) return lazyScripts.get(key);
    let existing = Array.from(document.scripts).find(s => s.dataset && s.dataset.principiaLazySrc === key);
    if (existing && existing.dataset.loaded === 'true') return Promise.resolve(existing);
    if (existing && existing.dataset.failed === 'true') {
      try { if (existing.parentNode) existing.parentNode.removeChild(existing); } catch (_) {}
      existing = null;
    }
    const promise = new Promise((resolve, reject) => {
      const script = existing || document.createElement('script');
      script.async = false;
      script.dataset.principiaLazySrc = key;
      script.onload = () => { script.dataset.loaded = 'true'; resolve(script); };
      script.onerror = () => {
        script.dataset.failed = 'true';
        try { if (script.parentNode) script.parentNode.removeChild(script); } catch (_) {}
        lazyScripts.delete(key);
        reject(new Error('Không tải được mô-đun: ' + key));
      };
      if (!existing) {
        script.src = key;
        document.head.appendChild(script);
      } else if (!script.src) {
        script.src = key;
      }
    });
    lazyScripts.set(key, promise);
    return promise;
  }

  function loadScripts(sources) {
    return (sources || []).reduce((chain, src) => chain.then(() => loadScript(src)), Promise.resolve());
  }

  window.PrincipiaPerformance = Object.freeze({
    tier: lowMemory ? 'low-memory' : constrained ? 'constrained' : 'standard',
    lowMemory,
    schedule,
    loadScript,
    loadScripts,
    getProfile() {
      const memoryInfo = performance && performance.memory ? {
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      } : null;
      return {
        tier: lowMemory ? 'low-memory' : constrained ? 'constrained' : 'standard',
        deviceMemoryGB: memory || null,
        logicalCores: cores || null,
        saveData: !!(connection && connection.saveData),
        visibility: document.visibilityState,
        pendingIdleTasks: idleQueue.length,
        memoryInfo
      };
    }
  });
})();
