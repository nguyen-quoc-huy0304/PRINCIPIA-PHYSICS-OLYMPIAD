'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {getRank,RANKS}=require('../../assets/js/principia-rank-core.js');

test('rank starts at Đồng III with zero XP',()=>{
 const rank=getRank(0);
 assert.equal(rank.id,'bronze');
 assert.equal(rank.label,'Đồng III');
 assert.equal(rank.progress,0);
 assert.equal(rank.xpToNext,250);
});

test('rank thresholds advance exactly at their boundary',()=>{
 for(const item of RANKS){
  const rank=getRank(item.minXP);
  assert.equal(rank.id,item.id);
  assert.equal(rank.xp,item.minXP);
 }
});

test('division changes as progress crosses one-third and two-thirds',()=>{
 assert.equal(getRank(80).division,'III');
 assert.equal(getRank(100).division,'II');
 assert.equal(getRank(200).division,'I');
});

test('invalid, negative and fractional XP are normalized safely',()=>{
 assert.equal(getRank(-10).xp,0);
 assert.equal(getRank('not-a-number').xp,0);
 assert.equal(getRank(250.9).xp,250);
});

test('Thách đấu is the terminal rank and has no next threshold',()=>{
 const rank=getRank(99999);
 assert.equal(rank.id,'challenger');
 assert.equal(rank.label,'Thách đấu');
 assert.equal(rank.isMaxRank,true);
 assert.equal(rank.nextThreshold,null);
 assert.equal(rank.progress,100);
});
