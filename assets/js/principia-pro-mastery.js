/* PRINCIPIA PRO MASTERY — integrated study workflow, classroom and focus companion. */
(function () {
  'use strict';

  const STORE = 'principia_pro_mastery_v1';
  const DAY = 86400000;
  const defaults = { habits: [], cards: [], notes: '', videoUrl: '', sessions: [], persona: 'curious', difficulty: 'medium', frequency: 2 };
  let state = loadState();
  let activeTab = 'overview';
  let reviewIndex = 0;
  let revealed = false;
  let timer = { endAt: 0, remaining: 1500, duration: 1500, running: false, interval: null };
  let canvas = null;
  let drawing = false;
  let lastPoint = null;
  let observer = null;

  function loadState() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      return Object.assign({}, defaults, raw, {
        habits: Array.isArray(raw.habits) ? raw.habits : [],
        cards: Array.isArray(raw.cards) ? raw.cards : [],
        sessions: Array.isArray(raw.sessions) ? raw.sessions : []
      });
    } catch (_) { return Object.assign({}, defaults); }
  }
  function saveState() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); }
    catch (error) { console.warn('[PRINCIPIA] Could not save mastery state:', error); }
  }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function todayKey(date) {
    const d = date || new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }
  function todayHabit() { return state.habits.find(x => x.date === todayKey()); }
  function minutesToday() {
    return state.sessions.filter(x => x.date === todayKey()).reduce((sum, x) => sum + x.minutes, 0);
  }
  function streak() {
    const days = new Set(state.sessions.map(x => x.date));
    let cursor = new Date();
    if (!days.has(todayKey())) cursor.setDate(cursor.getDate() - 1);
    let count = 0;
    while (days.has(todayKey(cursor))) { count += 1; cursor.setDate(cursor.getDate() - 1); }
    return count;
  }
  function dueCards() {
    return state.cards.filter(x => !x.dueAt || x.dueAt <= Date.now());
  }
  function modal() {
    let root = document.getElementById('principiaProMastery');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'principiaProMastery';
    root.setAttribute('role', 'dialog');
    root.setAttribute('aria-modal', 'true');
    root.setAttribute('aria-label', 'PRINCIPIA Pro Mastery');
    root.innerHTML = '<div class="ppm-shell"><header class="ppm-head"><div><small>PRINCIPIA · PRO MASTERY SYSTEM</small><h2>Hệ điều hành học tập</h2></div><button type="button" class="ppm-close" aria-label="Đóng">×</button></header><nav class="ppm-tabs" aria-label="Các khu vực học tập"></nav><main class="ppm-content"></main></div>';
    root.querySelector('.ppm-close').addEventListener('click', close);
    root.addEventListener('click', event => { if (event.target === root) close(); });
    document.body.appendChild(root);
    return root;
  }
  function styles() {
    if (document.getElementById('principiaProMasteryStyles')) return;
    const style = document.createElement('style');
    style.id = 'principiaProMasteryStyles';
    style.textContent = '#principiaProMastery{position:fixed;inset:0;z-index:2147483200;background:#050817eF;backdrop-filter:blur(12px);display:none;overflow:auto;padding:12px;color:var(--text,#f4f6ff);font:inherit}#principiaProMastery .ppm-shell{max-width:1080px;min-height:80vh;margin:3vh auto;background:var(--bg,#111827);border:1px solid var(--line,#39435b);border-radius:22px;box-shadow:0 24px 90px #0009;overflow:hidden}#principiaProMastery .ppm-head{display:flex;align-items:center;justify-content:space-between;padding:17px 20px;background:var(--side,#171e30);border-bottom:1px solid var(--line,#39435b)}#principiaProMastery .ppm-head small{letter-spacing:1.5px;opacity:.7}#principiaProMastery h2{margin:5px 0;font-size:21px}#principiaProMastery .ppm-close{font-size:28px;border:0;background:transparent;color:inherit}#principiaProMastery .ppm-tabs{display:flex;gap:7px;padding:10px 14px;overflow:auto;border-bottom:1px solid var(--line,#39435b)}#principiaProMastery button,#principiaProMastery input,#principiaProMastery textarea,#principiaProMastery select{font:inherit}#principiaProMastery button{cursor:pointer}#principiaProMastery .ppm-tabs button{white-space:nowrap;border:1px solid var(--line,#39435b);border-radius:10px;padding:9px 12px;background:transparent;color:inherit}#principiaProMastery .ppm-tabs button[aria-current=true],#principiaProMastery .ppm-primary{background:var(--primary,#6557dc);color:white;border-color:transparent}#principiaProMastery .ppm-content{padding:18px}#principiaProMastery .ppm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px}#principiaProMastery .ppm-card{border:1px solid var(--line,#39435b);background:var(--card,#171e30);border-radius:15px;padding:15px;min-width:0}#principiaProMastery .ppm-card h3{margin:0 0 8px;font-size:16px}#principiaProMastery .ppm-muted{opacity:.72;font-size:13px;line-height:1.5}#principiaProMastery .ppm-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}#principiaProMastery .ppm-actions button,#principiaProMastery .ppm-button{border:1px solid var(--line,#39435b);border-radius:10px;padding:9px 12px;background:transparent;color:inherit}#principiaProMastery input,#principiaProMastery textarea,#principiaProMastery select{box-sizing:border-box;width:100%;padding:10px;border-radius:9px;border:1px solid var(--line,#39435b);background:var(--bg,#101626);color:inherit;margin:5px 0 10px}#principiaProMastery textarea{min-height:100px;resize:vertical}#principiaProMastery .ppm-stat{font-size:27px;font-weight:800}#principiaProMastery canvas{width:100%;height:330px;display:block;background:#fff;border-radius:10px;touch-action:none}#principiaProMastery iframe{width:100%;aspect-ratio:16/9;border:0;border-radius:12px;background:#000}#principiaProMastery .ppm-wide{grid-column:1/-1}@media(max-width:600px){#principiaProMastery{padding:0}#principiaProMastery .ppm-shell{margin:0;min-height:100vh;border-radius:0}#principiaProMastery .ppm-content{padding:12px}#principiaProMastery canvas{height:260px}}';
    document.head.appendChild(style);
  }
  function open(tab) {
    styles();
    const root = modal();
    root.style.display = 'block';
    activeTab = tab || activeTab;
    render();
    document.addEventListener('keydown', escapeHandler);
  }
  function close() {
    const root = document.getElementById('principiaProMastery');
    if (root) root.style.display = 'none';
    if (timer.running) { timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000)); stopTimer(true); }
    document.removeEventListener('keydown', escapeHandler);
  }
  function escapeHandler(event) { if (event.key === 'Escape') close(); }
  function tabs() {
    const list = [['overview', 'Tổng quan'], ['mastery', 'Ôn tập & thành thạo'], ['habits', 'Thói quen'], ['coach', 'AI Coach'], ['classroom', 'Lớp học ảo'], ['study', 'Study With Me']];
    const nav = modal().querySelector('.ppm-tabs');
    nav.innerHTML = list.map(([id, label]) => '<button type="button" data-tab="' + id + '" aria-current="' + (activeTab === id) + '">' + label + '</button>').join('');
    nav.querySelectorAll('[data-tab]').forEach(button => button.addEventListener('click', () => { activeTab = button.dataset.tab; render(); }));
  }
  function card(title, value, detail) {
    return '<article class="ppm-card"><div class="ppm-muted">' + esc(title) + '</div><div class="ppm-stat">' + esc(value) + '</div><div class="ppm-muted">' + esc(detail) + '</div></article>';
  }
  function overview() {
    const due = dueCards().length;
    const sessions = state.sessions.length;
    const methods = window.principiaStudyMethodsCount ? window.principiaStudyMethodsCount() : { total: 213, tried: 0, saved: 0 };
    return '<div class="ppm-grid">' + card('Thời gian học hôm nay', minutesToday() + ' phút', 'Mục tiêu khởi động: 5 phút') + card('Chuỗi ngày học', streak() + ' ngày', 'Dựa trên phiên học đã lưu') + card('Thẻ đến hạn ôn', due, state.cards.length + ' thẻ trong kho') + card('Phiên học đã ghi nhận', sessions, 'Dữ liệu trên thiết bị') + '</div><section class="ppm-card" style="margin-top:12px"><h3>Chu trình học PRINCIPIA</h3><p class="ppm-muted">Học một phần nhỏ → tự nhớ lại → kiểm tra → phân tích lỗi → lên lịch ôn → luyện lại độc lập → xác nhận đã thành thạo. XP chỉ là phản hồi phụ, không thay thế mức độ hiểu.</p><div class="ppm-actions"><button class="ppm-primary" data-go="habits">Bắt đầu phiên 5 phút</button><button data-go="mastery">Ôn kiến thức đến hạn (' + due + ')</button><button data-go="coach">Mở AI Coach</button></div></section><section class="ppm-card" style="margin-top:12px"><h3>Thư viện phương pháp</h3><p class="ppm-muted">' + methods.total + ' phương pháp được lưu trong PRINCIPIA. Hệ thống sẽ gợi ý cách học theo mục tiêu; đánh dấu đã đọc không được tính là thành thạo.</p><div class="ppm-actions"><button data-existing="methods">Mở 213 phương pháp</button><button data-existing="focus">Mở góc tập trung</button><button data-existing="errors">Mở sổ lỗi sai</button></div></section>';
  }
  function mastery() {
    const due = dueCards();
    const item = due[reviewIndex % Math.max(1, due.length)];
    const current = item ? '<article class="ppm-card"><div class="ppm-muted">THẺ ÔN TẬP · ' + (reviewIndex + 1) + '/' + due.length + '</div><h3>' + esc(item.question) + '</h3>' + (revealed ? '<p><b>Đáp án:</b> ' + esc(item.answer) + '</p><div class="ppm-actions"><button data-rate="1">Chưa nhớ</button><button data-rate="2">Khó</button><button data-rate="3">Đã nhớ</button><button data-rate="4">Rất chắc</button></div>' : '<button class="ppm-primary" data-reveal>Hiện đáp án</button>') + '</article>' : '<article class="ppm-card"><h3>Chưa có thẻ đến hạn</h3><p class="ppm-muted">Tạo thẻ từ công thức, định luật hoặc khái niệm cần ghi nhớ. Hệ thống sẽ lên lịch ôn tăng dần.</p></article>';
    return '<div class="ppm-grid">' + card('Đến hạn hôm nay', due.length, 'Ôn trước khi thêm kiến thức mới') + card('Tổng số thẻ', state.cards.length, 'Ôn tập chủ động') + '</div>' + current + '<section class="ppm-card" style="margin-top:12px"><h3>Tạo thẻ ghi nhớ</h3><label>Câu hỏi / gợi nhớ<input id="ppmQuestion" maxlength="500" placeholder="Ví dụ: Định luật II Newton phát biểu thế nào?"></label><label>Đáp án / giải thích<textarea id="ppmAnswer" maxlength="2000" placeholder="Tự diễn đạt bằng lời của bạn..."></textarea></label><button class="ppm-primary" data-add-card>Thêm thẻ</button></section><section class="ppm-card" style="margin-top:12px"><h3>Lối tắt luyện tập</h3><p class="ppm-muted">Ôn lỗi sai, làm lại câu hỏi và flashcard từ ngân hàng câu hỏi đang có.</p><div class="ppm-actions"><button data-existing="errors">Sổ lỗi sai</button><button data-existing="reviewErrors">Ôn lỗi sai</button><button data-existing="spaced">Ôn tập thông minh</button><button data-existing="bank">Ngân hàng câu hỏi</button></div></section>';
  }
  function habits() {
    const today = todayHabit();
    const done = today ? today.done : false;
    return '<div class="ppm-grid">' + card('Mục tiêu nhỏ nhất', '5 phút', 'Ngày bận vẫn có thể duy trì thói quen') + card('Hôm nay', done ? 'Đã xong' : 'Chưa xong', 'Không cần học quá sức để giữ chuỗi') + '</div><section class="ppm-card" style="margin-top:12px"><h3>Khởi động học tập</h3><label>Mục tiêu phiên<input id="ppmGoal" maxlength="120" placeholder="Ví dụ: Tự giải một bài về lực"></label><div class="ppm-stat" id="ppmTimer">25:00</div><div class="ppm-actions"><button data-duration="5">5 phút</button><button data-duration="25">25 phút</button><button data-duration="50">50 phút</button><button class="ppm-primary" data-timer-toggle>Bắt đầu</button><button data-timer-reset>Đặt lại</button></div><p class="ppm-muted">Khi kết thúc, hãy ghi lại điều đã tự làm được. Bộ đếm không tự ghi nhận thời gian nếu bạn không hoàn tất phiên.</p></section><section class="ppm-card" style="margin-top:12px"><h3>Cam kết hôm nay</h3><p class="ppm-muted">Bắt đầu nhỏ, chọn một việc, đóng tab gây xao nhãng, nghỉ khi mệt. Không dùng streak để ép học khi cần nghỉ.</p><div class="ppm-actions"><button class="ppm-primary" data-habit-done ' + (done ? 'disabled' : '') + '>Đánh dấu hoàn thành mục tiêu hôm nay</button><button data-existing="focus">Mở chế độ tập trung</button></div></section>';
  }
  function coach() {
    return '<section class="ppm-card"><h3>AI Coach · gợi ý trước, không làm hộ</h3><p class="ppm-muted">Coach hướng dẫn theo từng tầng: làm rõ dữ kiện → gợi ý nguyên lý → gợi ý bước tiếp theo → yêu cầu bạn tự giải lại. Chỉ xem lời giải đầy đủ khi đã thử độc lập.</p><label>Bạn đang học gì?<input id="ppmCoachTopic" maxlength="300" placeholder="Ví dụ: Bảo toàn cơ năng"></label><label>Bạn mắc ở đâu?<textarea id="ppmCoachProblem" maxlength="3000" placeholder="Dán đề bài và ghi rõ bước bạn đã thử..."></textarea></label><label>Mức gợi ý<select id="ppmHint"><option value="1">Tầng 1 · câu hỏi định hướng</option><option value="2">Tầng 2 · nhắc nguyên lý</option><option value="3">Tầng 3 · gợi ý bước tiếp</option><option value="4">Tầng 4 · kiểm tra lời giải của tôi</option></select></label><button class="ppm-primary" data-coach>Gửi cho AI Coach</button><p class="ppm-muted">AI cục bộ yêu cầu trình duyệt hỗ trợ WebGPU và tải mô hình khi bạn chủ động bật. Nếu chưa sẵn sàng, hệ thống sẽ đưa prompt vào trợ lý hiện tại để bạn tiếp tục.</p></section>';
  }
  function classroom() {
    return '<section class="ppm-card"><h3>Bảng trắng tương tác</h3><p class="ppm-muted">Vẽ sơ đồ lực, đồ thị, mô hình hoặc lời giải. Bản vẽ được xuất thành ảnh PNG.</p><canvas id="ppmBoard" aria-label="Bảng trắng vẽ tự do"></canvas><div class="ppm-actions"><button data-clear-board>Xóa bảng</button><button data-save-board>Xuất PNG</button></div></section><section class="ppm-card" style="margin-top:12px"><h3>Tài liệu lớp học</h3><textarea id="ppmNotes" maxlength="30000" placeholder="Ghi bài giảng, câu hỏi, lời giải và phản tư...">' + esc(state.notes) + '</textarea><div class="ppm-actions"><button data-save-notes>Lưu ghi chú</button><button data-export-notes>Xuất tài liệu HTML</button><button data-print-notes>In / lưu PDF</button></div></section><section class="ppm-card" style="margin-top:12px"><h3>AI Student · học bằng cách giảng dạy</h3><label>Nhân cách học sinh<select id="ppmPersona"><option value="curious">Tò mò, hỏi vì sao</option><option value="skeptical">Hoài nghi, yêu cầu chứng minh</option><option value="beginner">Mới học, cần giải thích dễ hiểu</option><option value="olympiad">Học sinh Olympic, hỏi sâu</option></select></label><label>Tần suất câu hỏi<select id="ppmFrequency"><option value="1">Ít · sau mỗi phần lớn</option><option value="2">Vừa · 2 câu mỗi lượt</option><option value="3">Nhiều · liên tục truy vấn</option></select></label><label>Độ khó<select id="ppmDifficulty"><option value="easy">Cơ bản</option><option value="medium">Trung bình</option><option value="hard">Nâng cao</option></select></label><button class="ppm-primary" data-student>Đặt câu hỏi cho người học</button><div id="ppmStudentQuestions" class="ppm-muted" style="margin-top:12px"></div></section>';
  }
  function study() {
    const embed = videoEmbed(state.videoUrl);
    return '<section class="ppm-card"><h3>Study With Me · góc học tập</h3><p class="ppm-muted">Dán liên kết video YouTube của phiên học cùng người khác. Video chỉ phát khi bạn chủ động mở.</p><label>Liên kết YouTube<input id="ppmVideoUrl" type="url" maxlength="500" placeholder="https://www.youtube.com/watch?v=... " value="' + esc(state.videoUrl) + '"></label><div class="ppm-actions"><button class="ppm-primary" data-load-video>Mở video</button><button data-hide-video>Ẩn video</button></div><div id="ppmVideo">' + (embed ? '<iframe src="' + embed + '" title="Study With Me" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>' : '<p class="ppm-muted">Chưa chọn video.</p>') + '</div></section><section class="ppm-card" style="margin-top:12px"><h3>Không gian tập trung</h3><p class="ppm-muted">Kết hợp video với một mục tiêu duy nhất, hẹn giờ và nghỉ giữa phiên. Có thể thu nhỏ/ẩn video bằng nút phía trên.</p><div class="ppm-actions"><button data-go="habits">Bắt đầu bộ đếm</button><button data-existing="focus">Chế độ tập trung PRINCIPIA</button></div></section>';
  }
  function videoEmbed(value) {
    try {
      const url = new URL(String(value || ''));
      if (url.protocol !== 'https:') return '';
      let id = '';
      if (url.hostname === 'youtu.be') id = url.pathname.slice(1);
      if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) {
        if (url.pathname === '/watch') id = url.searchParams.get('v') || '';
        else if (url.pathname.startsWith('/embed/')) id = url.pathname.split('/')[2] || '';
      }
      return /^[A-Za-z0-9_-]{11}$/.test(id) ? 'https://www.youtube-nocookie.com/embed/' + id : '';
    } catch (_) { return ''; }
  }
  function render() {
    tabs();
    const body = modal().querySelector('.ppm-content');
    const views = { overview, mastery, habits, coach, classroom, study };
    body.innerHTML = (views[activeTab] || overview)();
    bind(body);
    if (activeTab === 'habits') paintTimer();
    if (activeTab === 'classroom') initBoard();
  }
  function bind(root) {
    root.querySelectorAll('[data-go]').forEach(el => el.addEventListener('click', () => { activeTab = el.dataset.go; render(); }));
    root.querySelectorAll('[data-existing]').forEach(el => el.addEventListener('click', () => runExisting(el.dataset.existing)));
    root.querySelector('[data-add-card]')?.addEventListener('click', addCard);
    root.querySelector('[data-reveal]')?.addEventListener('click', () => { revealed = true; render(); });
    root.querySelectorAll('[data-rate]').forEach(el => el.addEventListener('click', () => rateCard(Number(el.dataset.rate))));
    root.querySelectorAll('[data-duration]').forEach(el => el.addEventListener('click', () => setDuration(Number(el.dataset.duration))));
    root.querySelector('[data-timer-toggle]')?.addEventListener('click', toggleTimer);
    root.querySelector('[data-timer-reset]')?.addEventListener('click', () => { stopTimer(false); timer.remaining = 1500; paintTimer(); });
    root.querySelector('[data-habit-done]')?.addEventListener('click', markHabit);
    root.querySelector('[data-coach]')?.addEventListener('click', sendCoach);
    root.querySelector('[data-save-notes]')?.addEventListener('click', saveNotes);
    root.querySelector('[data-export-notes]')?.addEventListener('click', exportNotes);
    root.querySelector('[data-print-notes]')?.addEventListener('click', () => window.print());
    root.querySelector('[data-student]')?.addEventListener('click', askStudent);
    root.querySelector('[data-load-video]')?.addEventListener('click', loadVideo);
    root.querySelector('[data-hide-video]')?.addEventListener('click', () => { const el = root.querySelector('#ppmVideo'); if (el) el.innerHTML = '<p class="ppm-muted">Video đã ẩn.</p>'; });
    root.querySelector('[data-clear-board]')?.addEventListener('click', clearBoard);
    root.querySelector('[data-save-board]')?.addEventListener('click', saveBoard);
  }
  function runExisting(action) {
    const map = { methods: 'principiaStudyMethods', focus: 'principiaSuiteFocus', errors: 'principiaSuiteErrors', reviewErrors: 'principiaSuiteReviewErrors', spaced: 'principiaSuiteSpacedReview', bank: 'principiaSuiteQuestionBank' };
    const fn = window[map[action]];
    if (typeof fn === 'function') { close(); fn(); }
  }
  function addCard() {
    const question = modal().querySelector('#ppmQuestion')?.value.trim();
    const answer = modal().querySelector('#ppmAnswer')?.value.trim();
    if (!question || !answer) return alert('Nhập cả câu hỏi và đáp án.');
    state.cards.push({ id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()), question, answer, dueAt: Date.now(), interval: 0, repetitions: 0 });
    saveState(); revealed = false; render();
  }
  function rateCard(rating) {
    const due = dueCards();
    const item = due[reviewIndex % Math.max(1, due.length)];
    if (!item) return;
    const intervals = { 1: 0.04, 2: 1, 3: 3, 4: 7 };
    item.repetitions = rating === 1 ? 0 : item.repetitions + 1;
    item.interval = rating === 1 ? 0.04 : Math.max(1, item.interval || 1) * (rating === 2 ? 1 : rating === 3 ? 2 : 2.5);
    item.dueAt = Date.now() + (rating === 1 ? 10 * 60000 : Math.max(intervals[rating], item.interval) * DAY);
    reviewIndex = 0; revealed = false; saveState(); render();
  }
  function markHabit() {
    const key = todayKey();
    if (!todayHabit()) state.habits.push({ date: key, done: true });
    else todayHabit().done = true;
    saveState(); render();
  }
  function setDuration(minutes) {
    stopTimer(false); timer.duration = minutes * 60; timer.remaining = timer.duration; paintTimer();
  }
  function toggleTimer() {
    if (timer.running) {
      timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
      stopTimer(true); paintTimer(); return;
    }
    if (timer.remaining <= 0) return;
    timer.endAt = Date.now() + timer.remaining * 1000;
    timer.running = true;
    timer.interval = window.setInterval(tick, 500);
    paintTimer();
  }
  function tick() {
    timer.remaining = Math.max(0, Math.ceil((timer.endAt - Date.now()) / 1000));
    if (!timer.remaining) {
      const minutes = Math.max(1, Math.round(timer.duration / 60));
      state.sessions.push({ date: todayKey(), minutes: Math.min(180, minutes) });
      saveState(); stopTimer(false);
    }
    paintTimer();
  }
  function stopTimer(preserve) {
    if (timer.interval) window.clearInterval(timer.interval);
    timer.interval = null; timer.running = false;
    if (!preserve) timer.endAt = 0;
  }
  function paintTimer() {
    const el = modal().querySelector('#ppmTimer');
    if (el) el.textContent = String(Math.floor(timer.remaining / 60)).padStart(2, '0') + ':' + String(timer.remaining % 60).padStart(2, '0');
    const button = modal().querySelector('[data-timer-toggle]');
    if (button) button.textContent = timer.running ? 'Tạm dừng' : 'Bắt đầu';
  }
  function saveNotes() {
    state.notes = modal().querySelector('#ppmNotes')?.value || '';
    saveState(); alert('Đã lưu ghi chú lớp học trên thiết bị.');
  }
  function exportNotes() {
    state.notes = modal().querySelector('#ppmNotes')?.value || '';
    saveState();
    const html = '<!doctype html><meta charset="utf-8"><title>PRINCIPIA Classroom Notes</title><article style="max-width:850px;margin:40px auto;font:16px/1.6 system-ui;white-space:pre-wrap">' + esc(state.notes) + '</article>';
    download('principia-classroom-notes.html', html, 'text/html;charset=utf-8');
  }
  function download(name, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = name; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function sendCoach() {
    const topic = modal().querySelector('#ppmCoachTopic')?.value.trim() || 'Vật lý';
    const problem = modal().querySelector('#ppmCoachProblem')?.value.trim() || '';
    const hint = modal().querySelector('#ppmHint')?.value || '1';
    if (!problem) return alert('Nhập đề bài và bước bạn đã thử.');
    const prompts = {
      1: 'Chỉ đặt 2–3 câu hỏi định hướng. Không nêu công thức hay đáp án.',
      2: 'Gợi ý nguyên lý vật lý phù hợp, giải thích vì sao có thể dùng. Không giải hết.',
      3: 'Chỉ gợi ý bước tiếp theo và một phép kiểm tra. Dừng trước kết quả cuối.',
      4: 'Yêu cầu tôi tự trình bày lời giải. Kiểm tra từng bước, chỉ rõ lỗi và yêu cầu tôi sửa rồi tự giải lại.'
    };
    const prompt = 'Bạn là PRINCIPIA PRO COACH. Chủ đề: ' + topic + '. Bài toán: ' + problem + '\n' + prompts[hint] + '\nQuy tắc: không làm hộ, không tiết lộ đáp án ngay; sau mỗi gợi ý phải yêu cầu người học tự thử và phản hồi.';
    close();
    if (window.principiaLocalAI && typeof window.principiaLocalAI.open === 'function') window.principiaLocalAI.open(prompt);
    else if (typeof window.principiaSuiteAI === 'function') window.principiaSuiteAI();
    else alert('Chưa tải được AI Coach. Hãy tải lại trang.');
  }
  function askStudent() {
    const persona = modal().querySelector('#ppmPersona')?.value || 'curious';
    const difficulty = modal().querySelector('#ppmDifficulty')?.value || 'medium';
    const frequency = Number(modal().querySelector('#ppmFrequency')?.value || 2);
    state.persona = persona; state.difficulty = difficulty; state.frequency = frequency; saveState();
    const stylesByPersona = {
      curious: ['Tại sao định luật này đúng?', 'Nếu thay đổi một điều kiện thì kết quả ra sao?', 'Có ví dụ thực tế nào minh họa không?'],
      skeptical: ['Giả thiết nào đang được dùng?', 'Có phản ví dụ nào không?', 'Làm sao kiểm chứng kết luận bằng đơn vị hoặc giới hạn?'],
      beginner: ['Bạn có thể giải thích bằng lời đơn giản hơn?', 'Từng đại lượng trong công thức có nghĩa gì?', 'Tại sao phải làm bước này trước?'],
      olympiad: ['Có cách giải thứ hai ngắn hơn không?', 'Nếu bỏ giả thiết lý tưởng thì mô hình thay đổi thế nào?', 'Có thể tổng quát hóa kết quả không?']
    };
    const level = difficulty === 'easy' ? 0 : difficulty === 'hard' ? 2 : 1;
    const questions = (stylesByPersona[persona] || stylesByPersona.curious).slice(0, frequency).map((q, i) => '<li>' + esc(q) + (level === 2 ? ' Hãy chứng minh chặt chẽ.' : level === 0 ? ' Giải thích từng bước.' : '') + '</li>').join('');
    const target = modal().querySelector('#ppmStudentQuestions');
    if (target) {
      target.innerHTML = '<b>Học sinh hỏi:</b><ol>' + questions + '</ol><p>Hãy trả lời bằng lời của bạn, sau đó tự kiểm tra bằng ví dụ.</p><button type="button" class="ppm-button ppm-primary" data-student-ai>Tiếp tục đối thoại với AI Student</button>';
      target.querySelector('[data-student-ai]').addEventListener('click', () => {
        const personaName = ({ curious: 'tò mò', skeptical: 'hoài nghi', beginner: 'mới học', olympiad: 'học sinh Olympic' })[persona];
        const context = modal().querySelector('#ppmNotes')?.value || state.notes;
        const prompt = 'Bạn đóng vai một học sinh ' + personaName + ' đang được người dùng dạy Vật lý. Độ khó: ' + difficulty + '. Tần suất: ' + frequency + ' câu hỏi mỗi lượt. Hãy dựa trên nội dung bài giảng sau và hỏi từng câu một; không tự giảng thay giáo viên. Nếu giáo viên trả lời thiếu logic, hãy hỏi tiếp một câu Socratic lịch sự. Nội dung bài giảng: ' + context.slice(0, 5000);
        close();
        if (window.principiaLocalAI && typeof window.principiaLocalAI.open === 'function') window.principiaLocalAI.open(prompt);
        else if (typeof window.principiaSuiteAI === 'function') window.principiaSuiteAI();
      });
    }
  }
  function loadVideo() {
    const input = modal().querySelector('#ppmVideoUrl');
    const embed = videoEmbed(input?.value);
    if (!embed) return alert('Chỉ chấp nhận liên kết video YouTube hợp lệ qua HTTPS.');
    state.videoUrl = input.value.trim(); saveState();
    const target = modal().querySelector('#ppmVideo');
    target.innerHTML = '<iframe src="' + embed + '" title="Study With Me" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>';
  }
  function initBoard() {
    canvas = modal().querySelector('#ppmBoard');
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ratio = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    canvas.width = Math.round(rect.width * ratio); canvas.height = Math.round(rect.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.scale(ratio, ratio); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#172033';
    if (canvas.dataset.bound !== '1') {
      canvas.addEventListener('pointerdown', startDraw);
      canvas.addEventListener('pointermove', draw);
      canvas.addEventListener('pointerup', endDraw);
      canvas.addEventListener('pointercancel', endDraw);
      canvas.dataset.bound = '1';
    }
  }
  function point(event) {
    const rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }
  function startDraw(event) {
    drawing = true; lastPoint = point(event); canvas.setPointerCapture(event.pointerId);
  }
  function draw(event) {
    if (!drawing || !canvas) return;
    const next = point(event); const ctx = canvas.getContext('2d');
    ctx.beginPath(); ctx.moveTo(lastPoint.x, lastPoint.y); ctx.lineTo(next.x, next.y); ctx.stroke(); lastPoint = next;
  }
  function endDraw() { drawing = false; lastPoint = null; }
  function clearBoard() {
    if (!canvas) return;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
  }
  function saveBoard() {
    if (!canvas) return;
    const link = document.createElement('a'); link.download = 'principia-whiteboard.png'; link.href = canvas.toDataURL('image/png'); link.click();
  }
  function injectEntry() {
    const existing = document.getElementById('principiaProMasteryEntry');
    if (existing) return true;
    const methodButton = document.querySelector('button[onclick="principiaStudyMethods()"]');
    if (!methodButton || !methodButton.parentElement) return false;
    const button = document.createElement('button');
    button.id = 'principiaProMasteryEntry'; button.type = 'button';
    button.className = methodButton.className;
    button.textContent = '🧭 PRO MASTERY · Hệ điều hành học tập';
    button.addEventListener('click', () => open('overview'));
    methodButton.parentElement.appendChild(button);
    return true;
  }
  function boot() {
    injectEntry();
    observer = new MutationObserver(() => injectEntry());
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('resize', () => {
      if (activeTab === 'classroom' && modal().style.display !== 'none') initBoard();
    }, { passive: true });
  }
  window.PrincipiaProMastery = { open, close, refresh: render, stats: () => ({ cards: state.cards.length, due: dueCards().length, sessions: state.sessions.length, streak: streak(), minutesToday: minutesToday() }) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();