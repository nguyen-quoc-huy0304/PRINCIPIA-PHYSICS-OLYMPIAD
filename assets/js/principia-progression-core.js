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
 async function activity(days,when,recordToday){
  const engine=wasm();
  if(!Array.isArray(days)||days.length>10000)throw new TypeError('Danh sách ngày hoạt động không hợp lệ.');
  const normalized=days.filter(day=>typeof day==='string');
  return engine.activityCalendar(normalized,dateKey(when),recordToday);
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
  const result=await wasm().progression({xp,...metrics});
  if(!result||!result.level||!Array.isArray(result.achievements))throw new TypeError('Rust returned an invalid progression summary.');
  return result;
 }
 async function level(xp){return (await summarizeWithRust(xp)).level;}
 async function achievements(metrics={}){return (await summarizeWithRust(0,metrics)).achievements;}
 return Object.freeze({dateKey,recordActivity,streak,level,achievements,summarizeWithRust});
});
