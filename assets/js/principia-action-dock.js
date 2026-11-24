/* PRINCIPIA PRO viewport-anchored action dock: launchers are fixed directly to the viewport. */
(()=> {
 'use strict';
 const IDS={ai:'principiaDockAI',browser:'principiaDockBrowser',files:'principiaDockFiles'};
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 let browserPanel=null;
 const HISTORY_KEY='principia_browser_history_v1';
 const POSITION_KEY='principia_action_dock_positions_v1';
 let dockPositions=readDockPositions();
 function readDockPositions(){try{const value=JSON.parse(localStorage.getItem(POSITION_KEY)||'{}');return value&&typeof value==='object'?value:{}}catch(_){return{}}}
 function saveDockPositions(){try{localStorage.setItem(POSITION_KEY,JSON.stringify(dockPositions))}catch(_){}}
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const readHistory=()=>{try{const v=JSON.parse(localStorage.getItem(HISTORY_KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.url==='string').slice(0,50):[]}catch(_){return[]}};
 const saveHistory=url=>{try{localStorage.setItem(HISTORY_KEY,JSON.stringify([{url,at:Date.now()},...readHistory().filter(x=>x.url!==url)].slice(0,50)))}catch(_){}};
 const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
 const welcome=()=>document.body.classList.contains('principia-welcome-active')||!!document.querySelector('.principia-welcome-screen:not([hidden])')&&document.querySelector('.principia-welcome-screen:not([hidden])').getClientRects().length>0;
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
 function positionPanelFromAnchor(panel,anchor){
  if(!panel?.isConnected||!anchor?.isConnected)return;
  const rect=anchor.getBoundingClientRect();
  if(!rect.width||!rect.height)return;
  const panelRect=panel.getBoundingClientRect();
  const width=Math.max(180,panelRect.width||panel.offsetWidth||300);
  const height=Math.max(120,panelRect.height||panel.offsetHeight||260);
  const gap=12;
  // All floating panels stay on the LEFT of their own launcher.
  // Do not flip to the right: dragging a launcher must preserve this relationship.
  const left=rect.left-width-gap;
  const top=clamp(rect.top+(rect.height-height)/2,8,Math.max(8,window.innerHeight-height-8));
  panel.style.setProperty('position','fixed','important');
  panel.style.setProperty('left',left+'px','important');
  panel.style.setProperty('top',top+'px','important');
  panel.style.setProperty('right','auto','important');
  panel.style.setProperty('bottom','auto','important');
 }
 function stylePanel(panel,mobileBottom,anchor){
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
  if(anchor)positionPanelFromAnchor(panel,anchor);
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
  document.body.appendChild(panel);browserPanel=panel;stylePanel(panel,248,document.getElementById(IDS.browser));makeDraggable(panel);
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
 function installFileSearchBar(root){
  let input=document.getElementById(IDS.files);
  if(input&&input.tagName!=='INPUT'){input.remove();input=null}
  if(!input){
   input=document.createElement('input');input.id=IDS.files;input.type='search';
   input.placeholder='Tìm tệp / khu vực PRO…';input.autocomplete='off';
   input.setAttribute('aria-label','Tìm tệp và khu vực PRO');
  }
  const topRight=document.querySelector('#app .topright');
  if(topRight){
   const streak=[...topRight.querySelectorAll('button.pill')].find(item=>/ngày học|thành tích/i.test(item.textContent+' '+item.title))||topRight.querySelector('button.pill');
   if(streak&&streak.parentElement===topRight){
    if(input.parentElement!==topRight||input.nextElementSibling!==streak)topRight.insertBefore(input,streak);
   }else if(input.parentElement!==topRight)topRight.prepend(input);
   Object.assign(input.style,{
    position:'relative',right:'auto',top:'auto',bottom:'auto',left:'auto',
    width:isMobile()?'min(190px,42vw)':'min(260px,24vw)',minWidth:isMobile()?'118px':'170px',
    maxWidth:'100%',height:'38px',minHeight:'38px',flex:'0 1 250px',
    boxSizing:'border-box',padding:'0 13px',margin:'0',
    border:'1px solid var(--line,#68708a)',borderRadius:'20px',
    background:'var(--card,#171a2b)',color:'var(--text,var(--txt,#fff))',
    fontSize:'13px',outlineOffset:'3px',boxShadow:'0 5px 16px #0004',
    zIndex:'2',display:welcome()?'none':'block',pointerEvents:'auto'
   });
  }else{
   if(input.parentElement!==root)root.appendChild(input);
   Object.assign(input.style,{display:'none',position:'fixed'});
  }
  if(input.dataset.searchBound!=='true'){
   input.dataset.searchBound='true';
   input.addEventListener('keydown',event=>{
    if(event.key!=='Enter')return;
    const query=input.value.trim();if(!query)return;
    const normalized=query.toLocaleLowerCase('vi');
    const match=pageItems().find(item=>(item.label+' '+item.id).toLocaleLowerCase('vi').includes(normalized));
    if(match&&typeof window.navigatePrincipiaPage==='function')window.navigatePrincipiaPage(match.id);
    else if(typeof window.openPrincipiaGlobalSearch==='function')window.openPrincipiaGlobalSearch(query);
    else if(typeof window.navigatePrincipiaPage==='function')window.navigatePrincipiaPage('library');
    input.blur();
   });
  }
  return input;
 }
 function ensureDockRoot(){
  let root=document.getElementById('principiaActionDockRoot');
  if(!root){root=document.createElement('div');root.id='principiaActionDockRoot';root.setAttribute('aria-label','Thao tác nhanh PRINCIPIA')}
  if(root.parentElement!==document.documentElement)document.documentElement.appendChild(root);
  root.removeAttribute('popover');
  Object.assign(root.style,{position:'fixed',inset:'0',top:'0',right:'0',bottom:'0',left:'0',width:'100vw',height:'100vh',height:'100dvh',minWidth:'100vw',minHeight:'100dvh',maxWidth:'none',maxHeight:'none',margin:'0',padding:'0',border:'0',background:'transparent',overflow:'visible',pointerEvents:'none',zIndex:'2147483000',display:'block',visibility:'visible',transform:'none',contain:'none'});
  return root;
 }
 function installDockPositionStyles(){
  if(document.getElementById('principiaDockPositionStyles'))return;
  const style=document.createElement('style');style.id='principiaDockPositionStyles';
  style.textContent=
   'html>#principiaActionDockRoot{position:fixed!important;inset:0!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100vw!important;height:100vh!important;height:100dvh!important;min-width:100vw!important;min-height:100dvh!important;max-width:none!important;max-height:none!important;margin:0!important;padding:0!important;border:0!important;background:transparent!important;pointer-events:none!important;z-index:2147483000!important;display:block!important;visibility:visible!important;transform:none!important;contain:none!important;overflow:visible!important}'+
   ' body>button#principiaDockAI,body>button#principiaDockBrowser,body>button#proSiteEditorFab{position:fixed!important;transform:none!important;margin:0!important;pointer-events:auto!important;visibility:visible!important;display:grid!important;z-index:2147483005!important;touch-action:none!important;cursor:grab!important}'+
   'html body #principiaSearchTrigger,html body #principiaDownloadFab{display:none!important;visibility:hidden!important;pointer-events:none!important}'+
   'body.principia-welcome-active #principiaActionDockRoot>#principiaDockAI,body.principia-welcome-active #principiaActionDockRoot>#principiaDockBrowser,body.principia-welcome-active #principiaActionDockRoot>#principiaDockFiles{display:none!important;visibility:hidden!important;pointer-events:none!important}';
  document.head.appendChild(style);
 }
 function syncEditorPanelPosition(pencil){
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.hidden||!pencil?.isConnected)return;
  positionPanelFromAnchor(panel,pencil);
 }
 function syncChatPanelPosition(ai){
  const panel=document.getElementById('chatBox');
  if(!panel||!panel.classList.contains('open')||!ai?.isConnected)return;
  positionPanelFromAnchor(panel,ai);
 }
 function applyLauncherPosition(node,defaultBottom){
  const saved=dockPositions[node.id];
  const mobile=isMobile();
  if(saved&&Number.isFinite(Number(saved.x))&&Number.isFinite(Number(saved.y))){
   const x=clamp(Number(saved.x),8,Math.max(8,window.innerWidth-54));
   const y=clamp(Number(saved.y),8,Math.max(8,window.innerHeight-54));
   node.style.setProperty('left',x+'px','important');
   node.style.setProperty('top',y+'px','important');
   node.style.setProperty('right','auto','important');
   node.style.setProperty('bottom','auto','important');
   dockPositions[node.id]={x,y};
  }else{
   node.style.setProperty('left','auto','important');
   node.style.setProperty('top','auto','important');
   node.style.setProperty('right',(mobile?'12px':'18px'),'important');
   node.style.setProperty('bottom',(mobile?'calc('+defaultBottom+'px + env(safe-area-inset-bottom,0px))':defaultBottom+'px'),'important');
  }
  node.style.setProperty('position','fixed','important');
 }
 function enforceViewportPins(){
  const welcomeActive=welcome();
  const nodes=[
   document.getElementById(IDS.ai),
   document.getElementById(IDS.browser),
   document.getElementById('proSiteEditorFab')
  ];
  nodes.forEach(node=>{
   if(!node)return;
   if(node.id==='proSiteEditorFab'&&welcomeActive){
    if(node.parentElement!==document.body)document.body.appendChild(node);
    return;
   }
   if(node.parentElement!==document.body)document.body.appendChild(node);
   node.style.setProperty('position','fixed','important');
   node.style.setProperty('inset','auto','important');
   node.style.setProperty('transform','none','important');
   node.style.setProperty('display',welcomeActive&&node.id!=='proSiteEditorFab'?'none':'grid','important');
   node.style.setProperty('z-index','2147483005','important');
  });
 }
 function bindLauncherDrag(node,onMove){
  if(node.dataset.dockDragBound==='true')return;
  node.dataset.dockDragBound='true';
  node.addEventListener('pointerdown',event=>{
   if(event.button!==0||event.target.closest('input,select,textarea'))return;
   const rect=node.getBoundingClientRect();
   node._principiaDrag={startX:event.clientX,startY:event.clientY,left:rect.left,top:rect.top,moved:false};
   try{node.setPointerCapture(event.pointerId)}catch(_){}
  });
  node.addEventListener('pointermove',event=>{
   const drag=node._principiaDrag;if(!drag)return;
   const dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
   if(!drag.moved&&Math.hypot(dx,dy)<5)return;
   drag.moved=true;
   const x=clamp(drag.left+dx,8,Math.max(8,window.innerWidth-node.offsetWidth-8));
   const y=clamp(drag.top+dy,8,Math.max(8,window.innerHeight-node.offsetHeight-8));
   node.style.setProperty('left',x+'px','important');
   node.style.setProperty('top',y+'px','important');
   node.style.setProperty('right','auto','important');
   node.style.setProperty('bottom','auto','important');
   if(onMove)onMove();
   event.preventDefault();
  });
  const finish=()=>{
   const drag=node._principiaDrag;if(!drag)return;
   if(drag.moved){
    const rect=node.getBoundingClientRect();
    dockPositions[node.id]={x:Math.round(rect.left),y:Math.round(rect.top)};
    saveDockPositions();
    node._principiaSuppressClick=true;
    setTimeout(()=>{node._principiaSuppressClick=false},0);
    if(onMove)onMove();
   }
   node._principiaDrag=null;
  };
  node.addEventListener('pointerup',finish);
  node.addEventListener('pointercancel',finish);
  node.addEventListener('click',event=>{
   if(!node._principiaSuppressClick)return;
   event.preventDefault();event.stopImmediatePropagation();node._principiaSuppressClick=false;
  },true);
 }
 function mount(){
  installDockPositionStyles();
  const root=ensureDockRoot();
  root.style.display='block';
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
  if(ai.parentElement!==document.body)document.body.appendChild(ai);
  Object.assign(ai.style,{position:'fixed',right:'18px',bottom:'18px',left:'auto',top:'auto',zIndex:'2147483005',width:'46px',height:'46px',minWidth:'46px',minHeight:'46px',maxWidth:'46px',maxHeight:'46px',display:welcome()?'none':'grid',placeItems:'center',borderRadius:'16px',transform:'none',margin:'0',pointerEvents:'auto',touchAction:'none',userSelect:'none',cursor:'grab'});
  ai.style.display=welcome()?'none':'grid';
  ai.setAttribute('aria-hidden',welcome()?'true':'false');
  const browser=button(IDS.browser,'Tìm kiếm Internet','⌕',isMobile()?138:74);
  if(browser.parentElement!==document.body)document.body.appendChild(browser);
  browser.onclick=openBrowser;
  installFileSearchBar(root);
  const oldSearch=document.getElementById('principiaSearchTrigger');if(oldSearch){oldSearch.style.setProperty('display','none','important');oldSearch.style.setProperty('visibility','hidden','important');oldSearch.style.setProperty('pointer-events','none','important');oldSearch.setAttribute('aria-hidden','true');oldSearch.tabIndex=-1;}
  const download=document.getElementById('principiaDownloadFab');if(download){download.style.setProperty('display','none','important');download.style.setProperty('visibility','hidden','important');download.style.setProperty('pointer-events','none','important');download.style.setProperty('width','0','important');download.style.setProperty('height','0','important');download.setAttribute('aria-hidden','true');download.tabIndex=-1;}
  const pencil=document.getElementById('proSiteEditorFab');
  if(pencil){
   const target=document.body;
   if(pencil.parentElement!==target)target.appendChild(pencil);
   Object.assign(pencil.style,{position:'fixed',right:'18px',bottom:isMobile()?'194px':'130px',left:'auto',top:'auto',zIndex:'2147483005',width:'46px',height:'46px',minWidth:'46px',minHeight:'46px',display:'grid',placeItems:'center',margin:'0',pointerEvents:'auto',touchAction:'none',userSelect:'none',cursor:'grab'});
   pencil.setAttribute('aria-hidden','false');
   applyLauncherPosition(pencil,isMobile()?194:130);
   bindLauncherDrag(pencil,()=>syncEditorPanelPosition(pencil));
  }
  applyLauncherPosition(browser,isMobile()?138:74);
  bindLauncherDrag(browser,()=>{
   if(browserPanel&&browserPanel.isConnected)positionPanelFromAnchor(browserPanel,browser);
  });
  applyLauncherPosition(ai,isMobile()?82:18);
  bindLauncherDrag(ai,()=>syncChatPanelPosition(ai));
  syncEditorPanelPosition(pencil);
  syncChatPanelPosition(ai);
  if(browserPanel&&browserPanel.isConnected)stylePanel(browserPanel,248,browser);
 }
 function start(){
  mount();
  enforceViewportPins();
  new MutationObserver(()=>{mount();enforceViewportPins()}).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class','hidden']});
  window.addEventListener('scroll',enforceViewportPins,{capture:true,passive:true});
  window.addEventListener('resize',()=>{mount();enforceViewportPins()},{passive:true});
  document.addEventListener('principia:rendered',mount);
  document.addEventListener('principia:page-changed',mount);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){closePanel(browserPanel);browserPanel=null}});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();