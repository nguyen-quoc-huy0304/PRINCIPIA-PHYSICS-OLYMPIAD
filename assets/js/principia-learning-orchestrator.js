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
  const DEFAULT_STEPS = [
    'Tự nêu điều đã biết và điều cần tìm trước khi xem gợi ý.',
    'Chọn nguyên lý phù hợp, giải thích vì sao nguyên lý đó áp dụng được.',
    'Thử một câu tương tự mà không xem lời giải, sau đó tự kiểm tra.'
  ];
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

  function inferGoal(context) {
    if (context.goal && GOALS[context.goal]) return context.goal;
    const percent = Number(context.percent);
    const errors = Number(context.errorCount) || 0;
    if (errors >= 3 || (Number.isFinite(percent) && percent < 50)) return 'recover';
    if (Number.isFinite(percent) && percent >= 80) return 'solve';
    if (/giảng|dạy|teach|classroom/i.test(context.phase || '')) return 'teach';
    if (/ôn|nhớ|flashcard|review/i.test(context.phase || '')) return 'remember';
    return 'understand';
  }

  function topicFrom(context) {
    const explicit = clean(context.topic, 120);
    if (explicit) return explicit;
    const heading = document.querySelector('#app h1,#app h2,.page-title,h1')?.textContent;
    return clean(heading || 'Vật lý', 120);
  }

  function choose(context = {}) {
    const items = catalog();
    const topic = topicFrom(context);
    const goal = inferGoal(context);
    const terms = GOALS[goal];
    const energy = [1, 2, 3].includes(Number(context.energy)) ? Number(context.energy) : 2;
    const confidence = Number.isFinite(Number(context.confidence)) ? Math.max(1, Math.min(5, Number(context.confidence))) : 3;
    const topicWords = topic.toLocaleLowerCase('vi').split(/[^\p{L}\p{N}]+/u).filter(word => word.length > 2);
    const recent = new Set(state.recent.map(item => item.id));
    const scored = items.map(item => {
      const title = clean(item.title, 180);
      const desc = clean(item.desc, 500);
      const category = clean(item.category, 100);
      const haystack = (title + ' ' + desc + ' ' + category).toLocaleLowerCase('vi');
      const topicHits = topicWords.filter(word => haystack.includes(word)).length;
      const goalHits = terms.filter(term => haystack.includes(term)).length;
      const isCore = Number(item.id) > 0 && Number(item.id) <= 231;
      const steps = Array.isArray(item.steps) ? item.steps.map(step => clean(step, 500)).filter(Boolean).slice(0, 5) : [];
      const score = topicHits * 5 + goalHits * 3 + (steps.length ? 2 : 0) + (isCore ? 1 : 0) - (recent.has(item.id) ? 10 : 0);
      return { item, score, steps };
    }).filter(entry => entry.item && entry.item.title).sort((a, b) => b.score - a.score);
    const fresh = scored.filter(entry => !recent.has(entry.item.id));
    const pool = (fresh.length ? fresh : scored).slice(0, Math.min(8, fresh.length || scored.length));
    const candidate = pool.length ? pool[state.sessions % pool.length] : null;
    if (!candidate) {
      return { topic, goal, energy, confidence, estimatedMinutes: energy === 1 ? 10 : goal === 'remember' ? 15 : energy === 3 ? 35 : 25, title: 'Bước học tiếp theo', description: 'Bắt đầu bằng một câu hỏi ngắn để xác định phần bạn đã hiểu.', steps: DEFAULT_STEPS, methodId: null };
    }
    return {
      topic, goal, energy, confidence,
      title: displayTitle(goal, context),
      description: displayDescription(goal, context),
      steps: candidate.steps.length ? candidate.steps : DEFAULT_STEPS,
      methodId: candidate.item.id,
      estimatedMinutes: energy === 1 ? 10 : goal === 'remember' ? 15 : energy === 3 ? 35 : 25
    };
  }

  function displayTitle(goal, context) {
    if (goal === 'recover') return 'Gỡ đúng chỗ đang vướng';
    if (goal === 'remember') return 'Kiểm tra trí nhớ trước khi xem lại';
    if (goal === 'solve') return 'Thử thách vận dụng tiếp theo';
    if (goal === 'olympiad') return 'Thử thách tư duy Olympic';
    if (goal === 'teach') return 'Giải thích lại để kiểm tra hiểu sâu';
    if (Number(context.percent) >= 80) return 'Mở rộng sang tình huống mới';
    return 'Xây nền tảng rồi tự thử';
  }

  function displayDescription(goal, context) {
    if (goal === 'recover') return 'PRINCIPIA ưu tiên tìm lỗ hổng kiến thức và đưa bạn quay lại đúng bước cần sửa.';
    if (goal === 'remember') return 'Hãy thử nhớ lại từ đầu. Chỉ mở tài liệu sau khi đã tự trả lời.';
    if (goal === 'solve') return 'Bạn đã có nền tảng. Tiếp theo là bài có cách biểu diễn hoặc dữ kiện khác.';
    if (goal === 'olympiad') return 'Ưu tiên nhận diện cấu trúc, tìm bất biến, kiểm tra trường hợp biên và chứng minh từng bước.';
    if (goal === 'teach') return 'Hãy giảng bằng lời của mình. Học sinh AI sẽ hỏi tiếp ở chỗ còn thiếu căn cứ.';
    if (Number(context.percent) >= 80) return 'Kết quả gần đây cho thấy bạn có thể thử bài chuyển giao khó hơn.';
    return 'Bắt đầu bằng hình dung hiện tượng, xác định giả thiết rồi mới đi vào công thức.';
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
    const plan = choose({ topic, percent, errorCount: mistakes.length });
    if (plan.methodId != null) {
      state.recent = state.recent.filter(item => item.id !== plan.methodId);
      state.recent.push({ id: plan.methodId, at: Date.now() });
      state.recent = state.recent.slice(-MAX_RECENT);
    }
    save();
    window.dispatchEvent(new CustomEvent('principia:next-step-updated', {
      detail: { title: plan.title, description: plan.description, topic: plan.topic, goal: plan.goal }
    }));
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

  function getNext(context = {}) {
    return choose(Object.assign({}, state.profile, context));
  }

  async function getNextWithRust(context = {}) {
    const legacy = getNext(context);
    try {
      const plan = await window.PrincipiaWasmPhysics.recommend({
        goal: context.goal || 'auto',
        percent: Number.isFinite(Number(context.percent)) ? Number(context.percent) : null,
        errorCount: Number(context.errorCount) || 0,
        phase: clean(context.phase, 100),
        energy: [1, 2, 3].includes(Number(context.energy)) ? Number(context.energy) : 2,
        confidence: Number.isFinite(Number(context.confidence)) ? Math.max(1, Math.min(5, Number(context.confidence))) : 3,
        topic: legacy.topic
      });
      return { ...legacy, goal: plan.goal, steps: plan.steps, estimatedMinutes: plan.focusMinutes, nextAction: plan.nextAction, engine: 'rust-wasm' };
    } catch (_) {
      return { ...legacy, engine: 'javascript-fallback' };
    }
  }

  function begin(context = {}) {
    const plan = getNext(context);
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
    return { title: plan.title, topic: plan.topic };
  }

  function directive(context = {}) {
    const plan = getNext(context);
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
    recommend: getNext, recommendWithRust: getNextWithRust, begin, directive, startFocus,
    getProfile: () => JSON.parse(JSON.stringify(state.profile)),
    stats: () => ({ sessions: state.sessions, recentChoices: state.recent.length })
  });

  window.addEventListener('principia:quiz-completed', recordQuiz);
  window.addEventListener('principia:adaptive-retry-assessed', recordRetryAssessment);
  window.addEventListener('principia:next-step-updated', showNextStep);
})();