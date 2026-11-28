'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {MODES,createRound,evaluateGuess,assertSeed}=require('../../assets/js/principia-pattern-arcade.js');

test('creates deterministic, fully specified rounds for all three games',()=>{
 for(const mode of Object.keys(MODES)){
  const first=createRound(0x12345678,mode);
  const second=createRound(0x12345678,mode);
  assert.deepEqual(first,second);
  assert.equal(first.sequence.length,6);
  assert.equal(first.options.length,4);
  assert.equal(new Set(first.options.map(option=>option.step)).size,4);
  assert.ok(first.options.some(option=>option.step===first.hiddenStep));
  const expected=MODES[mode].values[(MODES[mode].values.indexOf(first.sequence[0])+6*first.hiddenStep)%MODES[mode].modulus];
  assert.equal(first.answer,expected);
 }
});

test('hidden rules change when a new secure seed is used',()=>{
 const first=createRound(1,'numbers');
 const next=createRound(257,'numbers');
 assert.notEqual(first.hiddenStep,next.hiddenStep);
 assert.notDeepEqual(first.sequence,next.sequence);
});

test('accepts only the exact next result and matching rule',()=>{
 const round=createRound(0xabcdef01,'dice');
 assert.equal(evaluateGuess(round,round.answer,round.hiddenStep).solved,true);
 assert.equal(evaluateGuess(round,round.answer,round.options.find(option=>option.step!==round.hiddenStep).step).solved,false);
 assert.equal(evaluateGuess(round,((round.answer)%6)+1,round.hiddenStep).predictionCorrect,false);
});

test('supports color labels as predictions',()=>{
 const round=createRound(0x10203040,'colors');
 const result=evaluateGuess(round,round.answer,round.hiddenStep);
 assert.equal(result.predictionCorrect,true);
 assert.equal(result.ruleCorrect,true);
 assert.equal(result.solved,true);
});

test('rejects malformed seeds, modes, rounds and rule guesses',()=>{
 for(const seed of [-1,1.5,NaN,Infinity,0x100000000])assert.throws(()=>assertSeed(seed),RangeError);
 assert.throws(()=>createRound(1,'unknown'),TypeError);
 assert.throws(()=>createRound(null,'numbers'),RangeError);
 assert.throws(()=>evaluateGuess(null,1,1),TypeError);
 const round=createRound(12,'numbers');
 assert.equal(evaluateGuess(round,round.answer,999).ruleCorrect,false);
});
