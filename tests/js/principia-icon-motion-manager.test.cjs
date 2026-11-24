const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('icon manager exposes safe per-slot overrides and persists them', () => {
  const live = read('assets/js/principia-live-icons.js');
  const studio = read('assets/js/principia-icon-studio.js');
  const css = read('assets/css/principia-icon-studio.css');
  assert.match(live, /const SLOT_KEYS=Object\.freeze/);
  assert.match(live, /function setOverrides\(next\)/);
  assert.match(live, /SLOT_KEYS\.includes\(slot\)&&ICONS\[icon\]/);
  assert.match(live, /function applyOverrides\(\)/);
  assert.match(studio, /Ánh xạ icon theo chức năng/);
  assert.match(studio, /registry\.setOverrides\(next\)/);
  assert.match(css, /\.pr-icon-slot-row/);
});

test('motion library only changes effects on existing elements', () => {
  const index = read('index.html');
  const script = read('assets/js/principia-motion-library.js');
  const css = read('assets/css/principia-motion-library.css');
  assert.match(index, /principia-motion-library\.css/);
  assert.match(index, /principia-motion-library\.js/);
  assert.match(script, /const GROUPS=/);
  assert.match(script, /data-pr-motion-kind/);
  assert.match(script, /EXCLUDED='#proSiteEditorPanel/);
  assert.match(script, /localStorage/);
  assert.match(script, /prefers-reduced-motion/);
  assert.match(css, /data-pr-motion-effect="press"/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});

test('existing PRINCIPIA logo and application mount point remain unchanged', () => {
  const index = read('index.html');
  assert.match(index, /href="\/assets\/images\/principia-logo-round\.svg"/);
  assert.match(index, /<div id="app"><\/div>/);
});
