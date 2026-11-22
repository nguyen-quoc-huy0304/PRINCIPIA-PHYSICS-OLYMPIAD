import type { Section } from '../../app/types';

type LessonTool = 'note' | 'files' | 'submit' | 'simulation' | 'media';

type Props = {
  section: Section;
  activeLesson: boolean;
  lessonTool: LessonTool;
  onLessonToolChange: (tool: LessonTool) => void;
  onSectionChange: (section: Section) => void;
  onClearLesson: () => void;
};

const items: Array<{ id: Section; label: string; icon: string }> = [
  { id: 'home', label: 'Tổng quan', icon: '⌂' },
  { id: 'learn', label: 'Học tập', icon: '▤' },
  { id: 'quiz', label: 'Luyện đề', icon: '◎' },
  { id: 'suite', label: 'Trung tâm học tập', icon: '✦' },
  { id: 'physics', label: 'Máy tính', icon: '⚛' },
  { id: 'library', label: 'Tài liệu', icon: '▧' },
  { id: 'music', label: 'Music & Focus', icon: '♫' },
  { id: 'browser', label: 'Trình duyệt', icon: '⌕' },
  { id: 'games', label: 'Giải trí', icon: '🎮' },
  { id: 'chat', label: 'AI Chat', icon: '✧' },
  { id: 'progress', label: 'Tiến độ', icon: '↗' },
  { id: 'profile', label: 'Hồ sơ', icon: '◉' },
];

export function BottomNavigation({ section, activeLesson, lessonTool, onLessonToolChange, onSectionChange, onClearLesson }: Props) {
  const navigate = (next: Section) => onSectionChange(next);
  return (
    <nav class="bottom-nav" aria-label="Điều hướng chính">
      {section === 'learn' && activeLesson ? <>
        <button type="button" class={lessonTool === 'media' ? 'active' : ''} onClick={() => onLessonToolChange('media')}><span>▤</span><small>Video / OCR</small></button>
        <button type="button" class={lessonTool === 'files' ? 'active' : ''} onClick={() => onLessonToolChange('files')}><span>▧</span><small>Tài liệu</small></button>
        <button type="button" class={lessonTool === 'note' ? 'active' : ''} onClick={() => onLessonToolChange('note')}><span>✎</span><small>Ghi chép</small></button>
        {items.filter(item => !['home', 'learn'].includes(item.id)).map(item => <button type="button" key={item.id} class={section === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
        <button type="button" onClick={onClearLesson}><span>←</span><small>Danh sách</small></button>
      </> : items.filter(item => !(section === 'chat' && item.id === 'home')).map(item => <button type="button" key={item.id} class={section === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><span>{item.icon}</span><small>{item.label}</small></button>)}
    </nav>
  );
}
