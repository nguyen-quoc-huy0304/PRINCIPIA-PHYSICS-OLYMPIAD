const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-global-search.js', 'utf8');

function createSearchContext() {
  const calls = [];
  const context = {
    window: null,
    document: { readyState: 'loading', addEventListener() {} },
    localStorage: { getItem() { return null; }, setItem() {} },
    console, Set, String, Array,
    data: [{ id: 'lesson-1', name: 'Cơ học', type: 'lesson' }],
    quizData: [{ id: 'quiz-1', name: 'Ôn tập', type: 'quiz' }],
    funData: [{ id: 'fun-1', name: 'Khám phá', type: 'fun' }]
  };
  context.PrincipiaWasmPhysics = {
    async globalSearchIndex(catalog, query, defaultKind) {
      calls.push({ catalog, query, defaultKind });
      return { items: catalog.map(item => ({
        ...item, kind: item.type || defaultKind, path: item.name, questions: []
      })) };
    }
  };
  context.window = context;
  vm.runInNewContext(source, context, { filename: 'principia-global-search.js' });
  return { api: context.PrincipiaGlobalSearchCore, calls, context };
}

test('global search escapes HTML-sensitive characters', () => {
  const { api } = createSearchContext();
  assert.equal(api.escapeHTML('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(api.escapeHTML("a&b'c"), 'a&amp;b&#39;c');
});

test('global search delegates all catalog traversal to Rust/WASM', async () => {
  const { api, calls } = createSearchContext();
  const items = await api.search('newton');
  assert.deepEqual(calls.map(call => call.defaultKind), ['lesson', 'quiz', 'fun']);
  assert.ok(calls.every(call => call.query === 'newton'));
  assert.equal(items.map(item => item.kind).join(','), 'lesson,quiz,fun');
  assert.equal(items.map(item => item.id).join(','), 'lesson-1,quiz-1,fun-1');
});

test('global search deduplicates repeated IDs within a content kind', async () => {
  const { api, context } = createSearchContext();
  context.quizData.push({ id: 'quiz-1', name: 'Duplicate', type: 'quiz' });
  const items = await api.search('');
  assert.equal(items.filter(item => item.kind === 'quiz' && item.id === 'quiz-1').length, 1);
});

test('global search fails closed when the Rust/WASM engine is unavailable', async () => {
  const { api, context } = createSearchContext();
  delete context.PrincipiaWasmPhysics;
  await assert.rejects(api.search('momentum'), /Rust global search is unavailable/);
});

test('browser search no longer implements catalog traversal or matching in JavaScript', () => {
  assert.match(source, /PrincipiaWasmPhysics\.globalSearchIndex/);
  assert.match(source, /async function renderResults/);
  assert.doesNotMatch(source, /const flatten\\s*=|const matches\\s*=\\s*term\\s*\\?/);
});

test('global search trims and bounds queries before calling Rust', async () => {
  const { api, calls } = createSearchContext();
  await api.search('  ' + 'x'.repeat(200) + '  ');
  assert.equal(api.maxQueryLength, 160);
  assert.ok(calls.every(call => call.query === 'x'.repeat(160)));
});

test('global search keeps healthy catalogs when one catalog fails', async () => {
  const { api, context } = createSearchContext();
  context.PrincipiaWasmPhysics.globalSearchIndex = async (catalog, query, kind) => {
    if (kind === 'quiz') throw new Error('catalog unavailable');
    return { items: catalog.map(item => ({ ...item, kind, path: item.name, questions: [] })) };
  };
  const items = await api.search('energy');
  assert.equal(items.map(item => item.kind).join(','), 'lesson,fun');
  assert.equal(items.failedKinds.join(','), 'quiz');
});

test('global search rejects when every populated catalog fails', async () => {
  const { api, context } = createSearchContext();
  context.PrincipiaWasmPhysics.globalSearchIndex = async () => { throw new Error('catalog unavailable'); };
  await assert.rejects(api.search('energy'), /all catalogs failed/);
});
test('global search caches repeated normalized queries without rerunning Rust', async () => {
  const { api, calls } = createSearchContext();
  const first = await api.search('  energy  ');
  const callCount = calls.length;
  first[0].name = 'mutated by caller';
  const second = await api.search('energy');
  assert.equal(calls.length, callCount);
  assert.notEqual(second[0].name, 'mutated by caller');
  assert.equal(api.cacheLimit, 24);
});

test('global search cache is bounded and evicts least-recently-used queries', async () => {
  const { api, calls } = createSearchContext();
  for (let i = 0; i < 25; i += 1) await api.search('query-' + i);
  assert.equal(calls.length, 75);
  await api.search('query-0');
  assert.equal(calls.length, 78);
});
