(function(root){
'use strict';
const STORAGE_KEY='principia_pattern_arcade_v1';
const MODES=Object.freeze({
 numbers:Object.freeze({label:'Dãy số',modulus:10,values:Object.freeze([0,1,2,3,4,5,6,7,8,9]),format:step=>'Cộng '+step+' rồi quay vòng 0–9.'}),
 dice:Object.freeze({label:'Xúc xắc',modulus:6,values:Object.freeze([1,2,3,4,5,6]),format:step=>'Tiến '+step+' mặt rồi quay vòng 1–6.'}),
 colors:Object.freeze({label:'Vòng màu',modulus:5,values:Object.freeze(['Đỏ','Lam','Vàng','Lục','Tím']),format:step=>'Dịch '+step+' vị trí theo vòng 5 màu.'})
});
const escapeHTML=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
function assertSeed(seed){
 if(!Number.isInteger(seed)||seed<0||seed>0xffffffff)throw new RangeError('Seed phải là số nguyên 32-bit không dấu.');
 return seed>>>0;
}
function randomStep(seed,modulus){return ((seed>>>8)%(modulus-1))+1;}
function shuffle(values,seed){
 const result=values.slice();let state=(seed^0x9e3779b9)>>>0;
 for(let i=result.length-1;i>0;i-=1){
  state=(Math.imul(state,1664525)+1013904223)>>>0;
  const j=state%(i+1);[result[i],result[j]]=[result[j],result[i]];
 }
 return result;
}
function createRound(seed,mode='numbers'){
 const safeSeed=assertSeed(seed),config=MODES[mode];
 if(!config)throw new TypeError('Chế độ trò chơi không hợp lệ.');
 const start=safeSeed%config.modulus,hiddenStep=randomStep(safeSeed,config.modulus);
 const sequence=Array.from({length:6},(_,index)=>config.values[(start+index*hiddenStep)%config.modulus]);
 const answer=config.values[(start+6*hiddenStep)%config.modulus];
 const steps=Array.from({length:4},(_,offset)=>((hiddenStep-1+offset)%(config.modulus-1))+1);
 const options=shuffle(steps,safeSeed).map(step=>Object.freeze({step,label:config.format(step)}));
 return Object.freeze({mode,sequence:Object.freeze(sequence),answer,hiddenStep,options:Object.freeze(options),roundSeed:safeSeed});
}
function evaluateGuess(round,prediction,step){
 if(!round||!MODES[round.mode])throw new TypeError('Vòng chơi không hợp lệ.');
 const config=MODES[round.mode];
 const normalizedPrediction=round.mode==='colors'?String(prediction):Number(prediction);
 const predictionCorrect=normalizedPrediction===round.answer;
 const ruleCorrect=Number(step)===round.hiddenStep&&round.options.some(option=>option.step===Number(step));
 return Object.freeze({predictionCorrect,ruleCorrect,solved:predictionCorrect&&ruleCorrect});
}
function secureSeed(){
 if(!root.crypto||typeof root.crypto.getRandomValues!=='function')throw new Error('Thiết bị không hỗ trợ bộ sinh số ngẫu nhiên an toàn.');
 const values=new Uint32Array(1);root.crypto.getRandomValues(values);return values[0];
}
function readStats(){
 try{
  const saved=JSON.parse(root.localStorage.getItem(STORAGE_KEY)||'{}');
  return {score:Number.isSafeInteger(saved.score)&&saved.score>=0?saved.score:0,streak:Number.isSafeInteger(saved.streak)&&saved.streak>=0?saved.streak:0,solved:Number.isSafeInteger(saved.solved)&&saved.solved>=0?saved.solved:0};
 }catch(_){return {score:0,streak:0,solved:0};}
}
let stats={score:0,streak:0,solved:0},round=null,mode='numbers',attempts=0,message='Quan sát 6 kết quả, dự đoán kết quả tiếp theo và chọn quy luật tạo ra chúng.';
function saveStats(){
 try{root.localStorage.setItem(STORAGE_KEY,JSON.stringify(stats));}catch(_){message='Không thể lưu điểm trên thiết bị này; lượt chơi hiện tại vẫn hoạt động.';}
}
function startRound(nextMode=mode){
 mode=nextMode;attempts=0;round=createRound(secureSeed(),mode);
}
function render(){
 if(!round)return (root.PrincipiaPatternProgression?.render?.()||'')+'<section class="panel pg-pattern-card"><p>Không thể khởi tạo trò chơi.</p></section>';
 const config=MODES[mode];
 const samples=round.sequence.map((value,index)=>'<span class="pg-pattern-sample"><small>'+(index+1)+'</small><b>'+escapeHTML(value)+'</b></span>').join('');
 const predictions=config.values.map(value=>'<option value="'+escapeHTML(value)+'">'+escapeHTML(value)+'</option>').join('');
 const options=round.options.map(option=>'<button type="button" class="pg-pattern-rule" data-rule-step="'+option.step+'">'+escapeHTML(option.label)+'</button>').join('');
 const tabs=Object.entries(MODES).map(([key,item])=>'<button type="button" class="pg-pattern-tab'+(key===mode?' is-active':'')+'" data-pattern-mode="'+key+'" aria-pressed="'+(key===mode)+'">'+escapeHTML(item.label)+'</button>').join('');
 return '<section class="panel pg-pattern-card" aria-labelledby="pgPatternTitle"><header class="pg-pattern-header"><div><div class="eyebrow">PRINCIPIA · PATTERN ARCADE</div><h2 id="pgPatternTitle">🎲 May rủi có quy luật</h2><p>Không có kết quả đặt cược. Mọi lượt đều tuân theo một quy luật xác định; nhiệm vụ của bạn là tìm ra nó.</p></div><div class="pg-pattern-score"><small>ĐIỂM · '+stats.score+'</small><b>🔥 '+stats.streak+' liên tiếp</b><small>Đã phá '+stats.solved+' quy luật</small></div></header><nav class="pg-pattern-tabs" aria-label="Chọn trò chơi">'+tabs+'</nav><div class="pg-pattern-prompt"><b>'+escapeHTML(config.label)+' bí ẩn</b><span>Quan sát chuỗi kết quả:</span></div><div class="pg-pattern-sequence">'+samples+'<span class="pg-pattern-next" aria-label="Kết quả tiếp theo chưa biết">?</span></div><div class="pg-pattern-predict"><label for="pgPatternPrediction">1. Dự đoán kết quả tiếp theo</label><select id="pgPatternPrediction"><option value="">Chọn kết quả…</option>'+predictions+'</select></div><div class="pg-pattern-rule-title">2. Chọn quy luật bạn phát hiện được</div><div class="pg-pattern-rules">'+options+'</div><p class="pg-pattern-message" role="status" aria-live="polite">'+escapeHTML(message)+'</p><div class="pg-pattern-footer"><span>'+attempts+' lần thử ở vòng này</span><button type="button" class="pg-pattern-hint" data-pattern-hint>Gợi ý</button></div><p class="pg-pattern-note">Mỗi lần phá đúng cả dự đoán và quy luật, bạn nhận 100 điểm + thưởng chuỗi. Ngay sau đó hệ thống tạo quy luật mới. Không mất điểm khi trả lời sai; không có tiền thật hay đặt cược.</p></section>';
}
function mount(){
 const doc=root.document;
 if(!doc||root.__principiaPatternArcadeInstalled||typeof root.entertainmentPage!=='function')return false;
 stats=readStats();
 try{startRound(mode);}catch(error){message=String(error.message||error);return false;}
 const previous=root.entertainmentPage;
 root.entertainmentPage=function(){
  const existing=previous.apply(this,arguments);
  return String(existing||'')+render();
 };
 root.__principiaPatternArcadeInstalled=true;
 return true;
}
function submitPrediction(container,step){
 const select=container.querySelector('#pgPatternPrediction');
 if(!select||!select.value){message='Hãy chọn dự đoán kết quả tiếp theo.';return;}
 const result=evaluateGuess(round,select.value,step);
 if(result.solved){
  const points=100+Math.min(stats.streak,20)*5;
  stats={score:stats.score+points,streak:stats.streak+1,solved:stats.solved+1};\n  root.document?.dispatchEvent(new CustomEvent('principia:pattern-solved'));
  const oldMode=mode;
  saveStats();
  try{startRound(oldMode);message='Chính xác! Bạn nhận +'+points+' điểm. Quy luật cũ đã bị phát hiện và quy luật mới vừa xuất hiện.';}
  catch(error){message='Đã phá quy luật và ghi điểm, nhưng chưa thể tạo vòng mới: '+String(error.message||error);}
  return;
 }
 attempts+=1;stats.streak=0;saveStats();\n root.document?.dispatchEvent(new CustomEvent('principia:pattern-failed'));
 if(result.predictionCorrect)message='Dự đoán đúng, nhưng quy luật bạn chọn chưa đúng. Hãy xem lại hiệu số giữa các kết quả.';
 else if(result.ruleCorrect)message='Bạn đã chọn đúng quy luật nhưng dự đoán kết quả tiếp theo chưa chính xác.';
 else message='Chưa đúng. Hãy so sánh khoảng cách giữa các kết quả và kiểm tra quy luật quay vòng.';
 if(attempts>=3)message+=' Gợi ý: hiệu số giữa hai kết quả liên tiếp luôn bằng nhau theo modulo của trò chơi.';
}
function handleClick(event){
 const container=event.currentTarget;
 const modeButton=event.target.closest('[data-pattern-mode]');
 if(modeButton&&container.contains(modeButton)){
  try{startRound(modeButton.dataset.patternMode);message='Đã đổi trò chơi. Hãy tìm quy luật mới.';}catch(error){message=String(error.message||error);}
  root.render?.();return;
 }
 const ruleButton=event.target.closest('[data-rule-step]');
 if(ruleButton&&container.contains(ruleButton)){
  const prediction=container.querySelector('#pgPatternPrediction');
  if(!prediction||!prediction.value){message='Chọn kết quả dự đoán trước khi xác nhận quy luật.';root.render?.();return;}
  submitPrediction(container,Number(ruleButton.dataset.ruleStep));
  root.render?.();return;
 }
 if(event.target.closest('[data-pattern-hint]')){
  message='Mẹo: tính hiệu giữa từng cặp số liên tiếp. Với xúc xắc và vòng màu, hãy tính theo vòng khép kín.';
  root.render?.();
 }
}
function install(){
 if(!mount()){if(root.document&&root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});}
}
const api=Object.freeze({MODES,createRound,evaluateGuess,assertSeed});
root.PrincipiaPatternArcade=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document){
 if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',install,{once:true});
 else install();
 root.document.addEventListener('click',event=>{
  const card=event.target.closest('.pg-pattern-card');
  if(card)handleClick({currentTarget:card,target:event.target});
 });
}
})(typeof window!=='undefined'?window:globalThis);
