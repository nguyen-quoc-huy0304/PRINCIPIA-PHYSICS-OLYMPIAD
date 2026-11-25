const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-global-search.js', 'utf8');
const context = {
  window: null,
  document: { readyState: 'loading', addEventListener() {} },
  localStorage: { getItem() { return null; }, setItem() {} },
  console, Set, String, Array
};
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-global-search.js' });
const api = context.PrincipiaGlobalSearchCore;

test('global search escapes HTML-sensitive characters', () => {
  assert.equal(api.escapeHTML('<script>alert("x")</script>'), '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;');
  assert.equal(api.escapeHTML("a&b'c"), 'a&amp;b&#39;c');
});

test('global search flattens nested lessons and preserves hierarchy', () => {
  const items = api.flatten([{ id: 'root', name: 'Cơ học', type: 'lesson', children: [
    { id: 'child', name: 'Động lực học', content: 'Newton', type: 'lesson' }
  ] }]);
  assert.equal(items.length, 2);
  assert.equal(items[1].path, 'Cơ học › Động lực học');
  assert.equal(items[1].content, 'Newton');
});

test('global search ignores malformed and empty nodes', () => {
  const items = api.flatten([null, 3, { id: 'empty' }, { id: 'q', name: 'Quiz', type: 'quiz' }]);
  assert.equal(items.length, 1);
  assert.equal(items[0].kind, 'quiz');
});

test('global search normalizes malformed question collections and mixed question data', () => {
  const items = api.flatten([
    { id: 'malformed', name: 'Malformed quiz', questions: { q: 'ignored' } },
    { id: 'mixed', name: 'Mixed quiz', questions: [
      'What is momentum?',
      null,
      { q: 'Energy?', a: [null, 2, 'J'], explanation: 7 },
      { q: 4, a: { invalid: true }, explanation: null }
    ] }
  ]);
  assert.equal(JSON.stringify(items[0].questions), '[]');
  assert.equal(JSON.stringify(items[1].questions), JSON.stringify([
    { q: 'What is momentum?', a: [], explanation: '' },
    { q: 'Energy?', a: ['2', 'J'], explanation: '7' },
    { q: '4', a: [], explanation: '' }
  ]));
});
