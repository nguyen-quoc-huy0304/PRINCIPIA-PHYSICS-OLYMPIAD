const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

test('Gameverse delegates economy state transitions to Rust WASM', async () => {
  const writes = [];
  const actions = [];
  const document = { readyState: 'loading', addEventListener() {} };
  const context = {
    document,
    localStorage: {
      getItem() { return null; },
      setItem(key, value) { writes.push({ key, value }); }
    },
    console,
    setTimeout,
    clearTimeout,
    PrincipiaWasmPhysics: {
      load: async () => ({
        gameverse_apply_json(stateJson, actionJson) {
          const state = JSON.parse(stateJson);
          const action = JSON.parse(actionJson);
          actions.push(action);
          if (action.type === 'award') {
            state.xp += action.xp;
            state.coins += action.coins;
            state.level = 1 + Math.floor(Math.sqrt(state.xp / 120));
            state.season.xp += action.xp;
            state.pet.xp += action.xp;
          }
          return JSON.stringify({ state, result: { ok: true } });
        }
      })
    }
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync('assets/js/principia-game-worlds.js', 'utf8'), context, {
    filename: 'principia-game-worlds.js'
  });
  await Promise.resolve();
  await Promise.resolve();
  context.PrincipiaGameWorlds.award(30, 12);
  const state = context.PrincipiaGameWorlds.getState();
  assert.equal(actions[0].type, 'award');
  assert.equal(state.xp, 30);
  assert.equal(state.coins, 12);
  assert.equal(state.season.xp, 30);
  assert.equal(writes.length, 1);
});
