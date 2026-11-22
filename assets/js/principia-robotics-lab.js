/* PRINCIPIA Robotics Lab — 2-link planar arm, Rust native solver with analytical browser fallback. */
(function(){
'use strict';
function init(){
 const host=document.getElementById('clTab-phet');
 if(!host||host.dataset.roboticsLabReady)return;
 host.dataset.roboticsLabReady='1';
 const panel=document.createElement('section');
 panel.id='principiaRoboticsLab';
 panel.style.cssText='margin:0 0 14px;padding:14px;border:1px solid var(--line,#444);border-radius:14px;background:var(--card,rgba(100,116,139,.08));color:var(--txt,inherit)';
 panel.innerHTML=`
 <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap">
  <div><b>🤖 PRINCIPIA Robotics Lab</b><div class="small muted">Động học nghịch đảo cánh tay robot phẳng 2 khớp (2R)</div></div>
  <button type="button" class="oli-btn primary" id="robotToggle">Mở mô phỏng</button>
 </div>
 <div id="robotWorkspace" hidden style="margin-top:12px">
  <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px">
   <label class="small">Điểm đích X (m)<input id="robotX" class="inp" type="number" min="-1.45" max="1.45" step="0.01" value="0.70" style="display:block;width:100%;margin-top:5px"></label>
   <label class="small">Điểm đích Y (m)<input id="robotY" class="inp" type="number" min="-1.45" max="1.45" step="0.01" value="0.55" style="display:block;width:100%;margin-top:5px"></label>
   <label class="small">Khâu 1 (m)<input id="robotL1" class="inp" type="number" min="0.05" max="1.5" step="0.05" value="0.80" style="display:block;width:100%;margin-top:5px"></label>
   <label class="small">Khâu 2 (m)<input id="robotL2" class="inp" type="number" min="0.05" max="1.5" step="0.05" value="0.65" style="display:block;width:100%;margin-top:5px"></label>
   <label class="small">Cấu hình khuỷu<select id="robotBranch" class="inp" style="display:block;width:100%;margin-top:5px"><option value="1">Elbow-up</option><option value="-1">Elbow-down</option></select></label>
  </div>
  <canvas id="robotCanvas" width="760" height="420" role="img" aria-label="Mô phỏng cánh tay robot hai khớp" style="display:block;width:100%;height:auto;max-height:440px;margin:12px 0;border:1px solid var(--line,#555);border-radius:12px;background:#0b1220"></canvas>
  <div id="robotResult" aria-live="polite" class="small" style="padding:11px;border-radius:10px;background:rgba(100,116,139,.12)">Đang tính nghiệm động học…</div>
  <p class="small muted" style="margin:9px 0 0">Mô hình động học 2D lý tưởng; chưa mô phỏng tải, mô-men động cơ, độ đàn hồi hay giới hạn cơ khí. Kết quả dùng để học và kiểm tra hình học, không dùng điều khiển robot thật.</p>
 </div>`;
 const first=host.firstElementChild;
 if(first)host.insertBefore(panel,first);else host.appendChild(panel);
 const $=id=>panel.querySelector('#'+id);
 let sequence=0;
 const inputs=['robotX','robotY','robotL1','robotL2','robotBranch'];
 function draw(solution,params){
  const canvas=$('robotCanvas'),ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#0b1220';ctx.fillRect(0,0,w,h);
  const scale=125,ox=w/2,oy=h/2+28,px=x=>ox+x*scale,py=y=>oy-y*scale;
  ctx.strokeStyle='rgba(148,163,184,.16)';ctx.lineWidth=1;
  for(let i=-3;i<=3;i++){ctx.beginPath();ctx.moveTo(px(i),0);ctx.lineTo(px(i),h);ctx.stroke();ctx.beginPath();ctx.moveTo(0,py(i));ctx.lineTo(w,py(i));ctx.stroke();}
  ctx.strokeStyle='rgba(96,165,250,.55)';ctx.setLineDash([5,5]);ctx.beginPath();ctx.arc(ox,oy,(params.l1M+params.l2M)*scale,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);
  ctx.strokeStyle='#64748b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(ox,0);ctx.lineTo(ox,h);ctx.moveTo(0,oy);ctx.lineTo(w,oy);ctx.stroke();
  const sx=solution.shoulderRad,ex=sx+solution.elbowRad;
  const x1=params.l1M*Math.cos(sx),y1=params.l1M*Math.sin(sx),x2=solution.endXM,y2=solution.endYM;
  ctx.lineCap='round';ctx.lineWidth=15;ctx.strokeStyle='#38bdf8';ctx.beginPath();ctx.moveTo(ox,oy);ctx.lineTo(px(x1),py(y1));ctx.stroke();
  ctx.strokeStyle='#a78bfa';ctx.beginPath();ctx.moveTo(px(x1),py(y1));ctx.lineTo(px(x2),py(y2));ctx.stroke();
  [[0,0,12,'#f8fafc'],[x1,y1,10,'#38bdf8'],[x2,y2,9,'#fbbf24']].forEach(([x,y,r,c])=>{ctx.beginPath();ctx.arc(px(x),py(y),r,0,Math.PI*2);ctx.fillStyle=c;ctx.fill();});
  ctx.fillStyle='#e2e8f0';ctx.font='14px system-ui';ctx.fillText('Gốc',ox+13,oy+22);ctx.fillText('Đích',px(params.targetXM)+12,py(params.targetYM)-12);
  ctx.fillStyle='#94a3b8';ctx.font='12px system-ui';ctx.fillText('1 ô = 1 m',14,22);
 }
 async function solve(){
  const id=++sequence;
  const p={targetXM:Number($('robotX').value),targetYM:Number($('robotY').value),l1M:Number($('robotL1').value),l2M:Number($('robotL2').value),elbowBranch:Number($('robotBranch').value)};
  const out=$('robotResult');
  if(!Object.values(p).every(Number.isFinite)||p.l1M<=0||p.l2M<=0){out.textContent='Thông số không hợp lệ. Chiều dài khâu phải lớn hơn 0.';return;}
  try{
   if(!window.PrincipiaPhysics||typeof window.PrincipiaPhysics.solveRobotArm!=='function')throw new Error('Chưa tải được bộ giải Robotics.');
   const s=await window.PrincipiaPhysics.solveRobotArm(p);if(id!==sequence)return;
   draw(s,p);
   out.innerHTML='<b>Góc khớp:</b> θ₁ '+s.shoulderDeg.toFixed(3)+'° · θ₂ '+s.elbowDeg.toFixed(3)+'°<br><b>Đầu công tác:</b> ('+s.endXM.toFixed(5)+', '+s.endYM.toFixed(5)+') m<br><b>Sai số hình học:</b> '+(s.targetErrorM*1000).toFixed(6)+' mm · <b>Singularity:</b> '+(s.singular?'Có':'Không')+'<br><span style="opacity:.75">Bộ giải: '+window.PrincipiaPhysics.backend+'</span>';
  }catch(e){if(id!==sequence)return;out.textContent=e&&e.message?e.message:'Không tính được nghiệm.';const c=$('robotCanvas').getContext('2d');c.clearRect(0,0,760,420);}
 }
 $('robotToggle').addEventListener('click',()=>{const ws=$('robotWorkspace');ws.hidden=!ws.hidden;$('robotToggle').textContent=ws.hidden?'Mở mô phỏng':'Thu gọn';if(!ws.hidden)solve();});
 inputs.forEach(id=>$(id).addEventListener('input',solve));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
