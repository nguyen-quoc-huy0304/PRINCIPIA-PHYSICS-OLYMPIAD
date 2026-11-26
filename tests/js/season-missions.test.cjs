'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');

const calls=[];
globalThis.PrincipiaWasmPhysics={
  seasonMissions:async payload=>{
    calls.push({operation:'missions',payload});
    return [
      {id:'practice',name:'Chiến binh luyện tập',description:'Hoàn thành 3 lượt luyện',value:2,target:3,xp:60,complete:false,progress:67,week:payload.week},
      {id:'questions',name:'Bậc thầy câu hỏi',description:'Trả lời 30 câu hỏi',value:15,target:30,xp:80,complete:false,progress:50,week:payload.week},
      {id:'notes',name:'Nhà ghi chép',description:'Lưu 2 ghi chú học tập',value:2,target:2,xp:40,complete:true,progress:100,week:payload.week}
    ];
  },
  claimSeasonMission:async payload=>{
    calls.push({operation:'claim',payload});
    return {allowed:payload.value>=3&&!payload.alreadyClaimed,reward:payload.value>=3&&!payload.alreadyClaimed?60:0,target:3};
  }
};
const api=require('../../assets/js/principia-season-core.js');

test('week key remains Monday-based and local-calendar aware',()=>{
  assert.equal(api.weekKey(new Date(2026,10,16)),api.weekKey(new Date(2026,10,22)));
});

test('mission generation delegates metrics and week to Rust WASM',async()=>{
  const rows=await api.missions({attempts:[{date:'2026-11-23T10:00:00Z',total:2.9}],notes:[{date:'2026-11-24'}]},new Date(2026,10,22));
  assert.equal(rows.length,3);
  assert.equal(rows[0].progress,67);
  assert.equal(rows[2].complete,true);
  assert.equal(calls[0].payload.attempts[0].total,2);
  assert.equal(calls[0].payload.notes.length,1);
  assert.equal(calls[0].payload.week,'2026-11-16');
  assert.equal(calls[0].payload.weekEnd,'2026-11-23');
});

test('invalid local metrics are normalized before calling Rust',async()=>{
  const rows=await api.missions({attempts:[{date:'bad',total:Infinity}],notes:[{date:'bad'}]});
  assert.equal(rows[0].value,2);
  assert.equal(calls[1].payload.attempts[0].total,0);
  assert.equal(calls[1].payload.notes[0].date,'bad');
});

test('claim validation delegates thresholds and one-time status to Rust',async()=>{
  assert.equal((await api.claim('practice',2,false)).allowed,false);
  assert.equal((await api.claim('practice',3,false)).reward,60);
  assert.equal((await api.claim('practice',3,true)).allowed,false);
  assert.equal(calls[2].payload.alreadyClaimed,false);
});

test('malformed Rust mission results are rejected',async()=>{
  const original=globalThis.PrincipiaWasmPhysics.seasonMissions;
  globalThis.PrincipiaWasmPhysics.seasonMissions=async()=>[];
  await assert.rejects(api.missions(),/invalid weekly season missions/);
  globalThis.PrincipiaWasmPhysics.seasonMissions=original;
});
