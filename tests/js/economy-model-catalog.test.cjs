"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { MODELS, getModel, simulateModel } = require("../../systems/economy-model-catalog");

test("catalog has exactly 70 unique simulation models grouped 27/18/12/13", () => {
  assert.equal(MODELS.length, 70);
  assert.equal(new Set(MODELS.map(m => m.id)).size, 70);
  const counts = Object.values(MODELS.reduce((acc, m) => (acc[m.group] = (acc[m.group] || 0) + 1, acc), {}));
  assert.deepEqual(counts.sort((a,b)=>a-b), [12,13,18,27]);
  assert.ok(MODELS.every(m => m.simulationOnly && m.currency === "VIRTUAL" && !m.leverageAllowed));
});
test("simulation is deterministic for same seed and validates inputs", () => {
  const args = { modelId: "spot_trading", capital: 1000, periods: 10, seed: 123 };
  assert.deepEqual(simulateModel(args), simulateModel(args));
  assert.equal(getModel("not_a_model"), null);
  assert.throws(() => simulateModel({ ...args, capital: -10 }), /capital/);
  assert.throws(() => simulateModel({ ...args, periods: 0 }), /periods/);
});
