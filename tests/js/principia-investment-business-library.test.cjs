"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const library = require("../../systems/investment-business-models.js");
const ui = require("../../assets/js/principia-investment-business-library.js");

test("all 141 investment and business models are discoverable by category", () => {
  assert.equal(library.MODEL_COUNT, 141);
  assert.deepEqual(library.getCategories().map(category => library.listModels(category).length), [30, 20, 25, 31, 20, 15]);
  assert.equal(ui.filterModels(library.MODELS).length, 141);
});

test("search finds Vietnamese and English model terms across all metadata", () => {
  assert.ok(ui.filterModels(library.MODELS, "all", "nhượng quyền").some(item => item.id.includes("franchise")));
  assert.ok(ui.filterModels(library.MODELS, "all", "subscription").length > 0);
  assert.deepEqual(ui.filterModels(library.MODELS, "all", "   "), library.MODELS);
});

test("category filter and pagination do not omit or duplicate models", () => {
  const strategy = ui.filterModels(library.MODELS, "investment_strategy");
  assert.equal(strategy.length, 30);
  const first = ui.getPage(strategy, 1);
  const second = ui.getPage(strategy, 2);
  assert.equal(first.length, 24);
  assert.equal(second.length, 6);
  assert.equal(new Set([...first, ...second].map(item => item.id)).size, 30);
});

test("invalid filter and pagination inputs fail explicitly", () => {
  assert.throws(() => ui.filterModels({}, "all", ""), TypeError);
  assert.throws(() => ui.filterModels(library.MODELS, 1, ""), TypeError);
  assert.throws(() => ui.getPage(library.MODELS, 0), RangeError);
  assert.throws(() => ui.getPage(library.MODELS, 1, 101), RangeError);
});
