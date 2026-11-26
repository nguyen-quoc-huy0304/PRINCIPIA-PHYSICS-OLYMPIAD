const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-collision-lab.js', 'utf8');
const calls = [];
const rustResult = {
  v1: -1, v2: 3, momentumBefore: 2, momentumAfter: 2, momentumError: 0,
  kineticBefore: 5, kineticAfter: 5, kineticChange: 0, energyLoss: 0, totalMass: 2
};
const context = {
  window: null, Number, Math, TypeError, RangeError,
  PrincipiaWasmPhysics: {
    async compute(operation, params) {
      calls.push({ operation, params });
      if (operation !== 'collision1D') throw new Error('Unexpected WASM operation');
      return rustResult;
    }
  }
};
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-collision-lab.js' });
const { collide1D, resolveDiskCollision, momentumAndEnergy2D } = context.PrincipiaCollisionMath;

test('1D collision requests delegate to the Rust WASM solver', async () => {
  const result = await collide1D(1, 3, 1, -1, 1);
  assert.equal(calls[0].operation, 'collision1D');
  assert.equal(calls[0].params.massA, 1);
  assert.equal(calls[0].params.velocityA, 3);
  assert.equal(calls[0].params.massB, 1);
  assert.equal(calls[0].params.velocityB, -1);
  assert.equal(calls[0].params.restitution, 1);
  assert.equal(result.v1, -1);
  assert.equal(result.v2, 3);
  assert.equal(result.momentumError, 0);
});

test('1D collision adapter rejects invalid inputs before calling WASM', () => {
  assert.throws(() => collide1D(0, 1, 1, 0, 1), RangeError);
  assert.throws(() => collide1D(1, 1, 1, 0, 1.1), RangeError);
  assert.throws(() => collide1D(1, Infinity, 1, 0, 1), TypeError);
});

test('2D equal-mass elastic disk collision exchanges normal velocities', () => {
  const a = { x: 0, y: 0, vx: 1, vy: 0, mass: 1, radius: 1 };
  const b = { x: 1.5, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const before = momentumAndEnergy2D([a, b]);
  const result = resolveDiskCollision(a, b, 1);
  const after = momentumAndEnergy2D([a, b]);
  assert.equal(result.collided, true);
  assert.ok(Math.abs(a.vx + 1) < 1e-12);
  assert.ok(Math.abs(b.vx - 1) < 1e-12);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(Math.abs(after.kinetic - before.kinetic) < 1e-12);
});

test('2D oblique collision preserves tangential velocity and momentum', () => {
  const a = { x: 0, y: 0, vx: 2, vy: 3, mass: 2, radius: 2 };
  const b = { x: 3, y: 0, vx: -1, vy: -2, mass: 1, radius: 2 };
  const before = momentumAndEnergy2D([a, b]);
  resolveDiskCollision(a, b, 1);
  const after = momentumAndEnergy2D([a, b]);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(Math.abs(after.py - before.py) < 1e-12);
  assert.ok(Math.abs(after.kinetic - before.kinetic) < 1e-12);
});

test('2D separating overlapping disks are separated without an impulse', () => {
  const a = { x: 0, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const b = { x: 1, y: 0, vx: 1, vy: 0, mass: 1, radius: 1 };
  const result = resolveDiskCollision(a, b, 0.5);
  assert.equal(result.impulse, 0);
  assert.ok(Math.hypot(b.x - a.x, b.y - a.y) >= 1.79);
});

test('2D collision rejects invalid body values', () => {
  const a = { x: 0, y: 0, vx: 0, vy: 0, mass: 0, radius: 1 };
  const b = { x: 1, y: 0, vx: 0, vy: 0, mass: 1, radius: 1 };
  assert.throws(() => resolveDiskCollision(a, b, 1), RangeError);
});

test('2D unequal-mass head-on elastic collision conserves momentum and energy', () => {
  const a = { x: 0, y: 0, vx: 3, vy: 0, mass: 2, radius: 1 };
  const b = { x: 1.5, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const before = momentumAndEnergy2D([a, b]);
  resolveDiskCollision(a, b, 1);
  const after = momentumAndEnergy2D([a, b]);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(Math.abs(after.kinetic - before.kinetic) < 1e-12);
  assert.ok(Math.abs(a.vx - (1/3)) < 1e-12);
  assert.ok(Math.abs(b.vx - (13/3)) < 1e-12);
});

test('2D perfectly inelastic collision conserves momentum while reducing kinetic energy', () => {
  const a = { x: 0, y: 0, vx: 2, vy: 0, mass: 1, radius: 1 };
  const b = { x: 1.5, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const before = momentumAndEnergy2D([a, b]);
  resolveDiskCollision(a, b, 0);
  const after = momentumAndEnergy2D([a, b]);
  assert.ok(Math.abs(after.px - before.px) < 1e-12);
  assert.ok(after.kinetic < before.kinetic);
  assert.ok(Math.abs(a.vx - 0.5) < 1e-12);
  assert.ok(Math.abs(b.vx - 0.5) < 1e-12);
});

test('2D collision delegates to the loaded Rust WASM module', async () => {
  const calls = [];
  const rustModule = {
    physics_disk_collision_json(bodyA, bodyB, restitution) {
      calls.push({ bodyA: JSON.parse(bodyA), bodyB: JSON.parse(bodyB), restitution });
      return JSON.stringify({
        collided: true, impulse: 2,
        a: { x: -0.4, y: 0, vx: -1, vy: 0 },
        b: { x: 1.9, y: 0, vx: 1, vy: 0 }
      });
    }
  };
  const nativeContext = {
    window: null, Number, Math, TypeError, RangeError,
    PrincipiaWasmPhysics: { load: async () => rustModule }
  };
  nativeContext.window = nativeContext;
  vm.runInNewContext(source, nativeContext, { filename: 'principia-collision-lab-native.js' });
  await Promise.resolve();
  const a = { x: 0, y: 0, vx: 1, vy: 0, mass: 1, radius: 1 };
  const b = { x: 1.5, y: 0, vx: -1, vy: 0, mass: 1, radius: 1 };
  const result = nativeContext.PrincipiaCollisionMath.resolveDiskCollision(a, b, 1);
  assert.equal(calls.length, 1);
  assert.equal(calls[0].bodyA.mass, 1);
  assert.equal(calls[0].restitution, 1);
  assert.equal(result.impulse, 2);
  assert.equal(a.vx, -1);
  assert.equal(b.vx, 1);
});
