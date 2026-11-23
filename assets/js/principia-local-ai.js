/* PRINCIPIA Local AI — lazy WebLLM runtime. Model is downloaded only after user opts in. */
(function(){
 'use strict';
 const MODEL='SmolLM2-360M-Instruct-q4f32_1-MLC';
 const MODEL_SIZE='khoảng 580 MB VRAM (mức tham khảo; tải lần đầu)';
 const SYSTEM='Bạn là gia sư PRINCIPIA, trả lời bằng tiếng Việt rõ ràng, thân thiện. Dạy từng bước, giải thích bản chất vật lý, nêu đơn vị và kiểm tra giả thiết. Không bịa dữ kiện; nếu không chắc hãy nói rõ. Ưu tiên gợi ý trước khi đưa lời giải đầy đủ.';
 let engine=null,loading=null,busy=false,history=[],context='';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function root(){let el=document.getElementById('principiaLocalAI');if(!el){el=document.createElement('div');el.id='principiaLocalAI';el.style.cssText='position:fixed;inset:0;z-index:2147483646;background:rgba(3,7,18,.88);overflow:auto;padding:12px;color:var(--text,#f5f7ff);';document.body.appendChild(el)}return el}
 function open(seed,question){
  context=String(seed||'').slice(0,6000);history=[];
  const el=root();
  el.innerHTML='<section style="max-width:760px;margin:12px auto;background:var(--card,#151a2b);border:1px solid var(--line,#3a4055);border-radius:18px;padding:16px;box-shadow:0 18px 60px #0008">'+
   '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><div><div style="font-size:11px;opacity:.7;letter-spacing:1px">PRINCIPIA · AI CỤC BỘ</div><h2 style="margin:4px 0">Gia sư AI trên thiết bị</h2></div><button onclick="principiaLocalAI.close()">Đóng ×</button></div>'+
   '<p style="font-size:13px;opacity:.8">Chạy bằng WebGPU trên trình duyệt. Không cần API key; nội dung trò chuyện được xử lý trên thiết bị. Mô hình chỉ tải khi bạn bấm nút bên dưới.</p>'+
   '<div style="border:1px solid var(--line,#3a4055);border-radius:12px;padding:12px;margin:10px 0"><b>SmolLM2 360M · bản gọn</b><p style="margin:5px 0;font-size:13px">Mô hình cần khoảng 580 MB VRAM theo cấu hình tham khảo; dung lượng tải về có thể khác. Cần trình duyệt hỗ trợ WebGPU và bộ nhớ GPU phù hợp. Bản nhỏ có thể trả lời hạn chế hơn AI trực tuyến.</p><div id="plaStatus" role="status" style="font-size:13px;margin:8px 0">Chưa tải mô hình.</div><div style="height:7px;background:#68708033;border-radius:8px;overflow:hidden"><div id="plaProgress" style="height:100%;width:0;background:#6b9cff"></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px"><button id="plaLoad" class="primary" onclick="principiaLocalAI.load()">Tải và bật AI cục bộ</button><button onclick="principiaLocalAI.unload()">Giải phóng bộ nhớ</button></div></div>'+
   '<div id="plaMsgs" aria-live="polite" style="min-height:130px;max-height:42vh;overflow:auto;padding:8px;border-radius:12px;background:var(--bg,#0d1220)"><p style="opacity:.65;font-size:13px">Khi mô hình sẵn sàng, hãy gửi câu hỏi đầu tiên.</p></div>'+
   '<div style="display:flex;gap:8px;margin-top:10px"><textarea id="plaInput" rows="2" placeholder="Hỏi gia sư PRINCIPIA..." style="flex:1;min-width:0;padding:11px;border-radius:10px;background:var(--bg,#0d1220);color:inherit;border:1px solid var(--line,#3a4055)"></textarea><button id="plaSend" onclick="principiaLocalAI.send()" class="primary">Gửi</button></div>'+
   '<p style="font-size:11px;opacity:.65;margin-top:8px">Mẹo: đóng ứng dụng nặng khác nếu GPU thiếu bộ nhớ. Không hỗ trợ WebGPU? Hãy dùng trợ lý AI trực tuyến hiện có.</p></section>';
  const q=document.getElementById('plaInput');if(q&&question)q.value=String(question).slice(0,4000);
  if(engine)status('AI đã sẵn sàng trên thiết bị.');
 }
 function status(t){const n=document.getElementById('plaStatus');if(n)n.textContent=t}
 function progress(p){const n=document.getElementById('plaProgress');if(n)n.style.width=Math.max(0,Math.min(1,Number(p)||0))*100+'%'}
 async function load(){
  if(engine){status('AI đã sẵn sàng.');return}
  if(loading)return loading;
  if(!navigator.gpu){status('Thiết bị/trình duyệt chưa hỗ trợ WebGPU. Hãy thử Chrome hoặc Edge mới trên thiết bị tương thích.');return}
  loading=(async()=>{
   const b=document.getElementById('plaLoad');if(b)b.disabled=true;
   try{
    status('Đang tải thư viện AI...');
    const webllm=await import('https://esm.run/@mlc-ai/web-llm');
    status('Đang tải mô hình lần đầu. Vui lòng giữ trang mở...');
    engine=await webllm.CreateMLCEngine(MODEL,{initProgressCallback:p=>{status(p.text||'Đang chuẩn bị mô hình...');progress(p.progress)}});
    status('AI đã sẵn sàng. Mô hình sẽ được lưu cache để lần sau không phải tải lại toàn bộ.');
   }catch(e){engine=null;status('Không tải được AI: '+(e&&e.message?e.message:String(e))+' · Kiểm tra mạng, WebGPU và bộ nhớ GPU rồi thử lại.')}
   finally{loading=null;if(b)b.disabled=false}
  })();
  return loading;
 }
 function add(role,text){const box=document.getElementById('plaMsgs');if(!box)return null;const wrap=document.createElement('div');wrap.style.cssText='padding:10px;margin:7px 0;border-radius:11px;background:'+(role==='user'?'#3567a733':'#ffffff0b')+';white-space:pre-wrap;overflow-wrap:anywhere';const label=document.createElement('b');label.textContent=role==='user'?'Bạn':'PRINCIPIA AI';label.style.cssText='display:block;font-size:11px;opacity:.7;margin-bottom:5px';const body=document.createElement('div');body.textContent=text;wrap.append(label,body);box.appendChild(wrap);box.scrollTop=box.scrollHeight;return body}
 async function send(){
  const input=document.getElementById('plaInput'),q=(input&&input.value||'').trim();if(!q||busy)return;
  if(!engine){status('Hãy tải mô hình trước khi trò chuyện.');return}
  if(input)input.value='';busy=true;
  const sendBtn=document.getElementById('plaSend');if(sendBtn)sendBtn.disabled=true;
  add('user',q);history.push({role:'user',content:q});
  const out=add('assistant','Đang suy nghĩ...');
  try{
   const messages=[{role:'system',content:SYSTEM+(context?'\n\nNgữ cảnh PRINCIPIA do người học cung cấp:\n'+context:'')}].concat(history.slice(-10));
   const stream=await engine.chat.completions.create({messages,temperature:.55,max_tokens:420,stream:true});
   let answer='';
   for await(const chunk of stream){const part=chunk.choices&&chunk.choices[0]&&chunk.choices[0].delta&&chunk.choices[0].delta.content;if(part){answer+=part;if(out)out.textContent=answer}}
   if(!answer)answer='Mô hình không tạo được câu trả lời lần này. Hãy thử hỏi lại ngắn hơn.';
   history.push({role:'assistant',content:answer});
   if(history.length>16)history=history.slice(-16);
  }catch(e){if(out)out.textContent='Có lỗi khi tạo câu trả lời: '+(e&&e.message?e.message:String(e));history.pop()}
  finally{busy=false;if(sendBtn)sendBtn.disabled=false;if(input)input.focus()}
 }
 async function unload(){if(busy){status('Đang tạo câu trả lời; hãy đợi hoàn tất trước khi giải phóng GPU.');return}if(engine){try{await engine.unload()}catch(_){}engine=null;status('Đã giải phóng bộ nhớ GPU. Cache mô hình đã tải vẫn có thể được giữ lại.')}else status('Chưa có mô hình nào đang chạy.')}
 function close(){const el=document.getElementById('principiaLocalAI');if(el)el.remove()}
 window.principiaLocalAI={open,load,send,unload,close};
})();