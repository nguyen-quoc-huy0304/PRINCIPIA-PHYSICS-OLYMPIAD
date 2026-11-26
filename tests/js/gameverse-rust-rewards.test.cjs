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

test('Gameverse crafting validates and commits inventory through Rust',()=>{
 assert.match(game,/engine\.craftGameverseItem\(id,state\.materials,state\.crafted\)/);
 assert.match(game,/async function craft\(id\)/);
 assert.match(game,/principiaCraftingItems\.has\(id\)/);
 assert.match(game,/finally\{principiaCraftingItems\.delete\(id\);\}/);
 assert.doesNotMatch(game,/Object\.entries\(r\.cost\)\.every/);
 assert.match(bridge,/craftGameverseItem:\(recipeId,materials,crafted\)=>compute\('gameverseCraft'/);
 assert.match(wasm,/gameverse_craft_json/);
 assert.match(rust,/pub fn craft\(/);
});

test('Gameverse pet progression and reward updates are Rust-owned and serialized',()=>{
 assert.match(game,/engine\.gameversePetProgress\(state\.pet\.xp\+xpReward,state\.pet\.level\)/);
 assert.match(game,/let gameverseAwardQueue=Promise\.resolve\(\)/);
 assert.match(game,/state\.pet=\{\.\.\.state\.pet,xp:pet\.xp,level:pet\.level,form:pet\.form\}/);
 assert.doesNotMatch(game,/while\(state\.pet\.xp>=state\.pet\.level\*100\)/);
 assert.match(bridge,/gameversePetProgress:\(petXp,petLevel\)=>compute\('gameversePetProgress'/);
 assert.match(wasm,/gameverse_pet_progress_json/);
 assert.match(rust,/pub fn pet_progress\(pet_xp: u32, pet_level: u32\)/);
});
