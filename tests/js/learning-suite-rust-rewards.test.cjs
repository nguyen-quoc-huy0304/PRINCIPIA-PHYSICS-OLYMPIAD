'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const suite = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');
const rewards = fs.readFileSync('rust/src/experience_rewards.rs', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');

test('learning suite obtains milestone XP amounts from Rust', () => {
  assert.match(suite, /async function awardLearningExperience\(activity\)/);
  assert.match(suite, /engine\.experienceReward\(activity\)/);
  assert.match(suite, /awardLearningExperience\('daily-challenge-correct'\)/);
  assert.match(suite, /awardLearningExperience\('learning-journey-completed'\)/);
  assert.match(suite, /awardLearningExperience\('learning-quest-completed'\)/);
  assert.match(rewards, /"learning-journey-completed" => Ok\(10\)/);
  assert.match(rewards, /"learning-quest-completed" => Ok\(15\)/);
  assert.match(bridge, /experienceReward:activity=>compute\('experienceReward'/);
});

test('daily challenge and quest rewards are not claimed when Rust validation fails', () => {
  assert.match(suite, /Rust journey reward failed/);
  assert.match(suite, /Rust quest reward failed/);
  assert.match(suite, /Nhiệm vụ chưa được nhận/);
});
