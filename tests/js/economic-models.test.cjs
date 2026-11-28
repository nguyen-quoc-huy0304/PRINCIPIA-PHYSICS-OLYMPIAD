"use strict";
const test=require("node:test"),assert=require("node:assert/strict");
const {MODELS,calc,listModels,getModel}=require("../../systems/economic-models");
test("library contains 80 unique models across 8 domains",()=>{assert.equal(MODELS.length,80);assert.equal(new Set(MODELS.map(m=>m.id)).size,80);assert.equal(new Set(MODELS.map(m=>m.category)).size,8);});
test("models calculate expected values",()=>{assert.equal(calc("macro.gdp_growth",{currentGDP:110,previousGDP:100}),10);assert.equal(calc("fiscal.tax_revenue",{taxBase:1000,taxRate:.2}),200);assert.equal(calc("business.roi",{netGain:50,investment:200}),25);});
test("model discovery and invalid inputs",()=>{assert.equal(listModels("risk").length,10);assert.ok(getModel("trade.trade_balance"));assert.throws(()=>calc("macro.gdp_growth",{currentGDP:3,previousGDP:0}),/division by zero/);assert.throws(()=>calc("bogus",{}),/Unknown/);});
