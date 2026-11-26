'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const source = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');

test('learning suite uses unbiased cryptographic random selection', () => {
  assert.match(source, /function secureRandomIndex\(length\)/);
  assert.match(source, /buffer\[0\]>=limit/);
  assert.match(source, /secureRandomIndex\(qs\.length-1\)/);
  assert.doesNotMatch(source, /function secureShuffle\(items\)/);
  assert.match(source, /function secureId\(prefix\)/);
  assert.doesNotMatch(source, /Math\.random\(\)/);
  assert.doesNotMatch(source, /\.sort\(\(\)=>Math\.random\(\)-\.5\)/);
});
