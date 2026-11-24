const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/core/performance.js', 'utf8');

function createHarness(deviceMemory = 4, pageURL = 'https://principia.example/app') {
  const scripts = [];
  const head = {
    appendChild(script) {
      script.parentNode = head;
      scripts.push(script);
      return script;
    },
    removeChild(script) {
      const index = scripts.indexOf(script);
      if (index >= 0) scripts.splice(index, 1);
      script.parentNode = null;
      return script;
    }
  };
  const document = {
    scripts,
    head,
    body: {},
    documentElement: { nodeType: 1, matches: () => false, querySelectorAll: () => [] },
    visibilityState: 'visible',
    readyState: 'complete',
    addEventListener() {},
    createElement(tag) { return { tagName: String(tag).toUpperCase(), dataset: {}, parentNode: null }; }
  };
  const context = {
    document,
    window: null,
    navigator: { deviceMemory, hardwareConcurrency: 4 },
    performance: {},
    console,
    URL,
    setTimeout,
    setTimeout
  };
  context.window = context;
  context.location = { href: pageURL, origin: new URL(pageURL).origin };
  vm.runInNewContext(source, context, { filename: 'performance.js' });
  return { api: context.PrincipiaPerformance, document, scripts };
}

test('rejects empty and unsafe script URLs without adding a script', async () => {
  const { api, scripts } = createHarness();
  await assert.rejects(api.loadScript(''), /script URL is required/i);
  await assert.rejects(api.loadScript('javascript:alert(1)'), /HTTPS or same-origin HTTP/i);
  await assert.rejects(api.loadScript('data:text/javascript,alert(1)'), /HTTPS or same-origin HTTP/i);
  await assert.rejects(api.loadScript('http://attacker.example/script.js'), /HTTPS or same-origin HTTP/i);
  assert.equal(scripts.length, 0);
});

test('allows HTTPS and same-origin HTTP scripts', async () => {
  const { api, scripts } = createHarness();
  const httpsPromise = api.loadScript('https://cdn.example/module.js');
  assert.equal(scripts.length, 1);
  scripts[0].onload();
  await httpsPromise;

  const httpHarness = createHarness(4, 'http://principia.example/app');
  const localPromise = httpHarness.api.loadScript('/assets/local-module.js');
  assert.equal(httpHarness.scripts.length, 1);
  assert.equal(httpHarness.scripts[0].src, '/assets/local-module.js');
  httpHarness.scripts[0].onload();
  await localPromise;
});

test('deduplicates concurrent requests and reuses loaded modules', async () => {
  const { api, scripts } = createHarness();
  const first = api.loadScript('/assets/shared.js');
  const second = api.loadScript('/assets/shared.js');
  assert.strictEqual(first, second);
  assert.equal(scripts.length, 1);
  scripts[0].onload();
  assert.strictEqual(await first, scripts[0]);
  assert.strictEqual(api.loadScript('/assets/shared.js'), first);
  assert.equal(scripts.length, 1);
});

test('removes failed scripts and permits a clean retry', async () => {
  const { api, document, scripts } = createHarness();
  const firstPromise = api.loadScript('/assets/retry.js');
  const firstScript = scripts[0];
  firstScript.onerror();
  await assert.rejects(firstPromise, /Không tải được mô-đun/);
  assert.equal(document.scripts.length, 0);
  assert.equal(firstScript.parentNode, null);

  const retryPromise = api.loadScript('/assets/retry.js');
  assert.equal(scripts.length, 1);
  assert.notStrictEqual(scripts[0], firstScript);
  scripts[0].onload();
  assert.strictEqual(await retryPromise, scripts[0]);
});

test('loadScripts preserves script order', async () => {
  const { api, scripts } = createHarness();
  const sequence = api.loadScripts(['/assets/first.js', 'https://cdn.example/second.js']);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(scripts.length, 1);
  assert.equal(scripts[0].src, '/assets/first.js');
  scripts[0].onload();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(scripts.length, 2);
  assert.equal(scripts[1].src, 'https://cdn.example/second.js');
  scripts[1].onload();
  await sequence;
});

test('reports constrained device profiles without exposing unsupported memory data', () => {
  const { api } = createHarness(2);
  const profile = api.getProfile();
  assert.equal(api.lowMemory, true);
  assert.equal(profile.tier, 'low-memory');
  assert.equal(profile.deviceMemoryGB, 2);
  assert.equal(profile.memoryInfo, null);
});
