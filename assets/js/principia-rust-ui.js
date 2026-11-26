/* PRINCIPIA Rust UI bridge. Rust owns markup and route validation; this file binds DOM events only. */
(() => {
  'use strict';
  const wasmUrl = '../wasm/pkg/principia_core.js';
  let wasmPromise;
  function load() {
    if (!wasmPromise) {
      wasmPromise = import(wasmUrl).then(async mod => {
        await mod.default();
        if (typeof mod.ui_render_html !== 'function') throw new Error('Rust UI renderer export is missing');
        return mod;
      }).catch(error => {
        wasmPromise = null;
        throw new Error('Rust UI renderer unavailable: ' + error.message);
      });
    }
    return wasmPromise;
  }
  async function render(route = 'home', width = globalThis.innerWidth || 1280, query = '', dialog = '') {
    if (typeof route !== 'string' || route.length > 32) throw new TypeError('Invalid route');
    if (!Number.isInteger(width) || width < 1 || width > 100000) throw new RangeError('Invalid viewport width');
    if (typeof query !== 'string' || query.length > 4096) throw new TypeError('Search query too long');
    if (typeof dialog !== 'string' || dialog.length > 32) throw new TypeError('Invalid dialog');
    const wasm = await load();
    return wasm.ui_render_html(route, width, query, dialog);
  }
  async function reduce(route, width, query, dialog, event, value) {
    const wasm = await load();
    if (typeof wasm.ui_reduce_json === 'function') {
      const result = JSON.parse(wasm.ui_reduce_json(route, width, query, dialog, event, value));
      return { html: result.html, state: JSON.parse(result.state) };
    }
    const nextQuery = event === 'search' ? value : query;
    const nextDialog = event === 'open_search' || event === 'search' ? 'search' : (event === 'close_search' ? '' : dialog);
    return { html: wasm.ui_render_html(route, width, nextQuery, nextDialog), state: null };
  }
  function mount(root, options = {}) {
    if (!root || typeof root.replaceChildren !== 'function') throw new TypeError('A DOM root element is required');
    let route = options.route || 'home';
    let query = '';
    let dialog = options.dialog || '';
    let destroyed = false;
    let renderSeq = 0;
    async function refresh() {
      const seq = ++renderSeq;
      const viewport = root.ownerDocument?.defaultView?.innerWidth || globalThis.innerWidth || 1280;
      const markup = await render(route, viewport, query, dialog);
      if (destroyed || seq !== renderSeq) return;
      root.innerHTML = markup;
    }
    function onClick(event) {
      const routeButton = event.target?.closest?.('[data-pr-route]');
      if (routeButton && root.contains(routeButton)) {
        route = routeButton.getAttribute('data-pr-route') || route;
        reduce(route, root.ownerDocument?.defaultView?.innerWidth || globalThis.innerWidth || 1280, query, dialog, 'navigate', route)
          .then(result => { root.innerHTML = result.html; options.onRoute?.(route); })
          .catch(options.onError || (() => {}));
        return;
      }
      const sidebarButton = event.target?.closest?.('[data-pr-sidebar]');
      if (sidebarButton && root.contains(sidebarButton)) {
        const collapsed = root.classList.toggle('pr-sidebar-collapsed');
        sidebarButton.setAttribute('aria-expanded', String(!collapsed));
        reduce(route, root.ownerDocument?.defaultView?.innerWidth || globalThis.innerWidth || 1280, query, dialog, 'toggle_sidebar', '')
          .catch(options.onError || (() => {}));
        return;
      }
      const searchButton = event.target?.closest?.('[data-pr-search]');
      if (searchButton && root.contains(searchButton)) {
        dialog = dialog === 'search' ? '' : 'search';
        const eventName = dialog === 'search' ? 'open_search' : 'close_search';
        reduce(route, root.ownerDocument?.defaultView?.innerWidth || globalThis.innerWidth || 1280, query, dialog, eventName, '')
          .then(result => { root.innerHTML = result.html; root.querySelector('[data-pr-search-form] input')?.focus(); })
          .catch(options.onError || (() => {}));
      }
    }
    function onSubmit(event) {
      if (!event.target?.matches?.('[data-pr-search-form]')) return;
      event.preventDefault();
      query = String(new FormData(event.target).get('q') || '').slice(0, 256);
      reduce(route, root.ownerDocument?.defaultView?.innerWidth || globalThis.innerWidth || 1280, '', '', 'search', query)
        .then(result => { root.innerHTML = result.html; options.onSearch?.(query); })
        .catch(options.onError || (() => {}));
    }
    root.addEventListener('click', onClick);
    root.addEventListener('submit', onSubmit);
    refresh().catch(options.onError || (() => {}));
    return Object.freeze({ refresh, getRoute: () => route, destroy() {
      destroyed = true;
      root.removeEventListener('click', onClick);
      root.removeEventListener('submit', onSubmit);
    }});
  }
  window.PrincipiaRustUI = Object.freeze({ load, render, mount });
})();
