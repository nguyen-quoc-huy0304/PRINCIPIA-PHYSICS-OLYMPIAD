'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const rust = fs.readFileSync('rust/src/learning.rs', 'utf8');

test('learning suite delegates spaced-repetition interval calculation to Rust', () => {
  assert.match(source, /async function rateReview\(r\)/);
  assert.match(source, /engine\.scheduleReview\(quality,intervalDays,easeFactor\)/);
  assert.match(source, /quality=\[1,3,4,5\]\[r\]/);
  assert.match(source, /easeFactor:schedule\.easeFactor/);
  assert.match(bridge, /scheduleReview:\(quality,previousIntervalDays,easeFactor\)=>compute\('reviewSchedule'/);
  assert.match(rust, /pub fn schedule_review\(/);
  assert.doesNotMatch(source, /const days=\[1,Math\.max\(2,previous\|\|2\)/);
});

test('learning suite does not persist a review schedule when Rust is unavailable', () => {
  assert.match(source, /Rust spaced-repetition engine is unavailable/);
  assert.match(source, /Thẻ chưa được cập nhật/);
});
