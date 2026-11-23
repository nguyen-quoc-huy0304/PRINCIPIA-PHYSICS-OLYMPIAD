/* PRINCIPIA welcome-screen editor bubble: move or remove welcome buttons and image tiles. */
(()=> {
 'use strict';
 const KEY='principia_welcome_layout_v1';
 const OWNER='huyquocnguyen03042011@gmail.com';
 let state={deleted:[],positions:{}},bubble=null,panel=null,active=false,selected=null,observer=null;
 const screen=()=>document.querySelector('.principia-welcome-screen');
 const isAdmin=()=>{
  try{
   const account=JSON.parse(localStorage.getItem('principia_google_account')||'null');
   return !!account&&String(account.email||'').toLowerCase()===OWNER&&account.uid===window.PRINCIPIA_OWNER_UID_PUBLIC;
  }catch(_){return false}
 };
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(error){console.warn('[PRINCIPIA] Không lưu được bố cục màn hình chào',error)}};
 const load=()=>{
  try{
   const value=JSON.parse(localStorage.getItem(KEY)||'{}');
   state={deleted:Array.isArray(value.deleted)?value.deleted.filter(x=>typeof x==='string'):[],positions:value.positions&&typeof value.positions==='object'?value.positions:{}};
  }catch(_){state={deleted:[],positions:{}}}
 };
 const candidates=()=>[...screen()?.querySelectorAll('button,img')||[]].filter(el=>!el.closest('[data-welcome-editor]'));
 function keyElements(){
  candidates().forEach((el,index)=>{
   if(!el.dataset.welcomeEditId)el.dataset.welcomeEditId=(el.tagName.toLowerCase()==='button'?'button-':'image-')+index;
  });
 }
 function applyState(){
  const root=screen();if(!root)return;
  keyElements();
  candidates().forEach(el=>{
   const id=el.dataset.welcomeEditId;
   el.hidden=state.deleted.includes(id);
   const pos=state.positions[id];
   if(pos){el.style.position='relative';el.style.left=pos.x+'px';el.style.top=pos.y+'px';el.style.transform='none';}
  });
 }
 function setSelected(el){
  if(selected)selected.removeAttribute('data-welcome-selected');
  selected=el; if(selected)selected.setAttribute('data-welcome-selected','true');
  const label=panel?.querySelector('[data-selected-label]');
  if(label)label.textContent=selected?(selected.tagName==='IMG'?'Ảnh đã chọn':'Nút đã chọn'):'Chưa chọn mục';
  const remove=panel?.querySelector('[data-delete]');
  if(remove)remove.disabled=!selected;
 }
 function setMode(value){
  active=!!value;screen()?.classList.toggle('pw-layout-editing',active);
  panel?.querySelector('[data-mode]').textContent=active?'Tắt chọn & di chuyển':'Bật chọn & di chuyển';
  if(!active)setSelected(null);
 }
 function build(){
  if(!isAdmin()||bubble)return;
  const style=document.createElement('style');style.dataset.welcomeEditor='1';style.textContent='.principia-welcome-screen.pw-layout-editing button,.principia-welcome-screen.pw-layout-editing img{cursor:grab!important;touch-action:none!important}.principia-welcome-screen [data-welcome-selected="true"]{outline:2px solid #a78bfa!important;outline-offset:4px!important}';document.head.appendChild(style);\n  bubble=document.createElement('button');bubble.type='button';bubble.dataset.welcomeEditor='1';bubble.id='principiaWelcomeEditorBubble';
  bubble.textContent='✎';bubble.title='Chỉnh sửa màn hình chào';bubble.setAttribute('aria-label','Chỉnh sửa màn hình chào');
  bubble.style.cssText='position:fixed;right:16px;bottom:calc(18px + env(safe-area-inset-bottom,0px));z-index:2147483600;width:50px;height:50px;border:1px solid #ffffff55;border-radius:50%;background:rgba(25,29,48,.92);backdrop-filter:blur(14px);color:#fff;font-size:24px;box-shadow:0 8px 26px #0006;cursor:pointer;display:none;place-items:center';
  panel=document.createElement('section');panel.dataset.welcomeEditor='1';panel.id='principiaWelcomeEditorPanel';
  panel.style.cssText='position:fixed;right:16px;bottom:calc(78px + env(safe-area-inset-bottom,0px));z-index:2147483599;width:min(290px,calc(100vw - 32px));padding:12px;border:1px solid #ffffff35;border-radius:18px;background:rgba(17,21,39,.96);backdrop-filter:blur(18px);color:#fff;box-shadow:0 14px 42px #0008;font:13px system-ui;display:none';
  panel.innerHTML='<header style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="flex:1">Chỉnh sửa màn hình chào</b><button type="button" data-close aria-label="Đóng" style="border:0;background:transparent;color:inherit;font-size:21px">×</button></header><button type="button" data-mode style="width:100%;padding:10px;border:1px solid #ffffff35;border-radius:12px;background:#ffffff12;color:inherit">Bật chọn & di chuyển</button><div data-selected-label style="margin:10px 2px;opacity:.75">Chưa chọn mục</div><div style="display:flex;gap:7px"><button type="button" data-delete disabled style="flex:1;padding:9px;border:1px solid #ffffff35;border-radius:10px;background:#ffffff12;color:inherit">Xóa mục chọn</button><button type="button" data-restore style="flex:1;padding:9px;border:1px solid #ffffff35;border-radius:10px;background:#ffffff12;color:inherit">Khôi phục mục</button></div><small style="display:block;margin-top:9px;opacity:.65">Bật chế độ, chạm nút/ảnh để chọn rồi kéo để di chuyển.</small>';
  document.body.append(bubble,panel);
  bubble.addEventListener('click',()=>{panel.style.display=panel.style.display==='block'?'none':'block'});
  panel.querySelector('[data-close]').addEventListener('click',()=>{panel.style.display='none';setMode(false)});
  panel.querySelector('[data-mode]').addEventListener('click',()=>setMode(!active));
  panel.querySelector('[data-delete]').addEventListener('click',()=>{
   if(!selected)return;
   const id=selected.dataset.welcomeEditId;
   if(!state.deleted.includes(id))state.deleted.push(id);
   selected.hidden=true;setSelected(null);save();
  });
  panel.querySelector('[data-restore]').addEventListener('click',()=>{
   state.deleted=[];state.positions={};save();applyState();setSelected(null);
  });
 }
 function onPointerDown(event){
  if(!active||!screen()?.contains(event.target))return;
  const target=event.target.closest('button,img');
  if(!target||target.closest('[data-welcome-editor]'))return;
  event.preventDefault();event.stopPropagation();setSelected(target);
  const start={x:event.clientX,y:event.clientY,left:Number.parseFloat(target.style.left)||0,top:Number.parseFloat(target.style.top)||0};
  target.setPointerCapture?.(event.pointerId);
  const move=moveEvent=>{
   const dx=moveEvent.clientX-start.x,dy=moveEvent.clientY-start.y;
   target.style.position='relative';target.style.left=(start.left+dx)+'px';target.style.top=(start.top+dy)+'px';
  };
  const finish=()=>{
   target.removeEventListener('pointermove',move);target.removeEventListener('pointerup',finish);target.removeEventListener('pointercancel',finish);
   state.positions[target.dataset.welcomeEditId]={x:Number.parseFloat(target.style.left)||0,y:Number.parseFloat(target.style.top)||0};save();
  };
  target.addEventListener('pointermove',move);target.addEventListener('pointerup',finish);target.addEventListener('pointercancel',finish);
 }
 function mount(){
  const root=screen(),visible=!!root;
  if(!isAdmin())return;
  build();
  bubble.style.display=visible?'grid':'none';
  if(!visible){panel.style.display='none';setMode(false);return}
  applyState();
 }
 function start(){
  mount();
  document.addEventListener('pointerdown',onPointerDown,true);
  document.addEventListener('click',event=>{if(!active||!screen()?.contains(event.target))return;const target=event.target.closest?.('button,img');if(!target||target.closest('[data-welcome-editor]'))return;event.preventDefault();event.stopImmediatePropagation();},true);
  observer=new MutationObserver(()=>{if(!screen())return;applyState();});
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('principia:rendered',mount);
  document.addEventListener('principia:page-changed',mount);
  window.addEventListener('resize',mount,{passive:true});
 }
 load();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
 window.PrincipiaWelcomeEditor=Object.freeze({refresh:mount});
})();