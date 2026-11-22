import type { Section } from '../../app/types';

type LessonTool = 'note' | 'files' | 'submit' | 'simulation' | 'media';
type Props = { section: Section; activeLesson: boolean; lessonTool: LessonTool; onLessonToolChange: (tool: LessonTool) => void; onSectionChange: (section: Section) => void; onClearLesson: () => void };

const items: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'home', label: 'Tổng quan', icon: '⌂' }, { id: 'learn', label: 'Học tập', icon: '▤' },
  { id: 'quiz', label: 'Luyện đề', icon: '◎' }, { id: 'suite', label: 'Trung tâm học tập', icon: '✦' },
  { id: 'physics', label: 'Phòng thí nghiệm', icon: '⚛' }, { id: 'library', label: 'Thư viện tài liệu', icon: '▧' },
  { id: 'music', label: 'Music & Focus', icon: '♫' }, { id: 'browser', label: 'Mini Browser', icon: '⌕' },
  { id: 'games', label: 'Giải trí', icon: '🎮' }, { id: 'chat', label: 'AI Assistant', icon: '✧' },
  { id: 'downloads', label: 'Trung tâm tải xuống', icon: '⇩' }, { id: 'progress', label: 'Thành tích', icon: '↗' },
  { id: 'profile', label: 'Hồ sơ & cài đặt', icon: '◉' },
];
const lessonTools: Array<{ id: LessonTool; label: string; icon: string }> = [
  { id: 'media', label: 'Video · OCR', icon: '▣' }, { id: 'note', label: 'Ghi chép', icon: '✎' },
  { id: 'files', label: 'Tài liệu', icon: '▧' }, { id: 'submit', label: 'Nộp bài', icon: '⇧' },
  { id: 'simulation', label: 'Mô phỏng', icon: '◉' },
];
export function BottomNavigation({ section, activeLesson, lessonTool, onLessonToolChange, onSectionChange, onClearLesson }: Props) {
  return <nav class={activeLesson ? 'bottom-nav lesson-nav' : 'bottom-nav'} aria-label="Điều hướng PRINCIPIA">
    <div class="nav-brand"><img src="/assets/images/principia-logo-round.svg" alt="" /><span><b>PRINCIPIA</b><small>PHYSICS OLYMPIAD · PRO</small></span></div>
    {activeLesson && <div class="nav-tool-group"><p class="nav-group-label">KHÔNG GIAN BÀI HỌC</p>
      {lessonTools.map(item => <button type="button" key={item.id} class={lessonTool === item.id ? 'active' : ''} onClick={() => onLessonToolChange(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
      <button type="button" class="nav-back-button" onClick={onClearLesson}><span>←</span><small>Quay lại danh sách</small></button>
    </div>}
    <div class="nav-main-group"><p class="nav-group-label">KHÔNG GIAN HỌC TẬP</p>
      {items.map(item => <button type="button" key={item.id} class={section === item.id ? 'active' : ''} onClick={() => onSectionChange(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
    </div>
    <div class="nav-footer"><span class="nav-status-dot" /><span>Learning workspace</span></div>
  </nav>;
}
