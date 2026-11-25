const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadGlobal(path, globals = {}) {
  const context = { ...globals };
  vm.runInNewContext(fs.readFileSync(path, 'utf8'), context, { filename: path });
  return context;
}

test('research statistics use Rust WASM after the shared module loads', async () => {
  let called = false;
  const context = loadGlobal('assets/js/principia-research-core.js', {
    PrincipiaWasmPhysics: {
      load: async () => ({
        research_summary_json() {
          called = true;
          return JSON.stringify({
            count: 2, mean: 3, standardDeviation: 1,
            standardError: 0.7071067811865476, slope: 2, intercept: 1
          });
        }
      })
    }
  });
  await Promise.resolve();
  await Promise.resolve();
  const summary = context.PrincipiaResearchCore.summarize([{ x: 0, y: 2 }, { x: 1, y: 4 }]);
  assert.equal(called, true);
  assert.equal(summary.slope, 2);
  assert.equal(summary.mean, 3);
});

test('level validation uses Rust WASM after the shared module loads', async () => {
  const calls = [];
  const context = loadGlobal('assets/js/principia-level-studio-core.js', {
    PrincipiaWasmPhysics: {
      load: async () => ({
        level_validate_question_json(raw) {
          calls.push('question');
          return JSON.stringify(JSON.parse(raw));
        },
        level_validate_json(raw) {
          calls.push('level');
          return JSON.stringify(JSON.parse(raw));
        }
      })
    }
  });
  await Promise.resolve();
  await Promise.resolve();
  const core = context.PrincipiaLevelStudioCore;
  const question = { prompt: 'Lực?', choices: ['N', 'J'], answer: 0 };
  assert.equal(core.validateQuestion(question).answer, 0);
  const level = core.validateLevel({
    id: 'native-1', title: 'Cơ học', description: '',
    questions: [question], updatedAt: '2026-11-25'
  });
  assert.equal(level.id, 'native-1');
  assert.deepEqual(calls, ['question', 'level']);
});
