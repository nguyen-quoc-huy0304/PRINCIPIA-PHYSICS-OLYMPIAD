/* PRINCIPIA AI dock: switch Chat and Search inside one assistant panel. */
(()=> {
 'use strict';
 const CHAT='#chatBox',DOCK_AI='#principiaDockAI',HEAD='.ai-chat-head';
 let mode='chat';
 const byId=id=>document.getElementById(id);
 function setActive(next){
  mode=next;
  const root=byId('principiaAIViewSwitch');
  if(!root)return;
  root.querySelectorAll('[data-ai-view]').forEach(button=>{
   const active=button.dataset.aiView===mode;
   button.classList.toggle('is-active',active);
   button.setAttribute('aria-pressed',String(active));
  });
 }
 function showChat(){
  window.principiaChatWebView?.showChat?.();
  const view=byId('principiaChatWebView');
  if(view){view.hidden=true;view.style.display='none'}
  const messages=byId('chatMsgs');
  const compose=document.querySelector('#chatBox .ai-chat-compose');
  if(messages)messages.style.display='';
  if(compose)compose.style.display='';
  setActive('chat');
 }
 function showSearch(){
  if(typeof window.principiaChatWebView?.openGoogle==='function'){
   window.principiaChatWebView.openGoogle();
   setActive('search');
   return;
  }
  window.notify?.('Khung tìm kiếm đang khởi tạo. Thử lại sau giây lát.');
 }
 function mount(){
  const chat=document.querySelector(CHAT),head=chat?.querySelector(HEAD);
  if(!head||byId('principiaAIViewSwitch'))return;
  const switcher=document.createElement('nav');
  switcher.id='principiaAIViewSwitch';
  switcher.className='pr-ai-view-switch';
  switcher.setAttribute('aria-label','Chuyển chế độ trợ lý');
  switcher.innerHTML='<button type="button" data-ai-view="chat" aria-pressed="true" class="is-active"><span aria-hidden="true">✦</span> Chat</button><button type="button" data-ai-view="search" aria-pressed="false"><span aria-hidden="true">⌕</span> Search</button>';
  head.insertAdjacentElement('afterend',switcher);
  switcher.addEventListener('click',event=>{
   const button=event.target.closest('[data-ai-view]');
   if(!button)return;
   button.dataset.aiView==='search'?showSearch():showChat();
  });
 }
 document.addEventListener('click',event=>{
  const launcher=event.target.closest(DOCK_AI);
  if(!launcher)return;
  const chat=byId('chatBox');
  if(!chat?.classList.contains('open'))showChat();
 },true);
 document.addEventListener('principia:rendered',mount);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 window.principiaAIViewSwitch=Object.freeze({showChat,showSearch});
})();