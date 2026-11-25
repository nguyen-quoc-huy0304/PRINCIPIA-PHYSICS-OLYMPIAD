const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('functions/api/game/trajectory.js', 'utf8')
  .replace('export async function onRequestPost', 'async function onRequestPost') +
  '\nglobalThis.__handler = onRequestPost;';

function loadHandler(fetchImpl) {
  const context = { Response, URL, TextEncoder, AbortSignal, JSON, Number, String, Set, Array, Object, Error, fetch: fetchImpl };
  vm.runInNewContext(source, context, { filename: 'functions/api/game/trajectory.js' });
  return context.__handler;
}

function makeRequest(body) {
  return new Request('https://principia.example/api/game/trajectory', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });
}

test('trajectory proxy validates physics input before forwarding', async () => {
  let forwarded = false;
  const handler = loadHandler(async () => {
    forwarded = true;
    return new Response('{}', { status: 200 });
  });
  const response = await handler({
    request: makeRequest({ speedMps: 10, angleDeg: 45, gravityMps2: 9.8, samples: 1 }),
    env: { PRINCIPIA_GO_API_URL: 'https://api.example' }
  });
  assert.equal(response.status, 400);
  assert.equal(forwarded, false);
});

test('trajectory proxy forwards valid requests and validates native output', async () => {
  let endpoint;
  const handler = loadHandler(async (url, init) => {
    endpoint = url;
    const input = JSON.parse(init.body);
    return new Response(JSON.stringify({
      flightTimeS: 1, rangeM: 5, maxHeightM: 2,
      points: Array.from({ length: input.samples }, (_, i) => ({ x: i, y: 0 }))
    }), { status: 200 });
  });
  const response = await handler({
    request: makeRequest({ speedMps: 10, angleDeg: 45, gravityMps2: 9.8, samples: 4 }),
    env: { PRINCIPIA_GO_API_URL: 'https://api.example' }
  });
  assert.equal(response.status, 200);
  assert.equal(endpoint, 'https://api.example/v1/game/trajectory');
  assert.equal((await response.json()).points.length, 4);
});
