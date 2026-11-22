/* PRINCIPIA External Labs — official PhET simulations, loaded on selection only.
 * Regular PhET HTML sims are CC BY-NC 4.0; keep their logo and attribution visible.
 */
(function(){
'use strict';
const groups=[
['Cơ học',[
['projectile-motion','Ném xiên – Chuyển động của vật'],
['forces-and-motion-basics','Lực và chuyển động cơ bản'],
['friction','Ma sát và lực cản'],
['energy-skate-park-basics','Công viên năng lượng']]],
['Điện – Từ',[
['circuit-construction-kit-dc','Lắp mạch điện một chiều'],
['ohms-law','Định luật Ohm'],
['faradays-law','Định luật Faraday']]],
['Sóng – Quang học',[
['wave-on-a-string','Sóng trên sợi dây'],
['bending-light','Khúc xạ ánh sáng'],
['geometric-optics','Quang học hình học']]],
['Nhiệt học – Khí',[
['gas-properties','Tính chất chất khí'],
['states-of-matter-basics','Các trạng thái vật chất']]]
];
const base='https://phet.colorado.edu/sims/html/';\nconst circuitUrl='https://www.falstad.com/circuit/circuitjs.html';
function init(){
 const picker=document.getElementById('phetSubjectPicker'),frame=document.getElementById('phetFrame');
 if(!picker||!frame||picker.dataset.principiaLabs)return;
 picker.dataset.principiaLabs='1';frame.loading='lazy';frame.title='Mô phỏng khoa học PhET';
 groups.forEach(([group,items])=>{
  const og=document.createElement('optgroup');og.label=group;
  items.forEach(([slug,label])=>{const o=document.createElement('option');o.value=slug==='external:circuitjs'?circuitUrl:base+slug+'/latest/'+slug+'_all.html';o.textContent=label;og.appendChild(o);});
  picker.appendChild(og);
 });
 const note=document.createElement('div');note.id='principiaPhetAttribution';
 note.style.cssText='margin-top:9px;padding:10px 12px;border:1px solid var(--line);border-radius:10px;font-size:12px;line-height:1.55;color:var(--muted)';
 function attribution(url){if(url===circuitUrl)return '<strong>CircuitJS – mô phỏng điện tử</strong><br>Simulator by Paul Falstad and Iain Sharp · <a href="https://github.com/pfalstad/circuitjs1" target="_blank" rel="noopener noreferrer">mã nguồn gốc</a> · GPL-2.0-or-later. Mô hình linh kiện có thể được lý tưởng hóa; chỉ dùng cho học tập/thử nghiệm, không thay thế phần mềm thiết kế và kiểm định mạch thực tế.';return '<strong>Thư viện mô phỏng chính thức</strong><br>Simulation by PhET Interactive Simulations, University of Colorado Boulder · <a href="https://phet.colorado.edu" target="_blank" rel="noopener noreferrer">phet.colorado.edu</a> · CC BY-NC 4.0. Giữ nguyên logo và ghi công của PhET.';}\n note.innerHTML=attribution(picker.value);
 const link=document.createElement('a');link.href='https://phet.colorado.edu/vi/simulations';link.target='_blank';link.rel='noopener noreferrer';link.textContent='Mở toàn bộ thư viện PhET ↗';link.style.cssText='display:inline-block;margin-top:7px';
 note.appendChild(document.createElement('br'));note.appendChild(link);frame.insertAdjacentElement('afterend',note);
 function applySelection(){const url=picker.value;if(!url.startsWith(base)&&url!==circuitUrl)return;frame.src=url;frame.title=picker.options[picker.selectedIndex].textContent;note.innerHTML=attribution(url);}\n window.changePhetSrc=applySelection;\n picker.addEventListener('change',applySelection);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();