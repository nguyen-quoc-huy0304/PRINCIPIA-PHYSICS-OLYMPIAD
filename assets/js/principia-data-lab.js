/* PRINCIPIA Experimental Data Lab — linear least-squares regression. */
(function(){
'use strict';
function init(){
 const host=document.getElementById('clTab-phet');
 if(!host||host.dataset.dataLabReady)return;
 host.dataset.dataLabReady='1';
 const panel=document.createElement('section');
 panel.id='principiaDataLab';
 panel.style.cssText='margin:0 0 14px;padding:14px;border:1px solid var(--line,#444);border-radius:14px;background:var(--card,rgba(100,116,139,.08));color:var(--txt,inherit)';
 panel.innerHTML=`
 <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap">
  <div><b>📈 PRINCIPIA Experimental Data Lab</b><div class="small muted">Phân tích số liệu thí nghiệm · hồi quy tuyến tính bình phương tối thiểu</div></div>
  <button type="button" id="dataFitBtn" class="oli-btn primary">Phân tích dữ liệu</button>
 </div>
 <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-top:12px">
  <div><label class="small" for="dataPoints">Nhập mỗi dòng theo dạng X,Y (dùng dấu chấm cho số thập phân)</label>
   <textarea id="dataPoints" class="inp" rows="8" spellcheck="false" style="display:block;width:100%;margin-top:6px;font-family:ui-monospace,monospace">0,1
1,3
2,5
3,7
4,9</textarea>
   <div class="small muted" style="margin-top:5px">Tối thiểu 2 điểm, tối đa 10.000 điểm. Ví dụ: thời gian (s), quãng đường (m).</div>
  </div>
  <div><canvas id="dataPlot" width="640" height="390" role="img" aria-label="Đồ thị số liệu và đường hồi quy" style="display:block;width:100%;height:auto;border:1px solid var(--line,#555);border-radius:12px;background:#0b1220"></canvas>
   <div id="dataFitResult" aria-live="polite" class="small" style="margin-top:9px;padding:10px;border-radius:10px;background:rgba(100,116,139,.12)">Nhập số liệu rồi nhấn Phân tích dữ liệu.</div>
  </div>
 </div>
 <p class="small muted" style="margin:10px 0 0">Mô hình y = ax + b. R² biểu thị mức độ phù hợp của đường thẳng; RMSE là căn sai số bình phương trung bình. Hồi quy tuyến tính không chứng minh quan hệ nhân quả và không thay thế đánh giá sai số đo.</p>`;
 const first=host.firstElementChild;if(first)host.insertBefore(panel,first);else host.appendChild(panel);
 const $=id=>panel.querySelector('#'+id);
 function parse(){
  const rows=$('dataPoints').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  if(rows.length<2||rows.length>10000)throw new Error('Cần nhập từ 2 đến 10.000 dòng dữ liệu.');
  return rows.map((line,i)=>{
   const cols=line.split(/[;,\t ]+/).filter(Boolean);
   if(cols.length!==2)throw new Error('Dòng '+(i+1)+': cần đúng hai số X,Y.');
   const x=Number(cols[0]),y=Number(cols[1]);
   if(!Number.isFinite(x)||!Number.isFinite(y))throw new Error('Dòng '+(i+1)+': dữ liệu phải là số hữu hạn.');
   return [x,y];
  });
 }
 function plot(points,fit){
  const c=$('dataPlot'),ctx=c.getContext('2d'),w=c.width,h=c.height,pad={l:58,r:20,t:22,b:48};
  ctx.clearRect(0,0,w,h);ctx.fillStyle='#0b1220';ctx.fillRect(0,0,w,h);
  let xmin=Math.min(...points.map(p=>p[0])),xmax=Math.max(...points.map(p=>p[0]));
  let ymin=Math.min(...points.map(p=>p[1])),ymax=Math.max(...points.map(p=>p[1]));
  const yline=[fit.slope*xmin+fit.intercept,fit.slope*xmax+fit.intercept];ymin=Math.min(ymin,...yline);ymax=Math.max(ymax,...yline);
  if(xmin===xmax){xmin-=1;xmax+=1;}if(ymin===ymax){ymin-=1;ymax+=1;}
  const dx=(xmax-xmin)*.08,dy=(ymax-ymin)*.12;xmin-=dx;xmax+=dx;ymin-=dy;ymax+=dy;
  const X=x=>pad.l+(x-xmin)/(xmax-xmin)*(w-pad.l-pad.r),Y=y=>h-pad.b-(y-ymin)/(ymax-ymin)*(h-pad.t-pad.b);
  ctx.strokeStyle='rgba(148,163,184,.22)';ctx.lineWidth=1;ctx.fillStyle='#94a3b8';ctx.font='12px system-ui';
  for(let i=0;i<=4;i++){const x=xmin+(xmax-xmin)*i/4,y=ymin+(ymax-ymin)*i/4;ctx.beginPath();ctx.moveTo(X(x),pad.t);ctx.lineTo(X(x),h-pad.b);ctx.stroke();ctx.beginPath();ctx.moveTo(pad.l,Y(y));ctx.lineTo(w-pad.r,Y(y));ctx.stroke();ctx.fillText(x.toPrecision(3),X(x)-12,h-20);ctx.fillText(y.toPrecision(3),5,Y(y)+4);}
  ctx.strokeStyle='#a78bfa';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(X(xmin),Y(fit.slope*xmin+fit.intercept));ctx.lineTo(X(xmax),Y(fit.slope*xmax+fit.intercept));ctx.stroke();
  ctx.fillStyle='#38bdf8';points.forEach(p=>{ctx.beginPath();ctx.arc(X(p[0]),Y(p[1]),5,0,Math.PI*2);ctx.fill();});
  ctx.fillStyle='#e2e8f0';ctx.font='13px system-ui';ctx.fillText('● Số đo',pad.l,15);ctx.fillStyle='#c4b5fd';ctx.fillText('━ Hồi quy',pad.l+75,15);
 }
 async function fit(){
  const out=$('dataFitResult'),button=$('dataFitBtn');button.disabled=true;button.textContent='Đang tính…';
  try{
   const points=parse();if(!window.PrincipiaPhysics||typeof window.PrincipiaPhysics.fitLinearData!=='function')throw new Error('Bộ phân tích dữ liệu chưa được tải.');
   const f=await window.PrincipiaPhysics.fitLinearData(points);plot(points,f);
   out.innerHTML='<b>Phương trình:</b> y = '+f.slope.toPrecision(7)+'x '+(f.intercept<0?'− ':'+ ')+Math.abs(f.intercept).toPrecision(7)+'<br><b>R²:</b> '+f.rSquared.toFixed(7)+' · <b>RMSE:</b> '+f.rmse.toPrecision(6)+'<br><b>Số điểm:</b> '+f.count+' · <span style="opacity:.75">Bộ giải: '+window.PrincipiaPhysics.backend+'</span>';
  }catch(e){out.textContent=e&&e.message?e.message:'Không thể phân tích dữ liệu.';}
  finally{button.disabled=false;button.textContent='Phân tích dữ liệu';}
 }
 $('dataFitBtn').addEventListener('click',fit);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
