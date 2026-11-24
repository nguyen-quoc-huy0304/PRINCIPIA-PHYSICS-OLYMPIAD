/* PRINCIPIA — guided study pathways connecting methods, classroom and Study With Me. */
(() => {
  'use strict';
  const ID = 'principiaStudyPathways';
  const STYLE_ID = 'principiaStudyPathwaysStyles';
  let generatedPlan = null;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  const css = '#principiaStudyPathways{position:fixed;inset:0;z-index:2147483305;background:#060a18ed;backdrop-filter:blur(10px);overflow:auto;padding:14px;color:var(--text,#f4f6ff);font:inherit}#principiaStudyPathways .psp-shell{max-width:820px;margin:3vh auto;background:var(--card,#151a2b);border:1px solid var(--line,#46506a);border-radius:18px;padding:18px;box-shadow:0 24px 80px #0009}#principiaStudyPathways .psp-head,#principiaStudyPathways .psp-actions{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}#principiaStudyPathways label{display:block;margin:12px 0;font-size:13px}#principiaStudyPathways input,#principiaStudyPathways select{box-sizing:border-box;width:100%;margin-top:5px;padding:11px;border:1px solid var(--line,#46506a);border-radius:9px;background:var(--bg,#101626);color:inherit}#principiaStudyPathways button{padding:9px 12px;border:1px solid var(--line,#46506a);border-radius:9px;background:transparent;color:inherit;cursor:pointer}#principiaStudyPathways button:disabled{opacity:.55;cursor:wait}#principiaStudyPathways .psp-primary{background:var(--primary,#6557dc);border-color:transparent;color:white}#principiaStudyPathways [data-output]{white-space:pre-wrap;overflow-wrap:anywhere;line-height:1.65;padding:12px;margin-top:12px;border:1px solid var(--line,#46506a);border-radius:12px;min-height:90px;max-height:42vh;overflow:auto}#principiaStudyPathways .psp-muted{opacity:.72;font-size:12px;line-height:1.5}';
  function styles() {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style'); style.id = STYLE_ID; style.textContent = css; document.head.appendChild(style);
  }
  function close() { document.getElementById(ID)?.remove(); }
  function open() {
    styles(); close();
    const panel = document.createElement('section');
    panel.id = ID; panel.setAttribute('role', 'dialog'); panel.setAttribute('aria-modal', 'true'); panel.setAttribute('aria-label', 'Lộ trình học thông minh PRINCIPIA');
    panel.innerHTML = '<div class="psp-shell"><header class="psp-head"><div><small>PRINCIPIA · STUDY PATHWAYS</small><h2 style="margin:5px 0">Thiết kế lộ trình học</h2></div><button type="button" data-close aria-label="Đóng">Đóng ×</button></header><p class="psp-muted">Gemini sẽ âm thầm chọn cách học phù hợp, biến mục tiêu thành các nhiệm vụ có thời lượng và hạn hoàn thành. Free Tier có thể dùng nội dung gửi lên để cải thiện sản phẩm; chỉ nhập chủ đề học tập, không nhập thông tin cá nhân.</p><label>Chủ đề Vật lý<input data-topic maxlength="180" placeholder="Ví dụ: Định luật Newton, dao động điều hòa..."></label><label>Mục tiêu<select data-goal><option value="understand">Hiểu sâu khái niệm</option><option value="remember">Ghi nhớ và ôn tập bền lâu</option><option value="solve">Luyện giải bài tập</option><option value="olympiad">Chuẩn bị Olympic nâng cao</option><option value="teach">Học bằng cách giảng dạy</option><option value="recover">Củng cố phần đang yếu</option></select></label><label>Thời lượng<select data-duration><option value="25">25 phút</option><option value="50" selected>50 phút</option><option value="75">75 phút</option><option value="100">100 phút</option></select></label><div class="psp-actions"><button type="button" class="psp-primary" data-generate>Lập lộ trình bằng Gemini</button><button type="button" data-classroom>Mở lớp học ảo</button><button type="button" data-study>Mở Study With Me</button></div><div data-status class="psp-muted" role="status" style="margin-top:10px"></div><div data-output aria-live="polite">Lộ trình sẽ xuất hiện tại đây. Bạn có thể lưu các nhiệm vụ vào kế hoạch học tập sau khi tạo xong.</div><div class="psp-actions" style="margin-top:10px"><button type="button" class="psp-primary" data-save-plan disabled>Lưu nhiệm vụ vào kế hoạch</button><button type="button" data-open-plan>Mở kế hoạch học tập</button></div></div>';
    generatedPlan = null;
    document.body.appendChild(panel);
    panel.querySelector('[data-close]').addEventListener('click', close);
    panel.addEventListener('click', event => { if (event.target === panel) close(); });
    panel.querySelector('[data-classroom]').addEventListener('click', () => {
      if (!window.PrincipiaProMastery?.open) return setStatus('Chưa tải được lớp học ảo. Hãy tải lại trang.');
      close(); window.PrincipiaProMastery.open('classroom');
    });
    panel.querySelector('[data-study]').addEventListener('click', () => {
      if (!window.PrincipiaProMastery?.open) return setStatus('Chưa tải được Study With Me. Hãy tải lại trang.');
      close(); window.PrincipiaProMastery.open('study');
    });
    panel.querySelector('[data-generate]').addEventListener('click', generate);
    panel.querySelector('[data-save-plan]').addEventListener('click', savePlan);
    panel.querySelector('[data-open-plan]').addEventListener('click', () => {
      if (typeof window.principiaSuiteStudyPlanner !== 'function') return setStatus('Kế hoạch học tập chưa sẵn sàng. Hãy tải lại trang.');
      close(); window.principiaSuiteStudyPlanner();
    });
    panel.querySelector('[data-topic]').focus();
  }
  function setStatus(message) {
    const status = document.querySelector('#' + ID + ' [data-status]');
    if (status) status.textContent = message;
  }
  async function generate() {
    const panel = document.getElementById(ID);
    const topic = panel?.querySelector('[data-topic]')?.value.trim();
    if (!panel || !topic) return setStatus('Nhập chủ đề Vật lý trước khi tạo lộ trình.');
    const goal = panel.querySelector('[data-goal]').value;
    const duration = Number(panel.querySelector('[data-duration]').value);
    if (!Number.isFinite(duration) || ![25, 50, 75, 100].includes(duration)) return setStatus('Thời lượng không hợp lệ.');
    const button = panel.querySelector('[data-generate]');
    const output = panel.querySelector('[data-output]');
    if (!window.principiaAI?.ask) return setStatus('Gemini chưa sẵn sàng. Kiểm tra đăng nhập và cấu hình AI của PRINCIPIA.');
    const goalNames = { understand: 'hiểu sâu khái niệm', remember: 'ghi nhớ và ôn tập bền lâu', solve: 'luyện giải bài tập', olympiad: 'chuẩn bị Olympic nâng cao', teach: 'học bằng cách giảng dạy', recover: 'củng cố phần đang yếu' };
    const catalog = window.principiaStudyMethodsCount?.() || {};
    const allMethods = Array.isArray(window.PRINCIPIA_STUDY_METHOD_CATALOG) ? window.PRINCIPIA_STUDY_METHOD_CATALOG : [];
    const topicMethods = allMethods.filter(item => String(item.title || '').toLocaleLowerCase('vi').includes(topic.toLocaleLowerCase('vi'))).slice(0, 8);
    const coreMethods = allMethods.slice(0, 231).filter(item => {
      const text = (item.title + ' ' + item.category + ' ' + item.desc).toLocaleLowerCase('vi');
      const keywords = goal === 'remember' ? ['ghi nhớ', 'truy xuất', 'ôn tập', 'flashcard', 'recall'] : goal === 'solve' || goal === 'olympiad' ? ['giải bài', 'olympiad', 'luyện', 'tư duy', 'phân tích'] : goal === 'teach' ? ['dạy', 'giảng', 'cộng đồng', 'feynman'] : goal === 'recover' ? ['lỗi', 'yếu', 'phản tư', 'thành thạo'] : ['hiểu sâu', 'vật lý', 'trực quan', 'mô hình'];
      return keywords.some(keyword => text.includes(keyword));
    }).slice(0, 12);
    const candidates = [...new Map([...topicMethods, ...coreMethods].map(item => [item.id, item])).values()].slice(0, 18);
    const methodContext = candidates.map(item => '- ' + item.title + ' [' + item.category + ']: ' + item.desc).join('\n');
    const prompt = [
      'Thiết kế lộ trình học Vật lý thực tế trong ' + duration + ' phút.',
      'Chủ đề: ' + topic + '. Mục tiêu: ' + goalNames[goal] + '.',
      'PRINCIPIA có thư viện ' + (catalog.total || 3111) + ' mục học tập. Các mục sau là dữ liệu nội bộ để chọn chiến lược phù hợp, tuyệt đối không hiển thị tên phương pháp hoặc giải thích thuật toán cho người học:\\n' + methodContext,
      'Áp dụng cách học âm thầm: truy xuất trí nhớ, ví dụ mẫu giảm dần, luyện tập có chủ đích, xen kẽ dạng bài, giải thích bằng lời, kiểm tra trường hợp biên, ôn giãn cách và tự đánh giá tùy mục tiêu. Chỉ dùng những cách thật sự phù hợp.',
      'Tạo 3–6 nhiệm vụ cụ thể theo trình tự. Mỗi nhiệm vụ phải có title, topic, minutes (5–60), dayOffset (0–30 tính từ hôm nay), note và đầu ra kiểm chứng được. Tổng thời lượng không vượt quá ' + duration + ' phút.',
      'Nếu mục tiêu là Olympic, có ít nhất một nhiệm vụ nhận diện cấu trúc, chọn định luật, kiểm tra giả thiết hoặc chứng minh. Nếu mục tiêu là học bằng cách giảng dạy, có một nhiệm vụ chuẩn bị lời giảng và câu hỏi cho AI Student.',
      'Không tiết lộ tên phương pháp. Không bịa nguồn khoa học, không hứa đảm bảo điểm số. Trả về DUY NHẤT JSON hợp lệ theo schema: {"summary":"mô tả ngắn","tasks":[{"title":"...","topic":"...","minutes":15,"dayOffset":0,"note":"đầu ra cần hoàn thành"}]}. Không thêm markdown.'
    ].join('\\n');
    button.disabled = true; setStatus('Đang gửi yêu cầu tới Google Gemini…'); output.textContent = 'PRINCIPIA đang xây dựng lộ trình…';
    try {
      const answer = await window.principiaAI.ask(prompt);
      generatedPlan = parsePlan(answer, topic);
      output.textContent = formatPlan(generatedPlan);
      panel.querySelector('[data-save-plan]').disabled = false;
      setStatus('Đã tạo lộ trình. Kiểm tra các nhiệm vụ rồi bấm Lưu vào kế hoạch học tập.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể tạo lộ trình AI.');
      output.textContent = 'Không tạo được lộ trình. Bạn vẫn có thể mở lớp học ảo hoặc Study With Me để học thủ công.';
    } finally {
      if (button.isConnected) button.disabled = false;
    }
  }
  function parsePlan(raw, fallbackTopic) {
    const text = String(raw || '').trim().replace(/^\`\`\`(?:json)?\\s*/i, '').replace(/\\s*\`\`\`$/, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('Gemini không trả về lộ trình JSON hợp lệ. Hãy tạo lại.');
    let data;
    try { data = JSON.parse(text.slice(start, end + 1)); }
    catch (_) { throw new Error('Không đọc được cấu trúc lộ trình. Hãy tạo lại.'); }
    if (!data || typeof data.summary !== 'string' || !Array.isArray(data.tasks) || data.tasks.length < 3 || data.tasks.length > 6) {
      throw new Error('Lộ trình phải có mô tả và từ 3 đến 6 nhiệm vụ.');
    }
    const tasks = data.tasks.map(task => {
      const minutes = Number(task?.minutes);
      const dayOffset = Number(task?.dayOffset);
      const title = String(task?.title || '').trim().slice(0, 120);
      const topic = String(task?.topic || fallbackTopic).trim().slice(0, 180);
      const note = String(task?.note || '').trim().slice(0, 500);
      if (!title || !topic || !note || !Number.isInteger(minutes) || minutes < 5 || minutes > 60 ||
          !Number.isInteger(dayOffset) || dayOffset < 0 || dayOffset > 30) {
        throw new Error('Một nhiệm vụ trong lộ trình có dữ liệu không hợp lệ. Hãy tạo lại.');
      }
      return { title, topic, minutes, dayOffset, note };
    });
    if (tasks.reduce((sum, task) => sum + task.minutes, 0) > 240) {
      throw new Error('Tổng thời lượng lộ trình quá dài. Hãy tạo lại.');
    }
    return { summary: data.summary.trim().slice(0, 600), tasks };
  }

  function formatPlan(plan) {
    return plan.summary + '\\n\\n' + plan.tasks.map((task, index) =>
      (index + 1) + '. ' + task.title + '\\n   ' + task.topic + ' · ' + task.minutes + ' phút · sau ' + task.dayOffset + ' ngày\\n   ' + task.note
    ).join('\\n\\n');
  }

  function localDate(offset) {
    const date = new Date();
    date.setDate(date.getDate() + offset);
    return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
  }

  function savePlan() {
    const panel = document.getElementById(ID);
    if (!generatedPlan || !panel) return setStatus('Chưa có lộ trình hợp lệ để lưu.');
    try {
      const key = 'principia_learning_suite_v1';
      const state = JSON.parse(localStorage.getItem(key) || '{}');
      const current = Array.isArray(state.studyPlan) ? state.studyPlan : [];
      if (current.length + generatedPlan.tasks.length > 200) {
        return setStatus('Kế hoạch đã gần đạt giới hạn 200 nhiệm vụ. Hãy dọn các mục cũ trước khi lưu.');
      }
      const created = new Date().toISOString();
      const additions = generatedPlan.tasks.map((task, index) => ({
        id: 'gemini-path-' + Date.now().toString(36) + '-' + index,
        title: task.title,
        topic: task.topic,
        due: localDate(task.dayOffset),
        minutes: task.minutes,
        note: task.note,
        done: false,
        created
      }));
      state.studyPlan = current.concat(additions);
      localStorage.setItem(key, JSON.stringify(state));
      panel.querySelector('[data-save-plan]').disabled = true;
      setStatus('Đã lưu ' + additions.length + ' nhiệm vụ vào kế hoạch học tập trên thiết bị này.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Không thể lưu lộ trình trên thiết bị.');
    }
  }

  function injectButton() {
    if (document.getElementById('principiaStudyPathwaysEntry')) return true;
    const methodButton = document.querySelector('button[onclick="principiaStudyMethods()"]');
    if (!methodButton?.parentElement) return false;
    const button = document.createElement('button');
    button.id = 'principiaStudyPathwaysEntry'; button.type = 'button'; button.className = methodButton.className;
    button.textContent = '🧭 Lộ trình học thông minh';
    button.addEventListener('click', open);
    methodButton.parentElement.appendChild(button);
    return true;
  }
  function boot() {
    injectButton();
    const observer = new MutationObserver(injectButton);
    observer.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('pagehide', () => observer.disconnect(), { once: true });
  }
  window.PrincipiaStudyPathways = Object.freeze({ open, close });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
