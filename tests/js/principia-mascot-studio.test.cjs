const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const read = path => fs.readFileSync(path, 'utf8');

test('3D companion exposes validated shape presets and bounded scale updates', () => {
  const companion = read('assets/js/principia-living-companion.js');
  assert.match(companion, /const SHAPES=Object\.freeze/);
  for (const shape of ['classic', 'round', 'slim', 'cat', 'robot']) {
    assert.ok(companion.includes(shape), 'missing shape preset: ' + shape);
  }
  assert.match(companion, /function setShape\(name\)/);
  assert.match(companion, /function setScale\(value\)/);
  assert.match(companion, /clamp\(next,\.65,1\.4\)/);
  assert.match(companion, /applyShapeToScene\(instance\)/);
});

test('mascot customization is an isolated accessible UI module', () => {
  const studio = read('assets/js/principia-mascot-studio.js');
  const css = read('assets/css/principia-mascot-studio.css');
  const html = read('index.html');
  assert.match(studio, /role: 'dialog'/);
  assert.match(studio, /data-shape-choice/);
  assert.match(studio, /data-mascot-scale/);
  assert.match(studio, /principiaLivingCompanion\?\.setShape/);
  assert.match(html, /principia-mascot-studio\.css/);
  assert.match(html, /principia-mascot-studio\.js/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
