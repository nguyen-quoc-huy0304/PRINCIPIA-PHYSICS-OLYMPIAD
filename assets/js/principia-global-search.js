/* PRINCIPIA Global Search — lightweight, local-first */
(()=> {
 'use strict';
 const escHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const MAX_QUERY_LENGTH=160;
 const normalizeQuery=query=>String(query??'').trim().slice(0,MAX_QUERY_LENGTH);
 async function collect(query){
  const term=normalizeQuery(query);
  if(typeof window.PrincipiaWasmPhysics?.globalSearchIndex!=='function')throw new Error('Rust global search is unavailable');
  const catalogs=[];
  try{catalogs.push([typeof data!=='undefined'&&Array.isArray(data)?data:[],'lesson'])}catch(_){catalogs.push([[],'lesson'])}
  try{catalogs.push([typeof quizData!=='undefined'&&Array.isArray(quizData)?quizData:[],'quiz'])}catch(_){catalogs.push([[],'quiz'])}
  try{catalogs.push([typeof funData!=='undefined'&&Array.isArray(funData)?funData:[],'fun'])}catch(_){catalogs.push([[],'fun'])}
  const indexed=await Promise.all(catalogs.map(async([catalog,kind])=>{
   if(!catalog.length)return{kind,items:[],skipped:true,failed:false};
   try{
    const result=await window.PrincipiaWasmPhysics.globalSearchIndex(catalog,term,kind);
    if(!result||!Array.isArray(result.items))throw new TypeError('Rust global search returned an invalid index');
    return{kind,items:result.items.filter(item=>item&&typeof item==='object').map(item=>({...item,kind:typeof item.kind==='string'&&item.kind?item.kind:kind,questions:Array.isArray(item.questions)?item.questions:[]})),skipped:false,failed:false};
   }catch(error){
    console.warn('[PRINCIPIA] Rust global search catalog failed',kind,error);
    return{kind,items:[],skipped:false,failed:true};
   }
  }));
  const attempted=indexed.filter(result=>!result.skipped);
  if(attempted.length&&!attempted.some(result=>!result.failed))throw new Error('Rust global search failed for all catalogs');
  const failedKinds=attempted.filter(result=>result.failed).map(result=>result.kind);
  const seen=new Set();
  const results=indexed.flatMap(result=>result.items).filter(item=>item.id&&!seen.has(item.kind+':'+item.id)&&seen.add(item.kind+':'+item.id));
  if(failedKinds.length)results.failedKinds=failedKinds;
  return results;
 }
 window.PrincipiaGlobalSearchCore=Object.freeze({escapeHTML:escHTML,search:collect,maxQueryLength:MAX_QUERY_LENGTH});
 let searchRequest=0,searchError='',searchPartial=false;
 let overlay=null,items=[],active=0,selectedKind='all',lastQuery='';
 const readRecent=()=>{try{const v=JSON.parse(localStorage.getItem('principia_global_search_recent_v1')||'[]');return Array.isArray(v)?v.filter(x=>typeof x==='string').map(x=>x.slice(0,MAX_QUERY_LENGTH)).filter(x=>x.trim().length>=2).slice(0,6):[]}catch(_){return[]}};
 const saveRecent=q=>{const v=String(q||'').trim();if(v.length<2)return;try{localStorage.setItem('principia_global_search_recent_v1',JSON.stringify([v,...readRecent().filter(x=>x.toLocaleLowerCase('vi')!==v.toLocaleLowerCase('vi'))].slice(0,6)))}catch(_){}};
 function ensure(){
  if(overlay)return overlay;
  overlay=document.createElement('div');overlay.id='principiaGlobalSearch';
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483000;background:rgba(5,7,18,.72);backdrop-filter:blur(9px);display:none;align-items:flex-start;justify-content:center;padding: min(12vh,90px) 14px 20px';
  overlay.innerHTML='<section role="dialog" aria-modal="true" aria-label="Tìm kiếm PRINCIPIA" style="width:min(680px,100%);max-height:78vh;overflow:hidden;border:1px solid var(--line,#555);border-radius:20px;background:var(--card,#171526);color:var(--text,#fff);box-shadow:0 24px 90px #0008"><header style="padding:17px 18px;border-bottom:1px solid var(--line,#555);display:flex;gap:12px;align-items:center"><span style="font-size:22px">⌕</span><input id="principiaGlobalSearchInput" type="search" placeholder="Tìm bài học, công thức, chủ đề..." autocomplete="off" maxlength="160" style="flex:1;min-width:0;background:transparent;border:0;outline:0;color:inherit;font:inherit;font-size:16px"><button type="button" id="principiaGlobalSearchClose" aria-label="Đóng" style="border:0;background:transparent;color:inherit;font-size:22px">×</button></header><nav id="principiaGlobalSearchFilters" aria-label="Lọc loại nội dung" style="display:flex;gap:7px;overflow:auto;padding:10px 12px 0"><button type="button" data-kind="all">Tất cả</button><button type="button" data-kind="lesson">Bài học</button><button type="button" data-kind="quiz">Quiz</button><button type="button" data-kind="fun">Khám phá</button></nav><div id="principiaGlobalSearchResults" style="padding:10px;overflow:auto;max-height:58vh"></div><footer style="padding:10px 16px;border-top:1px solid var(--line,#555);font-size:11px;opacity:.65">Enter để mở · Esc để đóng · Tìm kiếm trên dữ liệu PRINCIPIA hiện có</footer></section>';
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
 function open(initialQuery=''){const el=ensure();el.style.display='flex';selectedKind='all';const input=el.querySelector('input');input.value=normalizeQuery(initialQuery);renderResults(input.value);paintFilters();setTimeout(()=>input.focus(),20)}
 async function renderResults(q){
  const request=++searchRequest;
  const term=normalizeQuery(q);
  lastQuery=term;
  searchError='';searchPartial=false;
  try{
   const source=await collect(term);
   if(request!==searchRequest)return;
   searchPartial=Array.isArray(source.failedKinds)&&source.failedKinds.length>0;
   items=source.filter(item=>selectedKind==='all'||item.kind===selectedKind).slice(0,40);
   active=0;
  }catch(error){
   if(request!==searchRequest)return;
   items=[];active=0;searchPartial=false;searchError=error?.message==='Rust global search is unavailable'?'Không thể tìm kiếm vì lõi Rust/WASM chưa sẵn sàng.':'Không thể tìm kiếm vì các danh mục nội dung đều không phản hồi.';
   console.error('[PRINCIPIA] Rust global search failed',error);
  }
  paint();paintFilters();
 }
 function paint(){
  const root=overlay?.querySelector('#principiaGlobalSearchResults');if(!root)return;
  if(searchError){root.innerHTML='<div role="alert" style="padding:22px 12px;text-align:center;opacity:.8">'+escHTML(searchError)+'</div>';return;}
  const partialNotice=searchPartial?'<div role="status" style="padding:8px 12px;text-align:center;opacity:.7">Một số danh mục nội dung không phản hồi; kết quả có thể chưa đầy đủ.</div>':'';
  if(!items.length){const recent=readRecent();root.innerHTML=partialNotice+'<div style="padding:22px 12px;text-align:center;opacity:.7">Không tìm thấy nội dung phù hợp.</div>'+(recent.length?'<div style="padding:4px 8px"><small style="opacity:.65">TÌM GẦN ĐÂY</small><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:8px">'+recent.map(x=>'<button type="button" data-recent="'+escHTML(x)+'" style="border:1px solid var(--line,#555);border-radius:18px;padding:7px 10px;background:transparent;color:inherit">'+escHTML(x)+'</button>').join('')+'</div></div>':'');root.querySelectorAll('[data-recent]').forEach(b=>b.addEventListener('click',()=>{const input=overlay.querySelector('input');input.value=b.dataset.recent;renderResults(input.value)}));return}
  root.innerHTML=partialNotice+items.map((x,i)=>'<button type="button" data-index="'+i+'" style="display:flex;width:100%;text-align:left;gap:12px;align-items:flex-start;padding:12px;border:0;border-radius:12px;background:'+(i===active?'var(--card2, #29263d)':'transparent')+';color:inherit;cursor:pointer"><span style="font-size:19px">'+(x.kind==='quiz'?'🎯':x.kind==='fun'?'🧩':'📘')+'</span><span style="min-width:0"><b style="display:block">'+escHTML(x.name)+'</b><small style="display:block;opacity:.65;margin-top:3px">'+escHTML(x.path)+'</small><small style="display:block;opacity:.72;margin-top:5px">'+escHTML((x.content||x.questions?.[0]?.q||'').slice(0,150))+'</small></span></button>').join('');
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
