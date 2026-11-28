"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const finance = require("../../systems/finance-calculators.js");
const planner = require("../../systems/business-planner.js");

test("NPV and IRR calculate standard cash flows", () => {
  assert.equal(finance.npv(0.1, [100, 100]), 173.55371901);
  assert.ok(Math.abs(finance.irr([-100, 60, 60]) - 0.13066239) < 1e-7);
});
test("DCF rejects terminal growth at or above discount rate", () => {
  assert.throws(() => finance.dcf({cashFlows:[10,12],discountRate:.05,terminalGrowth:.05}), RangeError);
});
test("CAPM, WACC and bond pricing return finite values", () => {
  assert.equal(finance.capm({riskFreeRate:.04,beta:1.2,marketReturn:.1}), .112);
  assert.ok(finance.wacc({equity:70,debt:30,costOfEquity:.14,costOfDebt:.08,taxRate:.2}) > 0);
  assert.ok(finance.bondPrice({faceValue:1000,couponRate:.08,yieldRate:.09,periods:5}) > 0);
});
test("DDM, CAGR and ROI apply their valuation formulas", () => {
  assert.equal(finance.ddm({nextDividend:5,requiredReturn:.1,growthRate:.04}),83.33333333);
  assert.ok(Math.abs(finance.cagr({beginningValue:100,endingValue:121,years:2})-.1)<1e-8);
  assert.equal(finance.roi({initialInvestment:100,endingValue:130,additionalCosts:5}),.25);
  assert.throws(() => finance.ddm({nextDividend:5,requiredReturn:.04,growthRate:.04}), RangeError);
});
test("business metrics validate denominators and calculate break-even", () => {
  assert.deepEqual(finance.breakEven({fixedCosts:1000,price:20,variableCost:10}), {units:100,sales:2000,contribution:10});
  assert.throws(() => finance.breakEven({fixedCosts:1000,price:10,variableCost:10}), RangeError);
});
test("risk and ownership models reject invalid data", () => {
  assert.throws(() => finance.historicalVaR([.1],.95,100), TypeError);
  assert.deepEqual(finance.dilution({preMoney:80,investment:20}), {postMoney:100,investorOwnership:.2,existingOwnership:.8});
});
test("business plan projects cash and validates the business model", () => {
  const plan = planner.buildPlan({name:"Demo",startupCost:100,monthlyRevenue:100,variableCostRate:.2,fixedCosts:30,months:2});
  assert.equal(plan.projection.length,2);
  assert.equal(plan.firstMonthProfit,50);
  assert.throws(() => planner.validateBusinessModel({}), TypeError);
});
