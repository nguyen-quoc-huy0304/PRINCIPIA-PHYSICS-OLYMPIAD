"use strict";
const {test}=require("node:test"),assert=require("node:assert/strict");
const {listEconomicModels,runEconomicModel}=require("../../systems/economic-model-library");
test("economic catalog contains at least 80 unique models",()=>{const a=listEconomicModels();assert.ok(a.length>=80);assert.equal(new Set(a.map(x=>x.id)).size,a.length);});
test("sample formulas compute",()=>{assert.equal(runEconomicModel("macro.gdp.expenditure",{C:100,I:20,G:10,X:5,M:3}).result,132);assert.equal(runEconomicModel("investment.compound",{principal:100,rate:.1,periods:2}).result,121);assert.equal(runEconomicModel("finance.futurevalue",{present:100,rate:.1,periods:2}).result,121);});
test("unknown models and invalid inputs fail",()=>{assert.throws(()=>runEconomicModel("unknown",{}),/Unknown economic model/);assert.throws(()=>runEconomicModel("macro.gdp.real",{nominal:100,deflator:0}),/non-finite/);});
