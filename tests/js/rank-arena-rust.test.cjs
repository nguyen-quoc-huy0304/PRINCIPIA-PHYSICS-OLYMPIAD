'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const arena = fs.readFileSync('assets/js/principia-rank-arena.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const rust = fs.readFileSync('rust/src/rank_arena.rs', 'utf8');

test('rank arena tier and match rules are owned by Rust', () => {
  assert.match(arena, /PrincipiaWasmPhysics\.rankArenaTier/);
  assert.match(arena, /PrincipiaWasmPhysics\.resolveRankArenaMatch/);
  assert.doesNotMatch(arena, /const rpChange = won \? 20 : -8/);
  assert.doesNotMatch(arena, /function currentTier\(rp\)\s*\{/);
});

test('rank arena mission eligibility is validated by Rust', () => {
  assert.match(arena, /PrincipiaWasmPhysics\.claimRankArenaMission/);
  assert.match(rust, /pub fn mission_reward/);
  assert.match(rust, /already_claimed/);
});

test('WASM adapter exposes each ranked arena operation', () => {
  assert.match(bridge, /rank_arena_tier_json/);
  assert.match(bridge, /rank_arena_resolve_json/);
  assert.match(bridge, /rank_arena_claim_json/);
  assert.match(bridge, /resolveRankArenaMatch:/);
  assert.match(bridge, /claimRankArenaMission:/);
});
