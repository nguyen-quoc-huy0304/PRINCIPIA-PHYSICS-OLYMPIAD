/* PRINCIPIA progress adapter: XP and streak transitions are computed by Rust. */
(function(root){
 'use strict';
 const ACTIVITIES=new Set(['lesson','quiz','assignment','experiment']);
 function validateProgress(progress,activity,day,reward){
  if(!progress||typeof progress!=='object')throw new TypeError('Progress state is required');
  for(const key of ['experience','completedLessons','studyStreakDays']){
   if(!Number.isSafeInteger(progress[key])||progress[key]<0)throw new RangeError('Invalid progress field: '+key);
  }
  if(progress.lastActivityDay!==null&&progress.lastActivityDay!==undefined&&
     (typeof progress.lastActivityDay!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(progress.lastActivityDay)))throw new RangeError('Invalid last activity date');
  if(!ACTIVITIES.has(activity))throw new RangeError('Unsupported progress activity');
  if(typeof day!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(day))throw new RangeError('Activity day must use YYYY-MM-DD');
  if(!Number.isInteger(reward)||reward<0||reward>1000)throw new RangeError('XP reward must be an integer from 0 to 1000');
 }
 async function record(progress,activity,day,reward){
  validateProgress(progress,activity,day,reward);
  const bridge=root.PrincipiaWasmPhysics;
  if(!bridge||typeof bridge.load!=='function')throw new Error('Rust/WASM progress core is unavailable');
  const wasm=await bridge.load();
  if(typeof wasm.progress_award_custom_json!=='function')throw new Error('Rust progress export is missing');
  const result=JSON.parse(wasm.progress_award_custom_json(JSON.stringify(progress),activity,day,reward));
  if(!result||!['experience','completedLessons','studyStreakDays','level','experienceIntoLevel'].every(key=>Number.isSafeInteger(result[key])&&result[key]>=0)||
     typeof result.lastActivityDay!=='string')throw new Error('Rust returned invalid progress state');
  return result;
 }
 root.PrincipiaProgressAdapter=Object.freeze({record});
})(typeof window!=='undefined'?window:globalThis);
