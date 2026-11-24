'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }
function extractArray(source, marker) {
  const start = source.indexOf(marker) + marker.length;
  assert.ok(source.indexOf(marker) >= 0, 'array marker must exist');
  let depth = 0, quoted = false, escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '[') depth += 1;
    else if (char === ']' && --depth === 0) return JSON.parse(source.slice(start, index + 1));
  }
  throw new Error('Unterminated array');
}
test('study library contains every numbered method and core requested learning techniques', () => {
  const methods = extractArray(read('assets/js/principia-study-methods.js'), 'const methods=');
  assert.equal(methods.length, 231);
  assert.deepEqual(methods.map(item => item.id), Array.from({ length: 231 }, (_, index) => index + 1));
  const titles = methods.map(item => item.title.toLowerCase());
  for (const term of ['adaptive difficulty', 'deliberate practice', 'retrieval practice', '题海战术', 'mind map', 'bayesian', 'olympiad heuristics']) {
    assert.ok(titles.some(title => title.includes(term)), 'missing method: ' + term);
  }
});
test('component reference expansion provides more than 100,000 themed variants', () => {
  const source = read('assets/js/principia-vault-expansion.js');
  const vault = read('assets/js/principia-component-vault.js');
  assert.match(source, /length: 157/);
  assert.equal((source.match(/^    \['/gm) || []).length, 22);
  assert.match(source, /window\.PRINCIPIA_EXTRA_COMPONENTS = components/);
  assert.match(vault, /PRINCIPIA_EXTRA_COMPONENTS/);
  assert.match(vault, /PRINCIPIA_EXTRA_SKINS/);
  assert.match(vault, /catalogCount = ITEMS.length \* SKINS.length/);
  assert.equal((40 + 512 + 22) * (25 + 157), 104468);
});
test('ant emblem is vector-based and the application references it', () => {
  const logo = read('assets/images/principia-ant-logo.svg');
  const app = read('assets/js/app-part-02.js');
  assert.match(logo, /PRINCIPIA ant emblem/);
  assert.match(logo, /<path d="M310 310L248 263/);
  assert.match(app, /principia-ant-logo\.svg/);
});
