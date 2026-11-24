'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('Gemini API proxy verifies Firebase sessions and keeps provider secret server-side', () => {
  const source = read('functions/api/ai.js');
  assert.match(source, /accounts:lookup/);
  assert.match(source, /env\.GEMINI_API_KEY/);
  assert.match(source, /x-goog-api-key/);
  assert.match(source, /MAX_BODY/);
  assert.match(source, /MAX_MESSAGES/);
  assert.match(source, /Origin không hợp lệ/);
  assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{30,}/);
});

test('shared Gemini client uses same-origin API and Firebase ID token', () => {
  const source = read('assets/js/principia-google-ai.js');
  assert.match(source, /getIdToken\(\)/);
  assert.match(source, /fetch\('\/api\/ai'/);
  assert.match(source, /window\.principiaLocalAI=/);
  assert.match(source, /requestSubmit\(\)/);
  assert.match(source, /PrincipiaLearningScience\?\.directive/);
  assert.match(source, /learningSystem\(text, options\.system\|\|SYSTEM\)/);
  assert.doesNotMatch(source, /AIza[0-9A-Za-z_-]{30,}/);
});

test('chat and feature AI prompts route to shared Gemini provider', () => {
  const chat = read('assets/js/principia-chat-webview.js');
  const mastery = read('assets/js/principia-pro-mastery.js');
  const adaptive = read('assets/js/principia-adaptive-learning.js');
  const html = read('index.html');
  assert.match(chat, /window\.principiaAI\.ask/);
  assert.match(mastery, /principiaLocalAI\.open\(prompt\)/);
  assert.match(adaptive, /principiaLocalAI\.open\(prompt\)/);
  assert.match(read('assets/js/principia-study-methods.js'), /principiaStudyMethodAI/);
  assert.match(read('assets/js/principia-study-methods.js'), /Học cùng AI/);
  assert.match(html, /principia-google-ai\.js/);
  assert.ok(html.indexOf('principia-local-ai.js') < html.indexOf('principia-google-ai.js'));
});

test('Gemini setup documentation never requests committing API secrets', () => {
  const doc = read('docs/GEMINI_SETUP.md');
  assert.match(doc, /Cloudflare Pages/);
  assert.match(doc, /wrangler pages secret put GEMINI_API_KEY/);
  assert.match(doc, /Do not commit either value/);
});
