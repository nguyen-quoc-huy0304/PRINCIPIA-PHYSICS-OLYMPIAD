const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '../..');
const script = fs.readFileSync(path.join(root, 'assets/js/principia-sidebar-collapse.js'), 'utf8');
const styles = fs.readFileSync(path.join(root, 'assets/css/principia-sidebar-collapse.css'), 'utf8');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

test('sidebar controller is valid JavaScript and isolated from app framework dependencies', () => {
  assert.doesNotThrow(() => new Function(script));
  assert.match(script, /principia_sidebar_collapsed_v1/);
  assert.match(script, /prefers-reduced-motion|matchMedia/);
  assert.match(script, /aria-expanded/);
});

test('collapse behavior is desktop-only and keeps mobile navigation untouched', () => {
  assert.match(script, /\(min-width: 901px\)/);
  assert.match(styles, /@media\(max-width:900px\)[\s\S]*?display:none!important/);
  assert.doesNotMatch(script, /principia-mobile-nav/);
});

test('both existing desktop shell variants receive the compact grid state', () => {
  assert.match(script, /#app > \.layout/);
  assert.match(script, /#app > \.principia-desktop-shell/);
  assert.match(styles, /\.pr-sidebar-collapsed\{grid-template-columns:var\(--pr-sidebar-collapsed\)/);
});

test('keyboard shortcut and persistent preference are available', () => {
  assert.match(script, /ctrlKey|metaKey/);
  assert.match(script, /localStorage\.setItem/);
  assert.match(script, /localStorage\.getItem/);
});

test('index loads the dedicated stylesheet and controller after the existing visual stack', () => {
  assert.match(html, /principia-sidebar-collapse\.css\?v=20261124-sidebar2/);
  assert.match(html, /principia-sidebar-collapse\.js\?v=[^"]+/);
});
