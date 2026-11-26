/* PRINCIPIA weekly season adapter: calendar boundaries in JS, mission rules in Rust. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.PrincipiaSeasonCore=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 function dateKey(value){
  const date=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid date');
  return date.getFullYear()+'-'+String(date.getMonth()+1).padStart(2,'0')+'-'+String(date.getDate()).padStart(2,'0');
 }
 function weekKey(value){
  const date=value instanceof Date?new Date(value):new Date(value);
  if(!Number.isFinite(date.getTime()))throw new Error('Invalid date');
  date.setHours(0,0,0,0);
  date.setDate(date.getDate()-((date.getDay()+6)%7));
  return dateKey(date);
 }
 function localRecordDate(value){
  const raw=String(value||'');
  if(/^\\d{4}-\\d{2}-\\d{2}$/.test(raw))return raw;
  const date=new Date(raw);
  return Number.isFinite(date.getTime())?dateKey(date):'';
 }
 function countMetric(value){
  const number=Number(value);
  return Number.isFinite(number)&&number>0?Math.min(1_000_000,Math.floor(number)):0;
 }
 function engine(){
  if(!root.PrincipiaWasmPhysics?.seasonMissions||!root.PrincipiaWasmPhysics?.claimSeasonMission)
   throw new Error('Rust weekly season engine is unavailable');
  return root.PrincipiaWasmPhysics;
 }
 async function missions(records={},now=new Date()){
  const week=weekKey(now),start=new Date(week+'T00:00:00');
  start.setDate(start.getDate()+7);
  const attempts=(Array.isArray(records.attempts)?records.attempts:[]).slice(0,10000)
   .map(item=>({date:localRecordDate(item?.date),total:countMetric(item?.total)}));
  const notes=(Array.isArray(records.notes)?records.notes:[]).slice(0,10000)
   .map(item=>({date:localRecordDate(item?.date)}));
  const result=await engine().seasonMissions({week,weekEnd:dateKey(start),attempts,notes});
  if(!Array.isArray(result)||result.length!==3||result.some(item=>
   typeof item.id!=='string'||typeof item.name!=='string'||typeof item.description!=='string'
   ||!Number.isInteger(item.value)||!Number.isInteger(item.target)||!Number.isInteger(item.xp)
   ||typeof item.complete!=='boolean'||!Number.isInteger(item.progress)||item.progress<0||item.progress>100
   ||item.week!==week))throw new TypeError('Rust returned invalid weekly season missions');
  return result;
 }
 async function claim(id,value,alreadyClaimed){
  const result=await engine().claimSeasonMission({id:String(id),value:countMetric(value),alreadyClaimed:!!alreadyClaimed});
  if(!result||typeof result.allowed!=='boolean'||!Number.isInteger(result.reward)||result.reward<0||result.reward>1000)
   throw new TypeError('Rust returned an invalid season mission claim');
  return result;
 }
 return Object.freeze({dateKey,weekKey,missions,claim,countMetric});
});
