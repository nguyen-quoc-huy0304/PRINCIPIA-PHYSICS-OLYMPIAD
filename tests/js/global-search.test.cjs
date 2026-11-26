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
  assert.doesNotMatch(source, /const flatten\s*=|function collect\s*\(|const matches\s*=\s*term\s*\?/);
});
