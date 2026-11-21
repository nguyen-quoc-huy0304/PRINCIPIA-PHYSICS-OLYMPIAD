import { useEffect, useMemo, useState } from 'preact/hooks';
import type { AuthResult } from '../core/auth';
import {
  completeGoogleRedirect,
  createEmailAccount,
  observeAuth,
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
  signOut
} from '../core/auth';
import { collectLegacyData, downloadLegacyBackup, restoreLegacyBackup } from '../core/legacy-migration';

type Section = 'home' | 'learn' | 'quiz' | 'progress';
type Mode = 'login' | 'signup';

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'home', label: 'Tổng quan', icon: '⌂' },
  { id: 'learn', label: 'Học tập', icon: '▤' },
  { id: 'quiz', label: 'Luyện đề', icon: '◎' },
  { id: 'progress', label: 'Tiến độ', icon: '↗' }
];

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
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  const legacy = useMemo(() => {
    try { return collectLegacyData(); } catch { return { entries: {}, format: 'principia-legacy-backup' as const, version: 1 as const, createdAt: '' }; }
  }, [backupVersion]);

  async function runAuth(action: () => Promise<AuthResult>) {
    setBusy(true);
    setStatus('');
    try {
      const result = await action();
      setAccount(result);
      setWelcome(true);
      setPassword('');
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
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setBusy(true);
    setStatus('Đang mở Google để xác thực…');
    try { await signInWithGoogle(); }
    catch (error: any) { setStatus(error?.message || 'Không thể mở đăng nhập Google.'); setBusy(false); }
  }

  async function handleReset() {
    if (!email.trim()) {
      setStatus('Nhập email trước, sau đó chọn Quên mật khẩu.');
      return;
    }
    setBusy(true);
    try {
      await sendPasswordReset(email);
      setStatus('Đã gửi liên kết đặt lại mật khẩu. Hãy kiểm tra cả thư mục Spam.');
    } catch (error: any) {
      setStatus(error?.message || 'Không gửi được email đặt lại mật khẩu.');
    } finally { setBusy(false); }
  }

  async function handleRestore(event: Event) {
    const input = event.currentTarget as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    try {
      const count = restoreLegacyBackup(await file.text());
      setBackupVersion(value => value + 1);
      setStatus(`Đã khôi phục ${count} mục dữ liệu. Hãy tải lại ứng dụng để nạp lại nội dung cũ.`);
    } catch (error: any) {
      setStatus(error?.message || 'Không thể đọc tệp sao lưu.');
    } finally { input.value = ''; }
  }

  if (!account) {
    return (
      <div class="auth-screen">
        <div class="auth-glow" />
        <section class="auth-card">
          <img class="principia-logo" src="/principia-logo-round.png" alt="PRINCIPIA" />
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
            {#if mode === 'signup'}
              <label> Tên hiển thị
                <input value={displayName} onInput={event => setDisplayName(event.currentTarget.value)} placeholder="Tên của bạn" autocomplete="name" />
              </label>
            {/if}
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
        <p class="intro">Xin chào {account.user.displayName || 'bạn'}. PRINCIPIA V2 đang chuyển các mô-đun học tập sang kiến trúc mới.</p>
        <section class="stats-grid">
          <article><strong>{legacy.entries['halo_data'] ? 'Đã tìm thấy' : 'Chưa phát hiện'}</strong><span>Dữ liệu bài học cũ</span></article>
          <article><strong>{legacy.entries['halo_quiz'] ? 'Đã tìm thấy' : 'Chưa phát hiện'}</strong><span>Ngân hàng câu hỏi cũ</span></article>
          <article><strong>{legacy.entries['halo_completed'] ? 'Đã tìm thấy' : 'Chưa phát hiện'}</strong><span>Tiến độ học tập cũ</span></article>
        </section>
        <section class="migration-card">
          <span class="status-dot" />
          <div><strong>Đang bảo toàn dữ liệu bản cũ</strong><p>Đã phát hiện {Object.keys(legacy.entries).length} mục dữ liệu trên thiết bị này. Hãy sao lưu trước khi chuyển thiết bị hoặc đổi phiên bản.</p></div>
        </section>
        <section class="backup-panel">
          <div><strong>Sao lưu & khôi phục</strong><p>Xuất dữ liệu PRINCIPIA đang lưu trên thiết bị thành tệp JSON.</p></div>
          <div class="backup-actions">
            <button class="secondary-button" onClick={downloadLegacyBackup}>Tải bản sao lưu</button>
            <label class="secondary-button file-button">Khôi phục tệp<input type="file" accept="application/json,.json" onChange={handleRestore} /></label>
          </div>
        </section>
        <div class="account-footer">
          <span>{account.user.email}</span>
          <button class="quiet-button" onClick={() => void signOut()}>Đăng xuất</button>
        </div>
        {status && <p class="auth-status" role="status">{status}</p>}
      </main>
      <nav class="bottom-nav" aria-label="Điều hướng chính">
        {sections.map(item => (
          <button type="button" class={section === item.id ? 'active' : ''} onClick={() => setSection(item.id)}>
            <span>{item.icon}</span><small>{item.label}</small>
          </button>
        ))}
      </nav>
    </div>
  );
}
