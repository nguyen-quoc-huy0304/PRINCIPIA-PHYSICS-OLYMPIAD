'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-learning-science.js'), 'utf8');

function createEngine() {
  const values = new Map();
  const window = {};
  const localStorage = {
    getItem(key) { return values.get(key) || null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  vm.runInNewContext(source, { window, localStorage, Object, Math, Number, String, Set });
  return window.PrincipiaLearningScience;
}

test('learning science engine exposes the complete strategy registry', () => {
  const engine = createEngine();
  const methods = engine.methods();
  assert.equal(methods.length, 51);
  assert.ok(engine.stats().groups >= 15);
  for (const id of ['retrieval', 'spacing', 'interleaving', 'elaborative-interrogation',
    'self-explanation', 'worked-examples', 'dual-coding', 'chunking',
    'analogical-learning', 'sleep-recovery', 'self-determination', 'goal-gradient',
    'implementation-intentions', 'pomodoro-flexible', 'deep-work',
    'chinese-error-notebook', 'chinese-dictation', 'polya-problem-solving']) {
    assert.ok(methods.some(method => method.id === id), 'missing strategy: ' + id);
  }
});

test('recommendations adapt to memory, olympiad, and recovery goals', () => {
  const engine = createEngine();
  const memory = engine.select({ goal: 'remember', topic: 'công thức', energy: 2 });
  const olympiad = engine.select({ goal: 'olympiad', topic: 'chứng minh', energy: 3, percent: 92 });
  const recovery = engine.select({ goal: 'recover', topic: 'động lực học', energy: 1, errorCount: 5, fatigue: true });
  assert.ok(memory.some(item => item.id === 'retrieval' || item.id === 'spacing' || item.id === 'cumulative-retrieval'));
  assert.ok(olympiad.some(item => ['polya-problem-solving', 'transfer-practice', 'multiple-solutions'].includes(item.id)));
  assert.ok(recovery.some(item => ['error-analysis', 'sleep-recovery', 'chinese-error-notebook'].includes(item.id)));
});

test('learner-facing directive hides method identifiers and avoids overload', () => {
  const engine = createEngine();
  const directive = engine.directive({ goal: 'teach', topic: 'định luật Newton', energy: 2 });
  assert.match(directive, /không hiển thị tên kỹ thuật/);
  assert.match(directive, /Chỉ phối hợp các cách/);
  assert.doesNotMatch(directive, /feynman-teachback|retrieval|spacing|deep-work/);
});

test('focus plan adapts to energy and duration', () => {
  const engine = createEngine();
  const gentle = engine.focusPlan({ energy: 1, minutes: 25 });
  const deep = engine.focusPlan({ energy: 3, minutes: 75 });
  assert.equal(gentle.focusMinutes, 15);
  assert.equal(gentle.breakMinutes, 5);
  assert.equal(gentle.cycles, 2);
  assert.equal(deep.focusMinutes, 50);
  assert.equal(deep.breakMinutes, 10);
  assert.equal(deep.cycles, 2);
});
