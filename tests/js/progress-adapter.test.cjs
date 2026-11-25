const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function loadAdapter(wasm) {
  const context = { PrincipiaWasmPhysics: { load: async () => wasm } };
  vm.runInNewContext(fs.readFileSync('assets/js/principia-progress-adapter.js', 'utf8'), context, {
    filename: 'principia-progress-adapter.js'
  });
  return context.PrincipiaProgressAdapter;
}

const progress = {
  experience: 40, completedLessons: 2, studyStreakDays: 3,
  lastActivityDay: '2026-11-24'
};

test('delegates custom XP and streak updates to Rust', async () => {
  let args;
  const adapter = loadAdapter({
    progress_award_custom_json(...values) {
      args = values;
      return JSON.stringify({
        experience: 50, completedLessons: 3, studyStreakDays: 4,
        lastActivityDay: '2026-11-25', level: 1, experienceIntoLevel: 50
      });
    }
  });
  const result = await adapter.record(progress, 'lesson', '2026-11-25', 10);
  assert.equal(result.experience, 50);
  assert.equal(result.completedLessons, 3);
  assert.equal(args[1], 'lesson');
  assert.equal(args[3], 10);
});

test('rejects invalid progress input before invoking WASM', async () => {
  let called = false;
  const adapter = loadAdapter({
    progress_award_custom_json() { called = true; return '{}'; }
  });
  await assert.rejects(adapter.record(progress, 'lesson', '2026-11-25', -1), /XP reward/);
  await assert.rejects(adapter.record({ ...progress, experience: -1 }, 'quiz', '2026-11-25', 15), /Invalid progress field/);
  assert.equal(called, false);
});

test('rejects malformed Rust progress output', async () => {
  const adapter = loadAdapter({ progress_award_custom_json() { return '{}'; } });
  await assert.rejects(adapter.record(progress, 'quiz', '2026-11-25', 15), /invalid progress state/);
});
