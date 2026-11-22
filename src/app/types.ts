import type { QuizQuestion } from '../core/quiz';

export type Section = 'home' | 'learn' | 'quiz' | 'suite' | 'physics' | 'library' | 'music' | 'browser' | 'games' | 'chat' | 'downloads' | 'progress' | 'profile';
export type AuthMode = 'login' | 'signup';
export type QuizEditorState = { id?: string; name: string; questionsText: string };
export type CustomAIProvider = { id: string; name: string; url: string };
export type LearningNode = {
  id: string;
  name: string;
  icon?: string;
  type?: string;
  content?: string;
  note?: string;
  video?: string;
  children?: LearningNode[];
  questions?: QuizQuestion[];
  quiz?: QuizQuestion[];
  transcript?: string;
  translatedTranscript?: string;
  videoOcr?: string;
  summary?: string;
  dubLang?: string;
};
export type { QuizQuestion };
