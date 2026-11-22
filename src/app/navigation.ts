import type { Section } from './types';

export type NavigationItem = { id: Section; label: string; icon: string };

export const sections: NavigationItem[] = [
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
  { id: 'downloads', label: 'Trung tâm tải xuống', icon: '⇩' },
  { id: 'progress', label: 'Tiến độ', icon: '↗' },
  { id: 'profile', label: 'Hồ sơ', icon: '◉' },
];

export function isSection(value: string): value is Section {
  return sections.some(item => item.id === value);
}
