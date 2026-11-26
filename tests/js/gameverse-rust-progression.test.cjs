'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/principia-game-worlds.js', 'utf8');
const progression = fs.readFileSync('rust/src/progression.rs', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');

test('Gameverse delegates XP level calculation to the shared Rust progression engine', () => {
  assert.match(source, /async function refreshLevel\(\)/);
  assert.match(source, /engine\.progression\(\{xp:state\.xp\}\)/);
  assert.match(source, /state\.level=level/);
  assert.doesNotMatch(source, /function xpLevel\(/);
  assert.doesNotMatch(source, /state\.level=xpLevel\(/);
  assert.match(bridge, /progression:\(metrics\)=>compute\('progressionSummary',metrics\)/);
  assert.match(progression, /pub fn level_progress\(xp: u64\)/);
});

test('Gameverse does not silently fall back to JavaScript level rules', () => {
  assert.match(source, /Rust progression engine is unavailable/);
  assert.match(source, /Rust level calculation failed/);
  assert.match(source, /Rust level initialization failed/);
});
