/* PRINCIPIA Command Center — contextual navigation without replacing existing launchers. */
(() => {
 'use strict';

 const IDS={overlay:'principiaCommandOverlay'};
 let activeIndex=0;
 let commands=[];
 let lastFocus=null;

 const isWelcome=()=>document.body.classList.contains('principia-welcome-active');
 const safeCall=(fn)=>{try{fn()}catch(error){window.PrincipiaErrorLog?.report(error,'command-center');console.error('[PRINCIPIA] Command failed',error)}};
 const iconFor=(id)=>({home:'⌂',library:'▤',quiz:'✎',fun:'◇',lab:'⚗',progress:'↗',more:'⋯',profile:'◉',settings:'⚙'}[id]||'•');

 function navigationItems(){
  let items=[];
  try{if(typeof window.principiaNav==='function')items=window.principiaNav()}catch(_){}
  if(!Array.isArray(items)||!items.length){
   items=[...document.querySelectorAll('#app .nav')].map(node=>[
    node.dataset.page||node.getAttribute('data-page')||'',
    '',
    node.innerText?.trim()||''
   ]);
  }
  return items.filter(item=>Array.isArray(item)&&typeof item[0]==='string'&&item[0].trim())
   .map(([id,,label])=>({id,label:String(label||id),icon:iconFor(id),group:'Điều hướng',detail:'Mở khu vực '+String(label||id)}));
 }

 function actionItems(){
  return [
   {id:'search',label:'Tìm kiếm toàn PRINCIPIA',icon:'⌕',group:'Thao tác nhanh',detail:'Tìm bài học, công thức và nội dung',run:()=>window.openPrincipiaGlobalSearch?.('')},
   {id:'error-log',label:'Nhật ký lỗi',icon:'⚠',group:'Thao tác nhanh',detail:'Xem lỗi JavaScript và lỗi module gần đây',run:()=>window.PrincipiaErrorLog?.open()},
   {id:'ai',label:'Mở AI',icon:'✦',group:'Thao tác nhanh',detail:'Mở bảng AI đang được ghim',run:()=>document.getElementById('principiaDockAI')?.click()},
   {id:'internet',label:'Tìm kiếm Internet',icon:'◎',group:'Thao tác nhanh',detail:'Mở trình duyệt Internet trong PRINCIPIA',run:()=>document.getElementById('principiaDockBrowser')?.click()},
   {id:'m3e',label:'M3E Canvas',icon:'▦',group:'Thao tác nhanh',detail:'Mở không gian thiết kế giao diện',run:()=>window.PrincipiaM3ECanvas?.open()},
   {id:'top',label:'Lên đầu trang',icon:'↑',group:'Thao tác nhanh',detail:'Cuộn về đầu khu vực hiện tại',run:scrollToTop}
  ];
 }

 function buildCommands(query=''){
  const term=String(query||'').trim().toLocaleLowerCase('vi');
  const all=[...actionItems(),...navigationItems()];
  commands=all.filter(item=>!term||(item.label+' '+item.detail+' '+item.id).toLocaleLowerCase('vi').includes(term));
  activeIndex=0;
  renderList();
 }

 function makeCommand(item,index){
  const button=document.createElement('button');
  button.type='button';button.className='pr-command-item';button.dataset.index=String(index);
  const glyph=document.createElement('span');glyph.className='pr-command-icon';glyph.textContent=item.icon;
  const copy=document.createElement('span');copy.className='pr-command-copy';
  const title=document.createElement('strong');title.textContent=item.label;
  const detail=document.createElement('small');detail.textContent=item.detail;
  copy.append(title,detail);button.append(glyph,copy);
  button.addEventListener('click',()=>execute(item));
  button.addEventListener('mouseenter',()=>{activeIndex=index;paintActive()});
  return button;
 }

 function renderList(){
  const root=document.getElementById('principiaCommandList');
  if(!root)return;
  root.replaceChildren();
  if(!commands.length){
   const empty=document.createElement('div');empty.className='pr-command-empty';empty.textContent='Không tìm thấy lệnh phù hợp.';root.appendChild(empty);return;
  }
  let previous='';
  commands.forEach((item,index)=>{
   if(item.group!==previous){
    const heading=document.createElement('div');heading.className='pr-command-group';heading.textContent=item.group;root.appendChild(heading);previous=item.group;
   }
   root.appendChild(makeCommand(item,index));
  });
  paintActive();
 }

 function paintActive(){
  document.querySelectorAll('#principiaCommandList .pr-command-item').forEach((node,index)=>{
   node.style.background=index===activeIndex?'rgba(154,130,240,.14)':'transparent';
   node.setAttribute('aria-selected',index===activeIndex?'true':'false');
  });
 }

 function ensureOverlay(){
  let overlay=document.getElementById(IDS.overlay);
  if(overlay)return overlay;
  overlay=document.createElement('div');overlay.id=IDS.overlay;
  overlay.innerHTML='<section id="principiaCommandDialog" role="dialog" aria-modal="true" aria-label="Trung tâm lệnh PRINCIPIA"><input id="principiaCommandSearch" type="search" autocomplete="off" placeholder="Tìm lệnh hoặc khu vực..." aria-label="Tìm lệnh"><div id="principiaCommandList" role="listbox"></div><footer id="principiaCommandFooter"><span>↑ ↓ Di chuyển</span><span>Enter Mở</span><span>Esc Đóng</span><span>Ctrl ⇧ P</span></footer></section>';
  overlay.addEventListener('click',event=>{if(event.target===overlay)closePalette()});
  const input=overlay.querySelector('input');
  input.addEventListener('input',()=>buildCommands(input.value));
  input.addEventListener('keydown',onPaletteKeydown);
  document.body.appendChild(overlay);
  return overlay;
 }

 function openPalette(){
  if(isWelcome())return;
  const overlay=ensureOverlay();
  lastFocus=document.activeElement;
  overlay.classList.add('is-open');
  buildCommands('');
  const input=overlay.querySelector('input');input.value='';
  requestAnimationFrame(()=>input.focus());
 }

 function closePalette(){
  const overlay=document.getElementById(IDS.overlay);
  if(!overlay)return;
  overlay.classList.remove('is-open');
  if(lastFocus?.isConnected)lastFocus.focus();
 }

 function execute(item){
  closePalette();
  if(item.run){safeCall(item.run);return}
  if(typeof window.navigatePrincipiaPage==='function')safeCall(()=>window.navigatePrincipiaPage(item.id));
 }

 function onPaletteKeydown(event){
  if(event.key==='ArrowDown'||event.key==='ArrowUp'){
   event.preventDefault();activeIndex=(activeIndex+(event.key==='ArrowDown'?1:-1)+commands.length)%commands.length;paintActive();
   document.querySelector('#principiaCommandList .pr-command-item[data-index="'+activeIndex+'"]')?.scrollIntoView({block:'nearest'});
  }else if(event.key==='Enter'){
   event.preventDefault();if(commands[activeIndex])execute(commands[activeIndex]);
  }else if(event.key==='Escape'){event.preventDefault();closePalette()}
 }

 function scrollToTop(){
  window.scrollTo({top:0,behavior:'smooth'});
 }

 function mountEditorTools(){
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.querySelector('[data-principia-extra-tools]'))return;
  const section=document.createElement('section');
  section.dataset.principiaExtraTools='true';
  section.style.cssText='margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.16)';
  const heading=document.createElement('strong');
  heading.textContent='Tiện ích bổ sung';
  heading.style.cssText='display:block;margin-bottom:7px;font-size:12px';
  const palette=document.createElement('button');
  palette.type='button';palette.textContent='⌘ Trung tâm lệnh';
  palette.title='Tìm nhanh khu vực và thao tác trong PRINCIPIA';
  palette.style.cssText='display:block;width:100%;margin:0 0 6px';
  palette.addEventListener('click',openPalette);
  const top=document.createElement('button');
  top.type='button';top.textContent='↑ Lên đầu trang';
  top.title='Cuộn về đầu trang';
  top.style.cssText='display:block;width:100%';
  top.addEventListener('click',scrollToTop);
  const errorLog=document.createElement('button');
  errorLog.type='button';errorLog.textContent='⚠ Nhật ký lỗi';errorLog.title='Xem lỗi được ghi trên thiết bị này';
  errorLog.style.cssText='display:block;width:100%;margin-top:6px';
  errorLog.addEventListener('click',()=>window.PrincipiaErrorLog?.open());
  section.append(heading,palette,top,errorLog);
  const status=panel.querySelector('[data-status]');
  if(status)panel.insertBefore(section,status);else panel.appendChild(section);
 }

 function mount(){
  mountEditorTools();
 }

 document.addEventListener('keydown',event=>{
  if((event.ctrlKey||event.metaKey)&&event.shiftKey&&event.key.toLowerCase()==='p'){
   event.preventDefault();openPalette();
  }
  if(event.key==='Escape')closePalette();
 });
 document.addEventListener('principia:page-changed',mount);
 document.addEventListener('principia:rendered',mount);
 const observer=new MutationObserver(mount);
 observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.PrincipiaCommandCenter=Object.freeze({open:openPalette,close:closePalette});
})();