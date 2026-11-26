'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');

test('learner thinking profile uses Rust analytics instead of local score aggregation', () => {
  assert.match(source, /async function thinkingProfile\(\)/);
  assert.match(source, /engine\.learningAnalytics\(\{today:localDateKey\(\),attempts,focusSessions:\[\],errors,tasks:\[\]\}\)/);
  assert.match(source, /summary\.weakTopics/);
  assert.match(source, /summary\.accuracy/);
  assert.doesNotMatch(source, /const total=attempts\.reduce\(/);
  assert.doesNotMatch(source, /const topics=\{\};errors\.forEach/);
});
