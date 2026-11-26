'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const source = fs.readFileSync('assets/js/principia-learning-suite.js', 'utf8');

test('Olympic exam results are recorded only after Rust/WASM grading succeeds', () => {
  assert.match(source, /async function submitExam\(auto\)/);
  assert.match(source, /PrincipiaRustQuiz\.gradeExam\(qs,currentExam\.answers/);
  assert.match(source, /gradingEngine='rust-wasm'/);
  assert.match(source, /submission is not recorded/);
  assert.match(source, /saveExamDraft\(\)/);
  assert.doesNotMatch(source, /qs\.reduce\(\(sum,question,index\)=>sum\+\(currentExam\.answers/);
  assert.doesNotMatch(source, /using validated local fallback/);
});

test('Daily learning challenge grading uses Rust and prevents duplicate submissions', () => {
  assert.match(source, /async function dailyAnswer\(i\)/);
  assert.match(source, /grader\.gradeExam\(\[\{q:d\.q,a:d\.a,correct:d\.correct\}\]/);
  assert.match(source, /d\.submitting=true/);
  assert.match(source, /d\.submitting=false/);
  assert.match(source, /Rust daily challenge grading failed/);
});
