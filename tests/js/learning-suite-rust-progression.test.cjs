'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');

test('learning-suite progression awaits Rust streak and progression summaries', () => {
  assert.match(source, /st=await api\.streak\(state\.studyDays\|\|\[\],new Date\(\)\)/);
  assert.match(source, /summary=await api\.summarizeWithRust\(currentXP\(\)/);
  assert.match(source, /const lv=summary\.level,achievements=summary\.achievements/);
  assert.match(source, /Bộ máy tiến trình: rust-wasm/);
});

test('learning-suite progression does not fabricate JavaScript fallback levels or achievements', () => {
  assert.doesNotMatch(source, /api\.level\(currentXP\(\)\)/);
  assert.doesNotMatch(source, /api\.achievements\(/);
  assert.match(source, /Không thể tải cấp độ, chuỗi ngày và thành tựu từ lõi Rust\/WASM/);
});
