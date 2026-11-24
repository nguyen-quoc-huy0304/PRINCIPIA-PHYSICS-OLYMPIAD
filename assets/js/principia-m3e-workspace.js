/* PRINCIPIA M3E Canvas workspace — embedded in the existing editor panel. */
(()=> {
 'use strict';
 const PROJECT_URL='https://lnkiai.github.io/m3e-canvas/?p=hrpfedux4y4in8el';
 const BUTTON_ID='principiaM3ECanvasButton';
 const OVERLAY_ID='principiaM3ECanvasWorkspace';
 let previousOverflow='';
 function ensureWorkspace(){
  let overlay=document.getElementById(OVERLAY_ID);
  if(overlay)return overlay;
  overlay=document.createElement('section');
  overlay.id=OVERLAY_ID;
  overlay.setAttribute('aria-label','M3E Canvas workspace');
  overlay.hidden=true;
  overlay.style.cssText='position:fixed;inset:0;z-index:2147483646;display:none;flex-direction:column;background:#111318;color:#f5f5f5;font:14px system-ui,sans-serif;';
  overlay.innerHTML=
   '<header style="height:54px;min-height:54px;display:flex;align-items:center;gap:12px;padding:0 14px;background:#1b1d24;border-bottom:1px solid #383b45">'+
    '<strong style="flex:1">M3E Canvas</strong>'+
    '<span style="font-size:12px;opacity:.7">Material 3 Expressive editor</span>'+
    '<button type="button" data-close style="border:1px solid #555;border-radius:10px;padding:8px 13px;background:#292c35;color:#fff;font:inherit">Quay lại PRINCIPIA</button>'+
   '</header>'+
   '<iframe title="M3E Canvas — thiết kế giao diện" loading="lazy" referrerpolicy="no-referrer" allow="clipboard-read; clipboard-write" style="display:block;flex:1 1 auto;width:100%;height:100%;min-height:0;border:0;background:#f5f5f5"></iframe>';
  overlay.querySelector('[data-close]').addEventListener('click',closeWorkspace);
  document.body.appendChild(overlay);
  return overlay;
 }
 function openWorkspace(){
  const overlay=ensureWorkspace();
  const frame=overlay.querySelector('iframe');
  if(!frame.src)frame.src=PROJECT_URL;
  previousOverflow=document.body.style.overflow;
  document.body.style.overflow='hidden';
  overlay.hidden=false;
  overlay.style.display='flex';
 }
 function closeWorkspace(){
  const overlay=document.getElementById(OVERLAY_ID);
  if(!overlay)return;
  overlay.hidden=true;
  overlay.style.display='none';
  document.body.style.overflow=previousOverflow;
 }
 function attachButton(){
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.querySelector('#'+BUTTON_ID))return;
  const button=document.createElement('button');
  button.id=BUTTON_ID;
  button.type='button';
  button.textContent='▦ Mở M3E Canvas';
  button.title='Mở M3E Canvas ngay trong PRINCIPIA';
  button.style.cssText='display:block;width:100%;margin:0 0 9px;padding:10px 11px;border:1px solid rgba(128,170,255,.65);border-radius:10px;background:rgba(75,120,220,.2);color:#fff;font:inherit;text-align:left;cursor:pointer';
  button.addEventListener('click',openWorkspace);
  const firstControl=panel.querySelector('[data-layout-editor-toggle],[data-toggle]');
  if(firstControl)firstControl.insertAdjacentElement('beforebegin',button);
  else panel.prepend(button);
 }
 document.addEventListener('keydown',event=>{
  if(event.key==='Escape'&&!document.getElementById(OVERLAY_ID)?.hidden)closeWorkspace();
 });
 document.addEventListener('principia:rendered',attachButton);
 const observer=new MutationObserver(attachButton);
 observer.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachButton,{once:true});
 else attachButton();
 window.PrincipiaM3ECanvas=Object.freeze({open:openWorkspace,close:closeWorkspace});
})();