const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/physics-engine.js', 'utf8');

function loadEngine(PrincipiaWasmPhysics = null) {
  const context = { window: null, Math, Number, Object, Array, RangeError, TypeError };
  context.window = context;
  context.PrincipiaWasmPhysics = PrincipiaWasmPhysics;
  vm.runInNewContext(source, context, { filename: 'physics-engine.js' });
  return context.PrincipiaPhysics;
}

test('experimental data regression delegates to Rust WebAssembly', async () => {
  const calls = [];
  const engine = loadEngine({
    async compute(operation, params) {
      calls.push({ operation, params });
      return { slope: 2, intercept: 1, rSquared: 1, rmse: 0, count: 3 };
    }
  });
  const fit = await engine.fitLinearData([[0, 1], [1, 3], [2, 5]]);
  assert.equal(fit.slope, 2);
  assert.equal(fit.intercept, 1);
  assert.equal(fit.count, 3);
  assert.equal(engine.backend, 'rust-wasm-regression');
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, 'linearRegression');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0].params.points)), [[0, 1], [1, 3], [2, 5]]);
});

test('experimental data regression validates point count and coordinates', async () => {
  const engine = loadEngine();
  await assert.rejects(engine.fitLinearData([[1, 2]]), RangeError);
  await assert.rejects(engine.fitLinearData([[1, 2], [3, Infinity]]), TypeError);
  await assert.rejects(engine.fitLinearData([[1, 2, 3], [4, 5, 6]]), TypeError);
});

test('experimental data regression keeps a bounded analytical fallback', async () => {
  const engine = loadEngine({ async compute() { throw new Error('WASM unavailable'); } });
  const fit = await engine.fitLinearData([[0, 1], [1, 3], [2, 5], [3, 7]]);
  assert.ok(Math.abs(fit.slope - 2) < 1e-12);
  assert.ok(Math.abs(fit.intercept - 1) < 1e-12);
  assert.ok(Math.abs(fit.rSquared - 1) < 1e-12);
  assert.ok(fit.rmse < 1e-12);
  assert.equal(engine.backend, 'javascript-analytical-fallback');
});
