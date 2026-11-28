"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { calculate, validate } = require("../../assets/js/principia-income-planner.js");

test("calculates revenue, costs, net income and break-even", () => {
  const result = calculate({ capital: 1000000, price: 100000, volume: 20, variable: 40000, fixed: 500000, hours: 80 });
  assert.equal(result.revenue, 2000000);
  assert.equal(result.variableCosts, 800000);
  assert.equal(result.net, 700000);
  assert.equal(result.breakEvenUnits, 9);
  assert.equal(result.hourlyIncome, 8750);
  assert.equal(result.paybackMonths, 1000000 / 700000);
});

test("handles zero revenue and zero contribution without division errors", () => {
  const result = calculate({ capital: 0, price: 0, volume: 0, variable: 0, fixed: 0, hours: 0 });
  assert.equal(result.margin, null);
  assert.equal(result.monthlyRoi, null);
  assert.equal(result.hourlyIncome, null);
  assert.equal(result.breakEvenUnits, null);
  assert.equal(result.paybackMonths, null);
});

test("negative net income and non-positive unit contribution are represented safely", () => {
  const result = calculate({ capital: 100, price: 10, volume: 2, variable: 12, fixed: 5, hours: 2 });
  assert.equal(result.net, -9);
  assert.equal(result.breakEvenUnits, null);
  assert.equal(result.paybackMonths, null);
});

test("rejects non-finite, negative and out-of-range inputs", () => {
  assert.throws(() => validate({ capital: -1, price: 0, volume: 0, variable: 0, fixed: 0, hours: 0 }), RangeError);
  assert.throws(() => validate({ capital: 0, price: Infinity, volume: 0, variable: 0, fixed: 0, hours: 0 }), RangeError);
  assert.throws(() => validate(null), TypeError);
});
