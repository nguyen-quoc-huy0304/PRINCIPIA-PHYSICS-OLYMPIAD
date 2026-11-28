'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {summarize,KEYS}=require('../../assets/js/principia-economy-control-center.js');
test('summarizes independent simulation ledgers without adding balances together',()=>{
 const data=new Map([[KEYS.integrated,JSON.stringify({households:[{cash:100}],firms:[{cash:200}],banks:[{liquidity:300}],ledger:[{}]})],[KEYS.advanced,JSON.stringify({cash:400,ledger:[{},{}]})],[KEYS.hub,JSON.stringify({cash:500,ledger:[{}]})],[KEYS.portfolio,JSON.stringify({positions:[{}],trades:[{},{}]})]]);
 const result=summarize({getItem:key=>data.get(key)||null});
 assert.equal(result.simulationOnly,true);assert.equal(result.balances.households,100);assert.equal(result.balances.advanced,400);assert.equal(result.balances.simulationHub,500);assert.equal(result.activity.portfolioTrades,2);assert.equal(result.walletLinkage.shared,false);assert.ok(result.warnings.some(x=>x.includes('chưa cùng liên kết')));
});
test('handles missing and malformed module storage safely',()=>{
 const result=summarize({getItem:key=>key===KEYS.advanced?'{bad':null});
 assert.equal(result.modules.integrated,false);assert.equal(result.balances.advanced,0);assert.equal(result.participants.households,0);
});

test('includes bank products and requires every initialized wallet module to share one owner',()=>{
 const identity='household:h-1';
 const data=new Map([
  [KEYS.integrated,JSON.stringify({households:[{id:'h-1',cash:5000}],firms:[],banks:[],ledger:[],government:{cash:0}})],
  [KEYS.advanced,JSON.stringify({walletIdentity:identity,cash:0,ledger:[]})],
  [KEYS.hub,JSON.stringify({walletIdentity:identity,cash:0,ledger:[]})],
  [KEYS.portfolio,JSON.stringify({walletIdentity:identity,positions:[],trades:[]})],
  [KEYS.bankProducts,JSON.stringify({walletIdentity:identity,deposits:[{}],loans:[{}],ledger:[{}]})]
 ]);
 const result=summarize({getItem:key=>data.get(key)||null});
 assert.equal(result.modules.bankProducts,true);
 assert.equal(result.walletLinkage.shared,true);
 assert.equal(result.walletLinkage.modules,4);
 assert.equal(result.walletLinkage.balance,5000);
 assert.equal(result.activity.bankDeposits,1);
 assert.equal(result.activity.bankLoans,1);
 assert.equal(result.activity.bankLedger,1);
});
