/* PRINCIPIA MINI BROWSER — shared embedded web surface */
(function(){
 'use strict';
 const state={url:'',title:'Trình duyệt mini',visible:false};
 const safeUrl=raw=>{try{const u=new URL(String(raw||''),location.href);return /^https?:$/.test(u.protocol)?u.href:''}catch(e){return ''}};
 const esc=s=>String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function ensureHost(){
  let h=document.getElementById('principiaMiniBrowser');if(h)return h;
  h=document.createElement('section');h.id='principiaMiniBrowser';h.className='pmb-window';h.hidden=true;
  h.innerHTML='<div class="pmb-head"><div class="pmb-title"><span class="pmb-live"></span><strong id="pmbTitle">Trình duyệt mini</strong></div><div class="pmb-actions"><button type="button" title="Tải lại" aria-label="Tải lại" id="pmbReload">↻</button><button type="button" title="Toàn màn hình" aria-label="Toàn màn hình" id="pmbFull">⛶</button><button type="button" title="Đóng" aria-label="Đóng" id="pmbClose">×</button></div></div><iframe id="pmbFrame" title="Trình duyệt mini" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; autoplay; clipboard-read; clipboard-write"></iframe><div class="pmb-foot">Một số website không cho phép hiển thị trong khung nhúng.</div>';
  document.body.appendChild(h);
  h.querySelector('#pmbReload').onclick=()=>{const f=h.querySelector('iframe');try{f.contentWindow.location.reload()}catch(e){f.src=state.url}};
  h.querySelector('#pmbFull').onclick=()=>{if(!document.fullscreenElement)h.requestFullscreen?.();else document.exitFullscreen?.()};
  h.querySelector('#pmbClose').onclick=hide;return h;
 }
 function show(url,title){const u=safeUrl(url);if(!u)return false;const h=ensureHost(),f=h.querySelector('iframe');state.url=u;state.title=title||new URL(u).hostname;state.visible=true;h.hidden=false;h.querySelector('#pmbTitle').textContent=state.title;if(f.src!==u)f.src=u;return true}
 function hide(){const h=document.getElementById('principiaMiniBrowser');if(h)h.hidden=true;state.visible=false}
 window.principiaMiniBrowser={open:show,close:hide,getState:()=>({...state})};
 const oldToggle=window.toggleChatBox;
 if(typeof oldToggle==='function')window.toggleChatBox=function(){oldToggle.apply(this,arguments);const b=document.getElementById('chatBox');if(b?.classList.contains('open')){const a=window.getSelectedAI?.();if(a)show(a.url,a.name||'AI')}else hide()};
 const oldSelect=window.selectPrincipiaAI;
 if(typeof oldSelect==='function')window.selectPrincipiaAI=function(id){const r=oldSelect.apply(this,arguments),a=window.getSelectedAI?.();if(a&&document.getElementById('chatBox')?.classList.contains('open'))show(a.url,a.name||'AI');return r};
 const oldOpen=window.openSelectedAI;
 window.openSelectedAI=function(){const a=window.getSelectedAI?.();if(a)show(a.url,a.name||'AI');else if(oldOpen)oldOpen.apply(this,arguments)};
 const oldSend=window.sendChat;
 if(typeof oldSend==='function')window.sendChat=function(){const a=window.getSelectedAI?.();if(a)show(a.url,a.name||'AI');return oldSend.apply(this,arguments)};
 const oldLesson=window.lesson;
 if(typeof oldLesson==='function')window.lesson=function(){
  const html=oldLesson.apply(this,arguments);let l=null;
  try{const title=document.querySelector('#app h1')?.textContent;const walk=ns=>{for(const n of ns||[]){if(n.type==='lesson'&&n.name===title)return n;const x=walk(n.children);if(x)return x}return null};l=walk(JSON.parse(localStorage.getItem('halo_data')||'[]'))}catch(e){}
  let url=safeUrl(l?.webUrl||l?.previewUrl||l?.url||l?.website||l?.link);
  if(!url){const m=String(l?.content||'').match(/https?:\/\/[^\s<>"')\]]+/i);if(m)url=safeUrl(m[0].replace(/[.,;!?]+$/,''))}
  if(!url)return html;
  const title=esc(l?.name||'Web Preview');
  const panel='<section class="pmb-lesson"><div class="pmb-lesson-head"><strong>🌐 '+title+' · Web Preview</strong><div><button type="button" onclick="try{this.closest(\'.pmb-lesson\').querySelector(\'iframe\').contentWindow.location.reload()}catch(e){this.closest(\'.pmb-lesson\').querySelector(\'iframe\').src=this.closest(\'.pmb-lesson\').querySelector(\'iframe\').src}">↻</button><a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">Mở ngoài ↗</a></div></div><iframe src="'+esc(url)+'" title="'+title+' · Web Preview" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; autoplay"></iframe><p>Một số website có thể chặn iframe theo chính sách bảo mật.</p></section>';
  return html.replace('</div></div>\n <div class="panel"><div class="sectionhead"><h2>Tài liệu</h2>','</div></div>'+panel+'\n <div class="panel"><div class="sectionhead"><h2>Tài liệu</h2>');
 };
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&state.visible)hide()});
})();