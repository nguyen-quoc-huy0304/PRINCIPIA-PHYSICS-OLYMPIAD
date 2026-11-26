const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-pendulum-lab.js', 'utf8');
const calls = [];
const context = {
  document: { readyState: 'loading', addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  Math, Number, Object, JSON, RangeError, window: null,
  PrincipiaWasmPhysics: {
    async compute(operation, params) {
      calls.push({ operation, params });
      if (operation !== 'pendulum') throw new Error('Unexpected WASM operation');
      if (!Number.isFinite(params.lengthM) || params.lengthM <= 0 ||
          !Number.isFinite(params.gravityMps2) || params.gravityMps2 <= 0 ||
          !Number.isFinite(params.amplitudeDeg) || Math.abs(params.amplitudeDeg) >= 90) {
        throw new RangeError('Invalid pendulum parameters');
      }
      const angularFrequencyRadS = Math.sqrt(params.gravityMps2 / params.lengthM);
      const periodSeconds = 2 * Math.PI / angularFrequencyRadS;
      return {
        angularFrequencyRadS,
        periodSeconds,
        frequencyHz: 1 / periodSeconds,
        maxSpeedMps: Math.sqrt(2 * params.gravityMps2 * params.lengthM *
          (1 - Math.cos(params.amplitudeDeg * Math.PI / 180))),
        maxAccelerationMps2: params.gravityMps2 *
          Math.sin(params.amplitudeDeg * Math.PI / 180),
        approximation: 'small-angle'
      };
    }
  }
};
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-pendulum-lab.js' });
const math = context.PrincipiaPendulumMath;

test('pendulum requests are delegated to the Rust WASM physics contract', async () => {
  const result = await math.pendulumAt(1, 9.81, 5);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].operation, 'pendulum');
  assert.deepEqual(calls[0].params, { lengthM: 1, gravityMps2: 9.81, amplitudeDeg: 5 });
  assert.ok(Math.abs(result.periodSeconds - 2.006) < 0.01);
  assert.equal(result.approximation, 'small-angle');
});

test('longer pendulum has a longer period', async () => {
  const short = await math.pendulumAt(1, 9.81, 10);
  const long = await math.pendulumAt(2, 9.81, 10);
  assert.ok(long.periodSeconds > short.periodSeconds);
});

test('stronger gravity shortens the period', async () => {
  const earth = await math.pendulumAt(1, 9.81, 10);
  const stronger = await math.pendulumAt(1, 15, 10);
  assert.ok(stronger.periodSeconds < earth.periodSeconds);
});

test('energy-based maximum speed is zero at zero amplitude', async () => {
  const result = await math.pendulumAt(1, 9.81, 0);
  assert.equal(result.maxSpeedMps, 0);
});

test('invalid physical parameters are rejected by the physics provider', async () => {
  await assert.rejects(math.pendulumAt(0, 9.81, 10), RangeError);
  await assert.rejects(math.pendulumAt(1, 0, 10), RangeError);
  await assert.rejects(math.pendulumAt(1, 9.81, 90), RangeError);
});
