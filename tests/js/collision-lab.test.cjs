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
test('2D equal-mass elastic disk collision exchanges normal velocities', () => {
  const a = { x: 0, y: 0, vx: 1, vy: 0, mass: 1, radius: 1 };
  const b = { x: 1.5, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const before = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  const result = context.PrincipiaCollisionMath.resolveDiskCollision(a, b, 1);
  const after = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  assert.equal(result.collided, true);
  assert.ok(Math.abs(a.vx + 1) < 1e-12);
  assert.ok(Math.abs(b.vx - 1) < 1e-12);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(Math.abs(after.kinetic - before.kinetic) < 1e-12);
});

test('2D oblique collision preserves tangential velocity and momentum', () => {
  const a = { x: 0, y: 0, vx: 2, vy: 3, mass: 2, radius: 2 };
  const b = { x: 3, y: 0, vx: -1, vy: -2, mass: 1, radius: 2 };
  const before = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  context.PrincipiaCollisionMath.resolveDiskCollision(a, b, 1);
  const after = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(Math.abs(after.py - before.py) < 1e-12);
  assert.ok(Math.abs(after.kinetic - before.kinetic) < 1e-12);
});

test('2D separating overlapping disks are separated without an impulse', () => {
  const a = { x: 0, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const b = { x: 1, y: 0, vx: 1, vy: 0, mass: 1, radius: 1 };
  const result = context.PrincipiaCollisionMath.resolveDiskCollision(a, b, 0.5);
  assert.equal(result.impulse, 0);
  assert.ok(Math.hypot(b.x - a.x, b.y - a.y) >= 1.79);
});

test('2D collision rejects invalid body values', () => {
  const a = { x: 0, y: 0, vx: 0, vy: 0, mass: 0, radius: 1 };
  const b = { x: 1, y: 0, vx: 0, vy: 0, mass: 1, radius: 1 };
  assert.throws(() => context.PrincipiaCollisionMath.resolveDiskCollision(a, b, 1), RangeError);
});

test('2D unequal-mass head-on elastic collision conserves momentum and energy', () => {
  const a = { x: 0, y: 0, vx: 3, vy: 0, mass: 2, radius: 1 };
  const b = { x: 1.5, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const before = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  context.PrincipiaCollisionMath.resolveDiskCollision(a, b, 1);
  const after = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(Math.abs(after.kinetic - before.kinetic) < 1e-12);
  assert.ok(Math.abs(a.vx - (1/3)) < 1e-12);
  assert.ok(Math.abs(b.vx - (13/3)) < 1e-12);
});

test('2D perfectly inelastic collision conserves momentum while reducing kinetic energy', () => {
  const a = { x: 0, y: 0, vx: 2, vy: 0, mass: 1, radius: 1 };
  const b = { x: 1.5, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const before = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  context.PrincipiaCollisionMath.resolveDiskCollision(a, b, 0);
  const after = context.PrincipiaCollisionMath.momentumAndEnergy2D([a, b]);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(after.kinetic < before.kinetic);
  assert.ok(Math.abs(a.vx - 0.5) < 1e-12);
  assert.ok(Math.abs(b.vx - 0.5) < 1e-12);
});
