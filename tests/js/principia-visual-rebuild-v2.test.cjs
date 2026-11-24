const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('visual rebuild v2 is loaded after the existing visual layers', () => {
  const html = read('index.html');
  const visualIndex = html.indexOf('principia-visual-system.css');
  const rebuildIndex = html.indexOf('principia-visual-rebuild-v2.css');
  assert.ok(visualIndex >= 0 && rebuildIndex > visualIndex);
  assert.equal((html.match(/principia-visual-rebuild-v2\.css/g) || []).length, 1);
});

test('visual rebuild v2 preserves the existing brand and application mount', () => {
  const html = read('index.html');
  assert.match(html, /href="\/assets\/images\/principia-logo-round\.svg"/);
  assert.match(html, /<div id="app"><\/div>/);
  assert.equal((html.match(/id="app"/g) || []).length, 1);
});

test('visual rebuild v2 has balanced CSS blocks and accessible motion fallback', () => {
  const css = read('assets/css/principia-visual-rebuild-v2.css');
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /data-theme="light"/);
  assert.match(css, /data-pr-theme="light"/);
  assert.match(css, /max-width:760px/);
});
