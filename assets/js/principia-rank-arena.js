/* PRINCIPIA PRO Ranked Arena — learning-based matches against clearly labeled AI rivals. */
(function () {
  'use strict';

  const STORAGE_KEY = 'principia_rank_arena_v1';
  const DAILY_LIMIT = 10;
  const MATCH_SIZE = 5;
  const TIERS = [
    { id: 'bronze', name: 'Đồng', icon: '🥉', min: 0 },
    { id: 'silver', name: 'Bạc', icon: '🥈', min: 100 },
    { id: 'gold', name: 'Vàng', icon: '🥇', min: 250 },
    { id: 'platinum', name: 'Bạch kim', icon: '💠', min: 450 },
    { id: 'diamond', name: 'Kim cương', icon: '💎', min: 700 },
    { id: 'elite', name: 'Tinh anh', icon: '⚔️', min: 1000 },
    { id: 'master', name: 'Cao thủ', icon: '👑', min: 1400 },
    { id: 'challenger', name: 'Thách đấu', icon: '🏆', min: 1900 }
  ];
  const RIVALS = [
    { id: 'void', name: 'VOID', style: 'Chiến thuật', rating: 650, icon: '◈', line: 'Đừng để áp lực làm bạn mất nhịp.' },
    { id: 'rin', name: 'RIN', style: 'Tốc độ', rating: 480, icon: '✦', line: 'Tôi sẽ không bỏ qua một giây nào.' },
    { id: 'nova', name: 'NOVA', style: 'Chính xác', rating: 760, icon: '✧', line: 'Một đáp án đúng đáng giá hơn ba lần đoán.' },
    { id: 'zero', name: 'ZERO', style: 'Phản biện', rating: 850, icon: '⬡', line: 'Hãy chứng minh điều bạn chọn.' },
    { id: 'echo', name: 'ECHO', style: 'Bền bỉ', rating: 560, icon: '⌁', line: 'Trận đấu chỉ kết thúc khi hết câu hỏi.' },
    { id: 'apex', name: 'APEX', style: 'Toàn diện', rating: 980, icon: '⟁', line: 'Cùng xem bạn tiến bộ đến đâu.' }
  ];
  const DEFAULT_STATE = { rp: 0, mmr: 500, matches: [], wins: 0, losses: 0, daily: '', dailyMatches: 0, claims: [], achievements: [] };
  let state = loadState();
  let root = null;
  let activeMatch = null;

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return Object.assign({}, DEFAULT_STATE, saved, {
        rp: validInt(saved.rp, 0, 1000000),
        mmr: validInt(saved.mmr, 100, 3000),
        matches: Array.isArray(saved.matches) ? saved.matches.slice(-100) : [],
        claims: Array.isArray(saved.claims) ? saved.claims : [],
        achievements: Array.isArray(saved.achievements) ? saved.achievements : []
      });
    } catch (_) {
      return Object.assign({}, DEFAULT_STATE);
    }
  }

  function validInt(value, min, max) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.max(min, Math.min(max, Math.floor(n))) : min;
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (error) { console.warn('[PRINCIPIA] Rank save failed:', error); }
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[c]);
  }

  function todayKey() {
    const d = new Date();
    return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-');
  }

  function currentTier(rp) {
    let index = 0;
    for (let i = 1; i < TIERS.length; i += 1) if (rp >= TIERS[i].min) index = i;
    const tier = TIERS[index];
    const next = TIERS[index + 1] || null;
    const span = next ? next.min - tier.min : 100;
    const progress = next ? (rp - tier.min) / span : 1;
    const division = next ? (progress >= 2 / 3 ? 'I' : progress >= 1 / 3 ? 'II' : 'III') : null;
    return { ...tier, next, division, label: division ? tier.name + ' ' + division : tier.name, progress: Math.max(0, Math.min(1, progress)) };
  }

  function collectQuestions() {
    const output = [];
    const seen = new Set();
    function walk(nodes) {
      if (!Array.isArray(nodes)) return;
      nodes.forEach(node => {
        if (!node || typeof node !== 'object') return;
        const list = node.questions || node.quiz || [];
        if (Array.isArray(list)) list.forEach(q => {
          if (!q || !q.q || !Array.isArray(q.a) || q.a.length < 2) return;
          const correct = Number(q.correct);
          if (!Number.isInteger(correct) || correct < 0 || correct >= q.a.length) return;
          const key = String(q.q);
          if (seen.has(key)) return;
          seen.add(key);
          output.push({ q: String(q.q), a: q.a.map(String), correct, topic: String(node.name || 'Kiến thức tổng hợp') });
        });
        walk(node.children);
      });
    }
    try { if (typeof quizData !== 'undefined') walk(quizData); } catch (_) {}
    try { if (typeof data !== 'undefined') walk(data); } catch (_) {}
    return output;
  }

  function ensureRoot() {
    if (root) return root;
    root = document.createElement('div');
    root.id = 'principiaRankArena';
    root.style.cssText = 'position:fixed;inset:0;z-index:2147483200;display:none;align-items:center;justify-content:center;padding:12px;background:rgba(3,5,14,.86);backdrop-filter:blur(12px);color:#f7f3ff;font-family:system-ui,sans-serif';
    root.innerHTML = '<section style="width:min(980px,100%);max-height:94vh;overflow:auto;border:1px solid #8b75c8;border-radius:20px;background:linear-gradient(145deg,#17162b,#0b1020);box-shadow:0 25px 90px #000b"><header style="position:sticky;top:0;z-index:2;display:flex;justify-content:space-between;align-items:center;padding:14px 18px;background:#17162bf2;border-bottom:1px solid #51456e"><div><small style="letter-spacing:2px;color:#b9a9e9">PRINCIPIA PRO · RANKED ARENA</small><div style="font-size:20px;font-weight:800">ĐẤU TRƯỜNG</div></div><button type="button" data-close style="border:0;background:none;color:white;font-size:26px">×</button></header><main id="praBody" style="padding:16px"></main></section>';
    root.addEventListener('click', event => { if (event.target === root) closeArena(); });
    root.querySelector('[data-close]').addEventListener('click', closeArena);
    document.body.appendChild(root);
    return root;
  }

  function show(title, html) {
    const el = ensureRoot();
    el.querySelector('header div div').textContent = title;
    el.querySelector('#praBody').innerHTML = html;
    el.style.display = 'flex';
  }

  function closeArena() {
    if (root) root.style.display = 'none';
    activeMatch = null;
  }

  function button(label, action, primary) {
    return '<button type="button" onclick="' + action + '" style="border:1px solid ' + (primary ? '#c7a7ff' : '#62577f') + ';border-radius:11px;padding:11px 15px;margin:5px 6px 5px 0;background:' + (primary ? 'linear-gradient(120deg,#7652c8,#47308a)' : '#25223b') + ';color:#fff;font-weight:750;cursor:pointer">' + label + '</button>';
  }

  function renderHome() {
    if (state.daily !== todayKey()) { state.daily = todayKey(); state.dailyMatches = 0; saveState(); }
    const tier = currentTier(state.rp);
    const nextText = tier.next ? (tier.next.min - state.rp) + ' RP đến ' + tier.next.name : 'Đã đạt bậc cao nhất';
    const recent = state.matches.slice(-5).reverse();
    const history = recent.length ? recent.map(match => '<div style="display:flex;justify-content:space-between;gap:10px;padding:9px 0;border-bottom:1px solid #38324d"><span>' + escapeHtml(match.rival) + ' · ' + new Date(match.date).toLocaleString('vi-VN') + '</span><b style="color:' + (match.result === 'win' ? '#78e0ac' : '#f2a2a2') + '">' + (match.result === 'win' ? 'THẮNG' : 'THUA') + ' · ' + (match.rpChange > 0 ? '+' : '') + match.rpChange + ' RP</b></div>').join('') : '<p style="color:#aaa">Chưa có trận xếp hạng.</p>';
    const missions = [
      { id: 'daily-1', label: 'Chơi 1 trận xếp hạng', value: state.dailyMatches, target: 1, reward: 15 },
      { id: 'daily-3', label: 'Chơi 3 trận xếp hạng', value: state.dailyMatches, target: 3, reward: 25 },
      { id: 'wins-2', label: 'Thắng 2 trận trong mùa', value: state.wins, target: 2, reward: 30 }
    ];
    const missionHtml = missions.map(m => {
      const key = todayKey() + ':' + m.id;
      const done = m.value >= m.target;
      const claimed = state.claims.includes(key);
      return '<div style="padding:10px;border:1px solid #39334f;border-radius:12px;margin:7px 0"><b>' + m.label + '</b><div style="color:#aaa;font-size:12px;margin:4px 0">' + Math.min(m.value, m.target) + '/' + m.target + ' · thưởng ' + m.reward + ' RP</div>' + (claimed ? '<small style="color:#80dcae">Đã nhận</small>' : done ? button('Nhận thưởng', 'principiaRankClaim("' + m.id + '")', true) : '<small style="color:#aaa">Đang thực hiện</small>') + '</div>';
    }).join('');
    const rivals = RIVALS.map(r => '<div style="padding:10px;border:1px solid #39334f;border-radius:12px"><b>' + r.icon + ' ' + r.name + '</b><div style="color:#aaa;font-size:12px">' + r.style + ' · Đối thủ AI</div></div>').join('');
    show('ĐẤU TRƯỜNG', '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:12px"><section style="padding:17px;border:1px solid #8b75c8;border-radius:16px;background:linear-gradient(130deg,#39265e,#17162b)"><small style="color:#c9b9f5">HẠNG HIỆN TẠI</small><div style="font-size:29px;font-weight:900;margin:6px 0">' + tier.icon + ' ' + tier.label + '</div><div style="font-size:22px;font-weight:800">' + state.rp + ' RP</div><div style="height:9px;background:#090914;border-radius:9px;margin:12px 0;overflow:hidden"><div style="height:100%;width:' + Math.round(tier.progress * 100) + '%;background:linear-gradient(90deg,#9b7aff,#e5c8ff)"></div></div><small style="color:#d0c5e8">' + nextText + '</small></section><section style="padding:15px;border:1px solid #39334f;border-radius:16px"><small style="color:#aaa">THÀNH TÍCH MÙA</small><div style="font-size:25px;font-weight:800;margin-top:8px">' + state.wins + 'W / ' + state.losses + 'L</div><div style="color:#aaa;font-size:12px">MMR ẩn: ' + state.mmr + ' · ' + state.dailyMatches + '/' + DAILY_LIMIT + ' trận hôm nay</div><div style="color:#aaa;font-size:12px;margin-top:8px">RP tách biệt với EXP học tập.</div></section></div><section style="margin-top:14px;padding:14px;border:1px solid #39334f;border-radius:14px"><h3 style="margin:0 0 8px">CHỌN CHẾ ĐỘ</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px"><button onclick="principiaRankStart(&quot;balanced&quot;)" style="padding:14px;border-radius:12px;background:#28223e;color:white;border:1px solid #65538e;text-align:left"><b>⚔️ Đấu xếp hạng</b><div style="font-size:12px;color:#bbb;margin-top:5px">5 câu · cân bằng kiến thức và tốc độ</div></button><button onclick="principiaRankStart(&quot;accuracy&quot;)" style="padding:14px;border-radius:12px;background:#28223e;color:white;border:1px solid #65538e;text-align:left"><b>🎯 Chuẩn xác</b><div style="font-size:12px;color:#bbb;margin-top:5px">Ưu tiên số câu đúng</div></button><button onclick="principiaRankStart(&quot;combo&quot;)" style="padding:14px;border-radius:12px;background:#28223e;color:white;border:1px solid #65538e;text-align:left"><b>🔥 Chuỗi liên tiếp</b><div style="font-size:12px;color:#bbb;margin-top:5px">Thưởng nhịp trả lời đúng liên tục</div></button></div></section><section style="margin-top:14px;padding:14px;border:1px solid #39334f;border-radius:14px"><h3 style="margin:0 0 8px">NHIỆM VỤ</h3>' + missionHtml + '</section><section style="margin-top:14px;padding:14px;border:1px solid #39334f;border-radius:14px"><h3 style="margin:0 0 8px">ĐỐI THỦ AI</h3><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px">' + rivals + '</div><p style="color:#aaa;font-size:12px">Đây là nhân vật AI hư cấu, không phải người chơi trực tuyến.</p></section><section style="margin-top:14px;padding:14px;border:1px solid #39334f;border-radius:14px"><h3 style="margin:0 0 8px">LỊCH SỬ TRẬN</h3>' + history + '</section>' + button('Đóng đấu trường', 'principiaRankClose()') + '<p style="font-size:11px;color:#8f89a1">Mỗi ngày tối đa ' + DAILY_LIMIT + ' trận xếp hạng để hạn chế cày điểm. Không mất RP vì nghỉ học.</p>');
  }

  function startMatch(mode) {
    const questions = collectQuestions();
    if (questions.length < MATCH_SIZE) {
      show('CHƯA ĐỦ DỮ LIỆU', '<p>Ngân hàng câu hỏi hiện có ' + questions.length + ' câu hợp lệ. Cần ít nhất ' + MATCH_SIZE + ' câu để mở trận xếp hạng.</p>' + button('Quay lại', 'principiaRankHome()'));
      return;
    }
    if (state.daily !== todayKey()) { state.daily = todayKey(); state.dailyMatches = 0; }
    if (state.dailyMatches >= DAILY_LIMIT) {
      show('ĐÃ ĐẠT GIỚI HẠN NGÀY', '<p>Bạn đã chơi đủ ' + DAILY_LIMIT + ' trận hôm nay. Ngày mai có thể tiếp tục. Không có hình phạt khi nghỉ.</p>' + button('Quay lại', 'principiaRankHome()'));
      return;
    }
    const shuffled = questions.slice().sort(() => Math.random() - 0.5).slice(0, MATCH_SIZE);
    const tier = currentTier(state.rp);
    const rivalPool = RIVALS.slice().sort((a, b) => Math.abs(a.rating - state.mmr) - Math.abs(b.rating - state.mmr));
    const rival = rivalPool[Math.floor(Math.random() * Math.min(3, rivalPool.length))];
    activeMatch = { mode, questions: shuffled, rival, index: 0, answers: [], combo: 0, bestCombo: 0, startedAt: Date.now(), tierAtStart: tier.id };
    renderQuestion();
  }

  function renderQuestion() {
    const match = activeMatch;
    if (!match) return;
    const q = match.questions[match.index];
    const progress = Math.round(match.index / MATCH_SIZE * 100);
    show('TRẬN ĐẤU · ' + (match.index + 1) + '/' + MATCH_SIZE, '<div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;color:#c7b9e9"><b>' + match.rival.icon + ' ' + match.rival.name + ' · AI ' + match.rival.style + '</b><span>' + (match.mode === 'accuracy' ? 'CHUẨN XÁC' : match.mode === 'combo' ? 'COMBO' : 'CÂN BẰNG') + '</span></div><div style="height:7px;background:#080811;border-radius:8px;margin:12px 0 18px;overflow:hidden"><div style="height:100%;width:' + progress + '%;background:#9c7bff"></div></div><small style="color:#aaa">' + escapeHtml(q.topic) + '</small><h2 style="font-size:20px;line-height:1.5;margin:10px 0 18px">' + escapeHtml(q.q) + '</h2><div style="display:grid;gap:9px">' + q.a.map((answer, i) => '<button type="button" onclick="principiaRankAnswer(' + i + ')" style="padding:14px;text-align:left;border:1px solid #51466c;border-radius:12px;background:#211e34;color:#fff;font-size:15px">' + String.fromCharCode(65 + i) + '. ' + escapeHtml(answer) + '</button>').join('') + '</div><p style="font-size:12px;color:#aaa;margin-top:16px">Chọn đáp án độc lập. Trợ lý AI không tiết lộ đáp án trong trận xếp hạng.</p>');
  }

  function answerQuestion(index) {
    const match = activeMatch;
    if (!match) return;
    const q = match.questions[match.index];
    const selected = validInt(index, 0, q.a.length - 1);
    const correct = selected === q.correct;
    match.answers.push({ correct, selected, expected: q.correct });
    match.combo = correct ? match.combo + 1 : 0;
    match.bestCombo = Math.max(match.bestCombo, match.combo);
    match.index += 1;
    if (match.index >= MATCH_SIZE) finishMatch();
    else renderQuestion();
  }

  function finishMatch() {
    const match = activeMatch;
    if (!match) return;
    const correct = match.answers.filter(a => a.correct).length;
    const accuracy = correct / MATCH_SIZE;
    const base = match.rival.rating / 1000;
    const modeBonus = match.mode === 'combo' ? match.bestCombo * 0.025 : 0;
    const rivalCorrect = Math.max(1, Math.min(MATCH_SIZE, Math.round((0.48 + base * 0.28 + (Math.random() * 0.2 - 0.1)) * MATCH_SIZE)));
    const userScore = accuracy + modeBonus;
    const rivalScore = rivalCorrect / MATCH_SIZE + (match.mode === 'accuracy' ? 0.02 : 0);
    const won = userScore > rivalScore || (userScore === rivalScore && correct >= 4);
    const rpChange = won ? 20 : -8;
    state.rp = Math.max(0, state.rp + rpChange);
    state.mmr = validInt(state.mmr + (won ? 18 : -12) + Math.round((accuracy - 0.5) * 20), 100, 3000);
    state.dailyMatches += 1;
    if (won) state.wins += 1; else state.losses += 1;
    const record = { date: new Date().toISOString(), rival: match.rival.name, mode: match.mode, correct, total: MATCH_SIZE, rivalCorrect, result: won ? 'win' : 'loss', rpChange, bestCombo: match.bestCombo };
    state.matches.push(record);
    updateAchievements();
    saveState();
    activeMatch = null;
    const tier = currentTier(state.rp);
    const answerReview = match.questions.map((q, i) => '<div style="padding:9px 0;border-bottom:1px solid #38324d"><b>' + (match.answers[i].correct ? '✓' : '✕') + ' ' + escapeHtml(q.q) + '</b><div style="font-size:12px;color:#aaa;margin-top:4px">Đáp án đúng: ' + escapeHtml(q.a[q.correct]) + '</div></div>').join('');
    show(won ? 'CHIẾN THẮNG' : 'TRẬN ĐẤU KẾT THÚC', '<div style="text-align:center;padding:18px;border:1px solid ' + (won ? '#8d75ca' : '#75515b') + ';border-radius:16px;background:linear-gradient(140deg,#342650,#141426)"><div style="font-size:38px">' + (won ? '🏆' : '⚔️') + '</div><h2 style="font-size:26px;margin:6px 0">' + (won ? 'VICTORY' : 'DEFEAT') + '</h2><div style="font-size:22px;font-weight:850;color:' + (rpChange > 0 ? '#8be3b3' : '#f1a0a0') + '">' + (rpChange > 0 ? '+' : '') + rpChange + ' RP</div><p style="color:#c7bddb">' + match.rival.name + ' · AI · ' + rivalCorrect + '/' + MATCH_SIZE + ' câu</p><p>Bạn: ' + correct + '/' + MATCH_SIZE + ' câu đúng · Combo tốt nhất: ' + match.bestCombo + '</p><div style="font-size:21px">' + tier.icon + ' ' + tier.label + '</div></div><h3>Phân tích đáp án</h3>' + answerReview + button('Trở về đấu trường', 'principiaRankHome()', true) + button('Chơi trận tiếp', 'principiaRankStart("' + match.mode + '")'));
  }

  function updateAchievements() {
    const definitions = [
      ['first-win', 'Chiến thắng đầu tiên', state.wins >= 1],
      ['five-wins', 'Chiến binh bền bỉ', state.wins >= 5],
      ['ten-wins', 'Đấu sĩ kỳ cựu', state.wins >= 10],
      ['rank-gold', 'Chạm mốc Vàng', state.rp >= 250],
      ['rank-diamond', 'Chạm mốc Kim cương', state.rp >= 700],
      ['rank-challenger', 'Thách đấu', state.rp >= 1900]
    ];
    definitions.forEach(([id, name, unlocked]) => {
      if (unlocked && !state.achievements.some(item => item.id === id)) state.achievements.push({ id, name, date: new Date().toISOString() });
    });
  }

  function claimMission(id) {
    const today = todayKey();
    if (state.daily !== today) { state.daily = today; state.dailyMatches = 0; }
    const definitions = {
      'daily-1': { value: state.dailyMatches, target: 1, reward: 15 },
      'daily-3': { value: state.dailyMatches, target: 3, reward: 25 },
      'wins-2': { value: state.wins, target: 2, reward: 30 }
    };
    const mission = definitions[id];
    const key = today + ':' + id;
    if (!mission || mission.value < mission.target || state.claims.includes(key)) return;
    state.claims.push(key);
    state.rp = Math.min(1000000, state.rp + mission.reward);
    updateAchievements();
    saveState();
    renderHome();
  }

  function renderHomeSafe() { renderHome(); }
  window.principiaRankHome = renderHomeSafe;
  window.principiaRankStart = startMatch;
  window.principiaRankAnswer = answerQuestion;
  window.principiaRankClaim = claimMission;
  window.principiaRankClose = closeArena;
  window.principiaSuiteRankLeague = renderHomeSafe;

  function install() {
    if (typeof window.principiaSuiteRankLeague === 'function') {
      const quick = document.getElementById('principiaRankQuickAccess');
      if (quick) quick.title = 'Mở đấu trường xếp hạng PRINCIPIA PRO';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();