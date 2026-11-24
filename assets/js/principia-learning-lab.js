/* PRINCIPIA Learning Lab — AI concept maps, prerequisite checks and Socratic oral practice. */
(() => {
  'use strict';
  const STORE='principia_learning_lab_v1', MAX_MAPS=20, MAX_HISTORY=12;
  const PERSONAS={
    coach:'Gia sư Socrates kiên nhẫn, hỏi từng câu và không làm hộ.',
    beginner:'Học sinh mới học, hỏi câu nền tảng và nói rõ chỗ chưa hiểu.',
    skeptic:'Người phản biện, yêu cầu giải thích giả thiết, điều kiện và bằng chứng.',
    olympiad:'Học sinh Olympic, truy vấn lập luận và thử chuyển giao kiến thức.'
  };
  let overlay=null, tab='map', currentMap=null, tutor=null, busy=false, recognition=null;

  const text=(value,max=1200)=>String(value==null?'':value).replace(/\s+/g,' ').trim().slice(0,max);
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function read(){
    try{const value=JSON.parse(localStorage.getItem(STORE)||'{}');return{maps:Array.isArray(value.maps)?value.maps.filter(map=>map&&typeof map.id==='string'&&typeof map.topic==='string'&&Array.isArray(map.concepts)&&Array.isArray(map.prerequisites)).slice(0,MAX_MAPS):[]};}
    catch(_){return{maps:[]};}
  }
  function save(state){
    try{localStorage.setItem(STORE,JSON.stringify({maps:state.maps.slice(0,MAX_MAPS)}));return true;}
    catch(error){console.warn('[PRINCIPIA Learning Lab] Storage unavailable',error);return false;}
  }
  function parse(raw){
    const source=String(raw||'').trim().replace(/^\x60\x60\x60(?:json)?\s*/i,'').replace(/\s*\x60\x60\x60$/,'');
    try{return JSON.parse(source);}catch(_){}
    const start=source.indexOf('{');if(start<0)throw new Error('AI chưa trả về JSON hợp lệ.');
    let depth=0,quoted=false,escaped=false;
    for(let i=start;i<source.length;i++){
      const c=source[i];
      if(quoted){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c==='"')quoted=false;continue;}
      if(c==='"')quoted=true;else if(c==='{')depth++;else if(c==='}'&&--depth===0)return JSON.parse(source.slice(start,i+1));
    }
    throw new Error('Dữ liệu JSON từ AI chưa hoàn chỉnh.');
  }
  function slug(value,index){
    return (text(value,80).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'concept-'+(index+1)).slice(0,64);
  }
  function normalizeMap(raw,topic){
    if(!raw||!Array.isArray(raw.concepts))throw new Error('Bản đồ kiến thức sai cấu trúc.');
    const concepts=raw.concepts.slice(0,8).map((item,index)=>{
      if(!item||typeof item!=='object')return null;
      const title=text(item.title,100),coreIdea=text(item.coreIdea,500),checkQuestion=text(item.checkQuestion,500);
      if(!title||!coreIdea||!checkQuestion)return null;
      return{id:slug(item.id||title,index),title,coreIdea,checkQuestion,misconception:text(item.misconception,400),dependsOn:Array.isArray(item.dependsOn)?item.dependsOn.slice(0,5).map(x=>slug(x,0)):[]};
    }).filter(Boolean);
    if(concepts.length<4)throw new Error('Cần ít nhất 4 khái niệm để tạo lộ trình.');
    const ids=new Set();
    concepts.forEach((item,index)=>{const base=item.id;let id=base,n=2;while(ids.has(id))id=base+'-'+n++;item.id=id;ids.add(id);});
    concepts.forEach(item=>{item.dependsOn=item.dependsOn.filter(id=>ids.has(id)&&id!==item.id);});
    const prerequisites=(Array.isArray(raw.prerequisites)?raw.prerequisites:[]).slice(0,5).map(item=>({name:text(item?.name,100),reason:text(item?.reason,260),checkQuestion:text(item?.checkQuestion,300)})).filter(x=>x.name&&x.reason&&x.checkQuestion);
    return{id:'map-'+Date.now().toString(36),topic:text(raw.topic||topic,120),level:text(raw.level||'Chưa xác định',60),overview:text(raw.overview,600),prerequisites,concepts,createdAt:new Date().toISOString()};
  }
  function client(){
    if(!window.principiaAI||typeof window.principiaAI.ask!=='function')throw new Error('Gemini chưa sẵn sàng. Kiểm tra kết nối AI.');
    return window.principiaAI;
  }
  async function generateMap(topic,level,goal){
    const subject=text(topic,120);if(subject.length<2)throw new Error('Nhập chủ đề học cụ thể.');
    const system=[
      'Bạn là chuyên gia thiết kế chương trình Vật lý và tư duy khoa học.',
      'Tạo lộ trình kiến thức theo thứ tự tiên quyết, từ nền tảng đến nâng cao. Nêu ngộ nhận phổ biến.',
      'Trả về duy nhất JSON hợp lệ theo schema: {"topic":"...","level":"...","overview":"...","prerequisites":[{"name":"...","reason":"...","checkQuestion":"..."}],"concepts":[{"id":"...","title":"...","dependsOn":["id xuất hiện trước"],"coreIdea":"...","misconception":"...","checkQuestion":"..."}]}.',
      'Có 4-8 concepts. dependsOn chỉ tham chiếu id đã xuất hiện trước đó. Mỗi concept có câu hỏi kiểm tra khả năng tự giải thích. Không cung cấp đáp án.'
    ].join('\n');
    const prompt='Tạo bản đồ cho chủ đề '+subject+'. Trình độ: '+text(level,60)+'. Mục tiêu: '+text(goal,160)+'.';
    return normalizeMap(parse(await client().ask(prompt,{system})),subject);
  }
  function validateReply(raw){
    const data=parse(raw),question=text(data.question||data.nextQuestion,700);
    if(!question)throw new Error('AI chưa tạo câu hỏi tiếp theo.');
    const score=Number(data.understanding);
    return{feedback:text(data.feedback,900),question,hint:text(data.hint,500),understanding:Number.isFinite(score)?Math.max(0,Math.min(100,Math.round(score))):null,status:text(data.masteryStatus,80)};
  }
  function systemTutor(){
    return[
      'Bạn là gia sư vấn đáp Vật lý PRINCIPIA. Vai trò: '+(PERSONAS[tutor.persona]||PERSONAS.coach),
      'Độ khó: '+tutor.difficulty+'. Tự tăng độ khó khi người học trả lời có lập luận.',
      'Mỗi lượt chỉ hỏi một câu. Không tiết lộ đáp án cuối hoặc giải trọn bài. Khi sai, chỉ ra một điểm và đưa một gợi ý nhỏ.',
      'Kiểm tra đơn vị, giả thiết, ý nghĩa vật lý và tính hợp lý khi thích hợp.',
      'Trả về duy nhất JSON: {"feedback":"nhận xét ngắn","understanding":0,"question":"một câu hỏi tiếp theo","hint":"gợi ý ngắn","masteryStatus":"đang khám phá|đang tiến bộ|cần ôn lại|có thể chuyển bước"}. question luôn bắt buộc; understanding 0-100 là ước lượng, không phải điểm chính thức.'
    ].join('\n');
  }
  function styles(){
    if(document.getElementById('principiaLearningLabStyles'))return;
    const style=document.createElement('style');style.id='principiaLearningLabStyles';
    style.textContent=[
      '#principiaLearningLab{position:fixed;inset:0;z-index:2147483300;display:none;overflow:auto;padding:12px;background:#030712dd;backdrop-filter:blur(12px);color:var(--text,#f5f7ff);font:inherit}',
      '#principiaLearningLab .pll-shell{width:min(1050px,100%);min-height:70vh;margin:2vh auto;border:1px solid var(--line,#39435b);border-radius:20px;background:var(--bg,#111827);box-shadow:0 24px 90px #0009;overflow:hidden}',
      '#principiaLearningLab .pll-head{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:var(--side,#171e30)}#principiaLearningLab .pll-head small{opacity:.7;letter-spacing:1.5px}',
      '#principiaLearningLab h2{margin:4px 0;font-size:21px}#principiaLearningLab .pll-close{border:0;background:transparent;color:inherit;font-size:27px}',
      '#principiaLearningLab .pll-tabs{display:flex;gap:8px;padding:10px 14px;overflow:auto;border-bottom:1px solid var(--line,#39435b)}',
      '#principiaLearningLab button,#principiaLearningLab input,#principiaLearningLab textarea,#principiaLearningLab select{font:inherit}#principiaLearningLab button{cursor:pointer}',
      '#principiaLearningLab .pll-tabs button,#principiaLearningLab .pll-actions button{border:1px solid var(--line,#39435b);border-radius:10px;padding:9px 12px;background:transparent;color:inherit;white-space:nowrap}',
      '#principiaLearningLab .pll-tabs button[aria-current=true],#principiaLearningLab .pll-primary{background:var(--primary,#6557dc);color:#fff;border-color:transparent}',
      '#principiaLearningLab .pll-body{padding:18px}#principiaLearningLab .pll-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}',
      '#principiaLearningLab .pll-card{border:1px solid var(--line,#39435b);border-radius:14px;padding:14px;background:var(--card,#171e30);min-width:0}#principiaLearningLab .pll-card h3{font-size:16px;margin:0 0 8px}',
      '#principiaLearningLab .pll-muted{opacity:.72;font-size:13px;line-height:1.5}#principiaLearningLab label{display:block;font-size:13px;margin:10px 0 4px}',
      '#principiaLearningLab input,#principiaLearningLab textarea,#principiaLearningLab select{box-sizing:border-box;width:100%;margin:5px 0 8px;padding:10px;border:1px solid var(--line,#39435b);border-radius:9px;background:var(--bg,#101626);color:inherit}',
      '#principiaLearningLab textarea{min-height:95px;resize:vertical}#principiaLearningLab .pll-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#principiaLearningLab .pll-primary{border:1px solid transparent;border-radius:10px;padding:10px 14px}',
      '#principiaLearningLab .pll-transcript{display:grid;gap:10px;max-height:42vh;overflow:auto;margin:12px 0}#principiaLearningLab .pll-message{padding:12px;border:1px solid var(--line,#39435b);border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere}',
      '#principiaLearningLab .pll-message[data-role=ai]{background:var(--side,#171e30)}#principiaLearningLab .pll-status{font-size:13px;min-height:20px;margin-top:8px}',
      '#principiaLearningLab .pll-map-list{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}#principiaLearningLab .pll-map-list button{border:1px solid var(--line,#39435b);border-radius:9px;padding:8px;background:transparent;color:inherit}',
      '@media(max-width:620px){#principiaLearningLab{padding:0}#principiaLearningLab .pll-shell{min-height:100vh;margin:0;border-radius:0}#principiaLearningLab .pll-body{padding:12px}}'
    ].join('');document.head.appendChild(style);
  }
  function ensure(){
    if(overlay)return overlay;styles();overlay=document.createElement('div');overlay.id='principiaLearningLab';
    overlay.innerHTML='<section class="pll-shell" role="dialog" aria-modal="true" aria-labelledby="pllTitle"><header class="pll-head"><div><small>PRINCIPIA · LEARNING INTELLIGENCE</small><h2 id="pllTitle">Learning Lab</h2></div><button type="button" class="pll-close" data-close aria-label="Đóng">×</button></header><nav class="pll-tabs"><button type="button" data-tab="map">Bản đồ kiến thức</button><button type="button" data-tab="tutor">Vấn đáp AI</button></nav><main class="pll-body" id="pllBody"></main></section>';
    overlay.addEventListener('click',event=>{if(event.target===overlay)close();});
    overlay.querySelector('[data-close]').addEventListener('click',close);
    document.addEventListener('keydown',event=>{if(event.key==='Escape'&&overlay?.style.display!=='none')close();});
    document.body.appendChild(overlay);return overlay;
  }
  function open(next='map'){
    tab=next==='tutor'?'tutor':'map';ensure().style.display='block';render();
  }
  function close(){
    if(recognition){try{recognition.stop();}catch(_){}recognition=null;}
    if('speechSynthesis'in window)window.speechSynthesis.cancel();
    if(overlay)overlay.style.display='none';
  }
  function status(message,error=false){
    const node=overlay?.querySelector('[data-status]');if(node){node.textContent=message;node.style.color=error?'#ef8b8b':'inherit';}
  }
  function renderMap(){
    const maps=read().maps,map=currentMap||maps[0]||null;currentMap=map;
    const saved=maps.map(item=>'<button type="button" data-load-map="'+esc(item.id)+'">'+esc(item.topic)+'</button>').join('');
    if(!map)return '<section class="pll-card"><h3>Tạo bản đồ kiến thức cá nhân hóa</h3><p class="pll-muted">Gemini xác định kiến thức tiên quyết, thứ tự học, khái niệm cốt lõi và ngộ nhận phổ biến. Mỗi khái niệm có câu hỏi tự kiểm tra.</p><label>Chủ đề</label><input id="pllTopic" maxlength="120" placeholder="Ví dụ: Điện trường và điện thế"><label>Trình độ</label><select id="pllLevel"><option>Chưa vững nền tảng</option><option>Đang học trên lớp</option><option>Khá, cần luyện sâu</option><option>Ôn thi học sinh giỏi / Olympic</option></select><label>Mục tiêu</label><input id="pllGoal" maxlength="160" placeholder="Hiểu bản chất và giải bài Olympic"><div class="pll-actions"><button type="button" class="pll-primary" data-generate>Tạo bản đồ bằng Gemini</button></div><div class="pll-status" data-status role="status"></div></section>'+(saved?'<section class="pll-card"><h3>Bản đồ đã lưu</h3><div class="pll-map-list">'+saved+'</div></section>':'');
    const prerequisites=map.prerequisites.map(item=>'<article class="pll-card"><h3>'+esc(item.name)+'</h3><p>'+esc(item.reason)+'</p><p class="pll-muted">Tự hỏi: '+esc(item.checkQuestion)+'</p></article>').join('');
    const concepts=map.concepts.map((item,index)=>{
      const deps=item.dependsOn.map(id=>map.concepts.find(x=>x.id===id)?.title).filter(Boolean);
      return '<article class="pll-card"><div class="pll-muted">BƯỚC '+(index+1)+'</div><h3>'+esc(item.title)+'</h3><p class="pll-muted">'+(deps.length?'Học sau: '+esc(deps.join(' · ')):'Kiến thức nền')+'</p><p>'+esc(item.coreIdea)+'</p><p class="pll-muted"><b>Ngộ nhận:</b> '+esc(item.misconception||'Hãy tự nêu một trường hợp dễ áp dụng sai.')+'</p><div class="pll-actions"><button type="button" class="pll-primary" data-check="'+esc(item.id)+'">Tự kiểm tra bằng vấn đáp</button></div></article>';
    }).join('');
    return '<section class="pll-card"><div class="pll-muted">BẢN ĐỒ KIẾN THỨC · '+esc(map.level)+'</div><h3>'+esc(map.topic)+'</h3><p>'+esc(map.overview)+'</p><div class="pll-actions"><button type="button" data-new>Thêm bản đồ</button><button type="button" data-export>Xuất bản đồ .txt</button></div></section>'+(prerequisites?'<h3 style="margin:16px 0 8px">Kiến thức tiên quyết</h3><div class="pll-grid">'+prerequisites+'</div>':'')+'<h3 style="margin:16px 0 8px">Lộ trình từ nền tảng đến nâng cao</h3><div class="pll-grid">'+concepts+'</div>'+(saved?'<section class="pll-card" style="margin-top:12px"><h3>Bản đồ đã lưu</h3><div class="pll-map-list">'+saved+'</div></section>':'')+'<div class="pll-status" data-status role="status"></div>';
  }
  function renderTutor(){
    const messages=tutor?tutor.transcript.map(item=>'<article class="pll-message" data-role="'+item.role+'"><b>'+(item.role==='ai'?'PRINCIPIA':'Bạn')+'</b><div>'+esc(item.text)+'</div></article>').join(''):'';
    const session=tutor?'<section class="pll-card"><div class="pll-muted">VẤN ĐÁP · '+esc(tutor.topic)+'</div><div class="pll-transcript">'+messages+'</div><div class="pll-actions"><button type="button" data-speak>Đọc câu hỏi</button><button type="button" data-listen>Trả lời bằng giọng nói</button><button type="button" data-stop>Ngừng thu âm</button></div><label>Câu trả lời</label><textarea id="pllAnswer" maxlength="2400" placeholder="Tự giải thích bằng lời của bạn..."></textarea><div class="pll-actions"><button type="button" class="pll-primary" data-send>Gửi câu trả lời</button><button type="button" data-reset>Phiên mới</button></div><div class="pll-status" data-status role="status"></div></section>':'';
    return '<section class="pll-card"><h3>Vấn đáp Socrates · học bằng cách tự giải thích</h3><p class="pll-muted">AI hỏi từng câu, kiểm tra lập luận và điều chỉnh độ khó. Có thể trả lời bằng bàn phím hoặc giọng nói nếu trình duyệt hỗ trợ tiếng Việt.</p><label>Chủ đề</label><input id="pllTutorTopic" maxlength="120" placeholder="Ví dụ: Vì sao vật rơi có gia tốc?"><label>Vai trò AI</label><select id="pllPersona"><option value="coach">Gia sư Socrates</option><option value="beginner">Học sinh mới học</option><option value="skeptic">Người phản biện</option><option value="olympiad">Học sinh Olympic</option></select><label>Độ khó</label><select id="pllDifficulty"><option value="adaptive">Tự điều chỉnh</option><option value="basic">Cơ bản</option><option value="intermediate">Trung bình</option><option value="advanced">Nâng cao</option></select><div class="pll-actions"><button type="button" class="pll-primary" data-start>Bắt đầu vấn đáp</button></div><div class="pll-status" data-status role="status"></div></section>'+session;
  }
  function render(){
    if(!overlay)return;overlay.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-current',String(button.dataset.tab===tab)));
    const body=overlay.querySelector('#pllBody');body.innerHTML=tab==='tutor'?renderTutor():renderMap();bind(body);
  }
  async function createMap(){
    if(busy)return;const topic=overlay.querySelector('#pllTopic')?.value||'',level=overlay.querySelector('#pllLevel')?.value||'',goal=overlay.querySelector('#pllGoal')?.value||'';
    busy=true;const button=overlay.querySelector('[data-generate]');if(button)button.disabled=true;status('Đang phân tích kiến thức và xây dựng lộ trình…');
    try{const map=await generateMap(topic,level,goal);const state=read();state.maps=[map,...state.maps.filter(x=>x.id!==map.id)].slice(0,MAX_MAPS);if(!save(state))throw new Error('Không lưu được bản đồ vào thiết bị.');currentMap=map;render();}
    catch(error){status(error instanceof Error?error.message:'Không tạo được bản đồ.',true);if(button)button.disabled=false;}
    finally{busy=false;}
  }
  function openTutor(topic,question,persona='coach'){
    tab='tutor';tutor=null;open('tutor');const topicInput=overlay.querySelector('#pllTutorTopic');if(topicInput)topicInput.value=text(topic,120);
    const personaInput=overlay.querySelector('#pllPersona');if(personaInput)personaInput.value=PERSONAS[persona]?persona:'coach';
    if(question)startTutor('Hãy kiểm tra khả năng giải thích "'+text(topic,120)+'". Câu hỏi cần kiểm tra: '+text(question,500)+'. Bắt đầu bằng câu hỏi này hoặc chia thành câu hỏi nhỏ.');
  }
  function appendReply(reply){
    tutor.transcript.push({role:'ai',text:(reply.feedback?reply.feedback+'\n':'')+(reply.understanding===null?'':'Mức hiểu ước lượng: '+reply.understanding+'/100.\n')+(reply.hint?'Gợi ý: '+reply.hint+'\n':'')+'Câu hỏi tiếp theo: '+reply.question});
    tutor.question=reply.question;
  }
  async function startTutor(initialPrompt){
    if(busy)return;const topic=text(overlay.querySelector('#pllTutorTopic')?.value||'Vật lý',120),persona=overlay.querySelector('#pllPersona')?.value||'coach',difficulty=overlay.querySelector('#pllDifficulty')?.value||'adaptive';
    tutor={topic,persona,difficulty,history:[],transcript:[],question:'',turns:0};busy=true;render();status('AI đang chuẩn bị câu hỏi đầu tiên…');
    try{
      const prompt=initialPrompt||'Bắt đầu vấn đáp về '+topic+'. Hãy hỏi một câu nền tảng để xác định mức hiểu, không đưa đáp án.';
      const raw=await client().ask(prompt,{system:systemTutor(),history:[]}),reply=validateReply(raw);
      tutor.history=[{role:'user',content:prompt},{role:'assistant',content:raw}];appendReply(reply);render();status('Hãy tự trả lời trước khi yêu cầu gợi ý.');speak(reply.question);
    }catch(error){status(error instanceof Error?error.message:'Không bắt đầu được vấn đáp.',true);}
    finally{busy=false;}
  }
  async function sendAnswer(){
    if(busy||!tutor)return;const input=overlay.querySelector('#pllAnswer'),answer=text(input?.value,2400);if(answer.length<2){status('Hãy nhập hoặc đọc câu trả lời trước.',true);return;}
    busy=true;tutor.transcript.push({role:'user',text:answer});tutor.history.push({role:'user',content:answer});if(input)input.value='';render();status('AI đang phân tích lập luận…');
    try{
      const raw=await client().ask('Đánh giá câu trả lời gần nhất. Phản hồi đúng schema và đặt một câu hỏi tiếp theo.',{system:systemTutor(),history:tutor.history.slice(-MAX_HISTORY)});
      const reply=validateReply(raw);tutor.history.push({role:'assistant',content:raw});tutor.history=tutor.history.slice(-MAX_HISTORY);tutor.turns++;appendReply(reply);render();status('Đã phân tích lượt '+tutor.turns+'. Tiếp tục tự lập luận.');speak(reply.question);
    }catch(error){if(tutor.history[tutor.history.length-1]?.role==='user')tutor.history.pop();tutor.transcript.push({role:'ai',text:'Không phân tích được lượt này: '+(error instanceof Error?error.message:'Lỗi không xác định')});render();const retryInput=overlay.querySelector('#pllAnswer');if(retryInput)retryInput.value=answer;status('Không gửi được câu trả lời. Nội dung đã được giữ lại để thử lại.',true);}
    finally{busy=false;}
  }
  function speak(value){
    if(!('speechSynthesis'in window)){status('Trình duyệt không hỗ trợ đọc văn bản.');return;}
    window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(text(value,1200));utterance.lang='vi-VN';utterance.rate=.95;window.speechSynthesis.speak(utterance);
  }
  function listen(){
    const API=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!API){status('Trình duyệt chưa hỗ trợ nhận dạng giọng nói. Hãy nhập bằng bàn phím.',true);return;}
    if(recognition){try{recognition.stop();}catch(_){}}
    recognition=new API();recognition.lang='vi-VN';recognition.continuous=false;recognition.interimResults=false;recognition.maxAlternatives=1;
    recognition.onresult=event=>{const value=event.results?.[0]?.[0]?.transcript||'',input=overlay?.querySelector('#pllAnswer');if(input)input.value=text((input.value?input.value+' ':'')+value,2400);status(value?'Đã nhận giọng nói. Kiểm tra rồi bấm Gửi câu trả lời.':'Chưa nhận được nội dung.');};
    recognition.onerror=event=>status('Không nhận dạng được giọng nói: '+text(event.error,80),true);
    recognition.onend=()=>{recognition=null;};
    try{recognition.start();status('Đang nghe tiếng Việt…');}catch(_){status('Không thể bật microphone. Kiểm tra quyền trình duyệt.',true);}
  }
  function exportMap(){
    if(!currentMap)return;const lines=['PRINCIPIA — BẢN ĐỒ KIẾN THỨC',currentMap.topic,currentMap.overview,'','KIẾN THỨC TIÊN QUYẾT',...currentMap.prerequisites.map(x=>'- '+x.name+': '+x.reason+' | '+x.checkQuestion),'','LỘ TRÌNH',...currentMap.concepts.map((x,i)=>(i+1)+'. '+x.title+'\n'+x.coreIdea+'\nNgộ nhận: '+x.misconception+'\nTự kiểm tra: '+x.checkQuestion)];
    const url=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain;charset=utf-8'})),link=document.createElement('a');link.href=url;link.download='principia-knowledge-map.txt';link.click();URL.revokeObjectURL(url);
  }
  function bind(root){
    root.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.tab;render();}));
    root.querySelector('[data-generate]')?.addEventListener('click',createMap);
    root.querySelector('[data-new]')?.addEventListener('click',()=>{currentMap=null;render();});
    root.querySelector('[data-export]')?.addEventListener('click',exportMap);
    root.querySelectorAll('[data-load-map]').forEach(button=>button.addEventListener('click',()=>{currentMap=read().maps.find(x=>x.id===button.dataset.loadMap)||null;render();}));
    root.querySelectorAll('[data-check]').forEach(button=>button.addEventListener('click',()=>{const concept=currentMap?.concepts.find(x=>x.id===button.dataset.check);if(concept)openTutor(currentMap.topic+' · '+concept.title,concept.checkQuestion);}));
    root.querySelector('[data-start]')?.addEventListener('click',()=>startTutor());
    root.querySelector('[data-send]')?.addEventListener('click',sendAnswer);
    root.querySelector('[data-reset]')?.addEventListener('click',()=>{tutor=null;render();});
    root.querySelector('[data-speak]')?.addEventListener('click',()=>speak(tutor?.question||''));
    root.querySelector('[data-listen]')?.addEventListener('click',listen);
    root.querySelector('[data-stop]')?.addEventListener('click',()=>{if(recognition)recognition.stop();status('Đã dừng thu âm.');});
  }
  function installEntry(){
    if(document.getElementById('principiaLearningLabEntry'))return true;
    const anchor=document.getElementById('principiaProMasteryEntry')||document.querySelector('button[onclick="principiaStudyMethods()"]');
    if(!anchor?.parentElement)return false;
    const button=document.createElement('button');button.id='principiaLearningLabEntry';button.type='button';button.className=anchor.className;button.textContent='🧠 Learning Lab · Bản đồ & vấn đáp';button.addEventListener('click',()=>open('map'));anchor.parentElement.appendChild(button);return true;
  }
  function boot(){installEntry();new MutationObserver(installEntry).observe(document.body,{childList:true,subtree:true});}
  window.PrincipiaLearningLab=Object.freeze({
    open,close,generateMap,normalizeMap,parseStructured:parse,validateTutorReply,
    savedMaps:()=>read().maps.map(map=>({id:map.id,topic:map.topic,createdAt:map.createdAt})),
    stats:()=>({savedMaps:read().maps.length,activeTab:tab,tutorTurns:tutor?.turns||0})
  });
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();