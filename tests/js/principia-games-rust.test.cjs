'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/principia-games.js', 'utf8');
const rust = fs.readFileSync('rust/src/game.rs', 'utf8');
const challenge = fs.readFileSync('rust/src/game_challenge.rs', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');

test('projectile match scoring is delegated to Rust/WASM without a JS fallback', () => {
  assert.match(source, /compute\('scoreProjectile'/);
  assert.match(source, /lượt chơi chưa được ghi nhận/);
  assert.doesNotMatch(source, /state\.backend='JavaScript fallback'/);
  assert.match(rust, /pub fn score_projectile/);
});

test('new physics challenges require the Rust challenge generator', () => {
  assert.match(source, /generate_game_challenge_json/);
  assert.match(source, /Không thể tạo thử thách bằng Rust\/WASM/);
  assert.doesNotMatch(source, /JavaScript challenge fallback|Math\\.random\\(\\)/);
  assert.match(source, /stateRestored/);
  assert.match(source, /principiaNewGameChallenge/);
  assert.match(challenge, /pub fn generate_challenge/);
  assert.match(bridge, /gameChallenge/);
});
