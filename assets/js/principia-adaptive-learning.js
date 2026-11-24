/* PRINCIPIA Adaptive Learning — quiz-to-mastery pipeline and evidence-based recommendations. */
(function () {
  'use strict';

  const KEY = 'principia_adaptive_learning_v1';
  const MAX_ITEMS = 500;
  const DAY = 86400000;
  const defaults = { errors: [], completed: [], lastRecommendation: '' };
  let state = load();
  let observer = null;

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || '{}');
      return Object.assign({}, defaults, raw, {
        errors: Array.isArray(raw.errors) ? raw.errors : [],
        completed: Array.isArray(raw.completed) ? raw.completed : []
      });
    } catch (_) { return Object.assign({}, defaults); }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); }
    catch (error) { console.warn('[PRINCIPIA] Adaptive data could not be saved:', error); }
  }
  function escapeHtml(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function idFor(item) {
    const raw = [item.source, item.question, item.correctText].join('|');
    let hash = 2166136261;
    for (let i = 0; i < raw.length; i++) hash = Math.imul(hash ^ raw.charCodeAt(i), 16777619);
    return (hash >>> 0).toString(36);
  }
  function onQuiz(event) {
    const detail = event && event.detail;
    if (!detail || !Array.isArray(detail.mistakes)) return;
    const now = Date.now();
    detail.mistakes.forEach(item => {
      if (!item || !String(item.question || '').trim()) return;
      const id = idFor(item);
      const existing = state.errors.find(x => x.id === id);
      if (existing) {
        existing.misses = Math.min(99, (Number(existing.misses) || 1) + 1);
        existing.dueAt = Math.min(Number(existing.dueAt) || now, now + DAY);
        existing.lastSeenAt = now;
        existing.selectedText = String(item.selectedText || '').slice(0, 1000);
      } else {
        state.errors.unshift({
          id, question: String(item.question).slice(0, 2000),
          selectedText: String(item.selectedText || '').slice(0, 1000),
          correctText: String(item.correctText || '').slice(0, 2000),
          source: String(item.source || 'Quiz').slice(0, 200),
          misses: 1, createdAt: now, lastSeenAt: now, dueAt: now + DAY,
          intervalDays: 1, status: 'review'
        });
      }
    });
    state.errors = state.errors.slice(0, MAX_ITEMS);
    save();
    refreshCard(true);
  }
  function attempts() {
    try {
      const data = JSON.parse(localStorage.getItem('principia_learning_suite_v1') || '{}');
      return Array.isArray(data.attempts) ? data.attempts.slice(-10) : [];
    } catch (_) { return []; }
  }
  function recommendation() {
    const recent = attempts();
    const average = recent.length ? recent.reduce((sum, item) => sum + (Number(item.percent) || 0), 0) / recent.length : null;
    const due = state.errors.filter(item => item.status !== 'mastered' && Number(item.dueAt) <= Date.now()).length;
    const learnerProfile = window.PrincipiaLearningOrchestrator?.getProfile?.() || {};
    const unresolved = state.errors.filter(item => item.status !== 'mastered').length;
    const profile = window.PrincipiaLearningOrchestrator?.recommend({
      topic: state.errors[0]?.source || recent.at(-1)?.topic || learnerProfile.topic || 'Vật lý',
      percent: average,
      errorCount: unresolved,
      goal: unresolved >= 3 || (average !== null && average < 50) ? 'recover' : undefined
    });
    if (profile) return {
      title: profile.title,
      reason: profile.description,
      plan: profile,
      due
    };
    if (due >= 3) return { title: 'Ưu tiên sửa lỗi trước', reason: 'Có ' + due + ' lỗi đang đến hạn. Hãy tự giải lại từng câu.', due };
    if (average !== null && average < 50) return { title: 'Củng cố nền tảng', reason: 'Độ chính xác gần đây là ' + Math.round(average) + '%. Hãy học chậm lại và tự giải từng bước.', due };
    if (average !== null && average < 75) return { title: 'Luyện có hướng dẫn', reason: 'Chia bài thành bước nhỏ và tự nhớ lại nguyên lý trước khi xem gợi ý.', due };
    if (average !== null) return { title: 'Tăng khả năng vận dụng', reason: 'Thử tình huống mới và đổi cách biểu diễn để kiểm tra hiểu sâu.', due };
    return { title: 'Bắt đầu bằng phiên ngắn', reason: 'Học 5–10 phút, tự nhớ lại rồi làm một bài kiểm tra ngắn.', due };
  }
  function render() {
    const due = state.errors.filter(x => x.status !== 'mastered' && Number(x.dueAt) <= Date.now()).sort((a, b) => a.dueAt - b.dueAt);
    const next = recommendation();
    const current = due[0];
    const list = due.slice(0, 5).map(x => '<li><b>' + escapeHtml(x.source) + '</b> · ' + escapeHtml(x.question.slice(0, 180)) + ' <span>· ' + x.misses + ' lần sai</span></li>').join('');
    const active = current ? '<div class="ppa-task"><b>Câu cần tự giải lại</b><p>' + escapeHtml(current.question) + '</p><label>Viết lại cách giải độc lập<textarea id="ppaRetry" maxlength="3000" placeholder="Ghi dữ kiện, nguyên lý, từng bước và kết quả kiểm tra..."></textarea></label>' + (current.lastAssessmentFeedback ? '<p class="ppa-feedback"><b>Phản hồi lần trước (' + Number(current.lastAssessmentScore || 0) + '/100):</b> ' + escapeHtml(current.lastAssessmentFeedback) + '</p>' : '') + '<p class="ppa-muted">Khi bấm đánh giá, chỉ đề bài, đáp án tham chiếu và lời giải bạn viết được gửi tới Gemini. Free Tier có thể dùng nội dung này để cải thiện sản phẩm; không nhập thông tin cá nhân.</p><div class="ppa-actions"><button type="button" data-ppa-submit>Đánh giá lời giải bằng Gemini</button><button type="button" data-ppa-hint>Nhận gợi ý từng bước</button></div></div>' : '<p class="ppa-muted">Không có lỗi đến hạn. Tiếp tục làm bài mới để hệ thống cập nhật lộ trình.</p>';
    return '<section id="principiaAdaptiveCard" class="ppm-card ppa-card"><h3>PRINCIPIA đang điều chỉnh cách học</h3><p class="ppa-muted"><b>' + escapeHtml(next.title) + '</b><br>' + escapeHtml(next.reason) + '</p><div class="ppa-actions"><button type="button" data-ppa-guided>Hướng dẫn tôi bước tiếp theo</button></div><div class="ppa-metrics"><span><b>' + due.length + '</b> lỗi đến hạn</span><span><b>' + state.errors.filter(x => x.status !== 'mastered').length + '</b> lỗi cần ôn</span><span><b>' + state.completed.length + '</b> lần tự giải đã ghi</span></div>' + active + (list ? '<details><summary>Các lỗi đang đến hạn</summary><ol>' + list + '</ol></details>' : '') + '<p class="ppa-muted">Lịch gợi ý tăng dần 1 → 3 → 7 → 14 → 30 ngày khi tự giải thành công. Gemini đưa ra phản hồi học thuật tham khảo; người học vẫn cần đối chiếu với định luật, đơn vị và lời giải chuẩn.</p></section>';
  }
  function style() {
    if (document.getElementById('principiaAdaptiveStyles')) return;
    const css = document.createElement('style');
    css.id = 'principiaAdaptiveStyles';
    css.textContent = '#principiaAdaptiveCard{margin-top:12px}#principiaAdaptiveCard .ppa-muted{opacity:.75;font-size:13px;line-height:1.55}#principiaAdaptiveCard .ppa-metrics{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0}#principiaAdaptiveCard .ppa-metrics span{padding:8px 10px;border:1px solid var(--line,#39435b);border-radius:9px;font-size:12px}#principiaAdaptiveCard .ppa-task{padding:12px;border:1px solid var(--line,#39435b);border-radius:12px;margin-top:10px}#principiaAdaptiveCard .ppa-feedback{padding:10px;border-left:3px solid var(--primary,#6557dc);background:rgba(120,120,180,.08);border-radius:8px;font-size:13px;line-height:1.5}#principiaAdaptiveCard textarea{display:block;box-sizing:border-box;width:100%;min-height:100px;margin:7px 0;padding:10px;border:1px solid var(--line,#39435b);border-radius:9px;background:var(--bg,#101626);color:inherit}#principiaAdaptiveCard .ppa-check{display:flex;align-items:center;gap:8px;font-size:12px}#principiaAdaptiveCard .ppa-check input{width:auto}#principiaAdaptiveCard .ppa-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}#principiaAdaptiveCard button{padding:9px 12px;border:1px solid var(--line,#39435b);border-radius:9px;background:transparent;color:inherit}#principiaAdaptiveCard button:first-child{background:var(--primary,#6557dc);color:white;border-color:transparent}#principiaAdaptiveCard details{margin-top:10px;font-size:13px}#principiaAdaptiveCard li{margin:6px 0}';
    document.head.appendChild(css);
  }
  function refreshCard(force) {
    const root = document.querySelector('#principiaProMastery .ppm-content');
    const active = document.querySelector('#principiaProMastery .ppm-tabs [aria-current="true"]')?.dataset.tab;
    if (!root || !['overview', 'mastery'].includes(active)) return;
    const existing = document.getElementById('principiaAdaptiveCard');
    if (existing && !force) return;
    if (existing) existing.remove();
    style();
    root.insertAdjacentHTML('beforeend', render());
    bindCard();
  }
  function bindCard() {
    const card = document.getElementById('principiaAdaptiveCard');
    if (!card || card.dataset.bound === '1') return;
    card.dataset.bound = '1';
    card.querySelector('[data-ppa-submit]')?.addEventListener('click', submitRetry);
    card.querySelector('[data-ppa-hint]')?.addEventListener('click', requestHint);
    card.querySelector('[data-ppa-guided]')?.addEventListener('click', beginGuidedStep);
  }
  async function submitRetry() {
    const card = document.getElementById('principiaAdaptiveCard');
    const answer = card?.querySelector('#ppaRetry')?.value.trim() || '';
    const item = state.errors.filter(x => x.status !== 'mastered' && Number(x.dueAt) <= Date.now()).sort((a, b) => a.dueAt - b.dueAt)[0];
    if (!item) return refreshCard();
    if (answer.length < 30) return alert('Hãy trình bày cách giải độc lập ít nhất 30 ký tự.');
    const button = card.querySelector('[data-ppa-submit]');
    if (!window.PrincipiaRetryAssessor?.assess) return alert('Bộ đánh giá Gemini chưa sẵn sàng. Hãy tải lại trang.');
    button.disabled = true;
    button.textContent = 'Gemini đang đánh giá…';
    try {
      const result = await window.PrincipiaRetryAssessor.assess({
        question: item.question,
        correctText: item.correctText,
        answer,
        source: item.source
      });
      item.assessmentAttempts = Math.min(99, (Number(item.assessmentAttempts) || 0) + 1);
      item.lastAssessmentAt = Date.now();
      item.lastAssessmentScore = result.score;
      item.lastAssessmentFeedback = result.feedback + (result.nextStep ? ' Bước tiếp theo: ' + result.nextStep : '');
      if (!result.passed) {
        item.dueAt = Date.now();
        item.status = 'review';
        save();
        refreshCard(true);
        alert('Chưa đạt mức thành thạo (' + result.score + '/100). Đọc phản hồi rồi tự thử lại.');
        window.dispatchEvent(new CustomEvent('principia:adaptive-retry-assessed', {
          detail: { passed: false, score: result.score, source: item.source }
        }));
        return;
      }
      const days = [1, 3, 7, 14, 30];
      const index = Math.min(days.length - 1, Math.max(0, Number(item.intervalIndex) || 0));
      const next = days[index];
      item.intervalIndex = Math.min(days.length - 1, index + 1);
      item.intervalDays = next;
      item.dueAt = Date.now() + next * DAY;
      item.status = 'review';
      item.lastIndependentRetry = Date.now();
      item.lastRetryLength = answer.length;
      state.completed.unshift({ id: item.id, at: Date.now(), intervalDays: next, score: result.score });
      state.completed = state.completed.slice(0, MAX_ITEMS);
      save();
      refreshCard(true);
      alert('Lời giải đạt ' + result.score + '/100. Đã lên lịch ôn lại sau ' + next + ' ngày.');
      window.dispatchEvent(new CustomEvent('principia:adaptive-retry-assessed', {
        detail: { passed: true, score: result.score, source: item.source, intervalDays: next }
      }));
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Không thể đánh giá lời giải. Hãy thử lại.');
      button.disabled = false;
      button.textContent = 'Đánh giá lời giải bằng Gemini';
    }
  }
  function beginGuidedStep() {
    const next = recommendation();
    if (window.PrincipiaLearningOrchestrator?.begin) {
      window.PrincipiaLearningOrchestrator.begin({
        topic: next.plan?.topic || state.errors[0]?.source || 'Vật lý',
        goal: next.plan?.goal || 'understand',
        errorCount: next.due || 0,
        extra: 'Hãy bắt đầu bằng một câu hỏi ngắn. Không trình bày danh sách phương pháp hay tên kỹ thuật cho người học.'
      });
      return;
    }
    requestHint();
  }
  function requestHint() {
    const item = state.errors.filter(x => x.status !== 'mastered' && Number(x.dueAt) <= Date.now()).sort((a, b) => a.dueAt - b.dueAt)[0];
    if (!item) return;
    const directive = window.PrincipiaLearningOrchestrator?.directive({ topic: item.source, goal: 'recover', extra: 'Câu hỏi cần sửa: ' + item.question + '. Đáp án chuẩn chỉ dùng nội bộ: ' + item.correctText });
    const prompt = 'Bạn là PRINCIPIA AI Coach. Không đưa đáp án cuối. Hãy hỏi người học đã thử bước nào, sau đó đưa một gợi ý vừa đủ và yêu cầu họ tự giải lại. ' + (directive || '') + ' Câu hỏi: ' + item.question + '. Đáp án chuẩn (chỉ dùng để định hướng, không tiết lộ trực tiếp): ' + item.correctText;
    if (window.principiaLocalAI && typeof window.principiaLocalAI.open === 'function') window.principiaLocalAI.open(prompt);
    else if (typeof window.principiaSuiteAI === 'function') window.principiaSuiteAI();
    else alert('AI Coach chưa sẵn sàng. Hãy tự thử lại câu hỏi trước.');
  }
  function observe() {
    if (observer || !document.body) return;
    observer = new MutationObserver(() => {
      const root = document.querySelector('#principiaProMastery .ppm-content');
      if (root && !document.getElementById('principiaAdaptiveCard')) refreshCard();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
  function init() {
    window.addEventListener('principia:quiz-completed', onQuiz);
    observe();
    refreshCard();
  }
  window.PrincipiaAdaptiveLearning = {
    getState: () => JSON.parse(JSON.stringify(state)),
    recommend: recommendation,
    refresh: refreshCard
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();