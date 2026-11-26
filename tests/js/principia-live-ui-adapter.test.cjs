const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');

test('live UI adapter is loaded after the existing PRINCIPIA UI systems', () => {
  const html = read('index.html');
  assert.match(html, /principia-visual-system\.css/);
  assert.match(html, /principia-live-ui-adapter\.js/);
  assert.ok(html.indexOf('principia-kinetic-ui.css') > html.indexOf('principia-visual-system.css'));
  assert.ok(html.indexOf('principia-live-ui-adapter.js') > html.indexOf('principia-motion-library.js'));
});

test('adapter enhances existing nodes without creating or replacing page structure', () => {
  const js = read('assets/js/principia-live-ui-adapter.js');
  assert.match(js, /data-pr-live-ui/);
  assert.match(js, /MutationObserver/);
  assert.match(js, /principia:rendered/);
  assert.doesNotMatch(js, /innerHTML|outerHTML|createElement\s*\(|replaceChildren\s*\(/);
  assert.match(js, /prefers-reduced-motion/);
});

test('live component styles include the selected reference patterns', () => {
  const css = read('assets/css/principia-live-ui-adapter.css');
  for (const token of ['spotlight', 'segmented', 'thinking', 'progress', 'prefers-reduced-motion', 'data-theme="light"']) {
    assert.ok(css.includes(token), 'missing UI integration: ' + token);
  }
  assert.equal((css.match(/{/g) || []).length, (css.match(/}/g) || []).length);
});

test('logo and app root remain unchanged', () => {
  const html = read('index.html');
  assert.match(html, /href="\/assets\/images\/principia-logo-round\.svg"/);
  assert.match(html, /<div id="app"><\/div>/);
});


test('press pattern only targets interactive primary controls and pointer tilt resets fully', () => {
  const js = read('assets/js/principia-live-ui-adapter.js');
  assert.ok(js.includes("['.main button.primary,.main button.btn-primary,.main a.primary,.main a.btn-primary', 'press']"));
  assert.ok(!js.includes("'.main .primary,.main .btn-primary'"));
  assert.ok(js.includes("removeProperty('--pr-live-rx')"));
  assert.ok(js.includes("removeProperty('--pr-live-ry')"));
  assert.ok(js.includes('nextTarget instanceof Node'));
});


test('Rust UI bridge is loaded without replacing the legacy app root', () => {
  const html = read('index.html');
  const js = read('assets/js/principia-rust-ui.js');
  const css = read('assets/css/principia-rust-ui-shell.css');
  assert.match(html, /principia-rust-ui-shell\.css/);
  assert.match(html, /principia-rust-ui\.js/);
  assert.match(js, /ui_render_html/);
  assert.match(js, /function mount\(root, options = \{\}\)/);
  assert.doesNotMatch(js, /document\.getElementById\(['"]app['"]\)/);
  assert.match(css, /@media\(max-width:700px\)/);
});
