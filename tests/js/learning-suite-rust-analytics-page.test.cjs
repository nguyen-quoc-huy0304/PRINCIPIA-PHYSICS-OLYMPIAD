'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');

test('learning analytics page delegates totals, accuracy and topic aggregation to Rust', () => {
  assert.match(source, /async function analytics\(\)/);
  assert.match(source, /engine\.learningAnalytics\(\{today:localDateKey\(\),attempts,focusSessions:\[\],errors,tasks:\[\]\}\)/);
  assert.match(source, /summary\.accuracy/);
  assert.match(source, /summary\.questions/);
  assert.match(source, /summary\.weakTopics/);
  assert.doesNotMatch(source, /const total=a\.reduce\(/);
  assert.doesNotMatch(source, /const weakMap=\{\}/);
});
