'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const suite=fs.readFileSync('assets/js/principia-learning-suite.js','utf8');
const core=fs.readFileSync('assets/js/principia-mystery-core.js','utf8');

test('Science Mystery correctness and score are derived from Rust quiz grading',()=>{
 assert.match(suite,/async function answerMystery\(choice\)/);
 assert.match(suite,/grader\.gradeExam\(attempt\.questions,Object\.fromEntries\(nextAnswers\)/);
 assert.match(suite,/attempt\.score=grade\.correctCount/);
 assert.match(suite,/attempt\.answers\[attempt\.answers\.length-1\]\.correct=currentCorrect/);
 assert.doesNotMatch(core,/if\(correct\)caseState\.score\+\+/);
 assert.doesNotMatch(core,/choice===q\.correct/);
});

test('Science Mystery refuses to record a choice when Rust grading fails',()=>{
 assert.match(suite,/Rust Science Mystery grading failed/);
 assert.match(suite,/Câu trả lời chưa được ghi nhận; hãy thử lại/);
 assert.match(suite,/attempt\.submitting=true/);
 assert.match(suite,/attempt\.submitting=false/);
});
