'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-learning-lab.js'), 'utf8');

function createLab(aiAnswer) {
  const values = new Map();
  const window = { principiaAI: { async ask(prompt, options) {
    assert.equal(typeof prompt, 'string');
    assert.equal(typeof options.system, 'string');
    return typeof aiAnswer === 'function' ? aiAnswer(prompt, options) : aiAnswer;
  } } };
  const document = { readyState: 'complete', getElementById() { return null; }, querySelector() { return null; }, addEventListener() {}, body: {} };
  class MutationObserver { observe() {} }
  const localStorage = { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, String(value)); } };
  vm.runInNewContext(source, { window, document, localStorage, MutationObserver, Date, JSON, Math, Object, String, Array, Set, Number, RegExp, Error, console });
  return { api: window.PrincipiaLearningLab, values };
}

const sample = {
  topic: 'Động lực học', level: 'Olympic', overview: 'Từ mô tả chuyển động đến mô hình lực.',
  prerequisites: [{ name: 'Đại lượng vector', reason: 'Cần biểu diễn hướng và độ lớn.', checkQuestion: 'Vector khác vô hướng thế nào?' }],
  concepts: [
    { id: 'vector', title: 'Vector', dependsOn: [], coreIdea: 'Đại lượng có độ lớn và hướng.', misconception: 'Không phải mọi đại lượng đều là vector.', checkQuestion: 'Hãy phân biệt vector và vô hướng.' },
    { id: 'motion', title: 'Mô tả chuyển động', dependsOn: ['vector'], coreIdea: 'Vị trí thay đổi theo thời gian.', misconception: 'Quãng đường không phải độ dời.', checkQuestion: 'Khi nào độ dời bằng không?' },
    { id: 'force', title: 'Lực và gia tốc', dependsOn: ['motion'], coreIdea: 'Hợp lực liên hệ với biến thiên vận tốc.', misconception: 'Vật chuyển động không nhất thiết phải có hợp lực cùng chiều.', checkQuestion: 'Vì sao hợp lực bằng không không đồng nghĩa vật đứng yên?' },
    { id: 'newton', title: 'Các định luật Newton', dependsOn: ['force'], coreIdea: 'Liên hệ lực, khối lượng và gia tốc.', misconception: 'Lực và phản lực tác dụng lên hai vật khác nhau.', checkQuestion: 'Nêu ý nghĩa vật lý của định luật II Newton.' }
  ]
};

test('Learning Lab parses plain and fenced JSON safely', () => {
  const lab = createLab('{}').api;
  assert.deepEqual(JSON.parse(JSON.stringify(lab.parseStructured(JSON.stringify(sample)))), sample);
  assert.equal(lab.parseStructured('\x60\x60\x60json\n{"ok":true}\n\x60\x60\x60').ok, true);
  assert.throws(() => lab.parseStructured('không có JSON'), /JSON hợp lệ/);
});

test('concept map validates minimum concepts and removes invalid dependencies', () => {
  const lab = createLab('{}').api;
  const normalized = lab.normalizeMap(sample, 'Vật lý');
  assert.equal(normalized.concepts.length, 4);
  assert.deepEqual(Array.from(normalized.concepts[1].dependsOn), ['vector']);
  assert.throws(() => lab.normalizeMap({ ...sample, concepts: sample.concepts.slice(0, 3) }, 'Vật lý'), /ít nhất 4/);
});

test('concept identifiers are unique and dependency links only target known nodes', () => {
  const lab = createLab('{}').api;
  const duplicate = { ...sample, concepts: sample.concepts.map((item, index) => ({
    ...item, id: index < 2 ? 'same' : item.id,
    dependsOn: index === 2 ? ['same', 'missing', 'same'] : item.dependsOn
  })) };
  const normalized = lab.normalizeMap(duplicate, 'Vật lý');
  const ids = normalized.concepts.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(normalized.concepts[2].dependsOn.every(id => ids.includes(id)));
});

test('tutor reply clamps understanding and requires a next question', () => {
  const lab = createLab('{}').api;
  const reply = lab.validateTutorReply('{"feedback":"Đúng hướng","understanding":140,"question":"Vì sao?","hint":"Xét hợp lực."}');
  assert.equal(reply.understanding, 100);
  assert.equal(reply.question, 'Vì sao?');
  assert.throws(() => lab.validateTutorReply('{"feedback":"Tốt"}'), /câu hỏi tiếp theo/);
});

test('Gemini generates a validated concept map', async () => {
  const lab = createLab(JSON.stringify(sample)).api;
  const map = await lab.generateMap('Động lực học', 'Olympic', 'Hiểu bản chất');
  assert.equal(map.topic, 'Động lực học');
  assert.equal(map.concepts.length, 4);
});

test('Learning Lab loads after Gemini and exposes its own entry point', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
  assert.ok(html.indexOf('principia-google-ai.js') < html.indexOf('principia-learning-lab.js'));
  assert.match(source, /principiaLearningLabEntry/);
  assert.match(source, /Bản đồ kiến thức/);
  assert.match(source, /Vấn đáp AI/);
  assert.match(source, /webkitSpeechRecognition/);
  assert.match(source, /speechSynthesis/);
});
