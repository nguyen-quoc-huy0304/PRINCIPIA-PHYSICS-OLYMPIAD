/* PRINCIPIA Kinetic UI — native motion primitives adapted from the supplied libraries. */
(() => {
'use strict';
const REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
const FINE=window.matchMedia?.('(hover:hover) and (pointer:fine)').matches??false;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
let routePending=false,iconLink=null,iconBase=null,iconCount=0;
function animateRoute(){const body=document.querySelector('#app .main #body');if(!body||REDUCED||!body.animate)return;body.animate([{opacity:0,transform:'translate3d(0,13px,0)',filter:'blur(4px)'},{opacity:1,transform:'translate3d(0,0,0)',filter:'blur(0)'}],{duration:420,easing:'cubic-bezier(.2,.8,.2,1)'})}
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
function ensureFavicon(){iconLink=document.querySelector('link[rel~="icon"]');if(!iconLink){iconLink=document.createElement('link');iconLink.rel='icon';document.head.append(iconLink)}iconBase=iconLink.href||''}
function drawFavicon(){ensureFavicon();const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');if(!x)return;x.clearRect(0,0,64,64);const g=x.createLinearGradient(7,5,58,60);g.addColorStop(0,'#a994ff');g.addColorStop(1,'#397fae');x.fillStyle=g;x.beginPath();if(typeof x.roundRect==='function')x.roundRect(5,5,54,54,17);else x.rect(5,5,54,54);x.fill();x.fillStyle='#fff';x.font='800 34px system-ui';x.textAlign='center';x.textBaseline='middle';x.fillText('P',31,34);if(iconCount){x.fillStyle='#ff647f';x.beginPath();x.arc(51,13,12,0,Math.PI*2);x.fill();x.fillStyle='#fff';x.font='800 15px system-ui';x.fillText(iconCount>9?'9+':String(iconCount),51,14)}iconLink.href=c.toDataURL('image/png')}
function setFaviconCount(n){iconCount=clamp(Math.floor(Number(n)||0),0,99);drawFavicon()}
function setFaviconState(state){if(state==='reset'){iconCount=0;ensureFavicon();if(iconBase)iconLink.href=iconBase;return}if(state==='error')setFaviconCount(Math.max(1,iconCount));if(state==='ready')setFaviconState('reset')}
function init(){ensureFavicon();drawFavicon();if(!REDUCED){window.addEventListener('principia:page-changed',()=>{routePending=true});document.addEventListener('principia:rendered',()=>{if(routePending){routePending=false;animateRoute()}mountBeams()});mountBeams();setupMagnetic();setupMascotGaze()}window.addEventListener('principia:notification',e=>{if(document.hidden)setFaviconCount(iconCount+1);if(e.detail?.state)setFaviconState(e.detail.state)});document.addEventListener('visibilitychange',()=>{if(!document.hidden)setFaviconState('reset')});window.PrincipiaKinetic=Object.freeze({setFaviconCount,setFaviconState,getFaviconCount:()=>iconCount,refresh:mountBeams})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();