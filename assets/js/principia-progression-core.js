/* PRINCIPIA progression adapter: browser dates and persistence stay in JS; rules run in Rust/WASM. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.PrincipiaProgressionCore=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 function dateKey(value){
  const date=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(date.getTime()))throw new Error('Ngày hoạt động không hợp lệ.');
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 }
 function wasm(){
  if(!root.PrincipiaWasmPhysics?.activityCalendar||!root.PrincipiaWasmPhysics?.progression){
   throw new Error('Rust WASM progression engine is unavailable');
  }
  return root.PrincipiaWasmPhysics;
 }
 function normalizeDays(days){
  if(!Array.isArray(days)||days.length>10000)throw new TypeError('Danh sách ngày hoạt động không hợp lệ.');
  const normalized=new Set();
  for(const day of days){
   if(typeof day!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(day))throw new TypeError('Ngày hoạt động không hợp lệ.');
   const parsed=new Date(day+'T00:00:00Z');
   if(!Number.isFinite(parsed.getTime())||parsed.toISOString().slice(0,10)!==day)throw new TypeError('Ngày hoạt động không hợp lệ.');
   normalized.add(day);
  }
  return [...normalized].sort();
 }
 function normalizeMetrics(metrics){
  if(!metrics||typeof metrics!=='object'||Array.isArray(metrics))throw new TypeError('Metrics không hợp lệ.');
  const keys=['sessions','questions','bestPercent','lessons','streak','experiments','levelsCreated'];
  const normalized={};
  for(const key of keys){
   if(metrics[key]===undefined)continue;
   const value=metrics[key],max=key==='bestPercent'?100:1000000000;
   if(!Number.isSafeInteger(value)||value<0||value>max)throw new RangeError('Metrics không hợp lệ: '+key);
   normalized[key]=value;
  }
  for(const key of Object.keys(metrics))if(!keys.includes(key))throw new TypeError('Metrics không được hỗ trợ: '+key);
  return normalized;
 }
 async function activity(days,when,recordToday){
  return wasm().activityCalendar(normalizeDays(days),dateKey(when),recordToday);
 }
 async function recordActivity(days,when=new Date()){
  const result=await activity(days,when,true);
  if(!Array.isArray(result.days))throw new TypeError('Rust returned an invalid activity calendar.');
  return result.days;
 }
 async function streak(days,today=new Date()){
  const result=await activity(days,today,false);
  if(!Number.isInteger(result.current)||!Number.isInteger(result.longest)||typeof result.activeToday!=='boolean'){
   throw new TypeError('Rust returned an invalid streak summary.');
  }
  return {current:result.current,longest:result.longest,activeToday:result.activeToday};
 }
 async function summarizeWithRust(xp,metrics={}){
  if(!Number.isSafeInteger(xp)||xp<0)throw new RangeError('XP không hợp lệ.');
  const result=await wasm().progression({xp,...normalizeMetrics(metrics)});
  if(!result||!result.level||!Array.isArray(result.achievements))throw new TypeError('Rust returned an invalid progression summary.');
  return result;
 }
 async function level(xp){return (await summarizeWithRust(xp)).level;}
 async function achievements(metrics={}){return (await summarizeWithRust(0,metrics)).achievements;}
 return Object.freeze({dateKey,recordActivity,streak,level,achievements,summarizeWithRust});
});
