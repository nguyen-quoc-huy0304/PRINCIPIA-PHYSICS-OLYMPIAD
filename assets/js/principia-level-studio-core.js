/* PRINCIPIA Level Studio core: safe local user-authored physics levels. */
(function(root){
 'use strict';
 const VERSION=1,MAX_LEVELS=100,MAX_QUESTIONS=50,MAX_TEXT=1200;
 const cleanText=(v,max=MAX_TEXT)=>String(v==null?'':v).trim().slice(0,max);
 function validateQuestion(q){
  if(!q||typeof q!=='object')throw new Error('Câu hỏi không hợp lệ.');
  const prompt=cleanText(q.prompt,MAX_TEXT),choices=Array.isArray(q.choices)?q.choices.map(x=>cleanText(x,300)):[];
  const answer=Number(q.answer);
  if(!prompt)throw new Error('Câu hỏi đang để trống.');
  if(choices.length<2||choices.length>6||choices.some(x=>!x))throw new Error('Mỗi câu cần từ 2 đến 6 đáp án hợp lệ.');
  if(!Number.isInteger(answer)||answer<0||answer>=choices.length)throw new Error('Đáp án đúng không hợp lệ.');
  return {prompt,choices,answer,explanation:cleanText(q.explanation,MAX_TEXT)};
 }
 function validateLevel(level){
  if(!level||typeof level!=='object')throw new Error('Màn chơi không hợp lệ.');
  const title=cleanText(level.title,100),description=cleanText(level.description,300),id=cleanText(level.id,80)||'level-'+Date.now().toString(36);
  if(!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw new Error('Mã màn chơi chỉ được chứa chữ, số, dấu gạch ngang và gạch dưới.');
  if(!title)throw new Error('Hãy đặt tên màn chơi.');
  if(!Array.isArray(level.questions)||level.questions.length<1||level.questions.length>MAX_QUESTIONS)throw new Error('Mỗi màn cần từ 1 đến 50 câu hỏi.');
  return {id,title,description,questions:level.questions.map(validateQuestion),updatedAt:cleanText(level.updatedAt,40)||new Date().toISOString()};
 }
 function validatePack(raw){
  if(!raw||raw.schema!=='principia-level-pack'||raw.version!==VERSION||!Array.isArray(raw.levels)||raw.levels.length>MAX_LEVELS)throw new Error('Tệp chia sẻ không đúng định dạng PRINCIPIA Level Studio.');
  return raw.levels.map(validateLevel);
 }
 function createStore(storage){
  const io=storage||{getItem:k=>root.localStorage.getItem(k),setItem:(k,v)=>root.localStorage.setItem(k,v)};
  const key='principia_user_levels_v1';
  function all(){try{const v=JSON.parse(io.getItem(key)||'[]');return Array.isArray(v)?v.map(validateLevel):[]}catch(_){return []}}
  function write(levels){if(levels.length>MAX_LEVELS)throw new Error('Tối đa 100 màn chơi.');io.setItem(key,JSON.stringify(levels))}
  return {
   all,
   save(level){const item=validateLevel(level),items=all(),i=items.findIndex(x=>x.id===item.id);if(i<0&&items.length>=MAX_LEVELS)throw new Error('Đã đạt giới hạn 100 màn chơi.');if(i<0)items.unshift(item);else items[i]=item;write(items);return item},
   remove(id){write(all().filter(x=>x.id!==id))},
   export(){return JSON.stringify({schema:'principia-level-pack',version:VERSION,levels:all()},null,2)},
   import(text){if(typeof text!=='string'||text.length>2*1024*1024)throw new Error('Tệp vượt quá giới hạn 2 MB.');const incoming=validatePack(JSON.parse(text)),current=all(),map=new Map(current.map(x=>[x.id,x]));incoming.forEach(x=>map.set(x.id,x));const merged=[...map.values()];write(merged);return incoming.length}
  };
 }
 const api={VERSION,validateQuestion,validateLevel,validatePack,createStore};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 root.PrincipiaLevelStudioCore=api;
})(typeof globalThis!=='undefined'?globalThis:this);
