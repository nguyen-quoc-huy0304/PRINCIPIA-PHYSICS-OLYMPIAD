'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('assets/js/app-part-02.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const rust = fs.readFileSync('rust/src/progress.rs', 'utf8');

test('main app delegates daily streak date arithmetic to Rust progress recording', () => {
  assert.match(app, /async function dailyReward\(\)/);
  assert.match(app, /engine\.recordStudyDay\(current,today\)/);
  assert.match(app, /studyStreakDays/);
  assert.doesNotMatch(app, /let yesterday=new Date\(Date\.now\(\)-86400000\)/);
  assert.match(bridge, /recordStudyDay:\(progress,day\)=>compute\('recordStudyDay'/);
  assert.match(rust, /Some\(previous\) if current==previous\+1/);
});

test('main app serializes concurrent daily streak writes and validates Rust output', () => {
  assert.match(app, /if\(dailyRewardPromise\)return dailyRewardPromise/);
  assert.match(app, /result\.lastActivityDay!==today/);
  assert.match(app, /dailyRewardPromise=null/);
  assert.match(app, /Rust daily streak update failed/);
});
