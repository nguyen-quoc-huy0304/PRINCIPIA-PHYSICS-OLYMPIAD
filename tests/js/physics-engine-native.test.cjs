const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/physics-engine.js', 'utf8');

function loadEngine(overrides = {}) {
  const window = { ...overrides };
  vm.runInNewContext(source, { window, Number, Math, Object, TypeError, RangeError, Error }, {
    filename: 'physics-engine.js'
  });
  return window.PrincipiaPhysics;
}

test('force-balance scoring prefers the Rust desktop core', async () => {
  let operation;
  const engine = loadEngine({
    principiaDesktop: {
      async computePhysics(name, payload) {
        operation = { name, payload };
        return { error: 0, points: 100, balanced: true };
      }
    }
  });
  const result = await engine.scoreForceBalance({ x: 3, y: -4, targetX: 3, targetY: -4 });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { error: 0, points: 100, balanced: true });
  assert.equal(operation.name, 'forceBalance');
  assert.deepEqual(JSON.parse(JSON.stringify(operation.payload)), { x: 3, y: -4, targetX: 3, targetY: -4 });
  assert.equal(engine.backend, 'rust-native-force-balance');
});

test('force-balance scoring uses Rust WASM when desktop is absent', async () => {
  const engine = loadEngine({
    PrincipiaWasmPhysics: {
      async compute(name) {
        assert.equal(name, 'forceBalance');
        return { error: 1, points: 92, balanced: false };
      }
    }
  });
  const result = await engine.scoreForceBalance({ x: 1, y: 0, targetX: 0, targetY: 0 });
  assert.equal(result.points, 92);
  assert.equal(engine.backend, 'rust-wasm-force-balance');
});

test('force-balance rejects non-finite external input before native calls', async () => {
  let called = false;
  const engine = loadEngine({
    principiaDesktop: { async computePhysics() { called = true; return {}; } }
  });
  await assert.rejects(
    engine.scoreForceBalance({ x: Number.NaN, y: 0, targetX: 0, targetY: 0 }),
    /x must be a finite number/
  );
  assert.equal(called, false);
});

test('force-balance rejects malformed native output', async () => {
  const engine = loadEngine({
    principiaDesktop: {
      async computePhysics() {
        return { error: -1, points: 150, balanced: 'yes' };
      }
    },
    PrincipiaWasmPhysics: {
      async compute() {
        return { error: 0, points: 100, balanced: true };
      }
    }
  });
  const result = await engine.scoreForceBalance({ x: 0, y: 0, targetX: 0, targetY: 0 });
  assert.equal(result.points, 100);
  assert.equal(engine.backend, 'rust-wasm-force-balance');
});

test('force-balance scoring uses the Go API before browser WASM', async () => {
  let request;
  const engine = loadEngine({
    async fetch(url, init) {
      request = { url, init, body: JSON.parse(init.body) };
      return { ok: true, async json() {
        return { ok: true, value: { error: 0, points: 100, balanced: true } };
      } };
    },
    PrincipiaWasmPhysics: {
      async compute() { throw new Error('WASM should not be called'); }
    }
  });
  const result = await engine.scoreForceBalance({ x: 0, y: 0, targetX: 0, targetY: 0 });
  assert.equal(result.points, 100);
  assert.equal(request.url, '/api/compute');
  assert.equal(request.body.op, 'forceBalance');
  assert.equal(engine.backend, 'go-rust-force-balance');
});

test('scalar physics calculations use Go API when configured', async () => {
  let request;
  const engine = loadEngine({
    async fetch(url, init) {
      request = JSON.parse(init.body);
      return { ok: true, async json() { return { ok: true, value: 11 }; } };
    }
  });
  const value = await engine.compute('velocity', { initial: 3, acceleration: 2, seconds: 4 });
  assert.equal(value, 11);
  assert.deepEqual(JSON.parse(JSON.stringify(request)), {
    op: 'velocity', initial: 3, acceleration: 2, seconds: 4
  });
  assert.equal(engine.backend, 'go-rust-cpp');
});
