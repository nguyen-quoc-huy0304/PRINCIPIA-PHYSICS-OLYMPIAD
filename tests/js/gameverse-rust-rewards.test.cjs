'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const game=fs.readFileSync('assets/js/principia-game-worlds.js','utf8');
const bridge=fs.readFileSync('assets/js/principia-wasm-physics.js','utf8');
const rust=fs.readFileSync('rust/src/gameverse.rs','utf8');
const wasm=fs.readFileSync('rust/src/wasm_physics.rs','utf8');

test('Gameverse XP, coins, pass threshold and ranked rating are computed by Rust',()=>{
 assert.match(game,/engine\.gameverseQuizReward\(score,n,mode,state\.rank\.rating\)/);
 assert.match(game,/award\(reward\.xp,reward\.coins\)/);
 assert.match(game,/state\.rank\.rating=reward\.rating/);
 assert.doesNotMatch(game,/score\*35\+20|score\*25|state\.rank\.rating\+=24\+score\*5/);
 assert.match(bridge,/gameverseQuizReward:\(correct,total,mode,rating\)=>compute\('gameverseQuizReward'/);
 assert.match(wasm,/gameverse_quiz_reward_json/);
 assert.match(rust,/pub fn quiz_reward/);
});

test('Rust Gameverse rewards validate input and clamp ranked rating',()=>{
 assert.match(rust,/total > 200/);
 assert.match(rust,/rating > 1_000_000/);
 assert.match(rust,/saturating_add\(rank_delta as u64\)\.min\(1_000_000\)/);
 assert.match(rust,/saturating_sub\(rank_delta\.unsigned_abs\(\)\)/);
});
