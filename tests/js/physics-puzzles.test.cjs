const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-physics-puzzles.js', 'utf8');
const context = {
  document: { readyState: 'loading', addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  Math,
  Number,
  JSON,
  Object,
  window: null
};
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-physics-puzzles.js' });
const math = context.PrincipiaForcePuzzleMath;

test('equilibrium force is the negative vector sum', () => {
  assert.deepEqual(
    JSON.parse(JSON.stringify(math.targetFor({ x: 3, y: -4 }, { x: -7, y: 2 }))),
    { x: 4, y: 2 }
  );
});

test('an exact balancing vector receives 100 points and zero error', () => {
  const result = math.scoreFor(4, 2, { x: 4, y: 2 });
  assert.equal(result.error, 0);
  assert.equal(result.points, 100);
});

test('vector error uses Euclidean magnitude', () => {
  const result = math.scoreFor(3, 4, { x: 0, y: 0 });
  assert.equal(result.error, 5);
  assert.equal(result.points, 60);
});

test('points never become negative for a large error', () => {
  assert.equal(math.scoreFor(20, 20, { x: -20, y: -20 }).points, 0);
});

test('difficulty presets generate bounded force components', () => {
  for (const [difficulty, limit] of [['easy', 5], ['normal', 9], ['hard', 15]]) {
    for (let i = 0; i < 80; i++) {
      const puzzle = math.fresh(difficulty);
      for (const force of [puzzle.a, puzzle.b]) {
        assert.ok(Math.abs(force.x) <= limit);
        assert.ok(Math.abs(force.y) <= limit);
      }
      assert.ok(Math.abs(puzzle.target.x) <= 20);
      assert.ok(Math.abs(puzzle.target.y) <= 20);
      assert.ok(Math.hypot(puzzle.target.x, puzzle.target.y) >= 3);
    }
  }
});

test('stored history text is escaped before it is inserted into HTML', () => {
  assert.equal(math.escapeHTML('<img src=x onerror=alert(1)>'), '&lt;img src=x onerror=alert(1)&gt;');
  assert.equal(math.escapeHTML('"quoted" & <tag>'), '&quot;quoted&quot; &amp; &lt;tag&gt;');
});


test('force puzzle delegates score calculation to Rust WASM', async () => {
  const calls = [];
  context.PrincipiaWasmPhysics = {
    async compute(operation, params) {
      calls.push({ operation, params });
      return operation === 'forceBalanceTarget' ? { x: 0, y: 0 } : { error: 5, points: 60 };
    }
  };
  const result = await math.scoreForNative(3, 4, { x: 0, y: 0 }, { a: { x: 1, y: 2 }, b: { x: -1, y: -2 } });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { error: 5, points: 60, target: { x: 0, y: 0 } });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].operation, 'forceBalanceTarget');
  assert.equal(calls[0].params.forceAX, 1);
  assert.equal(calls[1].operation, 'forceBalanceScore');
  assert.equal(calls[1].params.targetX, 0);
});

test('force puzzle scoring falls back safely when Rust WASM fails', async () => {
  context.PrincipiaWasmPhysics = { async compute() { throw new Error('WASM unavailable'); } };
  const result = await math.scoreForNative(3, 4, { x: 0, y: 0 }, { a: { x: 0, y: 0 }, b: { x: 0, y: 0 } });
  assert.equal(result.error, 5);
  assert.equal(result.points, 60);
});
