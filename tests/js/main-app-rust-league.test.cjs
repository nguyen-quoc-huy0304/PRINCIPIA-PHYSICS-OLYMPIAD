'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('assets/js/app-part-02.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const wasm = fs.readFileSync('rust/src/wasm_physics.rs', 'utf8');
const league = fs.readFileSync('rust/src/game_league.rs', 'utf8');

test('weekly AI league opponent generation is Rust-owned and cached', () => {
  assert.match(app, /async function loadPrincipiaLeagueBots\(week\)/);
  assert.match(app, /engine\.gameLeague\(\{operation:'bots',week\}\)/);
  assert.match(app, /principiaLeagueBotsCache\?\.week===week/);
  assert.match(bridge, /case 'gameLeague': return JSON\.parse\(wasm\.game_league_json/);
  assert.match(wasm, /"bots" => crate::game_league::bots\(week\)/);
  assert.match(league, /pub fn bots\(week: &str\)/);
});

test('AI league match handler awaits validated Rust result before persistence', () => {
  const start = app.indexOf('async function simulateAiMatch()');
  const end = app.indexOf('\nfunction progressPage()', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const handler = app.slice(start, end);
  assert.match(handler, /await engine\.gameLeague\(/);
  assert.match(handler, /window\.crypto\.getRandomValues\(random\)/);
  assert.match(handler, /state\.points=result\.points/);
  assert.match(handler, /Rust AI league match failed/);
  assert.doesNotMatch(handler, /Math\.random\(\)/);
});
