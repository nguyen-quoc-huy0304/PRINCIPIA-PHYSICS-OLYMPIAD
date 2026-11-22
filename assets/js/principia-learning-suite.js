/* PRINCIPIA Learning Suite — Olympic practice, analytics, quests, notebook, formulas, flashcards, error log, badges, notifications, AI study handoff */
(function(){
 'use strict';
 const KEY='principia_learning_suite_v1';
 const safe=(v)=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}};
 const state=Object.assign({attempts:[],notes:[],errors:[],notifications:false,claimedQuests:[]},safe());
 const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(state))}catch(e){console.warn('[PRINCIPIA] Learning Suite storage:',e)}};
 const localDateKey=(date=new Date())=>{const y=date.getFullYear(),m=String(date.getMonth()+1).padStart(2,'0'),d=String(date.getDate()).padStart(2,'0');return y+'-'+m+'-'+d};
 function markStudyDay(){const api=window.PrincipiaProgressionCore;if(!api)return;state.studyDays=api.recordActivity(state.studyDays||[],new Date());save()}
 function currentXP(){try{return typeof xp!=='undefined'?Math.max(0,Number(xp)||0):Math.max(0,Number(state.xp)||0)}catch(_){return Math.max(0,Number(state.xp)||0)}}
 const allLessons=()=>{try{return typeof lessons==='function'?lessons():[]}catch(_){return []}};
 function pool(){
  const out=[];
  function walk(nodes,kind,path){
   (nodes||[]).forEach(n=>{
    const next=path.concat(n.name||'');
    (n.questions||n.quiz||[]).forEach(q=>{
     if(q&&q.q&&Array.isArray(q.a)&&q.a.length>=2&&Number.isInteger(Number(q.correct))&&q.a[Number(q.correct)]!==undefined)
      out.push({q:String(q.q),a:q.a.map(String),correct:Number(q.correct),topic:n.name||'Chủ đề',path:next.join(' › '),kind:kind,image:q.image||q.imageUrl||q.diagram||null,graph:q.graph||null});
    });
    if(n.children)walk(n.children,kind,next);
   });
  }
  try{if(typeof quizData!=='undefined')walk(quizData,'quiz',[])}catch(_){}
  try{if(typeof data!=='undefined')walk(data,'lesson',[])}catch(_){}
  const seen=new Set();return out.filter(x=>{const k=x.path+'|'+x.q;if(seen.has(k))return false;seen.add(k);return true});
 }
 let root=null,exam=null,examTimer=null,lastExamReview=null,lastExamDurationSeconds=null,examView='all',examCurrentIndex=0,flashIndex=0,flashSide=false,flashMode='bank',reviewQueue=[],reviewIndex=0,reviewSide=false,mysteryCase=null;
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
   card('Phòng luyện Olympic',q.length+' câu hỏi có sẵn · bài thi có thời gian','principiaSuiteExamSetup()','🏅')+card('Ngân hàng câu hỏi','Tìm nhanh theo câu hỏi, đáp án hoặc chủ đề','principiaSuiteQuestionBank()','🔎')+card('Thử thách mỗi ngày','1 câu hỏi ngẫu nhiên · +10 XP khi đúng','principiaSuiteDaily()','⚡')+
   card('Science Arcade','Mở game vật lý và thử thách quỹ đạo hiện có','principiaSuiteOpenGames()','🎮')+card('Giải mã bí ẩn khoa học','Điều tra 3 manh mối lấy từ câu hỏi bài học thật','principiaSuiteStartMystery()','🕵️')+
   card('Phân tích học tập',attempts.length+' lượt luyện · độ chính xác '+pct+'%','principiaSuiteAnalytics()','📊')+card('Lịch sử luyện tập',attempts.length+' lượt đã ghi nhận','principiaSuiteAttemptHistory()','📚')+
   card('Nhiệm vụ & hành trình','Mục tiêu lấy từ hoạt động thực tế','principiaSuiteQuests()','🧭')+card('Mùa giải tuần','3 nhiệm vụ theo tuần · nhận XP khi hoàn thành','principiaSuiteSeason()','🏆')+
   card('Sổ tay kiến thức',(state.notes||[]).length+' ghi chú đã lưu','principiaSuiteNotes()','📓')+
   card('Thư viện công thức','Trích xuất từ nội dung bài học','principiaSuiteFormulas()','📐')+
   card('Flashcard ôn tập',q.length+' thẻ từ ngân hàng câu hỏi','principiaSuiteFlashcards()','🃏')+card('Luyện câu yêu thích',(state.favoriteQuestions||[]).length+' câu đã đánh dấu','principiaSuiteFavoritePractice()','⭐')+card('Flashcard yêu thích','Ôn riêng các câu đã đánh dấu','principiaSuiteFavoriteFlashcards()','🌟')+card('Lịch sử thử thách ngày',(state.dailyHistory||[]).length+' kết quả gần đây','principiaSuiteDailyHistory()','📅')+card('Thẻ đã thuộc',(state.masteredQuestions||[]).length+' câu đã đánh dấu thành thạo','principiaSuiteMasteredFlashcards()','🎓')+card('Ôn tập thông minh','Lịch ôn thẻ theo mức độ nhớ','principiaSuiteSpacedReview()','🧠')+
   card('Sổ lỗi sai',(state.errors||[]).length+' lỗi đã ghi lại','principiaSuiteErrors()','🧠')+card('Ôn lại lỗi sai','Biến lỗi đã ghi thành thẻ ôn tập','principiaSuiteReviewErrors()','🔁')+
   card('Huy hiệu','Thành tích dựa trên dữ liệu thật','principiaSuiteBadges()','🏆')+card('Cấp độ & chuỗi ngày','Theo dõi XP, cấp độ và thành tích dài hạn','principiaSuiteProgression()','📈')+
   card('Thông báo học tập',state.notifications?'Đã bật quyền thông báo':'Cài đặt nhắc học trên thiết bị','principiaSuiteNotifications()','🔔')+
   card('Thảo luận cùng AI','Đưa câu hỏi và ngữ cảnh sang trợ lý PRINCIPIA','principiaSuiteAI()','✨')+card('Level Studio','Tự tạo màn chơi vật lý, chơi thử và chia sẻ','principiaSuiteLevels()','🧩')+card('Sổ nghiên cứu','Ghi thí nghiệm, thống kê số liệu và lưu kết quả','principiaSuiteResearch()','🔬')+card('Góc tập trung','Bộ đếm học tập, mục tiêu ngày và thống kê thời gian','principiaSuiteFocus()','⏱️')+card('Sao lưu tiến độ','Xuất hoặc khôi phục dữ liệu học tập trên thiết bị','principiaSuiteBackup()','💾')+
   '</div><p class="small muted" style="margin-top:14px">Ngân hàng hiện có: '+q.length+' câu hỏi. Nếu nội dung chưa có câu hỏi, phòng Olympic sẽ báo rõ thay vì tự tạo đề.</p>');
 }
 let questionBankQuery='',questionBankTopic='all',questionBankFavoritesOnly=false,questionBankMatches=[];
 function questionKey(q){return q.path+'|'+q.q}
 function questionBank(){
  const all=pool(),topics=[...new Set(all.map(q=>q.topic))].sort((a,b)=>a.localeCompare(b,'vi'));
  questionBankQuery='';questionBankTopic='all';questionBankFavoritesOnly=false;
  open('Ngân hàng câu hỏi','<p>Tìm kiếm, lọc theo chủ đề, đánh dấu câu yêu thích và xuất bộ câu hỏi đang lọc.</p><label for="plsQuestionSearch" class="small">Từ khóa tìm kiếm</label><input id="plsQuestionSearch" type="search" maxlength="120" placeholder="Ví dụ: định luật Newton, lực ma sát..." oninput="principiaSuiteQuestionSearch(this.value)" style="display:block;width:100%;box-sizing:border-box;padding:12px;margin:8px 0 12px;border:1px solid var(--line,#555);border-radius:12px;background:var(--card,#171a2a);color:inherit"><label for="plsQuestionTopic" class="small">Lọc chủ đề</label><select id="plsQuestionTopic" onchange="principiaSuiteQuestionTopic(this.value)" style="display:block;width:100%;padding:11px;margin:6px 0 12px;border:1px solid var(--line,#555);border-radius:10px;background:var(--card,#171a2a);color:inherit"><option value="all">Tất cả chủ đề ('+all.length+')</option>'+topics.map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('')+'</select><div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0"><button type="button" onclick="principiaSuiteQuestionFavorites()" id="plsQuestionFavFilter">☆ Chỉ câu yêu thích</button><button type="button" onclick="principiaSuiteQuestionExport()">↓ Xuất CSV</button></div><div id="plsQuestionCount" class="small muted" aria-live="polite"></div><div id="plsQuestionResults"></div>'+btn('Về trung tâm','principiaSuiteHome()'));
  renderQuestionBankResults('');
 }
 function renderQuestionBankResults(query){
  const host=document.getElementById('plsQuestionResults'),count=document.getElementById('plsQuestionCount');
  if(!host||!count)return;
  questionBankQuery=String(query||'').trim().slice(0,120);
  const term=questionBankQuery.toLocaleLowerCase('vi'),all=pool(),favorites=new Set(Array.isArray(state.favoriteQuestions)?state.favoriteQuestions:[]);
  questionBankMatches=all.filter(q=>(!term||[q.q,q.topic,q.path,...q.a].join(' ').toLocaleLowerCase('vi').includes(term))&&(questionBankTopic==='all'||q.topic===questionBankTopic)&&(!questionBankFavoritesOnly||favorites.has(questionKey(q))));
  const shown=questionBankMatches.slice(0,40);
  count.textContent='Tìm thấy '+questionBankMatches.length+'/'+all.length+' câu hỏi · '+favorites.size+' câu yêu thích'+(questionBankMatches.length>40?' · đang hiển thị 40 kết quả đầu':'');
  const favButton=document.getElementById('plsQuestionFavFilter');if(favButton)favButton.textContent=questionBankFavoritesOnly?'★ Đang lọc yêu thích':'☆ Chỉ câu yêu thích';
  host.innerHTML=shown.length?shown.map((q,i)=>{const key=encodeURIComponent(questionKey(q)),fav=favorites.has(questionKey(q));return panel('Câu '+(i+1)+' · '+esc(q.topic),'<p>'+esc(q.q)+'</p>'+questionMedia(q)+'<ol style="padding-left:22px">'+q.a.map((a,j)=>'<li style="margin:5px 0;'+(j===q.correct?'font-weight:700;color:#35c98a':'')+'">'+esc(a)+(j===q.correct?' ✓':'')+'</li>').join('')+'</ol><p class="small muted">'+esc(q.path)+'</p><button type="button" onclick="principiaSuiteToggleQuestionFavorite(\''+key+'\')">'+(fav?'★ Đã yêu thích':'☆ Lưu yêu thích')+'</button>')}).join(''):'<p class="muted">Không tìm thấy câu hỏi phù hợp. Thử từ khóa khác hoặc bỏ bộ lọc yêu thích.</p>';
 }
 function setQuestionTopic(topic){questionBankTopic=topic||'all';renderQuestionBankResults(questionBankQuery)}
 function toggleQuestionFavorite(encoded){const key=decodeURIComponent(encoded),list=Array.isArray(state.favoriteQuestions)?state.favoriteQuestions:[],i=list.indexOf(key);if(i>=0)list.splice(i,1);else list.push(key);state.favoriteQuestions=list;save();renderQuestionBankResults(questionBankQuery)}
 function toggleQuestionFavorites(){questionBankFavoritesOnly=!questionBankFavoritesOnly;renderQuestionBankResults(questionBankQuery)}
 function exportQuestionBank(){
  const rows=questionBankMatches.map(q=>[q.topic,q.path,q.q,...q.a,'Đáp án: '+q.a[q.correct]]);
  const quote=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const csv='\uFEFF'+[['Chủ đề','Đường dẫn','Câu hỏi','A','B','C','D','Đáp án đúng'],...rows].map(row=>row.map(quote).join(',')).join('\r\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download='principia-question-bank.csv';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 function dailyChallenge(){
  const today=localDateKey();
  const bank=pool();
  if(!bank.length){open('Thử thách mỗi ngày','<p>Chưa có câu hỏi hợp lệ để tạo thử thách. Hãy bổ sung câu hỏi vào Quiz hoặc bài học.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  if(!state.daily||state.daily.date!==today){const q=bank[Math.floor(Math.random()*bank.length)];state.daily={date:today,q:q.q,a:q.a,correct:q.correct,topic:q.topic,path:q.path,image:q.image||null,graph:q.graph||null,answered:false,choice:null};save()}
  const d=state.daily;
  let html='<p>1 câu hỏi mới mỗi ngày · dữ liệu từ ngân hàng bài học/Quiz thật.</p>'+panel('Thử thách '+today,'<b>'+esc(d.topic)+'</b><p>'+esc(d.q)+'</p>'+questionMedia(d)+'<div style="display:grid;gap:8px">'+d.a.map((a,i)=>'<button '+(d.answered?'disabled':'')+' onclick="principiaSuiteDailyAnswer('+i+')" style="text-align:left;padding:12px;border:1px solid var(--line,#555);border-radius:12px;background:var(--card,#171a2a);color:inherit">'+String.fromCharCode(65+i)+'. '+esc(a)+'</button>').join('')+'</div>'+ (d.answered?'<p><b>'+(d.choice===d.correct?'✅ Chính xác!':'❌ Chưa đúng')+'</b><br>Đáp án: '+esc(d.a[d.correct])+'</p>':'') )+btn('Về trung tâm','principiaSuiteHome()');
  open('Thử thách mỗi ngày',html)
 }
 let dailyHistoryQuery='',dailyHistoryFilter='all';
 function renderDailyHistory(){
  const host=document.getElementById('plsDailyHistoryRows'),count=document.getElementById('plsDailyHistoryCount');if(!host||!count)return;
  const all=state.dailyHistory||[],term=dailyHistoryQuery.toLocaleLowerCase('vi'),rows=all.filter(x=>(dailyHistoryFilter==='all'||(dailyHistoryFilter==='correct'?x.correct:!x.correct))&&[x.date,x.topic].join(' ').toLocaleLowerCase('vi').includes(term));
  count.textContent=rows.length+'/'+all.length+' kết quả';host.innerHTML=rows.map(x=>'<div style="padding:9px 0;border-bottom:1px solid var(--line,#444)"><b>'+esc(x.date)+'</b> · '+esc(x.topic)+' · '+(x.correct?'✅ Đúng':'❌ Sai')+'</div>').join('')||'<p class="muted">Không có kết quả phù hợp.</p>';
 }
 function dailyHistory(){open('Lịch sử thử thách mỗi ngày','<p id="plsDailyHistoryCount" class="small muted"></p><input type="search" maxlength="100" placeholder="Tìm theo ngày hoặc chủ đề..." oninput="principiaSuiteDailyHistorySearch(this.value)" style="width:100%;box-sizing:border-box;padding:10px;margin:6px 0"><select onchange="principiaSuiteDailyHistoryFilter(this.value)" style="padding:10px;margin:6px 0"><option value="all">Tất cả kết quả</option><option value="correct">Chỉ câu đúng</option><option value="wrong">Chỉ câu sai</option></select>'+btn('Xuất CSV lịch sử ngày','principiaSuiteExportDailyHistory()')+'<div id="plsDailyHistoryRows"></div>'+btn('Về trung tâm','principiaSuiteHome()'));renderDailyHistory()}
 function setDailyHistoryQuery(v){dailyHistoryQuery=String(v||'').slice(0,100);renderDailyHistory()}
 function setDailyHistoryFilter(v){dailyHistoryFilter=['all','correct','wrong'].includes(v)?v:'all';renderDailyHistory()}
 function exportDailyHistory(){const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const rows=(state.dailyHistory||[]).map(x=>[x.date,x.topic,x.correct?'Đúng':'Sai']);downloadText('\uFEFF'+[['Ngày','Chủ đề','Kết quả'],...rows].map(r=>r.map(q).join(',')).join('\r\n'),'principia-daily-challenge-history.csv','text/csv;charset=utf-8')}
 function dailyAnswer(i){
  const d=state.daily;if(!d||d.answered||!Number.isInteger(i))return;
  d.choice=i;d.answered=true;markStudyDay();state.dailyHistory=Array.isArray(state.dailyHistory)?state.dailyHistory:[];state.dailyHistory.unshift({date:localDateKey(),topic:d.topic,correct:i===d.correct});state.dailyHistory=state.dailyHistory.slice(0,30);if(i===d.correct){state.xp=(state.xp||0)+10;try{if(typeof xp!=='undefined'){xp+=10;if(typeof saveAll==='function')saveAll()}}catch(_){}}
  else state.errors.unshift({title:d.q,body:'Bạn chọn: '+d.a[i]+'\\nĐáp án đúng: '+d.a[d.correct]+'\\nChủ đề: '+d.topic,date:new Date().toISOString()});
  save();dailyChallenge();
 }
 function spacedReview(){
  const today=localDateKey(),review=state.review||{},bank=pool(),due=bank.filter(q=>{const rec=review[q.path+'|'+q.q];return !rec||!rec.due||rec.due<=today}),scheduled=bank.filter(q=>{const rec=review[q.path+'|'+q.q];return rec&&rec.due&&rec.due>today}).length,newCards=bank.filter(q=>!review[q.path+'|'+q.q]).length;const upcoming=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()+i);const key=localDateKey(d);return {date:key,count:bank.filter(q=>review[q.path+'|'+q.q]?.due===key).length}});
  open('Ôn tập thông minh','<p><b>'+due.length+'</b> thẻ đến hạn hôm nay.</p><p class="muted">Tổng '+bank.length+' thẻ · '+newCards+' thẻ mới · '+scheduled+' thẻ đang lên lịch</p><h3>Lịch ôn 7 ngày tới</h3>'+upcoming.map(x=>'<div style="display:flex;justify-content:space-between;padding:6px;border-bottom:1px solid var(--line,#444)"><span>'+esc(x.date)+'</span><b>'+x.count+' thẻ</b></div>').join('')+btn('Bắt đầu ôn','principiaSuiteStartReview()','primary')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function startReview(){
  const today=localDateKey(new Date()),review=state.review||{};
  reviewQueue=pool().filter(q=>{const rec=review[q.path+'|'+q.q];return !rec||!rec.due||rec.due<=today});
  reviewIndex=0;reviewSide=false;reviewCard();
 }
 function reviewCard(){
  if(reviewIndex>=reviewQueue.length){open('Hoàn thành ôn tập','<p>Đã ôn xong các thẻ đến hạn.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  const q=reviewQueue[reviewIndex];let html=panel('Thẻ '+(reviewIndex+1)+'/'+reviewQueue.length,'<b>'+esc(q.topic)+'</b><p>'+esc(q.q)+'</p>'+questionMedia(q)+(reviewSide?'<p>Đáp án: '+esc(q.a[q.correct])+'</p>':''));
  html+=reviewSide?btn('Quên · 1 ngày','principiaSuiteRateReview(0)')+btn('Khó · 2 ngày','principiaSuiteRateReview(1)')+btn('Nhớ · 4 ngày','principiaSuiteRateReview(2)')+btn('Dễ · 7 ngày','principiaSuiteRateReview(3)'):btn('Xem đáp án','principiaSuiteFlipReview()','primary');
  html+=btn('Bỏ qua','principiaSuiteSkipReview()')+btn('Về trung tâm','principiaSuiteHome()');open('Ôn tập thông minh',html);
 }
 function rateReview(r){
  const q=reviewQueue[reviewIndex];if(!q||!Number.isInteger(r)||r<0||r>3)return;const previous=Number((state.review||{})[q.path+'|'+q.q]?.interval)||0;const days=[1,Math.max(2,previous||2),Math.max(4,(previous||2)*2),Math.max(7,(previous||2)*3)][r],interval=Math.min(60,days),next=new Date();next.setDate(next.getDate()+interval);
  markStudyDay();state.review=state.review||{};state.review[q.path+'|'+q.q]={interval:interval,due:localDateKey(next),last:new Date().toISOString(),rating:r};save();reviewIndex++;reviewSide=false;reviewCard();
 }
 function skipReview(){reviewIndex++;reviewSide=false;reviewCard()}
 function savedExamDraft(){try{const raw=localStorage.getItem('principia_olympic_exam_draft_v1');if(!raw)return null;const d=JSON.parse(raw);return d&&Array.isArray(d.questions)&&d.questions.length&&d.answers&&Number.isFinite(d.end)&&d.end>Date.now()&&!d.submitted?d:null}catch(_){return null}}
 function saveExamDraft(){try{if(exam&&!exam.submitted)localStorage.setItem('principia_olympic_exam_draft_v1',JSON.stringify(exam))}catch(e){console.warn('[PRINCIPIA] Không thể lưu bản nháp bài thi',e)}}
 function clearExamDraft(){try{localStorage.removeItem('principia_olympic_exam_draft_v1')}catch(_){}}
 function resumeExamDraft(){const draft=savedExamDraft();if(!draft){clearExamDraft();examSetup();return}exam=Object.assign({marked:[],answers:{},submitted:false,startedAt:Date.now(),warned5:false,warned1:false},draft);examCurrentIndex=Math.max(0,Math.min(exam.questions.length-1,Number(exam.currentIndex)||0));examView='all';renderExam();startTimer()}
 function discardExamDraft(){if(!confirm('Xóa bản nháp bài thi đang lưu?'))return;clearExamDraft();examSetup()}
 function examSetup(){
  const all=pool(),topics=[...new Set(all.map(q=>q.topic))].sort((a,b)=>a.localeCompare(b,'vi')),draft=savedExamDraft();
  const resume=draft?panel('Có bài thi chưa hoàn tất','<p>Bản nháp còn '+clock(draft.end-Date.now())+' · '+Object.keys(draft.answers||{}).length+'/'+draft.questions.length+' câu đã trả lời.</p>'+btn('Tiếp tục bài thi','principiaSuiteResumeExam()','primary')+btn('Xóa bản nháp','principiaSuiteDiscardExamDraft()')):'';
  open('Phòng luyện Olympic',resume+'<p>Đề lấy ngẫu nhiên từ ngân hàng Quiz và câu hỏi cuối bài học. Có thể chọn chủ đề trước khi thi.</p>'+panel('Thiết lập bài thi','<label>Chủ đề <select id="plsExamTopic" style="margin:8px;padding:8px;max-width:100%"><option value="all">Tất cả chủ đề ('+all.length+')</option>'+topics.map(t=>'<option value="'+esc(t)+'">'+esc(t)+' ('+all.filter(q=>q.topic===t).length+')</option>').join('')+'</select></label><br><label>Số câu <select id="plsExamCount" style="margin:8px;padding:8px"><option value="5">5 câu</option><option value="10" selected>10 câu</option><option value="20">20 câu</option><option value="all">Tất cả</option></select></label><label>Thời gian <select id="plsExamMinutes" style="margin:8px;padding:8px"><option value="10">10 phút</option><option value="20" selected>20 phút</option><option value="30">30 phút</option><option value="45">45 phút</option></select></label><p class="small muted">'+all.length+' câu hỏi · đáp án được đảo thứ tự ngẫu nhiên trong mỗi đề.</p>'+btn('Bắt đầu thi','principiaSuiteStartExam()','primary'))+btn('Quay lại','principiaSuiteHome()'));
 }
 function shuffledQuestion(q){
  const choices=q.a.map((value,index)=>({value,index}));
  for(let i=choices.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[choices[i],choices[j]]=[choices[j],choices[i]]}
  return Object.assign({},q,{a:choices.map(x=>x.value),correct:choices.findIndex(x=>x.index===q.correct)});
 }
 function startExam(){
  const all=pool();if(!all.length){open('Chưa có ngân hàng đề','<p>Hiện chưa tìm thấy câu hỏi hợp lệ trong Quiz hoặc bài học. Hãy thêm câu hỏi trước khi mở phòng luyện.</p>'+btn('Đóng','principiaSuiteHome()'));return}
  const topic=document.getElementById('plsExamTopic')?.value||'all',source=topic==='all'?all:all.filter(q=>q.topic===topic);
  if(!source.length){alert('Chủ đề này chưa có câu hỏi hợp lệ.');return}
  const countValue=document.getElementById('plsExamCount')?.value||'10',minutes=Math.max(1,Number(document.getElementById('plsExamMinutes')?.value)||20);
  const shuffled=source.slice().sort(()=>Math.random()-.5),selected=countValue==='all'?shuffled:shuffled.slice(0,Math.min(Number(countValue)||10,shuffled.length));
  exam={questions:selected.map(shuffledQuestion),answers:{},marked:[],end:Date.now()+minutes*60000,startedAt:Date.now(),submitted:false,topic,warned5:false,warned1:false,currentIndex:0};
  examCurrentIndex=0;examView='all';saveExamDraft();renderExam();startTimer();
 }
 function stopTimer(){if(examTimer){clearInterval(examTimer);examTimer=null}}
 function startTimer(){stopTimer();examTimer=setInterval(()=>{if(!exam)return;const left=Math.max(0,exam.end-Date.now()),el=document.getElementById('plsExamClock');if(el){el.textContent=clock(left);el.style.color=left<=60000?'#ff6464':left<=300000?'#ffb454':''}if(left<=300000&&!exam.warned5){exam.warned5=true;if(left>60000)showExamNotice('Còn 5 phút hoặc ít hơn — kiểm tra các câu còn bỏ trống.')}if(left<=60000&&!exam.warned1){exam.warned1=true;showExamNotice('Còn 1 phút — chuẩn bị nộp bài!')}if(!left)submitExam(true)},1000)}
 function showExamNotice(message){const clockEl=document.getElementById('plsExamClock');if(!clockEl)return;let note=document.getElementById('plsExamTimeNotice');if(!note){note=document.createElement('div');note.id='plsExamTimeNotice';note.setAttribute('role','status');note.setAttribute('aria-live','polite');note.style.cssText='padding:9px 12px;margin:8px 0;border-radius:10px;background:rgba(255,170,60,.14);color:inherit';clockEl.parentElement.insertAdjacentElement('afterend',note)}note.textContent=message}
 function clock(ms){const s=Math.ceil(ms/1000);return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')}
 function questionMedia(q){
  let html='';
  const image=q.image;
  if(typeof image==='string'&&image.trim()&&(/^(https:\/\/|\/)/i).test(image.trim())){
   html+='<figure style="margin:12px 0"><img src="'+esc(image.trim())+'" alt="Hình minh họa câu hỏi" loading="lazy" style="max-width:100%;max-height:360px;object-fit:contain;border-radius:12px;border:1px solid var(--line,#444)"></figure>';
  }
  const g=q.graph;
  if(g&&Array.isArray(g.points)&&g.points.length>=2){
   const pts=g.points.map(p=>Array.isArray(p)&&p.length>=2?[Number(p[0]),Number(p[1])]:null).filter(p=>p&&p.every(Number.isFinite));
   if(pts.length>=2){
    const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const dx=xmax-xmin||1,dy=ymax-ymin||1,W=360,H=220,L=48,R=12,T=14,B=38;
    const X=x=>L+(x-xmin)/dx*(W-L-R),Y=y=>T+(ymax-y)/dy*(H-T-B);
    const path=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
    html+='<div style="margin:12px 0;padding:8px;border:1px solid var(--line,#444);border-radius:12px;overflow:auto"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Đồ thị dữ liệu câu hỏi" style="width:100%;max-width:520px"><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'" stroke="currentColor" opacity=".7"/><line x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'" stroke="currentColor" opacity=".7"/><path d="'+path+'" fill="none" stroke="#8b75ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'+pts.map(p=>'<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="3.5" fill="#8b75ff"/>').join('')+'<text x="'+(W/2)+'" y="'+(H-6)+'" fill="currentColor" font-size="12" text-anchor="middle">'+esc(g.xLabel||'x')+'</text><text transform="translate(14 '+(H/2)+') rotate(-90)" fill="currentColor" font-size="12" text-anchor="middle">'+esc(g.yLabel||'y')+'</text><text x="'+L+'" y="'+(H-20)+'" fill="currentColor" font-size="11">'+xmin+'</text><text x="'+(W-R-25)+'" y="'+(H-20)+'" fill="currentColor" font-size="11">'+xmax+'</text><text x="24" y="'+(T+4)+'" fill="currentColor" font-size="11">'+ymax+'</text><text x="24" y="'+(H-B)+'" fill="currentColor" font-size="11">'+ymin+'</text></svg></div>';
   }
  }
  return html;
 }
 function renderExam(){
  if(!exam||exam.submitted)return;
  const qs=exam.questions,answered=Object.keys(exam.answers).length,unanswered=qs.length-answered,marked=exam.marked||[];
  let html='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><b>Đã trả lời '+answered+'/'+qs.length+' · Còn '+unanswered+'</b><b id="plsExamClock" style="font-size:22px;font-variant-numeric:tabular-nums">'+clock(exam.end-Date.now())+'</b></div>';
  html+='<div style="height:7px;background:var(--line,#444);border-radius:20px;margin:12px 0 18px"><div style="height:100%;width:'+answered/qs.length*100+'%;background:var(--purple,#9b87ff);border-radius:20px"></div></div>';
  html+='<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0"><button type="button" onclick="principiaSuiteExamView(\'all\')">Tất cả ('+qs.length+')</button><button type="button" onclick="principiaSuiteExamView(\'unanswered\')">Chưa trả lời ('+unanswered+')</button><button type="button" onclick="principiaSuiteExamView(\'marked\')">Đánh dấu xem lại ('+marked.length+')</button></div>';
  html+='<div style="display:flex;gap:5px;flex-wrap:wrap;margin:10px 0" aria-label="Điều hướng câu hỏi">'+qs.map((q,i)=>'<button type="button" onclick="principiaSuiteJumpQuestion('+i+')" aria-label="Đi tới câu '+(i+1)+'" style="min-width:36px;padding:7px;border-radius:9px;border:1px solid var(--line,#555);background:'+(exam.answers[i]!==undefined?'var(--purple,#7863db)':marked.includes(i)?'var(--card,#222)':'transparent')+';color:inherit">'+(i+1)+(marked.includes(i)?' ★':'')+'</button>').join('')+'</div>';
  const visible=qs.map((q,i)=>({q,i})).filter(x=>examView==='unanswered'?exam.answers[x.i]===undefined:examView==='marked'?marked.includes(x.i):true);
  if(!visible.length)html+='<p class="muted">Không có câu hỏi trong bộ lọc này.</p>';
  visible.forEach(({q,i})=>{
   const body='<p style="font-size:17px">'+esc(q.q)+'</p>'+questionMedia(q)+'<div>'+q.a.map((a,j)=>'<label style="display:flex;gap:9px;align-items:flex-start;padding:9px;margin:5px 0;border:1px solid var(--line,#444);border-radius:10px"><input type="radio" name="plsQ'+i+'" '+(exam.answers[i]===j?'checked':'')+' onchange="principiaSuiteChoose('+i+','+j+')" style="margin-top:4px"><span>'+esc(a)+'</span></label>').join('')+'</div><button type="button" onclick="principiaSuiteToggleExamMark('+i+')">'+(marked.includes(i)?'★ Bỏ đánh dấu xem lại':'☆ Đánh dấu xem lại')+'</button>';
   html+=panel((exam.answers[i]===undefined?'○ ':'✓ ')+(marked.includes(i)?'★ ':'')+'Câu '+(i+1)+' · '+esc(q.topic),body).replace('<section class="panel"','<section id="plsExamQuestion'+i+'" class="panel"');
  });
  html+='<div style="display:flex;gap:7px;flex-wrap:wrap;margin:10px 0">'+btn('← Câu trước','principiaSuiteExamPrev()')+btn('Câu tiếp →','principiaSuiteExamNext()')+btn('Bỏ chọn đáp án','principiaSuiteClearAnswer('+examCurrentIndex+')')+'</div>';
  html+=btn('Nộp bài','principiaSuiteSubmitExam(false)','primary')+btn('Thoát bài thi','principiaSuiteExitExam()');
  open('Phòng luyện Olympic',html);
 }
 function examViewFilter(mode){examView=['all','unanswered','marked'].includes(mode)?mode:'all';renderExam()}
 function jumpExamQuestion(i){if(!exam||!Number.isInteger(i)||i<0||i>=exam.questions.length)return;examCurrentIndex=i;exam.currentIndex=i;saveExamDraft();const el=document.getElementById('plsExamQuestion'+i);if(el)el.scrollIntoView({behavior:'smooth',block:'start'})}
 function examPrevious(){if(exam)jumpExamQuestion(Math.max(0,examCurrentIndex-1))}
 function examNext(){if(exam)jumpExamQuestion(Math.min(exam.questions.length-1,examCurrentIndex+1))}
 function clearExamAnswer(i){if(!exam||!Number.isInteger(i)||i<0||i>=exam.questions.length)return;delete exam.answers[i];examCurrentIndex=i;exam.currentIndex=i;saveExamDraft();renderExam();jumpExamQuestion(i)}
 function toggleExamMark(i){if(!exam||!Number.isInteger(i)||i<0||i>=exam.questions.length)return;exam.marked=Array.isArray(exam.marked)?exam.marked:[];const at=exam.marked.indexOf(i);if(at>=0)exam.marked.splice(at,1);else exam.marked.push(i);examCurrentIndex=i;exam.currentIndex=i;saveExamDraft();renderExam();jumpExamQuestion(i)}
 function choose(i,j){if(!exam||exam.submitted||!Number.isInteger(i)||!Number.isInteger(j)||!exam.questions[i]||j<0||j>=exam.questions[i].a.length)return;exam.answers[i]=j;examCurrentIndex=i;exam.currentIndex=i;saveExamDraft();renderExam();jumpExamQuestion(i)}
 function handleExamKeys(e){if(!exam||exam.submitted||!root||root.style.display==='none'||e.ctrlKey||e.metaKey||e.altKey)return;const tag=(e.target&&e.target.tagName||'').toLowerCase();if(['input','textarea','select'].includes(tag)||e.target?.isContentEditable)return;if(/^[1-9]$/.test(e.key)){const q=exam.questions[examCurrentIndex];if(q&&Number(e.key)<=q.a.length){e.preventDefault();choose(examCurrentIndex,Number(e.key)-1)}}else if(e.key==='ArrowRight'){e.preventDefault();examNext()}else if(e.key==='ArrowLeft'){e.preventDefault();examPrevious()}}
 function submitExam(auto){
  if(!exam||exam.submitted)return;
  const qs=exam.questions,unanswered=qs.length-Object.keys(exam.answers).length;
  if(!auto&&unanswered>0&&!confirm('Bạn còn '+unanswered+' câu chưa trả lời. Vẫn nộp bài?'))return;
  const score=qs.reduce((s,q,i)=>s+(exam.answers[i]===q.correct?1:0),0);
  exam.submitted=true;stopTimer();markStudyDay();
  const finishedAt=Date.now(),durationSeconds=Math.max(0,Math.round((finishedAt-(exam.startedAt||finishedAt))/1000));
  const attempt={date:new Date(finishedAt).toISOString(),score:score,total:qs.length,percent:Math.round(score/qs.length*100),mode:'olympic',durationSeconds};
  state.attempts.push(attempt);qs.forEach((q,i)=>{if(exam.answers[i]!==q.correct){state.errors.unshift({title:q.q,body:'Bạn chọn: '+(q.a[exam.answers[i]]||'Chưa trả lời')+'\\nĐáp án đúng: '+q.a[q.correct]+'\\nNguồn: '+q.path,date:new Date().toISOString()})}});if(state.errors.length>300)state.errors=state.errors.slice(0,300);if(state.attempts.length>300)state.attempts=state.attempts.slice(-300);save();
  try{if(typeof xp!=='undefined'&&typeof saveAll==='function'){xp+=Math.max(5,score*5);saveAll()}}catch(_){}
  lastExamReview=qs.map((q,i)=>({q,choice:exam.answers[i],correct:exam.answers[i]===q.correct,index:i}));lastExamDurationSeconds=durationSeconds;clearExamDraft();exam=null;renderExamResult(false,score,qs.length,auto,durationSeconds);
  try{if(state.notifications&&'Notification'in window&&Notification.permission==='granted')new Notification('PRINCIPIA · Kết quả luyện tập',{body:'Bạn đạt '+score+'/'+qs.length+' câu.'})}catch(_){}
 }
 function exitExam(){if(exam&&!confirm('Thoát bài thi? Bản nháp sẽ được lưu để bạn có thể tiếp tục sau.'))return;saveExamDraft();exam=null;stopTimer();home()}
 function renderExamResult(onlyWrong,knownScore,total,auto,durationSeconds){
  if(!lastExamReview)return;
  if(!Number.isFinite(durationSeconds))durationSeconds=lastExamDurationSeconds;
  const rows=lastExamReview.filter(x=>!onlyWrong||!x.correct),score=knownScore===undefined?lastExamReview.filter(x=>x.correct).length:knownScore,n=total===undefined?lastExamReview.length:total;
  let html='<div style="text-align:center;padding:18px"><div style="font-size:42px">🏅</div><h1>'+score+'/'+n+'</h1><h2>'+Math.round(score/n*100)+'% chính xác</h2><p>'+(auto?'Đã tự động nộp khi hết giờ.':'Đã ghi nhận kết quả bài thi.')+'</p>'+(Number.isFinite(durationSeconds)?'<p class="small muted">Thời gian làm bài: '+Math.floor(durationSeconds/60)+' phút '+(durationSeconds%60)+' giây</p>':'')+'</div>';
  html+='<div style="display:flex;gap:8px;flex-wrap:wrap">'+btn('Tất cả câu ('+lastExamReview.length+')','principiaSuiteExamResultFilter(false)')+btn('Chỉ câu sai ('+lastExamReview.filter(x=>!x.correct).length+')','principiaSuiteExamResultFilter(true)')+'</div>';
  rows.forEach(x=>{const q=x.q;html+=panel((x.correct?'✓ ':'✗ ')+'Câu '+(x.index+1),'<p>'+esc(q.q)+'</p><p>Đáp án đúng: <b>'+esc(q.a[q.correct])+'</b></p><p class="small muted">Bạn chọn: '+(x.choice===undefined?'Chưa trả lời':esc(q.a[x.choice]))+'</p>')});
  open('Kết quả luyện Olympic',html+btn('Luyện lại câu sai','principiaSuiteRetryMistakes()','primary')+btn('Về trung tâm','principiaSuiteHome()')+btn('Thi lượt mới','principiaSuiteExamSetup()'));
 }
 function examResultFilter(onlyWrong){renderExamResult(!!onlyWrong)}
 function retryExamMistakes(){
  if(!lastExamReview)return;
  const wrong=lastExamReview.filter(x=>!x.correct).map(x=>shuffledQuestion(x.q));
  if(!wrong.length){alert('Bạn không có câu sai để luyện lại.');return}
  exam={questions:wrong,answers:{},marked:[],end:Date.now()+Math.max(5,wrong.length*2)*60000,startedAt:Date.now(),submitted:false,topic:'Ôn câu sai',warned5:false,warned1:false,currentIndex:0};
  examCurrentIndex=0;examView='all';saveExamDraft();renderExam();startTimer();
 }
 let analyticsRange='all';
 function analytics(){
  const all=state.attempts||[],cutoff=analyticsRange==='7'?Date.now()-7*86400000:analyticsRange==='30'?Date.now()-30*86400000:0;
  const a=all.filter(x=>{const t=Date.parse(x.date);return Number.isFinite(t)&&t>=cutoff}),total=a.reduce((s,x)=>s+(Number(x.total)||0),0),right=a.reduce((s,x)=>s+(Number(x.score)||0),0),pct=total?Math.round(right/total*100):0;
  const recent=a.slice(-10).reverse();
  const weakMap={};
  (state.errors||[]).forEach(e=>{
   let source=String(e.path||'');
   if(!source){const match=String(e.body||'').match(/Nguồn:\s*([^\\n]+)/i);if(match)source=match[1].trim();}
   const topic=(source||'Chưa phân loại').split(/ › | \/ | > /)[0].trim()||'Chưa phân loại';
   weakMap[topic]=(weakMap[topic]||0)+1;
  });
  const weakRows=Object.entries(weakMap).sort((x,y)=>y[1]-x[1]).slice(0,8);
  const weakHtml=weakRows.length?weakRows.map(([topic,count])=>'<div style="display:flex;justify-content:space-between;gap:12px;padding:9px 0;border-bottom:1px solid var(--line,#444)"><span>'+esc(topic)+'</span><b>'+count+' lỗi</b></div>').join('')+'<p class="small muted">Thống kê từ sổ lỗi sai đã lưu; chủ đề có nhiều lỗi hơn được ưu tiên ôn trước.</p>'+btn('Ôn các câu sai','principiaSuiteReviewErrors()'):'<p class="muted">Chưa có lỗi sai được lưu để phân tích chủ đề. Hãy làm bài luyện tập để bắt đầu theo dõi.</p>';
  const bars=recent.map(x=>'<div style="display:flex;gap:10px;align-items:center;margin:8px 0"><span style="width:90px;font-size:12px">'+new Date(x.date).toLocaleDateString('vi-VN')+'</span><div style="flex:1;height:10px;background:var(--line,#444);border-radius:20px"><div style="height:100%;width:'+x.percent+'%;background:var(--purple,#9b87ff);border-radius:20px"></div></div><b>'+x.percent+'%</b></div>').join('')||'<p class="muted">Chưa có lượt thi nào được ghi nhận.</p>';
  let done=0;try{done=typeof completed!=='undefined'?completed.length:0}catch(_){}
  let earned=0;try{earned=typeof xp!=='undefined'?xp:0}catch(_){}
  open('Phân tích học tập', '<label>Khoảng thời gian <select onchange="principiaSuiteAnalyticsRange(this.value)" style="padding:9px;margin:6px"><option value="all" '+(analyticsRange==='all'?'selected':'')+'>Toàn bộ</option><option value="30" '+(analyticsRange==='30'?'selected':'')+'>30 ngày</option><option value="7" '+(analyticsRange==='7'?'selected':'')+'>7 ngày</option></select></label>'+btn('Xuất CSV thống kê','principiaSuiteExportAnalytics()')+'<p class="small muted">Đang xem '+a.length+'/'+all.length+' lượt luyện.</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:9px">'+
   panel('Độ chính xác','<h2>'+pct+'%</h2>')+panel('Lượt luyện','<h2>'+a.length+'</h2>')+panel('Câu đã làm','<h2>'+total+'</h2>')+panel('Bài học hoàn thành','<h2>'+done+'</h2>')+panel('XP hiện có','<h2>'+earned+'</h2>')+'</div>'+panel('10 lượt gần nhất',bars)+panel('Chủ đề cần củng cố',weakHtml)+panel('Lịch sử',a.slice(-20).reverse().map(x=>'<div style="padding:8px 0;border-bottom:1px solid var(--line,#444)">'+new Date(x.date).toLocaleString('vi-VN')+' · <b>'+x.score+'/'+x.total+'</b> ('+x.percent+'%)</div>').join('')||'<p>Chưa có dữ liệu.</p>')+btn('Quay lại','principiaSuiteHome()'));
 }
 function setAnalyticsRange(value){analyticsRange=['7','30','all'].includes(String(value))?String(value):'all';analytics()}
 function exportAnalytics(){const quote=v=>'\"'+String(v==null?'':v).replace(/\"/g,'\"\"')+'\"';const rows=(state.attempts||[]).map(x=>[x.date,x.mode||'',x.score,x.total,x.percent]);downloadText('\uFEFF'+[['Thời điểm','Chế độ','Số câu đúng','Tổng câu','Chính xác (%)'],...rows].map(r=>r.map(quote).join(',')).join('\r\n'),'principia-learning-analytics.csv','text/csv;charset=utf-8')}
 function downloadText(content,name,type){const blob=new Blob([content],{type:type||'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
 function seasonMissions(){
  const api=window.PrincipiaSeasonCore;if(!api){open('Mùa giải tuần','<p>Module mùa giải chưa tải được.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  const now=new Date(),week=api.weekKey(now),attempts=(state.attempts||[]).filter(x=>{try{return api.weekKey(new Date(x.date))===week}catch(_){return false}});
  const questions=attempts.reduce((n,x)=>n+(Number(x.total)||0),0),notes=(state.notes||[]).filter(x=>{try{return api.weekKey(new Date(x.date))===week}catch(_){return false}}).length;
  const list=api.missions({sessions:attempts.length,questions,notes},now),claimed=Array.isArray(state.seasonClaims)?state.seasonClaims:[];
  const body=list.map(m=>{const done=claimed.includes(m.week+':'+m.id);return panel((m.complete?'✓ ':'○ ')+esc(m.name),'<p>'+esc(m.description)+'</p><div style="height:8px;border-radius:10px;background:var(--line,#444);overflow:hidden"><div style="height:100%;width:'+m.progress+'%;background:var(--purple,#9b87ff)"></div></div><p class="small muted">'+Math.min(m.value,m.target)+'/'+m.target+' · '+m.progress+'% · thưởng '+m.xp+' XP</p>'+(done?'<b class="small" style="color:#55b98a">Đã nhận thưởng tuần này</b>':m.complete?btn('Nhận '+m.xp+' XP','principiaSuiteClaimSeason(\''+m.id+'\')','primary'):'<small class="muted">Tiếp tục hoạt động để hoàn thành</small>'))}).join('');
  open('Mùa giải tuần','<p>Tuần bắt đầu '+esc(week)+' · nhiệm vụ tính từ lượt luyện và ghi chú thực tế trên thiết bị này.</p>'+body+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function claimSeason(id){
  const api=window.PrincipiaSeasonCore;if(!api)return;
  const now=new Date(),week=api.weekKey(now),attempts=(state.attempts||[]).filter(x=>{try{return api.weekKey(new Date(x.date))===week}catch(_){return false}});
  const questions=attempts.reduce((n,x)=>n+(Number(x.total)||0),0),notes=(state.notes||[]).filter(x=>{try{return api.weekKey(new Date(x.date))===week}catch(_){return false}}).length;
  const list=api.missions({sessions:attempts.length,questions,notes},now),claimed=Array.isArray(state.seasonClaims)?state.seasonClaims:[];
  const item=list.find(x=>x.id===id);if(!item||!api.canClaim(list,id,claimed))return;
  state.seasonClaims=claimed.concat(item.week+':'+id);save();
  try{if(typeof xp!=='undefined'&&typeof saveAll==='function'){xp+=item.xp;saveAll()}else{state.xp=(Number(state.xp)||0)+item.xp;save()}}catch(_){}
  seasonMissions();
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
 function notes(query){
  const term=String(query||'').trim().toLocaleLowerCase('vi'),all=state.notes||[];
  const matched=all.map((n,i)=>({n,i})).filter(x=>!term||[x.n.title,x.n.body].join(' ').toLocaleLowerCase('vi').includes(term));
  const rows=matched.map(({n,i})=>panel(esc(n.title||'Ghi chú '+(i+1)),'<p style="white-space:pre-wrap">'+esc(n.body)+'</p><small class="muted">'+new Date(n.date).toLocaleString('vi-VN')+(n.updatedAt?' · đã sửa':'')+'</small><div>'+btn('Sửa ghi chú','principiaSuiteEditNote('+i+')')+btn('Xóa','principiaSuiteDeleteNote('+i+')','danger')+'</div>')).join('');
  open('Sổ tay kiến thức','<label>Tiêu đề<input id="plsNoteTitle" maxlength="100" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></label><label>Nội dung<textarea id="plsNoteBody" rows="4" maxlength="10000" oninput="principiaSuiteNoteCount(this.value)" onkeydown="if((event.ctrlKey||event.metaKey)&&event.key===\'Enter\'){event.preventDefault();principiaSuiteAddNote()}" style="display:block;width:100%;padding:10px;margin:6px 0 4px"></textarea></label><small id="plsNoteLength" class="muted">0/10000 ký tự · Ctrl+Enter để lưu</small>'+btn('Lưu ghi chú','principiaSuiteAddNote()','primary')+btn('Xuất sổ tay Markdown','principiaSuiteExportNotes()')+'<label for="plsNotesSearch">Tìm trong ghi chú</label><input id="plsNotesSearch" type="search" placeholder="Tìm tiêu đề hoặc nội dung..." oninput="principiaSuiteFilterNotes(this.value)" style="display:block;width:100%;padding:10px;margin:6px 0;border:1px solid var(--line,#555);border-radius:10px;background:var(--card,#171a2a);color:inherit"><p id="plsNotesCount" class="small muted">'+matched.length+' ghi chú phù hợp / '+all.length+' tổng cộng</p><div id="plsNotesResults">'+(rows||'<p class="muted">Chưa có ghi chú phù hợp.</p>')+'</div>'+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function renderNotes(query){
  const host=document.getElementById('plsNotesResults'),count=document.getElementById('plsNotesCount');if(!host||!count)return;
  const term=String(query||'').trim().toLocaleLowerCase('vi'),all=state.notes||[];
  const rows=all.map((n,i)=>({n,i})).filter(x=>!term||[x.n.title,x.n.body].join(' ').toLocaleLowerCase('vi').includes(term));
  count.textContent=rows.length+' ghi chú phù hợp / '+all.length+' tổng cộng';
  host.innerHTML=rows.map(({n,i})=>panel(esc(n.title||'Ghi chú '+(i+1)),'<p style="white-space:pre-wrap">'+esc(n.body)+'</p><small class="muted">'+new Date(n.date).toLocaleString('vi-VN')+(n.updatedAt?' · đã sửa':'')+'</small><div>'+btn('Sửa ghi chú','principiaSuiteEditNote('+i+')')+btn('Xóa','principiaSuiteDeleteNote('+i+')','danger')+'</div>')).join('')||'<p class="muted">Chưa có ghi chú phù hợp.</p>';
 }
 function noteCount(value){const el=document.getElementById('plsNoteLength');if(el)el.textContent=String(value||'').length+'/10000 ký tự · Ctrl+Enter để lưu'}
 function addNote(){const title=document.getElementById('plsNoteTitle').value.trim(),body=document.getElementById('plsNoteBody').value.trim();if(!body){alert('Nhập nội dung ghi chú trước nhé.');return}state.notes.unshift({title:title||'Ghi chú mới',body:body,date:new Date().toISOString()});save();notes()}
 function exportNotes(){const rows=(state.notes||[]).map(n=>'## '+(n.title||'Ghi chú')+'\n\n'+String(n.body||'')+'\n\n_'+new Date(n.date).toLocaleString('vi-VN')+'_');downloadText('# Sổ tay PRINCIPIA\n\n'+rows.join('\n\n---\n\n'),'principia-study-notes.md','text/markdown;charset=utf-8')}
 function editNote(i){
  const n=state.notes[i];if(!n)return;
  open('Sửa ghi chú','<label>Tiêu đề<input id="plsEditNoteTitle" maxlength="100" value="'+esc(n.title||'')+'" style="display:block;width:100%;padding:10px;margin:6px 0 12px"></label><label>Nội dung<textarea id="plsEditNoteBody" rows="7" style="display:block;width:100%;padding:10px;margin:6px 0 12px">'+esc(n.body||'')+'</textarea></label>'+btn('Lưu thay đổi','principiaSuiteSaveNoteEdit('+i+')','primary')+btn('Hủy','principiaSuiteNotes()'));
 }
 function saveNoteEdit(i){
  const n=state.notes[i],title=document.getElementById('plsEditNoteTitle')?.value.trim(),body=document.getElementById('plsEditNoteBody')?.value.trim();
  if(!n)return;if(!body){alert('Nội dung ghi chú không được để trống.');return}
  n.title=title||'Ghi chú mới';n.body=body;n.updatedAt=new Date().toISOString();save();notes();
 }
 function deleteNote(i){if(!confirm('Xóa ghi chú này?'))return;state.notes.splice(i,1);save();notes()}
 let formulaCache=[];
 function renderFormulaResults(query){
  const q=String(query||'').trim().toLocaleLowerCase('vi');
  const rows=formulaCache.filter(x=>!q||(x.value+' '+x.lesson).toLocaleLowerCase('vi').includes(q));
  const target=document.getElementById('plsFormulaResults');if(!target)return;
  target.innerHTML=rows.map(x=>'<div style="padding:12px;border-bottom:1px solid var(--line,#444)"><b style="font-size:18px">'+esc(x.value)+'</b><div class="small muted">'+esc(x.lesson)+'</div><button type="button" onclick="principiaSuiteCopyFormula(\''+encodeURIComponent(x.value)+'\')">Sao chép công thức</button></div>').join('')||'<p class="muted">Không tìm thấy công thức phù hợp.</p>';
 }
 function copyFormula(encoded){
  const value=decodeURIComponent(encoded);
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(value).then(()=>alert('Đã sao chép công thức.')).catch(()=>fallbackCopy(value));return}
  fallbackCopy(value);
 }
 function fallbackCopy(value){
  const field=document.createElement('textarea');field.value=value;field.style.position='fixed';field.style.opacity='0';document.body.appendChild(field);field.select();
  try{document.execCommand('copy');alert('Đã sao chép công thức.')}catch(_){alert('Không thể sao chép tự động. Hãy chọn và sao chép công thức thủ công.')}field.remove();
 }
 function formulas(){
  formulaCache=[];const re=/(?:[A-Za-zρΔαβθωμΩεσφ²³₀₁₂₃₄₅₆₇₈₉]+\s*[=≈≤≥]\s*[^\n.;]{1,90})/g;
  allLessons().forEach(l=>{const text=String(l.content||'');let m;while((m=re.exec(text))!==null){const v=m[0].trim();if(v.length>2&&!formulaCache.some(x=>x.value===v))formulaCache.push({value:v,lesson:l.name})}re.lastIndex=0});
  open('Thư viện công thức','<p class="muted">'+formulaCache.length+' biểu thức được nhận diện từ nội dung bài học.</p><label for="plsFormulaSearch">Tìm theo công thức hoặc tên bài học</label><input id="plsFormulaSearch" type="search" placeholder="Ví dụ: F = ma, động năng..." oninput="principiaSuiteFilterFormulas(this.value)" style="display:block;width:100%;padding:11px;margin:8px 0;border:1px solid var(--line,#555);border-radius:10px;background:var(--card,#171a2a);color:inherit"><div id="plsFormulaResults"></div>'+btn('Về trung tâm','principiaSuiteHome()'));
  renderFormulaResults('');
 }
 function flashcards(favoritesOnly){
  flashMode=favoritesOnly?'favorites':'bank';const qs=flashMode==='favorites'?pool().filter(q=>(state.favoriteQuestions||[]).includes(questionKey(q))):pool();if(!qs.length){open('Flashcard','<p>Chưa có câu hỏi để tạo thẻ ôn tập.</p>'+btn('Quay lại','principiaSuiteHome()'));return}
  flashIndex=(flashIndex+qs.length)%qs.length;flashSide=false;renderFlash();
 }
 function renderFlash(){
  const qs=flashMode==='errors'?(state.errors||[]):flashMode==='favorites'?pool().filter(q=>(state.favoriteQuestions||[]).includes(questionKey(q))):flashMode==='mastered'?pool().filter(q=>(state.masteredQuestions||[]).includes(questionKey(q))):pool();
  if(!qs.length){open('Flashcard ôn tập','<p>Chưa có dữ liệu ôn tập.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  const q=qs[flashIndex%qs.length],front=flashMode==='errors'?q.title:q.q;
  const answer=flashMode==='errors'?q.body:'Đáp án: '+q.a[q.correct]+'\\n'+q.a.map((a,i)=>String.fromCharCode(65+i)+'. '+a).join('\\n');const isMastered=flashMode!=='errors'&&(state.masteredQuestions||[]).includes(questionKey(q));
  open(flashMode==='errors'?'Ôn lại lỗi sai':flashMode==='favorites'?'Flashcard yêu thích':flashMode==='mastered'?'Flashcard đã thuộc':'Flashcard ôn tập','<p class="muted">Thẻ '+(flashIndex+1)+' / '+qs.length+'</p>'+ (flashMode==='bank'?btn('Ôn câu yêu thích','principiaSuiteFavoriteFlashcards()'):flashMode==='favorites'?btn('Luyện đề câu yêu thích','principiaSuiteFavoritePractice()'):flashMode==='mastered'?btn('Ôn câu chưa thuộc','principiaSuiteFlashcards()'):'')+(flashMode==='errors'?'':questionMedia(q))+(flashMode==='errors'?'':btn(isMastered?'Bỏ đánh dấu đã thuộc':'Đánh dấu đã thuộc','principiaSuiteToggleMastered()'))+btn('Xáo trộn thẻ','principiaSuiteShuffleFlashcards()')+'<button type="button" onclick="principiaSuiteFlip()" style="width:100%;min-height:230px;padding:25px;border:1px solid var(--line,#444);border-radius:20px;background:var(--card,#171a2a);color:inherit;font-size:20px;white-space:pre-wrap">'+esc(flashSide?answer:front)+'<div class="small muted" style="margin-top:20px">Chạm để '+(flashSide?'xem mặt trước':'lật thẻ')+'</div></button><div style="display:flex;justify-content:space-between;margin-top:12px">'+btn('← Trước','principiaSuiteFlashPrev()')+btn('Lật thẻ','principiaSuiteFlip()','primary')+btn('Tiếp →','principiaSuiteFlashNext()')+'</div>'+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function toggleMastered(){const qs=flashMode==='favorites'?pool().filter(q=>(state.favoriteQuestions||[]).includes(questionKey(q))):flashMode==='mastered'?pool().filter(q=>(state.masteredQuestions||[]).includes(questionKey(q))):pool();const q=qs[flashIndex%Math.max(1,qs.length)];if(!q)return;const list=Array.isArray(state.masteredQuestions)?state.masteredQuestions:[],key=questionKey(q),i=list.indexOf(key);if(i>=0)list.splice(i,1);else list.push(key);state.masteredQuestions=list;save();renderFlash()}
 function masteredFlashcards(){flashMode='mastered';flashIndex=0;flashSide=false;renderFlash()}
 function shuffleFlashcards(){let qs=pool();if(flashMode==='favorites')qs=qs.filter(q=>(state.favoriteQuestions||[]).includes(questionKey(q)));else if(flashMode==='mastered')qs=qs.filter(q=>(state.masteredQuestions||[]).includes(questionKey(q)));else if(flashMode==='errors')qs=state.errors||[];if(qs.length>1){const old=flashIndex;let next=old;while(next===old)next=Math.floor(Math.random()*qs.length);flashIndex=next}else flashIndex=0;flashSide=false;renderFlash()}
 function startFavoritePractice(){const qs=pool().filter(q=>(state.favoriteQuestions||[]).includes(questionKey(q)));if(!qs.length){open('Luyện câu yêu thích','<p>Bạn chưa lưu câu hỏi yêu thích nào.</p>'+btn('Mở ngân hàng câu hỏi','principiaSuiteQuestionBank()'));return}exam={questions:qs.slice().sort(()=>Math.random()-.5).slice(0,Math.min(10,qs.length)),answers:{},end:Date.now()+15*60000,submitted:false};renderExam();startTimer()}
 function reviewErrors(){
  if(!(state.errors||[]).length){open('Ôn lại lỗi sai','<p>Chưa có lỗi sai nào được lưu. Làm bài luyện tập để hệ thống ghi nhận câu trả lời sai.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  flashMode='errors';flashIndex=0;flashSide=false;renderFlash();
 }
 let errorQuery='';
 function renderErrorResults(){
  const host=document.getElementById('plsErrorResults'),count=document.getElementById('plsErrorCount');if(!host||!count)return;
  const term=errorQuery.toLocaleLowerCase('vi'),all=state.errors||[],matched=all.map((x,i)=>({x,i})).filter(({x})=>!term||[x.title,x.body].join(' ').toLocaleLowerCase('vi').includes(term));
  count.textContent=matched.length+'/'+all.length+' lỗi sai';
  host.innerHTML=matched.map(({x,i})=>panel(esc(x.title),'<p style="white-space:pre-wrap">'+esc(x.body)+'</p><small class="muted">'+new Date(x.date).toLocaleString('vi-VN')+'</small>'+btn('Đã khắc phục · xóa','principiaSuiteDeleteError('+i+')','secondary'))).join('')||'<p class="muted">Chưa có lỗi sai phù hợp.</p>';
 }
 function errors(query){
  if(query!==undefined){errorQuery=String(query).slice(0,120);renderErrorResults();return}
  open('Sổ lỗi sai','<label>Câu hỏi / chủ đề<input id="plsErrorTitle" style="display:block;width:100%;padding:10px;margin:6px 0"></label><label>Vì sao sai và cách sửa<textarea id="plsErrorBody" rows="4" style="display:block;width:100%;padding:10px;margin:6px 0"></textarea></label>'+btn('Lưu lỗi sai','principiaSuiteAddError()','primary')+'<label for="plsErrorSearch">Tìm lỗi sai</label><input id="plsErrorSearch" type="search" value="'+esc(errorQuery)+'" oninput="principiaSuiteFilterErrors(this.value)" placeholder="Tìm câu hỏi hoặc cách sửa..." style="display:block;width:100%;padding:10px;margin:7px 0"><p id="plsErrorCount" class="small muted"></p>'+btn('Xuất CSV lỗi sai','principiaSuiteExportErrors()')+'<div id="plsErrorResults"></div>'+btn('Về trung tâm','principiaSuiteHome()'));
  renderErrorResults();
 }
 function exportErrors(){const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';const rows=(state.errors||[]).map(x=>[x.date,x.title,x.body]);downloadText('\uFEFF'+[['Thời điểm','Câu hỏi','Ghi chú sửa lỗi'],...rows].map(r=>r.map(q).join(',')).join('\r\n'),'principia-error-log.csv','text/csv;charset=utf-8')}
 function addError(){const title=document.getElementById('plsErrorTitle').value.trim(),body=document.getElementById('plsErrorBody').value.trim();if(!title||!body){alert('Hãy nhập câu hỏi và cách sửa.');return}state.errors.unshift({title:title,body:body,date:new Date().toISOString()});save();errors()}
 function deleteError(i){if(!confirm('Xóa mục lỗi sai này?'))return;state.errors.splice(i,1);save();errors()}
 function progression(){
  const api=window.PrincipiaProgressionCore;
  if(!api){open('Tiến trình học tập','<p>Module tiến trình chưa tải được. Hãy tải lại trang.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  const attempts=state.attempts||[],questions=attempts.reduce((s,x)=>s+(Number(x.total)||0),0),best=attempts.reduce((m,x)=>Math.max(m,Number(x.percent)||0),0);
  let lessonsDone=0;try{lessonsDone=typeof completed!=='undefined'?completed.length:0}catch(_){}
  let experiments=0,levels=0;try{experiments=JSON.parse(localStorage.getItem('principia_research_notebook_v1')||'[]').length}catch(_){}try{levels=JSON.parse(localStorage.getItem('principia_user_levels_v1')||'[]').length}catch(_){}
  const st=api.streak(state.studyDays||[],new Date()),lv=api.level(currentXP());
  const achievements=api.achievements({sessions:attempts.length,questions,bestPercent:best,lessons:lessonsDone,streak:st.current,experiments,levels});
  const cards=achievements.map(a=>'<div class="panel" style="padding:12px;opacity:'+(a.unlocked?'1':'.72')+'"><div style="display:flex;justify-content:space-between;gap:8px"><b>'+esc(a.name)+'</b><b>'+(a.unlocked?'🏅':'🔒')+'</b></div><p class="small muted">'+esc(a.description)+'</p><div style="height:7px;border-radius:10px;background:var(--line,#444);overflow:hidden"><div style="height:100%;width:'+a.percent+'%;background:var(--purple,#9b87ff)"></div></div><small class="muted">'+Math.min(a.value,a.target)+'/'+a.target+' · '+a.percent+'%</small></div>').join('');
  open('Cấp độ & chuỗi ngày','<div class="panel" style="padding:16px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap"><div><small class="muted">CẤP ĐỘ '+lv.level+'</small><h2 style="margin:4px 0">'+esc(lv.title)+'</h2><b>'+lv.xp+' XP</b></div><div style="text-align:right"><div style="font-size:28px">🔥 '+st.current+'</div><small class="muted">ngày liên tiếp</small><p class="small muted">Kỷ lục: '+st.longest+' ngày</p></div></div><div style="height:9px;border-radius:12px;background:var(--line,#444);overflow:hidden;margin:12px 0 6px"><div style="height:100%;width:'+lv.progress+'%;background:var(--purple,#9b87ff)"></div></div><small class="muted">'+(lv.nextThreshold===null?'Đã đạt cấp tối đa':lv.xpToNext+' XP nữa để lên cấp '+(lv.level+1))+'</small><p class="small muted">'+(st.activeToday?'Hôm nay đã ghi nhận hoạt động học tập.':'Hoàn thành một hoạt động học tập để giữ chuỗi ngày.')+'</p></div><h3>Thành tựu ('+achievements.filter(a=>a.unlocked).length+'/'+achievements.length+')</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:9px">'+cards+'</div>'+btn('Mở bộ sưu tập huy hiệu','principiaSuiteBadges()')+btn('Về trung tâm','principiaSuiteHome()'));
 }
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


 function renderMystery(message){
  if(!mysteryCase)return;
  if(mysteryCase.complete){
   const total=mysteryCase.questions.length,score=mysteryCase.score,percent=Math.round(score/total*100);markStudyDay();
   state.attempts.push({date:new Date().toISOString(),score,total,percent,mode:'mystery'});
   mysteryCase.questions.forEach((q,i)=>{const a=mysteryCase.answers[i];if(!a.correct)state.errors.unshift({title:q.q,body:'Điều tra sai. Đáp án đúng: '+q.a[q.correct]+'\\nChủ đề: '+q.topic+'\\nNguồn: '+q.path,date:new Date().toISOString()})});
   if(state.errors.length>300)state.errors=state.errors.slice(0,300);
   if(state.attempts.length>300)state.attempts=state.attempts.slice(-300);
   save();
   try{if(typeof xp!=='undefined'&&typeof saveAll==='function'){xp+=score===total?20:5;saveAll()}}catch(_){}
   open('Hồ sơ vụ án đã khép lại','<div style="text-align:center;padding:18px"><div style="font-size:42px">🔎</div><h2>'+score+'/'+total+' manh mối chính xác</h2><p>'+percent+'% · '+(score===total?'Điều tra xuất sắc!':'Đã lưu kết quả và các câu cần ôn lại.')+'</p></div>'+btn('Vụ án mới','principiaSuiteStartMystery()','primary')+btn('Về trung tâm','principiaSuiteHome()'));
   mysteryCase=null;return;
  }
  const q=mysteryCase.questions[mysteryCase.index];
  const progress=mysteryCase.index+1;
  open('Giải mã bí ẩn · Manh mối '+progress+'/'+mysteryCase.questions.length,
   panel('Hồ sơ điều tra',
    (message?'<p role="status" style="padding:9px;border-radius:9px;background:var(--bg)">'+esc(message)+'</p>':'')+
    '<p class="small muted">Mỗi manh mối là một câu hỏi lấy từ ngân hàng bài học/Quiz thật.</p><b>'+esc(q.topic)+'</b><p style="font-size:18px">'+esc(q.q)+'</p>'+
    questionMedia(q)+'<div style="display:grid;gap:8px">'+q.a.map((a,i)=>'<button type="button" onclick="principiaSuiteMysteryAnswer('+i+')" style="text-align:left;padding:12px;border:1px solid var(--line,#555);border-radius:12px;background:var(--card,#171a2a);color:inherit">'+String.fromCharCode(65+i)+'. '+esc(a)+'</button>').join('')+'</div>'
   )+'<p class="small muted">Đã giải mã '+mysteryCase.score+' manh mối chính xác.</p>'+btn('Bỏ vụ án','principiaSuiteHome()'));
 }
 function startMystery(){
  const api=window.PrincipiaMysteryCore;
  if(!api){open('Giải mã bí ẩn','<p>Chế độ điều tra chưa tải được. Hãy tải lại trang.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  try{mysteryCase=api.createCase(pool());renderMystery()}catch(error){open('Chưa thể mở vụ án','<p>'+esc(error.message)+'</p>'+btn('Về trung tâm','principiaSuiteHome()'))}
 }
 function answerMystery(choice){
  if(!mysteryCase)return;
  try{
   const result=window.PrincipiaMysteryCore.answer(mysteryCase,choice);
   if(result.complete){renderMystery();return}
   const q=mysteryCase.questions[result.index-1];
   renderMystery((result.correct?'Đúng!':'Chưa chính xác.')+' Đáp án: '+q.a[q.correct]);
  }catch(error){alert(error.message)}
 }
 function backupTool(){
  const api=window.PrincipiaProgressBackup;
  if(!api){open('Sao lưu tiến độ','<p>Chức năng sao lưu chưa tải được. Hãy tải lại trang.</p>'+btn('Về trung tâm','principiaSuiteHome()'));return}
  open('Sao lưu tiến độ','<p>Sao lưu ghi chú, lịch sử luyện tập, lỗi sai, lịch ôn và tiến độ Science Arcade trên thiết bị này.</p><p class="small muted">Không bao gồm mật khẩu, token đăng nhập hoặc dữ liệu xác thực. Tệp sao lưu được lưu trên thiết bị của bạn.</p>'+btn('⬇ Xuất tệp sao lưu','principiaSuiteExportBackup()','primary')+btn('⬆ Khôi phục từ tệp','principiaSuiteImportBackup()')+btn('Về trung tâm','principiaSuiteHome()'));
 }
 function exportBackup(){
  try{
   const api=window.PrincipiaProgressBackup,json=api.create(localStorage);
   const blob=new Blob([json],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');
   a.href=url;a.download='principia-progress-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();
   setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(error){alert(error.message||'Không thể tạo tệp sao lưu.')}
 }
 function importBackup(){
  const input=document.createElement('input');input.type='file';input.accept='application/json,.json';
  input.addEventListener('change',async()=>{
   const file=input.files&&input.files[0];if(!file)return;
   if(file.size>window.PrincipiaProgressBackup.MAX_BYTES){alert('Tệp sao lưu vượt quá giới hạn 2 MB.');return;}
   try{
    const payload=JSON.parse(await file.text()),check=window.PrincipiaProgressBackup.validate(payload);
    if(!check.ok)throw new Error(check.error);
    if(!confirm('Khôi phục '+check.keys.length+' nhóm dữ liệu PRINCIPIA? Dữ liệu học tập và game hiện tại trên thiết bị sẽ được thay thế.'))return;
    window.PrincipiaProgressBackup.restore(localStorage,payload);
    alert('Đã khôi phục dữ liệu. Trang sẽ tải lại để cập nhật giao diện.');
    location.reload();
   }catch(error){alert(error.message||'Tệp sao lưu không hợp lệ.')}
  },{once:true});input.click();
 }

 let focusInterval=null,focusRemaining=0,focusDuration=25,focusStartedAt=0,focusElapsedBefore=0,focusQuery='';
 const focusSessions=()=>Array.isArray(state.focusSessions)?state.focusSessions:[];
 const focusFormat=seconds=>{const n=Math.max(0,Math.floor(seconds));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
 const focusElapsed=()=>focusElapsedBefore+(focusStartedAt?Math.max(0,Math.floor((Date.now()-focusStartedAt)/1000)):0);
 function focusTotals(){
  const rows=focusSessions(),today=localDateKey(),now=new Date(),weekStart=new Date(now);weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-6);
  const todaySeconds=rows.filter(x=>x.date===today).reduce((s,x)=>s+x.seconds,0);
  const weekSeconds=rows.filter(x=>new Date(x.timestamp)>=weekStart).reduce((s,x)=>s+x.seconds,0);
  const days=new Set(rows.filter(x=>x.seconds>=60).map(x=>x.date));let streak=0,d=new Date();
  while(days.has(localDateKey(d))){streak++;d.setDate(d.getDate()-1)}
  return {todaySeconds,weekSeconds,streak};
 }
 function focusPlanner(){
  const totals=focusTotals(),goal=Math.max(5,Math.min(600,Number(state.focusGoalMinutes)||30)),pct=Math.min(100,Math.round(totals.todaySeconds/(goal*60)*100));
  const active=!!focusInterval,remaining=active?Math.max(0,focusRemaining-Math.floor((Date.now()-focusStartedAt)/1000)):focusRemaining;
  open('Góc tập trung PRINCIPIA',panel('Phiên tập trung',
   '<p class="muted small">Chọn thời lượng, bắt đầu và tạm dừng bất cứ lúc nào. Bộ đếm tiếp tục chạy khi bạn đóng bảng này.</p>'+
   '<div style="display:flex;gap:8px;flex-wrap:wrap">'+[15,25,45,60].map(n=>'<button type="button" onclick="principiaSuiteFocusPreset('+n+')" '+(focusDuration===n?'aria-pressed="true"':'')+'>'+n+' phút</button>').join('')+'</div>'+
   '<label class="small" for="plsFocusCustom">Thời lượng tùy chỉnh (5–120 phút)</label><div style="display:flex;gap:8px"><input id="plsFocusCustom" type="number" min="5" max="120" value="'+focusDuration+'" style="width:120px;padding:9px"><button type="button" onclick="principiaSuiteFocusCustom()">Áp dụng</button></div>'+
   '<div id="plsFocusClock" role="timer" aria-live="off" style="font-size:clamp(42px,10vw,68px);font-weight:800;text-align:center;padding:18px 0;font-variant-numeric:tabular-nums">'+focusFormat(remaining||focusDuration*60)+'</div>'+
   '<p id="plsFocusStatus" class="small muted" style="text-align:center">'+(active?'Đang tập trung':focusStartedAt||focusElapsedBefore?'Đã tạm dừng':'Sẵn sàng bắt đầu')+'</p>'+
   '<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap">'+(active?'<button type="button" onclick="principiaSuiteFocusPause()">Tạm dừng</button>':'<button type="button" class="primary" onclick="principiaSuiteFocusStart()">▶ Bắt đầu / tiếp tục</button>')+'<button type="button" onclick="principiaSuiteFocusStop()">Kết thúc phiên</button></div>')+
   panel('Mục tiêu hôm nay',
    '<label for="plsFocusGoal" class="small">Mục tiêu tập trung mỗi ngày (phút)</label><div style="display:flex;gap:8px"><input id="plsFocusGoal" type="number" min="5" max="600" value="'+goal+'" style="width:120px;padding:9px"><button type="button" onclick="principiaSuiteFocusGoal()">Lưu mục tiêu</button></div>'+
    '<p><b>'+Math.floor(totals.todaySeconds/60)+' / '+goal+' phút</b> · '+pct+'%</p><div style="height:9px;border-radius:10px;background:var(--line,#444);overflow:hidden"><div style="height:100%;width:'+pct+'%;background:var(--purple,#9b87ff)"></div></div>'+
    '<p class="small muted">7 ngày: '+Math.floor(totals.weekSeconds/60)+' phút · Chuỗi ngày tập trung: '+totals.streak+'</p>')+
   panel('Lịch sử phiên tập trung','<p id="plsFocusHistoryCount" class="small muted"></p><input type="search" maxlength="100" placeholder="Tìm theo ngày..." value="'+esc(focusQuery)+'" oninput="principiaSuiteFocusSearch(this.value)" style="width:100%;box-sizing:border-box;padding:10px;margin:6px 0"><div id="plsFocusHistoryRows"></div>'+btn('Xuất lịch sử CSV','principiaSuiteFocusExport()'))+
   btn('Về trung tâm','principiaSuiteHome()'));
  renderFocusHistory();
  if(active)updateFocusClock();
 }
 function updateFocusClock(){
  const node=document.getElementById('plsFocusClock');if(!node||!focusInterval)return;
  const remaining=Math.max(0,focusRemaining-Math.floor((Date.now()-focusStartedAt)/1000));node.textContent=focusFormat(remaining);
 }
 function focusPreset(minutes){if(focusInterval)return;if(focusElapsedBefore>0&&!confirm('Bỏ thời gian đã tập trung trong phiên tạm dừng để đổi thời lượng?'))return;focusDuration=Math.max(5,Math.min(120,Number(minutes)||25));focusRemaining=focusDuration*60;focusElapsedBefore=0;focusStartedAt=0;focusPlanner()}
 function focusCustom(){const el=document.getElementById('plsFocusCustom'),n=Number(el&&el.value);if(!Number.isInteger(n)||n<5||n>120){alert('Thời lượng phải từ 5 đến 120 phút.');return}focusPreset(n)}
 function focusStart(){
  if(focusInterval)return;
  if(!focusRemaining)focusRemaining=focusDuration*60;
  focusStartedAt=Date.now();
  focusInterval=setInterval(()=>{
   const remaining=Math.max(0,focusRemaining-Math.floor((Date.now()-focusStartedAt)/1000));
   updateFocusClock();
   if(remaining<=0)focusFinish();
  },500);
  focusPlanner();
 }
 function focusPause(){
  if(!focusInterval)return;
  focusRemaining=Math.max(0,focusRemaining-Math.floor((Date.now()-focusStartedAt)/1000));
  focusElapsedBefore+=Math.floor((Date.now()-focusStartedAt)/1000);
  clearInterval(focusInterval);focusInterval=null;focusStartedAt=0;focusPlanner();
 }
 function focusSaveSession(seconds,completed){
  const mins=Math.max(0,Math.floor(seconds));if(mins<60)return;
  const now=new Date();state.focusSessions=focusSessions();state.focusSessions.unshift({timestamp:now.toISOString(),date:localDateKey(now),seconds:mins,plannedMinutes:focusDuration,completed:!!completed});
  state.focusSessions=state.focusSessions.slice(0,500);markStudyDay();save();
 }
 function focusReset(){clearInterval(focusInterval);focusInterval=null;focusRemaining=0;focusStartedAt=0;focusElapsedBefore=0}
 function focusFinish(){
  const elapsed=focusElapsed();focusSaveSession(elapsed,true);focusReset();focusPlanner();
  if('Notification'in window&&Notification.permission==='granted')try{new Notification('PRINCIPIA · Hoàn thành phiên tập trung',{body:'Bạn đã tập trung '+Math.floor(elapsed/60)+' phút. Nghỉ ngắn nhé!'})}catch(_){}
 }
 function focusStop(){
  if(!focusInterval&&!focusElapsedBefore&&!focusRemaining)return;
  const elapsed=focusElapsed();
  if(elapsed>=60&&!confirm('Lưu phiên tập trung '+Math.floor(elapsed/60)+' phút và kết thúc?'))return;
  if(elapsed>=60)focusSaveSession(elapsed,false);
  focusReset();focusPlanner();
 }
 function focusGoal(){
  const el=document.getElementById('plsFocusGoal'),n=Number(el&&el.value);if(!Number.isInteger(n)||n<5||n>600){alert('Mục tiêu phải từ 5 đến 600 phút.');return}
  state.focusGoalMinutes=n;save();focusPlanner();
 }
 function renderFocusHistory(){
  const host=document.getElementById('plsFocusHistoryRows'),count=document.getElementById('plsFocusHistoryCount');if(!host||!count)return;
  const all=focusSessions(),rows=all.filter(x=>!focusQuery||String(x.date||'').includes(focusQuery));
  count.textContent=rows.length+'/'+all.length+' phiên đã lưu';
  host.innerHTML=rows.slice(0,50).map(x=>'<div style="display:flex;justify-content:space-between;gap:8px;padding:8px 0;border-bottom:1px solid var(--line,#444)"><span>'+esc(x.date)+' · '+(x.completed?'Hoàn thành':'Kết thúc sớm')+'</span><b>'+Math.floor(x.seconds/60)+' phút</b></div>').join('')||'<p class="muted">Chưa có phiên tập trung phù hợp.</p>';
 }
 function focusSearch(value){focusQuery=String(value||'').slice(0,100);renderFocusHistory()}
 function focusExport(){
  const quote=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const rows=focusSessions().map(x=>[x.date,x.timestamp,Math.floor(x.seconds/60),x.plannedMinutes,x.completed?'Hoàn thành':'Kết thúc sớm']);
  downloadText('\uFEFF'+[['Ngày','Thời điểm','Phút thực tế','Phút dự kiến','Trạng thái'],...rows].map(r=>r.map(quote).join(',')).join('\r\n'),'principia-focus-sessions.csv','text/csv;charset=utf-8');
 }

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
      const score=qs.reduce((sum,q,i)=>sum+(ans[i]===q.correct?1:0),0);markStudyDay();
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
 window.principiaSuiteHome=home;window.principiaSuiteQuestionBank=questionBank;window.principiaSuiteQuestionSearch=renderQuestionBankResults;window.principiaSuiteQuestionTopic=setQuestionTopic;window.principiaSuiteQuestionFavorites=toggleQuestionFavorites;window.principiaSuiteToggleQuestionFavorite=toggleQuestionFavorite;window.principiaSuiteQuestionExport=exportQuestionBank;window.principiaSuiteOpenGames=()=>{close();if(typeof setPage==='function')setPage('entertainment')};window.principiaSuiteExamSetup=examSetup;window.principiaSuiteDaily=dailyChallenge;window.principiaSuiteDailyAnswer=dailyAnswer;window.principiaSuiteDailyHistory=dailyHistory;window.principiaSuiteStartExam=startExam;window.principiaSuiteChoose=choose;window.principiaSuiteSubmitExam=submitExam;window.principiaSuiteExitExam=exitExam;window.principiaSuiteExamView=examViewFilter;window.principiaSuiteJumpQuestion=jumpExamQuestion;window.principiaSuiteToggleExamMark=toggleExamMark;window.principiaSuiteExamPrev=examPrevious;window.principiaSuiteExamNext=examNext;window.principiaSuiteClearAnswer=clearExamAnswer;window.principiaSuiteResumeExam=resumeExamDraft;window.principiaSuiteDiscardExamDraft=discardExamDraft;window.principiaSuiteExamResultFilter=examResultFilter;window.principiaSuiteRetryMistakes=retryExamMistakes;window.principiaSuiteAttemptHistory=attemptHistory;window.principiaSuiteAttemptSearch=setAttemptQuery;window.principiaSuiteAttemptMode=setAttemptMode;window.principiaSuiteExportAttempts=exportAttempts;window.principiaSuiteDailyHistorySearch=setDailyHistoryQuery;window.principiaSuiteDailyHistoryFilter=setDailyHistoryFilter;window.principiaSuiteExportDailyHistory=exportDailyHistory;window.principiaSuiteMasteredFlashcards=masteredFlashcards;window.principiaSuiteToggleMastered=toggleMastered;window.principiaSuiteShuffleFlashcards=shuffleFlashcards;window.principiaSuiteAnalytics=analytics;window.principiaSuiteAnalyticsRange=setAnalyticsRange;window.principiaSuiteExportAnalytics=exportAnalytics;window.principiaSuiteFilterErrors=errors;window.principiaSuiteExportErrors=exportErrors;window.principiaSuiteExportNotes=exportNotes;window.principiaSuiteNoteCount=noteCount;window.principiaSuiteFavoriteFlashcards=()=>flashcards(true);window.principiaSuiteFavoritePractice=startFavoritePractice;window.principiaSuiteQuests=quests;window.principiaSuiteSeason=seasonMissions;window.principiaSuiteClaimSeason=claimSeason;window.principiaSuiteClaimQuest=claimQuest;window.principiaSuiteNotes=notes;window.principiaSuiteFilterNotes=renderNotes;window.principiaSuiteAddNote=addNote;window.principiaSuiteEditNote=editNote;window.principiaSuiteSaveNoteEdit=saveNoteEdit;window.principiaSuiteDeleteNote=deleteNote;window.principiaSuiteFormulas=formulas;window.principiaSuiteFilterFormulas=renderFormulaResults;window.principiaSuiteCopyFormula=copyFormula;window.principiaSuiteFlashcards=flashcards;window.principiaSuiteReviewErrors=reviewErrors;window.principiaSuiteSpacedReview=spacedReview;window.principiaSuiteStartReview=startReview;window.principiaSuiteFlipReview=()=>{reviewSide=true;reviewCard()};window.principiaSuiteRateReview=rateReview;window.principiaSuiteSkipReview=skipReview;window.principiaSuiteFlip=()=>{flashSide=!flashSide;renderFlash()};window.principiaSuiteFlashPrev=()=>{flashIndex=Math.max(0,flashIndex-1);renderFlash()};window.principiaSuiteFlashNext=()=>{flashIndex++;renderFlash()};window.principiaSuiteErrors=errors;window.principiaSuiteAddError=addError;window.principiaSuiteDeleteError=deleteError;window.principiaSuiteBadges=badges;window.principiaSuiteProgression=progression;window.principiaSuiteNotifications=notifications;window.principiaSuiteEnableNotifications=enableNotifications;window.principiaSuiteDisableNotifications=()=>{state.notifications=false;save();notifications()};window.principiaSuiteAI=ai;window.principiaSuiteResearch=()=>{close();if(window.principiaResearchNotebook)window.principiaResearchNotebook.open()};window.principiaSuiteLevels=()=>{close();if(window.principiaLevelStudio)window.principiaLevelStudio.open()};window.principiaSuiteStartMystery=startMystery;window.principiaSuiteMysteryAnswer=answerMystery;window.principiaSuiteBackup=backupTool;window.principiaSuiteExportBackup=exportBackup;window.principiaSuiteImportBackup=importBackup;window.principiaSuiteOpenChat=openChat;window.principiaSuiteCopyAI=copyAI;window.principiaSuiteFocus=focusPlanner;window.principiaSuiteFocusPreset=focusPreset;window.principiaSuiteFocusCustom=focusCustom;window.principiaSuiteFocusStart=focusStart;window.principiaSuiteFocusPause=focusPause;window.principiaSuiteFocusStop=focusStop;window.principiaSuiteFocusGoal=focusGoal;window.principiaSuiteFocusSearch=focusSearch;window.principiaSuiteFocusExport=focusExport;
 document.addEventListener('keydown',handleExamKeys);
 patchExistingQuizHistory();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install,{once:true});else install();
})();
