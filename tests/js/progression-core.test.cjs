const test=require('node:test');
const assert=require('node:assert/strict');
const P=require('../../assets/js/principia-progression-core.js');

function withRust(stubs,run){
 const previous=global.PrincipiaWasmPhysics;
 global.PrincipiaWasmPhysics=stubs;
 return Promise.resolve().then(run).finally(()=>{
  if(previous===undefined)delete global.PrincipiaWasmPhysics;
  else global.PrincipiaWasmPhysics=previous;
 });
}
function date(year,month,day){return new Date(year,month-1,day,12);}

test('local date key is formatted at the browser boundary',()=>{
 assert.equal(P.dateKey(date(2026,11,22)),'2026-11-22');
 assert.throws(()=>P.dateKey('not-a-date'),/không hợp lệ/);
});
test('activity recording delegates calendar normalization to Rust',async()=>{
 await withRust({activityCalendar:async(days,today,record)=>({days:[...new Set([...days,today])].sort(),current:1,longest:1,activeToday:record}),progression:async()=>({level:{},rank:{},achievements:[]})},async()=>{
  assert.deepEqual(await P.recordActivity(['2026-11-21','2026-11-21'],date(2026,11,22)),['2026-11-21','2026-11-22']);
 });
});
test('streak calculations delegate to Rust',async()=>{
 await withRust({activityCalendar:async()=>({days:[],current:3,longest:5,activeToday:true}),progression:async()=>({level:{},rank:{},achievements:[]})},async()=>{
  assert.deepEqual(await P.streak(['2026-11-20','2026-11-21','2026-11-22'],date(2026,11,22)),{current:3,longest:5,activeToday:true});
 });
});
test('invalid date arrays fail before crossing the WASM boundary',async()=>{
 await withRust({activityCalendar:async()=>{throw new Error('must not run');},progression:async()=>({level:{},rank:{},achievements:[]})},async()=>{
  await assert.rejects(P.recordActivity(new Array(10001).fill('2026-11-22'),date(2026,11,22)),/Danh sách/);
 });
});
test('XP levels are returned by the Rust progression engine',async()=>{
 await withRust({activityCalendar:async()=>({days:[],current:0,longest:0,activeToday:false}),progression:async payload=>({level:{level:payload.xp>=100?2:1,title:'Tập sự'},rank:{},achievements:[]})},async()=>{
  assert.equal((await P.level(100)).level,2);
  assert.equal((await P.level(99)).level,1);
 });
});
test('achievement progress is returned by Rust and preserves metric values',async()=>{
 await withRust({activityCalendar:async()=>({days:[],current:0,longest:0,activeToday:false}),progression:async payload=>({level:{},rank:{},achievements:[{id:'streak-seven',unlocked:payload.streak>=7,percent:Math.min(100,payload.streak/7*100)}]})},async()=>{
  const result=await P.achievements({streak:7,questions:45});
  assert.equal(result[0].unlocked,true);
  assert.equal(result[0].percent,100);
 });
});
test('progression adapter forwards learner metrics to Rust',async()=>{
 await withRust({activityCalendar:async()=>({days:[],current:0,longest:0,activeToday:false}),progression:async payload=>({level:{level:2},rank:{},achievements:[],payload})},async()=>{
  const result=await P.summarizeWithRust(150,{sessions:3,questions:40,bestPercent:88,lessons:2,streak:4,experiments:1,levelsCreated:0});
  assert.equal(result.payload.xp,150);
  assert.equal(result.payload.questions,40);
  assert.equal(result.payload.bestPercent,88);
 });
});
test('progression fails closed when the WASM engine is unavailable',async()=>{
 const previous=global.PrincipiaWasmPhysics;
 delete global.PrincipiaWasmPhysics;
 try {
  await assert.rejects(P.summarizeWithRust(0),/unavailable/);
  await assert.rejects(P.streak([],date(2026,11,22)),/unavailable/);
 } finally { if(previous===undefined)delete global.PrincipiaWasmPhysics;else global.PrincipiaWasmPhysics=previous; }
});
