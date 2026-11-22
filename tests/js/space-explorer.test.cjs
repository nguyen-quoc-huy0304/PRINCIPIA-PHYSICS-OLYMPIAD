const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-space-explorer.js', 'utf8');
const context = {
  document: { readyState: 'loading', addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  Math, Number, JSON, Object,
  window: null
};
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-space-explorer.js' });
const { orbitAt } = context.PrincipiaSpaceMath;
const earth = { mu: 398600.4418, radius: 6371 };

test('Earth low-orbit speed and period are in expected physical ranges', () => {
  const orbit = orbitAt(earth, 400);
  assert.ok(orbit.circularSpeedMps > 7600 && orbit.circularSpeedMps < 7750);
  assert.ok(orbit.periodSeconds / 60 > 90 && orbit.periodSeconds / 60 < 95);
});

test('escape speed is sqrt(2) times circular speed', () => {
  const orbit = orbitAt(earth, 400);
  assert.ok(Math.abs(orbit.escapeSpeedMps / orbit.circularSpeedMps - Math.SQRT2) < 1e-12);
});

test('higher circular orbit has lower speed and longer period', () => {
  const low = orbitAt(earth, 200);
  const high = orbitAt(earth, 2000);
  assert.ok(high.circularSpeedMps < low.circularSpeedMps);
  assert.ok(high.periodSeconds > low.periodSeconds);
});
