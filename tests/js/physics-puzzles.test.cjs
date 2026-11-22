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
