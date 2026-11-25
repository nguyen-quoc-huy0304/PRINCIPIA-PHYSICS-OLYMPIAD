const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('functions/api/compute.js', 'utf8')
  .replace('export async function onRequestPost', 'async function onRequestPost') +
  '\nglobalThis.__handler = onRequestPost;';

function loadHandler(fetchImpl = async () => new Response('{}', { status: 502 })) {
  const context = {
    Response, URL, TextEncoder, AbortSignal, JSON, Number, String, Set, Array, Object, Error,
    fetch: fetchImpl
  };
  vm.runInNewContext(source, context, { filename: 'functions/api/compute.js' });
  return context.__handler;
}

function request(body, headers = {}) {
  return new Request('https://principia.example/api/compute', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body)
  });
}

test('returns 503 until the Go service URL is configured', async () => {
  const handler = loadHandler();
  const response = await handler({ request: request({ op: 'velocity', initial: 1, acceleration: 2, seconds: 3 }), env: {} });
  assert.equal(response.status, 503);
});

test('rejects cross-origin and malformed compute requests', async () => {
  const handler = loadHandler();
  const crossOrigin = await handler({
    request: request({ op: 'velocity', initial: 1, acceleration: 2, seconds: 3 }, { origin: 'https://attacker.example' }),
    env: { PRINCIPIA_GO_API_URL: 'https://api.example' }
  });
  assert.equal(crossOrigin.status, 403);

  const invalid = await handler({
    request: request({ op: 'velocity', initial: 1, acceleration: 2, seconds: '3' }),
    env: { PRINCIPIA_GO_API_URL: 'https://api.example' }
  });
  assert.equal(invalid.status, 400);
});

test('validates and forwards native compute requests to Go API', async () => {
  let forwarded;
  const handler = loadHandler(async (url, init) => {
    forwarded = { url, init, body: JSON.parse(init.body) };
    return new Response(JSON.stringify({ id: null, ok: true, value: 11 }), {
      status: 200, headers: { 'content-type': 'application/json' }
    });
  });
  const response = await handler({
    request: request({ op: 'velocity', initial: 3, acceleration: 2, seconds: 4 }),
    env: { PRINCIPIA_GO_API_URL: 'https://api.example/' }
  });
  assert.equal(response.status, 200);
  assert.equal(forwarded.url, 'https://api.example/v1/compute');
  assert.equal(forwarded.body.op, 'velocity');
  assert.equal((await response.json()).value, 11);
});

test('rejects oversized and malformed regression point arrays', async () => {
  const handler = loadHandler();
  const response = await handler({
    request: request({ op: 'linearRegression', points: [[1, 2, 3], [2, 4]] }),
    env: { PRINCIPIA_GO_API_URL: 'https://api.example' }
  });
  assert.equal(response.status, 400);
});
