const test=require('node:test');const assert=require('node:assert/strict');const api=require('../../assets/js/principia-season-core.js');
test('week starts Monday and remains stable during week',()=>{assert.equal(api.weekKey(new Date(2026,10,22)),api.weekKey(new Date(2026,10,23)))});
test('missions calculate progress and completion',()=>{const x=api.missions({sessions:2,questions:15,notes:2},new Date(2026,10,22));assert.equal(x[0].progress,67);assert.equal(x[0].complete,false);assert.equal(x[2].complete,true)});
test('negative and invalid metrics do not create progress',()=>{const x=api.missions({sessions:-5,questions:'x',notes:0});assert.equal(x[0].value,0);assert.equal(x[1].value,0)});
test('claim requires complete mission and prevents duplicate weekly claim',()=>{const x=api.missions({sessions:3});assert.equal(api.canClaim(x,'practice',[]),true);assert.equal(api.canClaim(x,'practice',[x[0].week+':practice']),false);assert.equal(api.canClaim(x,'notes',[]),false)});
test('unknown mission cannot be claimed',()=>{assert.equal(api.canClaim([], 'unknown', []),false)});
