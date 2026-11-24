/* PRINCIPIA Kinetic UI — Anime.js runtime + native responsive interaction adapters. */
(() => {
'use strict';
const REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
const FINE=window.matchMedia?.('(hover:hover) and (pointer:fine)').matches??false;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let routePending=false;
function animateRoute(){
 const body=document.querySelector('#app .main #body');
 if(!body||REDUCED)return;
 const anime=window.anime;
 if(typeof anime?.animate==='function'){
  anime.animate(body,{opacity:[0,1],y:[14,0],filter:['blur(4px)','blur(0px)'],duration:440,ease:'out(3)'});
  return;
 }
 if(body.animate)body.animate([{opacity:0,transform:'translate3d(0,13px,0)',filter:'blur(4px)'},{opacity:1,transform:'translate3d(0,0,0)',filter:'blur(0)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'});
}
function mountBeams(){document.querySelectorAll('#app .hero,#principiaLabTools>.panel,#principia-collision-lab,#principiaLabCodeStudio,.per-card').forEach(node=>{if(node.dataset.prKineticBeam)return;node.dataset.prKineticBeam='1';node.classList.add('pr-kinetic-beam');const beam=document.createElement('span');beam.className='pr-kinetic-beam-light';beam.setAttribute('aria-hidden','true');node.append(beam)})}
function setupMagnetic(){if(!FINE||REDUCED)return;document.addEventListener('pointermove',e=>{const b=e.target instanceof Element?e.target.closest('#app .hero .primary,#app .sectionhead .toolbar button,#principiaLabCodeStudio .pr-code-run'):null;if(!b||b.disabled||b.closest('#proSiteEditorPanel,.principia-mobile-nav'))return;const r=b.getBoundingClientRect(),x=clamp((e.clientX-r.left-r.width/2)/Math.max(r.width,1),-1,1),y=clamp((e.clientY-r.top-r.height/2)/Math.max(r.height,1),-1,1);b.style.setProperty('--pr-magnetic-x',(x*3.2).toFixed(2)+'px');b.style.setProperty('--pr-magnetic-y',(y*3.2).toFixed(2)+'px');b.classList.add('pr-magnetic-active')},{passive:true});document.addEventListener('pointerout',e=>{const b=e.target instanceof Element?e.target.closest('.pr-magnetic-active'):null;if(b&&!b.contains(e.relatedTarget)){b.style.removeProperty('--pr-magnetic-x');b.style.removeProperty('--pr-magnetic-y');b.classList.remove('pr-magnetic-active')}},{passive:true})}
function setupHairlineFigure(){
 if(!FINE||REDUCED)return;
 document.addEventListener('pointermove',e=>{
  const figure=e.target instanceof Element?e.target.closest('#principiaLabCodeStudio .pr-code-mark'):null;
  if(!figure)return;
  const r=figure.getBoundingClientRect(),x=clamp((e.clientX-r.left-r.width/2)/Math.max(r.width,1),-1,1),y=clamp((e.clientY-r.top-r.height/2)/Math.max(r.height,1),-1,1);
  figure.style.setProperty('--pr-figure-x',(x*8).toFixed(2)+'deg');
  figure.style.setProperty('--pr-figure-y',(-y*6).toFixed(2)+'deg');
 },{passive:true});
}
function setupMascotGaze(){if(!FINE||REDUCED)return;let last=0;document.addEventListener('pointermove',e=>{const now=performance.now();if(now-last<42)return;last=now;const m=document.querySelector('#app .principia-bundled-pose');if(!m)return;const r=m.getBoundingClientRect(),dx=clamp((e.clientX-(r.left+r.width/2))/Math.max(innerWidth,1),-.5,.5),dy=clamp((e.clientY-(r.top+r.height/2))/Math.max(innerHeight,1),-.5,.5);m.style.setProperty('--pr-mascot-x',(dx*7).toFixed(2)+'deg');m.style.setProperty('--pr-mascot-y',(-dy*5).toFixed(2)+'deg')},{passive:true})}
function setupAnimePress(){
 if(REDUCED||typeof window.anime?.animate!=='function')return;
 document.addEventListener('pointerdown',e=>{
  const target=e.target instanceof Element?e.target.closest('#app button.primary,#app button.secondary,#principiaLabCodeStudio button'):null;
  if(!target||target.disabled||target.closest('#proSiteEditorPanel'))return;
  window.anime.animate(target,{scale:[1,.965,1],duration:260,ease:'out(3)'});
 },{passive:true});
}
function init(){if(!REDUCED){window.addEventListener('principia:page-changed',()=>{routePending=true});document.addEventListener('principia:rendered',()=>{if(routePending){routePending=false;animateRoute()}mountBeams()});mountBeams();setupMagnetic();setupHairlineFigure();setupMascotGaze();setupAnimePress()}window.PrincipiaKinetic=Object.freeze({refresh:mountBeams,animateRoute})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();