'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { schedule, createStore, DAY } = require('../../assets/js/principia-spaced-repetition.js');
function card() { return { id:'c1', front:'F=ma?', back:'Newton second law', repetitions:0, ease:2.5, intervalDays:0, dueAt:0 }; }
test('first correct recall schedules one day; next successful recall six days', () => {
 const first=schedule(card(),4,1000); assert.equal(first.intervalDays,1); assert.equal(first.repetitions,1);
 const second=schedule(first,4,1000); assert.equal(second.intervalDays,6); assert.equal(second.repetitions,2);
});
test('difficult recall resets repetitions and intervals to one day', () => {
 const reset=schedule({...card(),repetitions:4,intervalDays:30,ease:2.5},2,2000);
 assert.equal(reset.repetitions,0); assert.equal(reset.intervalDays,1); assert.equal(reset.dueAt,2000+DAY);
});
test('grades and card inputs validate', () => {
 assert.throws(()=>schedule(card(),6),RangeError);
 assert.throws(()=>schedule(null,4),TypeError);
});
test('store adds, reviews, sorts due, and removes without duplicate ids', () => {
 const map=new Map(), storage={getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v)};
 const store=createStore(storage); assert.equal(store.add({...card(),dueAt:0}),true);
 assert.equal(store.add({...card()}),false); assert.equal(store.due(1).length,1);
 const reviewed=store.review('c1',5,500); assert.equal(reviewed.intervalDays,1); assert.equal(store.due(500).length,0);
 assert.equal(store.remove('c1'),true); assert.equal(store.all().length,0);
});
test('malformed storage and storage quota errors are handled', () => {
 const broken={getItem:()=>'{bad',setItem:()=>{throw Error('quota')}};
 const store=createStore(broken); assert.equal(store.all().length,0);
 assert.equal(store.add({...card()}),false);
});
