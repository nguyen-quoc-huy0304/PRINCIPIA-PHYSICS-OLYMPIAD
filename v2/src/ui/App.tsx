import { useState } from 'preact/hooks';

type Section = 'home' | 'learn' | 'quiz' | 'progress';

const sections: { id: Section; label: string; icon: string }[] = [
  { id: 'home', label: 'Trang chủ', icon: '⌂' },
  { id: 'learn', label: 'Học tập', icon: '▤' },
  { id: 'quiz', label: 'Quiz', icon: '◎' },
  { id: 'progress', label: 'Tiến độ', icon: '↗' }
];

export function App() {
  const [section, setSection] = useState<Section>('home');
  return (
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-mark" aria-label="PRINCIPIA">P</div>
        <div class="brand-copy"><strong>PRINCIPIA</strong><span>PHYSICS OLYMPIAD · PRO</span></div>
        <span class="build-label">V2 FOUNDATION</span>
      </header>
      <main class="main-content">
        <p class="eyebrow">A FASTER LEARNING ENVIRONMENT</p>
        <h1>{sections.find(item => item.id === section)?.label}</h1>
        <p class="intro">Nền tảng PRINCIPIA thế hệ mới đang được xây dựng theo từng mô-đun. Dữ liệu và chức năng bản cũ chưa được chuyển sang ở giai đoạn này.</p>
        <section class="migration-card">
          <span class="status-dot" />
          <div><strong>Kiến trúc V2 đã khởi tạo</strong><p>Preact · TypeScript · Vite · sẵn sàng tích hợp Tauri/Rust và lõi vật lý WebAssembly.</p></div>
        </section>
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