/* PRINCIPIA Google Gemini client. API keys remain server-side in Cloudflare secrets. */
(() => {
 'use strict';
 const SYSTEM='Bạn là PRINCIPIA, gia sư Vật lý và trợ lý học tập. Trả lời bằng tiếng Việt, chính xác, có cấu trúc. Không bịa dữ kiện. Ưu tiên hỏi gợi mở và gợi ý theo tầng; chỉ đưa lời giải đầy đủ khi người học yêu cầu hoặc đã thử độc lập.';
 let pending=false;
 const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 async function idToken(){
  const auth=window.firebase?.apps?.length?window.firebase.auth():null;
  const user=auth?.currentUser;
  if(!user)throw new Error('Hãy đăng nhập PRINCIPIA để sử dụng AI trực tuyến.');
  return user.getIdToken();
 }
 async function ask(prompt, options={}) {
  const text=String(prompt||'').trim();
  if(!text||text.length>8000)throw new Error('Nội dung cần hỏi phải từ 1 đến 8.000 ký tự.');
  if(pending)throw new Error('AI đang xử lý yêu cầu trước đó.');
  pending=true;
  try {
   const token=await idToken();
   const response=await fetch('/api/ai',{method:'POST',headers:{'content-type':'application/json','authorization':'Bearer '+token},body:JSON.stringify({
    system:String(options.system||SYSTEM).slice(0,6000),
    messages:(Array.isArray(options.history)?options.history:[]).slice(-16).concat([{role:'user',content:text}])
   })});
   const data=await response.json().catch(()=>({}));
   if(!response.ok)throw new Error(data.error||'Yêu cầu AI thất bại ('+response.status+').');
   return data.answer;
  } finally {pending=false;}
 }
 function open(prompt, options={}) {
  const context=String(prompt||'').slice(0,6000);
  const previous=document.getElementById('principiaGeminiPanel');previous?.remove();
  const panel=document.createElement('section');panel.id='principiaGeminiPanel';
  panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-label','PRINCIPIA Google AI');
  panel.style.cssText='position:fixed;inset:0;z-index:2147483646;background:#070b18ed;overflow:auto;padding:12px;color:var(--text,#f5f7ff)';
  panel.innerHTML='<div style="max-width:820px;margin:14px auto;background:var(--card,#151a2b);border:1px solid var(--line,#46506a);border-radius:18px;padding:16px"><header style="display:flex;justify-content:space-between;gap:8px;align-items:center"><div><small>PRINCIPIA · GOOGLE GEMINI</small><h2 style="margin:4px 0">Trợ lý AI trực tuyến</h2></div><button type="button" data-close>Đóng ×</button></header><p style="font-size:12px;opacity:.7">Câu hỏi được gửi tới Google Gemini qua máy chủ PRINCIPIA. Không đưa mật khẩu hoặc dữ liệu nhạy cảm vào cuộc trò chuyện.</p><div data-output aria-live="polite" style="min-height:120px;max-height:52vh;overflow:auto;padding:10px;background:var(--bg,#0d1220);border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere"></div><form data-form style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><textarea data-input rows="3" maxlength="8000" required placeholder="Nhập câu hỏi..." style="flex:1 1 240px;min-width:0;padding:10px;border-radius:9px"></textarea><button type="submit" class="primary">Gửi</button></form><div data-status role="status" style="font-size:12px;margin-top:8px"></div></div>';
  document.body.appendChild(panel);
  const output=panel.querySelector('[data-output]'),input=panel.querySelector('[data-input]'),status=panel.querySelector('[data-status]');
  const history=[];
  panel.querySelector('[data-close]').addEventListener('click',()=>panel.remove());
  if(context){input.value=String(options.initialQuestion||'Hãy bắt đầu hỗ trợ tôi theo ngữ cảnh đã cung cấp.').slice(0,8000);output.textContent='Ngữ cảnh đã được chuẩn bị. Bấm Gửi để gửi lệnh tới Gemini.';}
  panel.querySelector('[data-form]').addEventListener('submit',async event=>{
   event.preventDefault();const question=input.value.trim();if(!question)return;
   const button=panel.querySelector('button[type=submit]');button.disabled=true;status.textContent='Đang gửi yêu cầu tới Google Gemini…';
   output.textContent+='\n\nBạn: '+question;input.value='';
   try{
    const answer=await ask(question,{system:context?SYSTEM+'\n\nNgữ cảnh PRINCIPIA:\n'+context:SYSTEM,history});
    history.push({role:'user',content:question},{role:'assistant',content:answer});
    output.textContent+='\n\nPRINCIPIA · Gemini: '+answer;status.textContent='Đã nhận phản hồi từ Google Gemini.';
   }catch(error){status.textContent=error.message;output.textContent+='\n\nKhông gửi được yêu cầu: '+error.message;input.value=question;}
   finally{button.disabled=false;output.scrollTop=output.scrollHeight;}
  });
  input.focus();
  if(context)panel.querySelector('[data-form]').requestSubmit();
 }
 window.principiaAI=Object.freeze({ask,open,isBusy:()=>pending,provider:'Google Gemini'});
 window.principiaLocalAI=Object.freeze({open:(prompt,question)=>open(prompt,{initialQuestion:question}),close:()=>document.getElementById('principiaGeminiPanel')?.remove()});
})();
