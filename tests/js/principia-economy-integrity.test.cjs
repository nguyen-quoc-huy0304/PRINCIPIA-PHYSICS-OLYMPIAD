'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {audit}=require('../../assets/js/principia-economy-integrity.js');
function state(){return{version:1,households:[{id:'h1',cash:100}],firms:[{id:'f1',cash:50,inventory:[{sku:'A',quantity:2,unitCost:5}]}],banks:[{id:'b1',liquidity:100,loansOutstanding:20,depositsOutstanding:30}],loans:[{id:'l1',bankId:'b1',principal:20,principalRepaid:0,interest:0,repaid:0,status:'active'}],deposits:[{id:'d1',bankId:'b1',principal:30,rate:.03,paid:false}],ledger:[{id:'t1',simulationOnly:true}],journal:[{amount:10,lines:[{debit:10,credit:0},{debit:0,credit:10}]}],government:{cash:100,debt:0}};}
test('passes a reconciled simulation economy',()=>{const result=audit(state());assert.equal(result.healthy,true);assert.equal(result.issues.length,0);});
test('detects negative cash and unmarked real-world transactions',()=>{const s=state();s.households[0].cash=-1;s.ledger.push({id:'t2',simulationOnly:false});const result=audit(s);assert.equal(result.healthy,false);assert.ok(result.issues.some(x=>x.name==='balances-households'));assert.ok(result.issues.some(x=>x.name==='ledger-simulation-only'));});
test('detects bank loan and deposit reconciliation errors',()=>{const s=state();s.banks[0].loansOutstanding=99;s.banks[0].depositsOutstanding=0;const result=audit(s);assert.ok(result.issues.some(x=>x.name==='loan-reconciliation'));assert.ok(result.issues.some(x=>x.name==='deposit-reconciliation'));});
test('rejects unbalanced double-entry journals and duplicate ids',()=>{const s=state();s.households.push({id:'h1',cash:1});s.journal[0].lines[1].credit=8;const result=audit(s);assert.ok(result.issues.some(x=>x.name==='unique-households'));assert.ok(result.issues.some(x=>x.name==='double-entry-journal'));});
test('handles absent or invalid state safely',()=>{assert.equal(audit(null).healthy,false);assert.equal(audit({version:2}).healthy,false);});
