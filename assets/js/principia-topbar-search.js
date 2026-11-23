/* PRINCIPIA topbar search: one inline search field beside the back control. */
(()=> {
 'use strict';
 const INPUT_ID='principiaTopbarSearch';
 function mount(){
  const back=document.querySelector('.top .principia-back-btn');
  if(!back||document.getElementById(INPUT_ID))return;
  const parent=back.parentElement;
  if(!parent)return;
  const input=document.createElement('input');
  input.id=INPUT_ID;
  input.type='search';
  input.inputMode='search';
  input.autocomplete='off';
  input.spellcheck=false;
  input.setAttribute('aria-label','Tìm kiếm PRINCIPIA');
  input.placeholder='Tìm bài học, công thức, chủ đề...';
  input.style.cssText=[
   'box-sizing:border-box','display:block','flex:1 1 260px',
   'width:min(420px,38vw)','min-width:min(260px,48vw)',
   'max-width:480px','height:44px','margin:0 12px 0 8px',
   'padding:0 16px','border:1px solid var(--line,#596078)',
   'border-radius:13px','background:var(--card,#171a2b)',
   'color:var(--text,var(--txt,#fff))','font:inherit',
   'font-size:15px','outline-offset:3px'
  ].join(';');
  parent.insertBefore(input,back.nextSibling);
  input.addEventListener('keydown',event=>{
   if(event.key!=='Enter')return;
   event.preventDefault();
   const query=input.value.trim();
   if(!query)return;
   if(typeof window.openPrincipiaGlobalSearch==='function')window.openPrincipiaGlobalSearch(query);
  });
  input.addEventListener('search',()=>{
   if(!input.value&&typeof window.openPrincipiaGlobalSearch==='function')window.openPrincipiaGlobalSearch('');
  });
 }
 function start(){
  mount();
  const observer=new MutationObserver(mount);
  observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('principia:page-changed',mount);
  window.addEventListener('resize',mount,{passive:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});
 else start();
})();