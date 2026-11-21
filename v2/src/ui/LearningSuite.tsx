import { useEffect, useMemo, useState } from 'preact/hooks';

type Node = {
  id: string; name: string; icon?: string; type?: string; content?: string; note?: string; video?: string;
  children?: Node[]; questions?: Question[]; quiz?: Question[];
};
type Question = { q: string; a: string[]; correct: number; type?: string; correctValues?: Array<string | number>; expected?: string; explanation?: string };
type Progress = { completed: string[]; attempts: Array<{ title: string; score: number; total: number; at: string }>; xp: number; streak: number; lastStudyDate: string };
type Mistake = { id: string; question: string; answer: string; correct: string; explanation: string; source: string; at: string };
type Card = { id: string; front: string; back: string; due: number; interval: number; ease: number; reps: number };
type Note = { id: string; title: string; body: string; tags: string; updatedAt: string };
type Props = { userId: string; lessons: Node[]; quizzes: Node[]; progress: Progress; onAttempt: (title: string, score: number, total: number) => void; onTaskComplete: (xp: number) => void };

const FORMULAS = [
  { name: 'Định luật II Newton', formula: 'ΣF = ma', detail: 'Hợp lực tác dụng lên vật bằng khối lượng nhân gia tốc. Dùng trong hệ quy chiếu quán tính.' },
  { name: 'Chuyển động thẳng biến đổi đều', formula: 'v = v₀ + at;  s = v₀t + ½at²', detail: 'Gia tốc không đổi; chọn chiều dương trước khi thay số.' },
  { name: 'Động năng', formula: 'Wđ = ½mv²', detail: 'm tính bằng kg, v bằng m/s; kết quả là joule (J).' },
  { name: 'Thế năng trọng trường', formula: 'Wt = mgh', detail: 'Gần mặt đất, g xấp xỉ 9,81 m/s²; mốc thế năng do ta chọn.' },
  { name: 'Công của lực không đổi', formula: 'A = Fs cos α', detail: 'α là góc giữa lực và độ dời; công có thể dương, âm hoặc bằng 0.' },
  { name: 'Định luật bảo toàn cơ năng', formula: 'Wđ₁ + Wt₁ = Wđ₂ + Wt₂', detail: 'Áp dụng khi chỉ có lực thế sinh công, bỏ qua ma sát và lực cản.' },
  { name: 'Động lượng', formula: 'p = mv', detail: 'Đại lượng vectơ; đơn vị kg·m/s.' },
  { name: 'Xung lượng', formula: 'I = FΔt = Δp', detail: 'Với lực không đổi; tổng quát là tích phân lực theo thời gian.' },
  { name: 'Định luật Ohm', formula: 'I = U/R', detail: 'Cho đoạn mạch thuần trở; U tính bằng V, I bằng A, R bằng Ω.' },
  { name: 'Công suất điện', formula: 'P = UI = I²R = U²/R', detail: 'Các dạng tương đương với đoạn mạch tuân theo định luật Ohm.' },
  { name: 'Sóng cơ', formula: 'v = λf = λ/T', detail: 'vận tốc truyền sóng, bước sóng λ, tần số f, chu kỳ T.' },
  { name: 'Thấu kính mỏng', formula: '1/f = 1/d + 1/d′', detail: 'Quy ước dấu phải nhất quán theo hệ quy chiếu quang học đang dùng.' }
];
const FLAT = (nodes: Node[]): Node[] => nodes.flatMap(node => [node, ...FLAT(node.children || [])]);
const shuffle = <T,>(items: T[]) => [...items].sort(() => Math.random() - 0.5);
const read = <T,>(key: string, fallback: T): T => { try { const value = JSON.parse(localStorage.getItem(key) || 'null'); return value === null ? fallback : value as T; } catch { return fallback; } };

export function LearningSuite({ userId, lessons, quizzes, progress, onAttempt, onTaskComplete }: Props) {
  const prefix = 'principia_suite:' + (userId || 'guest') + ':';
  const [tab, setTab] = useState('olympiad');
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<Note[]>(() => read(prefix + 'notes', []));
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteTags, setNoteTags] = useState('');
  const [cards, setCards] = useState<Card[]>(() => read(prefix + 'cards', []));
  const [cardFront, setCardFront] = useState('');
  const [cardBack, setCardBack] = useState('');
  const [mistakes, setMistakes] = useState<Mistake[]>(() => read(prefix + 'mistakes', []));
  const [taskDone, setTaskDone] = useState<string[]>(() => read(prefix + 'tasks', []));
  const [notifications, setNotifications] = useState<Array<{ id: string; text: string; at: string }>>(() => read(prefix + 'notifications', []));
  const [discussion, setDiscussion] = useState('');
  const [aiProvider, setAiProvider] = useState('https://chatgpt.com/');
  const [practice, setPractice] = useState<Question[]>([]);
  const [practiceTitle, setPracticeTitle] = useState('Đề luyện Olympic ngẫu nhiên');
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, number>>({});
  const [practiceDone, setPracticeDone] = useState(false);
  const [practiceSeconds, setPracticeSeconds] = useState(30 * 60);
  const [practiceRunning, setPracticeRunning] = useState(false);
  const [flashIndex, setFlashIndex] = useState(0);
  const [flashReveal, setFlashReveal] = useState(false);
  const [notice, setNotice] = useState('');
  const [searchScope, setSearchScope] = useState('all');

  useEffect(() => { try { localStorage.setItem(prefix + 'notes', JSON.stringify(notes)); } catch {} }, [notes, prefix]);
  useEffect(() => { try { localStorage.setItem(prefix + 'cards', JSON.stringify(cards)); } catch {} }, [cards, prefix]);
  useEffect(() => { try { localStorage.setItem(prefix + 'mistakes', JSON.stringify(mistakes.slice(0, 300))); } catch {} }, [mistakes, prefix]);
  useEffect(() => { try { localStorage.setItem(prefix + 'tasks', JSON.stringify(taskDone)); } catch {} }, [taskDone, prefix]);
  useEffect(() => { try { localStorage.setItem(prefix + 'notifications', JSON.stringify(notifications)); } catch {} }, [notifications, prefix]);
  useEffect(() => {
    if (!practiceRunning || practiceSeconds <= 0) return;
    const timer = window.setInterval(() => setPracticeSeconds(value => Math.max(0, value - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [practiceRunning, practiceSeconds]);
  useEffect(() => { if (practiceSeconds === 0) setPracticeRunning(false); }, [practiceSeconds]);

  const lessonFlat = useMemo(() => FLAT(lessons), [lessons]);
  const quizFlat = useMemo(() => FLAT(quizzes), [quizzes]);
  const questionBank = useMemo(() => quizFlat.flatMap(node => (node.questions || node.quiz || []).filter(q => q && q.q && Array.isArray(q.a) && q.a.length >= 2 && (q.type || 'single_select') === 'single_select').map(q => ({ ...q, __source: node.name } as Question & { __source: string }))), [quizFlat]);
  const dueCards = cards.filter(card => card.due <= Date.now());
  const searchResults = useMemo(() => {
    const term = query.trim().toLocaleLowerCase();
    if (!term) return [];
    const sources = [
      ...lessonFlat.filter(node => searchScope === 'all' || searchScope === 'lessons').map(node => ({ type: 'Bài học', title: node.name, body: [node.content, node.note].filter(Boolean).join(' ').slice(0, 240) })),
      ...quizFlat.filter(node => searchScope === 'all' || searchScope === 'quizzes').map(node => ({ type: 'Ngân hàng đề', title: node.name, body: (node.questions || node.quiz || []).map(q => q.q).join(' · ').slice(0, 240) })),
      ...notes.filter(note => searchScope === 'all' || searchScope === 'notes').map(note => ({ type: 'Sổ tay', title: note.title, body: note.body.slice(0, 240) })),
      ...FORMULAS.filter(item => searchScope === 'all' || searchScope === 'formulas').map(item => ({ type: 'Công thức', title: item.name, body: item.formula + ' · ' + item.detail }))
    ];
    return sources.filter(item => (item.title + ' ' + item.body).toLocaleLowerCase().includes(term)).slice(0, 40);
  }, [query, searchScope, lessonFlat, quizFlat, notes]);
  const totalQuestions = questionBank.length;
  const avgAccuracy = progress.attempts.length ? Math.round(progress.attempts.reduce((sum, item) => sum + (item.total ? item.score / item.total : 0), 0) / progress.attempts.length * 100) : 0;
  const weakTopics = [...progress.attempts].slice(0, 8).filter(item => item.total && item.score / item.total < 0.7);
  const tasks = [
    { id: 'study', title: 'Hoàn thành một bài học', desc: 'Học một mục trong lộ trình hiện tại', xp: 10 },
    { id: 'practice', title: 'Làm một lượt luyện đề', desc: 'Tự kiểm tra kiến thức với câu hỏi', xp: 15 },
    { id: 'flash', title: 'Ôn 5 flashcard', desc: 'Ôn tập chủ động để nhớ lâu hơn', xp: 10 },
    { id: 'note', title: 'Ghi lại một điều mới', desc: 'Lưu công thức hoặc ý tưởng vào sổ tay', xp: 5 },
    { id: 'review', title: 'Xem lại một lỗi sai', desc: 'Hiểu nguyên nhân và cách sửa', xp: 10 }
  ];
  const badges = [
    { id: 'first', name: 'Khởi hành', icon: '🌱', desc: 'Làm lượt luyện đề đầu tiên', unlocked: progress.attempts.length > 0 },
    { id: 'accuracy', name: 'Chính xác', icon: '🎯', desc: 'Đạt độ chính xác trung bình từ 80%', unlocked: progress.attempts.length > 0 && avgAccuracy >= 80 },
    { id: 'streak', name: 'Bền bỉ', icon: '🔥', desc: 'Duy trì chuỗi học 7 ngày', unlocked: progress.streak >= 7 },
    { id: 'xp', name: 'Tích lũy', icon: '💎', desc: 'Đạt 500 EXP', unlocked: progress.xp >= 500 },
    { id: 'cards', name: 'Trí nhớ tốt', icon: '🧠', desc: 'Tạo ít nhất 20 flashcard', unlocked: cards.length >= 20 },
    { id: 'notes', name: 'Người ghi chép', icon: '📓', desc: 'Tạo ít nhất 10 ghi chú', unlocked: notes.length >= 10 },
    { id: 'mistakes', name: 'Học từ sai lầm', icon: '🛠️', desc: 'Ôn lại 10 câu sai', unlocked: mistakes.length >= 10 }
  ];
  const addMistake = (question: Question, answer: number, source: string) => {
    const correctIndex = Number(question.correct);
    const item: Mistake = { id: String(Date.now()) + Math.random().toString(36).slice(2), question: question.q, answer: question.a[answer] || 'Chưa trả lời', correct: question.a[correctIndex] || 'Đáp án chuẩn trong ngân hàng đề', explanation: question.explanation || 'Hãy xem lại lời giải trong bài học hoặc hỏi AI để hiểu vì sao đáp án này đúng.', source, at: new Date().toISOString() };
    setMistakes(current => [item, ...current].slice(0, 300));
  };
  const startPractice = () => {
    if (!questionBank.length) { setNotice('Chưa có ngân hàng câu hỏi trắc nghiệm để tạo đề. Hãy nhập/xuất bản ngân hàng đề trước.'); return; }
    const selected = shuffle(questionBank).slice(0, Math.min(20, questionBank.length));
    setPractice(selected); setPracticeAnswers({}); setPracticeDone(false); setPracticeSeconds(30 * 60); setPracticeRunning(true);
    setPracticeTitle('Đề Olympic ngẫu nhiên · ' + selected.length + ' câu');
  };
  const submitPractice = () => {
    let score = 0;
    practice.forEach((question, index) => {
      if (practiceAnswers[index] === Number(question.correct)) score++;
      else addMistake(question, practiceAnswers[index], practiceTitle);
    });
    setPracticeDone(true); setPracticeRunning(false);
    onAttempt(practiceTitle, score, practice.length);
    setNotice('Đã chấm xong đề luyện Olympic.');
  };
  const saveNote = () => {
    if (!noteTitle.trim() || !noteBody.trim()) { setNotice('Hãy nhập tiêu đề và nội dung ghi chú.'); return; }
    setNotes(current => [{ id: String(Date.now()), title: noteTitle.trim(), body: noteBody.trim(), tags: noteTags.trim(), updatedAt: new Date().toISOString() }, ...current]);
    setNoteTitle(''); setNoteBody(''); setNoteTags(''); setNotice('Đã lưu ghi chú.');
  };
  const addCard = () => {
    if (!cardFront.trim() || !cardBack.trim()) { setNotice('Hãy nhập cả mặt trước và mặt sau của flashcard.'); return; }
    setCards(current => [...current, { id: String(Date.now()), front: cardFront.trim(), back: cardBack.trim(), due: Date.now(), interval: 0, ease: 2.5, reps: 0 }]);
    setCardFront(''); setCardBack(''); setNotice('Đã thêm flashcard.');
  };
  const rateCard = (quality: number) => {
    const card = dueCards[flashIndex];
    if (!card) return;
    const next = { ...card };
    if (quality < 3) { next.interval = 1; next.reps = 0; }
    else { next.reps += 1; next.interval = next.reps === 1 ? 1 : next.reps === 2 ? 3 : Math.max(1, Math.round(next.interval * next.ease)); }
    next.ease = Math.max(1.3, next.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    next.due = Date.now() + next.interval * 86400000;
    setCards(current => current.map(item => item.id === next.id ? next : item));
    setFlashReveal(false); setFlashIndex(value => value >= dueCards.length - 1 ? 0 : value + 1);
  };
  const askAI = () => {
    const prompt = 'Bạn là gia sư Vật lý Olympic của PRINCIPIA. Hãy đối thoại kiểu Socrates: hỏi từng bước, gợi ý vừa đủ, không tiết lộ đáp án ngay. Kiểm tra đơn vị, giả thiết và lập luận. Chủ đề học viên cần thảo luận: ' + discussion;
    try { void navigator.clipboard.writeText(prompt); } catch {}
    window.open(aiProvider, '_blank', 'noopener,noreferrer');
    setNotice('Đã mở trợ lý AI. Nội dung câu hỏi đã được chuẩn bị để bạn dán vào cuộc trò chuyện.');
  };
  const openMistakeTutor = (item: Mistake) => {
    setDiscussion('Hãy hướng dẫn tôi sửa lỗi câu hỏi: ' + item.question + '. Tôi đã chọn: ' + item.answer + '. Đáp án đúng: ' + item.correct + '. Hãy gợi ý từng bước, chỉ ra ngộ nhận có thể có và cho một câu tương tự để luyện.');
    setTab('discussion');
  };
  const clearNotifications = () => setNotifications([]);
  const unreadDue = dueCards.length;
  const nav = [
    ['olympiad', 'Olympic', '🏅'], ['analytics', 'Phân tích', '📊'], ['tasks', 'Nhiệm vụ', '⚡'],
    ['discussion', 'AI thảo luận', '✦'], ['search', 'Tìm kiếm', '⌕'], ['notes', 'Sổ tay', '📓'],
    ['formulas', 'Công thức', '∑'], ['flashcards', 'Flashcard', '🧠'], ['mistakes', 'Lỗi sai', '🛠️'],
    ['notifications', 'Thông báo', '🔔'], ['badges', 'Huy hiệu', '🏆']
  ];
  return <section class="suite-shell">
    <div class="suite-heading"><div><p class="eyebrow">PRINCIPIA LEARNING HUB</p><h2>Trung tâm học tập</h2><p>Một nơi để luyện thi, ghi nhớ, theo dõi tiến bộ và tìm lại kiến thức.</p></div><span class="suite-due">{unreadDue} thẻ cần ôn</span></div>
    <div class="suite-tabs">{nav.map(item => <button type="button" class={tab === item[0] ? 'active' : ''} onClick={() => { setTab(item[0]); setNotice(''); }}><span>{item[2]}</span><small>{item[1]}</small></button>)}</div>
    {notice && <p class="workspace-notice" role="status">{notice}</p>}
    {tab === 'olympiad' && <div class="suite-panel">
      <div class="suite-panel-head"><div><h3>Phòng luyện thi Olympic</h3><p>Đề trộn ngẫu nhiên từ ngân hàng đề PRINCIPIA hiện có.</p></div><span class="suite-stat">{totalQuestions} câu trong ngân hàng</span></div>
      {!practice.length ? <div class="suite-empty"><span>🏅</span><h3>Sẵn sàng thử thách?</h3><p>Mỗi lượt chọn tối đa 20 câu trắc nghiệm ngẫu nhiên, giới hạn 30 phút và lưu câu trả lời sai vào sổ lỗi sai.</p><button class="primary-button" onClick={startPractice}>Bắt đầu luyện đề</button></div> : <>
        <div class="suite-practice-meta"><b>{practiceTitle}</b><span>{Math.floor(practiceSeconds / 60).toString().padStart(2, '0')}:{(practiceSeconds % 60).toString().padStart(2, '0')}</span><span>{Object.keys(practiceAnswers).length}/{practice.length} câu đã trả lời</span></div>
        {practice.map((question, index) => <article class="question-card"><b>{index + 1}. {question.q}</b><div class="answer-list">{question.a.map((answer, answerIndex) => <label class={(practiceDone && answerIndex === Number(question.correct) ? 'correct' : '') + (practiceDone && practiceAnswers[index] === answerIndex && answerIndex !== Number(question.correct) ? ' incorrect' : '')}><input type="radio" name={'olympiad-' + index} checked={practiceAnswers[index] === answerIndex} disabled={practiceDone} onChange={() => setPracticeAnswers(current => ({ ...current, [index]: answerIndex }))} />{answer}</label>)}</div>{practiceDone && question.explanation && <p class="empty-state">Giải thích: {question.explanation}</p>}</article>)}
        {!practiceDone ? <div class="suite-actions"><button class="secondary-button" onClick={() => { setPractice([]); setPracticeRunning(false); }}>Bỏ lượt</button><button class="primary-button" onClick={submitPractice}>Nộp bài và chấm điểm</button></div> : <div class="suite-result"><h3>Đã hoàn thành lượt luyện đề</h3><p>{practice.filter((q, i) => practiceAnswers[i] === Number(q.correct)).length}/{practice.length} câu đúng</p><button class="primary-button" onClick={() => setPractice([])}>Tạo đề mới</button></div>}
      </>}
    </div>}
    {tab === 'analytics' && <div class="suite-panel"><h3>Phân tích quá trình học</h3><div class="suite-metrics"><article><b>{progress.completed.length}</b><span>Mục hoàn thành</span></article><article><b>{progress.attempts.length}</b><span>Lượt làm bài</span></article><article><b>{avgAccuracy}%</b><span>Độ chính xác TB</span></article><article><b>{progress.streak}</b><span>Ngày streak</span></article></div><h4>Kết quả gần đây</h4>{progress.attempts.length ? progress.attempts.slice(0, 10).map(item => <div class="suite-row"><b>{item.title}</b><span>{item.score}/{item.total} · {item.total ? Math.round(item.score / item.total * 100) : 0}%</span><small>{new Date(item.at).toLocaleDateString('vi-VN')}</small></div>) : <p class="empty-state">Chưa có dữ liệu làm bài để phân tích.</p>}<h4>Gợi ý cần cải thiện</h4>{weakTopics.length ? weakTopics.map(item => <p class="suite-hint">Ôn lại nội dung liên quan đến lượt “{item.title}” ({Math.round(item.score / item.total * 100)}%).</p>) : <p class="empty-state">Chưa thấy lượt làm bài có kết quả dưới 70%. Hãy tiếp tục luyện tập để dashboard có thêm dữ liệu.</p>}<p class="suite-footnote">Thời lượng xem video YouTube không được suy đoán; dashboard chỉ hiển thị dữ liệu hoạt động mà ứng dụng thực sự ghi nhận.</p></div>}
    {tab === 'tasks' && <div class="suite-panel"><h3>Bảng nhiệm vụ & thử thách</h3><p class="empty-state">Nhiệm vụ có thể hoàn thành một lần trong danh sách hiện tại; EXP được cộng qua hệ thống tiến độ chung.</p>{tasks.map(task => <article class="suite-task"><div><b>{task.title}</b><p>{task.desc}</p><small>+{task.xp} EXP</small></div><button class={taskDone.includes(task.id) ? 'secondary-button' : 'primary-button'} disabled={taskDone.includes(task.id)} onClick={() => { setTaskDone(current => [...current, task.id]); onTaskComplete(task.xp); }}>{taskDone.includes(task.id) ? '✓ Đã hoàn thành' : 'Nhận nhiệm vụ'}</button></article>)}</div>}
    {tab === 'discussion' && <div class="suite-panel"><h3>Thảo luận cùng gia sư AI</h3><p class="empty-state">Gia sư được hướng dẫn dạy theo kiểu Socrates: hỏi gợi mở, phân tích lỗi và không bật mí đáp án ngay.</p><label>Nội dung muốn thảo luận<textarea rows={6} value={discussion} onInput={event => setDiscussion(event.currentTarget.value)} placeholder="Ví dụ: Em chưa hiểu cách chọn chiều dương trong bài ném xiên…" /></label><label>Trợ lý AI<select value={aiProvider} onChange={event => setAiProvider(event.currentTarget.value)}><option value="https://chatgpt.com/">ChatGPT</option><option value="https://gemini.google.com/">Gemini</option><option value="https://claude.ai/">Claude</option><option value="https://chat.deepseek.com/">DeepSeek</option><option value="https://copilot.microsoft.com/">Copilot</option></select></label><button class="primary-button" disabled={!discussion.trim()} onClick={askAI}>Mở thảo luận với AI ↗</button><p class="suite-footnote">Phiên bản này mở dịch vụ AI bên ngoài và chuẩn bị prompt để sao chép; chưa gọi API trực tiếp từ PRINCIPIA.</p></div>}
    {tab === 'search' && <div class="suite-panel"><h3>Tìm kiếm toàn PRINCIPIA</h3><input class="suite-search" value={query} onInput={event => setQuery(event.currentTarget.value)} placeholder="Nhập tên bài học, chủ đề, công thức, ghi chú…" /><select value={searchScope} onChange={event => setSearchScope(event.currentTarget.value)}><option value="all">Tất cả nội dung</option><option value="lessons">Bài học</option><option value="quizzes">Ngân hàng đề</option><option value="notes">Sổ tay</option><option value="formulas">Công thức</option></select>{query.trim() && <p class="suite-footnote">Tìm thấy {searchResults.length} kết quả phù hợp.</p>}{searchResults.map(item => <article class="suite-row"><div><small>{item.type}</small><b>{item.title}</b><p>{item.body}</p></div></article>)}</div>}
    {tab === 'notes' && <div class="suite-panel"><h3>Sổ tay kiến thức cá nhân</h3><div class="suite-form"><label>Tiêu đề<input value={noteTitle} onInput={event => setNoteTitle(event.currentTarget.value)} placeholder="Ví dụ: Các dạng bài định luật Newton" /></label><label>Nội dung<textarea rows={5} value={noteBody} onInput={event => setNoteBody(event.currentTarget.value)} placeholder="Ghi công thức, ý tưởng, lời giải hoặc điều cần nhớ…" /></label><label>Thẻ phân loại<input value={noteTags} onInput={event => setNoteTags(event.currentTarget.value)} placeholder="Cơ học, Newton, Olympic…" /></label><button class="primary-button" onClick={saveNote}>Lưu vào sổ tay</button></div>{notes.map(note => <article class="suite-note"><div><b>{note.title}</b><small>{note.tags} · {new Date(note.updatedAt).toLocaleDateString('vi-VN')}</small></div><p>{note.body}</p><button class="quiet-button" onClick={() => setNotes(current => current.filter(item => item.id !== note.id))}>Xóa ghi chú</button></article>)}</div>}
    {tab === 'formulas' && <div class="suite-panel"><h3>Thư viện công thức Vật lý</h3><p class="empty-state">Mỗi công thức đi kèm điều kiện áp dụng và đơn vị cần kiểm tra.</p>{FORMULAS.map(item => <article class="suite-formula"><div><b>{item.name}</b><strong>{item.formula}</strong><p>{item.detail}</p></div><button class="secondary-button" onClick={() => { setNoteTitle(item.name); setNoteBody(item.formula + '\n' + item.detail); setNoteTags('Công thức Vật lý'); setTab('notes'); }}>Lưu vào sổ tay</button></article>)}</div>}
    {tab === 'flashcards' && <div class="suite-panel"><h3>Flashcard ôn tập ngắt quãng</h3><p class="empty-state">{dueCards.length} thẻ đến hạn ôn · {cards.length} thẻ trong bộ nhớ</p>{dueCards.length ? <><button class="suite-flashcard" onClick={() => setFlashReveal(value => !value)}><small>{flashReveal ? 'MẶT SAU' : 'MẶT TRƯỚC'} · Chạm để lật</small><strong>{flashReveal ? dueCards[Math.min(flashIndex, dueCards.length - 1)].back : dueCards[Math.min(flashIndex, dueCards.length - 1)].front}</strong></button>{flashReveal && <div class="suite-ratings"><button onClick={() => rateCard(1)}>Quên</button><button onClick={() => rateCard(3)}>Khó</button><button onClick={() => rateCard(4)}>Tốt</button><button onClick={() => rateCard(5)}>Dễ</button></div>}</> : <p class="suite-empty">Không có thẻ đến hạn. Bạn có thể tạo thẻ mới bên dưới.</p>}<div class="suite-form"><label>Mặt trước<input value={cardFront} onInput={event => setCardFront(event.currentTarget.value)} placeholder="Câu hỏi / khái niệm" /></label><label>Mặt sau<textarea rows={3} value={cardBack} onInput={event => setCardBack(event.currentTarget.value)} placeholder="Đáp án / lời giải ngắn" /></label><button class="primary-button" onClick={addCard}>＋ Tạo flashcard</button></div></div>}
    {tab === 'mistakes' && <div class="suite-panel"><h3>Sổ lỗi sai</h3><p class="empty-state">Các câu trả lời sai từ phòng Olympic sẽ tự động được lưu tại đây.</p>{mistakes.length ? mistakes.map(item => <article class="suite-mistake"><b>{item.question}</b><p><span>Bạn chọn:</span> {item.answer}</p><p><span>Đáp án:</span> {item.correct}</p><small>{item.source} · {new Date(item.at).toLocaleString('vi-VN')}</small><div class="suite-actions"><button class="secondary-button" onClick={() => openMistakeTutor(item)}>Nhờ AI phân tích lỗi</button><button class="quiet-button" onClick={() => setMistakes(current => current.filter(entry => entry.id !== item.id))}>Đã ôn / xóa</button></div></article>) : <p class="suite-empty">Chưa có câu sai được ghi nhận. Làm một lượt luyện đề để bắt đầu.</p>}</div>}
    {tab === 'notifications' && <div class="suite-panel"><div class="suite-panel-head"><h3>Trung tâm thông báo</h3><button class="quiet-button" onClick={clearNotifications}>Xóa thông báo</button></div><article class="suite-notice"><b>🧠 Ôn tập đến hạn</b><p>Bạn có {dueCards.length} flashcard cần ôn hôm nay.</p><button class="secondary-button" onClick={() => setTab('flashcards')}>Ôn ngay</button></article><article class="suite-notice"><b>📊 Tiến độ học tập</b><p>Bạn đã hoàn thành {progress.completed.length} mục và có {progress.attempts.length} lượt làm bài.</p><button class="secondary-button" onClick={() => setTab('analytics')}>Xem phân tích</button></article>{notifications.map(item => <article class="suite-notice"><p>{item.text}</p><small>{new Date(item.at).toLocaleString('vi-VN')}</small></article>)}</div>}
    {tab === 'badges' && <div class="suite-panel"><h3>Bộ sưu tập huy hiệu</h3><div class="suite-badges">{badges.map(item => <article class={item.unlocked ? 'unlocked' : 'locked'}><span>{item.icon}</span><b>{item.name}</b><p>{item.desc}</p><small>{item.unlocked ? 'Đã mở khóa' : 'Chưa đạt'}</small></article>)}</div></div>}
  </section>;
}
