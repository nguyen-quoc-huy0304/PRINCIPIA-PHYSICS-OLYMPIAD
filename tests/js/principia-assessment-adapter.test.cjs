const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-assessment-adapter.js', 'utf8');

function loadAdapter(window = {}) {
  vm.runInNewContext(source, { window, String, Number, Array, Object, TypeError, RangeError, Error }, {
    filename: 'principia-assessment-adapter.js'
  });
  return window.PrincipiaAssessmentAdapter;
}

const question = { q: 'Newton II?', a: ['F=ma', 'p=mv'], correct: 0 };

test('delegates grading to Rust WASM and validates the result', async () => {
  let payload;
  const adapter = loadAdapter({
    PrincipiaWasmPhysics: {
      async gradeQuiz(value) {
        payload = value;
        return { details: [{ isCorrect: true }] };
      }
    }
  });
  const result = await adapter.gradeQuestion(question, 0, { id: 'lesson-1' });
  assert.equal(result.correct, true);
  assert.equal(result.backend, 'rust-wasm');
  assert.equal(payload.questions[0].correctIndex, 0);
  assert.equal(payload.answers[0].selectedOption, 0);
});

test('retains a deterministic offline fallback when WASM is unavailable', async () => {
  const adapter = loadAdapter({});
  const result = await adapter.gradeQuestion(question, 1);
  assert.equal(result.correct, false);
  assert.equal(result.backend, 'javascript-fallback');
});

test('rejects malformed questions and out-of-range answers', async () => {
  const adapter = loadAdapter({});
  await assert.rejects(adapter.gradeQuestion({ ...question, a: ['only one'] }, 0), /2 to 12 options/);
  await assert.rejects(adapter.gradeQuestion(question, 9), /Selected answer index is invalid/);
  await assert.rejects(adapter.gradeQuestion({ ...question, correct: 8 }, 0), /Correct answer index is invalid/);
});

test('falls back safely if Rust returns malformed data', async () => {
  const adapter = loadAdapter({
    PrincipiaWasmPhysics: { async gradeQuiz() { return { details: [] }; } }
  });
  const result = await adapter.gradeQuestion(question, 0);
  assert.equal(result.correct, true);
  assert.equal(result.backend, 'javascript-fallback');
  assert.match(result.reason, /invalid assessment/);
});
