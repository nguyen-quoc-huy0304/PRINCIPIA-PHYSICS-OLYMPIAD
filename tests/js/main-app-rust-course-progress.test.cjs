'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('assets/js/app-part-02.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const rust = fs.readFileSync('rust/src/progression.rs', 'utf8');
const wasm = fs.readFileSync('rust/src/wasm_physics.rs', 'utf8');

test('main learning progress percentage is calculated by Rust/WASM', () => {
  assert.match(app, /engine\.courseProgress\(done,total\)/);
  assert.match(app, /requestPrincipiaCourseProgress\(done,total\)/);
  assert.doesNotMatch(app, /Math\.round\(completed\.length\/total\*100\)/);
  assert.match(bridge, /courseProgress:\(completed,total\)=>compute\('courseProgress'/);
  assert.match(wasm, /course_completion_json\(completed: u64, total: u64\)/);
  assert.match(rust, /pub fn course_completion\(completed: u64, total: u64\)/);
});

test('main progress page deduplicates concurrent requests and validates Rust output', () => {
  assert.match(app, /principiaCourseProgressRequest\?\.key===key/);
  assert.match(app, /result\?\.completed!==done/);
  assert.match(app, /result\.percent>100/);
  assert.match(app, /Rust course progress calculation failed/);
});
