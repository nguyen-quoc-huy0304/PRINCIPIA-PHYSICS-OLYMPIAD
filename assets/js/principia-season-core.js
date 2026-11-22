/* PRINCIPIA weekly season missions — local, deterministic and testable. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.PrincipiaSeasonCore=api;})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function dateKey(value){const d=value instanceof Date?value:new Date(value);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date');return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
 function weekKey(value){const d=value instanceof Date?new Date(value):new Date(value);if(!Number.isFinite(d.getTime()))throw new Error('Invalid date');d.setHours(0,0,0,0);const day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return dateKey(d)}
 function missions(metrics={},now=new Date()){
  const key=weekKey(now),m=metrics||{};
  const defs=[['practice','Chiến binh luyện tập','Hoàn thành 3 lượt luyện',Number(m.sessions)||0,3,60],['questions','Bậc thầy câu hỏi','Trả lời 30 câu hỏi',Number(m.questions)||0,30,80],['notes','Nhà ghi chép','Lưu 2 ghi chú học tập',Number(m.notes)||0,2,40]];
  return defs.map(([id,name,description,value,target,xp])=>({id,name,description,value:Math.max(0,value),target,xp,complete:value>=target,progress:Math.min(100,Math.round(Math.max(0,value)/target*100)),week:key}));
 }
 function canClaim(list,id,claimed){const item=(Array.isArray(list)?list:[]).find(x=>x.id===id);return !!item&&item.complete&&!(Array.isArray(claimed)?claimed:[]).includes(item.week+':'+id)}
 return {dateKey,weekKey,missions,canClaim};
});
