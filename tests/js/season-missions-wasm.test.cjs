const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('weekly mission calculation delegates metrics and local date to Rust WASM', async () => {
  let call;
  const context = {
    PrincipiaWasmPhysics: {
      load: async () => ({
        season_missions_json(metrics, date) {
          call = { metrics: JSON.parse(metrics), date };
          return JSON.stringify([{ id: 'practice', value: 2, target: 3, progress: 67, complete: false, week: '2026-11-16' }]);
        }
      })
    }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('assets/js/principia-season-core.js', 'utf8'), context, {
    filename: 'principia-season-core.js'
  });
  await Promise.resolve();
  await Promise.resolve();
  const missions = context.PrincipiaSeasonCore.missions(
    { sessions: 2.9, questions: 15, notes: 2 },
    new Date('2026-11-22T12:00:00Z')
  );
  assert.equal(call.metrics.sessions, 2);
  assert.equal(call.metrics.questions, 15);
  assert.equal(call.date, '2026-11-22');
  assert.equal(missions[0].progress, 67);
});
