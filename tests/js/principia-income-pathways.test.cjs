"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { PATHWAYS, CATEGORIES, filterPathways } = require("../../assets/js/principia-income-pathways.js");

test("income pathway catalogue has unique IDs and complete records", () => {
  assert.equal(PATHWAYS.length, 162);
  assert.equal(new Set(PATHWAYS.map(item => item.id)).size, PATHWAYS.length);
  for (const item of PATHWAYS) {
    assert.ok(CATEGORIES[item.category], item.id + " category");
    for (const key of ["name","description","startupCapital","skills","timeToIncome","incomeType","risk","scalability","considerations"]) {
      assert.equal(typeof item[key], "string", item.id + "." + key);
      assert.ok(item[key].length > 0, item.id + "." + key);
    }
  }
});

test("category and Vietnamese keyword search return only matching pathways", () => {
  const rentals = filterPathways(PATHWAYS, "rental", "");
  assert.ok(rentals.length >= 6);
  assert.ok(rentals.every(item => item.category === "rental"));
  assert.ok(filterPathways(PATHWAYS, "all", "cho thuê").length > 0);
  assert.ok(filterPathways(PATHWAYS, "all", "SaaS").some(item => item.name === "Phần mềm SaaS"));
});

test("invalid search arguments fail explicitly", () => {
  assert.throws(() => filterPathways({}, "all", ""), TypeError);
  assert.throws(() => filterPathways(PATHWAYS, null, ""), TypeError);
  assert.throws(() => filterPathways(PATHWAYS, "all", 5), TypeError);
});
