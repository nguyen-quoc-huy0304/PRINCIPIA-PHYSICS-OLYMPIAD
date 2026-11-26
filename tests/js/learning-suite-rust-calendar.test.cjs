'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const suite = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');
const progression = fs.readFileSync('assets/js/principia-progression-core.js', 'utf8');

test('Learning Suite awaits Rust activity calendar before persisting study days', () => {
  assert.match(suite, /function markStudyDay\(\)[\s\S]*?api\.recordActivity\(state\.studyDays\|\|\[\],new Date\(\)\)\.then\(days=>/);
  assert.match(suite, /if\(!Array\.isArray\(days\)\)throw new TypeError/);
  assert.doesNotMatch(suite, /state\.studyDays=api\.recordActivity/);
  assert.match(progression, /async function recordActivity/);
});

test('Learning Suite handles missing or failed Rust activity updates without storing a Promise', () => {
  assert.match(suite, /Rust activity calendar is unavailable/);
  assert.match(suite, /Rust activity calendar update failed/);
  assert.match(suite, /return null\}\)/);
});
