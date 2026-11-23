
const $=s=>document.querySelector(s);
const clone=x=>JSON.parse(JSON.stringify(x));
const uid=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const seed=[
{id:'phy',name:'Vật lý',icon:'⚛️',type:'tab',children:[
{id:'mech',name:'Cơ học',icon:'⚙️',type:'tab',children:[
{id:'mech1',name:'Cơ học 1',icon:'📘',type:'tab',children:[
{id:'l1',name:'Chuyển động cơ học',icon:'🚀',type:'lesson',content:'CHUYỂN ĐỘNG CƠ HỌC\n\n1. Khái niệm\nChuyển động cơ học là sự thay đổi vị trí của vật theo thời gian so với vật được chọn làm mốc.\n\n2. Chất điểm\nMột vật được coi là chất điểm khi kích thước của nó rất nhỏ so với phạm vi chuyển động.\n\n3. Hệ quy chiếu\nGồm vật làm mốc, hệ tọa độ gắn với vật làm mốc và đồng hồ đo thời gian.\n\n4. Vận tốc\nVận tốc trung bình: v = Δx/Δt.',quiz:[{q:'Chuyển động cơ học là sự thay đổi gì?',a:['Khối lượng','Vị trí theo thời gian','Nhiệt độ','Hình dạng'],correct:1}]},
{id:'l2',name:'Chuyển động thẳng đều',icon:'📈',type:'lesson',content:'CHUYỂN ĐỘNG THẲNG ĐỀU\n\nLà chuyển động có quỹ đạo đường thẳng và vận tốc không đổi.\n\nPhương trình: x = x₀ + vt.\n\nTrong đó x₀ là tọa độ ban đầu, v là vận tốc, t là thời gian.',quiz:[{q:'Đồ thị tọa độ - thời gian là?',a:['Đường thẳng','Đường tròn','Parabol','Đường gấp khúc'],correct:0}]}
]},
{id:'mech2',name:'Cơ học 2',icon:'📗',type:'tab',children:[
{id:'l3',name:'Định luật Newton',icon:'🧲',type:'lesson',content:'ĐỊNH LUẬT NEWTON\n\nĐịnh luật I: Nếu hợp lực bằng 0, vật đứng yên hoặc chuyển động thẳng đều.\n\nĐịnh luật II: F = ma.\n\nĐịnh luật III: Khi vật A tác dụng lên B một lực, B tác dụng lại A một lực cùng độ lớn, ngược chiều.'}
]},
{id:'mech3',name:'Cơ học 3',icon:'📙',type:'tab',children:[
{id:'l4',name:'Động lượng',icon:'🎯',type:'lesson',content:'ĐỘNG LƯỢNG\n\nĐộng lượng của vật: p = mv.\n\nĐộng lượng là đại lượng vectơ, cùng hướng với vận tốc.\n\nĐịnh luật bảo toàn động lượng: tổng động lượng của hệ cô lập được bảo toàn.'}
]}
]},
{id:'electric',name:'Điện học',icon:'⚡',type:'tab',children:[
{id:'electric1',name:'Điện học 1',icon:'🔌',type:'tab',children:[
{id:'l5',name:'Dòng điện không đổi',icon:'🔋',type:'lesson',content:'DÒNG ĐIỆN KHÔNG ĐỔI\n\nDòng điện là dòng chuyển dời có hướng của các hạt mang điện.\n\nCường độ dòng điện: I = q/t.\n\nĐơn vị: ampe (A).',quiz:[{q:'Đơn vị cường độ dòng điện?',a:['Vôn','Ampe','Ôm','Jun'],correct:1}]}
]},
{id:'electric2',name:'Điện học 2',icon:'🔋',type:'tab',children:[
{id:'l6',name:'Định luật Ohm',icon:'💡',type:'lesson',content:'ĐỊNH LUẬT OHM\n\nI = U/R.\n\nCường độ dòng điện qua dây dẫn tỉ lệ thuận với hiệu điện thế giữa hai đầu dây và tỉ lệ nghịch với điện trở.'}
]}
]},
{id:'fluid',name:'Chất lưu',icon:'🌊',type:'tab',children:[
{id:'fluid1',name:'Chất lưu 1',icon:'💧',type:'tab',children:[
{id:'l7',name:'Áp suất chất lỏng',icon:'🫧',type:'lesson',content:'ÁP SUẤT CHẤT LỎNG\n\nÁp suất: p = F/S.\n\nÁp suất do cột chất lỏng gây ra: p = ρgh.\n\nTrong đó ρ là khối lượng riêng, g là gia tốc trọng trường và h là độ sâu.'}
]}
]}
]},
{id:'math',name:'Toán học',icon:'📐',type:'tab',children:[
{id:'algebra',name:'Đại số',icon:'➗',type:'tab',children:[
{id:'equation',name:'Phương trình',icon:'🧮',type:'tab',children:[
{id:'m1',name:'Phương trình bậc hai',icon:'✏️',type:'lesson',content:'PHƯƠNG TRÌNH BẬC HAI\n\nax² + bx + c = 0 (a ≠ 0).\n\nΔ = b² - 4ac.\n\nΔ > 0: hai nghiệm phân biệt.\nΔ = 0: nghiệm kép.\nΔ < 0: vô nghiệm trong tập số thực.',quiz:[{q:'Biệt thức Δ bằng?',a:['b² - 4ac','b² + 4ac','a² - 4bc','4ac'],correct:0}]}
]}
]}
]},
{id:'chem',name:'Hóa học',icon:'🧪',type:'tab',children:[
{id:'chem1',name:'Hóa học cơ sở',icon:'⚗️',type:'tab',children:[
{id:'atom',name:'Nguyên tử',icon:'🔬',type:'lesson',content:'NGUYÊN TỬ\n\nNguyên tử gồm hạt nhân và lớp vỏ electron.\n\nHạt nhân gồm proton mang điện dương và neutron không mang điện. Electron mang điện âm.'}
]}
]},
{id:'english',name:'Tiếng Anh',icon:'🌐',type:'tab',children:[
{id:'grammar',name:'Grammar',icon:'📖',type:'tab',children:[
{id:'present',name:'Present Simple',icon:'📝',type:'lesson',content:'PRESENT SIMPLE\n\nDiễn tả thói quen, sự thật hiển nhiên và lịch trình.\n\nKhẳng định: S + V(s/es).\nPhủ định: S + do/does + not + V.\nNghi vấn: Do/Does + S + V?'}
]}
]}
];
const seedQuiz=[
{id:'qphy',name:'Vật lý',icon:'⚛️',type:'tab',children:[
{id:'qmech',name:'Cơ học',icon:'⚙️',type:'tab',children:[
{id:'qtest1',name:'Kiểm tra cơ học',icon:'📝',type:'quiz',questions:[
{q:'Công thức định luật II Newton?',a:['F=ma','p=mv','U=IR','A=Fs'],correct:0},
{q:'Đơn vị động lượng?',a:['N','kg.m/s','J','W'],correct:1}
]}
]},
{id:'qelec',name:'Điện học',icon:'⚡',type:'tab',children:[
{id:'qtest2',name:'Kiểm tra điện học',icon:'📝',type:'quiz',questions:[
{q:'Định luật Ohm có biểu thức?',a:['I=U/R','F=ma','p=ρgh','v=s/t'],correct:0}
]}
]}
]},
{id:'qmath',name:'Toán học',icon:'📐',type:'tab',children:[
{id:'qalg',name:'Đại số',icon:'➗',type:'tab',children:[
{id:'qtest3',name:'Phương trình bậc hai',icon:'📝',type:'quiz',questions:[
{q:'Δ của ax²+bx+c=0 là?',a:['b²-4ac','a²-4bc','b²+4ac','4ac'],correct:0}
]}
]}
]}
];
const seedFun=[
{id:'funlogic',name:'Tư duy logic',icon:'🧠',type:'tab',children:[
{id:'fun1',name:'Câu đố logic 1',icon:'🧩',type:'fun',questions:[
{q:'Có 3 quả táo, bạn lấy đi 2 quả. Bạn có mấy quả?',a:['1','2','3','5'],correct:1},
{q:'Số tiếp theo: 2, 4, 8, 16, ...?',a:['18','24','32','30'],correct:2}
]},
{id:'fun2',name:'Câu đố logic 2',icon:'💡',type:'fun',questions:[
{q:'Một tuần có bao nhiêu ngày?',a:['5','6','7','8'],correct:2}
]}
]},
{id:'funphysics',name:'Đố vui khoa học',icon:'🔭',type:'tab',children:[
{id:'fun3',name:'Khoa học vui 1',icon:'🌌',type:'fun',questions:[
{q:'Ánh sáng truyền nhanh nhất trong môi trường nào?',a:['Nước','Không khí','Chân không','Thủy tinh'],correct:2}
]}
]}
];
let data=load('halo_data',seed),quizData=load('halo_quiz',seedQuiz),funData=load('halo_fun',seedFun);
const defaultEntertainmentData=()=>{
 const legacy=gamePlatforms(),chess=legacy.filter(x=>x.kind==='chess'),other=legacy.filter(x=>x.kind!=='chess');
 const groups=[];
 if(chess.length)groups.push({id:'games-chess',name:'Cờ vua',icon:'♟️',type:'tab',children:chess.map(x=>({id:x.id,name:x.name,icon:x.icon||'♟️',type:'game',url:x.url}))});
 if(other.length)groups.push({id:'games-other',name:'Trò chơi & tư duy',icon:'🧩',type:'tab',children:other.map(x=>({id:x.id,name:x.name,icon:x.icon||'🎮',type:'game',url:x.url}))});
 return groups.length?groups:[{id:'games-empty',name:'Trò chơi',icon:'🎮',type:'tab',children:[]}];
};
let entertainmentData=load('halo_entertainment',defaultEntertainmentData()),activeEntertainmentGameId=null;
let profile=load('halo_profile',{name:'Learner',avatar:'',theme:'dark'});
let xp=Number(localStorage.getItem('halo_xp')||0);
let streak=Number(localStorage.getItem('halo_streak')||0);
let lastDay=localStorage.getItem('halo_lastday')||'';
let completed=load('halo_completed',[]);
let page='account',stack=[],activeLesson=null,search='',pageHistory=[];
function rememberPage(){pageHistory.push({page,stack:[...stack],activeLesson,activeQuiz:activeQuiz?JSON.parse(JSON.stringify(activeQuiz)):null,answers:[...answers]});if(pageHistory.length>60)pageHistory.shift();}
function goBack(){if(page==='play'&&activeQuiz&&(answers||[]).length>0){if(!confirm('Bài làm chưa hoàn thành. Bạn vẫn muốn quay lại?'))return;}const prev=pageHistory.pop();if(!prev){if(page!=='home'){page='home';stack=[];activeLesson=null;activeQuiz=null;render();}return;}page=prev.page;stack=prev.stack;activeLesson=prev.activeLesson;activeQuiz=prev.activeQuiz;answers=prev.answers;render();}
window.getPrincipiaPage=()=>page;window.setPrincipiaPage=p=>{page=p;};
let activeQuiz=null,answers=[],dragId=null;

function load(k,def){
 try{
  const raw=localStorage.getItem(k);
  if(raw!==null){const value=JSON.parse(raw);try{window.PrincipiaData?.write('legacy/'+k,value)}catch(_){}return value??clone(def);}
  const migrated=window.PrincipiaData?.read('legacy/'+k,undefined);
  return migrated===undefined?clone(def):migrated;
 }catch{return clone(def)}
}
function saveAll(){
 const snapshot={halo_data:data,halo_quiz:quizData,halo_fun:funData,halo_entertainment:entertainmentData,halo_profile:profile,halo_completed:completed,halo_xp:xp,halo_streak:streak};
 Object.entries(snapshot).forEach(([key,value])=>{
  try{localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value));}catch(error){console.error('[PRINCIPIA] legacy save failed',key,error);}
  try{window.PrincipiaData?.write('legacy/'+key,value);}catch(error){console.error('[PRINCIPIA] core repository mirror failed',key,error);}
 });
 if(window.syncPrincipiaLeaderboard)window.syncPrincipiaLeaderboard();
}
function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function tree(){return page==='quiz'?quizData:page==='fun'?funData:page==='entertainment'?entertainmentData:data}
function find(id,nodes){for(const n of nodes){if(n.id===id)return n;if(n.children){let x=find(id,n.children);if(x)return x}}return null}
function parentOf(id,nodes,parent=null){for(const n of nodes){if(n.id===id)return parent;if(n.children){let x=parentOf(id,n.children,n);if(x)return x}}return null}
function locate(id,nodes){for(const n of nodes){if(n.id===id)return nodes;if(n.children){let x=locate(id,n.children);if(x)return x}}return null}
function remove(id,nodes){let i=nodes.findIndex(n=>n.id===id);if(i>=0){nodes.splice(i,1);return true}for(const n of nodes)if(n.children&&remove(id,n.children))return true;return false}
function chain(id,nodes,arr=[]){for(const n of nodes){if(n.id===id)return [...arr,n];if(n.children){let x=chain(id,n.children,[...arr,n]);if(x)return x}}return []}
function lessons(nodes=data){return nodes.flatMap(n=>n.type==='lesson'?[n]:n.children?lessons(n.children):[])}
function count(n){return n.type==='lesson'||n.type==='quiz'||n.type==='fun'||n.type==='game'?1:(n.children||[]).reduce((s,x)=>s+count(x),0)}
function notify(t){$('#toast').innerHTML=`<div class="toast">${esc(t)}</div>`;setTimeout(()=>$('#toast').innerHTML='',2300)}
function modal(s){$('#modal').innerHTML=`<div class="modalbg" onclick="if(event.target===this)closeModal()"><div class="modal">${s}</div></div>`}
function closeModal(){$('#modal').innerHTML=''}
function setPage(p){if(p!==page||stack.length)rememberPage();if(page==='play'&&activeQuiz&&(answers||[]).length>0){if(!confirm('🧸 Khoan đã! Bài làm của bạn chưa hoàn thành. Nếu thoát bây giờ, tiến trình hiện tại có thể mất. Bạn vẫn muốn rời khỏi bài chứ?')){companionReact('sad','Đừng bỏ cuộc giữa chừng nhé! Bạn làm tiếp được mà 💪');return;}}if(p==='entertainment')p='lab';page=p;stack=[];search='';render();if(p==='home')notify('Đã mở Home');else notify('Đã mở '+({library:'Học tập',quiz:'Quiz',fun:'Đố vui',progress:'Tiến độ',lab:'Phòng thí nghiệm'}[p]||p));/* Không bật bong bóng 'Chào mừng' khi vào Home; màn hình chào và Home được tách riêng. */}
function currentNodes(){let nodes=tree();for(const id of stack){let n=find(id,nodes);nodes=n?.children||[]}return nodes}
function crumb(){let html=`<button onclick="stack=[];render()">Trang chủ</button>`;let nodes=tree();for(let i=0;i<stack.length;i++){let n=find(stack[i],nodes);if(n)html+=` / <button onclick="stack=stack.slice(0,${i+1});render()">${esc(n.name)}</button>`}return html}
function enter(id){rememberPage();stack.push(id);render()}
function openLesson(id){rememberPage();activeLesson=id;dailyReward();page='lesson';stack=[];render()}
function openQuiz(id){rememberPage();activeQuiz={id,kind:'quiz'};answers=[];page='play';render()}
function openFun(id){rememberPage();activeQuiz={id,kind:'fun'};answers=[];page='play';render()}
function avatarHTML(){
 let acc=null;try{acc=JSON.parse(localStorage.getItem('principia_google_account')||'null')}catch(e){}
 let crowned=false;try{const st=entertainmentState(),all=[...leagueBots(),{name:profile.name||'Bạn',points:st.points,you:true}].sort((a,b)=>b.points-a.points);crowned=all.findIndex(x=>x.you)===0}catch(e){}
 const crown=crowned?'<span title="Dẫn đầu bảng xếp hạng tuần" style="position:absolute;right:-4px;top:-9px;font-size:17px;filter:drop-shadow(0 1px 2px #000)">👑</span>':'';
 if(acc&&acc.customPicture)return `<button type="button" class="account-avatar-trigger" style="position:relative" onclick="openGoogleAccount()" title="Thông tin tài khoản"><img class="avatar" src="${esc(acc.customPicture)}" alt="Ảnh đại diện">${crown}</button>`;
 return `<button type="button" class="account-avatar-trigger" style="position:relative" onclick="openGoogleAccount()" title="${acc?'Thông tin tài khoản':'Đăng nhập / đăng ký'}"><span class="avatar-default" aria-label="Avatar mặc định">👤</span>${crown}</button>`;
}
function toggleTileTools(id,button){
 const panel=document.getElementById('tile-tools-'+id);
 if(!panel)return;
 const open=panel.hidden;
 document.querySelectorAll('.tile-tool-menu').forEach(el=>{el.hidden=true;});
 document.querySelectorAll('.tile-edit-trigger').forEach(el=>el.setAttribute('aria-expanded','false'));
 panel.hidden=!open;
 button.setAttribute('aria-expanded',String(open));
}
function card(n){
 let action=n.type==='lesson'?`openInnerLessonWorkspace('${n.id}')`:n.type==='quiz'?`openQuiz('${n.id}')`:n.type==='fun'?`openFun('${n.id}')`:n.type==='game'?`openEntertainmentGame('${n.id}')`:page==='home'?`page='library';stack=['${n.id}'];render();notify('Đã mở ${n.name}')`:`enter('${n.id}')`;
 let amount=n.type==='lesson'?'Bài học':n.type==='quiz'?'Bài kiểm tra':n.type==='fun'?'Đố vui':n.type==='game'?'Nền tảng':count(n)+' nội dung';
 return `<div class="tile" draggable="true" ondragstart="dragId='${n.id}'" ondragover="event.preventDefault()" ondrop="dropItem(event,'${n.id}')" onclick="${action}">
 <div class="tile-actions" onclick="event.stopPropagation()" style="position:absolute;right:10px;top:10px;z-index:5">
 <button type="button" class="tile-edit-trigger" aria-label="Mở công cụ chỉnh sửa và sắp xếp" aria-expanded="false" title="Chỉnh sửa / Di chuyển" onclick="toggleTileTools('${n.id}',this)">✎</button>
 <div id="tile-tools-${n.id}" class="tile-tool-menu" hidden style="position:absolute;right:0;top:38px;min-width:160px;padding:8px;gap:6px;flex-direction:column;background:var(--panel,#171b2b);border:1px solid var(--line,#34394d);border-radius:12px;box-shadow:0 12px 30px #0006">
 <button type="button" onclick="moveNodeDialog('${n.id}')">↗ Di chuyển vào tab</button>
 <button type="button" onclick="shiftNode('${n.id}',-1)">↑ Đưa lên trước</button>
 <button type="button" onclick="shiftNode('${n.id}',1)">↓ Đưa xuống sau</button>
 ${n.type==='tab'||n.type==='lesson'?'<button type="button" onclick="editNode(\''+n.id+'\')">🎨 Tùy chỉnh icon</button>':''}
 <button type="button" onclick="editNode('${n.id}')">✎ Chỉnh sửa</button>
 <button type="button" onclick="deleteNode('${n.id}')">🗑 Xóa</button>
 </div></div>
 ${n.type==='lesson'||n.type==='tab'||n.type==='game'?`<div class="tileicon lesson-tile-icon">${nodeIconHTML(n,'')}</div>`:''}<h3>${esc(n.name)}</h3><p>${n.type==='tab'?'Mở tab để xem các nội dung bên trong':n.type==='lesson'?'Mở bài học':'Bắt đầu hoạt động'}</p><div class="tilefoot"><span>${amount}</span><span>↗</span></div></div>`;
}
function topbar(){return `<div class="top"><div><button type="button" class="principia-back-btn" onclick="goBack()" title="Quay lại màn hình trước" aria-label="Quay lại">← Quay lại</button><div class="principia-top-brand"><img class="principia-top-logo" src="${PRINCIPIA_LOGO_URI}" alt="PRINCIPIA logo"><div><div class="eyebrow">PRO</div><div class="muted small">Your personal learning world</div></div></div><div class="principia-clockbar"><span class="principia-time-pill" title="Giờ hiện tại"><b id="principiaLiveTime">--:--</b></span><button class="principia-time-pill" type="button" onclick="toggleTopbarStudyClock()" title="Bấm để bắt đầu hoặc tạm dừng đồng hồ học"><b id="principiaStopwatch">${fmtClock(principiaClock.seconds)}</b><span id="principiaStopwatchState">${principiaClock.running?'Tạm dừng':'Bắt đầu'}</span></button></div><button type="button" class="principia-music-pill" onclick="principiaMusicOpen()" title="Mở Music & Focus">♫ <span>Music</span></button></div><div class="topright"><button class="pill" type="button" onclick="openGameStats()" title="Xem thành tích và nhiệm vụ">🔥 ${streak} ngày học</button><button class="pill" type="button" onclick="openRewardCollection()" title="Mở kho vật phẩm đã nhận">⚡ ${xp} XP</button>${avatarHTML()}</div></div>`}
let principiaClock={mode:'stopwatch',seconds:0,left:1500,running:false,interval:null};
function updatePrincipiaClockBar(){const t=document.getElementById('principiaLiveTime');if(t)t.textContent=new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit',hour12:false});const sw=document.getElementById('principiaStopwatch');if(sw)sw.textContent=fmtClock(principiaClock.seconds);const st=document.getElementById('principiaStopwatchState');if(st)st.textContent=principiaClock.running?'Ⅱ':'▶';}
function startPrincipiaLiveClock(){if(window.__principiaWallClock)return;updatePrincipiaClockBar();window.__principiaWallClock=setInterval(updatePrincipiaClockBar,60000);}
function toggleTopbarStudyClock(){if(principiaClock.mode!=='stopwatch'){if(principiaClock.interval)clearInterval(principiaClock.interval);principiaClock.mode='stopwatch';principiaClock.seconds=0;principiaClock.running=false;}toggleStudyClock();updatePrincipiaClockBar();}
function fmtClock(n){n=Math.max(0,Math.floor(n));return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')}
function openGameStats(){
 const level=Math.floor(xp/100)+1,into=xp%100,need=100-into;
 const todayDone=lastDay===new Date().toLocaleDateString('en-CA');
 modal(`<div class="eyebrow">PLAYER PROFILE · PRINCIPIA</div><h2>🏆 Thành tích & kinh nghiệm</h2><div class="stats"><div class="stat"><span class="small muted">Cấp độ</span><strong>Lv. ${level}</strong><span class="small muted">Còn ${need} XP lên cấp</span></div><div class="stat"><span class="small muted">Kinh nghiệm</span><strong>⭐ ${xp} XP</strong><div class="xpbar"><div style="width:${into}%"></div></div></div><div class="stat"><span class="small muted">Chuỗi ngày</span><strong>🔥 ${streak} ngày</strong><span class="small muted">${todayDone?'Đã ghi nhận hoạt động hôm nay':'Học hôm nay để duy trì streak'}</span></div></div><div class="panel"><h3>🎯 Nhiệm vụ học tập</h3><p>📚 Hoàn thành bài học: <b>${completed.length}</b></p><p>⭐ Mốc tiếp theo: <b>${need} XP</b> để lên cấp ${level+1}</p><p>🔥 Streak được cập nhật khi bạn hoàn thành hoạt động học tập đầu tiên trong ngày.</p></div><div class="modalactions"><button class="primary" onclick="closeModal();setPage('progress')">Xem tiến độ</button><button class="secondary" onclick="closeModal()">Đóng</button></div>`);
}
function openStudyClock(){renderStudyClock();}
function renderStudyClock(){
 modal(`<div class="eyebrow">FOCUS MODE · STUDY SESSION</div><h2>⏱ Đồng hồ học tập</h2><div class="toolbar"><button class="secondary" onclick="setClockMode('countdown')">Đếm ngược</button><button class="secondary" onclick="setClockMode('stopwatch')">Bấm giờ</button></div><div style="text-align:center;padding:22px 8px"><div id="studyClockDisplay" style="font-size:clamp(48px,12vw,72px);font-weight:850;letter-spacing:2px;font-variant-numeric:tabular-nums">${fmtClock(principiaClock.mode==='countdown'?principiaClock.left:principiaClock.seconds)}</div><p id="studyClockHint" class="muted small">${principiaClock.mode==='countdown'?'Phiên tập trung 25 phút':'Bấm giờ học tập'}</p></div><div class="toolbar" style="justify-content:center"><button class="primary" id="studyClockStart" onclick="toggleStudyClock()">▶ Bắt đầu</button><button class="secondary" onclick="resetStudyClock()">↺ Đặt lại</button></div><div class="toolbar"><button class="secondary" onclick="setClockPreset(15)">15 phút</button><button class="secondary" onclick="setClockPreset(25)">25 phút</button><button class="secondary" onclick="setClockPreset(45)">45 phút</button><button class="secondary" onclick="setClockPreset(60)">60 phút</button></div><p class="muted small">Hoàn thành một phiên đếm ngược sẽ nhận 10 XP. Đồng hồ bấm giờ dùng để theo dõi thời gian tự do.</p>`);
}
function setClockMode(mode){if(principiaClock.interval)clearInterval(principiaClock.interval);principiaClock.running=false;principiaClock.mode=mode;principiaClock.seconds=0;principiaClock.left=mode==='countdown'?1500:0;renderStudyClock()}
function setClockPreset(min){if(principiaClock.interval)clearInterval(principiaClock.interval);principiaClock.running=false;principiaClock.mode='countdown';principiaClock.left=min*60;principiaClock.seconds=min*60;renderStudyClock()}
function toggleStudyClock(){
 if(principiaClock.running){clearInterval(principiaClock.interval);principiaClock.running=false;const b=document.getElementById('studyClockStart');if(b)b.textContent='▶ Tiếp tục';updatePrincipiaClockBar();return}
 if(principiaClock.mode==='countdown'&&principiaClock.left<=0)principiaClock.left=1500;
 principiaClock.running=true;const b=document.getElementById('studyClockStart');if(b)b.textContent='Ⅱ Tạm dừng';updatePrincipiaClockBar();
 principiaClock.interval=setInterval(()=>{
  if(principiaClock.mode==='countdown'){principiaClock.left=Math.max(0,principiaClock.left-1)}else principiaClock.seconds++;
  const d=document.getElementById('studyClockDisplay');if(d)d.textContent=fmtClock(principiaClock.mode==='countdown'?principiaClock.left:principiaClock.seconds);updatePrincipiaClockBar();
  if(principiaClock.mode==='countdown'&&principiaClock.left===0){clearInterval(principiaClock.interval);principiaClock.running=false;xp+=10;dailyReward();saveAll();showXpToast('+10 XP · Hoàn thành phiên tập trung');const h=document.getElementById('studyClockHint');if(h)h.textContent='🎉 Hoàn thành phiên học! Bạn nhận được 10 XP.';const b=document.getElementById('studyClockStart');if(b)b.textContent='▶ Bắt đầu phiên mới';updatePrincipiaClockBar();}
 },1000);
}
function resetStudyClock(){if(principiaClock.interval)clearInterval(principiaClock.interval);principiaClock.running=false;principiaClock.left=principiaClock.mode==='countdown'?principiaClock.seconds:0;const d=document.getElementById('studyClockDisplay');if(d)d.textContent=fmtClock(principiaClock.mode==='countdown'?principiaClock.left:0);const b=document.getElementById('studyClockStart');if(b)b.textContent='▶ Bắt đầu';const h=document.getElementById('studyClockHint');if(h)h.textContent=principiaClock.mode==='countdown'?'Sẵn sàng tập trung':'Bấm giờ học tập'}
function principiaRandomPoseMarkup(size=76){
 const n=Math.floor(Math.random()*34),cell=Math.max(48,Math.min(520,Number(size)||76));
 const col=n%5,row=Math.floor(n/5),xp=col*25,yp=row*(100/6);
 return `<span class="principia-bundled-pose" role="img" aria-label="Nhân vật PRINCIPIA · tư thế ${n+1}" style="display:block;width:${cell}px;height:${cell}px;background-image:url('/assets/images/principia-poses-34.png');background-size:500% 700%;background-position:${xp}% ${yp}%;background-repeat:no-repeat"></span>`;
}
window.principiaRandomPoseMarkup=principiaRandomPoseMarkup;
function home(){
 const companionHtml=principiaWelcomeCharacterMarkup();
 return `<div class="hero"><div class="eyebrow">WELCOME BACK</div><h1>Học tập theo cách<br>của riêng bạn.</h1><p>Khám phá kiến thức, chinh phục từng bài học và xây dựng chuỗi ngày học tập của bạn.</p><div class="toolbar" style="margin-top:14px"><button class="primary" onclick="setPage('library')">Tiếp tục học</button><button class="secondary" onclick="addChoice()">Tạo bài / tab</button><button class="secondary" onclick="setPage('quiz')">Mở Quiz</button></div></div>

 <div class="stats"><div class="stat"><span class="muted small">Kinh nghiệm</span><strong>${xp} XP</strong><div class="xpbar"><div style="width:${xp%100}%"></div></div></div><div class="stat"><div class="muted small">Chuỗi ngày</div><strong>${streak} ngày</strong><span class="small muted">Giữ streak mỗi ngày</span></div><div class="stat"><div class="muted small">Bài đã học</div><strong>${completed.length}</strong><span class="small muted">Bài hoàn thành</span></div></div>
 <div class="sectionhead"><h2>Môn học của bạn</h2><div class="toolbar"><button class="primary" onclick="addChoice()">＋</button><button class="secondary" onclick="setPage('library')">Xem tất cả</button></div></div><div class="grid">${data.map(card).join('')}</div>
 <div class="sectionhead"><h2>Khám phá thêm</h2></div><div class="grid"><div class="tile" onclick="setPage('entertainment')"><h3>Giải trí & tư duy</h3><p>Cờ vua, Sudoku và bảng xếp hạng AI</p></div><div class="tile" onclick="setPage('quiz')"><h3>Quiz</h3><p>Kiểm tra kiến thức theo môn học</p></div><div class="tile" onclick="setPage('fun')"><h3>Đố vui</h3><p>Thử thách tư duy mỗi ngày</p></div></div>`;
}
function library(){
 let items=currentNodes();
 return `<div class="breadcrumb">${crumb()}</div><div class="sectionhead"><div><div class="eyebrow">LEARNING LIBRARY</div><h1>${stack.length?esc(find(stack.at(-1),tree()).name):'Thư viện học tập'}</h1><p class="muted small">Tab trong tab · Tổ chức kiến thức theo cách của bạn</p></div><div class="toolbar"><button class="primary" onclick="addChoice()">＋ Tạo mới</button></div></div>
 <div class="grid">${items.length?items.map(card).join(''):'<div class="empty">Chưa có nội dung. Hãy nhấn + để tạo tab hoặc bài học.</div>'}</div>
 ${stack.length?'':`
 <section class="panel" style="margin-top:20px">
  <div class="sectionhead"><div><div class="eyebrow">PRO LEARNING TOOLS</div><h2>✦ Trung tâm học tập & IDEA</h2><p class="muted small">Mở các công cụ học tập mở rộng đã bổ sung: bản đồ tri thức, kế hoạch, báo cáo, phương pháp học, trợ năng và ngân hàng câu hỏi.</p></div><div class="toolbar"><button class="primary" onclick="principiaSuiteHome()">Mở trung tâm học tập ↗</button></div></div>
  <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:9px">
   <button class="secondary" onclick="principiaSuiteKnowledgeMap()">🗺️ Bản đồ tri thức</button><button class="secondary" onclick="principiaSuiteStudyPlanner()">🗓️ Kế hoạch học tập</button>
   <button class="secondary" onclick="principiaSuiteDailyJourney()">🚀 Hành trình mỗi ngày</button><button class="secondary" onclick="principiaSuiteWeeklyReport()">📊 Báo cáo 7 ngày</button>
   <button class="secondary" onclick="principiaSuiteThinkingProfile()">🧠 Hồ sơ tư duy</button><button class="secondary" onclick="principiaStudyMethods()">💡 100 phương pháp học</button>
   <button class="secondary" onclick="principiaSuiteAccessibility()">♿ Trợ năng</button><button class="secondary" onclick="principiaSuiteQuestionBank()">🔎 Ngân hàng câu hỏi</button>
  </div>
 </section><section class="panel" style="margin-top:20px"><div class="sectionhead"><div><div class="eyebrow">PERSONAL LIBRARY</div><h2>📚 Sách & tài liệu</h2><p class="muted small">Các tệp đã thêm sẽ xuất hiện tại đây.</p></div><div class="toolbar"><button class="secondary" onclick="openLibraryPicker('book')">＋ Thêm sách</button><button class="primary" onclick="openLibraryPicker('file')">＋ Thêm tài liệu</button></div></div><div id="principiaLibraryItems"><p class="muted small">Đang tải danh sách…</p></div></section>`}`;
}
function lesson(){
 let l=find(activeLesson,data);if(!l)return '<div class="empty">Không tìm thấy bài học</div>';
 let c=chain(activeLesson,data);
 return `<div class="breadcrumb"><button onclick="setPage('library')">Thư viện</button>${c.map(n=>` / ${esc(n.name)}`).join('')}</div>
 <div class="sectionhead"><div><div class="eyebrow">LESSON</div><h1>${esc(l.name)}</h1></div><div class="toolbar"><button class="secondary" onclick="editNode('${l.id}')">✎ Sửa</button><button class="primary" onclick="completeLesson('${l.id}')">✓ Hoàn thành</button></div></div>
 <div class="panel lesson-content-panel"><div class="content">${esc(l.content||'Chưa có nội dung. Nhấn Sửa để thêm nội dung bài học.')}</div></div>
 <div class="panel"><div class="sectionhead"><h2>Tài liệu</h2><button class="secondary" onclick="$('#attach').click()">＋ Thêm file</button></div><input type="file" id="attach" multiple class="hidden" onchange="attachFiles('${l.id}',this.files)"><div id="files">Đang tải...</div></div>
 <div class="panel"><div class="sectionhead"><h2>Kiểm tra kiến thức</h2><div class="toolbar"><button class="secondary" onclick="editLessonQuiz('${l.id}')">＋ Câu hỏi</button><button class="secondary" onclick="openConvertToQuiz('${l.id}')">⇄ Chuyển đề thành Quiz</button></div></div><p class="muted small">${(l.quiz||[]).length} câu hỏi</p><div class="toolbar"><button class="primary" onclick="lessonQuiz('${l.id}')">Làm bài kiểm tra</button><button class="secondary" onclick="aiLink('${l.id}')">✨ Kiểm tra AI</button></div></div>`;
}
function openConvertToQuiz(id){
 if(!requireAdmin())return;
 const l=find(id,data);if(!l)return;
 modal(`<h2>⇄ Chuyển đề thành Quiz</h2>
 <p class="muted small">Dán toàn bộ đề và đáp án vào đây. Hệ thống sẽ tách câu hỏi, lựa chọn A/B/C/D và ghép đáp án đúng.</p>
 <label>Đề bài + đáp án</label>
 <textarea id="quizImportText" style="min-height:300px" placeholder="Ví dụ:
Câu 1: Vận tốc là gì?
A. Quãng đường đi được trong một đơn vị thời gian
B. Độ dịch chuyển
C. Khối lượng
D. Lực tác dụng

Câu 2. Đơn vị vận tốc trong SI là gì?
A) m
B) s
C) m/s
D) kg

ĐÁP ÁN: 1A, 2C"></textarea>
 <p class="muted small">Chấp nhận dạng “Câu 1:”, “1.”, lựa chọn A./A) và bảng đáp án như “1A, 2C” hoặc “Câu 1: A”.</p>
 <div class="modalactions"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="convertTextToLessonQuiz('${id}')">Tạo Quiz</button></div>`);
}
function parseImportedQuiz(raw){
 const lines=String(raw||'').replace(/\r/g,'').split('\n').map(x=>x.trim()).filter(Boolean);
 const qs=[],key={};let cur=null,inKey=false;
 const putKey=(txt)=>{for(const m of txt.matchAll(/(?:câu\s*)?(\d+)\s*[:.)-]?\s*([A-D])\b/gi))key[+m[1]]=m[2].toUpperCase();};
 for(const line of lines){
  let m=line.match(/^(?:đáp\s*án(?:\s*đúng)?|dap\s*an|answer\s*key|answers?)\s*[:：-]?\s*(.*)$/i);
  if(m){inKey=true;putKey(m[1]);if(!m[1]&&cur)cur.inlineAnswer=null;continue;}
  if(inKey){const before=Object.keys(key).length;putKey(line);if(Object.keys(key).length>before)continue;}
  m=line.match(/^(?:(?:câu|question|q)\s*)?(\d+)\s*[.)-]\s*(.*)$/i);
  if(!m)m=line.match(/^(?:câu|question|q)\s*(\d+)\s*[:：]\s*(.*)$/i);
  if(m){cur={number:+m[1],q:m[2].trim(),a:['','','',''],inlineAnswer:null};qs.push(cur);inKey=false;continue;}
  m=line.match(/^([A-D])\s*[.)、:：-]\s*(.*)$/i);
  if(m&&cur){cur.a[m[1].toUpperCase().charCodeAt(0)-65]=m[2].trim();continue;}
  m=line.match(/^(?:đáp\s*án(?:\s*đúng)?|dap\s*an|answer)\s*[:：-]\s*([A-D])\b/i);
  if(m&&cur){cur.inlineAnswer=m[1].toUpperCase();inKey=false;continue;}
  if(cur&&!cur.a.some(Boolean))cur.q+=(cur.q?' ':'')+line;
 }
 return qs.filter(q=>q.q&&q.a.filter(Boolean).length>=2).map((q,i)=>{
  const letter=key[q.number]||q.inlineAnswer||'A';
  return {q:q.q,a:q.a,correct:letter.charCodeAt(0)-65};
 }).filter(q=>q.correct>=0&&q.correct<4&&!!q.a[q.correct]);
}
function convertTextToLessonQuiz(id){
 if(!requireAdmin())return;
 const l=find(id,data);if(!l)return;
 const parsed=parseImportedQuiz(document.getElementById('quizImportText')?.value||'');
 if(!parsed.length){notify('Chưa nhận dạng được câu hỏi hoặc đáp án. Kiểm tra định dạng A/B/C/D nhé.');return;}
 if(!confirm(`Đã nhận dạng ${parsed.length} câu. Thay thế bộ câu hỏi hiện tại của bài học?`))return;
 l.quiz=parsed;saveAll();closeModal();render();notify(`Đã chuyển ${parsed.length} câu thành Quiz`);
}
function quizHome(){
 return `<div class="eyebrow">QUIZ CENTER</div><h1>Kiểm tra kiến thức</h1><p class="muted">Chọn môn học, chủ đề rồi mở bài kiểm tra.</p><div class="sectionhead"><h2>Các môn học / chủ đề</h2><button class="primary" onclick="addNode('tab')">＋ Tab mới</button></div><div class="breadcrumb">${crumb()}</div><div class="toolbar" style="margin-bottom:14px"><button class="secondary" onclick="addNode('quiz')">＋ Bài kiểm tra</button></div><div class="grid">${currentNodes().length?currentNodes().map(card).join(''):'<div class="empty">Chưa có tab hoặc bài kiểm tra. Hãy tạo mới bằng nút +.</div>'}</div>`;
}
function funHome(){
 return `<div class="eyebrow">DAILY CHALLENGE</div><h1>Đố vui</h1><p class="muted">Thử thách trí tuệ, giải câu đố và nhận XP.</p><div class="sectionhead"><h2>Chủ đề đố vui</h2><button class="primary" onclick="addNode('tab')">＋ Tab mới</button></div><div class="breadcrumb">${crumb()}</div><div class="toolbar" style="margin-bottom:14px"><button class="secondary" onclick="addNode('fun')">＋ Bài đố vui</button></div><div class="grid">${currentNodes().length?currentNodes().map(card).join(''):'<div class="empty">Chưa có chủ đề. Hãy tạo tab hoặc bài đố vui mới.</div>'}</div>`;
}
function principiaQuestionMedia(item){
 let html='';
 const image=item?.image||item?.imageUrl||item?.diagram;
 if(typeof image==='string'&&image.trim()&&(/^(https:\/\/|\/)/i).test(image.trim())) html+='<figure style="margin:12px 0"><img src="'+esc(image.trim())+'" alt="Hình minh họa câu hỏi" loading="lazy" style="max-width:100%;max-height:360px;width:auto;object-fit:contain;border-radius:12px;border:1px solid var(--line,#444)"></figure>';
 const g=item?.graph;
 if(g&&Array.isArray(g.points)&&g.points.length>=2){
  const pts=g.points.map(p=>Array.isArray(p)&&p.length>=2?[Number(p[0]),Number(p[1])]:null).filter(p=>p&&p.every(Number.isFinite));
  if(pts.length>=2){const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys),W=360,H=220,L=48,R=12,T=14,B=38,dx=xmax-xmin||1,dy=ymax-ymin||1,X=x=>L+(x-xmin)/dx*(W-L-R),Y=y=>T+(ymax-y)/dy*(H-T-B),path=pts.map((p,i)=>(i?'L':'M')+X(p[0]).toFixed(1)+' '+Y(p[1]).toFixed(1)).join(' ');
   html+='<div style="margin:12px 0;padding:8px;border:1px solid var(--line,#444);border-radius:12px;overflow:auto"><svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Đồ thị câu hỏi" style="width:100%;max-width:520px"><line x1="'+L+'" y1="'+T+'" x2="'+L+'" y2="'+(H-B)+'" stroke="currentColor" opacity=".65"/><line x1="'+L+'" y1="'+(H-B)+'" x2="'+(W-R)+'" y2="'+(H-B)+'" stroke="currentColor" opacity=".65"/><path d="'+path+'" fill="none" stroke="#8b7bff" stroke-width="2.5"/>'+pts.map(p=>'<circle cx="'+X(p[0])+'" cy="'+Y(p[1])+'" r="3" fill="#8b7bff"/>').join('')+'<text x="'+(W/2)+'" y="'+(H-8)+'" fill="currentColor" font-size="11" text-anchor="middle">'+esc(g.xLabel||'x')+'</text><text x="18" y="'+(H/2)+'" fill="currentColor" font-size="11" text-anchor="middle" transform="rotate(-90 18 '+(H/2)+')">'+esc(g.yLabel||'y')+'</text></svg></div>';
  }
 }
 return html;
}
function playPage(){
 let q=activeQuiz?.kind==='quiz'?find(activeQuiz.id,quizData):find(activeQuiz.id,funData);
 if(!q)return '<div class="empty">Không tìm thấy bài kiểm tra</div>';
 let questions=q.questions||[];
 if(!questions.length)return `<div class="panel"><h2>${esc(q.name)}</h2><p class="muted">Bài này chưa có câu hỏi.</p><button class="primary" onclick="editNode('${q.id}')">Thêm câu hỏi</button></div>`;
 let i=answers.length;
 if(i>=questions.length){
  let score=questions.reduce((s,x,j)=>s+(answers[j]===x.correct?1:0),0);
  return `<div class="panel"><div class="eyebrow">COMPLETED</div><div class="tileicon">🏆</div><h1>${score}/${questions.length}</h1><h2>${score===questions.length?'Xuất sắc!':'Hoàn thành thử thách!'}</h2><p class="muted">Bạn trả lời đúng ${score} câu.</p><button class="primary" onclick="answers=[];render()">Làm lại</button> <button class="secondary" onclick="setPage('${activeQuiz.kind==='fun'?'fun':'quiz'}')">Quay lại</button></div>`;
 }
 let item=questions[i];
 return `<div class="breadcrumb"><button onclick="setPage('${activeQuiz.kind==='fun'?'fun':'quiz'}')">Quay lại</button> / ${esc(q.name)}</div><div class="panel"><div class="muted small">CÂU ${i+1}/${questions.length}</div><div class="progress"><div style="width:${i/questions.length*100}%"></div></div><h2 style="margin-top:25px">${esc(item.q)}</h2>${principiaQuestionMedia(item)}${item.a.map((a,j)=>`<label class="choice"><input type="radio" name="ans" value="${j}">${esc(a)}</label>`).join('')}<button class="primary" onclick="answerQuestion()">Xác nhận →</button></div>`;
}
function lessonPlayPage(){
 let l=find(activeQuiz?.id,data);
 if(!l)return '<div class="empty">Không tìm thấy bài kiểm tra bài học.</div>';
 const questions=l.quiz||[]; let i=answers.length;
 if(!questions.length)return `<div class="panel"><h2>${esc(l.name)}</h2><p class="muted">Bài học chưa có câu hỏi.</p><button class="secondary" onclick="setPage('lesson')">Quay lại</button></div>`;
 if(i>=questions.length){
  let score=questions.reduce((sum,q,j)=>sum+(answers[j]===q.correct?1:0),0);
  return `<div class="panel"><div class="eyebrow">LESSON QUIZ COMPLETED</div><div class="tileicon">🏆</div><h1>${score}/${questions.length}</h1><p class="muted">Bạn trả lời đúng ${score} câu.</p><button class="primary" onclick="answers=[];render()">Làm lại</button> <button class="secondary" onclick="setPage('lesson')">Quay lại bài học</button></div>`;
 }
 let q=questions[i];
 return `<div class="breadcrumb"><button onclick="setPage('lesson')">← Quay lại bài học</button></div><div class="panel"><div class="muted small">CÂU ${i+1}/${questions.length}</div><div class="progress"><div style="width:${i/questions.length*100}%"></div></div><h2 style="margin-top:25px">${esc(q.q)}</h2>${principiaQuestionMedia(q)}${(q.a||[]).map((a,j)=>`<label class="choice"><input type="radio" name="ans" value="${j}">${esc(a)}</label>`).join('')}<button class="primary" onclick="answerQuestion()">Xác nhận →</button></div>`;
}

function entertainmentWeekKey(d=new Date()){const x=new Date(Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()));const day=x.getUTCDay()||7;x.setUTCDate(x.getUTCDate()+4-day);const year=x.getUTCFullYear();const first=new Date(Date.UTC(year,0,1));return year+'-W'+String(Math.ceil((((x-first)/86400000)+1)/7)).padStart(2,'0')}
function entertainmentState(){const wk=entertainmentWeekKey();let st;try{st=JSON.parse(localStorage.getItem('principia_fun_league')||'null')}catch(e){}if(!st||st.week!==wk){st={week:wk,points:0,matches:0,wins:0};localStorage.setItem('principia_fun_league',JSON.stringify(st));}return st}
function leagueBots(){const names=['NewtonBot','Einstein AI','Gauss.exe','CurieBot','Feynman AI','TeslaMind','NoetherBot'];const st=entertainmentState();let seed=0;for(const c of st.week)seed=(seed*31+c.charCodeAt(0))>>>0;return names.map((name,i)=>{seed=(seed*1664525+1013904223)>>>0;return {name,points:150+seed%650,avatar:['🤖','🧠','🦾','👾','⚙️','🛰️','🔬'][i]}}).sort((a,b)=>b.points-a.points)}
function leagueRank(points){return points>=900?{name:'Đại kiện tướng',icon:'👑'}:points>=600?{name:'Cao thủ',icon:'💎'}:points>=350?{name:'Chiến binh',icon:'🥇'}:points>=150?{name:'Kỳ thủ',icon:'🥈'}:{name:'Tân binh',icon:'🌱'}}
const PRINCIPIA_DEFAULT_NAV=[['home','sparkle','Trang chủ'],['library','books','Học tập'],['quiz','calculator','Quiz'],['fun','puzzle','Đố vui'],['lab','flask','Phòng thí nghiệm'],['progress','trophy','Tiến độ']];
/* PRINCIPIA: icon emoji hiện đại, vẫn ưu tiên ảnh do người dùng tải lên. */
const PRINCIPIA_NAV_IMAGE_STYLE='<style>.nav-image-empty{display:inline-flex;align-items:center;justify-content:center;width:64px;height:64px;border:1px dashed var(--line);border-radius:14px;color:var(--muted);font-size:11px;text-align:center}.nav-custom-icon{width:28px;height:28px;object-fit:cover;border-radius:9px;flex:none}.nav-default-icon{font-size:23px;line-height:1;display:inline-grid;place-items:center;width:28px;height:28px;flex:none}.node-emoji-icon{font-size:42px;line-height:1.2;display:inline-flex;align-items:center;justify-content:center;min-width:1.25em;min-height:1.25em}.icon-choice-grid{grid-template-columns:repeat(6,minmax(0,1fr))}.icon-choice{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:7px 3px}.icon-choice-name{font-size:10px;line-height:1.2}.nav .ni{display:none!important}</style>';
document.head.insertAdjacentHTML('beforeend',PRINCIPIA_NAV_IMAGE_STYLE);
function principiaNavGroups(){try{const g={...{workspace:'PRO',more:'MORE'},...JSON.parse(localStorage.getItem('principia_nav_groups')||'{}')};if(g.workspace==='WORKSPACE')g.workspace='PRO';return g}catch(e){return {workspace:'PRO',more:'MORE'}}}
function principiaNav(){
 let saved;try{saved=JSON.parse(localStorage.getItem('principia_nav_config'))}catch(e){saved=null}
 const nav=Array.isArray(saved)?saved.filter(x=>Array.isArray(x)&&x[0]!=='entertainment'):PRINCIPIA_DEFAULT_NAV.map(x=>[...x]);
 if(!nav.some(x=>x[0]==='lab'))nav.splice(Math.min(4,nav.length),0,['lab','flask','Phòng thí nghiệm']);
 return nav;
}
function savePrincipiaNav(v){localStorage.setItem('principia_nav_config',JSON.stringify(v))}
function nodeIconImage(id){try{return localStorage.getItem('principia_node_icon_'+id)||''}catch(e){return ''}}
function setNodeIconImage(id,input){const f=input.files&&input.files[0];if(!f)return;if(!(f.type.startsWith('image/')||/\\.(svg|ico)$/i.test(f.name))){notify('Chọn ảnh hoặc tệp icon SVG/ICO nhé');return}if(f.size>2*1024*1024){notify('Tệp icon tối đa 2 MB');return}const rd=new FileReader();rd.onload=()=>{try{localStorage.setItem('principia_node_icon_'+id,rd.result);const p=document.getElementById('nodeIconPreview');if(p)p.innerHTML='<img src="'+rd.result+'" alt="Icon xem trước" style="width:58px;height:58px;object-fit:cover;border-radius:14px">';notify('Đã lưu icon cho mục này')}catch(e){notify('Không lưu được icon. Hãy dùng ảnh nhỏ hơn')}};rd.readAsDataURL(f)}
function removeNodeIconImage(id){localStorage.removeItem('principia_node_icon_'+id);const n=find(id,tree()),p=document.getElementById('nodeIconPreview');if(p){p.textContent=principiaEmojiIcon(n?.icon||'book');p.style.fontSize='34px'}}
function principiaLegacyNodeIcon(n){const t=String(n?.title||n?.name||n?.type||'').toLowerCase();if(/toán|math|tính|calculat|đại số/.test(t))return 'calculator';if(/thí nghiệm|experiment|lab|hóa|chem/.test(t))return 'flask';if(/vũ trụ|thiên hà|galaxy|hành tinh|planet|space/.test(t))return 'galaxy';if(/điện|từ tính|nam châm|magnet/.test(t))return 'magnet';if(/năng lượng|động lực|lực|physics|vật lý/.test(t))return 'bolt';if(/khoa học|science|nghiên cứu/.test(t))return 'microscope';if(/bài tập|quiz|kiểm tra|câu hỏi/.test(t))return 'target';if(/thành tích|xếp hạng|trophy/.test(t))return 'trophy';if(/trò chơi|giải trí|game/.test(t))return 'game';return 'book'}
const PRINCIPIA_EMOJI_ICONS={home:'🏠',book:'📘',rocket:'🚀',ruler:'📏',magnet:'🧲',bolt:'⚡',microscope:'🔬',flask:'🧪',galaxy:'🌌',planet:'🪐',chart:'📊',target:'🎯',bulb:'💡',calculator:'🧮',pencil:'✏️',note:'📝',books:'📚',trophy:'🏆',palette:'🎨',game:'🎮',puzzle:'🧩',star:'⭐',sparkle:'💫',heart:'💗',gift:'🎁'};
function principiaEmojiIcon(key){return PRINCIPIA_EMOJI_ICONS[key]||'💭'}
function nodeIconHTML(n,extra=''){const img=nodeIconImage(n.id);if(img)return '<img class="node-custom-icon '+extra+'" src="'+img+'" alt="" loading="lazy">';const key=PRINCIPIA_EMOJI_ICONS[n.icon]?n.icon:principiaLegacyNodeIcon(n);return '<span class="node-emoji-icon '+extra+'" role="img" aria-label="Biểu tượng">'+principiaEmojiIcon(key)+'</span>'}
function selectNodeIcon(value){const input=document.getElementById('eicon');if(input)input.value=value;const preview=document.getElementById('nodeIconPreview');if(preview){preview.textContent=principiaEmojiIcon(value);preview.style.fontSize='34px'}document.querySelectorAll('.icon-choice').forEach(b=>b.classList.toggle('selected',b.dataset.icon===value))}
const PRINCIPIA_ICON_CHOICES=[['book','Bài học','📘'],['rocket','Khởi động','🚀'],['ruler','Toán học','📏'],['magnet','Từ tính','🧲'],['bolt','Năng lượng','⚡'],['microscope','Khoa học','🔬'],['flask','Thí nghiệm','🧪'],['galaxy','Vũ trụ','🌌'],['planet','Hành tinh','🪐'],['chart','Biểu đồ','📊'],['target','Mục tiêu','🎯'],['bulb','Ý tưởng','💡'],['calculator','Tính toán','🧮'],['pencil','Viết','✏️'],['note','Ghi chú','📝'],['books','Thư viện','📚'],['trophy','Thành tích','🏆'],['palette','Nghệ thuật','🎨'],['game','Trò chơi','🎮'],['puzzle','Câu đố','🧩'],['star','Ngôi sao','⭐'],['sparkle','Lấp lánh','💫'],['heart','Yêu thích','💗'],['gift','Dễ thương','🎁']];
const PRINCIPIA_ICON_SVG={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-6v-7h-4v7H4a1 1 0 0 1-1-1z"/>',book:'<path d="M12 6 5 3v15l7 3 7-3V3z"/><path d="M12 6v15M5 3l7 3 7-3"/>',rocket:'<path d="M5 15c-2 0-3 2-3 4 2 0 4-1 4-3"/><path d="M8 13 5 10l4-5c3-3 7-3 10-3 0 3 0 7-3 10l-5 4-3-3z"/><circle cx="14" cy="8" r="2"/><path d="m8 16-1 4 4-2"/>',ruler:'<path d="m4 18 14-14 3 3L7 21z"/><path d="m14 8 2 2m-5 1 2 2m-5 1 2 2"/>',magnet:'<path d="M6 4v8a6 6 0 0 0 12 0V4h-4v8a2 2 0 0 1-4 0V4z"/><path d="M6 8h4m4 0h4"/>',bolt:'<path d="m13 2-9 12h7l-1 8 10-13h-7z"/>',microscope:'<path d="m8 3 5 5-3 3-5-5zM11 11l5 5m-8-1a7 7 0 0 0 12 3M4 21h17M15 4l3-2 3 3-2 3"/>',flask:'<path d="M9 3h6m-5 0v7l-5 8a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-8V3"/><path d="M7 16h10"/>',galaxy:'<ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(-30 12 12)"/><ellipse cx="12" cy="12" rx="10" ry="4" transform="rotate(55 12 12)"/><circle cx="12" cy="12" r="2"/>',planet:'<circle cx="12" cy="12" r="6"/><ellipse cx="12" cy="12" rx="11" ry="3.5" transform="rotate(-20 12 12)"/>',chart:'<path d="M4 20V4m0 16h17"/><path d="m7 15 4-4 3 2 6-7"/><path d="M17 6h3v3"/>',target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',bulb:'<path d="M9 18h6m-5 3h4m-5-6a7 7 0 1 1 6 0c-.7.5-1 1.2-1 2h-4c0-.8-.3-1.5-1-2z"/>',calculator:'<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M8 6h8v4H8zm0 8h2m4 0h2m-8 4h2m4 0h2"/>',pencil:'<path d="m4 16-1 5 5-1L20 8l-4-4z"/><path d="m13 7 4 4"/>',note:'<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7m-7 4h7"/>',books:'<path d="M4 4h5v16H4zM10 3h5v17h-5zM16 6h4v14h-4z"/><path d="M5 7h3m4-1h3m5 3h1"/>',trophy:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4m-4 0v6m-4 3h8m-7-3h6"/>',palette:'<path d="M12 3a9 9 0 1 0 0 18h1a2 2 0 0 0 1-4c-1-1 0-3 2-3h1a4 4 0 0 0 4-4c0-4-4-7-9-7z"/><circle cx="7.5" cy="11" r="1"/><circle cx="10" cy="7" r="1"/><circle cx="15" cy="7.5" r="1"/>',game:'<path d="M7 8h10a5 5 0 0 1 4 8l-2 3-5-4h-4l-5 4-2-3a5 5 0 0 1 4-8z"/><path d="M8 11v4m-2-2h4m6-1h.01M18 14h.01"/>',puzzle:'<path d="M4 4h6a2 2 0 1 1 4 0h6v6a2 2 0 1 0 0 4v6h-6a2 2 0 1 1-4 0H4v-6a2 2 0 1 0 0-4z"/>',star:'<path d="m12 2 3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1z"/>',sparkle:'<path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7zM19 16l1 3 3 1-3 1-1 2-1-2-3-1 3-1z"/>',heart:'<path d="M20.8 8.8c0 5-8.8 11-8.8 11s-8.8-6-8.8-11A4.8 4.8 0 0 1 12 6a4.8 4.8 0 0 1 8.8 2.8z"/>',gift:'<path d="M3 10h18v11H3zM2 6h20v4H2zM12 6v15"/><path d="M12 6H7a2 2 0 1 1 2-2c0 2 3 2 3 2zm0 0h5a2 2 0 1 0-2-2c0 2-3 2-3 2z"/>'};
PRINCIPIA_ICON_SVG.chibi_purple='<circle cx="12" cy="12" r="11" fill="#e9ddff" stroke="none"/><path d="M4 12Q2 1 12 2Q22 1 20 13L18 19H6Z" fill="#65458e"/><ellipse cx="12" cy="12" rx="7" ry="8" fill="#ffe1d7" stroke="none"/><path d="M5 10Q5 2 12 3Q19 2 19 10Q14 6 12 7Q8 6 5 10Z" fill="#65458e" stroke="none"/><ellipse cx="9" cy="12" rx="1.4" ry="2" fill="#60428b" stroke="none"/><ellipse cx="15" cy="12" rx="1.4" ry="2" fill="#60428b" stroke="none"/><path d="M10 16q2 2 4 0" fill="none" stroke="#c56d83"/>';
PRINCIPIA_ICON_SVG.chibi_pink=PRINCIPIA_ICON_SVG.chibi_purple.replaceAll('#65458e','#b84f83').replaceAll('#e9ddff','#ffe0ef');
PRINCIPIA_ICON_SVG.chibi_blue=PRINCIPIA_ICON_SVG.chibi_purple.replaceAll('#65458e','#3d709e').replaceAll('#e9ddff','#d9f0ff');
PRINCIPIA_ICON_SVG.chibi_brown=PRINCIPIA_ICON_SVG.chibi_purple.replaceAll('#65458e','#815333').replaceAll('#e9ddff','#f4dfbf');
PRINCIPIA_ICON_SVG.meme_laugh='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">😂</text>';
PRINCIPIA_ICON_SVG.meme_cry='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">😭</text>';
PRINCIPIA_ICON_SVG.meme_shock='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">🤯</text>';
PRINCIPIA_ICON_SVG.meme_dead='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">💀</text>';
PRINCIPIA_ICON_SVG.meme_clown='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">🤡</text>';
PRINCIPIA_ICON_SVG.meme_nerd='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">🤓</text>';
PRINCIPIA_ICON_SVG.meme_melt='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">🫠</text>';
PRINCIPIA_ICON_SVG.meme_cool='<text x="12" y="18" text-anchor="middle" font-size="19" stroke="none">😎</text>';
function principiaIconImage(key){const art=PRINCIPIA_ICON_SVG[key]||PRINCIPIA_ICON_SVG.star;return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#7048d8" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="1" width="22" height="22" rx="6" fill="#f1ecff" stroke="#d9ccff"/>'+art+'</svg>')}
function nodeIconEditorHTML(n){const img=nodeIconImage(n.id),selected=PRINCIPIA_EMOJI_ICONS[n.icon]?n.icon:principiaLegacyNodeIcon(n);return '<label style="display:block;margin:12px 0 7px;font-weight:800">Chọn emoji làm icon</label><p class="small muted" style="margin:0 0 8px">Chọn emoji sinh động hoặc tải ảnh/file icon riêng.</p><div class="icon-choice-grid">'+PRINCIPIA_ICON_CHOICES.map(([v,label,emoji])=>'<button type="button" title="'+label+'" aria-label="Chọn icon '+label+'" data-icon="'+v+'" class="icon-choice '+(v===selected?'selected':'')+'" onclick="selectNodeIcon(\''+v+'\')"><span style="font-size:25px;line-height:1.3">'+emoji+'</span><span class="icon-choice-name">'+label+'</span></button>').join('')+'</div><div class="file" style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-top:10px"><div id="nodeIconPreview" data-node-id="'+n.id+'" style="width:68px;height:68px;flex:0 0 68px;display:grid;place-items:center;border-radius:16px;background:var(--card2);border:1px solid var(--line);font-size:34px">'+(img?'<img src="'+img+'" alt="Icon hiện tại" style="width:60px;height:60px;object-fit:cover;border-radius:13px">':principiaEmojiIcon(selected))+'</div><div style="display:grid;gap:5px"><label class="secondary" style="cursor:pointer;text-align:center">＋ Lấy ảnh / file icon<input type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml,.ico" hidden onchange="setNodeIconImage(\''+n.id+'\',this)"></label><span class="small muted">PNG, JPG, WEBP, GIF, SVG hoặc ICO · tối đa 2 MB</span></div>'+(img?'<button type="button" class="secondary" onclick="removeNodeIconImage(\''+n.id+'\')">Bỏ ảnh, dùng emoji</button>':'')+'</div>'}
function selectNodeIcon(value){const input=document.getElementById('eicon');if(input)input.value=value;const preview=document.getElementById('nodeIconPreview');if(preview){const nodeId=preview.dataset.nodeId;if(nodeId){try{localStorage.removeItem('principia_node_icon_'+nodeId)}catch(e){}}preview.innerHTML='<img src="'+principiaIconImage(value)+'" alt="Icon xem trước" style="width:58px;height:58px;object-fit:contain">';}document.querySelectorAll('.icon-choice').forEach(b=>b.classList.toggle('selected',b.dataset.icon===value))}
function previewNodeIconText(value){const p=document.getElementById('nodeIconPreview');if(p){p.textContent=value||'💫';p.style.fontSize='34px'}document.querySelectorAll('.icon-choice').forEach(b=>b.classList.remove('selected'))}
function navGroupImage(kind){try{return localStorage.getItem('principia_nav_group_image_'+kind)||''}catch(e){return ''}}
function navItemImage(id){try{return localStorage.getItem('principia_nav_item_image_'+id)||''}catch(e){return ''}}
function setNavItemImage(id,input){const f=input.files&&input.files[0];if(!f)return;if(!f.type.startsWith('image/')){notify('Vui lòng chọn tệp ảnh');return}if(f.size>3*1024*1024){notify('Ảnh icon tối đa 3 MB');return}const reader=new FileReader();reader.onload=()=>{const im=new Image();im.onload=()=>{const cv=document.createElement('canvas');cv.width=128;cv.height=128;const s=Math.min(128/im.width,128/im.height),w=im.width*s,h=im.height*s;cv.getContext('2d').drawImage(im,(128-w)/2,(128-h)/2,w,h);try{localStorage.setItem('principia_nav_item_image_'+id,cv.toDataURL('image/png'));openLayoutSettings();notify('Đã cập nhật ảnh icon')}catch(e){notify('Không lưu được ảnh này')}};im.onerror=()=>notify('Không đọc được ảnh');im.src=reader.result};reader.readAsDataURL(f)}
function removeNavItemImage(id){localStorage.removeItem('principia_nav_item_image_'+id);openLayoutSettings()}
function navGroupLabelHTML(kind){const g=principiaNavGroups();return '<div class="navlabel">'+esc(kind==='workspace'?'PRO':g.more)+'</div>'}
function setNavGroupImage(kind,input){const f=input.files&&input.files[0];if(!f)return;if(!f.type.startsWith('image/')){notify('Vui lòng chọn tệp ảnh');return}const reader=new FileReader();reader.onload=()=>{const im=new Image();im.onload=()=>{const c=document.createElement('canvas'),scale=Math.min(1,320/Math.max(im.width,im.height));c.width=Math.max(1,Math.round(im.width*scale));c.height=Math.max(1,Math.round(im.height*scale));c.getContext('2d').drawImage(im,0,0,c.width,c.height);try{localStorage.setItem('principia_nav_group_image_'+kind,c.toDataURL('image/jpeg',.78));openLayoutSettings();notify('Đã cập nhật ảnh nhóm')}catch(e){notify('Ảnh quá lớn, hãy chọn ảnh nhỏ hơn')}};im.onerror=()=>notify('Không đọc được ảnh này');im.src=reader.result};reader.readAsDataURL(f)}
function removeNavGroupImage(kind){localStorage.removeItem('principia_nav_group_image_'+kind);openLayoutSettings()}
function openLayoutSettings(){const nav=principiaNav(),groups=principiaNavGroups(),wimg=navGroupImage('workspace'),mimg=navGroupImage('more');modal('<h2>Tùy chỉnh thanh điều hướng</h2><p class="muted small">Mỗi mục như Quiz, Đố vui và Giải trí có thể dùng ảnh riêng làm biểu tượng. Ảnh lưu trên thiết bị này.</p><div class="file"><label>Tên nhóm học tập</label><input id="navGroupWorkspace" value="'+esc(groups.workspace)+'"><label>Ảnh nhóm học tập</label><div class="toolbar">'+(wimg?'<img src="'+wimg+'" style="width:48px;height:48px;object-fit:cover;border-radius:12px">':'')+'<label class="secondary" style="cursor:pointer">Chọn ảnh nhóm<input type="file" accept="image/*" hidden onchange="setNavGroupImage(\'workspace\',this)"></label><button class="secondary" onclick="removeNavGroupImage(\'workspace\')">Bỏ ảnh</button></div><label>Tên nhóm cài đặt</label><input id="navGroupMore" value="'+esc(groups.more)+'"><label>Ảnh nhóm cài đặt</label><div class="toolbar">'+(mimg?'<img src="'+mimg+'" style="width:48px;height:48px;object-fit:cover;border-radius:12px">':'')+'<label class="secondary" style="cursor:pointer">Chọn ảnh nhóm<input type="file" accept="image/*" hidden onchange="setNavGroupImage(\'more\',this)"></label><button class="secondary" onclick="removeNavGroupImage(\'more\')">Bỏ ảnh</button></div></div>'+nav.map((x,i)=>{const img=navItemImage(x[0]);return '<div class="file" style="display:grid;grid-template-columns:90px minmax(0,1fr) auto auto;gap:9px;align-items:center"><div>'+(img?'<img src="'+img+'" style="width:64px;height:64px;object-fit:cover;border-radius:14px">':'<span class="nav-image-empty">Chưa có ảnh</span>')+'</div><div><input id="navname'+i+'" value="'+esc(x[2])+'" aria-label="Tên mục điều hướng" style="font-weight:700;margin-bottom:7px"><label>Emoji icon</label><select id="navicon'+i+'" style="max-width:150px">'+PRINCIPIA_ICON_CHOICES.map(([v,label,emoji])=>'<option value="'+v+'" '+((x[1]||'')===v?'selected':'')+'>'+emoji+' '+label+'</option>').join('')+'</select><label class="secondary" style="display:inline-flex;cursor:pointer;margin-top:8px">Chọn ảnh làm biểu tượng<input type="file" accept="image/*,.svg,.ico" hidden onchange="setNavItemImage(\''+x[0]+'\',this)"></label>'+(img?'<button class="secondary" onclick="removeNavItemImage(\''+x[0]+'\')">Bỏ ảnh</button>':'')+'</div><button class="secondary" onclick="moveNavItem('+i+',-1)" '+(i===0?'disabled':'')+'>Lên</button><button class="secondary" onclick="moveNavItem('+i+',1)" '+(i===nav.length-1?'disabled':'')+'>Xuống</button></div>'}).join('')+'<div class="toolbar"><button class="primary" onclick="saveLayoutSettings('+nav.length+')">Lưu thay đổi</button><button class="secondary" onclick="resetLayoutSettings()">Khôi phục</button><button class="secondary" onclick="closeModal()">Đóng</button></div>')}
function moveNavItem(i,d){let a=principiaNav();let j=i+d;if(j<0||j>=a.length)return;[a[i],a[j]]=[a[j],a[i]];savePrincipiaNav(a);openLayoutSettings()}
function saveLayoutSettings(n){if(!confirm('🎨 Bạn chắc chắn muốn áp dụng thay đổi tên nhóm, icon và thứ tự các mục này chứ?'))return;localStorage.setItem('principia_nav_groups',JSON.stringify({workspace:document.getElementById('navGroupWorkspace')?.value.trim()||'WORKSPACE',more:document.getElementById('navGroupMore')?.value.trim()||'MORE'}));let a=principiaNav();a=a.map((x,i)=>[x[0],document.getElementById('navicon'+i)?.value||x[1],document.getElementById('navname'+i)?.value.trim()||x[2]]);a=a.map((x,i)=>[x[0],document.getElementById('navicon'+i)?.value||x[1],x[2]]);savePrincipiaNav(a);closeModal();render();notify('Đã lưu giao diện')}
function resetLayoutSettings(){savePrincipiaNav(PRINCIPIA_DEFAULT_NAV);localStorage.removeItem('principia_nav_groups');localStorage.removeItem('principia_nav_group_image_workspace');localStorage.removeItem('principia_nav_group_image_more');principiaNav().forEach(x=>localStorage.removeItem('principia_nav_item_image_'+x[0]));closeModal();render();notify('Đã khôi phục thanh điều hướng')}
function gamePlatforms(){try{return JSON.parse(localStorage.getItem('principia_game_platforms'))||[{id:'chesscom',name:'Chess.com',icon:'♟️',url:'https://www.chess.com/',kind:'chess'},{id:'lichess',name:'Lichess',icon:'♜',url:'https://lichess.org/',kind:'chess'},{id:'sudoku',name:'Sudoku',icon:'🔢',url:'https://www.sudoku.com/',kind:'web'},{id:'geoguessr',name:'GeoGuessr',icon:'🌍',url:'https://www.geoguessr.com/',kind:'web'}]}catch(e){return []}}
function saveGamePlatforms(a){localStorage.setItem('principia_game_platforms',JSON.stringify(a))}
function addGameTab(){const name=prompt('Tên tab mới (ví dụ: Cờ vua)');if(!name)return;const a=gamePlatforms();const id='custom_'+Date.now();a.push({id,name,icon:'🎮',url:'https://www.chess.com/',kind:'web'});saveGamePlatforms(a);localStorage.setItem('principia_active_game_tab',id);render();}
function addEntertainmentGame(){
 if(!requireAdmin())return;
 modal('<h2>＋ Thêm trò chơi / nền tảng</h2><label>Tên</label><input id="newGameName" class="inp" maxlength="80" placeholder="Ví dụ: Chess.com"><label>Địa chỉ website</label><input id="newGameUrl" class="inp" type="url" maxlength="2048" placeholder="https://example.com"><div class="modalactions"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="saveEntertainmentGame()">Thêm vào tab</button></div>');
}
function saveEntertainmentGame(){
 if(!requireAdmin())return;
 const name=document.getElementById('newGameName')?.value.trim(),raw=document.getElementById('newGameUrl')?.value.trim();
 if(!name||!raw){notify('Hãy nhập tên và địa chỉ website');return}
 let url;try{url=new URL(raw);if(!['http:','https:'].includes(url.protocol))throw new Error('scheme')}catch(_){notify('Địa chỉ website không hợp lệ');return}
 currentNodes().push({id:uid(),name,icon:'🎮',type:'game',url:url.href});saveAll();closeModal();render();notify('Đã thêm trò chơi vào tab');
}
function openEntertainmentGame(id){
 const node=find(id,entertainmentData);if(!node||node.type!=='game')return;
 activeEntertainmentGameId=id;render();
}
async function loadPrincipiaLibraryItems(){
 const host=document.getElementById('principiaLibraryItems');if(!host)return;
 try{
  const d=await db(),all=await new Promise((resolve,reject)=>{const q=d.transaction('files').objectStore('files').getAll();q.onsuccess=()=>resolve(q.result||[]);q.onerror=()=>reject(q.error)});
  const items=all.filter(x=>x.principiaLibrary||x.lesson).sort((a,b)=>(Number(b.created)||0)-(Number(a.created)||0));
  if(!items.length){host.innerHTML='<p class="muted small">Chưa có sách hoặc tài liệu. Dùng nút Thêm sách / Thêm tài liệu để thêm vào đây.</p>';return}
  host.innerHTML='<div style="display:grid;gap:8px">'+items.map(x=>{
   const lessonName=x.lesson?find(x.lesson,data)?.name||'Bài học đã lưu trữ':'';
   const kind=x.libraryKind==='book'?'📚 Sách':'📄 Tài liệu';
   return '<div class="file" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><div style="min-width:0;overflow-wrap:anywhere"><b>'+kind+' · '+esc(x.name)+'</b><div class="small muted">'+(lessonName?'Đính kèm trong: '+esc(lessonName):'Thư viện chung')+' · '+(Number(x.size||x.blob?.size||0)/1048576).toFixed(1)+' MB</div></div><div class="toolbar"><button class="secondary" onclick="openLibraryItem(\''+esc(x.id)+'\')">Mở / đọc</button><button class="secondary" onclick="downloadDoc(\''+esc(x.id)+'\')">Tải</button><button class="danger" onclick="deleteLibraryItem(\''+esc(x.id)+'\')">Xóa</button></div></div>';
  }).join('')+'</div>';
 }catch(error){host.innerHTML='<p class="small" role="status">Không tải được danh sách sách và tài liệu.</p>';console.error('[PRINCIPIA] library listing failed',error)}
}

function addGamePlatform(){modal(`<h2>＋ Thêm nền tảng</h2><label>Tên nền tảng</label><input id="newPlatformName" placeholder="Ví dụ: Chess.com"><label>Địa chỉ website (URL)</label><input id="newPlatformUrl" placeholder="https://example.com"><label>Icon</label><input id="newPlatformIcon" value="🎮" maxlength="8"><p class="small muted">Website chỉ hiển thị được trong khung nếu nhà cung cấp cho phép nhúng iframe. Nếu bị chặn, dùng nút mở trang gốc.</p><button class="primary" onclick="saveNewGamePlatform()">＋ Thêm nền tảng</button> <button class="secondary" onclick="closeModal()">Hủy</button>`)}
function saveNewGamePlatform(){const name=document.getElementById('newPlatformName')?.value.trim(),url=document.getElementById('newPlatformUrl')?.value.trim(),icon=document.getElementById('newPlatformIcon')?.value||'🎮';try{const u=new URL(url);if(!/^https?:$/.test(u.protocol))throw 0; if(!name)throw 0;const a=gamePlatforms(),id='custom_'+Date.now();a.push({id,name,icon,url:u.href,kind:'web'});saveGamePlatforms(a);localStorage.setItem('principia_active_game_tab',id);closeModal();render();companionReact('happy','Đã thêm nền tảng mới! 🎉')}catch(e){companionReact('sad','Tên hoặc địa chỉ website chưa hợp lệ nhé.');notify('Vui lòng nhập tên và URL hợp lệ (https://...)')}}
function chooseGameTab(id){localStorage.setItem('principia_active_game_tab',id);render()}
function editGamePlatform(id){const a=gamePlatforms(),x=a.find(v=>v.id===id);if(!x)return;if(!confirm('✏️ Bạn muốn thay đổi tên, icon hoặc địa chỉ của nền tảng này chứ?'))return;const name=prompt('Đổi tên nền tảng:',x.name);if(name===null)return;const icon=prompt('Đổi icon:',x.icon);if(icon===null)return;const url=prompt('Đổi URL:',x.url);if(url===null)return;try{new URL(url);x.name=name.trim()||x.name;x.icon=icon||x.icon;x.url=url;saveGamePlatforms(a);render()}catch(e){notify('URL không hợp lệ')}}
function deleteGamePlatform(id){if(!confirm('🗑️ Bạn chắc chắn muốn xóa nền tảng này khỏi PRINCIPIA?'))return;saveGamePlatforms(gamePlatforms().filter(x=>x.id!==id));render();companionReact('sad','Một tab vừa được gỡ khỏi khu vực giải trí.');}
function companionReact(mood,msg){
 let cfg={auto:true,events:{hello:true,happy:true,sad:true,wrong:true,wow:true},messages:{}};
 try{cfg={...cfg,...JSON.parse(localStorage.getItem('principia_companion_events')||'{}')};cfg.events={...{hello:true,happy:true,sad:true,wrong:true,wow:true},...(cfg.events||{})};cfg.messages=cfg.messages||{}}catch(e){}
 let sticker='';
 try{const st=JSON.parse(localStorage.getItem('principia_sticker_settings')||'{}');if(st.selected)sticker=st.selected;if(st.enabled===false)return;}catch(e){}
 if(!cfg.auto||cfg.events[mood]===false)return;
 const art=sticker.startsWith('data:')?'<img src="'+sticker+'" alt="Chibi hoặc meme">':sticker;
 const text=(cfg.messages[mood]||'').trim()||msg||'';
 let b=document.getElementById('principiaCompanionBubble');if(b)b.remove();
 if(!text&&!art)return;
 b=document.createElement('div');b.id='principiaCompanionBubble';
 b.innerHTML=(art?'<div class="companion-bubble-art">'+art+'</div>':'')+'<div class="companion-bubble-text"></div>';
 b.querySelector('.companion-bubble-text').textContent=text;
 b.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:10001;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;width:min(300px,78vw);padding:22px;border:1px solid var(--line);border-radius:28px;background:var(--card);color:var(--txt);box-shadow:0 18px 60px #0006;text-align:center;font-size:15px;line-height:1.6;animation:principiaStickerPop .28s cubic-bezier(.2,.9,.25,1.2)';
 document.body.appendChild(b);
 clearTimeout(window.__principiaCompanionTimer);
 window.__principiaCompanionTimer=setTimeout(()=>{b.classList.add('companion-hide');setTimeout(()=>b.remove(),260)},(Number(cfg.duration)||4)*1000);
}
function analyzeChessPosition(){const p=document.getElementById('chessPosition')?.value.trim();if(!p){notify('Hãy dán PGN hoặc FEN của ván cờ trước nhé');companionReact('sad','Mình cần thế cờ hoặc lịch sử nước đi để phân tích nè.');return;}const url='https://lichess.org/analysis/'+encodeURIComponent(p);window.open(url,'_blank','noopener');companionReact('wow','Mở bàn phân tích Lichess để engine đánh giá nước đi. ♟️')}
function labPage(){
 return `<div class="eyebrow">PRO · PHYSICS WORKSPACE</div>
 <h1>Phòng thí nghiệm</h1>
 <p class="muted">Mô phỏng, đo đạc và kiểm chứng các định luật vật lý. Các công cụ kỹ thuật được gom tại một khu vực riêng.</p>
 <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0">
  <div class="panel"><b>⚖️ Cân bằng lực</b><div class="small muted">Hợp lực và cân bằng vectơ</div></div>
  <div class="panel"><b>🪐 Quỹ đạo & phóng vật</b><div class="small muted">Vận tốc quỹ đạo, chu kỳ và ném xiên</div></div>
  <div class="panel"><b>💥 Va chạm 1D / 2D</b><div class="small muted">Động lượng và động năng</div></div>
  <div class="panel"><b>📈 Phân tích số liệu</b><div class="small muted">Hồi quy, R² và RMSE</div></div>
  <div class="panel"><b>🤖 Robotics</b><div class="small muted">Động học cánh tay robot 2 khớp</div></div>
  <div class="panel"><b>🧰 Xưởng thí nghiệm</b><div class="small muted">Thiết kế và lưu quy trình</div></div>
 </div>
 <section id="clTab-phet" class="panel" style="padding:16px;margin-bottom:16px">
  <div class="sectionhead"><div><h2>🔬 Thư viện mô phỏng</h2><p class="small muted">Chọn mô phỏng theo chủ đề. Nội dung ngoài chỉ tải khi bạn chọn.</p></div></div>
  <label class="small" for="phetSubjectPicker">Chủ đề / mô phỏng</label>
  <select class="inp" id="phetSubjectPicker" style="width:100%;margin:8px 0 12px">
   <option value="https://phet.colorado.edu/vi/simulations/filter?subjects=physics&type=html">Thư viện Vật lý</option>
   <option value="https://phet.colorado.edu/vi/simulations/filter?subjects=math&type=html">Toán và Thống kê</option>
   <option value="https://phet.colorado.edu/vi/simulations/filter?subjects=chemistry&type=html">Hóa học</option>
   <option value="https://phet.colorado.edu/vi/simulations/filter?subjects=earth-science&type=html">Trái đất và Không gian</option>
   <option value="https://phet.colorado.edu/vi/simulations/filter?subjects=biology&type=html">Sinh học</option>
  </select>
  <iframe id="phetFrame" data-principia-src="https://phet.colorado.edu/vi/simulations/filter?subjects=physics&type=html" title="Thư viện mô phỏng PhET" loading="lazy" style="width:100%;height:430px;border:1px solid var(--line);border-radius:12px"></iframe>
  <div id="principiaLabTools"></div>
 </section>
 <section id="principia-collision-lab" style="margin-top:18px;padding:16px;border:1px solid var(--line);border-radius:14px;background:var(--bg-2);">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap">
                <div><h3 style="margin:0">⚖️ Phòng thí nghiệm va chạm 1D</h3><p class="small muted" style="margin:5px 0">Điều chỉnh khối lượng, vận tốc và hệ số đàn hồi để kiểm tra định luật bảo toàn</p></div>
                <button type="button" class="oli-btn" data-collision="reset">Đặt lại</button>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:10px;margin-top:12px">
                <label class="small">Khối lượng vật A (kg)<input class="inp" data-collision="m1" type="number" min="0.01" step="0.1" value="1" style="width:100%;margin-top:4px"></label>
                <label class="small">Vận tốc ban đầu A (m/s)<input class="inp" data-collision="u1" type="number" step="0.1" value="3" style="width:100%;margin-top:4px"></label>
                <label class="small">Khối lượng vật B (kg)<input class="inp" data-collision="m2" type="number" min="0.01" step="0.1" value="2" style="width:100%;margin-top:4px"></label>
                <label class="small">Vận tốc ban đầu B (m/s)<input class="inp" data-collision="u2" type="number" step="0.1" value="-1" style="width:100%;margin-top:4px"></label>
                <label class="small">Hệ số đàn hồi e<input class="inp" data-collision="e" type="number" min="0" max="1" step="0.05" value="1" style="width:100%;margin-top:4px"></label>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:9px;margin-top:12px">
                <div style="padding:10px;border-radius:10px;background:var(--bg)"><span class="small muted">Vật A sau va chạm</span><div data-collision="v1" style="font-weight:700;font-size:18px">—</div></div>
                <div style="padding:10px;border-radius:10px;background:var(--bg)"><span class="small muted">Vật B sau va chạm</span><div data-collision="v2" style="font-weight:700;font-size:18px">—</div></div>
              </div>
              <div style="margin-top:12px;padding:12px;border-radius:10px;background:var(--bg);">
                <strong class="small">Sơ đồ vận tốc (vị trí biểu diễn tương đối, không phải quãng đường)</strong>
                <div class="small muted" style="margin-top:8px">Trước va chạm</div>
                <div style="height:30px;position:relative;border-bottom:1px solid var(--line)"><span data-collision="before-a" style="position:absolute;top:0;left:50%;font-size:19px">🔵</span><span data-collision="before-b" style="position:absolute;top:0;left:65%;font-size:19px">🟠</span></div>
                <div class="small muted" style="margin-top:8px">Sau va chạm</div>
                <div style="height:30px;position:relative;border-bottom:1px solid var(--line)"><span data-collision="after-a" style="position:absolute;top:0;left:50%;font-size:19px">🔵</span><span data-collision="after-b" style="position:absolute;top:0;left:65%;font-size:19px">🟠</span></div>
              </div>
              <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin-top:12px">
                <div style="padding:11px;border:1px solid var(--line);border-radius:10px"><strong>Động lượng</strong><div class="small muted">Trước: <span data-collision="p-before">—</span></div><div class="small">Sau: <span data-collision="p-after">—</span></div><div class="small muted">Sai lệch: <span data-collision="error">—</span></div></div>
                <div style="padding:11px;border:1px solid var(--line);border-radius:10px"><strong>Động năng</strong><div class="small muted">Trước: <span data-collision="k-before">—</span></div><div class="small">Sau: <span data-collision="k-after">—</span></div><div class="small muted">Năng lượng hao hụt: <span data-collision="loss">—</span></div></div>
              </div>
              <p data-collision="status" class="small" aria-live="polite" style="margin:12px 0 4px;font-weight:600"></p>
              <p data-collision="error-note" class="small muted" style="margin:0"></p>
              <p class="small muted" style="margin:10px 0 0">Mô hình một chiều, hai vật cô lập, không xét lực ngoài hay biến dạng chi tiết. Hệ số e nằm trong [0,1]. Bảo toàn động lượng; động năng chỉ bảo toàn khi e = 1.</p>
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid var(--line)">
                <h3 style="margin:0">🔵 Mô phỏng va chạm nhiều vật 2D</h3>
                <p class="small muted" style="margin:5px 0 10px">Bốn đĩa tròn chuyển động trong hộp kín; mũi tên biểu diễn vận tốc. Thử thay đổi hệ số đàn hồi.</p>
                <label class="small">Hệ số đàn hồi 2D
                  <input class="inp" data-collision2d="e" type="range" min="0" max="1" step="0.05" value="1" style="width:100%;max-width:320px;display:block;margin-top:5px">
                  <span data-collision2d="e-label">1,00</span>
                </label>
                <canvas data-collision2d="canvas" aria-label="Mô phỏng bốn vật va chạm trong mặt phẳng hai chiều" style="display:block;width:100%;height:280px;margin-top:10px;border-radius:10px;border:1px solid var(--line);touch-action:none"></canvas>
                <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;align-items:end">
                  <label class="small" style="flex:1;min-width:180px">Kịch bản mẫu
                    <select class="inp" data-collision2d="preset" style="width:100%;margin-top:4px">
                      <option value="headon">Hai vật đối đầu</option>
                      <option value="oblique">Va chạm xiên</option>
                      <option value="chain">Dây chuyền 3 vật</option>
                      <option value="cluster">Cụm 6 vật</option>
                    </select>
                  </label>
                  <button type="button" class="oli-btn" data-collision2d="apply-preset">Nạp kịch bản</button>
                  <button type="button" class="oli-btn primary" data-collision2d="start">▶ Chạy mô phỏng</button>
                  <button type="button" class="oli-btn" data-collision2d="reset">Đặt lại 2D</button>
                  <button type="button" class="oli-btn" data-collision2d="add">＋ Thêm vật</button>
                  <button type="button" class="oli-btn" data-collision2d="remove">－ Bỏ vật cuối</button>
                </div>
                <div style="margin-top:12px;padding:12px;border:1px solid var(--line);border-radius:10px">
                  <strong class="small">🎯 Chọn vật trên khung mô phỏng để chỉnh thông số</strong>
                  <div class="small muted" data-collision2d-edit="selected" style="margin:5px 0 9px">Đang chọn vật 1/4</div>
                  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px">
                    <label class="small">Khối lượng (kg)<input class="inp" data-collision2d-edit="mass" type="number" min="0.01" max="1000" step="0.1" value="1" style="width:100%;margin-top:4px"></label>
                    <label class="small">Bán kính (px)<input class="inp" data-collision2d-edit="radius" type="number" min="6" max="45" step="1" value="15" style="width:100%;margin-top:4px"></label>
                    <label class="small">Vận tốc Vx<input class="inp" data-collision2d-edit="vx" type="number" min="-500" max="500" step="1" value="115" style="width:100%;margin-top:4px"></label>
                    <label class="small">Vận tốc Vy<input class="inp" data-collision2d-edit="vy" type="number" min="-500" max="500" step="1" value="34" style="width:100%;margin-top:4px"></label>
                  </div>
                </div>
                <div class="small" data-collision2d="status" aria-live="polite" style="margin-top:8px">Đang chuẩn bị…</div>
                <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px;margin-top:8px">
                  <div style="padding:9px;border-radius:9px;background:var(--bg)"><span class="small muted">Tổng động năng</span><div data-collision2d="energy" style="font-weight:700">—</div></div>
                  <div style="padding:9px;border-radius:9px;background:var(--bg)"><span class="small muted">Tổng động lượng</span><div data-collision2d="momentum" style="font-weight:700">—</div></div>
                </div>
                <p class="small muted" style="margin:9px 0 0">Lưu ý: thành hộp tác dụng lực ngoài nên tổng động lượng của các vật không nhất thiết bảo toàn khi chúng bật khỏi tường. Mô hình dùng va chạm đĩa cứng, không mô phỏng biến dạng, ma sát hay xoáy.</p>
              </div>
            </section>
 </div>`;
}
function entertainmentPage(){
 const items=currentNodes(),selected=activeEntertainmentGameId?find(activeEntertainmentGameId,entertainmentData):null;
 const trail=stack.length?`<div class="breadcrumb">${crumb()}</div>`:'';
 const gamePanel=selected&&selected.type==='game'?`<div class="panel"><div class="sectionhead"><div><div class="eyebrow">${esc(selected.name)}</div><h2>${esc(selected.name)}</h2></div><div class="toolbar"><button class="secondary" onclick="activeEntertainmentGameId=null;render()">← Đóng</button><a class="primary" href="${esc(selected.url)}" target="_blank" rel="noopener noreferrer">Mở website ↗</a></div></div><div style="border:1px solid var(--line);border-radius:16px;overflow:hidden;background:#fff"><iframe title="${esc(selected.name)}" src="${esc(selected.url)}" style="display:block;width:100%;height:min(68vh,680px);border:0;background:#fff" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allow="fullscreen; autoplay"></iframe></div><p class="small muted">Nếu website chặn nhúng, hãy dùng nút Mở website.</p></div>`:'';
 return `<div class="eyebrow">PLAY · THINK · COMPETE</div><h1>Giải trí & tư duy</h1><p class="muted">Tổ chức trò chơi theo tab lớn, tab con và nền tảng bên trong.</p>${trail}<div class="toolbar" style="margin:12px 0"><button class="primary" onclick="addNode('tab')">＋ Tạo tab</button><button class="secondary" onclick="addEntertainmentGame()">＋ Thêm trò chơi / nền tảng</button></div><div class="grid">${items.length?items.map(card).join(''):'<div class="empty">Tab này chưa có nội dung. Hãy tạo tab con hoặc thêm trò chơi.</div>'}</div>${gamePanel}<div class="panel"><div class="sectionhead"><h2>AI phân tích cờ vua</h2><span class="pill">Engine phân tích</span></div><p class="muted small">Dán PGN hoặc FEN để mở bàn phân tích Lichess với engine cờ vua.</p><textarea id="chessPosition" rows="3" placeholder="Dán PGN hoặc FEN của ván cờ vào đây..."></textarea><button class="primary" onclick="analyzeChessPosition()">Phân tích nước đi</button></div>`;
}
function simulateAiMatch(){let st=entertainmentState();const bots=leagueBots();const opponent=bots[Math.floor(Math.random()*bots.length)];const win=Math.random()<.62;const gain=win?30:12;st.points+=gain;st.matches++;if(win)st.wins++;localStorage.setItem('principia_fun_league',JSON.stringify(st));const before=leagueRank(st.points-gain),after=leagueRank(st.points);render();notify((win?'🏆 Bạn thắng '+opponent.name:'🤝 Trận đấu với '+opponent.name+' kết thúc')+' · +'+gain+' điểm'+(before.name!==after.name?' · Thăng hạng '+after.name+'!':''));if(before.name!==after.name)setTimeout(()=>notify('🎉 Tuyệt vời! Bạn đã lên '+after.name+' '+after.icon+'!'),500)}
function progressPage(){
 let total=lessons().length,pct=total?Math.round(completed.length/total*100):0;
 const acc=getPrincipiaAccount(),studentName=acc?.name||profile.name||'Bạn';
 if(window.watchPrincipiaLeaderboard)window.watchPrincipiaLeaderboard();
 const rows=window.principiaLeaderboardRows||[];
 const leaderboard=rows.length?rows.map((r,i)=>`<div class="file principia-rank-row"><b class="principia-rank-number">${i+1}</b><div class="principia-rank-avatar">${(r.uid||'')===acc?.uid?'Bạn':'Học sinh'}</div><div class="principia-rank-meta"><b>${esc(r.name||'Học sinh')}</b><div class="small muted">${Number(r.completedCount)||0} bài học · ${Number(r.streak)||0} ngày streak</div></div><b class="principia-rank-xp">${Number(r.xp)||0} XP</b></div>`).join(''):`<div class="empty">Đang tải bảng xếp hạng học tập. Khi các tài khoản đồng bộ dữ liệu, danh sách sẽ hiện tại đây.</div>`;
 const status=window.principiaLeaderboardError?'<p class="small" style="color:#c45b5b">Chưa thể tải bảng xếp hạng. Kiểm tra quyền Firestore.</p>':'<p class="small muted">Xếp hạng theo XP học tập từ các tài khoản đã đăng nhập.</p>';
 return `<div class="eyebrow">YOUR JOURNEY</div><h1>Tiến độ học tập</h1><div class="panel"><h2>${pct}% hoàn thành</h2><div class="progress"><div style="width:${pct}%"></div></div><p class="muted small">${completed.length}/${total} bài học</p><h3>${xp} XP · ${streak} ngày streak</h3></div><div class="sectionhead"><div><div class="eyebrow">LEARNING LEADERBOARD</div><h2>Bảng xếp hạng học tập</h2></div><span class="pill">Theo XP</span></div><div class="panel" id="principiaLearningLeaderboard">${leaderboard}${status}</div><div class="sectionhead"><h2>Bài học</h2></div>${lessons().map(l=>`<div class="file"><span>${esc(l.name)}</span><span>${completed.includes(l.id)?'Đã học':'Chưa học'}</span></div>`).join('')}`;
}
function morePage(){
 const currentTheme=localStorage.getItem('principia_theme')||'dark';
 return `<div class="eyebrow">MORE</div><h1>Cài đặt & hồ sơ</h1><div class="panel"><h2>Hồ sơ của bạn</h2><div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">${avatarHTML()}<div><h3>${esc(profile.name)}</h3><p class="muted small">${xp} XP · ${streak} ngày streak</p></div></div><button class="secondary" onclick="profileEditor()">Chỉnh sửa hồ sơ</button></div>
 <div class="panel"><h2>Nhân vật trợ lý AI</h2><p class="muted small">Tải ảnh nhân vật riêng. PRINCIPIA sẽ tự động tách nền trước khi lưu và hiển thị trong nút chat.</p><input id="principiaChatAvatarFile" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" onchange="uploadPrincipiaChatAvatar(this.files&&this.files[0])"><div class="toolbar"><button class="secondary" onclick="document.getElementById('principiaChatAvatarFile').click()">↑ Tải ảnh nhân vật</button><button class="secondary" onclick="removePrincipiaChatAvatar()">Khôi phục nhân vật cũ</button></div><p id="principiaChatAvatarStatus" class="small muted" role="status"></p></div>
 <div class="panel"><h2>Nhân vật & Sticker</h2><p class="muted small">Cài đặt nhân vật đồng hành khi học tập.</p><button class="secondary" onclick="openStickerStudio()">🎀 Cài đặt nhân vật & sticker</button><button class="secondary" onclick="openRewardCollection()">🎁 Hộp quà & bộ sưu tập</button></div>
 <div class="panel"><h2>🎨 Giao diện & bố cục</h2><p class="muted small">Toàn bộ tùy chỉnh giao diện nằm tại đây.</p><label for="principiaThemeSelect">Chủ đề màu</label><select id="principiaThemeSelect" onchange="applyPrincipiaTheme(this.value)"><option value="dark" ${currentTheme==='dark'?'selected':''}>Dark • Tím PRINCIPIA</option><option value="light" ${currentTheme==='light'?'selected':''}>Light • Sáng</option><option value="cosmic" ${currentTheme==='cosmic'?'selected':''}>Cosmic • Vũ trụ xanh tím</option></select><button class="secondary" onclick="openLayoutSettings()">Đổi tên nhóm và tải ảnh làm biểu tượng cho Home, Học tập, Quiz, Đố vui, Giải trí, Tiến độ</button></div>
 <div class="panel"><h2>Dữ liệu</h2><div class="toolbar"><button class="primary" onclick="backup()">↓ Xuất bản sao lưu</button><button class="secondary" onclick="$('#import').click()">↑ Nhập bản sao lưu</button><input id="import" type="file" accept=".json" class="hidden" onchange="restore(this.files[0])"></div></div>
 <div class="panel"><h2>Trợ giúp</h2><p class="muted small">PRO · PRINCIPIA PHYSICS OLYMPIAD · Phiên bản HTML đơn tệp.</p><button class="danger" onclick="resetAll()">Khôi phục dữ liệu mẫu</button></div>`;
}

let accountReturnPage='home';
function getPrincipiaAccount(){try{return JSON.parse(localStorage.getItem('principia_google_account')||'null')}catch(e){return null}}
function getPrincipiaAccount(){try{return JSON.parse(localStorage.getItem('principia_google_account')||'null')}catch(e){return null}}
const PRINCIPIA_OWNER_EMAIL='huyquocnguyen03042011@gmail.com';
const PRINCIPIA_OWNER_UID='WNrwcRq8lza5DbKrxSlttIex93i1';
function getRoleMap(){try{return JSON.parse(localStorage.getItem('principia_role_map')||'{}')}catch(e){return {}}}
function isPrincipiaOwner(){const a=getPrincipiaAccount();return !!a && a.uid===PRINCIPIA_OWNER_UID && (a.email||'').toLowerCase()===PRINCIPIA_OWNER_EMAIL;}
// Chỉ tài khoản chủ sở hữu PRINCIPIA được chỉnh sửa nội dung.
function principiaRole(){return isPrincipiaOwner()?'admin':'viewer';}
function isPrincipiaAdmin(){return isPrincipiaOwner();}
function requireAdmin(){if(!isPrincipiaOwner()){notify('Chỉ tài khoản admin '+PRINCIPIA_OWNER_EMAIL+' mới được chỉnh sửa.');return false;}return true;}
function canManageContent(){return isPrincipiaOwner();}
function canManageMedia(){return isPrincipiaOwner();}
function requirePermission(kind='content'){return requireAdmin();}
function setGrantedRole(email,role){if(!isPrincipiaOwner()){notify('Chỉ tài khoản chủ sở hữu mới được cấp quyền.');return;}email=(email||'').trim().toLowerCase();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)||email===PRINCIPIA_OWNER_EMAIL){notify('Email không hợp lệ hoặc là email chủ sở hữu.');return;}const map=getRoleMap();if(role==='viewer')delete map[email];else map[email]=role;localStorage.setItem('principia_role_map',JSON.stringify(map));render();notify('Đã cập nhật quyền cho '+email);}
function revokeGrantedRole(email){if(!isPrincipiaOwner())return;const map=getRoleMap();delete map[email.toLowerCase()];localStorage.setItem('principia_role_map',JSON.stringify(map));render();notify('Đã thu hồi quyền.');}
let accountMode='login';
function accountPage(){
 const acc=getPrincipiaAccount();
 if(acc){
  const role=principiaRole();const roleLabel={admin:'Chủ sở hữu · Toàn quyền',editor:'Biên tập viên · Chỉnh sửa nội dung',media:'Cộng tác viên · Video / transcript',viewer:'Người xem · Chỉ xem'}[role]||'Người xem';
  const grants=getRoleMap();
  return `<div class="account-page"><div class="account-page-card">
  <div class="breadcrumb"><button onclick="setPage('home')">Home</button> / Tài khoản</div>
  <img class="account-brand-logo" src="${PRINCIPIA_LOGO_URI}" alt="PRINCIPIA">
  <div class="eyebrow" style="text-align:center">PRINCIPIA • PHYSICS OLYMPIAD</div><h1 style="text-align:center">Tài khoản của bạn</h1>
  ${acc.customPicture?`<img class="account-profile-photo" src="${esc(acc.customPicture)}" alt="Ảnh đại diện">`:`<div class="account-profile-placeholder">👤</div>`}
  <h2 style="text-align:center">${esc(acc.name||'Người dùng')}</h2><div class="account-info-row"><span>Email</span><strong>${esc(acc.email||'')}</strong></div>
  <div class="account-info-row"><span>Quyền</span><strong>${roleLabel}</strong></div>
  <div style="text-align:center;margin:16px"><input id="accountAvatarFile" type="file" accept="image/*" class="hidden" onchange="changeAccountAvatar(this.files[0])"><button class="secondary" onclick="document.getElementById('accountAvatarFile').click()">Đổi ảnh đại diện</button></div>
  ${isPrincipiaOwner()?`<div class="panel" style="margin-top:18px"><h2>Quản trị PRINCIPIA</h2><p class="muted small">Tài khoản chủ sở hữu có toàn quyền quản lý nội dung. Các tài khoản khác mặc định chỉ xem.</p></div>`:''}
  <div class="toolbar" style="justify-content:center"><button class="danger" onclick="signOutGoogleLocal()">Đăng xuất</button></div>
 </div></div>`;
 }
 const signup=accountMode==='signup';
 return `<div class="account-page"><div class="account-page-card" style="text-align:center">
  <img class="account-brand-logo" src="${PRINCIPIA_LOGO_URI}" alt="PRINCIPIA"><div class="eyebrow">PRINCIPIA • PHYSICS OLYMPIAD</div>
  <h1>${signup?'Tạo tài khoản':'Chào mừng trở lại'}</h1><p class="muted">${signup?'Đăng ký bằng email và mật khẩu hoặc Google.':'Đăng nhập bằng email và mật khẩu hoặc Google.'}</p>
  <div class="auth-switch"><button class="${!signup?'active':''}" onclick="setAccountMode('login')">Đăng nhập</button><button class="${signup?'active':''}" onclick="setAccountMode('signup')">Đăng ký</button></div>
  <form class="auth-form" onsubmit="submitEmailAuth(event)">${signup?`<label for="authName">Tên người dùng</label><input id="authName" autocomplete="name" placeholder="Tên hiển thị">`:''}<label for="authEmail">Email</label><input id="authEmail" type="email" autocomplete="email" required placeholder="name@example.com"><label for="authPassword">Mật khẩu</label><div class="principia-password-wrap" style="display:flex;align-items:center;gap:8px"><input id="authPassword" type="password" minlength="6" autocomplete="${signup?'new-password':'current-password'}" required placeholder="Ít nhất 6 ký tự" style="flex:1;min-width:0"><button type="button" class="secondary" aria-label="Hiện hoặc ẩn mật khẩu" title="Hiện hoặc ẩn mật khẩu" onclick="togglePrincipiaPassword()" style="flex:0 0 46px;padding:10px">👁</button></div>${!signup?`<div style="text-align:right;margin:8px 0 12px"><button type="button" class="text-link" onclick="sendPrincipiaPasswordReset()" style="background:none;border:0;color:var(--purple);cursor:pointer;padding:4px 0">Quên mật khẩu?</button></div>`:''}<button class="primary" type="submit">${signup?'Tạo tài khoản':'Đăng nhập'}</button><div id="emailAuthStatus" class="google-account-status" role="status"></div></form>
  <div style="display:flex;align-items:center;gap:10px;margin:22px 0;color:var(--muted);font-size:12px"><span style="height:1px;background:var(--line);flex:1"></span>HOẶC TIẾP TỤC VỚI GOOGLE<span style="height:1px;background:var(--line);flex:1"></span></div>
  <div class="google-auth-area"><div id="googleSignInButton" class="google-auth-button-wrap"></div></div>
  <div id="googleAccountStatus" class="google-account-status" role="status">${signup?'Đăng ký bằng Google':'Đăng nhập bằng Google'}</div>
  <p class="small muted">Bạn cần đăng nhập mới xem được nội dung học tập. Logo PRINCIPIA không được dùng làm avatar cá nhân.</p>
 </div></div>`;
}
function setAccountMode(mode){accountMode=mode==='signup'?'signup':'login';render();renderGoogleAccount();}

function principiaWelcomeCharacterMarkup(){
 try{if(typeof window.principiaRandomPoseMarkup==='function')return window.principiaRandomPoseMarkup(320);}catch(e){}
 try{if(typeof window.getPrincipiaCharacterMarkup==='function')return window.getPrincipiaCharacterMarkup();}catch(e){}
 try{
  const settings=JSON.parse(localStorage.getItem('principia_sticker_settings')||'{}');
  const list=JSON.parse(localStorage.getItem('principia_custom_stickers')||'[]');
  if(typeof settings.selected==='string'&&settings.selected.startsWith('data:image/')&&list.some(x=>x.data===settings.selected))return '<img src="'+settings.selected+'" alt="Nhân vật PRINCIPIA" style="width:76px;height:76px;object-fit:contain">';
 }catch(e){}
 return '';
}
// Backward-compatible helper for cached/older welcome render paths.
function principiaWelcomeCharacterSrc(){
 try{
  const markup=principiaWelcomeCharacterMarkup();
  const match=markup.match(/\\bsrc=["']([^"']+)["']/i);
  return match?match[1]:'';
 }catch(_){return '';}
}
function startPrincipiaJourney(){
 const acc=getPrincipiaAccount();
 const id=acc?.uid||acc?.email||'guest';
 localStorage.setItem('principia_welcome_seen_v5_'+id,'1');
 setPage('home');
 // Giveaway/reward popup removed; keep the welcome screen and continue to Home.
}
function render(){
 document.querySelectorAll('body > .principia-mobile-nav').forEach(el=>el.remove());
 const app=$('#app');
 if(window.__principiaLastRoute!==page){const previous=window.__principiaLastRoute||null;window.__principiaLastRoute=page;try{window.dispatchEvent(new CustomEvent('principia:page-changed',{detail:{page,previous}}));}catch(_){}}

 // Chỉ cho phép xem workspace sau khi có phiên PRINCIPIA đã xác thực.
 if(!getPrincipiaAccount() && page!=='account'){page='account';stack=[];}
 // Giữ màn hình chào cho tới khi người dùng chủ động bấm Bắt đầu hành trình.
 document.body.classList.toggle('principia-welcome-active',page==='welcome');
 document.body.classList.toggle('principia-home-active',page==='home');

 if(page==='welcome'){
  document.querySelectorAll('body > .principia-mobile-nav').forEach(el=>el.remove());
  const welcomeAccount=getPrincipiaAccount()||{};
  const welcomeName=(welcomeAccount.name||profile?.name||'bạn').trim();
  app.innerHTML=`<main class="principia-welcome-screen">
   <div class="pw-glow pw-glow-one"></div><div class="pw-glow pw-glow-two"></div><div class="pw-stars"></div>
   <header class="pw-header">
    <div class="pw-brand"><img src="${PRINCIPIA_LOGO_URI}" alt="PRO"><span><b>PRO</b><small>PRINCIPIA PHYSICS OLYMPIAD</small></span></div>
    <div class="pw-account"><span class="pw-online-dot"></span><span>${esc(welcomeAccount.email||'Tài khoản đã đăng nhập')}</span></div>
   </header>
   <section class="pw-content pw-welcome-layout">
    <div class="pw-copy">
     <div class="pw-kicker"><span></span> YOUR NEXT CHAPTER STARTS HERE</div>
     <div class="pw-overline">WELCOME TO</div>
     <h1>PRO</h1>
     <h2>Chào mừng <em>${esc(welcomeName)}</em><br>đến với PRO!</h2>
     <p>Một không gian học tập được tạo ra để bạn khám phá Vật lý, chinh phục thử thách và tiến bộ theo cách của riêng mình.</p>
     <button class="pw-start-button" type="button" onclick="startPrincipiaJourney()">Bắt đầu hành trình <span aria-hidden="true">→</span></button>
     <div class="pw-note"><span class="pw-note-line"></span> HỌC TẬP · KHÁM PHÁ · BỨT PHÁ</div>
    </div>
    <div class="pw-visual" aria-label="Không gian khám phá Vật lý">
     <div class="pw-orbit pw-orbit-a"></div><div class="pw-orbit pw-orbit-b"></div>
     <div class="pw-art-panel">
      <div class="pw-art-top"><span>PHYSICS EXPLORER</span><i>● READY TO BEGIN</i></div>
      <div class="pw-character-halo">${typeof principiaWelcomeCharacterMarkup==='function'?principiaWelcomeCharacterMarkup():'<img class="pw-welcome-character" src="/assets/images/principia-chat-character.png" alt="Nhân vật PRINCIPIA">'}</div>
      <div class="pw-speech"><span class="pw-speech-dot"></span><b>Tri thức bắt đầu từ sự tò mò.</b><small>Hãy bắt đầu hành trình của bạn hôm nay.</small></div>
      <div class="pw-formula-row"><span>F = ma</span><span>E = mc²</span><span>v = λf</span></div>
      <div class="pw-art-bottom"><span>LEARN</span><span>DISCOVER</span><span>ACHIEVE</span></div>
     </div>
     <div class="pw-floating-chip pw-chip-top">01 · EXPLORE</div><div class="pw-floating-chip pw-chip-bottom">02 · DISCOVER</div>
    </div>
   </section>
   <footer class="pw-footer"><span>PRO · PRINCIPIA PHYSICS OLYMPIAD</span><span>MADE FOR CURIOUS MINDS</span></footer>
  </main>`;
  return;
 }
 let nav=principiaNav();
 let body=page==='account'?accountPage():page==='home'?home():page==='library'?library():page==='lesson'?lesson():page==='quiz'?quizHome():page==='fun'?funHome():page==='lab'?labPage():page==='play'?playPage():page==='lessonplay'?lessonPlayPage():page==='progress'?progressPage():morePage();
 const outerCoverHtml = `<div class="outer-cover-banner"><div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;"><img class="outer-cover-thumb" src="${outerCoverImg}" alt="Ảnh ngoài trang"><div><div class="eyebrow">ẢNH NGOÀI TRANG</div><div class="small muted">Hiển thị ảnh bạn đưa ngay ngoài không gian học tập</div></div></div><div style="display:flex;gap:8px;flex-wrap:wrap;"><button class="secondary" onclick="$('#outerCoverInput').click()">Đổi ảnh ngoài</button><button class="secondary" onclick="resetOuterCover()">Ảnh mặc định</button><input type="file" id="outerCoverInput" accept="image/*" class="hidden" onchange="updateOuterCover(this.files[0])"></div></div>`;
const isMobileDevice=(()=>{const ua=String(navigator.userAgent||'');const uaMobile=typeof navigator.userAgentData?.mobile==='boolean'?navigator.userAgentData.mobile:/Android|iPhone|iPad|iPod|Mobile|IEMobile|Windows Phone/i.test(ua);return uaMobile;})();
 const navButtons=nav.map(([id,ic,n],idx)=>{const image=navItemImage(id),preset=PRINCIPIA_EMOJI_ICONS[ic]?ic:['home','books','calculator','puzzle','game','trophy'][idx%6],active=page===id||page==='lesson'&&id==='library'||page==='play'&&id===(activeQuiz?.kind==='fun'?'fun':'quiz');return `<button class="nav ${active?'active':''}" data-page="${id}" onclick="setPage('${id}')">${image?`<img class="nav-custom-icon" src="${image}" alt="">`:`<span class="nav-default-icon">${principiaEmojiIcon(preset)}</span>`}<span>${n}</span></button>`}).join('');
 const brandMarkup=`<div class="brand" aria-label="PRO — PRINCIPIA PHYSICS OLYMPIAD"><img class="brand-logo-img" src="${PRINCIPIA_LOGO_URI}" alt="PRO"><span class="brand-name">PRO</span></div>`;
 const settingsButton=`<button class="nav ${page==='more'?'active':''}" onclick="setPage('more')"><span class="nav-default-icon">⚙</span><span>Cài đặt</span></button>`;
 if(isMobileDevice){
  app.innerHTML=`<div class="principia-mobile-shell"><main class="principia-mobile-main"><div class="principia-mobile-topbar">${topbar()}</div><div id="body">${body}</div></main><nav class="principia-mobile-nav" aria-label="Điều hướng mobile">${brandMarkup}${navButtons}${settingsButton}</nav></div>`;
 }else{
  // Restore the original PRINCIPIA desktop layout: classic sidebar + main workspace.
  app.innerHTML=`<div class="layout"><aside class="sidebar"><div class="brand" aria-label="PRO — PRINCIPIA PHYSICS OLYMPIAD"><img class="brand-logo-img" src="${PRINCIPIA_LOGO_URI}" alt="PRO"><span class="brand-name">PRO</span></div>${navGroupLabelHTML('workspace')}${nav.map(([id,ic,n],idx)=>{const image=navItemImage(id),preset=PRINCIPIA_EMOJI_ICONS[ic]?ic:['home','books','calculator','puzzle','game','trophy'][idx%6];return `<button class="nav ${page===id||page==='lesson'&&id==='library'||page==='play'&&id===(activeQuiz?.kind==='fun'?'fun':'quiz')?'active':''}" onclick="setPage('${id}')">${image?`<img class="nav-custom-icon" src="${image}" alt="">`:`<span class="nav-default-icon">${principiaEmojiIcon(preset)}</span>`}<span>${n}</span></button>`}).join('')}<div class="sidebottom">${navGroupLabelHTML('more')}<button class="nav ${page==='more'?'active':''}" onclick="setPage('more')">More / Settings</button></div></aside><main class="main">${topbar()}<div id="body">${body}</div></main></div>`;
 }
 document.dispatchEvent(new CustomEvent('principia:rendered',{detail:{page}}));
 document.body.dataset.principiaDevice=isMobileDevice?'mobile':'desktop';
 document.body.dataset.principiaRole=principiaRole();
 document.body.classList.toggle('principia-admin',isPrincipiaAdmin());
 // Chỉ ADMIN mới được tạo nội dung, dùng nút + hoặc nhập/dán link video.
 document.querySelectorAll('#body button, #body input, #body textarea, #body select, #codelearnWorkspace button, #codelearnWorkspace input, #codelearnWorkspace textarea, #codelearnWorkspace select').forEach(el=>{
  const a=(el.getAttribute('onclick')||'')+' '+(el.getAttribute('onchange')||'')+' '+(el.getAttribute('oninput')||'');
  const label=(el.innerText||el.value||el.getAttribute('aria-label')||'').trim();
  const isPlus=/^[＋+]/.test(label) || /addNode|addChoice|createNode|addLessonInTab|editLessonQuiz|addQuestion|attachFiles|addFilesToList/i.test(a);
  const isAdminOnly=/addNode|addChoice|createNode|addLessonInTab|editLessonQuiz|addQuestion|attachFiles|addFilesToList|openConvertToQuiz|playVideoInRightPane/i.test(a) || /clVideoUrlInput|clAdminVideoLinkControls/.test(el.id||'') || !!el.closest?.('#clAdminVideoLinkControls') || isPlus;
  const isWrite=/editNode|deleteNode|addNode|addChoice|editLessonQuiz|profileEditor|addQuestion|saveNode|saveLessonQuiz|createNode|resetAll|updateOuterCover|outerCoverInput/i.test(a);
  if(isAdminOnly && !isPrincipiaAdmin())el.style.display='none';
  if(!canManageContent() && isWrite)el.style.display='none';
  if(!canManageMedia() && /Transcript|transcript|Video|video|summarizeTranscript|clearTranscript|saveTranscript/i.test(a))el.style.display='none';
 });
 if(page==='lesson')loadFiles(activeLesson);
 if(page==='library'&&!stack.length)loadPrincipiaLibraryItems();
}
function addChoice(){
 if(!requireAdmin())return;
 modal(`<h2>＋ Thêm vào PRINCIPIA</h2><p class="muted">Chọn nội dung muốn thêm vào thư viện cá nhân.</p><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px">
 <button class="secondary" style="padding:18px;text-align:left" onclick="closeModal();addNode('lesson')"><div style="font-size:26px">📘</div><b>＋ Bài học mới</b><p class="small muted">Tạo nội dung bài học</p></button>
 <button class="secondary" style="padding:18px;text-align:left" onclick="closeModal();addNode('tab')"><div style="font-size:26px">📁</div><b>＋ Tab mới</b><p class="small muted">Tạo thư mục chủ đề</p></button>
 <button class="secondary" style="padding:18px;text-align:left" onclick="closeModal();openLibraryPicker('file')"><div style="font-size:26px">📄</div><b>＋ Thêm tệp</b><p class="small muted">PDF, Word, PowerPoint, ảnh, văn bản…</p></button>
 <button class="secondary" style="padding:18px;text-align:left" onclick="closeModal();openLibraryPicker('book')"><div style="font-size:26px">📚</div><b>＋ Thêm sách</b><p class="small muted">Thêm sách PDF/EPUB vào kệ sách</p></button>
 </div><div class="modalactions"><button class="secondary" onclick="closeModal()">Đóng</button></div>`);
}
let principiaLibraryObjectUrl=null;
function openLibraryPicker(kind){
 if(!requireAdmin())return;
 const book=kind==='book';
 modal(`<h2>${book?'📚 Thêm sách':'📄 Thêm tệp'}</h2><p class="muted">${book?'Chọn sách PDF hoặc EPUB. PDF có thể đọc ngay trong trình duyệt.':'Chọn một hoặc nhiều tài liệu để lưu trong thư viện PRINCIPIA.'}</p><input id="principiaLibraryInput" class="inp" type="file" ${book?'accept=".pdf,.epub,application/pdf,application/epub+zip"':'multiple'}><div class="modalactions"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="savePrincipiaLibraryItems('${kind}')">Lưu vào thư viện</button></div><div class="small muted" style="margin-top:8px">Tệp được lưu trong bộ nhớ trình duyệt trên thiết bị này; chưa tự đồng bộ sang thiết bị khác.</div>`);
}
async function savePrincipiaLibraryItems(kind){
 const input=document.getElementById('principiaLibraryInput'),files=Array.from(input?.files||[]);
 if(!files.length){notify('Hãy chọn tệp trước');return}
 try{
  const d=await db();
  for(const f of files){
   const rec={id:uid(),name:f.name,blob:f,size:f.size,type:f.type||'',created:Date.now(),principiaLibrary:true,libraryKind:kind};
   await new Promise((resolve,reject)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').put(rec);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});
  }
  closeModal();page='library';stack=[];render();notify('Đã lưu '+files.length+' mục vào Thư viện học tập');
 }catch(e){notify('Không lưu được tệp. Hãy kiểm tra dung lượng bộ nhớ trình duyệt.')}
}
async function openPrincipiaLibrary(kind){
 try{
  const d=await db(),items=await new Promise(resolve=>{const q=d.transaction('files').objectStore('files').getAll();q.onsuccess=()=>resolve(q.result.filter(x=>x.principiaLibrary&&(!kind||x.libraryKind===kind)));q.onerror=()=>resolve([])});
  modal(`<h2>📚 Thư viện tệp & sách</h2><div style="display:flex;gap:8px;flex-wrap:wrap;margin:10px 0"><button class="secondary" onclick="closeModal();openLibraryPicker('file')">＋ Thêm tệp</button><button class="secondary" onclick="closeModal();openLibraryPicker('book')">＋ Thêm sách</button><button class="secondary" onclick="closeModal();openPrincipiaLibrary()">Tất cả</button></div><div style="display:grid;gap:8px;max-height:55vh;overflow:auto">${items.length?items.map(x=>`<div class="file" style="display:flex;gap:10px;align-items:center;justify-content:space-between"><span style="min-width:0;overflow-wrap:anywhere">${x.libraryKind==='book'?'📚':'📄'} <b>${esc(x.name)}</b><span class="small muted"> · ${(x.size/1048576).toFixed(1)} MB</span></span><span style="display:flex;gap:5px;flex-shrink:0"><button class="secondary" onclick="openLibraryItem('${x.id}')">Mở</button><button class="danger" onclick="deleteLibraryItem('${x.id}','${kind||''}')">Xóa</button></span></div>`).join(''):'<p class="muted">Chưa có tệp hoặc sách. Nhấn Thêm tệp / Thêm sách để bắt đầu.</p>'}</div><div class="modalactions"><button class="secondary" onclick="closeModal()">Đóng</button></div>`);
 }catch(e){notify('Không mở được thư viện')}
}
async function deleteLibraryItem(id,kind){
 if(!confirm('Xóa mục này khỏi thư viện?'))return;
 const d=await db();await new Promise(resolve=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=resolve});if(page==='library'){render();}else{openPrincipiaLibrary(kind||undefined);}
}
async function openLibraryItem(id){
 const d=await db(),f=await new Promise(resolve=>{const q=d.transaction('files').objectStore('files').get(id);q.onsuccess=()=>resolve(q.result)});
 if(!f)return;
 const url=URL.createObjectURL(f.blob);if(principiaLibraryObjectUrl)URL.revokeObjectURL(principiaLibraryObjectUrl);principiaLibraryObjectUrl=url;
 const state=JSON.parse(localStorage.getItem('principia_reader_'+id)||'{}'),isPdf=(f.type==='application/pdf'||/\.pdf$/i.test(f.name)),isText=(/^(text\/|application\/(json|xml))/.test(f.type)||/\.(txt|md|csv)$/i.test(f.name));
 let raw='';if(isText){try{raw=await f.blob.text()}catch{}}
 const safe=esc(raw),rot=Number(state.rotation)||0;
 modal(`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap"><h2 style="margin:0">${f.libraryKind==='book'?'📚':'📄'} ${esc(f.name)}</h2><button class="secondary" onclick="if(page==='library'){closeModal();render()}else{openPrincipiaLibrary('${f.libraryKind}')} ">← Thư viện</button></div>
 <div style="display:flex;gap:7px;flex-wrap:wrap;margin:10px 0"><button class="secondary" onclick="setReaderMode('${id}','side')">Hai bản song song</button><button class="secondary" onclick="setReaderMode('${id}','original')">Chỉ bản gốc</button><button class="secondary" onclick="setReaderMode('${id}','translated')">Chỉ bản dịch</button><button class="secondary" onclick="rotateReader('${id}',90)">↻ Xoay</button><button class="secondary" onclick="setReaderPages('${id}',1)">1 trang</button><button class="secondary" onclick="setReaderPages('${id}',2)">2 trang</button></div>
 <div id="principiaReaderGrid" style="display:grid;grid-template-columns:repeat(${state.pages===2?2:1},minmax(0,1fr));gap:10px;max-height:65vh;overflow:auto">
 <section id="readerOriginal" style="min-width:0"><b>Bản gốc</b>${isPdf?'<iframe title="Tài liệu gốc" src="'+url+'#toolbar=1" style="width:100%;height:58vh;border:1px solid var(--line);border-radius:12px;transform:rotate('+rot+'deg);transform-origin:center"></iframe>':isText?'<pre style="white-space:pre-wrap;overflow:auto;max-height:55vh;padding:12px;background:var(--bg-2);border-radius:10px">'+safe+'</pre>':'<p class="muted">Định dạng này chưa xem trực tiếp được trong trình duyệt. Bạn có thể tải tệp xuống để mở bằng ứng dụng phù hợp.</p>'}</section>
 <section id="readerTranslated" style="min-width:0"><b>Bản dịch</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin:7px 0"><select id="readerTargetLang" class="inp" style="max-width:160px" onchange="saveReaderTranslation('${id}')"><option value="vi">Tiếng Việt</option><option value="en">English</option><option value="ja">日本語</option><option value="ko">한국어</option><option value="zh">中文</option><option value="fr">Français</option></select><button class="secondary" onclick="saveReaderTranslation('${id}')">Lưu bản dịch</button></div><textarea id="readerTranslationText" class="inp" rows="15" placeholder="Dán hoặc nhập nội dung bản dịch tại đây. Muốn dịch tự động cần kết nối dịch vụ AI/dịch thuật." oninput="saveReaderTranslation('${id}')" style="width:100%;min-height:45vh">${esc(state.translation||'')}</textarea><p class="small muted">Bản dịch và lựa chọn hiển thị được lưu trên thiết bị này. Hiện chưa có API dịch tự động kết nối.</p></section></div>
 <div class="modalactions"><button class="secondary" onclick="downloadDoc('${id}')">Tải tệp gốc</button><button class="secondary" onclick="closeModal()">Đóng</button></div>`);
 const lang=document.getElementById('readerTargetLang');if(lang)lang.value=state.lang||'vi';applyReaderMode(state.mode||'side');
}
function saveReaderState(id,patch){const key='principia_reader_'+id,s=JSON.parse(localStorage.getItem(key)||'{}');Object.assign(s,patch);localStorage.setItem(key,JSON.stringify(s))}
function saveReaderTranslation(id){const t=document.getElementById('readerTranslationText'),l=document.getElementById('readerTargetLang');saveReaderState(id,{translation:t?.value||'',lang:l?.value||'vi'})}
function applyReaderMode(mode){const a=document.getElementById('readerOriginal'),b=document.getElementById('readerTranslated'),g=document.getElementById('principiaReaderGrid');if(!a||!b||!g)return;a.style.display=mode==='translated'?'none':'';b.style.display=mode==='original'?'none':'';g.style.gridTemplateColumns=mode==='side'?'repeat(2,minmax(0,1fr))':'1fr';}
function setReaderMode(id,mode){saveReaderState(id,{mode});applyReaderMode(mode)}
function setReaderPages(id,pages){saveReaderState(id,{pages});const g=document.getElementById('principiaReaderGrid');if(g)g.style.gridTemplateColumns='repeat('+pages+',minmax(0,1fr))'}
function rotateReader(id,delta){const s=JSON.parse(localStorage.getItem('principia_reader_'+id)||'{}');s.rotation=((Number(s.rotation)||0)+delta)%360;saveReaderState(id,s);const frame=document.querySelector('#readerOriginal iframe');if(frame)frame.style.transform='rotate('+s.rotation+'deg)'}

function addNode(type){
 if(!requireAdmin())return;
 let nodes=currentNodes();
 let title=type==='tab'?'Tạo tab mới':type==='lesson'?'Thêm bài học':type==='quiz'?'Thêm bài kiểm tra':'Thêm bài đố vui';
 modal(`<h2>＋ ${title}</h2><label>Tên</label><input id="newname" placeholder="Nhập tên..."><label>Biểu tượng</label><input id="newicon" value="${type==='tab'?'📁':type==='lesson'?'📘':type==='quiz'?'📝':'🧩'}"><div id="newextra">${type!=='tab'?`<label>Nội dung / câu hỏi mô tả</label><textarea id="newcontent" placeholder="Nhập nội dung..."></textarea>`:''}</div><div class="modalactions"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="createNode('${type}')">Tạo</button></div>`);
}
function createNode(type){
 if(!requireAdmin())return;
 let name=$('#newname').value.trim();if(!name){notify('Hãy nhập tên');return}
 let n={id:uid(),name,icon:$('#newicon').value||'📁',type};
 if(type==='tab')n.children=[];
 if(type==='lesson'){n.content=$('#newcontent').value;n.quiz=[]}
 if(type==='quiz'||type==='fun'){n.questions=[];n.description=$('#newcontent').value}
 currentNodes().push(n);saveAll();closeModal();render();notify('Đã thêm thành công');
}
function editNode(id){
 if(!requirePermission('content'))return;
 let nodes=tree(),n=find(id,nodes);if(!n)return;
 let qtype=n.type==='quiz'||n.type==='fun';
 modal(`<h2>Chỉnh sửa nội dung</h2><label>Tên</label><input id="ename" value="${esc(n.name)}">${nodeIconEditorHTML(n)}${n.type==='lesson'?`<label>Nội dung bài học</label><textarea id="econtent" style="min-height:200px">${esc(n.content||'')}</textarea>`:''}${qtype?`<div id="questions">${(n.questions||[]).map((q,i)=>questionEditor(q,i)).join('')}</div><button class="secondary" onclick="addQuestion()">＋ Thêm câu hỏi</button>`:''}
 <div class="modalactions"><button class="danger" onclick="deleteNode('${id}')">Xóa</button><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="saveNode('${id}')">Lưu</button></div>`);
}
function questionEditor(q,i){
 return `<div class="panel qedit"><label>Câu hỏi ${i+1}</label><input class="qq" value="${esc(q.q||'')}" placeholder="Nội dung câu hỏi">${[0,1,2,3].map(j=>`<label>Đáp án ${j+1}</label><input class="qa" value="${esc(q.a?.[j]||'')}" placeholder="Đáp án...">`).join('')}<label>Đáp án đúng</label><select class="qc">${[0,1,2,3].map(j=>`<option value="${j}" ${q.correct===j?'selected':''}>${j+1}</option>`).join('')}</select><button class="danger" style="margin-top:10px" onclick="this.closest('.qedit').remove()">Xóa câu hỏi</button></div>`;
}
function addQuestion(){
 if(!requireAdmin())return;$('#questions').insertAdjacentHTML('beforeend',questionEditor({q:'',a:['','','',''],correct:0},$('#questions').children.length))}
function saveNode(id){
 if(!requirePermission('content'))return;
 let n=find(id,tree());n.name=$('#ename').value.trim()||n.name;n.icon=$('#eicon').value||n.icon;
 if(n.type==='lesson')n.content=$('#econtent').value;
 if(n.type==='quiz'||n.type==='fun')n.questions=[...$('#questions').children].map(el=>({q:el.querySelector('.qq').value,a:[...el.querySelectorAll('.qa')].map(x=>x.value),correct:+el.querySelector('.qc').value})).filter(q=>q.q&&q.a.some(Boolean));
 saveAll();closeModal();render();notify('Đã lưu');
}
function deleteNode(id){
 if(!requirePermission('content'))return;
 if(!confirm('🗑️ Bạn chắc chắn muốn xóa nội dung này chứ? Hành động này có thể không khôi phục được.'))return;
 remove(id,tree());saveAll();closeModal();render();notify('Đã xóa');
}
function shiftNode(id,delta){
 if(!requirePermission('content'))return;
 const nodes=tree(),siblings=locate(id,nodes);if(!siblings)return;
 const from=siblings.findIndex(x=>x.id===id),to=from+delta;if(to<0||to>=siblings.length)return;
 const [item]=siblings.splice(from,1);siblings.splice(to,0,item);saveAll();render();notify('Đã đổi thứ tự');
}
function moveNodeDialog(id){
 if(!requirePermission('content'))return;
 const nodes=tree(),item=find(id,nodes);if(!item)return;
 const descendants=new Set(chain(id,nodes).map(x=>x.id));
 const tabs=[];const walk=list=>list.forEach(n=>{if(n.type==='tab'&&!descendants.has(n.id)&&n.id!==id)tabs.push(n);if(n.children)walk(n.children)});walk(nodes);
 modal('<h2>Di chuyển nội dung</h2><p class="small muted">Chọn tab đích hoặc đưa mục này về cấp ngoài cùng. Không thể chuyển một tab vào chính nó hoặc tab con của nó.</p><label for="principiaMoveTarget">Vị trí mới</label><select id="principiaMoveTarget" class="inp" style="width:100%"><option value="">📁 Cấp ngoài cùng</option>'+tabs.map(t=>'<option value="'+esc(t.id)+'">📂 '+esc(t.name)+'</option>').join('')+'</select><div class="modalactions"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="moveNodeTo(\''+esc(id)+'\',document.getElementById(\'principiaMoveTarget\').value)">Di chuyển</button></div>');
}
function moveNodeTo(id,targetId){
 if(!requirePermission('content'))return;
 const nodes=tree(),item=find(id,nodes),source=locate(id,nodes);if(!item||!source)return;
 const target=targetId?find(targetId,nodes):null;
 if(targetId&&(!target||target.type!=='tab')){notify('Vị trí đích không hợp lệ');return}
 if(target&&chain(targetId,nodes).some(x=>x.id===id)){notify('Không thể chuyển vào chính mục hoặc mục con của nó');return}
 if(target&&targetId===id){notify('Không thể tự chứa chính mình');return}
 source.splice(source.findIndex(x=>x.id===id),1);
 if(target){target.children=Array.isArray(target.children)?target.children:[];target.children.push(item)}else nodes.push(item);
 saveAll();closeModal();render();notify('Đã di chuyển nội dung');
}
function dropItem(e,id){
 if(!requirePermission('content'))return;
 e.preventDefault();if(!dragId||dragId===id)return;
 let nodes=tree(),item=find(dragId,nodes),target=find(id,nodes);
 if(!item||!target||!locate(dragId,nodes))return;
 let source=locate(dragId,nodes);
 if(source===locate(id,nodes)){
  let a=source.findIndex(x=>x.id===dragId),b=source.findIndex(x=>x.id===id);
  let [moving]=source.splice(a,1);source.splice(b,0,moving);
 }else{
  if(target.type!=='tab'){notify('Chỉ có thể thả vào tab');return}
  if(chain(dragId,nodes).some(x=>x.id===id)){notify('Không thể chuyển tab vào chính nó');return}
  source.splice(source.findIndex(x=>x.id===dragId),1);target.children.push(item);
 }
 dragId=null;saveAll();render();notify('Đã sắp xếp');
}
function lessonQuiz(id){
 let l=find(id,data);if(!l.quiz?.length){notify('Bài học chưa có câu hỏi');return}
 activeQuiz={id,kind:'lesson'};answers=[];page='lessonplay';render();
}
function editLessonQuiz(id){
 if(!requireAdmin())return;
 let l=find(id,data);
 modal(`<h2>Câu hỏi bài học</h2><div id="questions">${(l.quiz||[]).map((q,i)=>questionEditor(q,i)).join('')}</div><button class="secondary" onclick="addQuestion()">＋ Thêm câu hỏi</button><div class="modalactions"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="saveLessonQuiz('${id}')">Lưu</button></div>`);
}
function saveLessonQuiz(id){
 if(!requireAdmin())return;
 let l=find(id,data);l.quiz=[...$('#questions').children].map(el=>({q:el.querySelector('.qq').value,a:[...el.querySelectorAll('.qa')].map(x=>x.value),correct:+el.querySelector('.qc').value})).filter(q=>q.q&&q.a.some(Boolean));
 saveAll();closeModal();render();notify('Đã lưu câu hỏi');
}
function answerQuestion(){
 let a=document.querySelector('input[name="ans"]:checked');if(!a){notify('Hãy chọn đáp án');return}
 answers.push(+a.value);render();
}
function completeLesson(id){
 if(!completed.includes(id)){completed.push(id);xp+=10;dailyReward();saveAll();notify('+10 XP · Bài học hoàn thành')}
 else notify('Bài học đã hoàn thành rồi');
 render();
}
function dailyReward(){
 let today=new Date().toLocaleDateString('en-CA');
 if(lastDay!==today){
  let yesterday=new Date(Date.now()-86400000).toLocaleDateString('en-CA');
  streak=lastDay===yesterday?streak+1:1;lastDay=today;localStorage.setItem('halo_lastday',today);localStorage.setItem('halo_streak',streak);
 }
 saveAll();
}
function profileEditor(){
 if(!requirePermission('content'))return;
 modal(`<h2>Hồ sơ</h2><label>Tên hiển thị</label><input id="pname" value="${esc(profile.name)}"><label>Ảnh đại diện</label><input type="file" id="pimage" accept="image/*"><div class="modalactions"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="saveProfile()">Lưu</button></div>`);
}
function saveProfile(){
 if(!requirePermission('content'))return;
 profile.name=$('#pname').value||'Learner';let f=$('#pimage').files[0];
 if(f){let r=new FileReader();r.onload=()=>{profile.avatar=r.result;saveAll();closeModal();render()};r.readAsDataURL(f)}
 else{saveAll();closeModal();render()}
}
function applyPrincipiaTheme(theme){const root=document.documentElement;root.dataset.theme=theme;localStorage.setItem('principia_theme',theme);root.style.cssText='';if(theme==='light'){root.style.setProperty('--bg','#f3f2fa');root.style.setProperty('--side','#fff');root.style.setProperty('--card','#fff');root.style.setProperty('--card2','#eeedf7');root.style.setProperty('--line','#dedbea');root.style.setProperty('--txt','#242238');root.style.setProperty('--muted','#66647a')}else if(theme==='cosmic'){root.style.setProperty('--bg','#080d20');root.style.setProperty('--side','#101a35');root.style.setProperty('--card','#152443');root.style.setProperty('--card2','#20345b');root.style.setProperty('--line','#344b78');root.style.setProperty('--txt','#f1f6ff');root.style.setProperty('--muted','#b5c6e6');root.style.setProperty('--purple','#82cfff');root.style.setProperty('--purple2','#456fc9')}else{root.style.setProperty('--bg','#0c0d16');root.style.setProperty('--side','#111321');root.style.setProperty('--card','#171a2a');root.style.setProperty('--card2','#20233a');root.style.setProperty('--line','#292c43');root.style.setProperty('--txt','#f4f2ff');root.style.setProperty('--muted','#aeb2c8');root.style.setProperty('--purple','#a18aff');root.style.setProperty('--purple2','#765be7')}const sel=document.getElementById('principiaThemeSelect');if(sel)sel.value=theme}
function toggleTheme(){
 const current=localStorage.getItem('principia_theme')||document.documentElement.dataset.theme||'dark';
 applyPrincipiaTheme(current==='light'?'dark':'light');
}
function aiLink(id){
 let l=find(id,data),prompt=`Hãy đóng vai giáo viên. Dựa vào bài học sau, hãy tạo bài kiểm tra gồm trắc nghiệm, tự luận và đáp án giải thích.\n\n${l.name}\n${l.content}`;
 try{navigator.clipboard.writeText(prompt).then(()=>notify('Đã sao chép nội dung. Hãy dán vào ChatGPT.')).catch(()=>notify('Hãy mở ChatGPT và nhập nội dung bài học.'))}catch{}
 window.open('https://chatgpt.com/','_blank');
}
function backup(){
 let blob=new Blob([JSON.stringify({data,quizData,funData,profile,xp,streak,completed})],{type:'application/json'});
 let a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='halo-backup.json';a.click();URL.revokeObjectURL(a.href);
}
async function restore(file){
 if(!file)return;try{
 let o=JSON.parse(await file.text());if(!o.data)throw 0;
 data=o.data;quizData=o.quizData||quizData;funData=o.funData||funData;profile=o.profile||profile;xp=o.xp||0;streak=o.streak||0;completed=o.completed||[];saveAll();render();notify('Đã khôi phục dữ liệu');
 }catch{notify('File không hợp lệ')}
}
function resetAll(){
 if(!confirm('Khôi phục toàn bộ dữ liệu mẫu?'))return;
 data=clone(seed);quizData=clone(seedQuiz);funData=clone(seedFun);entertainmentData=clone(defaultEntertainmentData());profile={name:'Learner',avatar:''};xp=0;streak=0;completed=[];saveAll();render();notify('Đã khôi phục');
}
// Tài liệu được lưu trong IndexedDB để không làm đầy bộ nhớ cấu hình.
let dbp;
function db(){
 if(dbp)return dbp;
 dbp=new Promise((res,rej)=>{let r=indexedDB.open('HaloDocuments',1);r.onupgradeneeded=()=>r.result.createObjectStore('files',{keyPath:'id'});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
 return dbp;
}
async function attachFiles(id,files){
 if(!requireAdmin())return;
 try{let d=await db();for(let f of files){let record={id:uid(),lesson:id,name:f.name,blob:f,size:f.size};await new Promise((res,rej)=>{let tx=d.transaction('files','readwrite');tx.objectStore('files').put(record);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)})}loadFiles(id);notify('Đã thêm tài liệu')}catch{notify('Không lưu được file')}
}
async function loadFiles(id){
 let el=$('#files');if(!el)return;
 try{
  let d=await db(),all=await new Promise(res=>{let r=d.transaction('files').objectStore('files').getAll();r.onsuccess=()=>res(r.result)});
  let list=all.filter(x=>x.lesson===id).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  const destinations=lessons(data).map(l=>'<option value="'+esc(l.id)+'" '+(l.id===id?'selected':'')+'>'+esc(l.name)+'</option>').join('');
  el.innerHTML=list.length?list.map((f,i)=>'<div class="file" draggable="true" ondragstart="principiaDocDragId=\''+esc(f.id)+'\'" ondragover="event.preventDefault()" ondrop="principiaMoveDocOrder(event,\''+esc(f.id)+'\',\''+esc(id)+'\')" style="display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>📄 '+esc(f.name)+' · '+(f.size/1024/1024).toFixed(1)+' MB</span><span style="display:flex;gap:5px;align-items:center;flex-wrap:wrap"><select aria-label="Chuyển tài liệu đến bài học" onchange="principiaMoveDoc(\''+esc(f.id)+'\',this.value)" style="max-width:190px">'+destinations+'</select><button class="secondary" title="Lên một vị trí" onclick="principiaMoveDocOrder(null,\''+esc(f.id)+'\',\''+esc(id)+'\',-1)" '+(i===0?'disabled':'')+'>↑</button><button class="secondary" title="Xuống một vị trí" onclick="principiaMoveDocOrder(null,\''+esc(f.id)+'\',\''+esc(id)+'\',1)" '+(i===list.length-1?'disabled':'')+'>↓</button><button class="secondary" onclick="downloadDoc(\''+esc(f.id)+'\')">Tải</button><button class="danger" onclick="removeDoc(\''+esc(f.id)+'\',\''+esc(id)+'\')">Xóa</button></span></div>').join(''):'<p class="muted small">Chưa có tài liệu.</p>';
 }catch{el.textContent='Không tải được tài liệu'}
}
async function principiaMoveDoc(id,destination){
 if(!requireAdmin())return;
 try{
  const d=await db(),f=await new Promise(res=>{const r=d.transaction('files').objectStore('files').get(id);r.onsuccess=()=>res(r.result)});
  if(!f||!lessons(data).some(l=>l.id===destination)){notify('Không tìm thấy bài học đích');return}
  const all=await new Promise(res=>{const r=d.transaction('files').objectStore('files').getAll();r.onsuccess=()=>res(r.result)});
  f.lesson=destination;f.order=all.filter(x=>x.lesson===destination).length;
  await new Promise((res,rej)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').put(f);tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});
  loadFiles(curLessonId||destination);notify('Đã chuyển tài liệu');
 }catch{notify('Không chuyển được tài liệu')}
}
async function principiaMoveDocOrder(e,id,lesson,delta){
 if(e)e.preventDefault();
 if(!requireAdmin())return;
 try{
  const d=await db(),all=await new Promise(res=>{const r=d.transaction('files').objectStore('files').getAll();r.onsuccess=()=>res(r.result)});
  const list=all.filter(x=>x.lesson===lesson).sort((a,b)=>(Number(a.order)||0)-(Number(b.order)||0));
  let from=list.findIndex(x=>x.id===(principiaDocDragId||id));if(from<0)return;
  let to=typeof delta==='number'?from+delta:list.findIndex(x=>x.id===id);
  if(to<0||to>=list.length||to===from)return;
  const [moving]=list.splice(from,1);list.splice(to,0,moving);list.forEach((x,i)=>x.order=i);
  await new Promise((res,rej)=>{const tx=d.transaction('files','readwrite');list.forEach(x=>tx.objectStore('files').put(x));tx.oncomplete=res;tx.onerror=()=>rej(tx.error)});
  principiaDocDragId=null;loadFiles(lesson);
 }catch{notify('Không sắp xếp được tài liệu')}
}
async function downloadDoc(id){
 let d=await db(),f=await new Promise(res=>{let r=d.transaction('files').objectStore('files').get(id);r.onsuccess=()=>res(r.result)});
 if(!f)return;let url=URL.createObjectURL(f.blob),a=document.createElement('a');a.href=url;a.download=f.name;a.click();URL.revokeObjectURL(url);
}
async function removeDoc(id,lesson){
 let d=await db();await new Promise(res=>{let tx=d.transaction('files','readwrite');tx.objectStore('files').delete(id);tx.oncomplete=res});loadFiles(lesson);
}

let curSubId = null, curTabId = null, curLessonId = null, principiaDocDragId = null;
let clFiles = []; // files loaded for the currently selected lesson only
let chatImgData = null;
let lastAiCheploiText = 'AI Chép lời sẵn sàng hỗ trợ soạn lời giải, công thức hoặc dàn ý để bạn chép vào bài.';
let quickNoteText = localStorage.getItem('halo_quick_note') || '';

function showXpToast(msg){
  const t = document.getElementById('xpToast');
  if(!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showXpToast._timer);
  showXpToast._timer = setTimeout(()=>t.classList.remove('show'), 2400);
}

function openInnerLessonWorkspace(lessonId){
  const l = find(lessonId, data);
  if(!l){ openLesson(lessonId); return; }
  const ch = chain(lessonId, data);
  curSubId = ch[0]?.id || null;
  curTabId = ch[ch.length - 2]?.id || null;
  curLessonId = l.id;

  document.getElementById('app').classList.add('hidden');
  const ws = document.getElementById('codelearnWorkspace');
  ws.classList.add('active');

  const subName = ch[0]?.name || 'Học tập';
  const tabName = ch[ch.length - 2]?.name || '';
  document.getElementById('clTitle').textContent = `${subName}${tabName ? ' / ' + tabName : ''} — ${l.name}`;
  document.getElementById('clLessonHeading').textContent = l.name;
  document.getElementById('clNoteArea').value = (l.note !== undefined ? l.note : (l.content || ''));
  const transcriptEl=document.getElementById('ytTranscript'); if(transcriptEl) transcriptEl.value=l.transcript||''; const translatedTranscriptEl=document.getElementById('ytTranslatedTranscript');if(translatedTranscriptEl)translatedTranscriptEl.value=l.translatedTranscript||'';const ocrEl=document.getElementById('ytOcrText');if(ocrEl)ocrEl.value=l.videoOcr||'';const dubLangEl=document.getElementById('ytDubLang');if(dubLangEl)dubLangEl.value=l.dubLang||'vi';
  const summaryEl=document.getElementById('ytSummaryOutput'); if(summaryEl) summaryEl.textContent=l.summary||'Tóm tắt sẽ hiển thị ở đây sau khi bạn thêm transcript.';
  document.getElementById('clVideoUrlInput').value = l.video || '';
  const phetFrame = document.getElementById('phetFrame');
  if (phetFrame) {
    // Keep the subject URL pending; do not start the third-party iframe until its tab is opened.
    phetFrame.dataset.principiaPendingSrc = (ch[0]?.id === 'math')
      ? 'https://phet.colorado.edu/vi/simulations/filter?subjects=math&type=html'
      : (ch[0]?.id === 'chem')
      ? 'https://phet.colorado.edu/vi/simulations/filter?subjects=chemistry&type=html'
      : 'https://phet.colorado.edu/vi/simulations/filter?subjects=physics&type=html';
    phetFrame.removeAttribute('src');
  }

  const sibs = parentOf(l.id, data)?.children?.filter(x => x.type === 'lesson') || [l];
  const steps = document.getElementById('clStepNumbers');
  steps.innerHTML = '';
  sibs.forEach((item, idx) => {
    const b = document.createElement('button');
    b.className = 'cl-step' + (item.id === l.id ? ' active' : '') + (completed.includes(item.id) ? ' done' : '');
    b.textContent = idx + 1;
    b.onclick = () => openInnerLessonWorkspace(item.id);
    steps.appendChild(b);
  });

  document.getElementById('clLessonListBox').innerHTML = sibs.map((item, idx) => `
    <div onclick="openInnerLessonWorkspace('${item.id}')" style="padding:8px 10px; border:1px solid var(--line); border-radius:8px; margin-bottom:6px; cursor:pointer; background:${item.id===l.id?'var(--card2)':'var(--card)'};">
      ${idx+1}. ${esc(item.name)} ${completed.includes(item.id) ? '✓' : ''}
    </div>
  `).join('');

  clFiles = [];
  renderInnerFiles();
  loadLessonWorkspaceFiles(l.id);
  if(l.video){ playVideoInRightPane(); }
  else { document.getElementById('clVideoStage').innerHTML = '<p style="color:#94a3b8; font-size:13.5px;">Bài này chưa có video. Dán link YouTube ở trên rồi bấm Phát.</p>'; }
}

function exitCodelearnWorkspace(){
  document.getElementById('codelearnWorkspace').classList.remove('active');
  document.getElementById('app').classList.remove('hidden');
  render();
}

function switchClLeftTab(t){
  const valid=['note','list','files','grade','phet'];if(!valid.includes(t))return;
  document.querySelectorAll('.cl-ico-btn').forEach(b=>b.classList.toggle('active',b.dataset.t===t));
  valid.forEach(id=>{const panel=document.getElementById('clTab-'+id);if(panel){panel.hidden=id!==t;panel.style.display=id===t?'block':'none';}});
  const pane=document.getElementById('clLeftPane');if(pane)pane.classList.remove('cl-pane-hidden');
  // Heavy scientific/lab modules are fetched only when the learner opens this tab.
  if(t==='phet'){
    const panel=document.getElementById('clTab-phet');
    if(panel&&!panel.dataset.principiaLabsLoading&&!panel.dataset.principiaLabsReady){
      panel.dataset.principiaLabsLoading='1';
      const labScripts=[
        '/assets/js/physics-engine.js?v=1.3.1',
        '/assets/js/principia-external-labs.js?v=1.0.1',
        '/assets/js/principia-robotics-lab.js?v=1.0.1',
        '/assets/js/principia-data-lab.js?v=1.0.1'
      ];
      // Keep the feature usable even if the optional performance helper failed to load.
      const loadLabScripts=window.PrincipiaPerformance?.loadScripts
        ? window.PrincipiaPerformance.loadScripts(labScripts)
        : labScripts.reduce((chain,src)=>chain.then(()=>new Promise((resolve,reject)=>{
            const existing=Array.from(document.scripts).find(s=>s.dataset.principiaLabSrc===src);
            if(existing?.dataset.loaded==='true'){resolve(existing);return;}
            const script=existing||document.createElement('script');
            script.async=false;
            script.dataset.principiaLabSrc=src;
            script.onload=()=>{script.dataset.loaded='true';resolve(script);};
            script.onerror=()=>{script.remove();reject(new Error('Không tải được mô-đun: '+src));};
            if(!existing){script.src=src;document.head.appendChild(script);}
          })),Promise.resolve());
      loadLabScripts.then(()=>{
        panel.dataset.principiaLabsReady='1';
        const frame=document.getElementById('phetFrame');
        const pending=frame?.dataset.principiaPendingSrc;
        // The learner may have left the lab tab while scripts were downloading.
        if(!panel.hidden&&frame&&pending){frame.src=pending;delete frame.dataset.principiaPendingSrc;}
        else if(!panel.hidden&&typeof window.changePhetSrc==='function')window.changePhetSrc();
      }).catch(error=>{
        delete panel.dataset.principiaLabsLoading;
        console.error('[PRINCIPIA] Không tải được phòng thí nghiệm:',error);
        if(typeof notify==='function')notify('Không tải được mô-đun phòng thí nghiệm. Hãy thử mở lại tab.');
      }).finally(()=>{delete panel.dataset.principiaLabsLoading;});
    } else if(panel?.dataset.principiaLabsReady==='1') {
      const frame=document.getElementById('phetFrame');
      const pending=frame?.dataset.principiaPendingSrc;
      if(frame&&pending){frame.src=pending;delete frame.dataset.principiaPendingSrc;}
    }
  }
}

function saveTranscript(){
 if(!requirePermission('media'))return;if(!curLessonId)return;const l=find(curLessonId,data);if(l){l.transcript=document.getElementById('ytTranscript')?.value||'';saveAll();}}
function clearTranscript(){
 if(!requirePermission('media'))return;const el=document.getElementById('ytTranscript');if(el)el.value='';saveTranscript();notify('Đã xóa transcript');}
function copyTranscriptToNote(){const transcript=document.getElementById('ytTranscript')?.value||'';const note=document.getElementById('clNoteArea');if(!transcript.trim()){notify('Chưa có transcript để chép');return;}note.value+=(note.value?'\n\n':'')+transcript;saveClNote();notify('Đã chép transcript vào ghi chú');}
function saveVideoTranslation(){if(!curLessonId)return;const l=find(curLessonId,data);if(!l)return;l.translatedTranscript=document.getElementById('ytTranslatedTranscript')?.value||'';l.dubLang=document.getElementById('ytDubLang')?.value||'vi';saveAll();}
function stopVideoSpeech(){if('speechSynthesis'in window)window.speechSynthesis.cancel();}
function speakVideoText(mode){if(!('speechSynthesis'in window)){notify('Trình duyệt chưa hỗ trợ đọc văn bản');return;}const original=document.getElementById('ytTranscript')?.value||'',translated=document.getElementById('ytTranslatedTranscript')?.value||'';const lang=document.getElementById('ytDubLang')?.value||'vi';const chunks=mode==='original'?[{text:original,lang:'en-US'}]:mode==='translated'?[{text:translated,lang:lang==='vi'?'vi-VN':lang}]:[{text:original,lang:'en-US'},{text:translated,lang:lang==='vi'?'vi-VN':lang}];if(chunks.every(x=>!x.text.trim())){notify('Chưa có lời thoại');return;}stopVideoSpeech();chunks.filter(x=>x.text.trim()).forEach(x=>{const u=new SpeechSynthesisUtterance(x.text);u.lang=x.lang;window.speechSynthesis.speak(u);});}
async function translateTextOnline(text,source,target){const parts=text.match(/[\\s\\S]{1,430}(?:\\s|$)/g)||[text];const out=[];for(let i=0;i<parts.length;i++){const q=parts[i].trim();if(!q)continue;const pair=(source==='auto'?'en':source)+'|'+target;const url='https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair='+encodeURIComponent(pair);const res=await fetch(url);if(!res.ok)throw new Error('Dịch vụ dịch đang bận ('+res.status+')');const json=await res.json();if(json.responseStatus!==200)throw new Error(json.responseDetails||'Không dịch được đoạn văn');out.push(json.responseData.translatedText||'');}return out.join(' ');}
async function translateVideoTranscript(){const src=document.getElementById('ytTranscript')?.value.trim()||'',out=document.getElementById('ytTranslatedTranscript'),status=document.getElementById('ytOcrStatus');if(!src){notify('Hãy nhập transcript trước');return;}const btn=document.querySelector('button[onclick="translateVideoTranscript()"]');if(btn){btn.disabled=true;btn.textContent='Đang dịch…';}try{const source=document.getElementById('ytSourceLang')?.value||'en',target=document.getElementById('ytDubLang')?.value||'vi';out.value=await translateTextOnline(src,source,target);saveVideoTranslation();notify('Đã dịch lời thoại');}catch(e){notify('Dịch thất bại: '+e.message);}finally{if(btn){btn.disabled=false;btn.textContent='✦ Dịch lời thoại tự động';}}}
function saveVideoOcr(){if(!curLessonId)return;const l=find(curLessonId,data);if(l){l.videoOcr=document.getElementById('ytOcrText')?.value||'';saveAll();}}
let ytOcrObjectUrl='',ytLiveOcrWorker=null,ytLiveOcrRunning=false,ytLiveOcrBusy=false,ytLiveOcrTimer=null,ytLastOcrText='',ytLiveImageTranslate=true;
document.addEventListener('change',e=>{if(e.target?.id!=='ytVideoFile')return;const file=e.target.files?.[0];if(!file)return;if(ytOcrObjectUrl)URL.revokeObjectURL(ytOcrObjectUrl);ytOcrObjectUrl=URL.createObjectURL(file);const v=document.getElementById('ytOcrVideo');v.src=ytOcrObjectUrl;v.style.display='block';const st=document.getElementById('ytOcrStatus');if(st)st.textContent=file.name;v.onplay=()=>startLiveVideoOcr();v.onpause=()=>stopLiveVideoOcr(false);v.onended=()=>stopLiveVideoOcr(false);});
function toggleLiveVideoOcr(on){if(on){const v=document.getElementById('ytOcrVideo');if(v&&!v.paused)startLiveVideoOcr();else setLiveImageStatus('Bật OCR · phát video để nhận diện chữ');}else stopLiveVideoOcr(true);}
function toggleLiveImageTranslation(on){ytLiveImageTranslate=!!on;setLiveImageStatus(on?'Đã bật tự dịch chữ trong hình':'Đã tắt dịch tự động · vẫn nhận diện và chép chữ gốc');}
function setLiveImageStatus(msg){const el=document.getElementById('ytLiveImageStatus');if(el)el.textContent=msg;}
function startLiveVideoOcr(){if(ytLiveOcrRunning)return;const toggle=document.getElementById('ytLiveOcrToggle'),v=document.getElementById('ytOcrVideo');if(toggle&&!toggle.checked)return;if(!v?.src||v.paused)return;ytLiveOcrRunning=true;setLiveImageStatus('Đang khởi động nhận diện chữ trực tiếp…');runLiveVideoOcr();}
function stopLiveVideoOcr(showMessage=true){ytLiveOcrRunning=false;clearTimeout(ytLiveOcrTimer);if(showMessage)setLiveImageStatus('Đã tắt nhận diện hình ảnh trực tiếp');}
async function runLiveVideoOcr(){if(!ytLiveOcrRunning||ytLiveOcrBusy)return;const v=document.getElementById('ytOcrVideo');if(!v||v.paused||v.ended){stopLiveVideoOcr(false);return;}ytLiveOcrBusy=true;try{if(!ytLiveOcrWorker){const T=await loadTesseract();ytLiveOcrWorker=await T.createWorker('eng+vie');}if(!ytLiveOcrRunning)return;const canvas=document.createElement('canvas'),w=Math.min(v.videoWidth||960,960);canvas.width=w;canvas.height=Math.round(w*(v.videoHeight||540)/(v.videoWidth||960));canvas.getContext('2d').drawImage(v,0,0,canvas.width,canvas.height);const result=await ytLiveOcrWorker.recognize(canvas);const raw=(result.data.text||'').replace(/\\s+/g,' ').trim();if(raw&&raw!==ytLastOcrText&&raw.length>2){ytLastOcrText=raw;const orig=document.getElementById('ytOcrText');if(orig){orig.value+=(orig.value?'\\n':'')+'['+Math.floor(v.currentTime)+'s] '+raw;saveVideoOcr();}let caption=raw;if(ytLiveImageTranslate){try{caption=await translateTextOnline(raw,document.getElementById('ytSourceLang')?.value||'en',document.getElementById('ytDubLang')?.value||'vi');}catch(e){caption=raw+'\\n(Dịch lỗi: '+e.message+')';}}const box=document.getElementById('ytLiveImageCaption');if(box){box.textContent=caption;box.style.display='block';}setLiveImageStatus(ytLiveImageTranslate?'Đã nhận diện và dịch chữ · '+Math.floor(v.currentTime)+' giây':'Đã nhận diện chữ gốc · dịch đang tắt');}}catch(e){setLiveImageStatus('OCR trực tiếp lỗi: '+e.message);}finally{ytLiveOcrBusy=false;if(ytLiveOcrRunning)ytLiveOcrTimer=setTimeout(runLiveVideoOcr,2200);}}

async function loadTesseract(){if(window.Tesseract)return window.Tesseract;await new Promise((resolve,reject)=>{const sc=document.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';sc.onload=resolve;sc.onerror=()=>reject(new Error('Không tải được thư viện OCR'));document.head.appendChild(sc);});return window.Tesseract;}
async function scanVideoFramesOCR(){const v=document.getElementById('ytOcrVideo'),out=document.getElementById('ytOcrText'),status=document.getElementById('ytOcrStatus');if(!v?.src){notify('Hãy chọn video từ máy trước');return;}if(!v.videoWidth){await new Promise((resolve,reject)=>{v.onloadedmetadata=resolve;v.onerror=reject;});}const T=await loadTesseract();status.textContent='Đang khởi tạo OCR…';const worker=await T.createWorker('eng+vie');const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d');canvas.width=Math.min(v.videoWidth,1280);canvas.height=Math.round(canvas.width*v.videoHeight/v.videoWidth);const found=[];const duration=Math.max(1,v.duration||1),step=Math.max(2,Math.ceil(duration/30));try{for(let t=0;t<duration;t+=step){if(Math.abs(v.currentTime-t)>0.15){await new Promise(resolve=>{const done=()=>{v.removeEventListener('seeked',done);resolve();};v.addEventListener('seeked',done,{once:true});v.currentTime=t;});}ctx.drawImage(v,0,0,canvas.width,canvas.height);const result=await worker.recognize(canvas);const text=(result.data.text||'').trim();if(text&&(!found.length||found[found.length-1].text!==text))found.push({time:t,text});status.textContent='Đã quét '+Math.min(t+step,duration).toFixed(0)+'/'+duration.toFixed(0)+' giây';}out.value=found.map(x=>'['+new Date(x.time*1000).toISOString().substring(14,19)+'] '+x.text).join('\\n');saveVideoOcr();status.textContent='Hoàn tất · '+found.length+' khung hình có chữ';notify('Đã nhận diện chữ trong video');}catch(e){notify('OCR lỗi: '+e.message);}finally{await worker.terminate();}}
async function translateVideoOcr(){const out=document.getElementById('ytOcrText'),src=out?.value.trim();if(!src){notify('Chưa có chữ để dịch');return;}try{const translated=await translateTextOnline(src,document.getElementById('ytSourceLang')?.value||'en',document.getElementById('ytDubLang')?.value||'vi');out.value=src+'\\n\\n— BẢN DỊCH —\\n'+translated;saveVideoOcr();notify('Đã dịch chữ trong hình');}catch(e){notify('Dịch OCR thất bại: '+e.message);}}
function startVideoVoiceover(){const text=document.getElementById('ytTranslatedTranscript')?.value.trim();if(!text){notify('Hãy dịch hoặc nhập bản dịch trước');return;}stopVideoSpeech();const lang=document.getElementById('ytDubLang')?.value||'vi';const v=document.getElementById('ytOcrVideo');if(v?.src&&v.paused)v.play().catch(()=>{});const utterance=new SpeechSynthesisUtterance(text);utterance.lang=lang==='vi'?'vi-VN':lang;utterance.rate=1;window.speechSynthesis.speak(utterance);notify('Đang phát giọng đọc bản dịch');}
let ytLiveRecognition=null,ytLiveRunning=false,ytLiveQueue=Promise.resolve(),ytLiveRestartTimer=null;
function liveSpeechLang(){const v=document.getElementById('ytSourceLang')?.value||'en';return ({auto:'',en:'en-US',vi:'vi-VN',ja:'ja-JP',ko:'ko-KR',zh:'zh-CN',fr:'fr-FR'})[v]||'en-US';}
function startLiveVideoCaption(){const SR=window.SpeechRecognition||window.webkitSpeechRecognition;if(!SR){notify('Trình duyệt này chưa hỗ trợ nhận diện giọng nói trực tiếp. Hãy dùng Chrome.');return;}if(!requirePermission('media'))return;stopLiveVideoCaption();ytLiveRunning=true;const start=document.getElementById('ytLiveStart'),stop=document.getElementById('ytLiveStop'),status=document.getElementById('ytLiveStatus');if(start)start.disabled=true;if(stop)stop.disabled=false;if(status)status.textContent='Đang yêu cầu quyền micro…';const rec=new SR();ytLiveRecognition=rec;rec.lang=liveSpeechLang()||'en-US';rec.continuous=true;rec.interimResults=true;rec.onstart=()=>{if(status)status.textContent='Đang nghe micro · hãy phát video bằng loa';};rec.onerror=e=>{if(status)status.textContent='Lỗi nhận diện: '+e.error+' · kiểm tra quyền micro';};rec.onresult=e=>{let interim='';for(let i=e.resultIndex;i<e.results.length;i++){const phrase=e.results[i][0].transcript.trim();if(e.results[i].isFinal&&phrase){appendLiveOriginal(phrase);queueLiveTranslation(phrase);}else interim+=phrase+' ';}if(status&&interim)status.textContent='Đang nghe: '+interim;};rec.onend=()=>{if(ytLiveRunning){clearTimeout(ytLiveRestartTimer);ytLiveRestartTimer=setTimeout(()=>{try{if(ytLiveRunning)rec.start()}catch(e){}},350);}else{if(start)start.disabled=false;if(stop)stop.disabled=true;}};try{rec.start()}catch(e){ytLiveRunning=false;if(start)start.disabled=false;if(stop)stop.disabled=true;notify('Không khởi động được micro: '+e.message);}}
function appendLiveOriginal(phrase){const el=document.getElementById('ytLiveOriginal');if(el){el.value+=(el.value?'\\n':'')+phrase;el.scrollTop=el.scrollHeight;}}
function queueLiveTranslation(phrase){ytLiveQueue=ytLiveQueue.then(async()=>{try{const target=document.getElementById('ytDubLang')?.value||'vi';const translated=await translateTextOnline(phrase,document.getElementById('ytSourceLang')?.value||'en',target);const el=document.getElementById('ytLiveTranslated');if(el){el.value+=(el.value?'\\n':'')+translated;el.scrollTop=el.scrollHeight;}if('speechSynthesis'in window&&ytLiveRunning){const u=new SpeechSynthesisUtterance(translated);u.lang=target==='vi'?'vi-VN':target;u.rate=1;window.speechSynthesis.speak(u);}const status=document.getElementById('ytLiveStatus');if(status)status.textContent='Đang dịch & đọc · câu vừa nhận: '+translated;}catch(e){const status=document.getElementById('ytLiveStatus');if(status)status.textContent='Lỗi dịch: '+e.message;}});}
function stopLiveVideoCaption(){ytLiveRunning=false;clearTimeout(ytLiveRestartTimer);if(ytLiveRecognition){try{ytLiveRecognition.onend=null;ytLiveRecognition.stop()}catch(e){}ytLiveRecognition=null;}if('speechSynthesis'in window)window.speechSynthesis.cancel();const start=document.getElementById('ytLiveStart'),stop=document.getElementById('ytLiveStop'),status=document.getElementById('ytLiveStatus');if(start)start.disabled=false;if(stop)stop.disabled=true;if(status)status.textContent='Đã dừng · bản chép lời được giữ lại';}
function copyLiveCaptionToTranscript(){const live=document.getElementById('ytLiveOriginal')?.value||'';const translated=document.getElementById('ytLiveTranslated')?.value||'';const orig=document.getElementById('ytTranscript'),trans=document.getElementById('ytTranslatedTranscript');if(!live){notify('Chưa có lời thoại được nhận diện');return;}if(orig){orig.value+=(orig.value?'\\n':'')+live;saveTranscript();}if(trans){trans.value+=(trans.value?'\\n':'')+translated;saveVideoTranslation();}notify('Đã chép lời gốc và bản dịch vào bài học');}
function summarizeTranscript(){
 if(!requirePermission('media'))return;const text=(document.getElementById('ytTranscript')?.value||'').trim();if(!text){notify('Hãy dán transcript trước');return;}const chunks=text.split(/(?<=[.!?])\s+/).filter(Boolean);const summary=chunks.length<=5?chunks.join('\n'):chunks.slice(0,2).concat(chunks.slice(Math.max(2,Math.floor(chunks.length*.6)),Math.max(3,Math.floor(chunks.length*.6))+2)).join('\n');const out=document.getElementById('ytSummaryOutput');if(out)out.textContent='TÓM TẮT (bản trích ý tự động — chưa kết nối AI thật):\n'+summary+'\n\nÝ chính: '+chunks.slice(0,Math.min(3,chunks.length)).join(' ');if(curLessonId){const l=find(curLessonId,data);if(l){l.summary=out?.textContent||summary;saveAll();}}notify('Đã tạo tóm tắt sơ bộ');}
function runAiCheploi(){
  const inp = document.getElementById('aiCheploiPrompt');
  const topic = inp.value.trim() || document.getElementById('clLessonHeading').textContent || 'Bài học';
  const reply = `[AI Chép lời] Dàn ý & ghi chép cho "${topic}":\n1. Tóm tắt giả thiết, biến số & điều kiện.\n2. Công thức / định luật cốt lõi áp dụng.\n3. Các bước biến đổi & kiểm tra đơn vị kết quả.`;
  lastAiCheploiText = reply;
  document.getElementById('aiCheploiOutput').innerText = reply;
  inp.value = '';
  xp += 10;dailyReward(); saveAll();
  showXpToast('+10 XP · AI Chép lời');
}

function copyAiCheploiIntoNote(){
  const ta = document.getElementById('clNoteArea');
  ta.value = (ta.value ? ta.value + '\n\n' : '') + lastAiCheploiText;
  saveClNote();
  showXpToast('Đã chép nội dung vào bài');
}

function toggleNotePopPanel(forceState){
  const panel = document.getElementById('notePopPanel');
  const btn = document.getElementById('toggleNotePopBtn');
  const next = typeof forceState === 'boolean' ? forceState : !panel.classList.contains('open');
  panel.classList.toggle('open', next);
  btn.classList.toggle('primary', !next);
  document.getElementById('quickPopNoteArea').value = quickNoteText || '';
}

function saveQuickPopNote(){
  quickNoteText = document.getElementById('quickPopNoteArea').value;
  localStorage.setItem('halo_quick_note', quickNoteText);
}

function pushPopNoteToMain(){
  const popVal = document.getElementById('quickPopNoteArea').value.trim();
  if(!popVal) return;
  const ta = document.getElementById('clNoteArea');
  ta.value = (ta.value ? ta.value + '\n\n' : '') + popVal;
  saveClNote();
  showXpToast('Đã đưa ghi chú Note lên khung chính');
}

function saveClNote(){
  if(!curLessonId) return;
  const l = find(curLessonId, data);
  if(l){
    l.note = document.getElementById('clNoteArea').value;
    l.content = l.note;
    saveAll();
  }
}

function markLessonDone(){
  if(!curLessonId) return;
  if(!completed.includes(curLessonId)){
    completed.push(curLessonId);
    xp += 50;
    dailyReward();
    saveAll();
    showXpToast('+50 XP · Bài học hoàn thành');
  } else {
    xp += 15;dailyReward();
    saveAll();
    showXpToast('+15 XP · Ôn luyện thêm');
  }
  openInnerLessonWorkspace(curLessonId);
}

function addLessonInTab(){
 if(!requireAdmin())return;
  const name = prompt('Tên bài học:');
  if(!name || !curLessonId) return;
  const parent = parentOf(curLessonId, data);
  const newId = uid();
  if(parent && Array.isArray(parent.children)){
    parent.children.push({ id: newId, name, icon: '📘', type: 'lesson', content: '', note: '', video: '', quiz: [] });
  } else {
    data.push({ id: newId, name, icon: '📘', type: 'lesson', content: '', note: '', video: '', quiz: [] });
  }
  saveAll();
  openInnerLessonWorkspace(newId);
}

function toEmbedUrl(raw){
  if(!raw) return '';
  raw = raw.trim();
  const m = raw.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
  if(m){let acc=null;try{acc=JSON.parse(localStorage.getItem('principia_google_account')||'null')}catch(e){}const auth=acc?.email?'&authuser='+encodeURIComponent(acc.email):'';return `https://www.youtube.com/embed/${m[1]}?${auth?auth.slice(1):''}`;}
  if(!/^https?:\/\//i.test(raw) && !raw.startsWith('blob:')) return 'https://' + raw;
  return raw;
}

function playVideoInRightPane(){
  const input=document.getElementById('clVideoUrlInput'),stage=document.getElementById('clVideoStage');if(!input||!stage)return;
  const raw=input.value.trim(),url=toEmbedUrl(raw);if(!url)return;
  if(curLessonId&&isPrincipiaAdmin()){const l=find(curLessonId,data);if(l&&l.video!==raw){l.video=raw;saveAll();}}
  stage.innerHTML=`<iframe title="Video bài học" src="${esc(url)}" style="width:100%;height:100%;min-height:420px;border:0" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share" allowfullscreen></iframe>`;
}

function swapClPanes(){ document.getElementById('clSplit').classList.toggle('swapped'); }
function toggleClPane(side){
  document.getElementById(side === 'left' ? 'clLeftPane' : 'clRightPane').classList.toggle('cl-pane-hidden');
}

(function initDividerDrag(){
  const divider = document.getElementById('clDivider');
  if(!divider) return;
  let dragging = false;
  divider.addEventListener('mousedown', ()=> dragging = true);
  window.addEventListener('mousemove', (e)=>{
    if(!dragging) return;
    const rect = document.getElementById('clSplit').getBoundingClientRect();
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    if(document.getElementById('clSplit').classList.contains('swapped')) pct = 100 - pct;
    document.getElementById('clLeftPane').style.width = Math.max(20, Math.min(80, pct)) + '%';
  });
  window.addEventListener('mouseup', ()=> dragging = false);
})();

function changePhetSrc(){
  document.getElementById('phetFrame').src = document.getElementById('phetSubjectPicker').value;
}

async function addFilesToList(e){
 if(!requireAdmin())return;
  const files=Array.from(e.target.files||[]); if(!files.length||!curLessonId)return;
  try{
    const d=await db();
    for(const f of files){
      const rec={id:uid(),lesson:curLessonId,name:f.name,blob:f,size:f.size,type:f.type||'',created:Date.now(),workspaceFile:true};
      await new Promise((resolve,reject)=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').put(rec);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});
    }
    await loadLessonWorkspaceFiles(curLessonId); notify('Đã lưu file cho bài học này');
  }catch(err){notify('Không lưu được file đính kèm');}
  e.target.value='';
}
async function loadLessonWorkspaceFiles(lessonId){
  const box=document.getElementById('clUserFilesBox'); if(!box)return;
  try{
    const d=await db();
    const list=await new Promise(resolve=>{const r=d.transaction('files').objectStore('files').getAll();r.onsuccess=()=>resolve(r.result.filter(x=>x.lesson===lessonId&&x.workspaceFile));r.onerror=()=>resolve([]);});
    clFiles=list; renderInnerFiles();
  }catch{clFiles=[];renderInnerFiles();}
}
function renderInnerFiles(){
  const box=document.getElementById('clUserFilesBox'); if(!box)return;
  if(!clFiles.length){box.innerHTML='<p class="small muted">Bài học này chưa có file. Thêm file ở trên để lưu riêng cho bài này.</p>';return;}
  box.innerHTML=clFiles.map((f,i)=>`<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding:8px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px;"><span style="font-size:13px;overflow-wrap:anywhere;">📎 ${esc(f.name)} <span class="muted">(${Math.round((f.size||0)/1024)} KB)</span></span><span><button class="secondary" onclick="openInnerFileRight(${i})">Xem</button> <button class="danger" onclick="removeLessonWorkspaceFile(${i})">Xóa</button></span></div>`).join('');
}
async function openInnerFileRight(i){
  const f=clFiles[i]; if(!f||!f.blob)return;
  const url=URL.createObjectURL(f.blob); const stage=document.getElementById('clVideoStage'); if(!stage)return;
  const isImage=(f.type||'').startsWith('image/'); const isPdf=(f.type||'').includes('pdf')||/\.pdf$/i.test(f.name);
  if(isImage){stage.innerHTML=`<img src="${url}" alt="${esc(f.name)}" style="max-width:100%;max-height:80vh;object-fit:contain;">`;}
  else if(isPdf){stage.innerHTML=`<iframe src="${url}" style="width:100%;height:100%;min-height:420px;border:0"></iframe>`;}
  else {stage.innerHTML=`<div style="padding:24px;text-align:center"><p>File: ${esc(f.name)}</p><a href="${url}" download="${esc(f.name)}" class="oli-btn primary">Tải / mở file</a></div>`;}
}
async function removeLessonWorkspaceFile(i){
 if(!requirePermission('media'))return;
  const f=clFiles[i]; if(!f)return;
  try{const d=await db();await new Promise(resolve=>{const tx=d.transaction('files','readwrite');tx.objectStore('files').delete(f.id);tx.oncomplete=resolve;});await loadLessonWorkspaceFiles(curLessonId);notify('Đã xóa file khỏi bài học');}catch{notify('Không xóa được file');}
}

function previewGradeFiles(files){
  const box=document.getElementById('gradeFilesPreview'); if(!box)return;
  const list=Array.from(files||[]);
  if(!list.length){box.innerHTML='Chưa đính kèm file.';return;}
  box.innerHTML=list.map(f=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--line)"><span>📎</span><span>${esc(f.name)} <span class="muted">(${Math.round(f.size/1024)} KB)</span></span></div>`).join('');
}
function runAiGrade(){
  const ai = document.getElementById('gradeAiChoice').value;
  const text = document.getElementById('gradeTextInput').value.trim();
  const files = Array.from(document.getElementById('gradeFiles')?.files||[]);
  if(!text&&!files.length){notify('Hãy nhập bài làm hoặc đính kèm ảnh / file trước nhé');return;}
  xp += 30;dailyReward(); saveAll();
  showXpToast('+30 EXP · Gửi bài');
  companionReact('happy','Đã gửi bài làm để chấm điểm! Cố lên nhé ✨');
  document.getElementById('gradeOutputBox').innerHTML = `<div class="panel"><strong>${esc(ai)}:</strong> Đã nhận bài làm${files.length?` và ${files.length} file đính kèm`:''}. <span class="muted">Bản HTML hiện tại chỉ mô phỏng phản hồi chấm, chưa kết nối AI thực để đọc ảnh/file.</span></div>`;
}

const PRINCIPIA_DEFAULT_AIS=[{id:'assistant',name:'PRINCIPIA AI',url:'https://chatgpt.com/',mark:'P',desc:'Trợ lý tổng quát'},{id:'physics',name:'AI Vật lý',url:'https://chatgpt.com/',mark:'⚛',desc:'Hỗ trợ Vật lý'},{id:'math',name:'AI Toán học',url:'https://chatgpt.com/',mark:'∑',desc:'Hỗ trợ Toán học'},{id:'chatgpt',name:'ChatGPT',url:'https://chatgpt.com/',mark:'GPT',desc:'OpenAI'},{id:'gemini',name:'Gemini',url:'https://gemini.google.com/',mark:'✦',desc:'Google'},{id:'claude',name:'Claude',url:'https://claude.ai/',mark:'C',desc:'Anthropic'},{id:'deepseek',name:'DeepSeek',url:'https://chat.deepseek.com/',mark:'DS',desc:'DeepSeek'}];
function principiaAIList(){try{const v=JSON.parse(localStorage.getItem('principia_ai_list')||'null');return Array.isArray(v)?v:PRINCIPIA_DEFAULT_AIS.map(x=>({...x}))}catch(e){return PRINCIPIA_DEFAULT_AIS.map(x=>({...x}))}}
let principiaSelectedAI=localStorage.getItem('principia_ai_selected')||'assistant';
function principiaChatHistoryKey(){const a=getPrincipiaAccount?.();return 'principia_chat_history_'+(a?.uid||a?.email||'guest')+'_'+principiaSelectedAI}
function principiaChatHistory(){try{const v=JSON.parse(localStorage.getItem(principiaChatHistoryKey())||'[]');return Array.isArray(v)?v:[]}catch(e){return []}}
function savePrincipiaChatHistory(items){try{localStorage.setItem(principiaChatHistoryKey(),JSON.stringify(items.slice(-100)))}catch(e){notify('Lịch sử đầy bộ nhớ; hãy xóa bớt tin nhắn cũ')}}
function renderPrincipiaChatHistory(){const box=document.getElementById('chatMsgs');if(!box)return;const items=principiaChatHistory();box.innerHTML=items.length?items.map(m=>'<div class="'+(m.role==='user'?'m-user':'m-ai')+'">'+esc(m.text||'')+(m.image?'<div class="small" style="margin-top:5px">📎 '+esc(m.image)+'</div>':'')+'</div>').join(''):'<div class="ai-chat-sub" style="text-align:center;padding:24px 10px">Chưa có tin nhắn. Chọn AI ở phía trên rồi bắt đầu trò chuyện nhé.</div>';box.scrollTop=box.scrollHeight}
function renderPrincipiaAIChoices(){const sel=document.getElementById('principiaAISelect');const list=principiaAIList();if(!list.some(x=>x.id===principiaSelectedAI))principiaSelectedAI=list[0]?.id||'';if(sel){sel.innerHTML=list.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+'</option>').join('');sel.value=principiaSelectedAI}renderPrincipiaChatHistory()}
function clearPrincipiaChatHistory(){if(!confirm('Xóa lịch sử chat của AI đang chọn trên thiết bị này?'))return;localStorage.removeItem(principiaChatHistoryKey());renderPrincipiaChatHistory()}
function selectPrincipiaAI(id){const list=principiaAIList();if(!list.some(x=>x.id===id))return;principiaSelectedAI=id;localStorage.setItem('principia_ai_selected',id);renderPrincipiaAIChoices();const x=list.find(a=>a.id===id);notify('Đã chọn '+x.name)}
function addPrincipiaAI(){modal('<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px"><h3 style="margin:0">Thêm AI mới</h3><button class="iconbtn" onclick="closeModal()">✕</button></div><label class="lbl">Tên AI</label><input id="newAIName" class="inp" placeholder="Ví dụ: Perplexity"><label class="lbl" style="display:block;margin-top:10px">Địa chỉ website</label><input id="newAIUrl" class="inp" placeholder="https://..."><div style="display:flex;justify-content:flex-end;gap:8px;margin-top:15px"><button class="secondary" onclick="closeModal()">Hủy</button><button class="primary" onclick="savePrincipiaAI()">＋ Thêm AI</button></div>')}
function savePrincipiaAI(){const name=document.getElementById('newAIName')?.value.trim(),raw=document.getElementById('newAIUrl')?.value.trim();if(!name||!raw){notify('Nhập tên và địa chỉ AI nhé');return}let url=raw;if(!/^https?:\/\//i.test(url))url='https://'+url;try{const u=new URL(url);if(!['http:','https:'].includes(u.protocol))throw 0;url=u.href}catch(e){notify('Địa chỉ website chưa hợp lệ');return}const list=principiaAIList();const id='custom_'+Date.now().toString(36);list.push({id,name,url,mark:name.slice(0,2).toUpperCase(),desc:'AI tùy chỉnh'});localStorage.setItem('principia_ai_list',JSON.stringify(list));principiaSelectedAI=id;localStorage.setItem('principia_ai_selected',id);closeModal();renderPrincipiaAIChoices();notify('Đã thêm '+name)}
function removePrincipiaAI(id){const list=principiaAIList(),item=list.find(x=>x.id===id);if(!item)return;if(!confirm('Xóa '+item.name+' khỏi danh sách AI?'))return;const next=list.filter(x=>x.id!==id);localStorage.setItem('principia_ai_list',JSON.stringify(next));if(principiaSelectedAI===id){principiaSelectedAI=next[0]?.id||'';localStorage.setItem('principia_ai_selected',principiaSelectedAI)}renderPrincipiaAIChoices();notify('Đã xóa AI')}
function refreshPrincipiaChatCharacter(){if(window.refreshPrincipiaChatCharacter)window.refreshPrincipiaChatCharacter();}
function toggleChatBox(){window.refreshPrincipiaChatCharacter?.();const box=document.getElementById('chatBox');box.classList.toggle('open');if(box.classList.contains('open')){renderPrincipiaAIChoices();setTimeout(()=>document.getElementById('chatInput')?.focus(),0)}}
document.addEventListener('click',e=>{const box=document.getElementById('chatBox'),fab=document.querySelector('.chat-bubble-btn');if(box?.classList.contains('open')&&!box.contains(e.target)&&!fab?.contains(e.target))box.classList.remove('open')});
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.getElementById('chatBox')?.classList.remove('open')});
chatImgData=null;
function attachChatImg(e){const f=e.target.files?.[0];if(!f)return;if(!f.type.startsWith('image/')){notify('Vui lòng chọn ảnh');return}if(f.size>5*1024*1024){notify('Ảnh tối đa 5 MB');return}const r=new FileReader();r.onload=()=>{chatImgData=r.result;const n=document.getElementById('chatImgName');if(n)n.textContent=f.name};r.readAsDataURL(f)}
function getSelectedAI(){return principiaAIList().find(x=>x.id===principiaSelectedAI)||principiaAIList()[0]||null}
function getSelectedAIUrl(){return getSelectedAI()?.url||'https://chatgpt.com/'}
function openSelectedAI(){const a=getSelectedAI();if(!a){notify('Hãy thêm một AI trước');return}const w=window.open(a.url,'_blank','noopener,noreferrer');if(!w)notify('Trình duyệt đang chặn cửa sổ bật lên. Hãy cho phép pop-up.')}
function sendChat(){const inp=document.getElementById('chatInput'),txt=inp?.value.trim()||'';if(!txt&&!chatImgData)return;const a=getSelectedAI();if(!a){notify('Hãy thêm và chọn một AI');return}const history=principiaChatHistory();history.push({role:'user',text:txt||'Đã gửi ảnh đính kèm',image:chatImgData?'Ảnh đính kèm (lưu trong lịch sử thiết bị)':'' ,at:Date.now()});savePrincipiaChatHistory(history);renderPrincipiaChatHistory();if(txt){try{const ta=document.createElement('textarea');ta.value=txt;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}catch(e){}}if(chatImgData)notify('Ảnh được lưu trong lịch sử PRINCIPIA; để gửi ảnh cho AI hãy mở tab riêng và đính kèm thủ công.');if(txt)notify('Đã lưu tin nhắn. AI '+a.name+' chưa được kết nối API trong phiên bản này.');if(inp)inp.value='';chatImgData=null;const n=document.getElementById('chatImgName');if(n)n.textContent='';const f=document.querySelector('#chatBox input[type=file]');if(f)f.value='';renderPrincipiaChatHistory()}


let inlineLessonQuizState = { items: [], picked: {} };

function extractCurrentLessonTheoryText(){
  const areaVal = document.getElementById('clNoteArea')?.value?.trim() || '';
  if(areaVal) return areaVal;
  if(curLessonId){
    const l = find(curLessonId, data);
    if(l && l.content && l.content.trim()) return l.content.trim();
  }
  return (document.getElementById('clLessonHeading')?.textContent || 'Bài học hiện tại').trim();
}

function buildQuizFromTheoryText(theoryText, lessonTitle){
  const lines = theoryText
    .split(/\n+/)
    .map(s => s.replace(/^[\s•\-*\d.)]+/, '').trim())
    .filter(s => s.length >= 12);

  const generated = [];
  for(let i = 0; i < Math.min(3, lines.length); i++){
    const line = lines[i];
    const parts = line.split(/[:=-]/);
    const keyConcept = (parts[0] || line).slice(0, 68).trim();
    const explanation = (parts.slice(1).join(' ') || line).trim();

    const wrong1 = 'Không phụ thuộc vào điều kiện bài toán và luôn bằng 0';
    const wrong2 = 'Chỉ áp dụng khi hệ đứng yên tuyệt đối và không có lực tác dụng';
    const wrong3 = 'Trái ngược hoàn toàn với nội dung lý thuyết đã nêu trong bài';

    const opts = [explanation, wrong1, wrong2, wrong3];
    generated.push({
      q: `[Quiz từ lý thuyết "${lessonTitle}"] Nội dung nào phản ánh đúng ý: "${keyConcept}"?`,
      a: opts,
      correct: 0,
      sourceLine: line
    });
  }

  if(!generated.length){
    generated.push({
      q: `[Quiz từ lý thuyết "${lessonTitle}"] Bước quan trọng nhất khi vận dụng lý thuyết vừa đọc là gì?`,
      a: [
        'Xác định đúng khái niệm, công thức cốt lõi và điều kiện áp dụng',
        'Thay số ngẫu nhiên không cần kiểm tra đơn vị',
        'Bỏ qua giả thiết của đề bài',
        'Dùng công thức không liên quan đến chủ đề'
      ],
      correct: 0,
      sourceLine: theoryText
    });
  }

  return generated;
}

function generateQuizFromLessonTheory(){
  saveClNote();
  const title = document.getElementById('clLessonHeading')?.textContent?.trim() || 'Bài học';
  const theory = extractCurrentLessonTheoryText();
  const items = buildQuizFromTheoryText(theory, title);
  inlineLessonQuizState = { items, picked: {} };

  if(curLessonId){
    const l = find(curLessonId, data);
    if(l){
      l.quiz = items.map(x => ({ q: x.q, a: x.a, correct: x.correct }));
      saveAll();
    }
  }

  xp += 20;dailyReward();
  saveAll();
  showXpToast('+20 XP · AI đã đọc lý thuyết & tạo Quiz');
  renderInlineLessonAiQuiz();
}

function pickInlineLessonQuizAns(qIdx, optIdx){
  if(inlineLessonQuizState.picked[qIdx] !== undefined) return;
  inlineLessonQuizState.picked[qIdx] = optIdx;
  const item = inlineLessonQuizState.items[qIdx];
  if(item && optIdx === item.correct){
    xp += 15;dailyReward();
    saveAll();
    showXpToast('+15 XP · Trả lời đúng Quiz lý thuyết');
  } else {
    showXpToast('Chưa đúng rồi, xem lại ý lý thuyết nhé!');
  }
  renderInlineLessonAiQuiz();
}

function renderInlineLessonAiQuiz(){
  const box = document.getElementById('inlineLessonAiQuizBox');
  if(!box) return;
  const { items, picked } = inlineLessonQuizState;
  if(!items || !items.length){
    box.innerHTML = '';
    return;
  }

  const total = items.length;
  const answeredCount = Object.keys(picked).length;
  const correctCount = Object.entries(picked).filter(([qi, ai]) => items[Number(qi)]?.correct === ai).length;

  box.innerHTML = `
    <div class="panel" style="margin:0;">
      <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
        <strong>🧠 Quiz tạo từ lý thuyết (${correctCount}/${total} đúng · ${answeredCount}/${total} đã làm)</strong>
        <button type="button" class="secondary" style="padding:6px 11px; font-size:12px;" onclick="generateQuizFromLessonTheory()">↻ Tạo lại Quiz</button>
      </div>
      ${items.map((item, qi) => {
        const chosen = picked[qi];
        const hasAnswered = chosen !== undefined;
        return `
          <div style="border:1px solid var(--line); border-radius:12px; padding:12px; margin-bottom:10px; background:var(--bg);">
            <div style="font-weight:700; font-size:13.5px; margin-bottom:8px;">Câu ${qi + 1}: ${esc(item.q)}</div>
            ${item.a.map((opt, oi) => {
              let borderCol = 'var(--line)';
              let bgCol = 'var(--card)';
              if(hasAnswered){
                if(oi === item.correct){
                  borderCol = 'var(--green)';
                  bgCol = 'rgba(101, 214, 165, 0.14)';
                } else if(oi === chosen){
                  borderCol = 'var(--red)';
                  bgCol = 'rgba(255, 113, 135, 0.14)';
                }
              }
              return `<button type="button" onclick="pickInlineLessonQuizAns(${qi}, ${oi})" style="width:100%; text-align:left; padding:9px 12px; border-radius:9px; border:1px solid ${borderCol}; background:${bgCol}; margin-bottom:6px; font-size:13px;">
                <strong>${String.fromCharCode(65 + oi)}.</strong> ${esc(opt)}
              </button>`;
            }).join('')}
            ${hasAnswered ? `<div class="small muted" style="margin-top:6px;">Trích ý lý thuyết: "${esc(item.sourceLine)}"</div>` : ''}
          </div>
        `;
      }).join('')}
    </div>
  `;
}


const PRINCIPIA_LOGO_URI = "/assets/images/principia-logo-round.svg";
const DEFAULT_OUTER_COVER_URI = "data:image/jpeg;base64,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/aK/8+dv+b//ABVJ/aC/8+dv+b//ABVUqKOdhcu/2gn/AD52/wCb/wDxVH29P+fK3/N//iqpUUczC5d+3p/z5W/5v/8AFUfb0/58rf8AN/8A4qqVFHMwuXPt6f8APlb/AJv/APFUfb0/58rf83/+KqnRS5mFy59uT/nyt/zk/wDiqUXdu/37Xb7xOR/PNUqKOZhc0BbpMCbaTzCOTGRhx+Hf8KrVCCVIIJBHII7Vf3i+jZsAXKDLY/5aD1+o71SdxlWilopgQUUUVmIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAqSCZreZJU+8hyKjooAvXUaxzsE/wBW2GX6EZH86KWfmCzbuYv5Mw/pRWoyhRRRWQgooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigDQl/49rL/rkf8A0Y9FE3/HtZf9cj/6MeitSjPooorIkKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKK1PD3h3U/FWrW+laRaPdX1wcJGnYdyT0AHcngU0m3ZAZdFfV3hH9lbSrS3jm8UajNeXZGWtrNvLiQ+hbG5vqNtdmf2f8A4cIoH/CPFiO5vbjJ/wDIlehDK681fRepXKz4eor7af4C/DsdPD3/AJO3H/xyqz/Ar4ejp4f/APJy4/8AjlarJq76r8f8g5GfF1FfVuv/ALO3hS+hf+zHutMnx8pWQypn3Vjk/gwr578beANY8CXywajGr28pPk3UXMcoH8j7H/69c2Jy+vh1zTWndCcW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f/Rj0Vt0GZ1FFFYiCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooA7X4SfEH/hVvxB0fxZ/Z39o/2cZD9l8/yfM3xsn39rYxuz0PSvR/2gf2lf+F6aRo+n/wDCMf2N/Ztw8/mfb/tHmbl24x5aY/WvA6KU/fSUun+d/wAwi+V3RreF9a/4RrxNouteR9o/sy9hu/J37PM8tw+3dg4zjGcHHpX0L8av2u/+FweA7rwt/wAId/ZfnzRTfav7T8/bsbdjZ5K9frXzJRSnFTXLL1/X9AT5XdHsHwR/aJ8S/BKeeCxih1HQrp/Mn064YqN+Mb0cfcbAAJwQQOnQj2XxN+39rWo6PcW2g+D7bStRlXal5Pfm6EWe4j8tAT6ZJHqD0r46oqpe8rMI+7qj6w8cftrv41+HmreE5PBRgk1GyNo182reYVJABcp5Iz0zjP41mfBf9r7/AIVD4BsvCv8Awhv9qfZpZZftX9p+Ru3uWxs8lsYzjrXzFRS5VzOXV7/mHRLsdH/wmmp2Xje48W6NcTaZqbXsl7A8L5aFnYttzj5hhiDkYIzkYOK+pdA/4KA6zZ6dFFrnguz1G9UYa4tb9rVX99hjfB+hx7CvjeiiKUYKmtlsDd5cz3PpX4rftneLfiFo0+i6Rp0PhzTbpClw0M5muJVPBXzMKFUjrhc++MivC/BPi668EeIrbWLSNJWiBV4nOBIhGCM9vr61z1FXRnKhNVKejQ5NyVmd/wDE74pXPxImsQ1gljaWYYpEJPMYs2MktgegwMetcBRRTq1ZVZupN3bBtvcKKKKgQUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAGjJ/x62X/AFyP/ox6KJP+PWy/65H/ANGPRW3QozqKKKxJCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKA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7+b/ACBav5/oQn4fat/wkK6Mr2js0AuhdrL/AKN5GM+dvx9zHfH4Vp+MPC0i6TZ6tYnSH0qAxaeh06UyvNLtYszHYpLEg5yAQCoGRzWlF4v0R76ytp7qRbC68Ox6Tc3EcTFraTOc7SAWAIGcdQe9VpdW0Hw74SisNM1f+1NRj1eG/P8Ao8kUbKiMMDcPXGc468DjNU1FaX0v+tvy1Em9/L9L/noZd58NtTs7W6Y32ly39nD59xpsVwWuYUAy2Vxtyo5IDEit/VfALa3aeFzps+k2l1c6TEy20kgjlvJcuSQAOWPAyxGemeKzdf8A+ER1G71jXl1u6knvhJNDpiW7JLHM5zh5CChRST0OSKsW/ijSU8U+Ar1rvFtpVnbxXb+W/wC6ZWYsMYycAjpmkknZPTVfLcG7Xa10fz2POWVkZlYEMpwQexpK19Rh06Sze9h1Evfy3UgNn5DDbF1Em/ocnjHWsis1tqU7X0CiiimIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAvzf8e1l/1yP/AKMeikn/AOPax/65H/0Y9FajKNFFFZCCiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKAJra8ubMyG2uJYTKhicxuV3oeqnHUHuKhoooAKvwa3f22k3elRXBXT7t0kmi2g72X7pzjIx7GqFFABRRRQAUUUUAFaWn+IdX0mCSCw1W+tIJDl47e4eNWPuAQDWbRQAE5OT1ooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAvT/8AHtY/9cj/AOjHopLj/j3sf+uR/wDRj0VoMpUUUVmIKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACii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3voFFFFMAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigCe9/1Nj/ANcT/wCjHopL7/U2P/XE/wDox6KHuBDRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQBNff6mx/64n/0Y9FF9/qbH/rif/Rj0US3AhooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAmvv8AU2P/AFxP/ox6KL7/AFNj/wBcT/6MeiiW4ENFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAEt/8A6mx/64n/ANGPRRf/AOpsf+uJ/wDRj0US3AiooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAKKKKACiiigAooooAlv8A/U2P/XE/+jHoov8A/VWI9IT/AOjHooluBFRQQQSCMEUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUqqWYKBkk4ApKtRn7DELluJWH7le+f7/ANB29/pQgINScfajGpysKiMH3A5/XNFU80Um7gX1vIrkYutwk/57KMk/7w7/AF6/WniyeTmF45h/0zYZ/wC+Tz+lZtFO/cDT/s29/wCfS4/79n/Cj+zL3/nzuP8Av23+FZlFF0Bp/wBmXv8Az53H/ftv8KP7Mvf+fO4/79t/hWZRRdAaf9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VmUtF0Bpf2Ze/8APncf9+2/wo/sy9/587j/AL9t/hWbRRdAaX9mXv8Az53H/ftv8KP7Mvf+fO4/79t/hWbRRdAaX9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4Vm0UXQGl/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4Vm0UXQGl/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZtLRdAaP9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VnUUXQGj/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4VnUUXQGj/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZ1FF0Bo/wBmXv8Az53H/ftv8KP7Mvf+fO4/79t/hWdRRdAaP9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VnUUXQGj/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4VnUUXQGj/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZ1FF0Bo/wBmXv8Az53H/ftv8KP7Mvf+fO4/79t/hWdRRdAaP9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VnUUXQGj/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4VnUUXQGj/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZ1FF0Bo/wBmXv8Az53H/ftv8KP7Mvf+fO4/79t/hWdRRdAaP9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VnUUXQGj/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4VnUUXQGj/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZ1FF0Bo/wBmXv8Az53H/ftv8KP7Mvf+fO4/79t/hWdRRdAaP9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VnUUXQGj/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4VnUUXQGj/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZ1FF0Bo/wBmXv8Az53H/ftv8KP7Mvf+fO4/79t/hWdRRdAaP9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VnUUXQGj/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4VnUUXQGj/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZ1FF0Bo/wBmXv8Az53H/ftv8KP7Mvf+fO4/79t/hWdRRdAaP9mXv/Pncf8Aftv8KP7Mvf8AnzuP+/bf4VnUUXQGj/Zl7/z53H/ftv8ACj+zL3/nzuP+/bf4Vm0UXQGl/Zl7/wA+dx/37b/Cj+zL3/nzuP8Av23+FZtFF0Bpf2Ze/wDPncf9+2/wo/sy9/587j/v23+FZtFF0Bpf2Ze/8+dx/wB+2/wo/sy9/wCfO4/79t/hWbRRdAaX9mXv/Pncf9+2/wAKP7Mvf+fO4/79t/hWbRRdAaX9mXv/AD53H/ftv8KP7Mvf+fO4/wC/bf4Vm0lF0Bp/2Ze/8+dx/wB+2/wo/sy9/wCfO4/79t/hWZRRdAaf9mXv/Pncf9+2/wAKT+z7hf8AWIIh6ysE/nWbRRdAaBktbXkEXMvYYIjH9T+g+tU5ppLiQySOWc9zUdFJsAooopAJRRRQAUUUUAFLRRQAUUUUAFFFFAC0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFAC0UUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFACUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFABRRRQAUUUUAFFFFACUUUUAFFFFABSUUUAFFFFABRRRQAUUUUAf//Z";
let outerCoverImg = localStorage.getItem('halo_outer_cover') || DEFAULT_OUTER_COVER_URI;

function updateOuterCover(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    outerCoverImg = reader.result;
    try { localStorage.setItem('halo_outer_cover', outerCoverImg); } catch {}
    render();
    notify('Đã cập nhật ảnh ngoài trang');
  };
  reader.readAsDataURL(file);
}

function resetOuterCover(){
  outerCoverImg = DEFAULT_OUTER_COVER_URI;
  try { localStorage.setItem('halo_outer_cover', outerCoverImg); } catch {}
  render();
  notify('Đã khôi phục ảnh ngoài trang');
}

// Public bridge for the separately-loaded Firebase auth script.
window.PRINCIPIA_OWNER_EMAIL_PUBLIC=PRINCIPIA_OWNER_EMAIL;
window.PRINCIPIA_OWNER_UID_PUBLIC=PRINCIPIA_OWNER_UID;
window.renderPrincipiaApp=()=>render();
let principiaViewportMode=window.matchMedia('(max-width:900px)').matches?'mobile':'desktop';
window.addEventListener('resize',()=>{
 const next=window.matchMedia('(max-width:900px)').matches?'mobile':'desktop';
 if(next===principiaViewportMode)return;
 principiaViewportMode=next;
 render();
},{passive:true});
window.resetPrincipiaStack=()=>{stack=[];};
window.principiaNotify=message=>notify(message);
window.principiaCompanionReact=(...args)=>companionReact(...args);
window.isPrincipiaQuizInProgress=()=>page==='play'&&!!activeQuiz&&(answers||[]).length>0;
window.applyPrincipiaThemePublic=theme=>applyPrincipiaTheme(theme);
window.navigatePrincipiaPage=p=>setPage(p);
window.getPrincipiaAccountMode=()=>accountMode;
window.setPrincipiaAccountMode=mode=>{accountMode=mode==='signup'?'signup':'login';};
window.getPrincipiaAccountReturnPage=()=>accountReturnPage;
window.setPrincipiaAccountReturnPage=p=>{accountReturnPage=p||'home';};
window.getPrincipiaStats=()=>({name:profile?.name||'Học sinh',xp:Number(xp)||0,streak:Number(streak)||0,completedCount:Array.isArray(completed)?completed.length:0});
window.renderPrincipiaLeaderboardRows=(rows,uid)=>{
 if(page!=='progress')return;
 const y=document.getElementById('principiaLearningLeaderboard');if(!y)return;
 const html=(Array.isArray(rows)?rows:[]).map((r,i)=>'<div class="file principia-rank-row"><b class="principia-rank-number">'+(i+1)+'</b><div class="principia-rank-avatar">'+(r.uid===uid?'Bạn':'Học sinh')+'</div><div class="principia-rank-meta"><b>'+esc(r.name||'Học sinh')+'</b><div class="small muted">'+(Number(r.completedCount)||0)+' bài học · '+(Number(r.streak)||0)+' ngày streak</div></div><b class="principia-rank-xp">'+(Number(r.xp)||0)+' XP</b></div>').join('');
 y.innerHTML=(html||'<div class="empty">Chưa có tài khoản nào đồng bộ.</div>')+'<p class="small muted">Xếp hạng theo XP học tập.</p>';
};

