'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-study-pathways.js'), 'utf8');

function loadPathways() {
  const window = {};
  const document = { readyState: 'loading', addEventListener() {} };
  vm.runInNewContext(source, { window, document, String, Number, JSON, Date, Error });
  return window.PrincipiaStudyPathways;
}

test('study pathways parse fenced JSON into bounded actionable tasks', () => {
  const api = loadPathways();
  const raw = '```json\n{"summary":"Lộ trình kiểm tra hiểu sâu.","tasks":[{"title":"Tự nhớ định luật","topic":"Newton","minutes":10,"dayOffset":0,"note":"Viết lại định luật và điều kiện áp dụng."},{"title":"Giải bài mẫu","topic":"Newton","minutes":15,"dayOffset":0,"note":"Tự giải một bài không xem lời giải."},{"title":"Bài biến thể","topic":"Newton","minutes":15,"dayOffset":1,"note":"Giải bài thay đổi dữ kiện."}]}\n```';
  const plan = api.parsePlan(raw, 'Newton', 50);
  assert.equal(plan.tasks.length, 3);
  assert.equal(plan.tasks.reduce((sum, task) => sum + task.minutes, 0), 40);
});

test('study pathways reject malformed, incomplete and over-budget plans', () => {
  const api = loadPathways();
  assert.throws(() => api.parsePlan('not json', 'Newton', 50), /JSON hợp lệ/);
  const raw = JSON.stringify({ summary: 'Kế hoạch', tasks: [
    { title: 'Một', topic: 'Newton', minutes: 20, dayOffset: 0, note: 'Đầu ra 1' },
    { title: 'Hai', topic: 'Newton', minutes: 20, dayOffset: 0, note: 'Đầu ra 2' },
    { title: 'Ba', topic: 'Newton', minutes: 20, dayOffset: 0, note: 'Đầu ra 3' }
  ] });
  assert.throws(() => api.parsePlan(raw, 'Newton', 50), /Tổng thời lượng/);
});
