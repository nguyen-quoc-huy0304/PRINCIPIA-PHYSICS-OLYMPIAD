/* PRINCIPIA retry assessor — explicit, minimal-data AI feedback for independent retries. */
(() => {
  'use strict';

  const MAX_QUESTION = 2200;
  const MAX_ANSWER = 2200;
  let pending = false;

  function parseAssessment(raw) {
    const text = String(raw || '').trim().replace(/^\`\`\`(?:json)?\s*/i, '').replace(/\s*\`\`\`$/, '');
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end <= start) throw new Error('Gemini trả về kết quả không đúng định dạng. Hãy thử lại.');
    let value;
    try { value = JSON.parse(text.slice(start, end + 1)); }
    catch (_) { throw new Error('Không đọc được kết quả đánh giá từ Gemini. Hãy thử lại.'); }
    if (!value || typeof value !== 'object' || typeof value.correct !== 'boolean' ||
        !Number.isFinite(value.score) || value.score < 0 || value.score > 100 ||
        typeof value.feedback !== 'string' || !value.feedback.trim()) {
      throw new Error('Gemini thiếu tiêu chí đánh giá cần thiết. Hãy thử lại.');
    }
    return {
      passed: value.correct && value.score >= 80,
      score: Math.round(value.score),
      feedback: value.feedback.trim().slice(0, 1000),
      nextStep: typeof value.nextStep === 'string' ? value.nextStep.trim().slice(0, 500) : ''
    };
  }

  async function assess(input) {
    if (pending) throw new Error('Đang đánh giá một lời giải khác. Hãy chờ hoàn tất.');
    const question = String(input?.question || '').trim().slice(0, MAX_QUESTION);
    const expected = String(input?.correctText || '').trim().slice(0, MAX_ANSWER);
    const attempt = String(input?.answer || '').trim().slice(0, MAX_ANSWER);
    if (question.length < 5 || expected.length < 1 || attempt.length < 30) {
      throw new Error('Cần có đề bài, đáp án tham chiếu và lời giải độc lập tối thiểu 30 ký tự.');
    }
    if (!window.principiaAI?.ask) throw new Error('Gemini chưa sẵn sàng. Kiểm tra đăng nhập và cấu hình API.');
    const prompt = [
      'Đánh giá một lần tự giải Vật lý của học sinh. Chỉ chấm nội dung học thuật, không suy đoán danh tính.',
      'ĐỀ BÀI:\n' + question,
      'ĐÁP ÁN THAM CHIẾU (có thể có cách giải tương đương):\n' + expected,
      'LỜI GIẢI ĐỘC LẬP CỦA HỌC SINH:\n' + attempt,
      'Chấm đúng bản chất vật lý, công thức, đơn vị, lập luận và kết luận. Chấp nhận cách giải khác nếu hợp lệ. Không cho qua nếu chỉ chép đáp án mà thiếu lập luận cốt lõi.',
      'Trả về DUY NHẤT JSON hợp lệ với schema: {"correct":boolean,"score":number,"feedback":"nhận xét cụ thể","nextStep":"một bước tiếp theo"}. correct chỉ true khi lời giải về cơ bản chính xác; score từ 0 đến 100. Không thêm markdown.'
    ].join('\n\n');
    pending = true;
    try {
      const raw = await window.principiaAI.ask(prompt, {
        system: 'Bạn là giám khảo học thuật Vật lý nghiêm túc, công bằng. Chỉ đánh giá nội dung được cung cấp. Trả về JSON đúng schema, không thêm lời dẫn.'
      });
      return parseAssessment(raw);
    } finally {
      pending = false;
    }
  }

  window.PrincipiaRetryAssessor = Object.freeze({
    assess,
    parseAssessment,
    isBusy: () => pending
  });
})();
