/* PRINCIPIA PRO fixed action dock: AI, mini browser, quick navigation. */
(()=> {
 'use strict';
 const IDS={ai:'principiaDockAI',browser:'principiaDockBrowser',files:'principiaDockFiles'};
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 let browserPanel=null,filesPanel=null;
 const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
 const welcome=()=>document.body.classList.contains('principia-welcome-active');
 function button(id,label,glyph,bottom){
  let node=document.getElementById(id);
  if(!node){node=document.createElement('button');node.id=id;node.type='button';node.setAttribute('aria-label',label);node.title=label;node.textContent=glyph;document.body.appendChild(node)}
  const mobile=isMobile();
  Object.assign(node.style,{
   position:'fixed',right:mobile?'12px':'18px',bottom:mobile?'calc('+bottom+'px + env(safe-area-inset-bottom,0px))':bottom+'px',
   left:'auto',top:'auto',zIndex:'2147483000',width:'46px',height:'46px',minWidth:'46px',minHeight:'46px',
   display:welcome()?'none':'grid',placeItems:'center',padding:'0',borderRadius:'16px',
   border:'1px solid var(--line,#68708a)',background:'var(--card,#171a2b)',color:'var(--text,var(--txt,#fff))',
   fontSize:'23px',lineHeight:'1',boxShadow:'0 8px 26px #0005',cursor:'pointer',transform:'none',margin:'0'
  });
  node.setAttribute('aria-hidden',welcome()?'true':'false');
  return node;
 }
 function stylePanel(panel,mobileBottom){
  const mobile=isMobile();
  Object.assign(panel.style,{
   position:'fixed',right:mobile?'12px':'74px',
   bottom:mobile?'calc('+mobileBottom+'px + env(safe-area-inset-bottom,0px))':'82px',
   left:'auto',top:'auto',width:mobile?'calc(100vw - 24px)':'min(560px,calc(100vw - 110px))',
   height:mobile?'min(66vh,620px)':'min(72vh,680px)',minHeight:'260px',
   zIndex:'2147482990',display:'flex',flexDirection:'column',overflow:'hidden',
   border:'1px solid var(--line,#46506a)',borderRadius:'18px',
   background:'var(--card,#111827)',color:'var(--text,var(--txt,#fff))',
   boxShadow:'0 18px 60px #0009'
  });
 }
 function header(title,closeId,extra=''){
  return '<header data-dock-drag style="display:flex;align-items:center;gap:9px;min-height:46px;padding:0 12px;background:var(--card2,#20283a);border-bottom:1px solid var(--line,#46506a);touch-action:none;cursor:move"><b style="flex:1;min-width:0">'+title+'</b>'+extra+'<button type="button" id="'+closeId+'" aria-label="Đóng" style="font-size:20px;padding:3px 8px">×</button></header>';
 }
 function makeDraggable(panel){
  const bar=panel.querySelector('[data-dock-drag]');if(!bar)return;
  let drag=null;
  bar.addEventListener('pointerdown',event=>{
   if(event.target.closest('button,input'))return;
   const rect=panel.getBoundingClientRect();drag={x:event.clientX,y:event.clientY,left:rect.left,top:rect.top};
   panel.style.right='auto';panel.style.bottom='auto';bar.setPointerCapture?.(event.pointerId);
  });
  bar.addEventListener('pointermove',event=>{
   if(!drag)return;
   const x=Math.max(8,Math.min(window.innerWidth-panel.offsetWidth-8,drag.left+event.clientX-drag.x));
   const y=Math.max(8,Math.min(window.innerHeight-panel.offsetHeight-8,drag.top+event.clientY-drag.y));
   panel.style.left=x+'px';panel.style.top=y+'px';
  });
  const stop=()=>{drag=null};bar.addEventListener('pointerup',stop);bar.addEventListener('pointercancel',stop);
 }
 function closePanel(panel){if(panel){panel.remove()} }
 function openBrowser(){
  closePanel(browserPanel);
  const panel=document.createElement('section');panel.id='principiaMiniBrowser';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Tìm kiếm Internet');
  panel.innerHTML=header('⌕ Tìm kiếm Internet','principiaBrowserClose','<button type="button" id="principiaBrowserBack" title="Quay lại">←</button><button type="button" id="principiaBrowserForward" title="Tiến">→</button><button type="button" id="principiaBrowserReload" title="Tải lại">↻</button>')+
   '<form id="principiaBrowserForm" style="display:flex;gap:6px;padding:9px;border-bottom:1px solid var(--line,#46506a)"><input id="principiaBrowserUrl" type="search" inputmode="search" autocomplete="off" placeholder="Tìm trên Google hoặc nhập địa chỉ website" style="flex:1;min-width:0;padding:10px;border:1px solid var(--line,#46506a);border-radius:10px;background:var(--bg,#0b1020);color:inherit"><button type="submit">Tìm</button></form>'+
   '<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:11px;opacity:.8"><span id="principiaBrowserStatus" role="status" style="flex:1">Google Search · nếu Google không cho nhúng, dùng nút mở ngoài.</span><button type="button" id="principiaBrowserExternal">Mở ngoài ↗</button></div>'+
   '<iframe id="principiaBrowserFrame" title="Kết quả tìm kiếm web" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;flex:1;min-height:0;border:0;background:white" src="https://www.google.com/webhp?igu=1"></iframe>';
  document.body.appendChild(panel);browserPanel=panel;stylePanel(panel,248);makeDraggable(panel);
  const frame=panel.querySelector('#principiaBrowserFrame'),input=panel.querySelector('#principiaBrowserUrl'),status=panel.querySelector('#principiaBrowserStatus');
  let history=['https://www.google.com/webhp?igu=1'],position=0;
  const normalize=raw=>{
   const value=String(raw||'').trim();if(!value)return '';
   if(value.startsWith('https://')||value.startsWith('http://'))return value;
   if(value.includes('.')&&!value.includes(' '))return 'https://'+value;
   return 'https://www.google.com/search?igu=1&q='+encodeURIComponent(value);
  };
  const navigate=raw=>{
   const url=normalize(raw);if(!url)return;
   try{const parsed=new URL(url);if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')throw new Error('scheme')}catch(_){status.textContent='Địa chỉ không hợp lệ. Chỉ hỗ trợ website HTTP/HTTPS.';return}
   history=history.slice(0,position+1);history.push(url);position=history.length-1;input.value=raw;frame.src=url;
   status.textContent=url.includes('google.com/')?'Đang tìm trên Google. Nếu vùng kết quả trắng, Google đã chặn iframe trên trình duyệt này.':'Đang mở website. Một số trang chặn hiển thị nhúng.';
  };
  panel.querySelector('#principiaBrowserForm').addEventListener('submit',event=>{event.preventDefault();navigate(input.value)});
  panel.querySelector('#principiaBrowserExternal').addEventListener('click',()=>{
   const url=history[position];if(!url)return;
   const win=window.open(url,'_blank','noopener,noreferrer');
   if(!win)status.textContent='Trình duyệt chặn tab mới. Hãy cho phép pop-up.';
  });
  panel.querySelector('#principiaBrowserBack').addEventListener('click',()=>{if(position>0){position--;frame.src=history[position];input.value=history[position]}});
  panel.querySelector('#principiaBrowserForward').addEventListener('click',()=>{if(position<history.length-1){position++;frame.src=history[position];input.value=history[position]}});
  panel.querySelector('#principiaBrowserReload').addEventListener('click',()=>{frame.src=frame.src});
  frame.addEventListener('load',()=>{if(position>=0)status.textContent='Trang đã phản hồi. Nếu nội dung không hiển thị, trang có thể chặn iframe.'});
  panel.querySelector('#principiaBrowserClose').addEventListener('click',()=>{closePanel(panel);browserPanel=null});
  input.focus();
 }
 function pageItems(){
  let nav=[];
  try{if(typeof window.principiaNav==='function')nav=window.principiaNav()}catch(_){}
  if(!Array.isArray(nav)||!nav.length)nav=[['home','sparkle','Trang chủ'],['library','books','Học tập'],['quiz','calculator','Quiz'],['fun','puzzle','Đố vui'],['lab','flask','Phòng thí nghiệm'],['progress','trophy','Tiến độ']];
  return nav.filter(x=>Array.isArray(x)&&typeof x[0]==='string').map(([id,icon,label])=>({id,label:String(label||id),icon:String(icon||'•')}));
 }
 function openFiles(){
  closePanel(filesPanel);
  const panel=document.createElement('section');panel.id='principiaQuickNavigation';panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Điều hướng nhanh PRINCIPIA');
  panel.innerHTML=header('▦ Tìm tệp & khu vực PRO','principiaFilesClose')+
   '<div style="padding:10px;border-bottom:1px solid var(--line,#46506a)"><input id="principiaFilesSearch" type="search" placeholder="Tìm khu vực, bài học, quiz..." style="width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--line,#46506a);border-radius:10px;background:var(--bg,#0b1020);color:inherit"><button type="button" id="principiaFilesContentSearch" style="width:100%;margin-top:7px;padding:9px">Tìm trong nội dung PRINCIPIA ↗</button></div>'+
   '<div id="principiaFilesList" style="padding:10px;overflow:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;align-content:start"></div>';
  document.body.appendChild(panel);filesPanel=panel;stylePanel(panel,248);makeDraggable(panel);
  const list=panel.querySelector('#principiaFilesList'),search=panel.querySelector('#principiaFilesSearch');
  const render=()=>{
   const term=search.value.trim().toLocaleLowerCase('vi');
   const items=pageItems().filter(x=>(x.label+' '+x.id).toLocaleLowerCase('vi').includes(term));
   list.innerHTML=items.map(x=>'<button type="button" data-page="'+esc(x.id)+'" style="min-height:68px;display:flex;align-items:center;gap:9px;text-align:left;padding:10px;border:1px solid var(--line,#46506a);border-radius:12px;background:var(--card2,#20283a);color:inherit"><span style="font-size:22px">'+esc(x.icon)+'</span><b>'+esc(x.label)+'</b></button>').join('')||'<p style="grid-column:1/-1;opacity:.7;text-align:center">Không tìm thấy khu vực.</p>';
   list.querySelectorAll('button[data-page]').forEach(button=>button.addEventListener('click',()=>{
    const id=button.dataset.page;
    if(typeof window.navigatePrincipiaPage==='function')window.navigatePrincipiaPage(id);
    closePanel(panel);filesPanel=null;
   }));
  };
  search.addEventListener('input',render);render();
  panel.querySelector('#principiaFilesContentSearch').addEventListener('click',()=>{const query=search.value.trim();closePanel(panel);filesPanel=null;if(typeof window.openPrincipiaGlobalSearch==='function')window.openPrincipiaGlobalSearch(query);else if(typeof window.navigatePrincipiaPage==='function')window.navigatePrincipiaPage('library')});
  panel.querySelector('#principiaFilesClose').addEventListener('click',()=>{closePanel(panel);filesPanel=null});
  search.focus();
 }
 function mount(){
  const ai=document.querySelector('button.chat-bubble-btn.chat-messenger-launcher');
  if(ai){
   ai.id=IDS.ai;ai.title='Mở trợ lý AI';ai.setAttribute('aria-label','Mở trợ lý AI');
   const mobile=isMobile();const bottom=mobile?82:18;
   Object.assign(ai.style,{position:'fixed',right:mobile?'12px':'18px',bottom:mobile?'calc('+bottom+'px + env(safe-area-inset-bottom,0px))':bottom+'px',left:'auto',top:'auto',zIndex:'2147483000',width:'46px',height:'46px',minWidth:'46px',minHeight:'46px',display:welcome()?'none':'grid',placeItems:'center',borderRadius:'16px',transform:'none',margin:'0'});
   ai.setAttribute('aria-hidden',welcome()?'true':'false');
  }
  const browser=button(IDS.browser,'Mở trình duyệt mini','⌕',isMobile()?138:74);
  browser.onclick=openBrowser;
  const files=button(IDS.files,'Mở điều hướng nhanh','▦',isMobile()?194:130);
  files.onclick=openFiles;
  const oldSearch=document.getElementById('principiaSearchTrigger');if(oldSearch)oldSearch.style.display='none';
  const download=document.getElementById('principiaDownloadFab');if(download){download.style.display='none';download.setAttribute('aria-hidden','true');download.tabIndex=-1}
  const editor=document.getElementById('proSiteEditorPanel');if(editor)editor.style.bottom=isMobile()?'250px':'186px';
  [browserPanel,filesPanel].forEach(panel=>{if(panel&&panel.isConnected)stylePanel(panel,248)});
 }
 function start(){
  mount();
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',mount,{passive:true});
  document.addEventListener('principia:rendered',mount);
  document.addEventListener('principia:page-changed',mount);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closePanel(browserPanel);closePanel(filesPanel);browserPanel=filesPanel=null}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();