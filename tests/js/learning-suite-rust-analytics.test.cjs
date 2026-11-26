'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const rust = fs.readFileSync('rust/src/learning_analytics.rs', 'utf8');
const wasm = fs.readFileSync('rust/src/wasm_physics.rs', 'utf8');

test('weekly learning report delegates aggregation and recommendations to Rust', () => {
  assert.match(source, /async function weeklyLearningReport\(\)/);
  assert.match(source, /engine\.learningAnalytics\(\{today:localDateKey\(\),attempts,focusSessions:sessions,errors,tasks\}\)/);
  assert.match(bridge, /learningAnalytics:\(payload\)=>compute\('learningAnalytics',payload\)/);
  assert.match(wasm, /learning_analytics_summary_json/);
  assert.match(rust, /pub fn summarize\(input: &Value\)/);
});

test('weekly learning report does not calculate XP analytics or recommendations in JavaScript', () => {
  assert.doesNotMatch(source, /const total=attempts\.reduce\(/);
  assert.doesNotMatch(source, /const weak=Object\.entries\(topics\)/);
  assert.match(source, /Rust weekly analytics failed/);
  assert.match(source, /Báo cáo được tổng hợp bằng Rust\/WASM/);
});
