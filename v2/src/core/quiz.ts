export type QuizQuestion = {
  q: string;
  a: string[];
  correct: number;
  type?: 'true_false' | 'single_select' | 'multi_select' | 'short_answer' | 'long_answer';
  correctValues?: string[];
  expected?: string;
  rubric?: string;
  points?: number;
  explanation?: string;
};

const QUESTION_TYPES = new Set(['true_false', 'single_select', 'multi_select', 'short_answer', 'long_answer']);

function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').trim().toLocaleLowerCase().replace(/\s+/g, ' ');
}

export function getCorrectOptionIndexes(question: QuizQuestion): number[] {
  const values = question.correctValues?.length ? question.correctValues : [String(question.correct)];
  const indexes = values.map(value => {
    const raw = String(value).trim();
    if (/^\d+$/.test(raw)) {
      const index = Number(raw);
      if (index >= 0 && index < question.a.length) return index;
    }
    return question.a.findIndex(option => normalizeText(option) === normalizeText(raw));
  }).filter(index => index >= 0);
  return [...new Set(indexes)].sort((a, b) => a - b);
}

export function isQuestionCorrect(question: QuizQuestion, answer: number | number[] | string | undefined): boolean {
  const type = question.type || 'single_select';
  if (type === 'long_answer') return false; // Requires teacher review.
  if (type === 'short_answer') {
    const accepted = (question.expected || '').split(/\r?\n|\|/).map(normalizeText).filter(Boolean);
    return typeof answer === 'string' && accepted.length > 0 && accepted.includes(normalizeText(answer));
  }
  const correct = getCorrectOptionIndexes(question);
  if (type === 'multi_select') {
    if (!Array.isArray(answer)) return false;
    const selected = [...new Set(answer.filter(value => Number.isInteger(value) && value >= 0 && value < question.a.length))].sort((a, b) => a - b);
    return selected.length === correct.length && selected.every((value, index) => value === correct[index]);
  }
  return typeof answer === 'number' && correct.length === 1 && answer === correct[0];
}

export function validateQuizQuestions(value: unknown): QuizQuestion[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('Đề thi cần có ít nhất một câu hỏi.');
  return value.map((item, index) => {
    const prefix = 'Câu ' + (index + 1) + ': ';
    if (!item || typeof item !== 'object' || typeof item.q !== 'string' || !item.q.trim()) {
      throw new Error(prefix + 'thiếu nội dung câu hỏi.');
    }
    const type = item.type || 'single_select';
    if (!QUESTION_TYPES.has(type)) throw new Error(prefix + 'có dạng câu hỏi không được hỗ trợ.');
    const question = { ...item, type } as QuizQuestion;
    if (question.correctValues !== undefined && (!Array.isArray(question.correctValues) || question.correctValues.some(value => typeof value !== 'string' && typeof value !== 'number'))) {
      throw new Error(prefix + 'có danh sách correctValues không hợp lệ.');
    }
    if (type === 'short_answer') {
      if (typeof question.expected !== 'string' || !question.expected.trim()) throw new Error(prefix + 'cần có đáp án trong trường expected.');
    } else if (type === 'long_answer') {
      if (question.rubric !== undefined && typeof question.rubric !== 'string') throw new Error(prefix + 'có rubric không hợp lệ.');
    } else {
      if (!Array.isArray(question.a) || question.a.length < 2 || question.a.some(option => typeof option !== 'string')) {
        throw new Error(prefix + 'cần ít nhất hai lựa chọn dạng văn bản.');
      }
      const correct = getCorrectOptionIndexes(question);
      if (!correct.length || (type !== 'multi_select' && correct.length !== 1)) {
        throw new Error(prefix + 'cần khai báo đáp án đúng hợp lệ.');
      }
    }
    if (question.points !== undefined && (!Number.isFinite(question.points) || question.points < 0)) {
      throw new Error(prefix + 'có số điểm không hợp lệ.');
    }
    return question;
  });
}
