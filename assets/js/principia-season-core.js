/* PRINCIPIA weekly season missions — local, deterministic and testable. */
(function(root,factory){const api=factory(root);if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.PrincipiaSeasonCore=api;})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 let seasonCore=null;
 if(root.PrincipiaWasmPhysics&&typeof root.PrincipiaWasmPhysics.load==='function'){
  root.PrincipiaWasmPhysics.load().then(module=>{seasonCore=module;}).catch(()=>{});
 }
 function dateKey(value){const d=value instanceof Date?value:new Date(value);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date');return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function weekKey(value){const d=value instanceof Date?new Date(value):new Date(value);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date');d.setHours(0,0,0,0);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return dateKey(d)}
 function countMetric(value){const n=Number(value);return Number.isFinite(n)&&n>0?Math.min(Number.MAX_SAFE_INTEGER,Math.floor(n)):0}
 function missions(metrics={},now=new Date()){
  const key=weekKey(now),m=metrics||{};
  if(seasonCore&&typeof seasonCore.season_missions_json==='function'){
   const payload={sessions:countMetric(m.sessions),questions:countMetric(m.questions),notes:countMetric(m.notes)};
   return JSON.parse(seasonCore.season_missions_json(JSON.stringify(payload),dateKey(now)));
  }

  const key=weekKey(now),m=metrics||{};
  const defs=[['practice','Chiến binh luyện tập','Hoàn thành 3 lượt luyện',countMetric(m.sessions),3,60],['questions','Bậc thầy câu hỏi','Trả lời 30 câu hỏi',countMetric(m.questions),30,80],['notes','Nhà ghi chép','Lưu 2 ghi chú học tập',countMetric(m.notes),2,40]];
  return defs.map(([id,name,description,value,target,xp])=>({id,name,description,value:Math.max(0,value),target,xp,complete:value>=target,progress:Math.min(100,Math.round(Math.max(0,value)/target*100)),week:key}));
 }
 function canClaim(list,id,claimed){const item=(Array.isArray(list)?list:[]).find(x=>x.id===id);return !!item&&item.complete&&!(Array.isArray(claimed)?claimed:[]).includes(item.week+':'+id)}
 return {dateKey,weekKey,missions,canClaim,countMetric};
});
