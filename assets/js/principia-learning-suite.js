/* PRINCIPIA Learning Suite — Olympic practice, analytics, quests, notebook, formulas, flashcards, error log, badges, notifications, AI study handoff */
(function(){
 'use strict';
 const KEY='principia_learning_suite_v1';
 const safe=(v)=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}};
 const state=Object.assign({attempts:[],notes:[],errors:[],notifications:false},safe());
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('[PRINCIPIA] Learning Suite storage:',e)}};
 const allLessons=()=>{try{return typeof lessons==='function'?lessons():[]}catch(_){return []}};
 function pool(){
  const out=[];
  function walk(nodes,kind,path){
   (nodes||[]).forEach(n=>{
    const next=path.concat(n.name||'');
    (n.questions||n.quiz||[]).forEach(q=>{
     if(q&&q.q&&Array.isArray(q.a)&&q.a.length>=2&&Number.isInteger(Number(q.correct))&&q.a[Number(q.correct)]!==undefined)
      out.push({q:String(q.q),a:q.a.map(String),correct:Number(q.correct),topic:n.name||'Chủ đề',path:next.join(' › '),kind:kind});
    });
    if(n.children)walk(n.children,kind,next);
   });
  }
  try{if(typeof quizData!=='undefined')walk(quizData,'quiz',[])}catch(_){}
  try{if(typeof data!=='undefined')walk(data,'lesson',[])}catch(_){}
  const seen=new Set();return out.filter(x=>{const k=x.path+'|'+x.q;if(seen.has(k))return false;seen.add(k);return true});
 }
 let root=null,exam=null,examTimer=null,flashIndex=0,flashSide=false;
 function ensure(){
  if(root)return root;
  root=document.createElement('div');root.id='principiaLearningSuite';
  root.style.cssText='position:fixed;inset:0;z-index:2147483100;background:rgba(5,7,18,.78);backdrop-filter:blur(10px);display:none;align-items:center;justify-content:center;padding:12px';
  root.innerHTML='<section style="width:min(980px,100%);max-height:92vh;overflow:auto;border:1px solid var(--line,#454);border-radius:22px;background:var(--bg,#111321);color:var(--txt,#fff);box-shadow:0 24px 90px #0009"><div style="position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 18px;background:var(--side,#171a2a);border-bottom:1px solid var(--line,#444)"><div><div style="font-size:11px;letter-spacing:2px;opacity:.7">PRINCIPIA · LEARNING SUITE</div><b id="plsTitle">Trung tâm học tập</b></div><button type="button" id="plsClose" style="font-size:23px;border:0;background:transparent;color:inherit">×</button></div><div id="plsBody" style="padding:18px"></div></section>';
  root.addEventListener('click',e=>{if(e.target===root)close()});
  root.querySelector('#plsClose').addEventListener('click',close);
  document.body.appendChild(root);return root;
 }
 function open(title,html){const r=ensure();r.querySelector('#plsTitle').textContent=title;r.querySelector('#plsBody').innerHTML=html;r.style.display='flex';}
 function close(){if(root)root.style.display='none';stopTimer()}
 const btn=(label,fn,cls)=>'<button type="button" class="'+(cls||'secondary')+'" onclick="'+fn+'" style="margin:4px 6px 4px 0">'+label+'</button>';
 const panel=(title,body)=>'<section class="panel" style="margin:10px 0;padding:15px"><h3 style="margin:0 0 10px">'+title+'</h3>'+body+'</section>';
 function card(title,desc,action,icon){return '<button type="button" onclick="'+action+'" style="text-align:left;padding:16px;border:1px solid var(--line,#444);border-radius:16px;background:var(--card,#171a2a);color:inherit;min-height:112px"><span style="font-size:24px">'+icon+'</span><b style="display:block;margin:8px 0 4px">'+title+'</b><small style="opacity:.7;line-height:1.45">'+desc+'</small></button>'}
 function home(){
  const q=pool(),attempts=state.attempts||[],total=attempts.reduce((s,a)=>s+(a.total||0),0),correct=attempts.reduce((s,a)=>s+(a.score||0),0);
  const pct=total?Math.round(correct/total*100):0;
  open('Trung tâm học tập', '<p style="opacity:.75">Các công cụ học tập mở rộng, dùng dữ liệu bài học và Quiz đang có trong PRINCIPIA.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">'+
   card('Phòng luyện Olympic',q.length+' câu hỏi có sẵn · bài thi có thời gian','principiaSuiteExamSetup()','🏅')+
   card('Phân tích học tập',attempts.length+' lượt luyện · độ chính xác '+pct+'%','principiaSuiteAnalytics()','📊')+
   card('Nhiệm vụ & hành trình','Mục tiêu lấy từ hoạt động thực tế','principiaSuiteQuests()','🧭')+
   card('Sổ tay kiến thức',(state.notes||[]).length+' ghi chú đã lưu','principiaSuiteNotes()','📓')+
   card('Thư viện công thức','Trích xuất từ nội dung bài học','principiaSuiteFormulas()','📐')+
   card('Flashcard ôn tập',q.length+' thẻ từ ngân hàng câu hỏi','principiaSuiteFlashcards()','🃏')+
   card('Sổ lỗi sai',(state.errors||[]).length+' lỗi đã ghi lại','principiaSuiteErrors()','🧠')+
   card('Huy hiệu','Thành tích dựa trên dữ liệu thật','principiaSuiteBadges()','🏆')+
   card('Thông báo học tập',state.notifications?'Đã bật quyền thông báo':'Cài đặt nhắc học trên thiết bị','principiaSuiteNotifications()','🔔')+
   card('Thảo luận cùng AI','Đưa câu hỏi và ngữ cảnh sang trợ lý PRINCIPIA','principiaSuiteAI()','✨')+
   '</div><p class="small muted" style="margin-top:14px">Ngân hàng hiện có: '+q.length+' câu hỏi. Nếu nội dung chưa có câu hỏi, phòng Olympic sẽ báo rõ thay vì tự tạo đề.</p>');
 }
 function examSetup(){
  const n=pool().length;
  open('Phòng luyện Olympic','<p>Đề được lấy ngẫu nhiên từ câu hỏi Quiz và câu hỏi cuối bài học bạn đã có. Không thêm câu hỏi giả lập.</p>'+panel('Thiết lập bài thi','<label>Số câu <select id="plsExamCount" style="margin:8px;padding:8px"><option value="5">5 câu</option><option value="10" selected>10 câu</option><option value="20">20 câu</option><option value="all">Tất cả</option></select></label><label>Thời gian <select id="plsExamMinutes" style="margin:8px;padding:8px"><option value="10">10 phút</option><option value="20" selected>20 phút</option><option value="30">30 phút</option><option value="45">45 phút</option></select></label><p class="small muted">'+n+' câu hỏi có thể sử dụng.</p>'+btn('Bắt đầu thi','principiaSuiteStartExam()','primary'))+btn('Quay lại','principiaSuiteHome()'));
 }
 function startExam(){
  const source=pool();if(!source.length){open('Chưa có ngân hàng đề','<p>Hiện chưa tìm thấy câu hỏi hợp lệ trong Quiz hoặc bài học. Hãy thêm câu hỏi trước khi mở phòng luyện.</p>'+btn('Đóng','principiaSuiteHome()'));return}
  const countValue=document.getElementById('plsExamCount').value,minutes=Number(document.getElementById('plsExamMinutes').value)||20;
  const shuffled=source.slice().sort(()=>Math.random()-.5),questions=countValue==='all'?shuffled:shuffled.slice(0,Math.min(Number(countValue),shuffled.length));
  exam={questions:questions,answers:{},end:Date.now()+minutes*60000,submitted:false};
  renderExam();startTimer();
 }
 function stopTimer(){if(examTimer){clearInterval(examTimer);examTimer=null}}
 function startTimer(){stopTimer();examTimer=setInterval(()=>{if(!exam)return;const left=Math.max(0,exam.end-Date.now());const el=document.getElementById('plsExamClock');if(el)el.textContent=clock(left);if(!left)submitExam(true)},1000)}
 function clock(ms){const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 function renderExam(){
  const qs=exam.questions,answered=Object.keys(exam.answers).length;
  let html='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><b>Đã trả lời '+answered+'/'+qs.length+'</b><b id="plsExamClock" style="font-size:22px;font-variant-numeric:tabular-nums">'+clock(exam.end-Date.now())+'</b></div>';
  html+='<div style="height:7px;background:var(--line,#444);border-radius:20px;margin:12px 0 18px"><div style="height:100%;width:'+answered/qs.length*100+'%;background:var(--purple,#9b87ff);border-radius:20px"></div></div>';
  qs.forEach((q,i)=>{html+=panel('Câu '+(i+1)+' · '+esc(q.topic),'<p style="font-size:17px">'+esc(q.q)+'</p>'+q.a.map((a,j)=>'<label style="display:flex;gap:9px;align-items:flex-start;padding:9px;margin:5px 0;border:1px solid var(--line,#444);border-radius:10px"><input type="radio" name="plsQ'+i+'" '+(exam.answers[i]===j?'checked':'')+' onchange="principiaSuiteChoose('+i+','+j+')" style="margin-top:4px"><span>'+esc(a)+'</span></label>').join(''))});
  html+=btn('Nộp bài','principiaSuiteSubmitExam(false)','primary')+btn('Thoát bài thi','principiaSuiteExitExam()');
  open('Phòng luyện Olympic',html);
 }
 function choose(i,j){if(!exam)return;exam.answers[i]=j;renderExam();const r=document.getElementById('plsQ'+i);if(r)r.focus()}
 function submitExam(auto){
  if(!exam||exam.submitted)return;
  const qs=exam.questions,score=qs.reduce((s,q,i)=>s+(exam.answers[i]===q.correct?1:0),0);
  exam.submitted=true;stopTimer();
  const attempt={date:new Date().toISOString(),score:score,total:qs.length,percent:Math.round(score/qs.length*100),mode:'olympic'};
  state.attempts.push(attempt);if(state.attempts.length>300)state.attempts=state.attempts.slice(-300);save();
  try{if(typeof xp!=='undefined'&&typeof saveAll==='function'){xp+=Math.max(5,score*5);saveAll()}}catch(_){}
  let html='<div style="text-align:center;padding:18px"><div style="font-size:42px">🏅</div><h1>'+score+'/'+qs.length+'</h1><h2>'+attempt.percent+'% chính xác</h2><p>'+(auto?'Đã tự động nộp khi hết giờ.':'Đã ghi nhận kết quả bài thi.')+'</p></div>';
  qs.forEach((q,i)=>{const ok=exam.answers[i]===q.correct;html+=panel((ok?'✓ ':'✗ ')+'Câu '+(i+1),'<p>'+esc(q.q)+'</p><p>Đáp án đúng: <b>'+esc(q.a[q.correct])+'</b></p><p class="small muted">Bạn chọn: '+(exam.answers[i]===undefined?'Chưa trả lời':esc(q.a[exam.answers[i]]))+'</p>')});
  exam=null;open('Kết quả luyện Olympic',html+btn('Về trung tâm','principiaSuiteHome()','primary')+btn('Thi lượt mới','principiaSuiteExamSetup()'));
  try{if(state.notifications&&'Notification'in window&&Notification.permission==='granted')new Notification('PRINCIPIA · Kết quả luyện tập',{body:'Bạn đạt '+score+'/'+qs.length+' câu.'})}catch(_){}
 }
 function exitExam(){if(exam&&!confirm('Thoát bài thi? Kết quả chưa nộp sẽ không được lưu.'))return;exam=null;stopTimer();home()}
 function analytics(){
  const a=state.attempts||[],total=a.reduce((s,x)=>s+x.total,0),right=a.reduce((s,x)=>s+x.score,0),pct=total?Math.round(right/total*100):0;
  const recent=a.slice(-10).reverse();
  const bars=recent.map(x=>'<div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="width:90px;font-size:12px">'+new Date(x.date).toLocaleDateString('vi-VN')+'</span><div style="flex:1;height:10px;background:var(--line,#444);border-radius:20px"><div style="height:100%;width:'+x.percent+'%;background:var(--purple,#9b87ff);border-radius:20px"></div></div><b>'+x.percent+'%</b></div>').join('')||'<p class="muted">Chưa có lượt thi nào được ghi nhận.</p>';
  let done=0;try{done=typeof completed!=='undefined'?completed.length:0}catch(_){}
  let earned=0;try{earned=typeof xp!=='undefined'?xp:0}catch(_){}
  open('Phân tích học tập', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px">'+
   panel('Độ chính xác','<h2>'+pct+'%</h2>')+panel('Lượt luyện','<h2>'+a.length+'</h2>')+panel('Câu đã làm','<h2>'+total+'</h2>')+panel('Bài học hoàn thành','<h2>'+done+'</h2>')+panel('XP hiện có','<h2>'+earned+'</h2>')+'</div>'+panel('10 lượt gần nhất',bars)+panel('Lịch sử',a.slice(-20).reverse().map(x=>'<div style="padding:8px 0;border-bottom:1px solid var(--line,#444)">'+new Date(x.date).toLocaleString('vi-VN')+' · <b>'+x.score+'/'+x.total+'</b> ('+x.percent+'%)</div>').join('')||'<p>Chưa có dữ liệu.</p>')+btn('Quay lại','principiaSuiteHome()'));
 }
 function quests(){
  let done=0,earned=0;try{done=completed.length;earned=xp}catch(_){}
  const a=state.attempts||[],notes=state.notes||[],errors=state.errors||[];
  const tasks=[['Hoàn thành 1 bài học',done>=1,done+'/1 bài', 'Mở bài học và nhấn Hoàn thành'],['Luyện 5 câu hỏi',a.reduce((s,x)=>s+x.total,0)>=5,a.reduce((s,x)=>s+x.total,0)+'/5 câu','Vào phòng luyện Olympic'],['Ghi 1 ghi chú',notes.length>=1,notes.length+'/1 ghi chú','Lưu một ý quan trọng'],['Ghi lại 1 lỗi sai',errors.length>=1,errors.length+'/1 lỗi','Thêm lỗi vào sổ lỗi sai'],['Đạt 100 XP',earned>=100,earned+'/100 XP','Học và luyện tập để nhận XP']];
  open('Nhiệm vụ học tập',tasks.map(t=>panel((t[1]?'✓ ':'○ ')+t[0],'<p>'+t[2]+'</p><small class="muted">'+t[3]+'</small>')).join('')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function notes(){
  const rows=(state.notes||[]).map((n,i)=>panel(esc(n.title||'Ghi chú '+(i+1)),'<p style="white-space:pre-wrap">'+esc(n.body)+'</p><small class="muted">'+new Date(n.date).toLocaleString('vi-VN')+'</small>'+btn('Xóa','principiaSuiteDeleteNote('+i+')','danger'))).join('');
  open('Sổ tay kiến thức','<label>Tiêu đề<input id="plsNoteTitle" maxlength="100" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></label><label>Nội dung<textarea id="plsNoteBody" rows="4" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></textarea></label>'+btn('Lưu ghi chú','principiaSuiteAddNote()','primary')+(rows||'<p class="muted">Chưa có ghi chú.</p>')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function addNote(){const title=document.getElementById('plsNoteTitle').value.trim(),body=document.getElementById('plsNoteBody').value.trim();if(!body){alert('Nhập nội dung ghi chú trước nhé.');return}state.notes.unshift({title:title||'Ghi chú mới',body:body,date:new Date().toISOString()});save();notes()}
 function deleteNote(i){if(!confirm('Xóa ghi chú này?'))return;state.notes.splice(i,1);save();notes()}
 function formulas(){
  const found=[];const re=/(?:[A-Za-zρΔαβθωμΩεσφ²³₀₁₂₃₄₅₆₇₈₉]+\\s*[=≈≤≥]\\s*[^\\n.;]{1,90})/g;
  allLessons().forEach(l=>{const text=String(l.content||'');let m;while((m=re.exec(text))!==null){const v=m[0].trim();if(v.length>2&&!found.some(x=>x.value===v))found.push({value:v,lesson:l.name})}re.lastIndex=0});
  const html=found.map(x=>'<div style="padding:12px;border-bottom:1px solid var(--line,#444)"><b style="font-size:18px">'+esc(x.value)+'</b><div class="small muted">'+esc(x.lesson)+'</div></div>').join('');
  open('Thư viện công thức',(html||'<p class="muted">Chưa tìm thấy biểu thức trong nội dung bài học. Thêm công thức vào bài học để thư viện tự nhận diện.</p>')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function flashcards(){
  const qs=pool();if(!qs.length){open('Flashcard','<p>Chưa có câu hỏi để tạo thẻ ôn tập.</p>'+btn('Quay lại','principiaSuiteHome()'));return}
  flashIndex=(flashIndex+qs.length)%qs.length;flashSide=false;renderFlash();
 }
 function renderFlash(){
  const qs=pool(),q=qs[flashIndex%qs.length];const answer='Đáp án: '+q.a[q.correct]+'\\n'+q.a.map((a,i)=>String.fromCharCode(65+i)+'. '+a).join('\\n');
  open('Flashcard ôn tập','<p class="muted">Thẻ '+(flashIndex+1)+' / '+qs.length+' · '+esc(q.topic)+'</p><button type="button" onclick="principiaSuiteFlip()" style="width:100%;min-height:230px;padding:25px;border:1px solid var(--line,#444);border-radius:20px;background:var(--card,#171a2a);color:inherit;font-size:20px;white-space:pre-wrap">'+esc(flashSide?answer:q.q)+'<div class="small muted" style="margin-top:20px">Chạm để '+(flashSide?'xem câu hỏi':'lật thẻ')+'</div></button><div style="display:flex;justify-content:space-between;margin-top:12px">'+btn('← Trước','principiaSuiteFlashPrev()')+btn('Lật thẻ','principiaSuiteFlip()','primary')+btn('Tiếp →','principiaSuiteFlashNext()')+'</div>'+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function errors(){
  const rows=(state.errors||[]).map((x,i)=>panel(esc(x.title),' <p style="white-space:pre-wrap">'+esc(x.body)+'</p><small class="muted">'+new Date(x.date).toLocaleString('vi-VN')+'</small>'+btn('Đã khắc phục · xóa','principiaSuiteDeleteError('+i+')','secondary'))).join('');
  open('Sổ lỗi sai','<label>Câu hỏi / chủ đề<input id="plsErrorTitle" style="display:block;width:100%;padding:10px;margin:6px 0"></label><label>Vì sao sai và cách sửa<textarea id="plsErrorBody" rows="4" style="display:block;width:100%;padding:10px;margin:6px 0"></textarea></label>'+btn('Lưu lỗi sai','principiaSuiteAddError()','primary')+(rows||'<p class="muted">Chưa ghi nhận lỗi sai nào.</p>')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function addError(){const title=document.getElementById('plsErrorTitle').value.trim(),body=document.getElementById('plsErrorBody').value.trim();if(!title||!body){alert('Hãy nhập câu hỏi và cách sửa.');return}state.errors.unshift({title:title,body:body,date:new Date().toISOString()});save();errors()}
 function deleteError(i){if(!confirm('Xóa mục lỗi sai này?'))return;state.errors.splice(i,1);save();errors()}
 function badges(){
  const a=state.attempts||[],total=a.reduce((s,x)=>s+x.total,0),best=a.reduce((m,x)=>Math.max(m,x.percent),0);let done=0;try{done=completed.length}catch(_){}
  const b=[['🌱','Bắt đầu hành trình',a.length>=1,'Hoàn thành lượt luyện đầu tiên'],['🎯','50 câu hỏi',total>=50,'Làm ít nhất 50 câu'],['🏅','Olympic 80%',best>=80,'Đạt từ 80% trong một lượt'],['🔥','Chăm chỉ',a.length>=5,'Hoàn thành 5 lượt luyện'],['📚','Người ham học',done>=10,'Hoàn thành 10 bài học'],['🧠','Sửa sai',state.errors.length>=3,'Ghi lại 3 lỗi sai']];
  open('Bộ sưu tập huy hiệu','<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">'+b.map(x=>'<div class="panel" style="padding:15px;opacity:'+(x[2]?'1':'.48')+'"><div style="font-size:32px">'+x[0]+'</div><b>'+x[1]+'</b><p class="small muted">'+x[3]+'</p><b class="small">'+(x[2]?'Đã mở khóa':'Chưa đạt')+'</b></div>').join('')+'</div>'+btn('Về trung tâm','principiaSuiteHome()'));
 }
 async function notifications(){
  let status='Trình duyệt chưa hỗ trợ Web Notifications.';
  if('Notification'in window)status='Quyền hiện tại: '+Notification.permission;
  open('Thông báo học tập','<p>'+status+'</p><p class="muted small">PRINCIPIA chỉ gửi thông báo khi bạn hoàn thành lượt luyện trong phiên này; không chạy nền và không tự gửi thông báo khi trình duyệt đã đóng.</p>'+btn('Cho phép thông báo','principiaSuiteEnableNotifications()','primary')+btn('Tắt thông báo','principiaSuiteDisableNotifications()')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 async function enableNotifications(){if(!('Notification'in window)){alert('Trình duyệt này không hỗ trợ thông báo.');return}const p=await Notification.requestPermission();state.notifications=p==='granted';save();notifications()}
 function ai(){
  const prompt='Hãy cùng tôi thảo luận và hướng dẫn từng bước như một gia sư PRINCIPIA. Hãy hỏi lại khi thiếu dữ kiện, giải thích bản chất, nêu công thức và kiểm tra hiểu bài. Chủ đề/câu hỏi tôi muốn trao đổi: ';
  open('Thảo luận cùng AI','<p>Chọn cách chuyển ngữ cảnh sang trợ lý AI đang có. Hệ thống không giả vờ gọi API AI khi chưa có kết nối.</p>'+btn('Mở khung trợ lý PRINCIPIA','principiaSuiteOpenChat()','primary')+btn('Sao chép lời nhắc học tập','principiaSuiteCopyAI()')+btn('Về trung tâm','principiaSuiteHome()'));
  window.__principiaSuitePrompt=prompt;
 }
 function openChat(){const box=document.getElementById('chatBox'),input=document.getElementById('chatInput');if(box)box.style.display='block';if(input){input.value=window.__principiaSuitePrompt||'Hãy giúp tôi hiểu bài học này theo từng bước.';input.focus()}close()}
 async function copyAI(){try{await navigator.clipboard.writeText(window.__principiaSuitePrompt||'Hãy giải thích bài học từng bước.');alert('Đã sao chép lời nhắc. Hãy dán vào AI bạn chọn.')}catch(_){alert('Không thể truy cập clipboard. Hãy mở trợ lý PRINCIPIA để tiếp tục.')} }
 function install(){
  if(document.getElementById('principiaSuiteTrigger'))return;
  const b=document.createElement('button');b.id='principiaSuiteTrigger';b.type='button';b.textContent='✦';b.title='Trung tâm học tập PRINCIPIA';b.setAttribute('aria-label','Trung tâm học tập PRINCIPIA');
  b.style.cssText='position:fixed;left:18px;bottom:calc(82px + env(safe-area-inset-bottom,0px));z-index:1201;width:46px;height:46px;border-radius:15px;border:1px solid var(--line,#777);background:var(--card,#171526);color:var(--text,#fff);font-size:24px;box-shadow:0 8px 28px #0004;cursor:pointer';
  b.addEventListener('click',home);document.body.appendChild(b);
 }
 window.principiaSuiteHome=home;window.principiaSuiteExamSetup=examSetup;window.principiaSuiteStartExam=startExam;window.principiaSuiteChoose=choose;window.principiaSuiteSubmitExam=submitExam;window.principiaSuiteExitExam=exitExam;window.principiaSuiteAnalytics=analytics;window.principiaSuiteQuests=quests;window.principiaSuiteNotes=notes;window.principiaSuiteAddNote=addNote;window.principiaSuiteDeleteNote=deleteNote;window.principiaSuiteFormulas=formulas;window.principiaSuiteFlashcards=flashcards;window.principiaSuiteFlip=()=>{flashSide=!flashSide;renderFlash()};window.principiaSuiteFlashPrev=()=>{flashIndex=Math.max(0,flashIndex-1);renderFlash()};window.principiaSuiteFlashNext=()=>{flashIndex++;renderFlash()};window.principiaSuiteErrors=errors;window.principiaSuiteAddError=addError;window.principiaSuiteDeleteError=deleteError;window.principiaSuiteBadges=badges;window.principiaSuiteNotifications=notifications;window.principiaSuiteEnableNotifications=enableNotifications;window.principiaSuiteDisableNotifications=()=>{state.notifications=false;save();notifications()};window.principiaSuiteAI=ai;window.principiaSuiteOpenChat=openChat;window.principiaSuiteCopyAI=copyAI;
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
