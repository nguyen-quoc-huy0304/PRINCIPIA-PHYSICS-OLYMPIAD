/* PRINCIPIA progression: deterministic streaks, XP levels and achievement milestones. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.PrincipiaProgressionCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 const LEVELS=[0,100,250,450,700,1000,1400,1900,2500,3200,4000];
 const TITLES=['Tân binh','Tập sự','Khám phá','Nhà nghiên cứu','Chuyên gia','Bậc thầy','Học giả','Huyền thoại','Thiên tài','Olympian','Grand Olympian'];
 function dateKey(value){
  const d=value instanceof Date?value:new Date(value);
  if(!Number.isFinite(d.getTime()))throw new Error('Ngày hoạt động không hợp lệ.');
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
 }
 function validDateKey(value){
  if(typeof value!=='string'||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(value))return false;
  const parsed=new Date(value+'T12:00:00');
  return Number.isFinite(parsed.getTime())&&dateKey(parsed)===value;
 }
 function recordActivity(days,when=new Date()){
  const key=dateKey(when),list=Array.isArray(days)?days.filter(validDateKey):[],unique=[...new Set(list)].sort();
  if(!unique.includes(key))unique.push(key);
  return unique.sort().slice(-3650);
 }
 function streak(days,today=new Date()){
  const set=new Set(Array.isArray(days)?days.filter(validDateKey):[]),key=dateKey(today),prev=new Date(today instanceof Date?today:today);
  const yesterday=new Date(prev);yesterday.setDate(yesterday.getDate()-1);
  let current=set.has(key)||set.has(dateKey(yesterday))?0:0;
  let cursor=new Date(set.has(key)?key+'T12:00:00':dateKey(yesterday)+'T12:00:00');
  if(!set.has(key)&&!set.has(dateKey(yesterday)))return {current:0,longest:longest(days),activeToday:false};
  while(set.has(dateKey(cursor))){current++;cursor.setDate(cursor.getDate()-1)}
  return {current,longest:Math.max(current,longest(days)),activeToday:set.has(key)};
 }
 function longest(days){
  const sorted=[...new Set(Array.isArray(days)?days.filter(validDateKey):[])].sort();
  let best=0,run=0,last=null;
  sorted.forEach(k=>{const d=new Date(k+'T12:00:00');if(last){const n=new Date(last);n.setDate(n.getDate()+1);run=dateKey(n)===k?run+1:1}else run=1;best=Math.max(best,run);last=d});
  return best;
 }
 function level(xp){
  const value=Math.max(0,Number(xp)||0);let index=0;
  for(let i=0;i<LEVELS.length;i++)if(value>=LEVELS[i])index=i;
  const next=LEVELS[index+1]??null,base=LEVELS[index];
  return {level:index+1,title:TITLES[index],xp:value,currentThreshold:base,nextThreshold:next,progress:next===null?100:Math.max(0,Math.min(100,(value-base)/(next-base)*100)),xpToNext:next===null?0:Math.max(0,next-value)};
 }
 function achievements(m={}){
  const checks=[
   ['first-session','Khởi động','Hoàn thành lượt luyện đầu tiên',Number(m.sessions)>=1,Number(m.sessions)||0,1],
   ['century-questions','Trăm câu hỏi','Trả lời 100 câu hỏi',Number(m.questions)>=100,Number(m.questions)||0,100],
   ['olympic-ace','Điểm sáng Olympic','Đạt ít nhất 90% trong một lượt',Number(m.bestPercent)>=90,Number(m.bestPercent)||0,90],
   ['five-sessions','Bền bỉ','Hoàn thành 5 lượt luyện',Number(m.sessions)>=5,Number(m.sessions)||0,5],
   ['ten-lessons','Chinh phục bài học','Hoàn thành 10 bài học',Number(m.lessons)>=10,Number(m.lessons)||0,10],
   ['streak-seven','Một tuần khoa học','Học 7 ngày liên tiếp',Number(m.streak)>=7,Number(m.streak)||0,7],
   ['researcher','Nhà nghiên cứu','Lưu 5 thí nghiệm',Number(m.experiments)>=5,Number(m.experiments)||0,5],
   ['creator','Nhà kiến tạo','Tạo 3 màn chơi',Number(m.levels)>=3,Number(m.levels)||0,3]
  ];
  return checks.map(([id,name,description,unlocked,value,target])=>({id,name,description,unlocked,value,target,percent:Math.min(100,Math.round(value/target*100))}));
 }
 async function summarizeWithRust(xp,metrics={}) {
  if(!root.PrincipiaWasmPhysics?.progression)throw new Error('Rust WASM progression engine is unavailable');
  return root.PrincipiaWasmPhysics.progression({xp,...metrics});
 }
 return {dateKey,recordActivity,streak,level,achievements,summarizeWithRust,LEVELS};
});
