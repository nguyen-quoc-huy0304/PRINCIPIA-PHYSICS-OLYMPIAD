const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = (file) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

test('PRINCIPIA icon library is loaded after its registry and has dedicated controls', () => {
  const index = read('index.html');
  const runtime = read('assets/js/principia-live-icons.js');
  const studio = read('assets/js/principia-icon-studio.js');
  const styles = read('assets/css/principia-icon-studio.css');

  assert.match(index, /principia-icon-studio\.css/);
  assert.ok(index.indexOf('principia-live-icons.js') < index.indexOf('principia-icon-studio.js'));
  assert.match(studio, /Thư viện Icon/);
  assert.match(studio, /type:'range'/);
  assert.match(studio, /type:'color'/);
  assert.match(studio, /Copy SVG/);
  assert.match(runtime, /getSvg\(name\)/);
  assert.match(runtime, /nav-default-icon/);
  assert.match(styles, /data-pr-icons-off="true"/);
});

test('custom image icons and PRINCIPIA brand assets are preserved', () => {
  const runtime = read('assets/js/principia-live-icons.js');
  const index = read('index.html');
  const app = read('assets/js/app-part-02.js');

  assert.match(runtime, /node\.querySelector\('\:scope > \.nav-default-icon'\)/);
  assert.match(runtime, /node\.querySelector\('\.pr-live-icon,svg,img'\)/);
  assert.match(index, /href="\/assets\/images\/principia-logo-round\.svg"/);
  assert.match(app, /PRINCIPIA_LOGO_URI\s*=\s*"\/assets\/images\/principia-logo-round\.svg"/);
});

test('reference animation engines and styles are connected to the live app', () => {
  const index = read('index.html');
  assert.match(index, /anime-4\.5\.0\.umd\.min\.js/);
  assert.match(index, /principia-reference-motion\.js/);
  assert.match(index, /principia-reference-ui\.js/);
  assert.match(index, /principia-kinetic-ui\.js/);
  assert.match(index, /principia-delight-motion\.js/);
  assert.match(index, /principia-delight-motion\.css/);
  assert.match(index, /principia-reference-ui\.css/);
});
