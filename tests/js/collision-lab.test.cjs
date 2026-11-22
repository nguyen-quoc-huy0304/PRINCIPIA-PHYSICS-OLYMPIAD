const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-collision-lab.js', 'utf8');
const context = { window: null, Number, Math, TypeError, RangeError };
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-collision-lab.js' });
const { collide1D } = context.PrincipiaCollisionMath;

test('elastic collision conserves momentum and kinetic energy', () => {
  const r = collide1D(1, 3, 1, -1, 1);
  assert.ok(Math.abs(r.momentumAfter - r.momentumBefore) < 1e-12);
  assert.ok(Math.abs(r.kineticAfter - r.kineticBefore) < 1e-12);
  assert.ok(Math.abs(r.v1 + 1) < 1e-12);
  assert.ok(Math.abs(r.v2 - 3) < 1e-12);
});

test('perfectly inelastic collision gives both bodies the center-of-mass velocity', () => {
  const r = collide1D(1, 4, 3, 0, 0);
  assert.ok(Math.abs(r.v1 - 1) < 1e-12);
  assert.ok(Math.abs(r.v2 - 1) < 1e-12);
  assert.ok(Math.abs(r.momentumError) < 1e-12);
  assert.ok(r.energyLoss > 0);
});

test('partial inelastic collision conserves momentum and loses kinetic energy', () => {
  const r = collide1D(2, 5, 1, -1, 0.5);
  assert.ok(Math.abs(r.momentumError) < 1e-12);
  assert.ok(r.kineticAfter < r.kineticBefore);
});

test('equal velocities produce no impulse for any restitution', () => {
  const r = collide1D(2, 2, 4, 2, 0.25);
  assert.equal(r.v1, 2);
  assert.equal(r.v2, 2);
});

test('rejects non-positive masses and invalid restitution', () => {
  assert.throws(() => collide1D(0, 1, 1, 0, 1), RangeError);
  assert.throws(() => collide1D(1, 1, 1, 0, 1.1), RangeError);
  assert.throws(() => collide1D(1, Infinity, 1, 0, 1), TypeError);
});