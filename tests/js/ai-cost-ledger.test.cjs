"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createAiCostLedger } = require("../../systems/ai-cost-ledger");

test("cost ledger totals usage and budget warnings", () => {
  const ledger = createAiCostLedger({ budget: 2, warnAt: 0.5 });
  const result = ledger.record({ modelId: "test-model", task: "chat", inputTokens: 1000000, outputTokens: 500000, inputCostPerMillion: 1, outputCostPerMillion: 2 });
  assert.equal(result.entry.cost, 2);
  assert.equal(result.overBudget, false);
  assert.equal(result.warning, true);
  assert.equal(ledger.report().totalCost, 2);
});
test("ledger rejects invalid costs and resets", () => {
  const ledger = createAiCostLedger({ budget: 5 });
  assert.throws(() => ledger.record({ modelId: "m", inputTokens: -1 }), /finite non-negative/);
  ledger.record({ modelId: "m", fixedCost: 1 });
  assert.equal(ledger.reset().totalCost, 0);
});
