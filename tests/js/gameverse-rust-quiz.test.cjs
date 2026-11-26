'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/principia-game-worlds.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');

test('Gameverse sends quiz attempts to the Rust assessment engine', () => {
  assert.match(source, /async function finishQuiz\(\)/);
  assert.match(source, /engine\.gradeQuiz\(\{id:'gameverse-/);
  assert.match(source, /correctIndex:q\.c/);
  assert.match(source, /selectedOption\}\)\)/);
  assert.doesNotMatch(source, /quizState\.score/);
  assert.match(bridge, /gradeQuiz:\(payload\)=>compute\('gradeQuiz',payload\)/);
});

test('Gameverse does not award results when Rust grading fails', () => {
  assert.match(source, /Kết quả chưa được ghi nhận/);
  assert.match(source, /Rust quiz grading failed/);
  assert.match(source, /data-retry-grade/);
  assert.match(source, /engine\.gameverseQuizReward\(score,n,mode,state\.rank\.rating\)/);
  assert.match(source, /reward\.passed/);
});

test('Gameverse question sampling and shuffle are delegated to Rust',()=>{
  assert.match(source,/engine\.gameverseSelectQuiz\(QUESTIONS,mode,seed\)/);
  assert.match(source,/gameverseQuizStartPending/);
  assert.doesNotMatch(source,/\.sort\(\(\)=>Math\.random\(\)-\.5\)/);
  assert.match(bridge,/gameverseSelectQuiz:\(questions,mode,seed\)=>compute\('gameverseQuizSelect'/);
  assert.match(wasm,/gameverse_quiz_select_json/);
  assert.match(rust,/pub fn select_quiz_questions\(/);
});
