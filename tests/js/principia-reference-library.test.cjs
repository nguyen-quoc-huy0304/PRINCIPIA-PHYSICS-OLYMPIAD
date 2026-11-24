const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');
const countSingleRecords = (source) => (source.match(/\['[^'\n]{2,120}','[^'\n]{2,60}','[^'\n]{2,80}',/g) || []).length;
const countDoubleRecords = (source) => (source.match(/\["[^"\n]{2,120}","[^"\n]{2,60}","[^"\n]{2,80}",/g) || []).length;

test('component vault count is based on real source records multiplied by real skins', () => {
  const vault = read('assets/js/principia-component-vault.js');
  const expansion = read('assets/js/principia-vault-expansion.js');
  const base = vault.slice(vault.indexOf('const BASE_ITEMS'), vault.indexOf('const ITEMS'));
  const extraStart = expansion.indexOf('const components = [');
  const extraEnd = expansion.indexOf('];', extraStart) + 2;
  const extra = expansion.slice(extraStart, extraEnd);
  const batchCount = Array.from({ length: 14 }, (_, index) => {
    const file = 'assets/js/principia-component-batch-' + String(index + 2).padStart(2, '0') + '.js';
    return countDoubleRecords(read(file));
  }).reduce((sum, count) => sum + count, 0);
  const sourceRecords = countSingleRecords(base) + countSingleRecords(extra) + batchCount;
  const baseSkins = (vault.match(/const SKINS = \[(.*?)\];/s)?.[1].match(/\["[^"]+"/g) || []).length;
  const expansionSkins = Number(expansion.match(/Array\.from\(\{\s*length:\s*(\d+)\s*\}/)?.[1] || 0);
  const totalSkins = baseSkins + expansionSkins;

  assert.equal(sourceRecords, 579);
  assert.equal(batchCount, 517);
  assert.equal(totalSkins, 182);
  assert.equal(sourceRecords * totalSkins, 105378);
  assert.match(vault, /const catalogCount = ITEMS\.length \* SKINS\.length/);
});

test('all requested reference sources are listed with honest reuse notes', () => {
  const vault = read('assets/js/principia-component-vault.js');
  [
    'animate-ui.com',
    'kokonutui.com/docs',
    'uiverse.io',
    'libraries.dev/introduction',
    'devanshutak25.github.io/ui-ux-ref',
    'feralui.dev',
    'animejs.com',
    'favico.js',
    'hairline.lucasmarkes.com',
    'koboyo.com/page-mascot',
    'lucianlabs.dev',
    'threeui.com/browse'
  ].forEach(source => assert.ok(vault.includes(source), 'Missing source: ' + source));
  assert.match(vault, /Số lượng là thống kê công bố trên trang nguồn, không phải số mẫu đã nhập/);
});

test('Animation Studio has isolated controls and respects reduced motion', () => {
  const index = read('index.html');
  const script = read('assets/js/principia-animation-studio.js');
  const styles = read('assets/css/principia-animation-studio.css');
  assert.match(index, /principia-animation-studio\.css/);
  assert.match(index, /principia-animation-studio\.js/);
  assert.match(script, /data-pr-animation-studio/);
  assert.match(script, /localStorage/);
  assert.match(styles, /pr-animation-beam-off/);
  assert.match(styles, /pr-animation-mascot-off/);
  assert.match(styles, /prefers-reduced-motion/);
});
