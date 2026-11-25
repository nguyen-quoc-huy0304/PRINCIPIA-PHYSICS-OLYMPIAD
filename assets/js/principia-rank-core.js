/* PRINCIPIA rank league: rank is derived from earned learning XP; no streak penalties or paid boosts. */
(function(root,factory){
 const api=factory(root);
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.PrincipiaRankCore=api;
})(typeof window!=='undefined'?window:globalThis,function(root){
 'use strict';
 const RANKS=Object.freeze([
  {id:'bronze',name:'Đồng',emblem:'🥉',minXP:0},
  {id:'silver',name:'Bạc',emblem:'🥈',minXP:250},
  {id:'gold',name:'Vàng',emblem:'🥇',minXP:600},
  {id:'platinum',name:'Bạch kim',emblem:'💠',minXP:1100},
  {id:'diamond',name:'Kim cương',emblem:'💎',minXP:1800},
  {id:'elite',name:'Tinh anh',emblem:'⚔️',minXP:2700},
  {id:'master',name:'Cao thủ',emblem:'👑',minXP:3800},
  {id:'challenger',name:'Thách đấu',emblem:'🏆',minXP:5200}
 ]);
 function getRank(value){
  const parsed=Number(value),xp=Number.isFinite(parsed)?Math.max(0,Math.floor(parsed)):0;
  let index=0;
  for(let i=1;i<RANKS.length;i++)if(xp>=RANKS[i].minXP)index=i;
  const current=RANKS[index],next=RANKS[index+1]||null;
  const span=next?next.minXP-current.minXP:0;
  const progress=next?Math.min(100,Math.max(0,(xp-current.minXP)/span*100)):100;
  const division=next?(progress>=66.6667?'I':progress>=33.3333?'II':'III'):null;
  return Object.freeze({
   ...current,xp,rankPoints:xp,currentThreshold:current.minXP,
   nextThreshold:next?next.minXP:null,xpToNext:next?Math.max(0,next.minXP-xp):0,
   progress,division,label:division?current.name+' '+division:current.name,
   nextName:next?next.name:null,isMaxRank:!next
  });
 }
 async function getRankWithRust(value) {
  if(!root.PrincipiaWasmPhysics?.progression)throw new Error('Rust WASM progression engine is unavailable');
  const parsed=Number(value),xp=Number.isFinite(parsed)?Math.max(0,Math.floor(parsed)):0;
  const result=await root.PrincipiaWasmPhysics.progression({xp});
  const data=result?.rank;
  const index=RANKS.findIndex(item=>item.id===data?.id);
  if(index<0||!Number.isFinite(Number(data.progress)))throw new Error('Rust returned an invalid rank');
  const current=RANKS[index],next=RANKS[index+1]||null;
  const progress=Math.max(0,Math.min(100,Number(data.progress)));
  const division=next?(progress>=66.6667?'I':progress>=33.3333?'II':'III'):null;
  return Object.freeze({
   ...current,xp,rankPoints:xp,currentThreshold:current.minXP,
   nextThreshold:next?next.minXP:null,xpToNext:next?Math.max(0,next.minXP-xp):0,
   progress,division,label:division?current.name+' '+division:current.name,
   nextName:next?next.name:null,isMaxRank:!next
  });
 }
 return Object.freeze({RANKS,getRank,getRankWithRust});
});
