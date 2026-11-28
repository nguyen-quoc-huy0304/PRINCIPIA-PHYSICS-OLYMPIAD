"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { validate, calculate, simulateStream } = require("../../assets/js/principia-income-comparison.js");

const stream = overrides => ({
  name: "Freelance", capital: 1000000, revenue: 500000, variableCost: 100000,
  fixedCost: 100000, revenueGrowthPct: 0, costInflationPct: 0, taxRatePct: 10,
  downsideShockPct: 20, upsideBoostPct: 20, ...overrides
});

test("forecasts monthly net cash flow, taxes, ROI and payback", () => {
  const result = calculate({ months: 12, streams: [stream()] });
  const base = result.results[0].base;
  assert.equal(base.totalRevenue, 6000000);
  assert.equal(base.totalVariableCost, 1200000);
  assert.equal(base.totalFixedCost, 1200000);
  assert.equal(base.totalTax, 360000);
  assert.equal(base.netAfterCapital, 2240000);
  assert.equal(base.paybackMonth, 3);
  assert.equal(base.roiPct, 224);
});

test("downside and upside scenarios apply revenue shocks independently", () => {
  const result = calculate({ months: 1, streams: [stream()] }).results[0];
  assert.equal(result.downside.totalRevenue, 400000);
  assert.equal(result.base.totalRevenue, 500000);
  assert.equal(result.upside.totalRevenue, 600000);
  assert.ok(result.downside.netAfterCapital < result.base.netAfterCapital);
  assert.ok(result.upside.netAfterCapital > result.base.netAfterCapital);
});

test("ranking is sorted by base-case cash after initial capital", () => {
  const result = calculate({
    months: 6,
    streams: [stream(), stream({ name: "Consulting", revenue: 900000 })]
  });
  assert.deepEqual(result.ranking, ["Consulting", "Freelance"]);
});

test("validates stream count, unique names, periods and numeric boundaries", () => {
  assert.throws(() => validate({ months: 0, streams: [stream()] }), RangeError);
  assert.throws(() => validate({ months: 61, streams: [stream()] }), RangeError);
  assert.throws(() => validate({ months: 12, streams: [] }), RangeError);
  assert.throws(() => validate({ months: 12, streams: Array(6).fill(0).map((_, i) => stream({ name: "S" + i })) }), RangeError);
  assert.throws(() => validate({ months: 12, streams: [stream(), stream()] }), TypeError);
  assert.throws(() => validate({ months: 12, streams: [stream({ revenue: Infinity })] }), RangeError);
  assert.throws(() => validate({ months: 12, streams: [stream({ taxRatePct: 101 })] }), RangeError);
});

test("zero capital and zero revenue are safe and do not create invalid ratios", () => {
  const result = calculate({ months: 3, streams: [stream({
    capital: 0, revenue: 0, variableCost: 0, fixedCost: 0
  })] }).results[0].base;
  assert.equal(result.netAfterCapital, 0);
  assert.equal(result.roiPct, null);
  assert.equal(result.paybackMonth, 0);
  assert.equal(simulateStream(stream(), 0, "base").totalRevenue, 0);
});
