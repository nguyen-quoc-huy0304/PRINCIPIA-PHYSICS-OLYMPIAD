/* PRINCIPIA Learning Orchestrator — applies learning science invisibly in the learner journey. */
(() => {
  'use strict';
  const STORE = 'principia_learning_orchestrator_v1';
  const MAX_RECENT = 12;
  const GOALS = {
    understand: ['hiểu khái niệm', 'giải thích bằng hình', 'mô hình hóa', 'ví dụ cụ thể', 'hiểu sâu', 'feynman', 'concept'],
    remember: ['ghi nhớ', 'truy xuất', 'ôn tập', 'flashcard', 'nhắc lại', 'spaced', 'retrieval'],
    solve: ['giải bài', 'phân tích', 'chiến lược', 'luyện tập', 'problem solving'],
    olympiad: ['olympiad', 'bài tổng hợp', 'bảo toàn', 'đối xứng', 'bất biến', 'chứng minh', 'trường hợp biên', 'ước lượng'],
    teach: ['giảng', 'dạy', 'giải thích', 'phản biện', 'teach', 'peer instruction'],
    recover: ['lỗi', 'sửa lỗi', 'thành thạo', 'tự kiểm tra', 'error', 'deliberate practice']
  };
  let state = load();

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      return {
        recent: Array.isArray(raw.recent) ? raw.recent.slice(-MAX_RECENT) : [],
        profile: raw.profile && typeof raw.profile === 'object' ? raw.profile : {},
        sessions: Number.isFinite(Number(raw.sessions)) ? Math.max(0, Number(raw.sessions)) : 0
      };
    } catch (_) {
      return { recent: [], profile: {}, sessions: 0 };
    }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); }
    catch (error) { console.warn('[PRINCIPIA] Learning profile could not be saved:', error); }
  }

  function clean(value, max = 240) {
    return String(value == null ? '' : value).replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max);
  }

  function catalog() {
    return Array.isArray(window.PRINCIPIA_STUDY_METHOD_CATALOG)
      ? window.PRINCIPIA_STUDY_METHOD_CATALOG
      : [];
  }

  function topicFrom(context) {
    const explicit = clean(context.topic, 120);
    if (explicit) return explicit;
    const heading = document.querySelector('#app h1,#app h2,.page-title,h1')?.textContent;
    return clean(heading || 'Vật lý', 120);
  }

  function promptFor(plan, extra = '', context = {}) {
    const steps = plan.steps.map((step, index) => (index + 1) + '. ' + step).join('\n');
    const science = window.PrincipiaLearningScience?.directive?.({
      topic: plan.topic, goal: plan.goal, energy: plan.energy, confidence: plan.confidence,
      percent: context.percent, errorCount: context.errorCount, fatigue: context.fatigue,
      distracted: context.distracted, socialLearning: context.socialLearning, minutes: plan.estimatedMinutes, phase: context.phase
    }) || '';
    return [
      'Bạn là gia sư PRINCIPIA. Hãy áp dụng quy trình sư phạm sau một cách tự nhiên, tuyệt đối không nêu tên phương pháp hay nói về thuật toán chọn phương pháp.',
      'Chủ đề: ' + plan.topic + '. Mục tiêu: ' + plan.goal + '. Thời lượng khởi điểm: ' + plan.estimatedMinutes + ' phút. Mức năng lượng: ' + plan.energy + '/3.',
      'Các bước hướng dẫn nội bộ:\n' + steps,
      science,
      'Dẫn dắt từng bước, chỉ hỏi một câu tại một thời điểm. Chờ người học trả lời rồi mới phản hồi. Không tiết lộ đáp án cuối trước khi người học tự thử. Khi người học sai, xác định chính xác lỗ hổng và giảm độ khó; khi làm tốt, tăng thử thách hoặc đổi cách biểu diễn.',
      clean(extra, 1800)
    ].filter(Boolean).join('\n\n');
  }

  function recordQuiz(event) {
    const detail = event?.detail || {};
    const percent = Number(detail.percent);
    if (!Number.isFinite(percent)) return;
    const topic = clean(detail.source || detail.topic || 'Vật lý', 120);
    const mistakes = Array.isArray(detail.mistakes) ? detail.mistakes : [];
    state.profile = {
      topic, percent: Math.max(0, Math.min(100, percent)),
      errorCount: Math.min(100, mistakes.length),
      updatedAt: Date.now(), mode: clean(detail.mode || 'quiz', 40)
    };
    const planPromise = getNextWithRust({ topic, percent, errorCount: mistakes.length });
    planPromise.then(plan => {
    if (plan.methodId != null) {
      state.recent = state.recent.filter(item => item.id !== plan.methodId);
      state.recent.push({ id: plan.methodId, at: Date.now() });
      state.recent = state.recent.slice(-MAX_RECENT);
    }
    save();
    window.dispatchEvent(new CustomEvent('principia:next-step-updated', {
      detail: { title: plan.title, description: plan.description, topic: plan.topic, goal: plan.goal }
    }));
    }).catch(error => console.error('[PRINCIPIA] Rust learning recommendation failed:', error));
  }

  function recordRetryAssessment(event) {
    const detail = event?.detail || {};
    const score = Number(detail.score);
    if (!Number.isFinite(score) || score < 0 || score > 100) return;
    state.profile = Object.assign({}, state.profile, {
      topic: clean(detail.source || state.profile.topic || 'Vật lý', 120),
      lastRetryScore: Math.round(score),
      lastRetryPassed: detail.passed === true,
      retryUpdatedAt: Date.now(),
      errorCount: detail.passed === true ? Math.max(0, (Number(state.profile.errorCount) || 0) - 1) : Math.min(100, (Number(state.profile.errorCount) || 0) + 1)
    });
    save();
  }

  async function getNextWithRust(context = {}) {
    const merged = Object.assign({}, state.profile, context);
    const topic = topicFrom(merged);
    const payload = {
      context: {
        goal: GOALS[merged.goal] ? merged.goal : 'auto',
        percent: Number.isFinite(Number(merged.percent)) ? Number(merged.percent) : null,
        errorCount: Number(merged.errorCount) || 0,
        phase: clean(merged.phase, 100),
        energy: [1, 2, 3].includes(Number(merged.energy)) ? Number(merged.energy) : 2,
        confidence: Number.isFinite(Number(merged.confidence)) ? Math.max(1, Math.min(5, Number(merged.confidence))) : 3,
        topic
      },
      catalog: catalog().slice(0, 500),
      recentIds: state.recent.map(item => String(item.id)).slice(-MAX_RECENT),
      sessions: state.sessions
    };
    const plan = await window.PrincipiaWasmPhysics.orchestrateLearning(payload);
    if (!plan || typeof plan.goal !== 'string' || !Array.isArray(plan.steps)) {
      throw new Error('Rust learning engine returned an invalid plan');
    }
    return { ...plan, topic, energy: payload.context.energy, confidence: payload.context.confidence, engine: 'rust-wasm' };
  }

  let beginInProgress = false;
  async function begin(context = {}) {
    if (beginInProgress) return null;
    beginInProgress = true;
    try {
      const plan = await getNextWithRust(context);
      state.sessions += 1;
      if (plan.methodId != null) {
        state.recent = state.recent.filter(item => item.id !== plan.methodId);
        state.recent.push({ id: plan.methodId, at: Date.now() });
        state.recent = state.recent.slice(-MAX_RECENT);
      }
      save();
      const prompt = promptFor(plan, context.extra || '', context);
      if (window.principiaLocalAI?.open) window.principiaLocalAI.open(prompt);
      else if (window.principiaSuiteAI) window.principiaSuiteAI();
      else if (window.notify) window.notify('Trợ lý học tập đang khởi động. Hãy thử lại sau.');
      else alert('Trợ lý học tập chưa sẵn sàng. Hãy thử lại sau.');
      return { title: plan.title, topic: plan.topic, engine: plan.engine };
    } finally {
      beginInProgress = false;
    }
  }

  async function directive(context = {}) {
    const plan = await getNextWithRust(context);
    return promptFor(plan, 'Tích hợp cách dẫn dắt này vào vai trò hiện tại mà không nhắc tên kỹ thuật học tập.', context);
  }

  function startFocus() {
    if (window.PrincipiaProMastery?.open) {
      window.PrincipiaProMastery.open('study');
      return true;
    }
    if (window.principiaSuiteFocus) {
      window.principiaSuiteFocus();
      return true;
    }
    return false;
  }

  function showNextStep(event) {
    const detail = event?.detail || {};
    const title = clean(detail.title || 'Bước học tiếp theo', 100);
    const description = clean(detail.description || 'PRINCIPIA đã chọn hoạt động tiếp theo dựa trên kết quả vừa làm.', 260);
    document.getElementById('principiaNextStepToast')?.remove();
    if (!document.getElementById('principiaNextStepToastStyles')) {
      const style = document.createElement('style');
      style.id = 'principiaNextStepToastStyles';
      style.textContent = '#principiaNextStepToast{position:fixed;z-index:2147483000;left:50%;bottom:max(16px,env(safe-area-inset-bottom));transform:translateX(-50%);width:min(560px,calc(100vw - 28px));padding:14px 16px;border:1px solid var(--line,#46506a);border-radius:15px;background:var(--card,#171e30);color:var(--text,#f4f6ff);box-shadow:0 16px 48px #0008;font:inherit}#principiaNextStepToast p{margin:6px 0 12px;opacity:.78;font-size:13px;line-height:1.5}#principiaNextStepToast .pno-actions{display:flex;gap:8px;flex-wrap:wrap}#principiaNextStepToast button{border:1px solid var(--line,#46506a);border-radius:9px;padding:8px 11px;background:transparent;color:inherit}#principiaNextStepToast [data-start]{background:var(--primary,#6557dc);border-color:transparent;color:#fff}';
      document.head.appendChild(style);
    }
    const toast = document.createElement('aside');
    toast.id = 'principiaNextStepToast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    const heading = document.createElement('strong');
    heading.textContent = title;
    const text = document.createElement('p');
    text.textContent = description;
    const actions = document.createElement('div');
    actions.className = 'pno-actions';
    const start = document.createElement('button');
    start.type = 'button';
    start.dataset.start = '1';
    start.textContent = 'Tiếp tục với hướng dẫn';
    start.addEventListener('click', () => {
      toast.remove();
      begin({ topic: clean(detail.topic || state.profile.topic || 'Vật lý', 120), goal: GOALS[detail.goal] ? detail.goal : 'understand' });
    });
    const dismiss = document.createElement('button');
    dismiss.type = 'button';
    dismiss.textContent = 'Để sau';
    dismiss.addEventListener('click', () => toast.remove());
    actions.append(start, dismiss);
    toast.append(heading, text, actions);
    document.body.appendChild(toast);
  }

  window.PrincipiaLearningOrchestrator = Object.freeze({
    recommend: getNextWithRust, recommendWithRust: getNextWithRust, begin, directive, startFocus,
    getProfile: () => JSON.parse(JSON.stringify(state.profile)),
    stats: () => ({ sessions: state.sessions, recentChoices: state.recent.length })
  });

  window.addEventListener('principia:quiz-completed', recordQuiz);
  window.addEventListener('principia:adaptive-retry-assessed', recordRetryAssessment);
  window.addEventListener('principia:next-step-updated', showNextStep);
})();