/* PRINCIPIA AI handoff — one chat panel, one embedded web view, no popup tabs. */
(()=> {
 'use strict';
 const IDS={chat:'chatBox',view:'principiaChatWebView',frame:'principiaChatWebFrame',input:'principiaChatWebInput'};
 const safeUrl=value=>{
  try{const url=new URL(String(value||''),location.href);return ['http:','https:'].includes(url.protocol)?url.href:''}catch(_){return ''}
 };
 const selectedAI=()=>typeof window.getSelectedAI==='function'?window.getSelectedAI():null;
 function ensure(){
  const chat=document.getElementById(IDS.chat);
  if(!chat)return null;
  let view=document.getElementById(IDS.view);
  if(view)return view;
  view=document.createElement('section');
  view.id=IDS.view;
  view.hidden=true;
  view.style.cssText='display:none;flex:1 1 auto;min-height:240px;min-width:0;flex-direction:column;overflow:hidden;border-top:1px solid var(--line,#46506a)';
  view.innerHTML=
   '<div style="display:flex;gap:6px;align-items:center;padding:8px;flex-wrap:wrap">'+
    '<button type="button" id="principiaChatWebBack">← Chat</button>'+
    '<form id="principiaChatWebForm" style="display:flex;gap:6px;flex:1;min-width:150px">'+
     '<input id="'+IDS.input+'" type="search" autocomplete="off" placeholder="Tìm trên Google hoặc nhập địa chỉ website" aria-label="Tìm trên Google hoặc nhập địa chỉ website" style="flex:1;min-width:0">'+
     '<button type="submit">Đi</button>'+
    '</form>'+
   '</div>'+
   '<div id="principiaChatWebStatus" role="status" aria-live="polite" style="padding:0 10px 7px;font-size:11px;opacity:.75">Trang web được mở trong khung này nếu nhà cung cấp cho phép nhúng.</div>'+
   '<iframe id="'+IDS.frame+'" title="Website AI trong PRINCIPIA" referrerpolicy="strict-origin-when-cross-origin" allow="clipboard-read; clipboard-write" style="display:block;flex:1 1 auto;width:100%;min-height:0;border:0;background:#fff"></iframe>';
  const picker=chat.querySelector('.ai-picker-head');
  if(picker)picker.insertAdjacentElement('afterend',view);else chat.appendChild(view);
  view.querySelector('#principiaChatWebBack').addEventListener('click',showChat);
  view.querySelector('#principiaChatWebForm').addEventListener('submit',event=>{
   event.preventDefault();
   const query=view.querySelector('#'+IDS.input).value.trim();
   if(!query)return;
   const direct=/^https?:\/\//i.test(query)?safeUrl(query):'';
   navigate(direct||'https://www.google.com/search?igu=1&q='+encodeURIComponent(query),direct?'Đang mở website trong khung chat.':'Đang mở kết quả Google trong khung chat.');
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
  const valid=safeUrl(url),view=ensure();
  if(!valid||!view)return false;
  if(!ensureChatOpen())return false;
  const msgs=document.getElementById('chatMsgs');
  const compose=document.querySelector('#chatBox .ai-chat-compose');
  if(msgs)msgs.style.display='none';
  if(compose)compose.style.display='none';
  view.hidden=false;
  view.style.display='flex';
  const frame=view.querySelector('#'+IDS.frame);
  if(frame.src!==valid)frame.src=valid;
  view.querySelector('#'+IDS.input).value=valid.includes('google.com/')?'':valid;
  view.querySelector('#principiaChatWebStatus').textContent=message||'Đang tải trang. Website bên ngoài có thể chặn iframe.';
  return true;
 }
 function showChat(){
  const view=ensure();
  const msgs=document.getElementById('chatMsgs');
  const compose=document.querySelector('#chatBox .ai-chat-compose');
  if(view){view.hidden=true;view.style.display='none'}
  if(msgs)msgs.style.display='';
  if(compose)compose.style.display='';
 }
 function openSelected(){
  const ai=selectedAI();
  if(!ai?.url){window.notify?.('Hãy chọn một AI hợp lệ trước.');return false}
  const url=safeUrl(ai.url);
  if(!url){window.notify?.('Địa chỉ AI không hợp lệ.');return false}
  return navigate(url,'Đang mở '+String(ai.name||'AI')+' trong khung chat PRINCIPIA. Nếu nhà cung cấp chặn iframe, trang đó sẽ không thể hiển thị tại đây.');
 }
 async function copyText(value){
  try{await navigator.clipboard.writeText(value);return true}catch(_){}
  try{
   const field=document.createElement('textarea');
   field.value=value;field.setAttribute('readonly','');
   field.style.cssText='position:fixed;left:-9999px;top:0;opacity:0';
   document.body.appendChild(field);field.select();
   const copied=document.execCommand('copy');field.remove();return copied;
  }catch(_){return false}
 }
 async function handoffMessage(){
  const input=document.getElementById('chatInput');
  const message=input?.value.trim()||'';
  if(!message){window.notify?.('Nhập câu hỏi trước khi gửi.');return}
  if(!window.principiaAI?.ask){window.notify?.('Google AI chưa sẵn sàng. Hãy tải lại trang.');return}
  const send=document.querySelector('#chatBox .ai-chat-compose button');
  if(send)send.disabled=true;
  if(input)input.value='';
  const stored=typeof window.principiaChatHistory==='function'?window.principiaChatHistory():[];
  const history=Array.isArray(stored)?stored:[];
  const prior=history.filter(item=>['user','assistant'].includes(item.role)).slice(-12).map(item=>({role:item.role,content:String(item.text||'').slice(0,4000)}));
  history.push({role:'user',text:message,at:Date.now()});
  if(typeof window.savePrincipiaChatHistory==='function')window.savePrincipiaChatHistory(history);
  window.renderPrincipiaChatHistory?.();
  const status=document.querySelector('#chatBox .ai-chat-sub');
  if(status)status.textContent='Đang gửi yêu cầu tới Google Gemini…';
  try{
   const answer=await window.principiaAI.ask(message,{history:prior});
   history.push({role:'assistant',text:answer,at:Date.now()});
   if(typeof window.savePrincipiaChatHistory==='function')window.savePrincipiaChatHistory(history);
   window.renderPrincipiaChatHistory?.();
   if(status)status.textContent='Đã nhận phản hồi từ Google Gemini.';
  }catch(error){
   history.push({role:'assistant',text:'Không gửi được yêu cầu: '+String(error.message||error),at:Date.now()});
   if(typeof window.savePrincipiaChatHistory==='function')window.savePrincipiaChatHistory(history);
   window.renderPrincipiaChatHistory?.();
   if(status)status.textContent=String(error.message||error);
  }finally{if(send)send.disabled=false}
 }
 function install(){
  ensure();
  const openButton=document.querySelector('#chatBox .ai-picker-head button[onclick="openSelectedAI()"]');
  if(openButton){openButton.textContent='Mở trong chat';openButton.title='Mở AI trong khung chat hiện tại';}
  if(typeof window.openSelectedAI==='function'&&!window.openSelectedAI.__principiaSingleView){
   const replacement=function(){return openSelected()};
   replacement.__principiaSingleView=true;
   window.openSelectedAI=replacement;
  }
  if(typeof window.selectPrincipiaAI==='function'&&!window.selectPrincipiaAI.__principiaSingleView){
   const original=window.selectPrincipiaAI;
   const replacement=function(id){
    const result=original.call(this,id);
    if(document.getElementById(IDS.chat)?.classList.contains('open'))openSelected();
    return result;
   };
   replacement.__principiaSingleView=true;
   window.selectPrincipiaAI=replacement;
  }
  if(typeof window.sendChat==='function'&&!window.sendChat.__principiaSingleView){
   handoffMessage.__principiaSingleView=true;
   window.sendChat=handoffMessage;
  }
  const compose=document.querySelector('#chatBox .ai-chat-compose .ai-chat-sub');
  if(compose)compose.textContent='Gửi để chuyển câu hỏi tới Google Gemini và nhận câu trả lời ngay trong PRINCIPIA.';
  window.principiaChatWebView=Object.freeze({openGoogle:()=>navigate('https://www.google.com/webhp?igu=1','Google đang mở trong khung chat.'),openSelected,showChat,navigate});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
 document.addEventListener('principia:rendered',install);
})();