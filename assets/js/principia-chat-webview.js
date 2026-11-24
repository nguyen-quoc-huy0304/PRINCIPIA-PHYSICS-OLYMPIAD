/* PRINCIPIA Chat WebView — one panel for AI sites and Google search. */
(()=> {
 'use strict';
 const IDS={chat:'chatBox',view:'principiaChatWebView',frame:'principiaChatWebFrame',input:'principiaChatWebInput'};
 const safeUrl=value=>{
  try{const url=new URL(String(value||''),location.href);return ['http:','https:'].includes(url.protocol)?url.href:''}catch(_){return ''}
 };
 const selectedAI=()=>typeof window.getSelectedAI==='function'?window.getSelectedAI():null;
 let mode='chat';
 function ensure(){
  const chat=document.getElementById(IDS.chat);
  if(!chat)return null;
  let view=document.getElementById(IDS.view);
  if(view)return view;
  view=document.createElement('section');
  view.id=IDS.view;
  view.hidden=true;
  view.style.cssText='display:none;flex:1 1 auto;min-height:240px;min-width:0;flex-direction:column;overflow:hidden;border-top:1px solid var(--line,#46506a);';
  view.innerHTML=
   '<div style="display:flex;gap:6px;align-items:center;padding:8px;flex-wrap:wrap">'+
    '<button type="button" id="principiaChatWebBack">← Chat</button>'+
    '<form id="principiaChatWebForm" style="display:flex;gap:6px;flex:1;min-width:150px">'+
     '<input id="'+IDS.input+'" type="search" autocomplete="off" placeholder="Tìm trên Google hoặc nhập địa chỉ website" aria-label="Tìm trên Google hoặc nhập địa chỉ website" style="flex:1;min-width:0">'+
     '<button type="submit">Đi</button>'+
    '</form>'+
   '</div>'+
   '<div id="principiaChatWebStatus" role="status" aria-live="polite" style="padding:0 10px 7px;font-size:11px;opacity:.75">Nội dung web hiển thị trong khung chat này nếu website cho phép nhúng.</div>'+
   '<iframe id="'+IDS.frame+'" title="Website trong khung chat PRINCIPIA" referrerpolicy="strict-origin-when-cross-origin" style="display:block;flex:1 1 auto;width:100%;min-height:0;border:0;background:#fff"></iframe>';
  const picker=chat.querySelector('.ai-picker-head');
  if(picker)picker.insertAdjacentElement('afterend',view);else chat.appendChild(view);
  view.querySelector('#principiaChatWebBack').addEventListener('click',showChat);
  view.querySelector('#principiaChatWebForm').addEventListener('submit',event=>{
   event.preventDefault();
   const query=view.querySelector('#'+IDS.input).value.trim();
   if(!query)return;
   const direct=safeUrl(query);
   const url=direct&&/^https?:\/\//i.test(query)?direct:'https://www.google.com/search?igu=1&q='+encodeURIComponent(query);
   navigate(url,'Đang mở kết quả Google / website trong khung chat.');
  });
  return view;
 }
 function ensureChatOpen(){
  window.principiaLocalAI?.close?.();
  document.getElementById('principiaMiniBrowser')?.remove();
  const chat=document.getElementById(IDS.chat);
  if(!chat)return false;
  chat.classList.add('open');
  if(typeof window.renderPrincipiaAIChoices==='function')window.renderPrincipiaAIChoices();
  return true;
 }
 function navigate(url,message){
  const valid=safeUrl(url);
  const view=ensure();
  if(!valid||!view)return false;
  ensureChatOpen();
  mode='web';
  const msgs=document.getElementById('chatMsgs');
  const compose=document.querySelector('#chatBox .ai-chat-compose');
  if(msgs)msgs.style.display='none';
  if(compose)compose.style.display='none';
  view.hidden=false;
  view.style.display='flex';
  view.querySelector('#'+IDS.frame).src=valid;
  view.querySelector('#'+IDS.input).value=valid.includes('google.com/')?'':valid;
  view.querySelector('#principiaChatWebStatus').textContent=message||'Đang tải trang. Một số website chặn hiển thị trong iframe.';
  return true;
 }
 function showChat(){
  const view=ensure();
  const msgs=document.getElementById('chatMsgs');
  const compose=document.querySelector('#chatBox .ai-chat-compose');
  if(view){view.hidden=true;view.style.display='none'}
  if(msgs)msgs.style.display='';
  if(compose)compose.style.display='';
  mode='chat';
 }
 function openGoogle(){
  if(!ensureChatOpen())return;
  navigate('https://www.google.com/webhp?igu=1','Google đang được mở bên trong khung chat. Một số nội dung có thể bị Google giới hạn nhúng.');
 }
 function openSelected(){
  const ai=selectedAI();
  if(!ai?.url){if(typeof window.notify==='function')window.notify('Hãy chọn một AI hợp lệ trước.');return}
  navigate(ai.url,'Đang mở '+String(ai.name||'AI')+' trong khung chat. Nếu website chặn iframe, PRINCIPIA không thể ép website cho phép nhúng.');
 }
 function bind(){
  const view=ensure();
  if(!view)return;
  const button=document.querySelector('#chatBox .ai-picker-head button[onclick="openSelectedAI()"]');
  if(button){button.textContent='Mở trong chat';button.title='Mở website AI trong khung chat PRINCIPIA'}
 }
 function install(){
  bind();
  if(typeof window.openSelectedAI==='function'&&!window.openSelectedAI.__principiaEmbedded){
   const open=window.openSelectedAI;
   const replacement=function(){openSelected();};
   replacement.__principiaEmbedded=true;
   window.openSelectedAI=replacement;
  }
  if(typeof window.selectPrincipiaAI==='function'&&!window.selectPrincipiaAI.__principiaEmbedded){
   const select=window.selectPrincipiaAI;
   const replacement=function(id){const result=select(id);if(document.getElementById(IDS.chat)?.classList.contains('open'))openSelected();return result;};
   replacement.__principiaEmbedded=true;
   window.selectPrincipiaAI=replacement;
  }
  window.principiaChatWebView=Object.freeze({openGoogle,openSelected,showChat,navigate});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 document.addEventListener('principia:rendered',bind);
})();
