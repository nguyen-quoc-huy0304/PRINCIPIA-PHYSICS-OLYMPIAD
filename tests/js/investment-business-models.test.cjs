"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const library = require("../../systems/investment-business-models.js");

test("library has over 100 unique entries", () => {
  assert.ok(library.MODEL_COUNT > 100);
  assert.equal(new Set(library.MODELS.map(x => x.id)).size, library.MODEL_COUNT);
});
test("each entry includes description, metrics and risks", () => {
  for (const item of library.MODELS) {
    assert.ok(item.description.length > 25);
    assert.ok(item.evaluationMetrics.length > 0);
    assert.ok(item.keyRisks.length > 0);
    assert.equal(library.getModel(item.id), item);
  }
});
test("all six knowledge categories are represented", () => {
  assert.deepEqual(library.getCategories(), [
    "investment_strategy","asset_classes","valuation_models",
    "business_revenue","business_operating","funding_capital"
  ]);
});
test("search and category filtering work", () => {
  assert.equal(library.listModels("investment_strategy").length, 30);
  assert.ok(library.searchModels("cash flow").length > 0);
  assert.deepEqual(library.searchModels("  "), []);
});
test("invalid query types throw", () => {
  assert.throws(() => library.listModels(5), TypeError);
  assert.throws(() => library.getModel(null), TypeError);
  assert.throws(() => library.searchModels({}), TypeError);
});
