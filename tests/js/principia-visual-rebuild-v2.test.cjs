const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = file => fs.readFileSync(file, 'utf8');

test('active visual stack is ordered after the base visual system', () => {
  const html = read('index.html');
  const visualIndex = html.indexOf('principia-visual-system.css');
  const kineticIndex = html.indexOf('principia-kinetic-ui.css');
  assert.ok(visualIndex >= 0 && kineticIndex > visualIndex);
  assert.equal((html.match(/principia-visual-system\.css/g) || []).length, 1);
});

test('active visual stack preserves the existing brand and application mount', () => {
  const html = read('index.html');
  assert.match(html, /href="\/assets\/images\/principia-logo-round\.svg"/);
  assert.match(html, /<div id="app"><\/div>/);
  assert.equal((html.match(/id="app"/g) || []).length, 1);
});

test('active visual system has balanced CSS and accessible motion fallbacks', () => {
  const css = read('assets/css/principia-visual-system.css');
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /data-theme="light"/);
  assert.match(css, /max-width:900px/);
});
