/* PRINCIPIA unified interaction layer: lightweight, accessible, no external runtime. */
(()=>{'use strict';
 const ROOT='#app .main';
 const SELECTOR=ROOT+' :is(.card,.panel,.widget,.feature-card,.hero,.section-card)';
 const reduce=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 function setupReveal(){
  if(reduce()||!('IntersectionObserver' in window))return;
  const nodes=document.querySelectorAll(SELECTOR);
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{
   if(e.isIntersecting){e.target.classList.add('pr-final-visible');observer.unobserve(e.target)}
  }),{threshold:.08,rootMargin:'0px 0px -24px 0px'});
  nodes.forEach(node=>{if(node.closest('[hidden]'))return;node.classList.add('pr-final-reveal');observer.observe(node)});
 }
 function setupStagger(){
  document.querySelectorAll(ROOT+' :is(.grid,.cards,.card-grid,.features)').forEach(group=>{
   const children=Array.from(group.children).filter(el=>el.nodeType===1);
   if(children.length<2||children.length>40)return;
   group.dataset.prFinalMotion='stagger';
   children.forEach((el,i)=>el.style.setProperty('--pr-final-index',String(i)));
  });
 }
 function start(){setupReveal();setupStagger()}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();