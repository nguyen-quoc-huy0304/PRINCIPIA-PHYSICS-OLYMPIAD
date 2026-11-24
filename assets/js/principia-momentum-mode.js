/* PRINCIPIA Momentum Mode — optional, private-by-default study recovery and focused progress. */
(() => {
  'use strict';

  const STORE = 'principia_momentum_mode_v1';
  const MAX_SESSIONS = 200;
  const DURATIONS = [25, 50, 75];
  const TARGETS = [30, 60, 90, 120, 180];
  const MODES = {
    steady: { label: 'Giữ nhịp ổn định', instruction: 'Chia mục tiêu thành bước nhỏ, tăng độ khó vừa phải và giữ nhịp bền vững.' },
    intense: { label: 'Tăng tốc có kiểm soát', instruction: 'Tạo thử thách tập trung cao, yêu cầu đầu ra cụ thể và tăng độ khó khi người học làm tốt.' },
    gentle: { label: 'Bắt đầu nhẹ nhàng', instruction: 'Bắt đầu bằng một nhiệm vụ nhỏ dễ hoàn thành, giảm tải nhận thức và chỉ tăng nhịp khi người học sẵn sàng.' }
  };
  let state = load();
  let timer = null;
  let endAt = 0;
  let remaining = 0;
  let running = false;
  let selectedMode = state.mode;
  let selectedEnergy = state.energy;
  let selectedDuration = state.duration;
  let selectedTarget = state.target;

  function load() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      const sessions = Array.isArray(raw.sessions) ? raw.sessions.filter(item =>
        item && /^\d{4}-\d{2}-\d{2}$/.test(item.date) &&
        Number.isFinite(item.minutes) && item.minutes >= 0 && item.minutes <= 180
      ).slice(-MAX_SESSIONS) : [];
      return {
        sessions,
        mode: Object.hasOwn(MODES, raw.mode) ? raw.mode : 'steady',
        energy: [1, 2, 3].includes(raw.energy) ? raw.energy : 2,
        duration: DURATIONS.includes(raw.duration) ? raw.duration : 25,
        target: TARGETS.includes(raw.target) ? raw.target : 60,
        lastResult: raw.lastResult && Number.isFinite(raw.lastResult.percent) && raw.lastResult.percent >= 0 && raw.lastResult.percent <= 100 && Number.isFinite(raw.lastResult.errorCount) ? { percent: raw.lastResult.percent, errorCount: Math.max(0, Math.min(100, raw.lastResult.errorCount)) } : null
      };
    } catch (_) {
      return { sessions: [], mode: 'steady', energy: 2, duration: 25, target: 60, lastResult: null };
    }
  }

  function save() {
    try { localStorage.setItem(STORE, JSON.stringify(state)); }
    catch (error) { console.warn('[PRINCIPIA] Momentum data could not be saved:', error); }
  }

  function todayKey(date = new Date()) {
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function todayMinutes() {
    const today = todayKey();
    return state.sessions.filter(item => item.date === today).reduce((sum, item) => sum + item.minutes, 0);
  }

  function streak() {
    const days = new Set(state.sessions.filter(item => item.completed).map(item => item.date));
    let count = 0;
    const cursor = new Date();
    if (!days.has(todayKey(cursor))) cursor.setDate(cursor.getDate() - 1);
    while (days.has(todayKey(cursor))) {
      count += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return count;
  }

  function injectEntry() {
    if (document.getElementById('principiaMomentumEntry')) return;
    const anchor = document.getElementById('principiaProMasteryEntry');
    if (!anchor || !anchor.parentElement) return;
    const button = document.createElement('button');
    button.id = 'principiaMomentumEntry';
    button.type = 'button';
    button.className = anchor.className;
    button.textContent = '✦ Chế độ bứt phá';
    button.setAttribute('aria-haspopup', 'dialog');
    button.addEventListener('click', open);
    anchor.insertAdjacentElement('afterend', button);
  }

  function modal() {
    let root = document.getElementById('principiaMomentumDialog');
    if (root) return root;
    root = document.createElement('div');
    root.id = 'principiaMomentumDialog';
    root.className = 'pmm-overlay';
    root.hidden = true;
    root.innerHTML = '<section class="pmm-dialog" role="dialog" aria-modal="true" aria-labelledby="pmmTitle"><header class="pmm-header"><div><span class="pmm-eyebrow">PRINCIPIA · PERSONAL MOMENTUM</span><h2 id="pmmTitle">Lấy lại nhịp học của bạn</h2><p>Không cần kể lý do. Chọn nhịp phù hợp và bắt đầu từ một bước nhỏ.</p></div><button type="button" class="pmm-close" data-close aria-label="Đóng">×</button></header><div class="pmm-stats"><div><strong data-minutes>0</strong><span>phút hôm nay</span></div><div><strong data-streak>0</strong><span>ngày duy trì</span></div><div><strong data-sessions>0</strong><span>phiên hoàn thành</span></div></div><div class="pmm-daily-progress"><div><span>Tiến độ mục tiêu ngày</span><b data-daily-label>0%</b></div><div class="pmm-progress"><span data-daily-progress></span></div></div><section class="pmm-section"><h3>Chọn nhịp học</h3><div class="pmm-options" role="group" aria-label="Nhịp học"><button type="button" data-mode="gentle">Nhẹ nhàng</button><button type="button" data-mode="steady">Ổn định</button><button type="button" data-mode="intense">Tăng tốc</button></div><label class="pmm-label" for="pmmEnergy">Mức năng lượng hiện tại</label><select id="pmmEnergy"><option value="1">Thấp · cần khởi động nhẹ</option><option value="2">Vừa · có thể tập trung</option><option value="3">Cao · sẵn sàng thử thách</option></select><label class="pmm-label" for="pmmTarget">Mục tiêu học hôm nay</label><select id="pmmTarget"><option value="30">30 phút</option><option value="60">60 phút</option><option value="90">90 phút</option><option value="120">120 phút</option><option value="180">180 phút</option></select></section><section class="pmm-section pmm-focus"><div class="pmm-section-head"><div><h3>Phiên tập trung</h3><p>Chỉ cần hoàn thành phiên hiện tại. Bạn có thể dừng bất cứ lúc nào.</p></div><select id="pmmDuration" aria-label="Thời lượng phiên"><option value="25">25 phút</option><option value="50">50 phút</option><option value="75">75 phút</option></select></div><div class="pmm-clock" data-clock>25:00</div><div class="pmm-progress"><span data-progress></span></div><div class="pmm-actions"><button type="button" class="pmm-primary" data-timer-start>Bắt đầu</button><button type="button" data-timer-reset>Đặt lại</button></div><p class="pmm-status" data-status aria-live="polite">Chọn nhịp học rồi bắt đầu khi sẵn sàng.</p></section><section class="pmm-section"><h3>Tiếp tục cùng AI</h3><p>AI sẽ chia nhiệm vụ thành từng bước, điều chỉnh độ khó và không làm hộ bạn.</p><div class="pmm-actions"><button type="button" class="pmm-primary" data-ai>Hướng dẫn tôi học tiếp</button><button type="button" data-focus>Chuyển sang Study With Me</button></div></section><p class="pmm-footnote">Tiến độ được lưu trên thiết bị này. Không tự động gửi cảm xúc hoặc thông tin riêng tư đi đâu.</p></section>';
    root.addEventListener('click', event => { if (event.target === root || event.target.closest('[data-close]')) close(); });
    root.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });
    root.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
      selectedMode = button.dataset.mode;
      state.mode = selectedMode;
      save();
      paint();
    }));
    root.querySelector('#pmmEnergy').addEventListener('change', event => {
      selectedEnergy = Number(event.target.value);
      state.energy = selectedEnergy;
      save();
    });
    root.querySelector('#pmmTarget').addEventListener('change', event => {
      selectedTarget = Number(event.target.value);
      state.target = selectedTarget;
      save();
      paint();
    });
    root.querySelector('#pmmDuration').addEventListener('change', event => {
      selectedDuration = Number(event.target.value);
      state.duration = selectedDuration;
      resetTimer();
      save();
      paint();
    });
    root.querySelector('[data-timer-start]').addEventListener('click', toggleTimer);
    root.querySelector('[data-timer-reset]').addEventListener('click', resetTimer);
    root.querySelector('[data-ai]').addEventListener('click', startAI);
    root.querySelector('[data-focus]').addEventListener('click', () => {
      close();
      if (window.PrincipiaProMastery?.open) window.PrincipiaProMastery.open('study');
      else window.PrincipiaLearningOrchestrator?.startFocus?.();
    });
    document.body.appendChild(root);
    return root;
  }

  function open() {
    const root = modal();
    root.hidden = false;
    document.body.classList.add('pmm-open');
    paint();
    root.querySelector('[data-close]').focus();
  }

  function close() {
    const root = document.getElementById('principiaMomentumDialog');
    if (root) root.hidden = true;
    document.body.classList.remove('pmm-open');
    document.getElementById('principiaMomentumEntry')?.focus();
  }

  function paint() {
    const root = modal();
    root.querySelectorAll('[data-mode]').forEach(button => {
      const active = button.dataset.mode === selectedMode;
      button.classList.toggle('active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    root.querySelector('#pmmEnergy').value = String(selectedEnergy);
    root.querySelector('#pmmTarget').value = String(selectedTarget);
    root.querySelector('#pmmDuration').value = String(selectedDuration);
    root.querySelector('[data-minutes]').textContent = String(todayMinutes());
    root.querySelector('[data-streak]').textContent = String(streak());
    root.querySelector('[data-sessions]').textContent = String(state.sessions.filter(item => item.completed).length);
    const progress = Math.min(100, Math.round(todayMinutes() / selectedTarget * 100));
    root.querySelector('[data-daily-progress]').style.width = progress + '%';
    root.querySelector('[data-daily-label]').textContent = progress + '%';
    updateClock();
  }

  function updateClock() {
    const root = document.getElementById('principiaMomentumDialog');
    if (!root) return;
    const seconds = running ? Math.max(0, Math.ceil((endAt - Date.now()) / 1000)) : remaining;
    const clock = root.querySelector('[data-clock]');
    if (clock) clock.textContent = String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
    const fill = root.querySelector('[data-progress]');
    if (fill && running) fill.style.width = Math.max(0, Math.min(100, (1 - seconds / (selectedDuration * 60)) * 100)) + '%';
    const button = root.querySelector('[data-timer-start]');
    if (button) button.textContent = running ? 'Tạm dừng' : remaining < selectedDuration * 60 ? 'Tiếp tục' : 'Bắt đầu';
  }

  function toggleTimer() {
    if (running) {
      remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
      running = false;
      window.clearInterval(timer);
      timer = null;
      updateClock();
      setStatus('Đã tạm dừng. Bạn có thể tiếp tục khi sẵn sàng.');
      return;
    }
    if (remaining <= 0) remaining = selectedDuration * 60;
    endAt = Date.now() + remaining * 1000;
    running = true;
    timer = window.setInterval(tick, 500);
    setStatus('Đang tập trung. Chỉ xử lý một nhiệm vụ tại một thời điểm.');
    updateClock();
  }

  function tick() {
    remaining = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
    updateClock();
    if (remaining === 0) completeSession();
  }

  function resetTimer() {
    if (timer) window.clearInterval(timer);
    timer = null;
    running = false;
    remaining = selectedDuration * 60;
    updateClock();
    setStatus('Phiên mới đã sẵn sàng.');
  }

  function completeSession() {
    if (timer) window.clearInterval(timer);
    timer = null;
    running = false;
    remaining = 0;
    state.sessions.push({ date: todayKey(), minutes: selectedDuration, completed: true, at: Date.now() });
    state.sessions = state.sessions.slice(-MAX_SESSIONS);
    save();
    paint();
    const completedToday = state.sessions.filter(item => item.date === todayKey() && item.completed).length;
    setStatus(completedToday % 3 === 0 ? 'Bạn đã hoàn thành 3 phiên. Nghỉ dài 15–20 phút trước khi quyết định học tiếp.' : 'Đã hoàn thành phiên tập trung. Nghỉ 5 phút, uống nước rồi quyết định bước tiếp theo.');
    window.dispatchEvent(new CustomEvent('principia:momentum-session-completed', {
      detail: { minutes: selectedDuration, todayMinutes: todayMinutes(), target: selectedTarget }
    }));
  }

  function setStatus(message) {
    const status = document.querySelector('#principiaMomentumDialog [data-status]');
    if (status) status.textContent = message;
  }

  function recommendedMode() {
    if (selectedEnergy === 1 || (state.lastResult && (state.lastResult.percent < 50 || state.lastResult.errorCount >= 3))) return 'gentle';
    if (selectedEnergy === 3 && state.lastResult && state.lastResult.percent >= 85 && state.lastResult.errorCount === 0) return 'intense';
    return selectedMode;
  }

  function recordQuiz(event) {
    const detail = event?.detail || {};
    const percent = Number(detail.percent);
    if (!Number.isFinite(percent) || percent < 0 || percent > 100) return;
    state.lastResult = { percent, errorCount: Array.isArray(detail.mistakes) ? Math.min(100, detail.mistakes.length) : 0 };
    save();
    const root = document.getElementById('principiaMomentumDialog');
    if (root && !root.hidden) setStatus(percent < 50 || state.lastResult.errorCount >= 3 ? 'Mình sẽ đề xuất nhịp nhẹ hơn để xử lý đúng phần còn vướng.' : percent >= 85 && selectedEnergy === 3 ? 'Bạn có thể thử một thử thách khó hơn ở lượt tiếp theo.' : 'Đã cập nhật gợi ý theo kết quả học gần đây.');
  }

  function startAI() {
    const mode = recommendedMode();
    const profile = {
      gentle: 'Năng lượng thấp hoặc cần khởi động: giao một nhiệm vụ 5 phút, rõ ràng, dễ bắt đầu.',
      steady: 'Năng lượng vừa: chia thành chặng 15–25 phút, có đầu ra kiểm tra được.',
      intense: 'Năng lượng cao: thiết kế thử thách sâu, yêu cầu tự giải và tăng độ khó theo kết quả.'
    };
    const focusPlan = window.PrincipiaLearningScience?.focusPlan?.({ energy: selectedEnergy, minutes: selectedDuration, goal: mode === 'intense' ? 'olympiad' : 'understand' });
    const extra = [
      'HƯỚNG DẪN NHỊP HỌC CÁ NHÂN:',
      MODES[mode].instruction,
      profile[mode],
      'Mức năng lượng do người học tự chọn: ' + selectedEnergy + '/3.',
      'Mục tiêu hôm nay: ' + selectedTarget + ' phút.',
      focusPlan ? 'Nhịp tập trung gợi ý: ' + focusPlan.focusMinutes + ' phút tập trung, ' + focusPlan.breakMinutes + ' phút nghỉ; ' + focusPlan.instruction : '',
      'Không suy đoán nguyên nhân tâm trạng, không hỏi chuyện riêng tư, không cổ súy học đến kiệt sức. Nếu người học có dấu hiệu quá tải, đề xuất nghỉ ngắn hoặc giảm độ khó.',
      'Không nhắc tên chế độ hoặc kỹ thuật học. Hãy bắt đầu bằng một câu hỏi ngắn để xác định chủ đề và nhiệm vụ kế tiếp.'
    ].join('\n');
    close();
    if (window.PrincipiaLearningOrchestrator?.begin) {
      window.PrincipiaLearningOrchestrator.begin({ goal: mode === 'gentle' ? 'understand' : 'solve', phase: 'momentum', energy: selectedEnergy, extra });
    } else if (window.principiaLocalAI?.open) {
      window.principiaLocalAI.open('Bạn là gia sư PRINCIPIA. ' + extra);
    } else if (window.notify) {
      window.notify('Trợ lý AI chưa sẵn sàng. Hãy thử lại sau.');
    }
  }

  function boot() {
    remaining = selectedDuration * 60;
    injectEntry();
    const observer = new MutationObserver(injectEntry);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('beforeunload', () => {
      if (timer) window.clearInterval(timer);
    }, { once: true });
  }

  window.addEventListener('principia:quiz-completed', recordQuiz);

  window.PrincipiaMomentumMode = Object.freeze({
    open,
    close,
    stats: () => ({ todayMinutes: todayMinutes(), target: selectedTarget, streak: streak(), sessions: state.sessions.length, mode: selectedMode, recommendedMode: recommendedMode() })
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
