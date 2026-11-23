/* PRINCIPIA PRO fixed action dock: AI, mini browser, quick navigation. */
(()=> {
 'use strict';
 const IDS={ai:'principiaDockAI',browser:'principiaDockBrowser',files:'principiaDockFiles'};
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 let browserPanel=null,filesPanel=null;
 const HISTORY_KEY='principia_browser_history_v1';
 const readHistory=()=>{try{const v=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.url==='string').slice(0,50):[]}catch(_){return[]}};
 const saveHistory=url=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify([{url,at:Date.now()},...readHistory().filter(x=>x.url!==url)].slice(0,50)))}catch(_){}};
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
   '<div style="display:flex;gap:7px;padding:8px 10px"><button type="button" id="principiaBrowserHistoryToggle">Lịch sử</button><button type="button" id="principiaBrowserSave">☆ Lưu trang</button></div><div id="principiaBrowserHistoryList" hidden style="max-height:180px;overflow:auto;padding:8px 10px;border-bottom:1px solid var(--line,#46506a)"></div><div style="display:flex;align-items:center;gap:8px;padding:7px 10px;font-size:11px;opacity:.8"><span id="principiaBrowserStatus" role="status" style="flex:1">Đang xem Google. Dùng thanh tìm kiếm PRINCIPIA ở cạnh nút Quay lại.</span><button type="button" id="principiaBrowserExternal">Mở ngoài ↗</button></div>'+
   '<iframe id="principiaBrowserFrame" title="Kết quả tìm kiếm web" referrerpolicy="strict-origin-when-cross-origin" style="width:100%;flex:1;min-height:0;border:0;background:white" src="https://www.google.com/webhp?igu=1"></iframe>';
  document.body.appendChild(panel);browserPanel=panel;stylePanel(panel,248);makeDraggable(panel);
  const frame=panel.querySelector('#principiaBrowserFrame'),status=panel.querySelector('#principiaBrowserStatus');
  let history=['https://www.google.com/webhp?igu=1',...readHistory().map(x=>x.url)],position=0;
  const normalize=raw=>{
   const value=String(raw||'').trim();if(!value)return '';
   if(value.startsWith('https://')||value.startsWith('http://'))return value;
   if(value.includes('.')&&!value.includes(' '))return 'https://'+value;
   return 'https://www.google.com/search?igu=1&q='+encodeURIComponent(value);
  };
  const navigate=raw=>{
   const url=normalize(raw);if(!url)return;
   try{const parsed=new URL(url);if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')throw new Error('scheme')}catch(_){status.textContent='Địa chỉ không hợp lệ. Chỉ hỗ trợ website HTTP/HTTPS.';return}
   history=history.slice(0,position+1);history.push(url);position=history.length-1;frame.src=url;saveHistory(url);
   status.textContent=url.includes('google.com/')?'Đang tìm trên Google. Nếu vùng kết quả trắng, Google đã chặn iframe trên trình duyệt này.':'Đang mở website. Một số trang chặn hiển thị nhúng.';
  };
  const historyPanel=panel.querySelector('#principiaBrowserHistoryList');
  panel.querySelector('#principiaBrowserHistoryToggle').addEventListener('click',()=>{
   historyPanel.hidden=!historyPanel.hidden;
   if(historyPanel.hidden)return;
   const entries=readHistory();
   historyPanel.replaceChildren();
   const heading=document.createElement('b');heading.textContent='Lịch sử truy cập';historyPanel.appendChild(heading);
   if(!entries.length){const empty=document.createElement('p');empty.textContent='Chưa có lịch sử.';historyPanel.appendChild(empty)}
   entries.forEach(entry=>{const item=document.createElement('button');item.type='button';item.textContent=entry.url;item.style.cssText='display:block;width:100%;text-align:left;padding:7px;background:transparent;color:inherit;border:0';item.addEventListener('click',()=>{navigate(entry.url);});historyPanel.appendChild(item)});
   const savedTitle=document.createElement('b');savedTitle.textContent='Website đã lưu';savedTitle.style.display='block';savedTitle.style.marginTop='10px';historyPanel.appendChild(savedTitle);
   let saved=[];try{const value=JSON.parse(localStorage.getItem('principia_browser_saved_sites_v1')||'[]');saved=Array.isArray(value)?value.filter(x=>x&&typeof x.url==='string'):[]}catch(_){}
   if(!saved.length){const emptySaved=document.createElement('p');emptySaved.textContent='Chưa lưu website nào. Nhấn ☆ để lưu trang đang mở.';historyPanel.appendChild(emptySaved)}
   saved.forEach(entry=>{const item=document.createElement('button');item.type='button';item.textContent=entry.url;item.style.cssText='display:block;width:100%;text-align:left;padding:7px;background:transparent;color:inherit;border:0';item.addEventListener('click',()=>navigate(entry.url));historyPanel.appendChild(item)});
   const clear=document.createElement('button');clear.type='button';clear.textContent='Xóa lịch sử';clear.addEventListener('click',()=>{try{localStorage.removeItem(HISTORY_KEY)}catch(_){};historyPanel.replaceChildren()});historyPanel.appendChild(clear);
  });
  panel.querySelector('#principiaBrowserSave').addEventListener('click',()=>{
   const url=history[position];if(!url)return;
   try{const key='principia_browser_saved_sites_v1',items=JSON.parse(localStorage.getItem(key)||'[]');const next=[{url,savedAt:Date.now()},...items.filter(x=>x.url!==url)].slice(0,50);localStorage.setItem(key,JSON.stringify(next));status.textContent='Đã lưu website trên thiết bị; đăng xuất không xóa.'}catch(_){status.textContent='Không lưu được website trên thiết bị.'}
  });
  
  panel.querySelector('#principiaBrowserExternal').addEventListener('click',()=>{
   const url=history[position];if(!url)return;
   const win=window.open(url,'_blank','noopener,noreferrer');
   if(!win)status.textContent='Trình duyệt chặn tab mới. Hãy cho phép pop-up.';
  });
  panel.querySelector('#principiaBrowserBack').addEventListener('click',()=>{if(position>0){position--;frame.src=history[position]}});
  panel.querySelector('#principiaBrowserForward').addEventListener('click',()=>{if(position<history.length-1){position++;frame.src=history[position]}});
  panel.querySelector('#principiaBrowserReload').addEventListener('click',()=>{frame.src=frame.src});
  frame.addEventListener('load',()=>{if(position>=0)status.textContent='Trang đã phản hồi. Nếu nội dung không hiển thị, trang có thể chặn iframe.'});
  panel.querySelector('#principiaBrowserClose').addEventListener('click',()=>{closePanel(panel);browserPanel=null});

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
   '<div style="padding:16px;border-bottom:1px solid var(--line,#46506a)"><label for="principiaFilesSearch" style="display:block;font-size:15px;font-weight:700;margin:0 0 9px">Tìm vị trí tệp và nội dung</label><input id="principiaFilesSearch" type="search" placeholder="Nhập tên tệp, bài học, chủ đề hoặc khu vực..." style="display:block;width:100%;box-sizing:border-box;padding:17px 16px;min-height:62px;font-size:18px;line-height:1.4;border:2px solid var(--accent,#8b7cff);border-radius:14px;background:var(--bg,#0b1020);color:inherit;outline-offset:3px"><button type="button" id="principiaFilesContentSearch" style="width:100%;margin-top:10px;min-height:48px;padding:12px;font-size:15px">Tìm trong nội dung PRINCIPIA ↗</button></div>'+
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
 function ensureDockRoot(){
  let root=document.getElementById('principiaActionDockRoot');
  if(!root){root=document.createElement('div');root.id='principiaActionDockRoot';root.setAttribute('aria-label','Thao tác nhanh PRINCIPIA')}
  if(root.parentElement!==document.documentElement)document.documentElement.appendChild(root);
  Object.assign(root.style,{position:'fixed',inset:'0',top:'0',right:'0',bottom:'0',left:'0',width:'100vw',height:'100vh',height:'100dvh',pointerEvents:'none',zIndex:'2147483000',display:'block',visibility:'visible',transform:'none',contain:'none'});
  return root;
 }
 function installDockPositionStyles(){
  if(document.getElementById('principiaDockPositionStyles'))return;
  const style=document.createElement('style');style.id='principiaDockPositionStyles';
  style.textContent=
   'html>#principiaActionDockRoot{position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;pointer-events:none!important;z-index:2147483000!important;display:block!important;visibility:visible!important;transform:none!important;contain:none!important}'+
   '#principiaActionDockRoot>#principiaDockAI,#principiaActionDockRoot>#principiaDockBrowser,#principiaActionDockRoot>#principiaDockFiles,#principiaActionDockRoot>#proSiteEditorFab{position:absolute!important;left:auto!important;top:auto!important;transform:none!important;margin:0!important;pointer-events:auto!important;visibility:visible!important;display:grid!important;z-index:1!important}'+
   '#principiaActionDockRoot>#principiaDockAI{right:18px!important;bottom:18px!important}'+
   '#principiaActionDockRoot>#principiaDockBrowser{right:18px!important;bottom:74px!important}'+
   '#principiaActionDockRoot>#principiaDockFiles{right:18px!important;bottom:130px!important}'+
   '#principiaActionDockRoot>#proSiteEditorFab{position:absolute!important;right:18px!important;bottom:186px!important;left:auto!important;top:auto!important;z-index:2!important;pointer-events:auto!important;margin:0!important}'+
   'html body #principiaSearchTrigger,html body #principiaDownloadFab{display:none!important;visibility:hidden!important;pointer-events:none!important}'+
   'body.principia-welcome-active #principiaActionDockRoot{display:none!important}';
  document.head.appendChild(style);
 }
 function mount(){
  installDockPositionStyles();
  const root=ensureDockRoot();
  root.style.display=welcome()?'none':'block';
  const launchers=[...document.querySelectorAll('button.chat-bubble-btn.chat-messenger-launcher')];
  let ai=launchers[0]||document.getElementById(IDS.ai);
  launchers.slice(1).forEach(node=>node.remove());
  const chatBoxes=[...document.querySelectorAll('#chatBox')];
  chatBoxes.slice(1).forEach(node=>node.remove());
  if(!ai){
   ai=document.createElement('button');ai.type='button';ai.className='chat-bubble-btn chat-messenger-launcher';
   ai.innerHTML='<span aria-hidden="true">AI</span>';ai.addEventListener('click',()=>{if(typeof window.toggleChatBox==='function')window.toggleChatBox()});
  }
  ai.id=IDS.ai;ai.title='Mở trợ lý AI';ai.setAttribute('aria-label','Mở trợ lý AI');
  if(ai.parentElement!==root)root.appendChild(ai);
  Object.assign(ai.style,{position:'absolute',right:'18px',bottom:'18px',left:'auto',top:'auto',zIndex:'1',width:'46px',height:'46px',minWidth:'46px',minHeight:'46px',maxWidth:'46px',maxHeight:'46px',display:'grid',placeItems:'center',borderRadius:'16px',transform:'none',margin:'0',pointerEvents:'auto'});
  ai.setAttribute('aria-hidden',welcome()?'true':'false');
  const browser=button(IDS.browser,'Tìm kiếm Internet','⌕',isMobile()?82:74);
  if(browser.parentElement!==root)root.appendChild(browser);
  browser.onclick=openBrowser;
  const files=button(IDS.files,'Tìm tệp và khu vực PRO','▦',isMobile()?138:130);
  if(files.parentElement!==root)root.appendChild(files);
  files.onclick=openFiles;
  const oldSearch=document.getElementById('principiaSearchTrigger');if(oldSearch){oldSearch.style.setProperty('display','none','important');oldSearch.style.setProperty('visibility','hidden','important');oldSearch.style.setProperty('pointer-events','none','important');oldSearch.setAttribute('aria-hidden','true');oldSearch.tabIndex=-1;}
  const download=document.getElementById('principiaDownloadFab');if(download){download.style.setProperty('display','none','important');download.style.setProperty('visibility','hidden','important');download.style.setProperty('pointer-events','none','important');download.style.setProperty('width','0','important');download.style.setProperty('height','0','important');download.setAttribute('aria-hidden','true');download.tabIndex=-1;}
  const pencil=document.getElementById('proSiteEditorFab');
  if(pencil&&pencil.parentElement!==root)root.appendChild(pencil);
  if(pencil)Object.assign(pencil.style,{position:'absolute',right:'18px',bottom:'186px',left:'auto',top:'auto',zIndex:'2',width:'46px',height:'46px',minWidth:'46px',minHeight:'46px',display:welcome()?'none':'grid',placeItems:'center',margin:'0',pointerEvents:'auto'});
  const editor=document.getElementById('proSiteEditorPanel');if(editor)editor.style.bottom=isMobile()?'306px':'242px';
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