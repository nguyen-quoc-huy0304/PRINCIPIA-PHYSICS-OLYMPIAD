'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-rust-content-tree.js'), 'utf8');

function createAdapter() {
  const calls = [];
  const window = {
    PrincipiaWasmPhysics: {
      async queryContentTree(catalog, operation, targetId) {
        calls.push({ catalog, operation, targetId });
        return { operation, targetId };
      }
    }
  };
  vm.runInNewContext(source, { window, Set, TypeError, Error, Object, Array });
  return { api: window.PrincipiaContentTree, calls };
}

test('content tree adapter delegates every operation to Rust/WASM', async () => {
  const { api, calls } = createAdapter();
  const catalog = [{ id: 'physics', name: 'Vật lý', type: 'tab' }];
  await api.find(catalog, 'physics');
  await api.parent(catalog, 'physics');
  await api.siblings(catalog, 'physics');
  await api.chain(catalog, 'physics');
  await api.lessons(catalog);
  await api.count(catalog);
  await api.remove(catalog, 'physics');
  assert.deepEqual(calls.map(call => call.operation),
    ['find', 'parent', 'siblings', 'chain', 'lessons', 'count', 'remove']);
  assert.equal(calls[0].catalog, catalog);
});

test('content tree adapter rejects invalid input before crossing WASM boundary', async () => {
  const { api, calls } = createAdapter();
  await assert.rejects(api.find({}, 'x'), /catalog must be an array/i);
  await assert.rejects(api.execute([], 'eval'), /unsupported/i);
  await assert.rejects(api.find([], 'x'.repeat(129)), /id is invalid/i);
  assert.equal(calls.length, 0);
});

test('content tree adapter fails closed when Rust/WASM is unavailable', async () => {
  const window = {};
  vm.runInNewContext(source, { window, Set, TypeError, Error, Object, Array });
  await assert.rejects(window.PrincipiaContentTree.count([]), /unavailable/i);
});
