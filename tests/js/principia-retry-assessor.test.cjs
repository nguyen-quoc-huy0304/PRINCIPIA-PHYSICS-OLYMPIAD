'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-retry-assessor.js'), 'utf8');

function loadAssessor() {
  const window = {};
  vm.runInNewContext(source, { window, String, Number, JSON, Error });
  return window.PrincipiaRetryAssessor;
}

test('retry assessor accepts only a validated JSON assessment', () => {
  const assessor = loadAssessor();
  const result = assessor.parseAssessment('{"correct":true,"score":92,"feedback":"Lập luận và kết quả đúng.","nextStep":"Thử bài biến thể."}');
  assert.equal(result.passed, true);
  assert.equal(result.score, 92);
  assert.equal(result.nextStep, 'Thử bài biến thể.');
});

test('retry assessor rejects malformed or incomplete model output', () => {
  const assessor = loadAssessor();
  assert.throws(() => assessor.parseAssessment('not json'), /không đúng định dạng/);
  assert.throws(() => assessor.parseAssessment('{"correct":"yes","score":110,"feedback":""}'), /thiếu tiêu chí/);
});

test('retry assessor requires an explicit attempt and never calls Gemini for invalid input', async () => {
  const assessor = loadAssessor();
  await assert.rejects(assessor.assess({ question: 'Đề bài đủ dài', correctText: 'Đáp án', answer: 'ngắn' }), /tối thiểu 30 ký tự/);
});

test('retry assessor sends only the question, reference answer and independent attempt', async () => {
  const window = { principiaAI: { ask: async prompt => {
    assert.match(prompt, /ĐỀ BÀI/);
    assert.match(prompt, /ĐÁP ÁN THAM CHIẾU/);
    assert.match(prompt, /LỜI GIẢI ĐỘC LẬP/);
    assert.doesNotMatch(prompt, /email|uid|họ tên|địa chỉ/i);
    return '{"correct":false,"score":45,"feedback":"Thiếu điều kiện áp dụng định luật.","nextStep":"Xác định hệ trước."}';
  } } };
  vm.runInNewContext(source, { window, String, Number, JSON, Error });
  const result = await window.PrincipiaRetryAssessor.assess({
    question: 'Một vật chuyển động trên mặt phẳng ngang, hãy tìm gia tốc.',
    correctText: 'Áp dụng định luật II Newton theo phương ngang.',
    answer: 'Tôi chọn hệ vật và viết tổng lực theo phương ngang bằng khối lượng nhân gia tốc.'
  });
  assert.equal(result.passed, false);
  assert.equal(result.score, 45);
});
