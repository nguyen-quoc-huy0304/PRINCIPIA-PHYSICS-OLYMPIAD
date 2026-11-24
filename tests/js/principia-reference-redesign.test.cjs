const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('reference redesign is loaded after the existing visual system', () => {
  const html = read('index.html');
  const visualIndex = html.indexOf('principia-visual-system.css');
  const redesignIndex = html.indexOf('principia-reference-redesign.css');
  assert.ok(visualIndex >= 0 && redesignIndex > visualIndex);
  assert.match(html, /href="\/assets\/images\/principia-logo-round\.svg"/);
  assert.match(html, /<div id="app"><\/div>/);
});

test('reference redesign is visual-only and preserves responsive layout rules', () => {
  const css = read('assets/css/principia-reference-redesign.css');
  const forbidden = /(?:^|[;{])\s*(?:display|position|width|height|min-width|max-width|min-height|max-height|padding|margin|gap|grid(?:-[a-z-]+)?|flex(?:-[a-z-]+)?|order|overflow(?:-[a-z-]+)?)\s*:/gm;
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
  assert.deepEqual([...css.matchAll(forbidden)].map(match => match[0].trim()), []);
  assert.match(css, /data-pr-theme="light"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /body>\.principia-mobile-nav/);
});

test('visual redesign does not replace existing brand assets or page mount', () => {
  const html = read('index.html');
  assert.equal((html.match(/principia-reference-redesign\.css/g) || []).length, 1);
  assert.equal((html.match(/principia-logo-round\.svg/g) || []).length, 1);
  assert.equal((html.match(/id="app"/g) || []).length, 1);
});
