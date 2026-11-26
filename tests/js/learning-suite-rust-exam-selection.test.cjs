'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const suite = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');
const bridge = fs.readFileSync('assets/js/principia-wasm-physics.js', 'utf8');
const wasm = fs.readFileSync('rust/src/wasm_physics.rs', 'utf8');
const rust = fs.readFileSync('rust/src/quiz.rs', 'utf8');

test('Olympic exam question and answer selection is owned by Rust', () => {
  assert.match(suite, /async function selectRustExamQuestions\(source,count\)/);
  assert.match(suite, /engine\.selectExamQuestions\(source,count,seed\)/);
  assert.match(suite, /async function startExam\(\)/);
  assert.match(suite, /async function retryExamMistakes\(\)/);
  assert.match(suite, /async function startFavoritePractice\(\)/);
  assert.match(bridge, /selectExamQuestions:\(questions,count,seed\)=>compute\('selectExamQuestions'/);
  assert.match(wasm, /pub fn quiz_select_exam_json\(/);
  assert.match(rust, /pub fn select_exam_questions\(/);
});

test('learning suite has no JavaScript exam answer shuffle fallback', () => {
  assert.doesNotMatch(suite, /function shuffledQuestion\(/);
  assert.doesNotMatch(suite, /source\.slice\(\)\.sort\(\(\)=>Math\.random/);
  assert.doesNotMatch(suite, /choices\[i\],choices\[j\]/);
});
