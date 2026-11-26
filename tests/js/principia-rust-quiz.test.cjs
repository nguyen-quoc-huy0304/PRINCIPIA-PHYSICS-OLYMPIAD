'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-rust-quiz.js', 'utf8');
const calls = [];
const rustGrade = {
  correctCount: 1,
  percent: 50,
  passed: false,
  earnedPoints: 1,
  totalPoints: 2,
  unansweredCount: 1
};
const context = {
  Number, Object, Array, TypeError, RangeError, Error,
  PrincipiaWasmPhysics: {
    async gradeQuiz(payload) {
      calls.push(payload);
      return rustGrade;
    }
  }
};
context.window = context;
vm.runInNewContext(source, context, { filename: 'principia-rust-quiz.js' });

test('legacy Olympiad questions are mapped into the Rust grading contract', async () => {
  const result = await context.PrincipiaRustQuiz.gradeExam([
    { q: 'Q1', a: ['A', 'B'], correct: 1 },
    { q: 'Q2', a: ['C', 'D'], correct: 0 }
  ], { 0: 1 }, { id: 'exam-1', title: 'Mechanics' });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].questions.length, 2);
  assert.equal(calls[0].questions[0].prompt, 'Q1');
  assert.equal(calls[0].questions[0].correctIndex, 1);
  assert.equal(calls[0].answers[0].selectedOption, 1);
  assert.equal(calls[0].answers[1].selectedOption, null);
  assert.equal(calls[0].passPercent, 60);
  assert.equal(result.correctCount, 1);
  assert.equal(result.engine, 'rust-wasm');
});

test('adapter rejects invalid question and answer indices before WASM', async () => {
  await assert.rejects(
    context.PrincipiaRustQuiz.gradeExam([{ q: 'Q', a: ['A'], correct: 0 }], {}),
    /Invalid question/
  );
  await assert.rejects(
    context.PrincipiaRustQuiz.gradeExam([{ q: 'Q', a: ['A', 'B'], correct: 0 }], { 0: 2 }),
    /Invalid selected answer/
  );
  assert.equal(calls.length, 0);
});

test('adapter rejects malformed Rust grading results', async () => {
  const original = context.PrincipiaWasmPhysics.gradeQuiz;
  context.PrincipiaWasmPhysics.gradeQuiz = async () => ({ correctCount: 4, percent: 120 });
  try {
    await assert.rejects(
      context.PrincipiaRustQuiz.gradeExam([{ q: 'Q', a: ['A', 'B'], correct: 0 }], {}),
      /invalid result/
    );
  } finally {
    context.PrincipiaWasmPhysics.gradeQuiz = original;
  }
});

test('adapter reports missing Rust WASM grader explicitly', async () => {
  const original = context.PrincipiaWasmPhysics;
  delete context.PrincipiaWasmPhysics;
  try {
    await assert.rejects(
      context.PrincipiaRustQuiz.gradeExam([{ q: 'Q', a: ['A', 'B'], correct: 0 }], {}),
      /unavailable/
    );
  } finally {
    context.PrincipiaWasmPhysics = original;
  }
});
