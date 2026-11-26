/* PRINCIPIA — lightweight spaced-repetition scheduler (SM-2 inspired). */
(function () {
  'use strict';
  const KEY = 'principia_spaced_repetition_v1';
  const MAX_CARDS = 2000;
  const DAY = 86400000;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  function schedule(card, grade, now = Date.now()) {
    if (!card || typeof card !== 'object') throw new TypeError('Card must be an object');
    if (!Number.isInteger(grade) || grade < 0 || grade > 5) throw new RangeError('Grade must be an integer from 0 to 5');
    const repetitions = Math.max(0, Number(card.repetitions) || 0);
    const ease = clamp(Number(card.ease) || 2.5, 1.3, 3.0);
    const previous = Math.max(0, Number(card.intervalDays) || 0);
    let nextEase = clamp(ease + (0.1 - (5 - grade) * (0.08 + (5 - grade) * 0.02)), 1.3, 3.0);
    let nextReps = repetitions;
    let intervalDays;
    if (grade < 3) { nextReps = 0; intervalDays = 1; }
    else if (repetitions === 0) { nextReps = 1; intervalDays = 1; }
    else if (repetitions === 1) { nextReps = 2; intervalDays = 6; }
    else { nextReps = repetitions + 1; intervalDays = Math.max(1, Math.round(previous * nextEase)); }
    return { ...card, repetitions: nextReps, ease: nextEase, intervalDays, dueAt: now + intervalDays * DAY, lastReviewedAt: now, lastGrade: grade };
  }
  async function scheduleNative(card, grade, now = Date.now()) {
    if (!validCard(card)) throw new TypeError('Card requires string id, front, and back');
    if (!Number.isInteger(grade) || grade < 0 || grade > 5) throw new RangeError('Grade must be an integer from 0 to 5');
    if (!Number.isFinite(now) || now < 0) throw new RangeError('Review timestamp must be a non-negative finite number');
    const native = typeof window !== 'undefined' ? window.PrincipiaWasmPhysics : null;
    if (!native || typeof native.scheduleReview !== 'function') {
      throw new Error('Rust/WASM learning engine is not loaded');
    }
    const result = await native.scheduleReview(
      grade,
      Math.max(0, Math.floor(Number(card.intervalDays) || 0)),
      clamp(Number(card.ease) || 2.5, 1.3, 3.0)
    );
    if (!result || !Number.isInteger(result.dueAfterDays) || result.dueAfterDays < 1 ||
        !Number.isFinite(result.easeFactor) || typeof result.mastered !== 'boolean') {
      throw new Error('Rust/WASM learning engine returned an invalid review schedule');
    }
    const repetitions = grade < 3 ? 0 : Math.max(0, Number(card.repetitions) || 0) + 1;
    return {
      ...card,
      repetitions,
      ease: clamp(result.easeFactor, 1.3, 3.0),
      intervalDays: result.intervalDays,
      dueAt: now + result.dueAfterDays * DAY,
      lastReviewedAt: now,
      lastGrade: grade,
      mastered: result.mastered
    };
  }
  function validCard(card) {
    return card && typeof card.id === 'string' && card.id.length > 0 && typeof card.front === 'string' && typeof card.back === 'string';
  }
  function createStore(storage) {
    const store = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
    function read() {
      try { const raw = JSON.parse(store?.getItem(KEY) || '[]'); return Array.isArray(raw) ? raw.filter(validCard).slice(0, MAX_CARDS) : []; }
      catch (_) { return []; }
    }
    function write(cards) {
      if (!store) return false;
      try { store.setItem(KEY, JSON.stringify(cards.slice(0, MAX_CARDS))); return true; }
      catch (_) { return false; }
    }
    function all() { return read(); }
    function due(now = Date.now()) { return read().filter(card => Number(card.dueAt) <= now).sort((a,b) => a.dueAt-b.dueAt); }
    function add(card) {
      if (!validCard(card)) throw new TypeError('Card requires string id, front, and back');
      const cards = read(); if (cards.some(item => item.id === card.id)) return false;
      cards.unshift({ id: card.id, front: card.front.slice(0,4000), back: card.back.slice(0,4000), topic: String(card.topic || '').slice(0,200), repetitions: 0, ease: 2.5, intervalDays: 0, dueAt: Number.isFinite(Number(card.dueAt)) ? Number(card.dueAt) : Date.now(), createdAt: Date.now() });
      return write(cards);
    }
    function review(id, grade, now = Date.now()) {
      const cards = read(), index = cards.findIndex(card => card.id === id);
      if (index < 0) return null;
      cards[index] = schedule(cards[index], grade, now);
      return write(cards) ? cards[index] : null;
    }
    async function reviewNative(id, grade, now = Date.now()) {
      const cards = read(), index = cards.findIndex(card => card.id === id);
      if (index < 0) return null;
      const updated = await scheduleNative(cards[index], grade, now);
      cards[index] = updated;
      return write(cards) ? updated : null;
    }
    function remove(id) { const cards=read(), filtered=cards.filter(card=>card.id!==id); return filtered.length!==cards.length && write(filtered); }
    return Object.freeze({ all, due, add, review, reviewNative, remove });
  }
  const api = Object.freeze({ schedule, scheduleNative, createStore, DAY });
  if (typeof window !== 'undefined') window.PrincipiaSpacedRepetition = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();