"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const {validate,calculate}=require("../../assets/js/principia-marketplace-simulator.js");
const sample=overrides=>({
 initialBuyers:100,newBuyers:25,buyerChurnPct:4,newBuyerGrowthPct:0,
 ordersPerBuyer:1.5,averageOrderValue:300000,takeRatePct:10,refundRatePct:3,
 paymentFeePct:2,variableCostPerOrder:3000,sellerSubsidyPerOrder:1000,
 buyerCAC:50000,fixedCosts:20000000,setupInvestment:80000000,taxRatePct:20,months:1,...overrides
});
test("calculates buyer churn, orders, GMV, commission and unit economics",()=>{
 const result=calculate(sample());
 assert.equal(result.finalBuyers,121);
 assert.equal(result.finalOrders,182);
 assert.equal(result.finalGMV,54600000);
 assert.equal(result.totals.netGMV,52962000);
 assert.equal(result.finalPlatformRevenue,5296200);
 assert.equal(result.totals.paymentFees,1059240);
 assert.equal(result.contributionPerOrder,19280);
 assert.equal(result.breakEvenOrders,Math.ceil((20000000+25*50000)/19280));
});
test("includes CAC, operating expenses, tax and initial setup capital",()=>{
 const result=calculate(sample());
 assert.equal(result.totals.buyerAcquisition,1250000);
 assert.equal(result.totals.tax,0);
 assert.equal(result.cumulativeCash,-97741040);
 assert.equal(result.paybackMonth,null);
});
test("handles full buyer churn and zero take-rate contribution safely",()=>{
 const result=calculate(sample({initialBuyers:10,newBuyers:2,buyerChurnPct:100,takeRatePct:0,months:2}));
 assert.equal(result.forecast[0].buyers,2);
 assert.equal(result.breakEvenOrders,null);
});
test("validates limits, integers and empty external values",()=>{
 assert.throws(()=>validate(sample({months:0})),RangeError);
 assert.throws(()=>validate(sample({months:61})),RangeError);
 assert.throws(()=>validate(sample({initialBuyers:1.2})),TypeError);
 assert.throws(()=>validate(sample({takeRatePct:51})),RangeError);
 assert.throws(()=>validate(sample({averageOrderValue:null})),TypeError);
 assert.throws(()=>validate(sample({buyerCAC:""})),TypeError);
 assert.throws(()=>validate(null),TypeError);
});
