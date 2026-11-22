/* PRINCIPIA Global Search — lightweight, local-first */
(()=> {
 'use strict';
 const escHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const flatten=(nodes,out=[],kind='lesson',trail=[])=>{
  if(!Array.isArray(nodes))return out;
  for(const n of nodes){
   if(!n||typeof n!=='object')continue;
   const path=[...trail,n.name||''].filter(Boolean);
   const nodeKind=n.type==='quiz'?'quiz':n.type==='fun'?'fun':n.type==='lesson'?'lesson':kind;
   if(n.name||n.content||n.questions?.length)out.push({id:n.id,name:n.name||'Không tên',content:n.content||'',path:path.join(' › '),kind:nodeKind,questions:n.questions||[]});
   if(Array.isArray(n.children))flatten(n.children,out,nodeKind,path);
  }
  return out;
 };
 function collect(){
  const all=[];
  try{if(typeof data!=='undefined')flatten(data,all,'lesson')}catch(_){}
  try{if(typeof quizData!=='undefined')flatten(quizData,all,'quiz')}catch(_){}
  try{if(typeof funData!=='undefined')flatten(funData,all,'fun')}catch(_){}
  const seen=new Set();return all.filter(x=>x.id&&!seen.has(x.kind+':'+x.id)&&seen.add(x.kind+':'+x.id));
 }
 let overlay=null,items=[],active=0,selectedKind='all',lastQuery='';
 const readRecent=()=>{try{const v=JSON.parse(localStorage.getItem('principia_global_search_recent_v1')||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').slice(0,6):[]}catch(_){return[]}};
 const saveRecent=q=>{const v=String(q||'').trim();if(v.length<2)return;try{localStorage.setItem('principia_global_search_recent_v1',JSON.stringify([v,...readRecent().filter(x=>x.toLocaleLowerCase('vi')!==v.toLocaleLowerCase('vi'))].slice(0,6)))}catch(_){}};
 function ensure(){
  if(overlay)return overlay;
  overlay=document.createElement('div');overlay.id='principiaGlobalSearch';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(5,7,18,.72);backdrop-filter:blur(9px);display:none;align-items:flex-start;justify-content:center;padding: min(12vh,90px) 14px 20px';
  overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Tìm kiếm PRINCIPIA" style="width:min(680px,100%);max-height:78vh;overflow:hidden;border:1px solid var(--line,#555);border-radius:20px;background:var(--card,#171526);color:var(--text,#fff);box-shadow:0 24px 90px #0008"><header style="padding:17px 18px;border-bottom:1px solid var(--line,#555);display:flex;gap:12px;align-items:center"><span style="font-size:22px">⌕</span><input id="principiaGlobalSearchInput" type="search" placeholder="Tìm bài học, công thức, chủ đề..." autocomplete="off" style="flex:1;min-width:0;background:transparent;border:0;outline:0;color:inherit;font:inherit;font-size:16px"><button type="button" id="principiaGlobalSearchClose" aria-label="Đóng" style="border:0;background:transparent;color:inherit;font-size:22px">×</button></header><nav id="principiaGlobalSearchFilters" aria-label="Lọc loại nội dung" style="display:flex;gap:7px;overflow:auto;padding:10px 12px 0"><button type="button" data-kind="all">Tất cả</button><button type="button" data-kind="lesson">Bài học</button><button type="button" data-kind="quiz">Quiz</button><button type="button" data-kind="fun">Khám phá</button></nav><div id="principiaGlobalSearchResults" style="padding:10px;overflow:auto;max-height:58vh"></div><footer style="padding:10px 16px;border-top:1px solid var(--line,#555);font-size:11px;opacity:.65">Enter để mở · Esc để đóng · Tìm kiếm trên dữ liệu PRINCIPIA hiện có</footer></section>';
  overlay.addEventListener('click',e=>{if(e.target===overlay)close()});
  document.body.appendChild(overlay);
  overlay.querySelector('#principiaGlobalSearchClose').addEventListener('click',close);
  overlay.querySelectorAll('#principiaGlobalSearchFilters button').forEach(b=>{b.style.cssText='border:1px solid var(--line,#555);border-radius:20px;padding:7px 12px;background:transparent;color:inherit;white-space:nowrap';b.addEventListener('click',()=>{selectedKind=b.dataset.kind;renderResults(overlay.querySelector('input').value);paintFilters()})});
  overlay.querySelector('#principiaGlobalSearchInput').addEventListener('input',e=>renderResults(e.target.value));
  overlay.querySelector('#principiaGlobalSearchInput').addEventListener('keydown',e=>{
   if(e.key==='ArrowDown'&&items.length){e.preventDefault();active=Math.min(active+1,items.length-1);paint()}
   if(e.key==='ArrowUp'&&items.length){e.preventDefault();active=Math.max(0,active-1);paint()}
   if(e.key==='Enter'){e.preventDefault();openSelected()}
  });
  return overlay;
 }
 function close(){if(overlay)overlay.style.display='none'}
 function paintFilters(){overlay?.querySelectorAll('#principiaGlobalSearchFilters button').forEach(b=>{const on=b.dataset.kind===selectedKind;b.style.background=on?'var(--card2,#29263d)':'transparent';b.style.borderColor=on?'var(--accent,#9b87ff)':'var(--line,#555)'})}
 function open(){const el=ensure();el.style.display='flex';selectedKind='all';const input=el.querySelector('input');input.value='';renderResults('');paintFilters();setTimeout(()=>input.focus(),20)}
 function renderResults(q){
  const term=String(q||'').trim().toLocaleLowerCase('vi');
  const source=collect();
  lastQuery=String(q||'').trim();
  const matches=term?source.filter(x=>(selectedKind==='all'||x.kind===selectedKind)&&(x.name+' '+x.path+' '+x.content+' '+x.questions.map(z=>[z.q,...(z.a||[]),z.explanation||''].join(' ')).join(' ')).toLocaleLowerCase('vi').includes(term)):source.filter(x=>selectedKind==='all'||x.kind===selectedKind);
  items=matches.slice(0,40);
  active=0;paint();paintFilters();
 }
 function paint(){
  const root=overlay?.querySelector('#principiaGlobalSearchResults');if(!root)return;
  if(!items.length){const recent=readRecent();root.innerHTML='<div style="padding:22px 12px;text-align:center;opacity:.7">Không tìm thấy nội dung phù hợp.</div>'+(recent.length?'<div style="padding:4px 8px"><small style="opacity:.65">TÌM GẦN ĐÂY</small><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px">'+recent.map(x=>'<button type="button" data-recent="'+escHTML(x)+'" style="border:1px solid var(--line,#555);border-radius:18px;padding:7px 10px;background:transparent;color:inherit">'+escHTML(x)+'</button>').join('')+'</div></div>':'');root.querySelectorAll('[data-recent]').forEach(b=>b.addEventListener('click',()=>{const input=overlay.querySelector('input');input.value=b.dataset.recent;renderResults(input.value)}));return}
  root.innerHTML=items.map((x,i)=>'<button type="button" data-index="'+i+'" style="display:flex;width:100%;text-align:left;gap:12px;align-items:flex-start;padding:12px;border:0;border-radius:12px;background:'+(i===active?'var(--card2, #29263d)':'transparent')+';color:inherit;cursor:pointer"><span style="font-size:19px">'+(x.kind==='quiz'?'🎯':x.kind==='fun'?'🧩':'📘')+'</span><span style="min-width:0"><b style="display:block">'+escHTML(x.name)+'</b><small style="display:block;opacity:.65;margin-top:3px">'+escHTML(x.path)+'</small><small style="display:block;opacity:.72;margin-top:5px">'+escHTML((x.content||x.questions?.[0]?.q||'').slice(0,150))+'</small></span></button>').join('');
  root.querySelectorAll('button[data-index]').forEach(b=>{b.addEventListener('mouseenter',()=>{active=Number(b.dataset.index);paint()});b.addEventListener('click',()=>{active=Number(b.dataset.index);openSelected()})});
 }
 function openSelected(){
  const x=items[active];if(!x)return;saveRecent(lastQuery);close();
  try{
   if(x.kind==='lesson'&&typeof openLesson==='function')openLesson(x.id);
   else if(x.kind==='quiz'&&typeof openQuiz==='function')openQuiz(x.id);
   else if(x.kind==='fun'&&typeof openFun==='function')openFun(x.id);
   else if(typeof setPage==='function')setPage(x.kind==='fun'?'fun':x.kind==='quiz'?'quiz':'library');
  }catch(e){console.error('PRINCIPIA search navigation failed',e)}
 }
 window.openPrincipiaGlobalSearch=open;
 document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();open()}
  if(e.key==='Escape'&&overlay?.style.display==='flex')close();
 });
 function addTrigger(){
  if(document.getElementById('principiaSearchTrigger'))return;
  const b=document.createElement('button');b.id='principiaSearchTrigger';b.type='button';b.title='Tìm kiếm toàn PRINCIPIA (Ctrl+K)';b.setAttribute('aria-label','Tìm kiếm PRINCIPIA');b.textContent='⌕';
  b.style.cssText='position:fixed;right:18px;bottom:calc(82px + env(safe-area-inset-bottom,0px));z-index:1200;width:46px;height:46px;border-radius:15px;border:1px solid var(--line,#777);background:var(--card,#171526);color:var(--text,#fff);font-size:27px;box-shadow:0 8px 28px #0004;cursor:pointer';
  b.addEventListener('click',open);document.body.appendChild(b);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addTrigger,{once:true});else addTrigger();
})();
