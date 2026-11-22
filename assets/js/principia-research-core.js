/* PRINCIPIA Research Notebook core. Local-first, validated experiment records. */
(function(root){
 'use strict';
 const KEY='principia_research_notebook_v1',VERSION=1,MAX_RECORDS=500,MAX_POINTS=10000;
 const text=(v,n)=>String(v==null?'':v).trim().slice(0,n);
 function parsePoints(raw){
  const lines=String(raw||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);
  if(lines.length<2||lines.length>MAX_POINTS)throw new Error('Cần từ 2 đến 10.000 dòng số liệu.');
  return lines.map((line,i)=>{const c=line.split(/[;,\t ]+/).filter(Boolean);if(c.length!==2)throw new Error('Dòng '+(i+1)+' phải có đúng hai số X,Y.');const x=Number(c[0]),y=Number(c[1]);if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Dòng '+(i+1)+' chứa số không hợp lệ.');return {x,y}});
 }
 function summarize(points){
  if(!Array.isArray(points)||points.length<2||points.length>MAX_POINTS)throw new Error('Số điểm đo không hợp lệ.');
  const n=points.length,mean=points.reduce((s,p)=>s+p.y,0)/n,variance=points.reduce((s,p)=>s+(p.y-mean)**2,0)/(n-1);
  const xmean=points.reduce((s,p)=>s+p.x,0)/n,ymean=mean;
  const sxx=points.reduce((s,p)=>s+(p.x-xmean)**2,0),sxy=points.reduce((s,p)=>s+(p.x-xmean)*(p.y-ymean),0);
  const slope=sxx?sxy/sxx:null,intercept=slope===null?null:ymean-slope*xmean;
  return {count:n,mean,standardDeviation:Math.sqrt(variance),standardError:Math.sqrt(variance/n),slope,intercept};
 }
 function validate(record){
  if(!record||typeof record!=='object')throw new Error('Bản ghi thí nghiệm không hợp lệ.');
  const title=text(record.title,120);if(!title)throw new Error('Hãy đặt tên thí nghiệm.');const id=text(record.id,80)||'exp-'+Date.now().toString(36);if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw new Error('Mã thí nghiệm chỉ được chứa chữ, số, dấu gạch ngang và gạch dưới.');
  const points=Array.isArray(record.points)?record.points.map(p=>({x:Number(p.x),y:Number(p.y)})):parsePoints(record.rawPoints);
  if(points.length<2||points.length>MAX_POINTS||points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y)))throw new Error('Dữ liệu đo không hợp lệ.');
  return {id,title,question:text(record.question,1000),method:text(record.method,3000),xUnit:text(record.xUnit,30),yUnit:text(record.yUnit,30),points,summary:summarize(points),createdAt:text(record.createdAt,40)||new Date().toISOString()};
 }
 function createStore(storage){
  const io=storage||{getItem:k=>root.localStorage.getItem(k),setItem:(k,v)=>root.localStorage.setItem(k,v)};
  function all(){try{const raw=JSON.parse(io.getItem(KEY)||'[]');return Array.isArray(raw)?raw.map(validate):[]}catch(_){return []}}
  function write(items){if(items.length>MAX_RECORDS)throw new Error('Tối đa 500 thí nghiệm.');io.setItem(KEY,JSON.stringify(items))}
  return {all,save(r){const item=validate(r),items=all(),i=items.findIndex(x=>x.id===item.id);if(i<0&&items.length>=MAX_RECORDS)throw new Error('Đã đạt giới hạn 500 thí nghiệm.');if(i<0)items.unshift(item);else items[i]=item;write(items);return item},remove(id){write(all().filter(x=>x.id!==id))},export(){return JSON.stringify({schema:'principia-research-notebook',version:VERSION,experiments:all()},null,2)},import(raw){if(typeof raw!=='string'||raw.length>5*1024*1024)throw new Error('Tệp vượt giới hạn 5 MB.');const pack=JSON.parse(raw);if(!pack||pack.schema!=='principia-research-notebook'||pack.version!==VERSION||!Array.isArray(pack.experiments)||pack.experiments.length>MAX_RECORDS)throw new Error('Tệp không đúng định dạng sổ nghiên cứu PRINCIPIA.');const incoming=pack.experiments.map(validate),map=new Map(all().map(x=>[x.id,x]));incoming.forEach(x=>map.set(x.id,x));write([...map.values()]);return incoming.length}};
 }
 const api={parsePoints,summarize,validate,createStore,KEY,VERSION};if(typeof module!=='undefined'&&module.exports)module.exports=api;root.PrincipiaResearchCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
