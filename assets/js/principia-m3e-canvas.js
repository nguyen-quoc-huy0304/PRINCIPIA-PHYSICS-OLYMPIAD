/* PRINCIPIA M3E Canvas — embedded Material 3 Expressive design workspace. */
(()=> {
 'use strict';
 const URL='https://lnkiai.github.io/m3e-canvas/?p=hrpfedux4y4in8el';
 const ID='principiaM3ECanvasOverlay';
 let overlay=null,previousOverflow='';
 const style=(el,css)=>Object.assign(el.style,css);
 function ensure(){
  if(overlay)return overlay;
  overlay=document.createElement('section');
  overlay.id=ID;
  overlay.hidden=true;
  overlay.setAttribute('role','dialog');
  overlay.setAttribute('aria-modal','true');
  overlay.setAttribute('aria-label','M3E Canvas');
  style(overlay,{position:'fixed',inset:'0',zIndex:'2147483647',display:'none',flexDirection:'column',background:'var(--bg,#0c0d16)',color:'var(--txt,#fff)'});
  overlay.innerHTML=
   '<header style="display:flex;align-items:center;gap:10px;min-height:52px;padding:7px 12px;border-bottom:1px solid var(--line,#333);background:var(--side,#111321)">'+
    '<strong style="flex:1;min-width:0">M3E Canvas <small style="font-weight:400;opacity:.65">· Material 3 Expressive</small></strong>'+
    '<button type="button" data-reload title="Tải lại" aria-label="Tải lại" style="padding:8px 11px">↻</button>'+
    '<a data-external href="'+URL+'" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none;padding:8px 10px;border:1px solid var(--line,#555);border-radius:9px">Mở riêng ↗</a>'+
    '<button type="button" data-close aria-label="Đóng M3E Canvas" style="padding:8px 12px;font-size:20px">×</button>'+
   '</header>'+
   '<iframe data-frame title="M3E Canvas — PRINCIPIA" src="about:blank" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; clipboard-read; clipboard-write" style="display:block;flex:1;width:100%;height:100%;min-height:0;border:0;background:#fff"></iframe>';
  overlay.querySelector('[data-close]').addEventListener('click',close);
  overlay.querySelector('[data-reload]').addEventListener('click',()=>{const frame=overlay.querySelector('[data-frame]');frame.src=URL});
  document.body.appendChild(overlay);
  return overlay;
 }
 function open(){
  const root=ensure(),frame=root.querySelector('[data-frame]');
  if(!frame.src||frame.getAttribute('src')==='about:blank')frame.src=URL;
  previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  root.hidden=false;root.style.display='flex';
  return true;
 }
 function close(){
  if(!overlay)return;
  overlay.hidden=true;overlay.style.display='none';
  document.body.style.overflow=previousOverflow;
 }
 function injectEntry(){
  if(window.getPrincipiaPage?.()!=='more')return;
  const body=document.getElementById('body');
  if(!body||body.querySelector('[data-principia-m3e-entry]'))return;
  const panel=document.createElement('section');
  panel.className='panel';
  panel.dataset.principiaM3eEntry='1';
  panel.innerHTML='<h2>🎨 M3E Canvas · Thiết kế giao diện</h2><p class="muted small">Dựng màn hình Material 3 Expressive bằng kéo thả, nối luồng tương tác, chỉnh theme và xuất prompt cho AI coding tool.</p><button type="button" class="primary" data-open-m3e>Mở M3E Canvas ngay trong PRINCIPIA ↗</button>';
  panel.querySelector('[data-open-m3e]').addEventListener('click',open);
  body.prepend(panel);
 }
 document.addEventListener('principia:rendered',injectEntry);
 document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overlay&&!overlay.hidden)close()});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',injectEntry,{once:true});
 else injectEntry();
 window.PrincipiaM3ECanvas=Object.freeze({open,close});
})();