'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const adapterSource = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-rust-content-tree.js'), 'utf8');
const appSource = fs.readFileSync(path.resolve(__dirname, '../../assets/js/app-part-02.js'), 'utf8');

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
  vm.runInNewContext(adapterSource, { window, Set, TypeError, Error, Object, Array });
  return { api: window.PrincipiaContentTree, calls };
}

test('adapter delegates all content tree operations to Rust/WASM', async () => {
  const { api, calls } = createAdapter();
  const catalog = [{ id: 'physics', name: 'Vật lý', type: 'tab' }];
  await api.find(catalog, 'physics');
  await api.parent(catalog, 'physics');
  await api.siblings(catalog, 'physics');
  await api.chain(catalog, 'physics');
  await api.lessons(catalog);
  await api.count(catalog);
  await api.remove(catalog, 'physics');
  await api.reorder(catalog, 'physics', -1);
  await api.move(catalog, 'physics', 'root');
  await api.drop(catalog, 'physics', 'target');
  await api.create(catalog, { id: 'new', name: 'New', type: 'lesson' }, 'physics');
  await api.update(catalog, 'physics', { name: 'Physics' });
  assert.deepEqual(calls.map(call => call.operation), [
    'find', 'parent', 'siblings', 'chain', 'lessons', 'count',
    'remove', 'reorder', 'move', 'drop', 'create', 'update'
  ]);
  assert.equal(calls[0].catalog, catalog);
  assert.deepEqual(JSON.parse(calls[7].targetId), { id: 'physics', delta: -1 });
  assert.deepEqual(JSON.parse(calls[8].targetId), { id: 'physics', targetId: 'root' });
  assert.deepEqual(JSON.parse(calls[9].targetId), { id: 'physics', targetId: 'target' });
  assert.deepEqual(JSON.parse(calls[10].targetId), {
    node: { id: 'new', name: 'New', type: 'lesson' }, parentId: 'physics'
  });
  assert.deepEqual(JSON.parse(calls[11].targetId), {
    id: 'physics', patch: { name: 'Physics' }
  });
});

test('adapter validates arguments before crossing the WASM boundary', async () => {
  const { api, calls } = createAdapter();
  await assert.rejects(api.find({}, 'x'), /catalog must be an array/i);
  await assert.rejects(api.execute([], 'eval'), /unsupported/i);
  await assert.rejects(api.find([], 'x'.repeat(513)), /target is invalid/i);
  assert.equal(calls.length, 0);
});

test('adapter fails closed when Rust/WASM is unavailable', async () => {
  const window = {};
  vm.runInNewContext(adapterSource, { window, Set, TypeError, Error, Object, Array });
  await assert.rejects(window.PrincipiaContentTree.count([]), /unavailable/i);
});

test('legacy content editor delegates every catalog mutation to Rust', () => {
  assert.match(appSource, /async function createNode[\s\S]*PrincipiaContentTree[.]create/);
  assert.match(appSource, /async function saveNode[\s\S]*PrincipiaContentTree[.]update/);
  assert.match(appSource, /async function saveLessonQuiz[\s\S]*PrincipiaContentTree[.]update/);
  assert.match(appSource, /async function deleteNode[\s\S]*PrincipiaContentTree[.]remove/);
  assert.match(appSource, /async function shiftNode[\s\S]*PrincipiaContentTree[.]reorder/);
  assert.match(appSource, /async function moveNodeTo[\s\S]*PrincipiaContentTree[.]move/);
  assert.match(appSource, /async function dropItem[\s\S]*PrincipiaContentTree[.]drop/);
  assert.match(appSource, /function replaceTreeCatalog/);
});
