/* Rust-owned hierarchical content operations. This module never reimplements tree rules in JavaScript. */
(function (root) {
  'use strict';

  const OPERATIONS = new Set(['find', 'parent', 'siblings', 'chain', 'lessons', 'count', 'remove', 'reorder', 'move', 'drop']);
  const MAX_ID_LENGTH = 128;

  async function execute(catalog, operation, targetId = '') {
    if (!Array.isArray(catalog)) throw new TypeError('Content catalog must be an array.');
    if (!OPERATIONS.has(operation)) throw new TypeError('Unsupported content tree operation.');
    const target = typeof targetId === 'string' ? targetId : JSON.stringify(targetId);
    if (typeof target !== 'string' || target.length > 512) {
      throw new TypeError('Content node target is invalid.');
    }
    const wasm = root.PrincipiaWasmPhysics;
    if (!wasm || typeof wasm.queryContentTree !== 'function') {
      throw new Error('Rust/WASM content tree engine is unavailable.');
    }
    return wasm.queryContentTree(catalog, operation, target);
  }

  root.PrincipiaContentTree = Object.freeze({
    execute,
    find: (catalog, id) => execute(catalog, 'find', id),
    parent: (catalog, id) => execute(catalog, 'parent', id),
    siblings: (catalog, id) => execute(catalog, 'siblings', id),
    chain: (catalog, id) => execute(catalog, 'chain', id),
    lessons: catalog => execute(catalog, 'lessons'),
    count: catalog => execute(catalog, 'count'),
    remove: (catalog, id) => execute(catalog, 'remove', id),
    reorder: (catalog, id, delta) => execute(catalog, 'reorder', { id, delta }),
    move: (catalog, id, targetId = '') => execute(catalog, 'move', { id, targetId }),
    drop: (catalog, id, targetId) => execute(catalog, 'drop', { id, targetId })
  });
})(typeof window !== 'undefined' ? window : globalThis);
