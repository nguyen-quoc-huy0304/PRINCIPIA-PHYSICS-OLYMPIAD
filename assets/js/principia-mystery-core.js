/* PRINCIPIA Science Mystery — state machine over real lesson questions. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 if(root)root.PrincipiaMysteryCore=api;
})(typeof window!=='undefined'?window:globalThis,function(){
 'use strict';
 function createCase(questionPool,random=Math.random){
  if(!Array.isArray(questionPool)||!questionPool.length)throw new Error('Chưa có câu hỏi để tạo vụ án.');
  const valid=questionPool.filter(q=>q&&typeof q.q==='string'&&Array.isArray(q.a)&&q.a.length>=2&&Number.isInteger(q.correct)&&q.correct>=0&&q.correct<q.a.length);
  if(!valid.length)throw new Error('Ngân hàng chưa có câu hỏi hợp lệ.');
  const shuffled=valid.slice();
  for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
  const questions=shuffled.slice(0,Math.min(3,shuffled.length)).map(q=>({q:q.q,a:q.a.slice(),correct:q.correct,topic:q.topic||'Khoa học',path:q.path||''}));
  return {questions,index:0,score:0,answers:[],complete:false};
 }
 function answer(caseState,choice){
  if(!caseState||caseState.complete)throw new Error('Vụ án đã kết thúc.');
  const q=caseState.questions[caseState.index];
  if(!q||!Number.isInteger(choice)||choice<0||choice>=q.a.length)throw new Error('Lựa chọn không hợp lệ.');
  const correct=choice===q.correct;
  caseState.answers.push({choice,correct});
  if(correct)caseState.score++;
  caseState.index++;
  caseState.complete=caseState.index>=caseState.questions.length;
  return {correct,expected:q.correct,complete:caseState.complete,index:caseState.index,score:caseState.score,total:caseState.questions.length};
 }
 return {createCase,answer};
});
