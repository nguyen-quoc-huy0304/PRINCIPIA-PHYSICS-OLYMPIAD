import type { LearningNode } from './types';

export function parseArray<T>(raw?: string, fallback: T[] = []): T[] {
  if (!raw) return fallback;
  try {
    const value: unknown = JSON.parse(raw);
    return Array.isArray(value) ? value as T[] : fallback;
  } catch {
    return fallback;
  }
}

export function countNodes(nodes: LearningNode[], type: string): number {
  return nodes.reduce((sum, node) => sum + (node.type === type ? 1 : 0) + countNodes(node.children || [], type), 0);
}

export function hasNode(nodes: LearningNode[], id?: string): boolean {
  return !!id && nodes.some(node => node.id === id || hasNode(node.children || [], id));
}

export function countQuestions(nodes: LearningNode[]): number {
  return nodes.reduce((sum, node) => sum + (node.questions?.length || node.quiz?.length || 0) + countQuestions(node.children || []), 0);
}
