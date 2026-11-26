'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/app-part-02.js', 'utf8');

test('main app uses cryptographically secure randomness for IDs and character poses', () => {
  assert.match(source, /const uid=\(\)=>\{if\(!globalThis\.crypto\?\.getRandomValues\)/);
  assert.match(source, /globalThis\.crypto\.getRandomValues\(bytes\)/);
  assert.match(source, /globalThis\.crypto\.getRandomValues\(random\)/);
  assert.doesNotMatch(source, /Math\.random\(\)/);
});
