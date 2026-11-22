/* PRINCIPIA Lab Builder — user-composed experiment workbench.
 * Local-first planner: it designs and documents experiments; it does not claim
 * to physically simulate apparatus that has not been modelled.
 */
(function(){
'use strict';
const KEY='principia_lab_builder_v1',MAX=100;
const kit=[
 ['track','🛤️','Máng trượt / đường ray','Cơ học'],['cart','🚗','Xe lăn','Cơ học'],['mass','⚖️','Quả nặng','Cơ học'],
 ['pulley','🛞','Ròng rọc','Cơ học'],['spring','🌀','Lò xo','Cơ học'],['pendulum','⏱️','Con lắc','Cơ học'],
 ['ruler','📏','Thước đo','Đo lường'],['stopwatch','⏲️','Đồng hồ bấm giờ','Đo lường'],['sensor','📡','Cảm biến','Đo lường'],
 ['battery','🔋','Pin / nguồn DC','Điện'],['resistor','〰️','Điện trở','Điện'],['bulb','💡','Bóng đèn','Điện'],
 ['switch','🎚️','Công tắc','Điện'],['wire','➰','Dây dẫn','Điện'],['thermometer','🌡️','Nhiệt kế','Nhiệt học'],
 ['beaker','🧪','Cốc thí nghiệm','Nhiệt học'],['water','💧','Nước / chất lỏng','Nhiệt học'],['mirror','🪞','Gương phẳng','Quang học']
];
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function read(){try{const x=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(x)?x.filter(a=>a&&typeof a.id==='string').slice(0,MAX):[]}catch(_){return []}}
let records=read(),current=null,items=[];
function persist(){try{localStorage.setItem(KEY,JSON.stringify(records));return true}catch(_){alert('Không thể lưu: bộ nhớ trình duyệt đã đầy hoặc bị chặn.');return false}}
function uid(){return 'lab-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7)}
function mount(){
 const host=$('clTab-phet');if(!host||$('principiaLabBuilder'))return;
 const root=document.createElement('section');root.id='principiaLabBuilder';
 root.style.cssText='margin:18px 0;padding:16px;border:1px solid var(--line);border-radius:16px;background:var(--bg-2);color:var(--text)';
 root.innerHTML='<div style="display:flex;justify-content:space-between;gap:10px;align-items:center;flex-wrap:wrap"><div><h3 style="margin:0">🧰 Xưởng thiết kế thí nghiệm</h3><p class="small muted" style="margin:5px 0">Tự chọn dụng cụ, bố trí quy trình, ghi giả thuyết và kết quả. Dữ liệu lưu trên thiết bị.</p></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" class="oli-btn primary" id="plbNew">＋ Thí nghiệm mới</button><button type="button" class="oli-btn" id="plbImport">Nhập JSON</button><input id="plbImportFile" type="file" accept=".json,application/json" hidden></div></div><div id="plbList" style="margin:12px 0"></div><div id="plbEditor" hidden style="border-top:1px solid var(--line);padding-top:14px"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px"><label class="small">Tên thí nghiệm<input class="inp" id="plbTitle" maxlength="100" placeholder="Ví dụ: Khảo sát con lắc đơn" style="width:100%;margin-top:5px"></label><label class="small">Câu hỏi nghiên cứu<input class="inp" id="plbQuestion" maxlength="240" placeholder="Đại lượng nào ảnh hưởng đến chu kỳ?" style="width:100%;margin-top:5px"></label></div><label class="small" style="display:block;margin-top:10px">Giả thuyết<input class="inp" id="plbHypothesis" maxlength="500" placeholder="Dự đoán và giải thích..." style="width:100%;margin-top:5px"></label><label class="small" style="display:block;margin-top:10px">Biến độc lập / biến cần thay đổi<input class="inp" id="plbIndependent" maxlength="120" placeholder="Ví dụ: chiều dài dây (m)" style="width:100%;margin-top:5px"></label><label class="small" style="display:block;margin-top:10px">Biến phụ thuộc / đại lượng đo<input class="inp" id="plbDependent" maxlength="120" placeholder="Ví dụ: chu kỳ (s)" style="width:100%;margin-top:5px"></label><h4>1. Chọn thiết bị</h4><div id="plbKit" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:7px"></div><h4>2. Bàn thí nghiệm</h4><div id="plbBench" style="display:flex;gap:7px;flex-wrap:wrap;min-height:54px;padding:10px;border:1px dashed var(--line);border-radius:12px"></div><h4>3. Quy trình thực hiện</h4><textarea id="plbProcedure" class="inp" rows="4" maxlength="3000" placeholder="1. Lắp dụng cụ...&#10;2. Tiến hành đo...&#10;3. Lặp lại và kiểm soát sai số..." style="width:100%;box-sizing:border-box"></textarea><h4>4. Quan sát và kết quả</h4><textarea id="plbResults" class="inp" rows="4" maxlength="5000" placeholder="Ghi số liệu, đơn vị, nhận xét, nguồn sai số..." style="width:100%;box-sizing:border-box"></textarea><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:12px"><button class="oli-btn primary" id="plbSave">Lưu thí nghiệm</button><button class="oli-btn" id="plbExport">Xuất JSON</button><button class="oli-btn" id="plbClose">Đóng</button></div><p class="small muted">Lưu ý: đây là công cụ thiết kế và ghi chép thí nghiệm. Kết quả vật lý phải được đo thực tế hoặc chạy trong mô phỏng chuyên dụng; xưởng không tự tạo dữ liệu đo.</p></div>';
 host.insertBefore(root,host.firstChild);
 $('plbNew').addEventListener('click',()=>edit(null));
 $('plbImport').addEventListener('click',()=>$('plbImportFile').click());
 $('plbImportFile').addEventListener('change',importFile);
 $('plbClose').addEventListener('click',()=>{$('plbEditor').hidden=true});
 $('plbSave').addEventListener('click',save);
 $('plbExport').addEventListener('click',exportCurrent);
 renderList();
}
async function importFile(e){
 const file=e.target.files?.[0];e.target.value='';if(!file)return;
 if(file.size>2*1024*1024){alert('Tệp nhập tối đa 2 MB.');return}
 try{
  const raw=JSON.parse(await file.text()),incoming=Array.isArray(raw)?raw:raw?.schema==='principia-lab-builder'&&raw.version===1&&Array.isArray(raw.experiments)?raw.experiments:[raw];
  if(incoming.length>MAX)throw new Error('Tối đa 100 bản thiết kế trong một tệp.');
  const allowed=new Set(kit.map(x=>x[0]));
  const clean=incoming.map((x,i)=>{
   if(!x||typeof x!=='object')throw new Error('Bản thiết kế '+(i+1)+' không hợp lệ.');
   const title=String(x.title||'').trim().slice(0,100),id=String(x.id||uid()).slice(0,80);
   if(!title||!/^[a-zA-Z0-9_-]{1,80}$/.test(id))throw new Error('Tên hoặc mã bản thiết kế '+(i+1)+' không hợp lệ.');
   const source=Array.isArray(x.items)?x.items:[];if(source.length>30)throw new Error('Mỗi thiết kế tối đa 30 thiết bị.');
   const equipment=source.map(it=>{
    if(!it||!allowed.has(it.id))throw new Error('Tệp chứa thiết bị không nằm trong danh mục PRINCIPIA.');
    const k=kit.find(v=>v[0]===it.id);return {id:k[0],name:k[2],qty:Math.max(1,Math.min(99,Math.floor(Number(it.qty)||1)))};
   });
   const field=(v,n)=>String(v||'').trim().slice(0,n);
   return {id,title,question:field(x.question,240),hypothesis:field(x.hypothesis,500),independent:field(x.independent,120),dependent:field(x.dependent,120),items:equipment,procedure:field(x.procedure,3000),results:field(x.results,5000),created:field(x.created,40)||new Date().toISOString(),updated:new Date().toISOString()};
  });
  const map=new Map(records.map(x=>[x.id,x]));clean.forEach(x=>map.set(x.id,x));
  const merged=[...map.values()];if(merged.length>MAX)throw new Error('Nhập xong sẽ vượt giới hạn 100 bản thiết kế.');
  const previous=records;records=merged;if(!persist()){records=previous;return}
  renderList();alert('Đã nhập '+clean.length+' bản thiết kế. Dữ liệu cũ cùng mã được cập nhật.');
 }catch(err){alert('Không thể nhập JSON: '+(err?.message||'Tệp không hợp lệ.'))}
}
function renderList(){
 const el=$('plbList');if(!el)return;
 el.innerHTML=records.length?records.map(r=>'<div style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap;padding:10px 0;border-bottom:1px solid var(--line)"><div><b>'+esc(r.title||'Thí nghiệm chưa đặt tên')+'</b><div class="small muted">'+new Date(r.updated||r.created||Date.now()).toLocaleString('vi-VN')+' · '+(r.items||[]).length+' thiết bị</div></div><div style="display:flex;gap:6px"><button class="oli-btn" data-edit="'+esc(r.id)+'">Mở / sửa</button><button class="oli-btn" data-delete="'+esc(r.id)+'" aria-label="Xóa thí nghiệm">Xóa</button></div></div>').join(''):'<p class="small muted">Chưa có thí nghiệm nào. Bấm “Thí nghiệm mới” để bắt đầu lắp bàn thí nghiệm.</p>';
 el.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>edit(b.dataset.edit)));
 el.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>{if(!confirm('Xóa bản thiết kế thí nghiệm này?'))return;records=records.filter(x=>x.id!==b.dataset.delete);persist();renderList()}));
}
function edit(id){
 current=records.find(x=>x.id===id)||null;items=current?structuredClone(current.items||[]):[];
 $('plbEditor').hidden=false;
 const fields={Title:'title',Question:'question',Hypothesis:'hypothesis',Independent:'independent',Dependent:'dependent',Procedure:'procedure',Results:'results'};
 Object.entries(fields).forEach(([k,v])=>{$('plb'+k).value=current?.[v]||''});
 $('plbKit').innerHTML=kit.map(([id,icon,name,group])=>'<button type="button" class="oli-btn" data-kit="'+id+'" style="text-align:left"> '+icon+' '+esc(name)+'<span class="small muted" style="display:block">'+esc(group)+'</span></button>').join('');
 $('plbKit').querySelectorAll('[data-kit]').forEach(b=>b.addEventListener('click',()=>{if(items.length>=30){alert('Tối đa 30 thiết bị cho mỗi bản thiết kế.');return}const k=kit.find(x=>x[0]===b.dataset.kit);items.push({id:k[0],name:k[2],qty:1});renderBench()}));
 renderBench();$('plbEditor').scrollIntoView({behavior:'smooth',block:'start'});
}
function renderBench(){
 const el=$('plbBench');if(!el)return;
 el.innerHTML=items.length?items.map((x,i)=>{const k=kit.find(a=>a[0]===x.id);return '<div style="display:flex;align-items:center;gap:5px;padding:7px 9px;border:1px solid var(--line);border-radius:10px;background:var(--bg)">'+(k?.[1]||'🧰')+' '+esc(x.name)+' <label class="small">×<input aria-label="Số lượng '+esc(x.name)+'" data-qty="'+i+'" type="number" min="1" max="99" value="'+x.qty+'" style="width:48px"></label><button type="button" class="oli-btn" data-remove="'+i+'" aria-label="Bỏ thiết bị">×</button></div>'}).join(''):'<span class="small muted">Chưa có thiết bị. Chọn thiết bị ở phía trên để thêm vào đây.</span>';
 el.querySelectorAll('[data-qty]').forEach(b=>b.addEventListener('change',()=>{items[+b.dataset.qty].qty=Math.max(1,Math.min(99,Math.floor(Number(b.value)||1)))}));
 el.querySelectorAll('[data-remove]').forEach(b=>b.addEventListener('click',()=>{items.splice(+b.dataset.remove,1);renderBench()}));
}
function save(){
 const title=$('plbTitle').value.trim();if(!title){alert('Hãy đặt tên thí nghiệm trước khi lưu.');$('plbTitle').focus();return}
 const now=new Date().toISOString(),r={id:current?.id||uid(),title,question:$('plbQuestion').value.trim(),hypothesis:$('plbHypothesis').value.trim(),independent:$('plbIndependent').value.trim(),dependent:$('plbDependent').value.trim(),items:items.map(x=>({...x})),procedure:$('plbProcedure').value.trim(),results:$('plbResults').value.trim(),created:current?.created||now,updated:now};
 const index=records.findIndex(x=>x.id===r.id);if(index>=0)records[index]=r;else{if(records.length>=MAX){alert('Đã đạt giới hạn 100 bản thiết kế. Hãy xuất và xóa bản cũ.');return}records.unshift(r)}
 if(persist()){current=r;renderList();alert('Đã lưu bản thiết kế trên thiết bị này.')}
}
function exportCurrent(){
 if(!current){alert('Hãy lưu thí nghiệm trước khi xuất.');return}
 const r=records.find(x=>x.id===current.id);if(!r)return;
 const blob=new Blob([JSON.stringify(r,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=(r.title||'principia-lab').replace(/[^a-z0-9-_]+/gi,'-').slice(0,60)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
