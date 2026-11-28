"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createEconomy, calculateCompoundInterest, createPersonalFinanceLedger } = require("../../systems/economy-system");

test("economy ticks deterministically and validates shocks", () => {
  const economy = createEconomy();
  const next = economy.simulateTick({ productivity: 0.1 });
  assert.equal(next.tick, 1);
  assert.ok(next.priceIndex > 0);
  assert.throws(() => economy.simulateTick({ demandShock: 4 }), /between/);
});
test("compound interest and ledger totals are correct", () => {
  assert.equal(calculateCompoundInterest({ principal: 100, annualRate: 0.1, periods: 2 }).amount, 121);
  const ledger = createPersonalFinanceLedger(50);
  ledger.record({ type: "income", amount: 20 });
  ledger.record({ type: "expense", amount: 10 });
  assert.equal(ledger.summary().balance, 60);
  assert.equal(ledger.summary().income, 20);
  assert.equal(ledger.summary().expenses, 10);
});
