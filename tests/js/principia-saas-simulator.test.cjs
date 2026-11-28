"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { validate, calculate } = require("../../assets/js/principia-saas-simulator.js");
const sample = overrides => ({
  initialCustomers:100,newCustomers:20,arpu:200000,churnPct:3,grossMarginPct:80,
  cac:250000,fixedCosts:15000000,setupInvestment:50000000,
  acquisitionGrowthPct:0,taxRatePct:20,months:12,...overrides
});
test("calculates MRR, ARR, customer lifetime value and CAC payback",()=>{
  const result=calculate(sample({months:1}));
  assert.equal(result.finalCustomers,117);
  assert.equal(result.finalMrr,23400000);
  assert.equal(result.finalArr,280800000);
  assert.equal(result.ltv,5333333.33);
  assert.equal(result.cacPaybackMonths,1.56);
  assert.equal(result.ltvToCac,21.33);
});
test("forecasts churn, acquisition spend, tax and cumulative cash",()=>{
  const result=calculate(sample({months:2}));
  assert.equal(result.forecast.length,2);
  assert.equal(result.forecast[0].churnedCustomers,3);
  assert.equal(result.forecast[0].newCustomers,20);
  assert.equal(result.forecast[0].customers,117);
  assert.equal(result.totals.acquisitionCost,10000000);
  assert.equal(result.paybackMonth,null);
  assert.ok(result.cumulativeCash<0);
});
test("growth compounds new customer acquisition and respects churn cap",()=>{
  const result=calculate(sample({initialCustomers:1,newCustomers:10,churnPct:100,acquisitionGrowthPct:10,months:2}));
  assert.equal(result.forecast[0].customers,10);
  assert.equal(result.forecast[1].newCustomers,11);
  assert.equal(result.forecast[1].churnedCustomers,10);
  assert.equal(result.forecast[1].customers,11);
});
test("zero churn and zero gross margin avoid invalid division",()=>{
  const result=calculate(sample({churnPct:0,grossMarginPct:0,months:1}));
  assert.equal(result.ltv,null);
  assert.equal(result.cacPaybackMonths,null);
  assert.equal(result.ltvToCac,null);
  assert.equal(result.breakEvenCustomers,null);
});
test("rejects invalid periods, fractional customer counts and out-of-range values",()=>{
  assert.throws(()=>validate(sample({months:0})),RangeError);
  assert.throws(()=>validate(sample({months:61})),RangeError);
  assert.throws(()=>validate(sample({initialCustomers:1.5})),TypeError);
  assert.throws(()=>validate(sample({churnPct:101})),RangeError);
  assert.throws(()=>validate(null),TypeError);
  assert.throws(()=>validate(sample({arpu:null})),TypeError);
  assert.throws(()=>validate(sample({cac:''})),TypeError);
});
