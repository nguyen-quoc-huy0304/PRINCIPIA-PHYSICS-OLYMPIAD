/* PRINCIPIA Motion API: data-pr-motion hooks and intersection reveal */
(()=>{'use strict';
const reduced=()=>window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const allowed=new Set(['float','pulse','spin','orbit','shimmer','breath','wiggle','bounce','swing','heartbeat','wave','glow','tilt','drift','pop','slide-up','slide-down','slide-left','slide-right','zoom-in','zoom-out','flip-x','flip-y','roll-in','blur-in','shake','rubber','squish','tada','rotate-in','reveal','stagger','hover-lift','hover-scale','hover-rotate','hover-glow','press','ripple']);
function apply(root=document){root.querySelectorAll('[data-pr-motion]').forEach(el=>{const name=el.getAttribute('data-pr-motion');if(!allowed.has(name)){el.removeAttribute('data-pr-motion');return;}if(name==='stagger')Array.from(el.children).forEach((child,index)=>child.style.setProperty('--pr-motion-index',index));});}
function reveal(root=document){if(reduced()||!('IntersectionObserver'in window))return;const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('pr-motion-visible');observer.unobserve(entry.target);}}),{threshold:.12});root.querySelectorAll('[data-pr-motion="reveal"]').forEach(el=>observer.observe(el));}
function play(el,name){if(reduced()||!allowed.has(name)||!el)return;el.setAttribute('data-pr-motion',name);el.style.animationIterationCount='1';el.addEventListener('animationend',()=>{el.style.removeProperty('animation-iteration-count');},{once:true});}
function init(root=document){apply(root);reveal(root);}
window.PrincipiaMotion=Object.freeze({names:Object.freeze([...allowed]),init,play,reducedMotion:reduced});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init(),{once:true});else init();
})();
