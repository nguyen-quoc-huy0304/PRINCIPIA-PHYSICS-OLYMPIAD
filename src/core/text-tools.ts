const STOP_WORDS = new Set((
  'va la cua cho trong mot nhung cac nhung voi duoc khi thi ma neu thi se da dang tu ve den tren duoi tai theo nhu nhu cung hay rat can co khong mot noi nay do ay hon it nhieu bang vi de vao ra sau truoc giua moi cac'
).split(' '));

function normalizeToken(value: string): string {
  return value.normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();
}

/** Extractive summary: ranks sentences by informative word frequency and keeps original order. */
export function summarizeText(source: string, maxSentences = 5): string {
  const sentences = source
    .replace(/\\s+/g, ' ')
    .split(/(?<=[.!?。！？])\\s+/)
    .map(value => value.trim())
    .filter(Boolean);
  if (sentences.length <= maxSentences) return sentences.join(' ');
  const tokens = sentences.map(sentence =>
    normalizeToken(sentence).match(/[a-z0-9]+/g)?.filter(token => token.length > 2 && !STOP_WORDS.has(token)) || []
  );
  const frequencies = new Map<string, number>();
  tokens.flat().forEach(token => frequencies.set(token, (frequencies.get(token) || 0) + 1));
  const ranked = sentences.map((sentence, index) => {
    const words = tokens[index];
    const unique = [...new Set(words)];
    const frequencyScore = unique.reduce((sum, token) => sum + Math.log1p(frequencies.get(token) || 0), 0) / Math.sqrt(Math.max(1, words.length));
    const positionBonus = index === 0 ? 0.18 : index === sentences.length - 1 ? 0.08 : 0;
    return { index, score: frequencyScore + positionBonus };
  });
  const count = Math.min(maxSentences, Math.max(2, Math.ceil(sentences.length * 0.3)));
  const selected = new Set(ranked.sort((a, b) => b.score - a.score).slice(0, count).map(item => item.index));
  return sentences.filter((_, index) => selected.has(index)).join(' ');
}
