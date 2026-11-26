/* PRINCIPIA Rust quiz adapter. Converts legacy quiz records into the Rust grading contract. */
(function(root){
  'use strict';

  function cleanText(value, maxLength) {
    if (typeof value !== 'string') return '';
    return value.trim().slice(0, maxLength);
  }

  function normalizeQuestions(questions) {
    if (!Array.isArray(questions) || questions.length < 1 || questions.length > 200) {
      throw new RangeError('Quiz must contain 1 to 200 questions.');
    }
    return questions.map((question, index) => {
      const prompt = cleanText(question?.q ?? question?.prompt, 4000);
      const options = Array.isArray(question?.a) ? question.a : question?.options;
      const correctIndex = Number(question?.correctIndex ?? question?.correct);
      if (!prompt || !Array.isArray(options) || options.length < 2 || options.length > 12) {
        throw new TypeError('Invalid question at index ' + index + '.');
      }
      const normalizedOptions = options.map(option => cleanText(option, 1000));
      if (normalizedOptions.some(option => !option)) {
        throw new TypeError('Invalid answer option at question ' + index + '.');
      }
      if (!Number.isInteger(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
        throw new RangeError('Invalid correct answer at question ' + index + '.');
      }
      return {
        prompt,
        options: normalizedOptions,
        correctIndex,
        points: 1
      };
    });
  }

  async function gradeExam(questions, answers, metadata = {}) {
    const normalized = normalizeQuestions(questions);
    if (!answers || typeof answers !== 'object' || Array.isArray(answers)) {
      throw new TypeError('Quiz answers must be an indexed object.');
    }
    const normalizedAnswers = normalized.map((_, questionIndex) => {
      const selected = answers[questionIndex];
      if (selected === undefined || selected === null) {
        return { questionIndex, selectedOption: null };
      }
      if (!Number.isInteger(selected) || selected < 0 || selected >= normalized[questionIndex].options.length) {
        throw new RangeError('Invalid selected answer at question ' + questionIndex + '.');
      }
      return { questionIndex, selectedOption: selected };
    });
    const wasm = root.PrincipiaWasmPhysics;
    if (!wasm || typeof wasm.gradeQuiz !== 'function') {
      throw new Error('Rust/WASM quiz grader is unavailable.');
    }
    const result = await wasm.gradeQuiz({
      id: cleanText(metadata.id, 120) || 'principia-exam',
      title: cleanText(metadata.title, 240) || 'PRINCIPIA Olympiad exam',
      questions: normalized,
      answers: normalizedAnswers,
      passPercent: 60
    });
    if (!result || !Number.isInteger(result.correctCount) ||
        result.correctCount < 0 || result.correctCount > normalized.length ||
        !Number.isFinite(result.percent) || result.percent < 0 || result.percent > 100) {
      throw new Error('Rust/WASM quiz grader returned an invalid result.');
    }
    return Object.freeze({
      correctCount: result.correctCount,
      percent: result.percent,
      passed: result.passed === true,
      earnedPoints: result.earnedPoints,
      totalPoints: result.totalPoints,
      unansweredCount: result.unansweredCount,
      engine: 'rust-wasm'
    });
  }

  root.PrincipiaRustQuiz = Object.freeze({ gradeExam });
})(typeof window !== 'undefined' ? window : globalThis);
