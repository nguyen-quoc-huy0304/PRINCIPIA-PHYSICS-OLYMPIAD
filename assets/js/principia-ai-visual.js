/* PRINCIPIA AI icon adapter — reuses the installed icon and animation libraries. */
(()=> {
 'use strict';
 const ROOT='#chatBox';
 const iconMap={chat:'chat',search:'search',clear:'trash',close:'close',send:'send',back:'back'};
 const $=(selector,root=document)=>root.querySelector(selector);
 function makeIcon(name){
  const library=window.PrincipiaIconLibrary;
  if(!library?.icon)return null;
  return library.icon(iconMap[name]||name,{size:'1em',extraClass:'pr-ai-native-icon'});
 }
 function decorateButton(button,name,label){
  if(!button||button.dataset.prAiDecorated==='1')return;
  const icon=makeIcon(name);
  if(!icon)return;
  const span=document.createElement('span');
  span.className='pr-ai-switch-icon';
  span.setAttribute('aria-hidden','true');
  span.append(icon);
  button.insertBefore(span,button.firstChild);
  if(label)button.setAttribute('aria-label',label);
  button.dataset.prAiDecorated='1';
 }
 function mount(){
  const root=$(ROOT);
  if(!root)return;
  const switcher=$('#principiaAIViewSwitch',root);
  if(switcher){
   decorateButton(switcher.querySelector('[data-ai-view="chat"]'),'chat','Chat');
   decorateButton(switcher.querySelector('[data-ai-view="search"]'),'search','Tìm kiếm');
  }
  const head=$('.ai-chat-head',root);
  if(head){
   const buttons=head.querySelectorAll('button.iconbtn');
   decorateButton(buttons[0],'clear','Xóa lịch sử');
   decorateButton(buttons[1],'close','Đóng trợ lý');
  }
  const send=$('.ai-chat-compose button',root);
  decorateButton(send,'send','Gửi tin nhắn');
 }
 document.addEventListener('click',event=>{
  const button=event.target.closest('#principiaAIViewSwitch button,#chatBox .iconbtn,#chatBox .ai-chat-compose button');
  if(!button||window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const animation=window.PrincipiaIconLibrary?.animate;
  const icon=button.querySelector('.pr-ai-native-icon');
  if(animation&&icon)animation(icon,'pulse',{duration:360,repeat:1});
 });
 document.addEventListener('DOMContentLoaded',mount,{once:true});
 document.addEventListener('principia:rendered',mount);
 const observer=new MutationObserver(mount);
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>observer.observe(document.body,{childList:true,subtree:true}),{once:true});
 else observer.observe(document.body,{childList:true,subtree:true});
 mount();
 window.PrincipiaAIVisual=Object.freeze({refresh:mount});
})();