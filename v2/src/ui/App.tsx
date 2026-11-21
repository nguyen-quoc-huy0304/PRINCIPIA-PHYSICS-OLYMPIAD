import { useEffect, useMemo, useState } from 'preact/hooks';
import type { AuthResult } from '../core/auth';
import {
  completeGoogleRedirect, createEmailAccount, observeAuth, sendPasswordReset,
  signInWithEmail, signInWithGoogle, signOut
} from '../core/auth';
import { collectLegacyData, downloadLegacyBackup, restoreLegacyBackup } from '../core/legacy-migration';
import type { LegacyBackup } from '../core/legacy-migration';
import { restoreLegacyDataFromCloud, syncLegacyDataToCloud } from '../core/cloud-data';

type Section = 'home' | 'learn' | 'quiz' | 'progress' | 'legacy';
type Mode = 'login' | 'signup';
type Question = { q: string; a: string[]; correct: number };
type LegacyNode = {
  id: string; name: string; icon?: string; type?: string; content?: string;
  children?: LegacyNode[]; questions?: Question[]; quiz?: Question[];
};

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'home', label: 'Tổng quan', icon: '⌂' },
  { id: 'learn', label: 'Học tập', icon: '▤' },
  { id: 'quiz', label: 'Luyện đề', icon: '◎' },
  { id: 'progress', label: 'Tiến độ', icon: '↗' },
  { id: 'legacy', label: 'Đầy đủ tính năng', icon: '✦' }
];

function parseArray<T>(raw?: string): T[] {
  if (!raw) return [];
  try { const value = JSON.parse(raw); return Array.isArray(value) ? value as T[] : []; }
  catch { return []; }
}
function countNodes(nodes: LegacyNode[], type: string): number {
  return nodes.reduce((sum, node) => sum + (node.type === type ? 1 : 0) + countNodes(node.children || [], type), 0);
}
function countQuestions(nodes: LegacyNode[]): number {
  return nodes.reduce((sum, node) => sum + (node.questions?.length || node.quiz?.length || 0) + countQuestions(node.children || []), 0);
}

export function App() {
  const [account, setAccount] = useState<AuthResult | null>(null);
  const [section, setSection] = useState<Section>('home');
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [welcome, setWelcome] = useState(false);
  const [backupVersion, setBackupVersion] = useState(0);
  const [lessonPath, setLessonPath] = useState<LegacyNode[]>([]);
  const [activeLesson, setActiveLesson] = useState<LegacyNode | null>(null);
  const [quizPath, setQuizPath] = useState<LegacyNode[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<LegacyNode | null>(null);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;
    completeGoogleRedirect().catch(error => {
      if (active) setStatus(error?.message || 'Không thể hoàn tất đăng nhập Google.');
    });
    observeAuth(next => {
      if (!active) return;
      setAccount(next);
      if (next) setWelcome(true);
    }).then(stop => {
      if (active) unsubscribe = stop;
      else stop();
    }).catch(error => {
      if (active) setStatus(error?.message || 'Không thể kết nối dịch vụ đăng nhập.');
    });
    return () => { active = false; unsubscribe?.(); };
  }, []);

  const legacy = useMemo<LegacyBackup>(() => {
    try { return collectLegacyData(); }
    catch { return { entries: {} as Record<string, string>, format: 'principia-legacy-backup' as const, version: 1 as const, createdAt: '' }; }
  }, [backupVersion]);
  const lessons = useMemo(() => parseArray<LegacyNode>(legacy.entries['halo_data']), [legacy]);
  const quizzes = useMemo(() => parseArray<LegacyNode>(legacy.entries['halo_quiz']), [legacy]);
  const fun = useMemo(() => parseArray<LegacyNode>(legacy.entries['halo_fun']), [legacy]);
  const learningNodes = lessonPath.length ? lessonPath[lessonPath.length - 1].children || [] : lessons;
  const quizNodes = quizPath.length ? quizPath[quizPath.length - 1].children || [] : quizzes;
  const questions = activeQuiz?.questions || activeQuiz?.quiz || [];
  const xp = Number(legacy.entries['halo_xp'] || 0);
  const streak = Number(legacy.entries['halo_streak'] || 0);
  const completed = parseArray<string>(legacy.entries['halo_completed']);

  async function runAuth(action: () => Promise<AuthResult>) {
    setBusy(true); setStatus('');
    try {
      const result = await action();
      setAccount(result); setWelcome(true); setPassword('');
    } catch (error: any) {
      const messages: Record<string, string> = {
        'auth/invalid-credential': 'Email hoặc mật khẩu chưa chính xác.',
        'auth/email-already-in-use': 'Email này đã có tài khoản. Hãy đăng nhập.',
        'auth/weak-password': 'Mật khẩu cần tối thiểu 6 ký tự.',
        'auth/invalid-email': 'Địa chỉ email chưa hợp lệ.',
        'auth/unauthorized-domain': 'Tên miền chưa được cho phép trong Firebase Authentication.',
        'auth/too-many-requests': 'Bạn thao tác quá nhanh. Hãy thử lại sau.'
      };
      setStatus(messages[error?.code] || error?.message || 'Đăng nhập chưa thành công.');
    } finally { setBusy(false); }
  }

  async function handleGoogle() {
    setBusy(true); setStatus('Đang mở Google để xác thực…');
    try { await signInWithGoogle(); }
    catch (error: any) { setStatus(error?.message || 'Không thể mở đăng nhập Google.'); setBusy(false); }
  }

  async function handleReset() {
    if (!email.trim()) { setStatus('Nhập email trước, sau đó chọn Quên mật khẩu.'); return; }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setStatus('Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư mục Spam.');
    } catch (error: any) { setStatus(error?.message || 'Không gửi được email đặt lại mật khẩu.'); }
    finally { setBusy(false); }
  }

  async function handleRestore(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const count = restoreLegacyBackup(await file.text());
      setBackupVersion(value => value + 1);
      setStatus(`Đã khôi phục ${count} mục dữ liệu. Hãy tải lại ứng dụng để nạp lại nội dung cũ.`);
    } catch (error: any) { setStatus(error?.message || 'Không thể đọc tệp sao lưu.'); }
    finally { input.value = ''; }
  }

  async function handleCloudSync() {
    setBusy(true); setStatus('Đang đồng bộ dữ liệu lên tài khoản PRINCIPIA…');
    try {
      const count = await syncLegacyDataToCloud(account!.user.uid);
      setStatus(`Đã đồng bộ ${count} mục dữ liệu lên đám mây.`);
    } catch (error: any) {
      setStatus(error?.message || 'Đồng bộ thất bại. Hãy kiểm tra kết nối và Firestore Security Rules.');
    } finally { setBusy(false); }
  }

  async function handleCloudRestore() {
    if (!confirm('Khôi phục dữ liệu đám mây sẽ ghi đè các mục trùng tên trên thiết bị này. Bạn muốn tiếp tục?')) return;
    setBusy(true); setStatus('Đang tải dữ liệu từ đám mây…');
    try {
      const count = await restoreLegacyDataFromCloud(account!.user.uid);
      setBackupVersion(value => value + 1);
      setStatus(`Đã khôi phục ${count} mục dữ liệu. Hãy tải lại ứng dụng để nạp nội dung.`);
    } catch (error: any) {
      setStatus(error?.message || 'Khôi phục thất bại. Hãy kiểm tra kết nối và Firestore Security Rules.');
    } finally { setBusy(false); }
  }

  function chooseSection(next: Section) {
    setSection(next);
    setLessonPath([]); setActiveLesson(null);
    setQuizPath([]); setActiveQuiz(null);
    setAnswers({}); setQuizSubmitted(false);
    setStatus('');
  }

  function openLearningNode(node: LegacyNode) {
    if (node.type === 'lesson' || node.content) setActiveLesson(node);
    else setLessonPath(path => [...path, node]);
  }

  function openQuizNode(node: LegacyNode) {
    const items = node.questions || node.quiz || [];
    if (items.length) { setActiveQuiz(node); setAnswers({}); setQuizSubmitted(false); }
    else setQuizPath(path => [...path, node]);
  }

  if (!account) {
    return (
      <div class="auth-screen">
        <div class="auth-glow" />
        <section class="auth-card">
          <img class="principia-logo" src="/legacy/assets/images/principia-logo-round.svg" alt="PRINCIPIA" />
          <p class="eyebrow">PHYSICS OLYMPIAD · PRO</p>
          <h1>{mode === 'login' ? 'Chào mừng trở lại' : 'Tạo tài khoản'}</h1>
          <p class="auth-subtitle">Không gian học tập khoa học của PRINCIPIA.</p>
          <button class="google-button" type="button" disabled={busy} onClick={handleGoogle}>
            <span class="google-g">G</span> Tiếp tục với Google
          </button>
          <div class="auth-divider"><span>hoặc dùng email</span></div>
          <form class="auth-form" onSubmit={event => {
            event.preventDefault();
            if (mode === 'login') void runAuth(() => signInWithEmail(email, password));
            else void runAuth(() => createEmailAccount(email, password, displayName));
          }}>
            {mode === 'signup' && (
              <label>Tên hiển thị
                <input value={displayName} onInput={event => setDisplayName(event.currentTarget.value)} placeholder="Tên của bạn" autocomplete="name" />
              </label>
            )}
            <label>Email
              <input type="email" required value={email} onInput={event => setEmail(event.currentTarget.value)} placeholder="you@example.com" autocomplete="email" />
            </label>
            <label>Mật khẩu
              <div class="password-field">
                <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onInput={event => setPassword(event.currentTarget.value)} placeholder="Tối thiểu 6 ký tự" autocomplete={mode === 'login' ? 'current-password' : 'new-password'} />
                <button type="button" class="password-toggle" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'} onClick={() => setShowPassword(value => !value)}>{showPassword ? 'Ẩn' : 'Hiện'}</button>
              </div>
            </label>
            <button class="primary-button" type="submit" disabled={busy}>{busy ? 'Đang xử lý…' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}</button>
          </form>
          <div class="auth-links">
            <button type="button" onClick={handleReset}>Quên mật khẩu?</button>
            <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setStatus(''); }}>
              {mode === 'login' ? 'Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập'}
            </button>
          </div>
          {status && <p class="auth-status" role="status">{status}</p>}
          <p class="auth-footnote">Tài khoản ngoài quản trị chỉ có quyền xem nội dung học tập.</p>
        </section>
      </div>
    );
  }

  if (welcome) {
    return (
      <div class="welcome-screen">
        <section class="welcome-card">
          <img class="principia-logo welcome-logo" src="/principia-logo-round.png" alt="PRINCIPIA" />
          <p class="eyebrow">PRINCIPIA · PHYSICS OLYMPIAD</p>
          <h1>Chào mừng, {account.user.displayName || account.user.email?.split('@')[0] || 'bạn'}!</h1>
          <p>Không gian học tập của bạn đã sẵn sàng.</p>
          <button class="primary-button" onClick={() => setWelcome(false)}>Vào học ngay <span>→</span></button>
          <button class="quiet-button" onClick={() => void signOut()}>Đăng xuất</button>
        </section>
      </div>
    );
  }

  return (
    <div class="app-shell">
      <header class="topbar">
        <img class="topbar-logo" src="/principia-logo-round.png" alt="" />
        <div class="brand-copy"><strong>PRINCIPIA</strong><span>PHYSICS OLYMPIAD · PRO</span></div>
        <div class="account-chip"><span>{account.isAdmin ? 'ADMIN' : 'LEARNER'}</span><b>{account.user.displayName || account.user.email}</b></div>
      </header>
      <main class="main-content">
        <p class="eyebrow">LEARNING WORKSPACE</p>
        <h1>{sections.find(item => item.id === section)?.label}</h1>
        {section === 'home' && <>
          <p class="intro">Xin chào {account.user.displayName || 'bạn'}. PRINCIPIA V2 đang chuyển các mô-đun học tập sang kiến trúc mới.</p>
          <section class="stats-grid">
            <article><strong>{countNodes(lessons, 'lesson')}</strong><span>Bài học cũ</span></article>
            <article><strong>{countQuestions(quizzes) + countQuestions(fun)}</strong><span>Câu hỏi cũ</span></article>
            <article><strong>{completed.length}</strong><span>Mục đã hoàn thành</span></article>
          </section>
          <section class="migration-card"><span class="status-dot" /><div><strong>Đang bảo toàn dữ liệu bản cũ</strong><p>Đã phát hiện {Object.keys(legacy.entries).length} mục dữ liệu trên thiết bị này. Sao lưu trước khi chuyển thiết bị hoặc đổi phiên bản.</p></div></section>
          <section class="backup-panel">
            <div><strong>Sao lưu & khôi phục</strong><p>Xuất dữ liệu bài học, câu hỏi, tiến độ và cài đặt đang lưu trên thiết bị thành tệp JSON.</p></div>
            <div class="backup-actions">
              <button class="secondary-button" onClick={downloadLegacyBackup}>Tải bản sao lưu</button>
              <label class="secondary-button file-button">Khôi phục tệp<input type="file" accept="application/json,.json" onChange={handleRestore} /></label>
              <button class="secondary-button" disabled={busy} onClick={() => void handleCloudSync()}>Đồng bộ cloud</button>
              <button class="secondary-button" disabled={busy} onClick={() => void handleCloudRestore()}>Khôi phục cloud</button>
            </div>
          </section>
        </>}
        {section === 'learn' && <>
          {activeLesson ? <section class="content-panel">
            <button class="back-link" onClick={() => setActiveLesson(null)}>← Quay lại danh sách</button>
            <h2>{activeLesson.icon || '📘'} {activeLesson.name}</h2>
            <pre class="lesson-content">{activeLesson.content || 'Bài học chưa có nội dung.'}</pre>
          </section> : <section class="content-panel">
            <div class="section-toolbar">
              <button class="back-link" disabled={!lessonPath.length} onClick={() => setLessonPath(path => path.slice(0, -1))}>← Quay lại</button>
              <span>{lessonPath.map(node => node.name).join(' / ') || 'Tất cả môn học'}</span>
            </div>
            <div class="node-grid">
              {learningNodes.map(node => <button class="node-card" onClick={() => openLearningNode(node)}>
                <span>{node.icon || (node.type === 'lesson' ? '📘' : '📂')}</span><b>{node.name}</b><small>{node.type === 'lesson' ? 'Mở bài học' : `${node.children?.length || 0} mục`}</small>
              </button>)}
            </div>
            {!learningNodes.length && <p class="empty-state">Chưa tìm thấy dữ liệu bài học trên thiết bị này. Hãy nhập bản sao lưu từ phiên bản cũ.</p>}
          </section>}
        </>}
        {section === 'quiz' && <>
          {activeQuiz ? <section class="content-panel">
            <button class="back-link" onClick={() => { setActiveQuiz(null); setQuizSubmitted(false); }}>← Quay lại danh sách</button>
            <h2>{activeQuiz.name}</h2>
            {questions.map((question, index) => <article class="question-card">
              <b>{index + 1}. {question.q}</b>
              <div class="answer-list">{question.a.map((answer, answerIndex) => <label class={quizSubmitted && answerIndex === question.correct ? 'correct-answer' : ''}>
                <input type="radio" name={`q-${index}`} checked={answers[index] === answerIndex} disabled={quizSubmitted} onChange={() => setAnswers(current => ({ ...current, [index]: answerIndex }))} />
                {answer}
              </label>)}</div>
            </article>)}
            {!quizSubmitted ? <button class="primary-button quiz-submit" disabled={!questions.length} onClick={() => setQuizSubmitted(true)}>Nộp bài</button> :
              <p class="quiz-result">Kết quả: {questions.filter((q, i) => answers[i] === q.correct).length}/{questions.length} câu đúng.</p>}
          </section> : <section class="content-panel">
            <div class="section-toolbar">
              <button class="back-link" disabled={!quizPath.length} onClick={() => setQuizPath(path => path.slice(0, -1))}>← Quay lại</button>
              <span>{quizPath.map(node => node.name).join(' / ') || 'Ngân hàng đề'}</span>
            </div>
            <div class="node-grid">
              {quizNodes.map(node => <button class="node-card" onClick={() => openQuizNode(node)}>
                <span>{node.icon || '📝'}</span><b>{node.name}</b><small>{(node.questions || node.quiz || []).length ? `${(node.questions || node.quiz || []).length} câu hỏi` : `${node.children?.length || 0} mục`}</small>
              </button>)}
            </div>
            {!quizNodes.length && <p class="empty-state">Chưa tìm thấy ngân hàng câu hỏi. Hãy nhập bản sao lưu từ phiên bản cũ.</p>}
          </section>}
        </>}
        {section === 'legacy' && <section class="legacy-workspace">
          <div class="legacy-banner"><div><strong>PRINCIPIA · Không gian đầy đủ tính năng</strong><p>Mở toàn bộ giao diện và công cụ của phiên bản cũ trong V2 để không mất chức năng trong lúc chuyển đổi.</p></div><a href="/legacy/index.html" target="_blank" rel="noreferrer">Mở toàn màn hình ↗</a></div>
          <iframe class="legacy-frame" src="/legacy/index.html" title="PRINCIPIA full legacy workspace" loading="lazy" allow="clipboard-read; clipboard-write; fullscreen; autoplay; encrypted-media; picture-in-picture" />
        </section>}
        {section === 'progress' && <section class="content-panel progress-panel">
          <div><strong>{Number.isFinite(xp) ? xp : 0}</strong><span>EXP tích lũy</span></div>
          <div><strong>{Number.isFinite(streak) ? streak : 0}</strong><span>Chuỗi ngày học</span></div>
          <div><strong>{completed.length}</strong><span>Bài/mục hoàn thành</span></div>
          <p class="empty-state">Tiến độ được đọc trực tiếp từ dữ liệu cũ trên thiết bị. Đồng bộ đám mây sẽ được hoàn thiện ở bước tiếp theo.</p>
        </section>}
        <div class="account-footer"><span>{account.user.email}</span><button class="quiet-button" onClick={() => void signOut()}>Đăng xuất</button></div>
        {status && <p class="auth-status" role="status">{status}</p>}
      </main>
      <nav class="bottom-nav" aria-label="Điều hướng chính">
        {sections.map(item => <button type="button" class={section === item.id ? 'active' : ''} onClick={() => chooseSection(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
      </nav>
    </div>
  );
}
