/* PRINCIPIA reference motion layer: Anime.js-powered, progressive and reduced-motion aware. */
(()=> {
 'use strict';
 const ROOT='#app';
 const SURFACES='.card,.panel,.stat,.feature-card,.learning-card,.glass-card,.module-card,.dashboard-card,.lesson-card';
 const BUTTONS='button.primary,button.oli-btn,button.nav,.action-card button';
 const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const seen=new WeakSet();
 let observer=null;
 function animateIn(nodes){
  if(!nodes.length||reduced())return;
  const anime=window.anime;
  if(anime&&typeof anime.animate==='function'){
   anime.animate(nodes,{opacity:[0,1],translateY:[14,0],duration:460,delay:anime.stagger?anime.stagger(42):42,ease:'out(3)'});
   return;
  }
  nodes.forEach(node=>node.classList.add('pr-ref-enter'));
 }
 function prepare(root){
  if(reduced())return;
  const nodes=[...root.querySelectorAll(SURFACES)].filter(node=>!seen.has(node)&&!node.closest('.chat-box,.cl-shell,.principia-welcome-screen'));
  nodes.forEach(node=>{seen.add(node);node.classList.add('pr-ref-surface')});
  const buttons=root.querySelectorAll(BUTTONS);
  buttons.forEach(button=>{if(button.dataset.prMotionBound)return;button.dataset.prMotionBound='1';button.classList.add('pr-ref-button')});
  if(!('IntersectionObserver'in window)){animateIn(nodes);return}
  if(!observer)observer=new IntersectionObserver(entries=>{
   entries.forEach(entry=>{
    if(!entry.isIntersecting)return;
    observer.unobserve(entry.target);
    animateIn([entry.target]);
   });
  },{threshold:.08,rootMargin:'0px 0px -24px 0px'});
  nodes.forEach(node=>observer.observe(node));
 }
 function init(){
  const root=document.querySelector(ROOT);
  if(root)prepare(root);
 }
 document.addEventListener('principia:rendered',()=>requestAnimationFrame(init));
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
 const app=document.querySelector(ROOT);
 if(app&&'MutationObserver'in window)new MutationObserver(()=>requestAnimationFrame(init)).observe(app,{childList:true,subtree:true});
})();