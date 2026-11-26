'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const app = fs.readFileSync('assets/js/app-part-02.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const rust = fs.readFileSync('rust/src/experience_rewards.rs', 'utf8');
const wasm = fs.readFileSync('rust/src/wasm_physics.rs', 'utf8');

test('main app delegates all learning XP reward amounts to Rust', () => {
  assert.match(app, /async function awardExperienceFromRust\(activity/);
  assert.match(app, /engine\.experienceReward\(activity\)/);
  for (const activity of ['focus-session','lesson-completed','lesson-mastered','lesson-review','ai-transcript','assignment-submitted','ai-quiz-generated','inline-quiz-correct']) {
    assert.ok(app.includes("'" + activity + "'"), 'missing Rust reward activity: ' + activity);
    assert.ok(rust.includes('"' + activity + '"'), 'missing Rust reward rule: ' + activity);
  }
  assert.doesNotMatch(app, /xp\s*\+=\s*(10|15|20|30|50)/);
  assert.match(bridge, /experienceReward:activity=>compute\('experienceReward'/);
  assert.match(wasm, /experience_reward\(activity: &str\)/);
});

test('learning XP updates are validated and deduplicated for lesson completion', () => {
  assert.match(app, /principiaPendingExperienceAwards\.has\(operationKey\)/);
  assert.match(app, /Number\.isInteger\(amount\)/);
  assert.match(app, /lesson-mastered','lesson:'/);
  assert.match(app, /Rust lesson reward failed/);
});
