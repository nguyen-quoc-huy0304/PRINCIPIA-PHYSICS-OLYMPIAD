/* PRINCIPIA Learning Suite — Olympic practice, analytics, quests, notebook, formulas, flashcards, error log, badges, notifications, AI study handoff */
(function(){
 'use strict';
 const KEY='principia_learning_suite_v1';
 const safe=(v)=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}};
 const state=Object.assign({attempts:[],notes:[],errors:[],notifications:false,claimedQuests:[]},safe());
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('[PRINCIPIA] Learning Suite storage:',e)}};\n const localDateKey=(date=new Date())=>{const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+d};
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
 let root=null,exam=null,examTimer=null,flashIndex=0,flashSide=false,flashMode='bank',reviewQueue=[],reviewIndex=0,reviewSide=false;
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
   card('Phòng luyện Olympic',q.length+' câu hỏi có sẵn · bài thi có thời gian','principiaSuiteExamSetup()','🏅')+card('Thử thách mỗi ngày','1 câu hỏi ngẫu nhiên · +10 XP khi đúng','principiaSuiteDaily()','⚡')+
   card('Science Arcade','Mở game vật lý và thử thách quỹ đạo hiện có','principiaSuiteOpenGames()','🎮')+
   card('Phân tích học tập',attempts.length+' lượt luyện · độ chính xác '+pct+'%','principiaSuiteAnalytics()','📊')+
   card('Nhiệm vụ & hành trình','Mục tiêu lấy từ hoạt động thực tế','principiaSuiteQuests()','🧭')+
   card('Sổ tay kiến thức',(state.notes||[]).length+' ghi chú đã lưu','principiaSuiteNotes()','📓')+
   card('Thư viện công thức','Trích xuất từ nội dung bài học','principiaSuiteFormulas()','📐')+
   card('Flashcard ôn tập',q.length+' thẻ từ ngân hàng câu hỏi','principiaSuiteFlashcards()','🃏')+card('Ôn tập thông minh','Lịch ôn thẻ theo mức độ nhớ','principiaSuiteSpacedReview()','🧠')+
   card('Sổ lỗi sai',(state.errors||[]).length+' lỗi đã ghi lại','principiaSuiteErrors()','🧠')+card('Ôn lại lỗi sai','Biến lỗi đã ghi thành thẻ ôn tập','principiaSuiteReviewErrors()','🔁')+
   card('Huy hiệu','Thành tích dựa trên dữ liệu thật','principiaSuiteBadges()','🏆')+
   card('Thông báo học tập',state.notifications?'Đã bật quyền thông báo':'Cài đặt nhắc học trên thiết bị','principiaSuiteNotifications()','🔔')+
   card('Thảo luận cùng AI','Đưa câu hỏi và ngữ cảnh sang trợ lý PRINCIPIA','principiaSuiteAI()','✨')+
   '</div><p class="small muted" style="margin-top:14px">Ngân hàng hiện có: '+q.length+' câu hỏi. Nếu nội dung chưa có câu hỏi, phòng Olympic sẽ báo rõ thay vì tự tạo đề.</p>');
 }
 function dailyChallenge(){
  const today=localDateKey();
  const bank=pool();
  if(!bank.length){open('Thử thách mỗi ngày','<p>Chưa có câu hỏi hợp lệ để tạo thử thách. Hãy bổ sung câu hỏi vào Quiz hoặc bài học.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  if(!state.daily||state.daily.date!==today){const q=bank[Math.floor(Math.random()*bank.length)];state.daily={date:today,q:q.q,a:q.a,correct:q.correct,topic:q.topic,path:q.path,answered:false,choice:null};save()}
  const d=state.daily;
  let html='<p>1 câu hỏi mới mỗi ngày · dữ liệu từ ngân hàng bài học/Quiz thật.</p>'+panel('Thử thách '+today,'<b>'+esc(d.topic)+'</b><p>'+esc(d.q)+'</p><div style="display:grid;gap:8px">'+d.a.map((a,i)=>'<button '+(d.answered?'disabled':'')+' onclick="principiaSuiteDailyAnswer('+i+')" style="text-align:left;padding:12px;border:1px solid var(--line,#555);border-radius:12px;background:var(--card,#171a2a);color:inherit">'+String.fromCharCode(65+i)+'. '+esc(a)+'</button>').join('')+'</div>'+ (d.answered?'<p><b>'+(d.choice===d.correct?'✅ Chính xác!':'❌ Chưa đúng')+'</b><br>Đáp án: '+esc(d.a[d.correct])+'</p>':'') )+btn('Về trung tâm','principiaSuiteHome()');
  open('Thử thách mỗi ngày',html)
 }
 function dailyAnswer(i){
  const d=state.daily;if(!d||d.answered||!Number.isInteger(i))return;
  d.choice=i;d.answered=true;if(i===d.correct){state.xp=(state.xp||0)+10;try{if(typeof xp!=='undefined'){xp+=10;if(typeof saveAll==='function')saveAll()}}catch(_){}}
  else state.errors.unshift({title:d.q,body:'Bạn chọn: '+d.a[i]+'\\nĐáp án đúng: '+d.a[d.correct]+'\\nChủ đề: '+d.topic,date:new Date().toISOString()});
  save();dailyChallenge();
 }
 function spacedReview(){
  const today=localDateKey(),review=state.review||{},due=pool().filter(q=>{const rec=review[q.path+'|'+q.q];return !rec||!rec.due||rec.due<=today});
  open('Ôn tập thông minh','<p><b>'+due.length+'</b> thẻ đến hạn hôm nay.</p>'+btn('Bắt đầu ôn','principiaSuiteStartReview()','primary')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function startReview(){
  const today=new Date().toISOString().slice(0,10),review=state.review||{};
  reviewQueue=pool().filter(q=>{const rec=review[q.path+'|'+q.q];return !rec||!rec.due||rec.due<=today});
  reviewIndex=0;reviewSide=false;reviewCard();
 }
 function reviewCard(){
  if(reviewIndex>=reviewQueue.length){open('Hoàn thành ôn tập','<p>Đã ôn xong các thẻ đến hạn.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  const q=reviewQueue[reviewIndex];let html=panel('Thẻ '+(reviewIndex+1)+'/'+reviewQueue.length,'<b>'+esc(q.topic)+'</b><p>'+esc(q.q)+'</p>'+(reviewSide?'<p>Đáp án: '+esc(q.a[q.correct])+'</p>':''));
  html+=reviewSide?btn('Quên · 1 ngày','principiaSuiteRateReview(0)')+btn('Khó · 2 ngày','principiaSuiteRateReview(1)')+btn('Nhớ · 4 ngày','principiaSuiteRateReview(2)')+btn('Dễ · 7 ngày','principiaSuiteRateReview(3)'):btn('Xem đáp án','principiaSuiteFlipReview()','primary');
  html+=btn('Bỏ qua','principiaSuiteSkipReview()')+btn('Về trung tâm','principiaSuiteHome()');open('Ôn tập thông minh',html);
 }
 function rateReview(r){
  const q=reviewQueue[reviewIndex];if(!q||!Number.isInteger(r)||r<0||r>3)return;const previous=Number((state.review||{})[q.path+'|'+q.q]?.interval)||0;const days=[1,Math.max(2,previous||2),Math.max(4,(previous||2)*2),Math.max(7,(previous||2)*3)][r],interval=Math.min(60,days),next=new Date();next.setDate(next.getDate()+interval);
  state.review=state.review||{};state.review[q.path+'|'+q.q]={interval:interval,due:localDateKey(next),last:new Date().toISOString(),rating:r};save();reviewIndex++;reviewSide=false;reviewCard();
 }
 function skipReview(){reviewIndex++;reviewSide=false;reviewCard()}
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
  state.attempts.push(attempt);qs.forEach((q,i)=>{if(exam.answers[i]!==q.correct){state.errors.unshift({title:q.q,body:'Bạn chọn: '+(q.a[exam.answers[i]]||'Chưa trả lời')+'\\nĐáp án đúng: '+q.a[q.correct]+'\\nNguồn: '+q.path,date:new Date().toISOString()})}});if(state.errors.length>300)state.errors=state.errors.slice(0,300);if(state.attempts.length>300)state.attempts=state.attempts.slice(-300);save();
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
  const a=state.attempts||[],notes=state.notes||[],errors=state.errors||[],answered=a.reduce((s,x)=>s+x.total,0);
  let game={shots:0,best:0};try{game=JSON.parse(localStorage.getItem('principia_game_physics_v1')||'{}')}catch(_){}
  const tasks=[['lesson','Hoàn thành 1 bài học',done>=1,done+'/1 bài','Mở bài học và nhấn Hoàn thành'],['practice','Luyện 5 câu hỏi',answered>=5,answered+'/5 câu','Vào phòng luyện hoặc Quiz'],['note','Ghi 1 ghi chú',notes.length>=1,notes.length+'/1 ghi chú','Lưu một ý quan trọng'],['error','Ghi lại 1 lỗi sai',errors.length>=1,errors.length+'/1 lỗi','Thêm lỗi vào sổ lỗi sai'],['game','Chơi game khoa học',Number(game.shots)>=1,(Number(game.shots)||0)+'/1 lượt','Mở Science Arcade và hoàn thành một lượt'],['precision','Đạt 80 điểm game',Number(game.best)>=80,(Number(game.best)||0)+'/80 điểm','Điều chỉnh góc phóng để tăng độ chính xác'],['xp','Đạt 100 XP',earned>=100,earned+'/100 XP','Học và luyện tập để nhận XP']];
  open('Nhiệm vụ học tập',tasks.map(t=>{const claimed=(state.claimedQuests||[]).includes(t[0]);const action=t[2]&&!claimed?' '+btn('Nhận +15 XP','principiaSuiteClaimQuest(\''+t[0]+'\')','primary'):(claimed?'<p class="small" style="color:#55b98a">Đã nhận thưởng</p>':'');return panel((t[2]?'✓ ':'○ ')+t[1],'<p>'+t[3]+'</p><small class="muted">'+t[4]+'</small>'+action)}).join('')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function claimQuest(id){
  if((state.claimedQuests||[]).includes(id))return;
  let done=0,earned=0;try{done=completed.length;earned=xp}catch(_){}
  const a=state.attempts||[],notes=state.notes||[],errors=state.errors||[],answered=a.reduce((s,x)=>s+x.total,0);
  let game={shots:0,best:0};try{game=JSON.parse(localStorage.getItem('principia_game_physics_v1')||'{}')}catch(_){}
  const valid={lesson:done>=1,practice:answered>=5,note:notes.length>=1,error:errors.length>=1,game:Number(game.shots)>=1,precision:Number(game.best)>=80,xp:earned>=100};
  if(!valid[id])return;
  state.claimedQuests.push(id);save();
  try{if(typeof xp!=='undefined'&&typeof saveAll==='function'){xp+=15;saveAll()}}catch(_){}
  quests();
 }
 function notes(){
  const rows=(state.notes||[]).map((n,i)=>panel(esc(n.title||'Ghi chú '+(i+1)),'<p style="white-space:pre-wrap">'+esc(n.body)+'</p><small class="muted">'+new Date(n.date).toLocaleString('vi-VN')+'</small>'+btn('Xóa','principiaSuiteDeleteNote('+i+')','danger'))).join('');
  open('Sổ tay kiến thức','<label>Tiêu đề<input id="plsNoteTitle" maxlength="100" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></label><label>Nội dung<textarea id="plsNoteBody" rows="4" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></textarea></label>'+btn('Lưu ghi chú','principiaSuiteAddNote()','primary')+(rows||'<p class="muted">Chưa có ghi chú.</p>')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function addNote(){const title=document.getElementById('plsNoteTitle').value.trim(),body=document.getElementById('plsNoteBody').value.trim();if(!body){alert('Nhập nội dung ghi chú trước nhé.');return}state.notes.unshift({title:title||'Ghi chú mới',body:body,date:new Date().toISOString()});save();notes()}
 function deleteNote(i){if(!confirm('Xóa ghi chú này?'))return;state.notes.splice(i,1);save();notes()}
 function formulas(){
  const found=[];const re=/(?:[A-Za-zρΔαβθωμΩεσφ²³₀₁₂₃₄₅₆₇₈₉]+\s*[=≈≤≥]\s*[^\n.;]{1,90})/g;
  allLessons().forEach(l=>{const text=String(l.content||'');let m;while((m=re.exec(text))!==null){const v=m[0].trim();if(v.length>2&&!found.some(x=>x.value===v))found.push({value:v,lesson:l.name})}re.lastIndex=0});
  const html=found.map(x=>'<div style="padding:12px;border-bottom:1px solid var(--line,#444)"><b style="font-size:18px">'+esc(x.value)+'</b><div class="small muted">'+esc(x.lesson)+'</div></div>').join('');
  open('Thư viện công thức',(html||'<p class="muted">Chưa tìm thấy biểu thức trong nội dung bài học. Thêm công thức vào bài học để thư viện tự nhận diện.</p>')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function flashcards(){
  flashMode='bank';const qs=pool();if(!qs.length){open('Flashcard','<p>Chưa có câu hỏi để tạo thẻ ôn tập.</p>'+btn('Quay lại','principiaSuiteHome()'));return}
  flashIndex=(flashIndex+qs.length)%qs.length;flashSide=false;renderFlash();
 }
 function renderFlash(){
  const qs=flashMode==='errors'?(state.errors||[]):pool();
  if(!qs.length){open('Flashcard ôn tập','<p>Chưa có dữ liệu ôn tập.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  const q=qs[flashIndex%qs.length],front=flashMode==='errors'?q.title:q.q;
  const answer=flashMode==='errors'?q.body:'Đáp án: '+q.a[q.correct]+'\\n'+q.a.map((a,i)=>String.fromCharCode(65+i)+'. '+a).join('\\n');
  open(flashMode==='errors'?'Ôn lại lỗi sai':'Flashcard ôn tập','<p class="muted">Thẻ '+(flashIndex+1)+' / '+qs.length+'</p><button type="button" onclick="principiaSuiteFlip()" style="width:100%;min-height:230px;padding:25px;border:1px solid var(--line,#444);border-radius:20px;background:var(--card,#171a2a);color:inherit;font-size:20px;white-space:pre-wrap">'+esc(flashSide?answer:front)+'<div class="small muted" style="margin-top:20px">Chạm để '+(flashSide?'xem mặt trước':'lật thẻ')+'</div></button><div style="display:flex;justify-content:space-between;margin-top:12px">'+btn('← Trước','principiaSuiteFlashPrev()')+btn('Lật thẻ','principiaSuiteFlip()','primary')+btn('Tiếp →','principiaSuiteFlashNext()')+'</div>'+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function reviewErrors(){
  if(!(state.errors||[]).length){open('Ôn lại lỗi sai','<p>Chưa có lỗi sai nào được lưu. Làm bài luyện tập để hệ thống ghi nhận câu trả lời sai.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  flashMode='errors';flashIndex=0;flashSide=false;renderFlash();
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
  let context='';
  try{if(typeof activeLesson!=='undefined'&&activeLesson){const l=find(activeLesson,data);if(l)context='\n\nBài học: '+l.name+'\n'+String(l.content||'').slice(0,5000)}}catch(_){}
  const prompt='Hãy cùng tôi thảo luận và hướng dẫn từng bước như một gia sư PRINCIPIA. Hãy hỏi lại khi thiếu dữ kiện, giải thích bản chất, nêu công thức và kiểm tra hiểu bài.'+context+'\n\nCâu hỏi của tôi: ';
  open('Thảo luận cùng AI','<p>Đưa nội dung bài học hiện tại sang trợ lý PRINCIPIA hoặc sao chép lời nhắc để dùng với AI đang chọn.</p><textarea id="plsAiQuestion" rows="4" placeholder="Bạn đang vướng ở bước nào?..." style="width:100%;padding:12px;margin:8px 0"></textarea>'+btn('Mở khung trợ lý PRINCIPIA','principiaSuiteOpenChat()','primary')+btn('Sao chép lời nhắc học tập','principiaSuiteCopyAI()')+btn('Về trung tâm','principiaSuiteHome()'));
  window.__principiaSuitePrompt=prompt;
 }
 function openChat(){const box=document.getElementById('chatBox'),input=document.getElementById('chatInput'),question=document.getElementById('plsAiQuestion')?.value||'';if(box){box.classList.add('open');if(typeof renderPrincipiaAIChoices==='function')renderPrincipiaAIChoices()}if(input){input.value=(window.__principiaSuitePrompt||'Hãy giúp tôi hiểu bài học này theo từng bước.')+question;input.focus()}close()}
 async function copyAI(){const question=document.getElementById('plsAiQuestion')?.value||'';try{await navigator.clipboard.writeText((window.__principiaSuitePrompt||'Hãy giải thích bài học từng bước.')+question);alert('Đã sao chép lời nhắc. Hãy dán vào AI bạn chọn.')}catch(_){alert('Không thể truy cập clipboard. Hãy mở trợ lý PRINCIPIA để tiếp tục.')} }
 function patchExistingQuizHistory(){
  if(window.__principiaSuiteQuizPatched||typeof window.answerQuestion!=='function')return;
  window.__principiaSuiteQuizPatched=true;window.__principiaSuiteQuizSignature='';
  ['openQuiz','openFun','lessonQuiz'].forEach(name=>{const original=window[name];if(typeof original==='function')window[name]=function(){window.__principiaSuiteQuizSignature='';return original.apply(this,arguments)}});
  const original=window.answerQuestion;
  window.answerQuestion=function(){
   try{if(typeof answers!=='undefined'&&answers.length===0)window.__principiaSuiteQuizSignature=''}catch(_){}
   const result=original.apply(this,arguments);
   try{
    const active=typeof activeQuiz!=='undefined'?activeQuiz:null;
    if(!active||active.kind==='fun'&&typeof funData==='undefined')return result;
    const node=active.kind==='quiz'?find(active.id,quizData):active.kind==='lesson'?find(active.id,data):find(active.id,funData);
    const qs=active.kind==='lesson'?(node?.quiz||[]):(node?.questions||[]),ans=typeof answers!=='undefined'?answers:[];
    if(qs.length&&ans.length>=qs.length){
     const signature=active.kind+':'+active.id+':'+ans.join(',');
     if(signature!==window.__principiaSuiteQuizSignature){
      window.__principiaSuiteQuizSignature=signature;
      const score=qs.reduce((sum,q,i)=>sum+(ans[i]===q.correct?1:0),0);
      state.attempts.push({date:new Date().toISOString(),score:score,total:qs.length,percent:Math.round(score/qs.length*100),mode:active.kind});
      qs.forEach((q,i)=>{if(ans[i]!==q.correct){state.errors.unshift({title:q.q,body:'Bạn chọn: '+(q.a[ans[i]]||'Chưa trả lời')+'\\nĐáp án đúng: '+q.a[q.correct]+'\\nNguồn: '+(node.name||active.id),date:new Date().toISOString()})}});
      if(state.errors.length>300)state.errors=state.errors.slice(0,300);if(state.attempts.length>300)state.attempts=state.attempts.slice(-300);save();
     }
    }
   }catch(e){console.warn('[PRINCIPIA] Quiz analytics skipped',e)}
   return result;
  };
 }
 function install(){
  if(document.getElementById('principiaSuiteTrigger'))return;
  const b=document.createElement('button');b.id='principiaSuiteTrigger';b.type='button';b.textContent='✦';b.title='Trung tâm học tập PRINCIPIA';b.setAttribute('aria-label','Trung tâm học tập PRINCIPIA');
  b.style.cssText='position:fixed;left:18px;bottom:calc(82px + env(safe-area-inset-bottom,0px));z-index:1201;width:46px;height:46px;border-radius:15px;border:1px solid var(--line,#777);background:var(--card,#171526);color:var(--text,#fff);font-size:24px;box-shadow:0 8px 28px #0004;cursor:pointer';
  b.addEventListener('click',home);document.body.appendChild(b);
 }
 window.principiaSuiteHome=home;window.principiaSuiteOpenGames=()=>{close();if(typeof setPage==='function')setPage('entertainment')};window.principiaSuiteExamSetup=examSetup;window.principiaSuiteDaily=dailyChallenge;window.principiaSuiteDailyAnswer=dailyAnswer;window.principiaSuiteStartExam=startExam;window.principiaSuiteChoose=choose;window.principiaSuiteSubmitExam=submitExam;window.principiaSuiteExitExam=exitExam;window.principiaSuiteAnalytics=analytics;window.principiaSuiteQuests=quests;window.principiaSuiteClaimQuest=claimQuest;window.principiaSuiteNotes=notes;window.principiaSuiteAddNote=addNote;window.principiaSuiteDeleteNote=deleteNote;window.principiaSuiteFormulas=formulas;window.principiaSuiteFlashcards=flashcards;window.principiaSuiteReviewErrors=reviewErrors;window.principiaSuiteSpacedReview=spacedReview;window.principiaSuiteStartReview=startReview;window.principiaSuiteFlipReview=()=>{reviewSide=true;reviewCard()};window.principiaSuiteRateReview=rateReview;window.principiaSuiteSkipReview=skipReview;window.principiaSuiteFlip=()=>{flashSide=!flashSide;renderFlash()};window.principiaSuiteFlashPrev=()=>{flashIndex=Math.max(0,flashIndex-1);renderFlash()};window.principiaSuiteFlashNext=()=>{flashIndex++;renderFlash()};window.principiaSuiteErrors=errors;window.principiaSuiteAddError=addError;window.principiaSuiteDeleteError=deleteError;window.principiaSuiteBadges=badges;window.principiaSuiteNotifications=notifications;window.principiaSuiteEnableNotifications=enableNotifications;window.principiaSuiteDisableNotifications=()=>{state.notifications=false;save();notifications()};window.principiaSuiteAI=ai;window.principiaSuiteOpenChat=openChat;window.principiaSuiteCopyAI=copyAI;
 patchExistingQuizHistory();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
