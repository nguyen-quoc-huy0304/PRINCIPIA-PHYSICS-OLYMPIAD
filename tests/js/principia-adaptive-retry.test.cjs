'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const read = file => fs.readFileSync(path.resolve(__dirname, '../..', file), 'utf8');

test('Gemini retry assessment is explicit, bounded and does not transmit identity fields', () => {
  const assessor = read('assets/js/principia-retry-assessor.js');
  const adaptive = read('assets/js/principia-adaptive-learning.js');
  assert.match(assessor, /MAX_QUESTION = 2200/);
  assert.match(assessor, /MAX_ANSWER = 2200/);
  assert.match(assessor, /window\.principiaAI\?\.ask/);
  assert.match(adaptive, /Đánh giá lời giải bằng Gemini/);
  assert.match(assessor, /question,\s*referenceAnswer:\s*expected,\s*learnerAttempt:\s*attempt/);
  assert.doesNotMatch(assessor, /\b(?:userId|uid|email|displayName)\s*:/i);
  assert.doesNotMatch(adaptive, /ppaVerified/);
});

test('spaced-repetition interval advances only after a passing assessment', () => {
  const adaptive = read('assets/js/principia-adaptive-learning.js');
  assert.match(adaptive, /if \(!result\.passed\)/);
  assert.match(adaptive, /const days = \[1, 3, 7, 14, 30\]/);
  assert.match(adaptive, /state\.completed\.unshift/);
  assert.match(adaptive, /principia:adaptive-retry-assessed/);
});

test('learning orchestrator adapts method selection to energy, confidence and retry outcomes', () => {
  const orchestrator = read('assets/js/principia-learning-orchestrator.js');
  assert.match(orchestrator, /const energy = \[1, 2, 3\]/);
  assert.match(orchestrator, /const confidence = Number\.isFinite/);
  assert.match(orchestrator, /function recordRetryAssessment/);
  assert.match(orchestrator, /principia:adaptive-retry-assessed/);
});

test('server uses the current free-tier Flash-Lite model and retries temporary upstream failures', () => {
  const api = read('functions/api/ai.js');
  assert.match(api, /gemini-3\.5-flash-lite/);
  assert.match(api, /attempt < 3/);
  assert.match(api, /upstream\.status === 429/);
  assert.doesNotMatch(api, /user: user\.uid/);
});

test('browser loads the retry assessor after Gemini client and refreshes changed module caches', () => {
  const html = read('index.html');
  assert.ok(html.indexOf('principia-google-ai.js') < html.indexOf('principia-retry-assessor.js'));
  assert.ok(html.indexOf('principia-retry-assessor.js') < html.indexOf('principia-study-pathways.js'));
  assert.match(html, /principia-adaptive-learning\.js\?v=20261124-gemini-retry3/);
  assert.match(html, /principia-learning-orchestrator\.js\?v=20261124-invisible-learning5/);
});
