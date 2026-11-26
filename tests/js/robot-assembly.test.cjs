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


test('native forward kinematics delegates endpoint calculation to Rust WASM', async () => {
  const calls = [];
  context.PrincipiaWasmPhysics = {
    async compute(operation, params) {
      calls.push({ operation, params });
      return { x: 100, y: 50 };
    }
  };
  const endpoint = await math.forwardKinematicsNative(100, 50, 0, 0);
  assert.deepEqual(JSON.parse(JSON.stringify(endpoint)), { x: 100, y: 50 });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, 'robotForwardKinematics');
  assert.equal(calls[0].params.l1, 100);
  assert.equal(calls[0].params.shoulderRad, 0);
});

test('native forward kinematics falls back to the analytical solution if WASM is unavailable', async () => {
  context.PrincipiaWasmPhysics = { async compute() { throw new Error('WASM unavailable'); } };
  const endpoint = await math.forwardKinematicsNative(100, 100, 0, 90);
  assert.ok(Math.abs(endpoint.x - 100) < 1e-10);
  assert.ok(Math.abs(endpoint.y - 100) < 1e-10);
});


test('delegates full assembly evaluation to Rust WASM', async () => {
  const calls = [];
  context.PrincipiaWasmPhysics = { async compute(operation, params) {
    calls.push({ operation, params });
    return { correct: 5, total: 5, ready: true, x: 250, y: 80, error: 0, earned: 100 };
  }};
  const result = await math.evaluateAssemblyNative(
    { base: 'fixed', joint: 'revolute', link1: '160', link2: '120', tool: 'parallel' },
    35, -55, math.TARGET
  );
  assert.equal(result.earned, 100);
  assert.equal(calls[0].operation, 'robotAssemblyCheck');
  assert.equal(calls[0].params.link1Mm, 160);
});

test('assembly evaluation falls back to deterministic local rules without WASM', async () => {
  context.PrincipiaWasmPhysics = { async compute() { throw new Error('WASM unavailable'); } };
  const result = await math.evaluateAssemblyNative(
    { base: 'fixed', joint: 'revolute', link1: '160', link2: '120', tool: 'parallel' },
    35, -55, math.TARGET
  );
  assert.equal(result.ready, true);
  assert.equal(result.earned, 100);
  assert.ok(result.error < 1e-9);
});
