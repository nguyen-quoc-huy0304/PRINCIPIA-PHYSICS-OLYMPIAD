import { useEffect, useMemo, useState } from 'preact/hooks';
import type { AuthResult } from '../core/auth';
import {
  completeGoogleRedirect, createEmailAccount, observeAuth, sendPasswordReset,
  signInWithEmail, signInWithGoogle, signOut
} from '../core/auth';
import { collectLegacyData, downloadLegacyBackup, restoreLegacyBackup } from '../core/legacy-migration';
import type { LegacyBackup } from '../core/legacy-migration';
import { restoreLegacyDataFromCloud, syncLegacyDataToCloud, restoreProgressFromCloud, syncProgressToCloud } from '../core/cloud-data';

type Section = 'home' | 'learn' | 'quiz' | 'chat' | 'progress' | 'legacy';
type Mode = 'login' | 'signup';
type Question = { q: string; a: string[]; correct: number };
type LegacyNode = {
  id: string; name: string; icon?: string; type?: string; content?: string; note?: string; video?: string;
  children?: LegacyNode[]; questions?: Question[]; quiz?: Question[];
};

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'home', label: 'Tổng quan', icon: '⌂' },
  { id: 'learn', label: 'Học tập', icon: '▤' },
  { id: 'quiz', label: 'Luyện đề', icon: '◎' },
  { id: 'chat', label: 'AI Chat', icon: '✧' },
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
  const [chatProvider, setChatProvider] = useState(() => localStorage.getItem('principia_v2_ai_selected') || 'chatgpt');
  const [chatDraft, setChatDraft] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user'; text: string; at: string }>>([]);
  const [chatNotice, setChatNotice] = useState('');
  const chatStorageKey = `principia_v2_chat:${account?.user.uid || 'guest'}:${chatProvider}`;
  useEffect(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(chatStorageKey) || '[]');
      setChatMessages(Array.isArray(parsed) ? parsed.filter((item: any) => item && item.role === 'user' && typeof item.text === 'string' && typeof item.at === 'string').slice(-100) : []);
    } catch { setChatMessages([]); }
    setChatNotice('');
  }, [chatStorageKey]);

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
  const [lessonTool, setLessonTool] = useState<'note' | 'files' | 'submit' | 'simulation'>('note');
  const [privateNote, setPrivateNote] = useState('');
  const [assignmentText, setAssignmentText] = useState('');
  const [lessonFiles, setLessonFiles] = useState<Array<{ name: string; type: string; size: number; dataUrl: string; addedAt: string }>>([]);
  const [simulationSubject, setSimulationSubject] = useState('physics');
  const [workspaceNotice, setWorkspaceNotice] = useState('');
  const currentLessonStorageKey = activeLesson ? `principia_lesson_workspace:${account?.user.uid || 'guest'}:${[...lessonPath, activeLesson].map(item => item.id || item.name).join('::')}` : '';
  useEffect(() => {
    if (!currentLessonStorageKey) return;
    try {
      const saved = JSON.parse(localStorage.getItem(currentLessonStorageKey) || '{}');
      setPrivateNote(typeof saved.note === 'string' ? saved.note : '');
      setAssignmentText(typeof saved.submission === 'string' ? saved.submission : '');
      setLessonFiles(Array.isArray(saved.files) ? saved.files.filter((file: any) => file && typeof file.name === 'string' && typeof file.dataUrl === 'string') : []);
      setLessonTool('note');
      setWorkspaceNotice('');
    } catch {
      setPrivateNote('');
      setAssignmentText('');
      setLessonFiles([]);
    }
  }, [currentLessonStorageKey]);
  const handleLessonFiles = async (event: Event) => {
    const input = event.currentTarget as HTMLInputElement;
    const selected = Array.from(input.files || []);
    if (!selected.length) return;
    const maxFileBytes = 1_500_000;
    const accepted = selected.filter(file => file.size <= maxFileBytes);
    if (accepted.length !== selected.length) setWorkspaceNotice('Một số tệp vượt quá giới hạn 1,5 MB nên không được thêm.');
    try {
      const added = await Promise.all(accepted.map(file => new Promise<{ name: string; type: string; size: number; dataUrl: string; addedAt: string }>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === 'string'
          ? resolve({ name: file.name, type: file.type || 'application/octet-stream', size: file.size, dataUrl: reader.result, addedAt: new Date().toISOString() })
          : reject(new Error('Không đọc được tệp.'));
        reader.onerror = () => reject(new Error('Không đọc được tệp.'));
        reader.readAsDataURL(file);
      })));
      const next = [...lessonFiles, ...added].slice(-12);
      setLessonFiles(next);
      saveLessonWorkspace({ files: next } as any);
      setWorkspaceNotice('Đã thêm tệp vào tài liệu bài học trên thiết bị này.');
    } catch (error: any) {
      setWorkspaceNotice(error?.message || 'Không thể thêm tệp.');
    } finally { input.value = ''; }
  };
  const removeLessonFile = (name: string, addedAt: string) => {
    const next = lessonFiles.filter(file => !(file.name === name && file.addedAt === addedAt));
    setLessonFiles(next);
    saveLessonWorkspace({ files: next } as any);
  };
  const saveLessonWorkspace = (patch: { note?: string; submission?: string }) => {
    if (!currentLessonStorageKey) return;
    try {
      const current = JSON.parse(localStorage.getItem(currentLessonStorageKey) || '{}');
      localStorage.setItem(currentLessonStorageKey, JSON.stringify({ ...current, ...patch, updatedAt: new Date().toISOString() }));
      setWorkspaceNotice('Đã lưu trên tài khoản của thiết bị này.');
    } catch {
      setWorkspaceNotice('Không lưu được. Bộ nhớ trình duyệt có thể đã đầy.');
    }
  };
  const [localProgress, setLocalProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('principia_v2_progress') || '{\"completed\":[],\"attempts\":[],\"xp\":0}') as { completed: string[]; attempts: Array<{ title: string; score: number; total: number; at: string }>; xp: number }; }
    catch { return { completed: [] as string[], attempts: [] as Array<{ title: string; score: number; total: number; at: string }>, xp: 0 }; }
  });
  const progressStorageKey = account ? `principia_v2_progress:${account.user.uid}` : 'principia_v2_progress:guest';
  useEffect(() => {
    if (!account) return;
    try {
      const scoped = localStorage.getItem(`principia_v2_progress:${account.user.uid}`);
      const legacyLocal = localStorage.getItem('principia_v2_progress');
      const parsed = JSON.parse(scoped || legacyLocal || '{"completed":[],"attempts":[],"xp":0}');
      const safe = {
        completed: Array.isArray(parsed.completed) ? parsed.completed.filter((value: unknown) => typeof value === 'string') : [],
        attempts: Array.isArray(parsed.attempts) ? parsed.attempts.filter((value: any) => value && typeof value.title === 'string' && typeof value.score === 'number' && typeof value.total === 'number' && typeof value.at === 'string').slice(0, 100) : [],
        xp: Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp) : 0
      };
      setLocalProgress(safe);
      if (!scoped && legacyLocal) localStorage.setItem(`principia_v2_progress:${account.user.uid}`, JSON.stringify(safe));
    } catch { setLocalProgress({ completed: [], attempts: [], xp: 0 }); }
  }, [account?.user.uid]);
  const saveProgress = (next: typeof localProgress) => {
    setLocalProgress(next);
    try { localStorage.setItem(progressStorageKey, JSON.stringify(next)); } catch { setStatus('Không thể lưu tiến độ: bộ nhớ trình duyệt đã đầy hoặc bị chặn.'); }
  };
  const lessonKey = (node: LegacyNode) => [...lessonPath, node].map(item => item.id || item.name).join('::');
  const markLessonComplete = (node: LegacyNode) => {
    const key = lessonKey(node);
    if (localProgress.completed.includes(key)) return;
    saveProgress({ ...localProgress, completed: [...localProgress.completed, key], xp: localProgress.xp + 10 });
    setStatus('Đã hoàn thành bài học · +10 EXP.');
  };
  const submitQuiz = () => {
    const score = questions.filter((q, i) => answers[i] === q.correct).length;
    const attempt = { title: activeQuiz?.name || 'Bài luyện tập', score, total: questions.length, at: new Date().toISOString() };
    saveProgress({ ...localProgress, attempts: [attempt, ...localProgress.attempts].slice(0, 100), xp: localProgress.xp + score * 5 });
    setQuizSubmitted(true);
  };

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
  const quizNodes = quizPath.length ? quizPath[quizPath.length - 1].children || [] : [...quizzes, ...fun.map(node => ({ ...node, name: node.name || 'Thử thách' }))];
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
      await syncProgressToCloud(account!.user.uid, localProgress);
      setStatus(`Đã đồng bộ ${count} mục dữ liệu và tiến độ học tập lên đám mây.`);
    } catch (error: any) {
      setStatus(error?.message || 'Đồng bộ thất bại. Hãy kiểm tra kết nối và Firestore Security Rules.');
    } finally { setBusy(false); }
  }

  async function handleCloudRestore() {
    if (!confirm('Khôi phục dữ liệu đám mây sẽ ghi đè các mục trùng tên trên thiết bị này. Bạn muốn tiếp tục?')) return;
    setBusy(true); setStatus('Đang tải dữ liệu từ đám mây…');
    try {
      const count = await restoreLegacyDataFromCloud(account!.user.uid);
      const cloudProgress = await restoreProgressFromCloud(account!.user.uid);
      if (cloudProgress) saveProgress(cloudProgress);
      setBackupVersion(value => value + 1);
      setStatus(`Đã khôi phục ${count} mục dữ liệu${cloudProgress ? ' và tiến độ học tập' : ''}.`);
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
              {account.isAdmin && <>
                <button class="secondary-button" disabled={busy} onClick={() => void handleCloudSync()}>Đồng bộ cloud</button>
                <button class="secondary-button" disabled={busy} onClick={() => void handleCloudRestore()}>Khôi phục cloud</button>
              </>}
              {!account.isAdmin && <p class="permission-note">Tài khoản học viên chỉ xem nội dung; quyền ghi và đồng bộ dữ liệu lên cloud dành cho quản trị viên.</p>}
            </div>
          </section>
        </>}
        {section === 'learn' && <>
          {activeLesson ? <section class="content-panel">
            <button class="back-link" onClick={() => setActiveLesson(null)}>← Quay lại danh sách</button>
            <h2>{activeLesson.icon || '📘'} {activeLesson.name}</h2>
            {activeLesson.video && /^https?:\/\//i.test(activeLesson.video) && <div class="lesson-video">
              <a href={activeLesson.video} target="_blank" rel="noreferrer">Mở video bài học ↗</a>
              {(() => {
                const match = activeLesson.video!.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{6,})/);
                return match ? <iframe title="Video bài học" src={`https://www.youtube-nocookie.com/embed/${match[1]}`} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen /> : null;
              })()}
            </div>}
            {activeLesson.content && <><h3>Nội dung bài học</h3><pre class="lesson-content">{activeLesson.content}</pre></>}
            {activeLesson.note && <><h3>Ghi chú</h3><pre class="lesson-content">{activeLesson.note}</pre></>}
            <div class="lesson-tools">
              <div class="lesson-tool-tabs" role="tablist" aria-label="Công cụ bài học">
                <button type="button" class={lessonTool === 'note' ? 'active' : ''} onClick={() => setLessonTool('note')}>✎ Ghi chép</button>
                <button type="button" class={lessonTool === 'files' ? 'active' : ''} onClick={() => setLessonTool('files')}>▧ Tài liệu</button>
                <button type="button" class={lessonTool === 'submit' ? 'active' : ''} onClick={() => setLessonTool('submit')}>⇧ Nộp bài</button>
                <button type="button" class={lessonTool === 'simulation' ? 'active' : ''} onClick={() => setLessonTool('simulation')}>⚛ Mô phỏng</button>
              </div>
              {lessonTool === 'note' && <div class="lesson-tool-panel">
                <h3>Ghi chép cá nhân</h3>
                <textarea value={privateNote} onInput={event => setPrivateNote(event.currentTarget.value)} placeholder="Ghi lại công thức, ý tưởng và điều cần nhớ…" rows={7} />
                <button class="secondary-button" onClick={() => saveLessonWorkspace({ note: privateNote })}>Lưu ghi chép</button>
              </div>}
              {lessonTool === 'files' && <div class="lesson-tool-panel">
                <h3>Tài liệu bài học</h3>
                <p class="empty-state">Thêm tài liệu để mở lại trên thiết bị này. Mỗi tệp tối đa 1,5 MB; tối đa 12 tệp mỗi bài.</p>
                <label class="secondary-button file-button">＋ Thêm tài liệu<input type="file" multiple onChange={handleLessonFiles} /></label>
                {lessonFiles.length ? <div class="lesson-file-list">{lessonFiles.map(file => <article><div><b>{file.name}</b><small>{(file.size / 1024).toFixed(1)} KB · {new Date(file.addedAt).toLocaleDateString('vi-VN')}</small></div><a href={file.dataUrl} download={file.name}>Tải / mở</a><button type="button" onClick={() => removeLessonFile(file.name, file.addedAt)}>Xóa</button></article>)}</div> : <p class="empty-state">Chưa có tài liệu đính kèm.</p>}
              </div>}
              {lessonTool === 'submit' && <div class="lesson-tool-panel">
                <h3>Bài làm / câu hỏi gửi giáo viên</h3>
                <p class="empty-state">Phần trả lời được lưu riêng trên thiết bị hiện tại. Chức năng gửi bài lên hệ thống giáo viên sẽ được nối với quyền và dữ liệu cloud ở bước tiếp theo.</p>
                <textarea value={assignmentText} onInput={event => setAssignmentText(event.currentTarget.value)} placeholder="Nhập lời giải, kết quả hoặc câu hỏi của bạn…" rows={7} />
                <button class="secondary-button" onClick={() => saveLessonWorkspace({ submission: assignmentText })}>Lưu bài làm nháp</button>
              </div>}
              {lessonTool === 'simulation' && <div class="lesson-tool-panel">
                <h3>PhET Interactive Simulations</h3>
                <select value={simulationSubject} onChange={event => setSimulationSubject(event.currentTarget.value)}>
                  <option value="physics">Vật lý</option><option value="math">Toán học</option><option value="chemistry">Hóa học</option><option value="biology">Sinh học</option>
                </select>
                <iframe class="phet-frame" title="PhET simulations" src={`https://phet.colorado.edu/vi/simulations/filter?subjects=${simulationSubject}&type=html`} loading="lazy" allow="fullscreen" />
                <a href={`https://phet.colorado.edu/vi/simulations/filter?subjects=${simulationSubject}&type=html`} target="_blank" rel="noreferrer">Mở PhET trong tab mới ↗</a>
              </div>}
              {workspaceNotice && <p class="workspace-notice" role="status">{workspaceNotice}</p>}
            </div>
            <div class="lesson-completion"><span>{localProgress.completed.includes(lessonKey(activeLesson)) ? '✓ Đã hoàn thành' : 'Hoàn thành bài học để lưu tiến độ'}</span><button class="secondary-button" disabled={localProgress.completed.includes(lessonKey(activeLesson))} onClick={() => markLessonComplete(activeLesson)}>{localProgress.completed.includes(lessonKey(activeLesson)) ? 'Đã ghi nhận' : 'Đánh dấu hoàn thành · +10 EXP'}</button></div>
            {!activeLesson.content && !activeLesson.note && !activeLesson.video && <p class="empty-state">Bài học chưa có nội dung.</p>}
            {(activeLesson.quiz?.length || activeLesson.questions?.length) ? <button class="primary-button quiz-submit" onClick={() => openQuizNode(activeLesson)}>Làm câu hỏi bài học ({(activeLesson.quiz || activeLesson.questions || []).length})</button> : null}
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
            {!quizSubmitted ? <button class="primary-button quiz-submit" disabled={!questions.length || Object.keys(answers).length !== questions.length} onClick={submitQuiz}>Nộp bài</button> :
              <><p class="quiz-result">Kết quả: {questions.filter((q, i) => answers[i] === q.correct).length}/{questions.length} câu đúng · +{questions.filter((q, i) => answers[i] === q.correct).length * 5} EXP.</p><p class="empty-state">Lần làm bài đã được lưu vào lịch sử tiến độ trên thiết bị.</p></>}
          </section> : <section class="content-panel">
            <div class="section-toolbar">
              <button class="back-link" disabled={!quizPath.length} onClick={() => setQuizPath(path => path.slice(0, -1))}>← Quay lại</button>
              <span>{quizPath.map(node => node.name).join(' / ') || 'Ngân hàng đề & thử thách'}</span>
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
        {section === 'chat' && <section class="content-panel chat-workspace">
          <div class="chat-heading"><div><h2>AI Study Assistant</h2><p>Soạn câu hỏi, lưu lịch sử và mở AI đã chọn trong trình duyệt.</p></div>
            <select value={chatProvider} onChange={event => { localStorage.setItem('principia_v2_ai_selected', event.currentTarget.value); setChatProvider(event.currentTarget.value); }}>
              <option value="chatgpt">ChatGPT</option><option value="gemini">Google Gemini</option><option value="claude">Claude</option><option value="deepseek">DeepSeek</option><option value="copilot">Microsoft Copilot</option>
            </select>
          </div>
          <div class="chat-provider-note">PRINCIPIA lưu lịch sử lời nhắc trên thiết bị. Khi mở AI, bạn cần đăng nhập và gửi nội dung ở trang của nhà cung cấp; V2 chưa giả lập phản hồi AI hoặc tự gửi dữ liệu của bạn.</div>
          <div class="chat-history">
            {chatMessages.length ? chatMessages.map((message, index) => <article class="chat-user-message" key={message.at + index}><small>BẠN · {new Date(message.at).toLocaleString('vi-VN')}</small><p>{message.text}</p></article>) : <div class="empty-state">Chưa có lời nhắc nào. Hãy nhập câu hỏi để bắt đầu.</div>}
          </div>
          <form class="chat-composer" onSubmit={event => {
            event.preventDefault();
            const text = chatDraft.trim();
            if (!text) return;
            const next = [...chatMessages, { role: 'user' as const, text, at: new Date().toISOString() }].slice(-100);
            setChatMessages(next);
            try { localStorage.setItem(chatStorageKey, JSON.stringify(next)); setChatNotice('Đã lưu lời nhắc vào lịch sử PRINCIPIA.'); }
            catch { setChatNotice('Bộ nhớ trình duyệt đầy; lời nhắc chỉ còn trong phiên này.'); }
            setChatDraft('');
          }}>
            <textarea value={chatDraft} onInput={event => setChatDraft(event.currentTarget.value)} placeholder="Hỏi về vật lý, toán học hoặc nội dung bài học…" rows={4} />
            <div class="chat-actions"><button class="secondary-button" type="submit" disabled={!chatDraft.trim()}>Lưu lời nhắc</button>
              <button class="primary-button" type="button" disabled={!chatDraft.trim()} onClick={() => {
                const urls: Record<string, string> = { chatgpt: 'https://chatgpt.com/', gemini: 'https://gemini.google.com/app', claude: 'https://claude.ai/new', deepseek: 'https://chat.deepseek.com/', copilot: 'https://copilot.microsoft.com/' };
                const text = chatDraft.trim();
                const opened = window.open(urls[chatProvider] || urls.chatgpt, '_blank');
                if (opened) {
                  void navigator.clipboard?.writeText(text).then(() => setChatNotice('Đã mở AI và sao chép câu hỏi. Dán vào khung chat của AI để gửi.'));
                  setChatNotice('Đã mở AI. Nếu chưa tự sao chép được, hãy dùng nút Sao chép câu hỏi.');
                } else setChatNotice('Trình duyệt chặn cửa sổ bật lên. Hãy cho phép pop-up rồi thử lại.');
              }}>Mở AI ↗</button>
              <button class="secondary-button" type="button" disabled={!chatDraft.trim()} onClick={() => { void navigator.clipboard?.writeText(chatDraft.trim()); setChatNotice('Đã sao chép câu hỏi.'); }}>Sao chép câu hỏi</button>
              <button class="quiet-button" type="button" disabled={!chatMessages.length} onClick={() => { if (confirm('Xóa toàn bộ lịch sử lời nhắc của AI này?')) { setChatMessages([]); localStorage.removeItem(chatStorageKey); } }}>Xóa lịch sử</button>
            </div>
          </form>
          {chatNotice && <p class="workspace-notice" role="status">{chatNotice}</p>}
        </section>}
        {section === 'progress' && <section class="content-panel progress-panel">
          <div><strong>{(Number.isFinite(xp) ? xp : 0) + localProgress.xp}</strong><span>EXP tích lũy</span></div>
          <div><strong>{Number.isFinite(streak) ? streak : 0}</strong><span>Chuỗi ngày học (bản cũ)</span></div>
          <div><strong>{completed.length + localProgress.completed.length}</strong><span>Bài/mục hoàn thành</span></div>
          <div class="progress-history"><h3>Lịch sử làm bài</h3>{localProgress.attempts.length ? localProgress.attempts.map((attempt, index) => <article key={`${attempt.at}-${index}`}><b>{attempt.title}</b><span>{attempt.score}/{attempt.total} câu đúng · {new Date(attempt.at).toLocaleString('vi-VN')}</span></article>) : <p class="empty-state">Chưa có lần làm đề nào được lưu trong V2.</p>}</div>
          <p class="empty-state">Tiến độ V2 được lưu theo tài khoản trên thiết bị; quản trị viên có thể sao lưu và khôi phục tiến độ qua cloud.</p>
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
