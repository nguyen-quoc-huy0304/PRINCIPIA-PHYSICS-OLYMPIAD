const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-game-wasm-adapter.js', 'utf8')
  .replaceAll('export async function', 'async function') +
  '\nglobalThis.__api = { getTrajectory, scoreShot };';

function loadAdapter(fetchImpl) {
  const context = { fetch: fetchImpl, JSON, Number, Array, Error };
  vm.runInNewContext(source, context, { filename: 'principia-game-wasm-adapter.js' });
  return context.__api;
}

test('projectile score is delegated to the Go Rust core', async () => {
  let payload;
  const adapter = loadAdapter(async (url, init) => {
    payload = { url, body: JSON.parse(init.body) };
    return { ok: true, async json() {
      return { ok: true, value: { rangeM: 40, errorM: 0, points: 100 } };
    } };
  });
  const result = await adapter.scoreShot(20, 45, 40, 9.8);
  assert.equal(result.points, 100);
  assert.equal(payload.url, '/api/compute');
  assert.equal(payload.body.op, 'gameProjectileScore');
});

test('projectile trajectory is normalized from Go API point objects', async () => {
  const adapter = loadAdapter(async (url, init) => {
    assert.equal(url, '/api/game/trajectory');
    const input = JSON.parse(init.body);
    return { ok: true, async json() {
      return {
        flightTimeS: 2, rangeM: 20, maxHeightM: 5,
        points: Array.from({ length: input.samples }, (_, i) => ({ x: i, y: i * 0.5 }))
      };
    } };
  });
  const points = await adapter.getTrajectory(20, 45, 9.8, 5);
  assert.deepEqual(JSON.parse(JSON.stringify(points)), [[0, 0], [1, 0.5], [2, 1], [3, 1.5], [4, 2]]);
});
