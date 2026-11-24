/* PRINCIPIA Reference UI interactions — vanilla JS, no React or runtime dependency. */
(()=> {
 'use strict';
 const CARD='#app .panel,#app .stat,#app .tile';
 const EXCLUDED='.modal,.modalbg,[role="dialog"],#principiaM3ECanvasWorkspace,#proSiteEditorPanel,.chat-box,.principia-mobile-nav';
 const reduce=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 const finePointer=window.matchMedia?.('(hover:hover) and (pointer:fine)').matches??false;
 let observer=null;
 let mutation=null;
 let lastFaviconHref='';
 const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));

 function mark(root=document){
  const nodes=[];
  if(root instanceof Element&&root.matches(CARD))nodes.push(root);
  if(root.querySelectorAll)nodes.push(...root.querySelectorAll(CARD));
  nodes.forEach(node=>{
   if(node.closest(EXCLUDED)||node.dataset.prUiCard==='1')return;
   node.dataset.prUiCard='1';
  });
  root.querySelectorAll?.('#app button:not([data-pr-ui-button])').forEach(button=>{
   if(button.closest(EXCLUDED)||button.closest('.principia-mobile-nav'))return;
   button.dataset.prUiButton='1';
  });
  root.querySelectorAll?.('[aria-busy="true"],[data-ai-state="thinking"],.ai-thinking,.ai-loading,.thinking,.typing-indicator').forEach(node=>{
   if(!node.closest(EXCLUDED))node.classList.add('pr-ref-thinking');
  });
  root.querySelectorAll?.('[role="progressbar"],.progress,.xpbar').forEach(node=>node.classList.add('pr-ref-progress'));
 }

 function setupReveal(){
  if(reduce||!('IntersectionObserver'in window))return;
  observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('pr-in-view');observer.unobserve(entry.target)}
   });
  },{threshold:.07,rootMargin:'0px 0px -24px 0px'});
  document.querySelectorAll('#app .pr-motion-item').forEach(node=>observer.observe(node));
 }

 function setupTilt(){
  if(reduce||!finePointer)return;
  document.addEventListener('pointermove',event=>{
   const card=event.target instanceof Element?event.target.closest('#app .tile[data-pr-ui-card],#app .stat[data-pr-ui-card]'):null;
   if(!card||card.closest(EXCLUDED))return;
   const rect=card.getBoundingClientRect();
   const x=(event.clientX-rect.left)/rect.width;
   const y=(event.clientY-rect.top)/rect.height;
   const rx=clamp((.5-y)*4,-2,2);
   const ry=clamp((x-.5)*5,-2.5,2.5);
   card.style.transform='perspective(900px) rotateX('+rx.toFixed(2)+'deg) rotateY('+ry.toFixed(2)+'deg) translateY(-2px)';
  },{passive:true});
  document.addEventListener('pointerout',event=>{
   const card=event.target instanceof Element?event.target.closest('#app .tile[data-pr-ui-card],#app .stat[data-pr-ui-card]'):null;
   if(card&&!card.contains(event.relatedTarget))card.style.transform='';
  },{passive:true});
 }

 function setupFavicon(){
  const link=document.querySelector('link[rel~="icon"]');
  if(!link||!link.href)return;
  lastFaviconHref=link.href;
  const update=count=>{
   if(!count){link.href=lastFaviconHref;return}
   const image=new Image();
   image.onload=()=>{
    const canvas=document.createElement('canvas');canvas.width=64;canvas.height=64;
    const ctx=canvas.getContext('2d');if(!ctx)return;
    ctx.drawImage(image,0,0,64,64);
    ctx.fillStyle='#ef476f';ctx.beginPath();ctx.arc(48,16,15,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#fff';ctx.font='bold 18px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(count>99?'99+':String(count),48,16);
    link.href=canvas.toDataURL('image/png');
   };
   image.src=lastFaviconHref;
  };
  window.PrincipiaFavicon=Object.freeze({setCount:value=>update(Math.max(0,Math.min(999,Number(value)||0)))});
 }

 function init(){
  mark();
  setupReveal();
  setupTilt();
  setupFavicon();
  mutation=new MutationObserver(records=>{
   records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)mark(node)}));
   if(!reduce)document.querySelectorAll('#app .pr-motion-item:not(.pr-in-view)').forEach(node=>observer?.observe(node));
  });
  mutation.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
  document.addEventListener('principia:rendered',()=>mark());
  document.addEventListener('principia:page-changed',()=>mark());
  window.addEventListener('pagehide',()=>{observer?.disconnect();mutation?.disconnect()},{once:true});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();