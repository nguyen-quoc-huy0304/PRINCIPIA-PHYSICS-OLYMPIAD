/* Rust-owned hierarchical content operations. This module never reimplements tree rules in JavaScript. */
(function (root) {
  'use strict';

  const OPERATIONS = new Set(['find', 'parent', 'siblings', 'chain', 'lessons', 'count', 'remove']);
  const MAX_ID_LENGTH = 128;

  async function execute(catalog, operation, targetId = '') {
    if (!Array.isArray(catalog)) throw new TypeError('Content catalog must be an array.');
    if (!OPERATIONS.has(operation)) throw new TypeError('Unsupported content tree operation.');
    if (typeof targetId !== 'string' || targetId.length > MAX_ID_LENGTH) {
      throw new TypeError('Content node id is invalid.');
    }
    const wasm = root.PrincipiaWasmPhysics;
    if (!wasm || typeof wasm.queryContentTree !== 'function') {
      throw new Error('Rust/WASM content tree engine is unavailable.');
    }
    return wasm.queryContentTree(catalog, operation, targetId);
  }

  root.PrincipiaContentTree = Object.freeze({
    execute,
    find: (catalog, id) => execute(catalog, 'find', id),
    parent: (catalog, id) => execute(catalog, 'parent', id),
    siblings: (catalog, id) => execute(catalog, 'siblings', id),
    chain: (catalog, id) => execute(catalog, 'chain', id),
    lessons: catalog => execute(catalog, 'lessons'),
    count: catalog => execute(catalog, 'count'),
    remove: (catalog, id) => execute(catalog, 'remove', id)
  });
})(typeof window !== 'undefined' ? window : globalThis);
