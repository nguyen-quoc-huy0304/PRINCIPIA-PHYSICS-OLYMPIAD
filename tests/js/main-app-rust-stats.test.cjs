'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const app = fs.readFileSync('assets/js/app-part-02.js', 'utf8');

test('main app stats modal awaits Rust progression asynchronously', () => {
  assert.match(app, /async function openGameStats\(\)\s*\{/);
  assert.match(app, /const summary=await engine\.progression\(\{xp\}\)/);
});
