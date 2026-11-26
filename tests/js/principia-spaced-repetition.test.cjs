'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { schedule, createStore, DAY } = require('../../assets/js/principia-spaced-repetition.js');
function card() { return { id:'c1', front:'F=ma?', back:'Newton second law', repetitions:0, ease:2.5, intervalDays:0, dueAt:0 }; }
test('review schedules through Rust and persists the resulting interval', async () => {
 const previousWindow=global.window;
 global.window={PrincipiaWasmPhysics:{async scheduleReview(grade,interval,ease){
  const intervalDays=grade<3?1:interval===0?1:interval===1?6:Math.round(interval*ease);
  return {intervalDays,dueAfterDays:intervalDays,easeFactor:Math.max(1.3,Math.min(3,ease+0.1)),mastered:grade>=4&&intervalDays>=6};
 }}};
 try {
  const first=await schedule(card(),4,1000);
  assert.equal(first.intervalDays,1);
  const second=await schedule(first,4,2000);
  assert.equal(second.intervalDays,6);
 } finally { if(previousWindow===undefined) delete global.window; else global.window=previousWindow; }
});
test('failed recall resets repetitions and schedules one day', async () => {
 const previousWindow=global.window;
 global.window={PrincipiaWasmPhysics:{async scheduleReview(){return {intervalDays:1,dueAfterDays:1,easeFactor:2.3,mastered:false};}}};
 try {
  const reset=await schedule({...card(),repetitions:4,intervalDays:30,ease:2.5},2,2000);
  assert.equal(reset.repetitions,0);
  assert.equal(reset.intervalDays,1);
  assert.equal(reset.dueAt,2000+DAY);
 } finally { if(previousWindow===undefined) delete global.window; else global.window=previousWindow; }
});
test('grades and card inputs validate', async () => {
 await assert.rejects(schedule(card(),6),RangeError);
 await assert.rejects(schedule(null,4),TypeError);
});
test('store adds, reviews, sorts due, and removes without duplicate ids', async () => {
 const previousWindow=global.window;
 global.window={PrincipiaWasmPhysics:{async scheduleReview(){return {intervalDays:1,dueAfterDays:1,easeFactor:2.5,mastered:false};}}};
 try {
  const map=new Map(), storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
  const store=createStore(storage); assert.equal(store.add({...card(),dueAt:0}),true);
  assert.equal(store.add({...card()}),false); assert.equal(store.due(1).length,1);
  const reviewed=await store.review('c1',5,500); assert.equal(reviewed.intervalDays,1);
  assert.equal(store.due(500).length,0);
  assert.equal(store.remove('c1'),true); assert.equal(store.all().length,0);
 } finally { if(previousWindow===undefined) delete global.window; else global.window=previousWindow; }
});
test('malformed storage and storage quota errors are handled', () => {
 const broken={getItem:()=>'{bad',setItem:()=>{throw Error('quota')}};
 const store=createStore(broken); assert.equal(store.all().length,0);
 assert.equal(store.add({...card()}),false);
});

test('native scheduler delegates review calculation to Rust WASM', async () => {
 const previousWindow=global.window; let args;
 global.window={PrincipiaWasmPhysics:{async scheduleReview(...values){args=values;return {intervalDays:6,dueAfterDays:6,easeFactor:2.6,mastered:true};}}};
 try {
  const result=await require('../../assets/js/principia-spaced-repetition.js').scheduleNative({...card(),repetitions:1,intervalDays:1},5,1000);
  assert.deepEqual(args,[5,1,2.5]); assert.equal(result.intervalDays,6);
  assert.equal(result.dueAt,1000+6*DAY); assert.equal(result.mastered,true);
 } finally { if(previousWindow===undefined) delete global.window; else global.window=previousWindow; }
});
test('native scheduler rejects when Rust WASM is unavailable', async () => {
 const previousWindow=global.window; global.window={};
 try { await assert.rejects(require('../../assets/js/principia-spaced-repetition.js').scheduleNative(card(),4),/Rust\/WASM learning engine is not loaded/); }
 finally { if(previousWindow===undefined) delete global.window; else global.window=previousWindow; }
});
test('store reviewNative persists the Rust-generated schedule', async () => {
 const values=new Map(), storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
 const previousWindow=global.window;
 global.window={PrincipiaWasmPhysics:{async scheduleReview(){return {intervalDays:6,dueAfterDays:6,easeFactor:2.6,mastered:true};}}};
 try {
  const store=createStore(storage); assert.equal(store.add(card()),true);
  const reviewed=await store.reviewNative('c1',5,10000);
  assert.equal(reviewed.dueAt,10000+6*DAY); assert.equal(store.all()[0].mastered,true);
 } finally { if(previousWindow===undefined) delete global.window; else global.window=previousWindow; }
});
