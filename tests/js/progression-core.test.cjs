const test=require('node:test');
const assert=require('node:assert/strict');
const P=require('../../assets/js/principia-progression-core.js');
test('records a unique local calendar day',()=>{const d=new Date(2026,10,22,9);assert.deepEqual(P.recordActivity(['2026-11-21','2026-11-21'],d),['2026-11-21','2026-11-22'])});
test('streak includes activity today',()=>{const d=new Date(2026,10,22);assert.equal(P.streak(['2026-11-20','2026-11-21','2026-11-22'],d).current,3)});
test('streak continues when last activity was yesterday',()=>{const d=new Date(2026,10,22);assert.equal(P.streak(['2026-11-20','2026-11-21'],d).current,2)});
test('streak resets after a missed day',()=>{const d=new Date(2026,10,22);assert.equal(P.streak(['2026-11-19'],d).current,0)});
test('longest streak survives a current reset',()=>{const d=new Date(2026,10,22);assert.equal(P.streak(['2026-11-15','2026-11-16','2026-11-17','2026-11-19'],d).longest,3)});
test('XP level boundaries are stable',()=>{assert.equal(P.level(99).level,1);assert.equal(P.level(100).level,2);assert.equal(P.level(4000).level,11)});
test('level progress is bounded and reports XP to next',()=>{const x=P.level(175);assert.equal(x.progress,50);assert.equal(x.xpToNext,75)});
test('achievement progress uses actual metrics',()=>{const a=P.achievements({sessions:2,questions:45,streak:7});assert.equal(a.find(x=>x.id==='first-session').unlocked,true);assert.equal(a.find(x=>x.id==='streak-seven').unlocked,true);assert.equal(a.find(x=>x.id==='century-questions').percent,45)});
test('achievement output has stable unique ids',()=>{const a=P.achievements();assert.equal(new Set(a.map(x=>x.id)).size,a.length)});

test('ignores impossible calendar dates in stored activity',()=>{const d=new Date(2026,10,22);assert.deepEqual(P.recordActivity(['2026-02-30','2026-13-01','not-a-date'],d),['2026-11-22'])});
test('invalid stored dates cannot extend the current streak',()=>{const d=new Date(2026,10,22);assert.equal(P.streak(['2026-11-21','2026-02-30'],d).current,1)});
test('invalid stored dates cannot inflate the longest streak',()=>{assert.equal(P.streak(['2026-11-18','2026-11-19','2026-02-30'],new Date(2026,10,22)).longest,2)});

test('accepts well-formed local calendar keys and rejects malformed keys',()=>{assert.deepEqual(P.recordActivity(['2026-11-21'],new Date(2026,10,22)),['2026-11-21','2026-11-22']);assert.deepEqual(P.recordActivity(['2026/11/21','abcd-11-21','2026-11-21x'],new Date(2026,10,22)),['2026-11-22'])});

test('progression summary delegates levels and achievements to Rust/WASM',async()=>{
 const previous=global.PrincipiaWasmPhysics;
 let received;
 global.PrincipiaWasmPhysics={progression:async metrics=>{
  received=metrics;
  return {level:{level:3,title:'Khám phá',xp:250,progress:0,xpToNext:200,nextThreshold:450},
   rank:{id:'gold'},achievements:[{id:'first-session',name:'Khởi động',unlocked:true,value:1,target:1}]};
 }};
 try{
  const result=await P.summarizeWithRust(250,{sessions:1});
  assert.equal(received.xp,250);
  assert.equal(received.sessions,1);
  assert.equal(result.level.level,3);
  assert.equal(result.achievements[0].unlocked,true);
 }finally{
  if(previous===undefined)delete global.PrincipiaWasmPhysics;
  else global.PrincipiaWasmPhysics=previous;
 }
});
