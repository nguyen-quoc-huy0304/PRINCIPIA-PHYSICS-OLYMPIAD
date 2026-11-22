const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-robot-assembly.js', 'utf8');
const context = {
  document: { readyState: 'loading', addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  Math, Number, JSON, Object,
  window: null
};
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-robot-assembly.js' });
const math = context.PrincipiaRobotAssemblyMath;

test('forward kinematics returns expected endpoint for a straight arm', () => {
  const p = math.forwardKinematics(100, 50, 0, 0);
  assert.ok(Math.abs(p.x - 150) < 1e-10);
  assert.ok(Math.abs(p.y) < 1e-10);
});

test('forward kinematics respects relative elbow angle', () => {
  const p = math.forwardKinematics(100, 100, 0, 90);
  assert.ok(Math.abs(p.x - 100) < 1e-10);
  assert.ok(Math.abs(p.y - 100) < 1e-10);
});

test('distance uses Euclidean metric', () => {
  assert.equal(math.distance({ x: 0, y: 0 }, { x: 3, y: 4 }), 5);
});

test('assembly checker requires all five compatible components', () => {
  const good = { base: 'fixed', joint: 'revolute', link1: '160', link2: '120', tool: 'parallel' };
  assert.equal(math.evaluateAssembly(good).ready, true);
  assert.equal(math.evaluateAssembly({ ...good, tool: 'hook' }).ready, false);
  assert.equal(math.evaluateAssembly(good).correct, 5);
});

test('elbow position follows the first link angle', () => {
  const p = math.elbowPosition(100, 90);
  assert.ok(Math.abs(p.x) < 1e-10);
  assert.ok(Math.abs(p.y - 100) < 1e-10);
});
