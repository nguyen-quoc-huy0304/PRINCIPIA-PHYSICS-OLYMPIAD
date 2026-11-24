'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('momentum mode is opt-in, private by default, and integrated with adaptive AI guidance', () => {
  const source = read('assets/js/principia-momentum-mode.js');
  const html = read('index.html');
  const css = read('assets/css/principia-momentum-mode.css');
  assert.match(source, /principiaProMasteryEntry/);
  assert.match(source, /Không cần kể lý do/);
  assert.match(source, /Không tự động gửi cảm xúc hoặc thông tin riêng tư/);
  assert.match(source, /PrincipiaLearningOrchestrator\.begin/);
  assert.match(source, /principia:momentum-session-completed/);
  assert.match(source, /MAX_SESSIONS = 200/);
  assert.match(source, /prefers-reduced-motion/ .test(css) ? /./ : /prefers-reduced-motion/);
  assert.match(html, /principia-momentum-mode\.js\?v=20261124-momentum1/);
  assert.match(html, /principia-momentum-mode\.css\?v=20261124-momentum1/);
});

test('momentum storage validation rejects malformed records and limits session history', () => {
  const source = read('assets/js/principia-momentum-mode.js');
  assert.match(source, /Number\.isFinite\(item\.minutes\)/);
  assert.match(source, /item\.minutes <= 180/);
  assert.match(source, /\.slice\(-MAX_SESSIONS\)/);
  assert.match(source, /Object\.hasOwn\(MODES, raw\.mode\)/);
  assert.match(source, /DURATIONS\.includes\(raw\.duration\)/);
  assert.match(source, /TARGETS\.includes\(raw\.target\)/);
});

test('momentum timer uses absolute end time and cleans up its interval', () => {
  const source = read('assets/js/principia-momentum-mode.js');
  assert.match(source, /endAt = Date\.now\(\) \+ remaining \* 1000/);
  assert.match(source, /window\.clearInterval\(timer\)/);
  assert.match(source, /function completeSession/);
  assert.match(source, /function resetTimer/);
});

test('momentum mode exposes aggregate progress without exposing private emotional context', () => {
  const source = read('assets/js/principia-momentum-mode.js');
  assert.match(source, /todayMinutes\(\)/);
  assert.match(source, /function streak\(\)/);
  assert.match(source, /stats: \(\) =>/);
  assert.doesNotMatch(source, /heartbreak|thất tình|người yêu|chia tay/i);
});
