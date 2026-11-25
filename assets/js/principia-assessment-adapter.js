/* PRINCIPIA assessment adapter: Rust/WASM grading with a validated offline fallback. */
(function(root){
 'use strict';
 const MAX_PROMPT=4000,MAX_OPTION=1000;
 function normalize(question,selectedOption){
  if(!question||typeof question!=='object')throw new TypeError('Question is required');
  const prompt=String(question.q??question.prompt??'').trim();
  const options=question.a??question.options;
  const correctIndex=Number(question.correctIndex??question.correct);
  const choice=Number(selectedOption);
  if(!prompt||prompt.length>MAX_PROMPT)throw new RangeError('Question prompt must contain 1 to 4000 characters');
  if(!Array.isArray(options)||options.length<2||options.length>12)throw new RangeError('Question must contain 2 to 12 options');
  const normalizedOptions=options.map((option,index)=>{
   const value=String(option??'').trim();
   if(!value||value.length>MAX_OPTION)throw new RangeError('Invalid answer option at index '+index);
   return value;
  });
  if(!Number.isInteger(correctIndex)||correctIndex<0||correctIndex>=normalizedOptions.length)throw new RangeError('Correct answer index is invalid');
  if(!Number.isInteger(choice)||choice<0||choice>=normalizedOptions.length)throw new RangeError('Selected answer index is invalid');
  return {prompt,options:normalizedOptions,correctIndex,choice};
 }
 async function gradeQuestion(question,selectedOption,metadata={}){
  const q=normalize(question,selectedOption);
  const payload={
   id:String(metadata.id||'principia-quiz').slice(0,120),
   title:String(metadata.title||'PRINCIPIA quiz').slice(0,240),
   passPercent:60,
   questions:[{prompt:q.prompt,options:q.options,correctIndex:q.correctIndex,points:1}],
   answers:[{questionIndex:0,selectedOption:q.choice}]
  };
  const wasm=root.PrincipiaWasmPhysics;
  if(wasm&&typeof wasm.gradeQuiz==='function'){
   try{
    const grade=await wasm.gradeQuiz(payload);
    const detail=grade&&Array.isArray(grade.details)?grade.details[0]:null;
    if(!detail||typeof detail.isCorrect!=='boolean')throw new Error('Rust returned an invalid assessment result');
    return {correct:detail.isCorrect,backend:'rust-wasm',grade};
   }catch(error){
    return {correct:q.choice===q.correctIndex,backend:'javascript-fallback',reason:String(error&&error.message||error)};
   }
  }
  return {correct:q.choice===q.correctIndex,backend:'javascript-fallback',reason:'Rust/WASM assessment is unavailable'};
 }
 root.PrincipiaAssessmentAdapter=Object.freeze({gradeQuestion,normalize});
})(typeof window!=='undefined'?window:globalThis);
