(function(root){
'use strict';
const METHODS=[
{id:'npv',label:'NPV',fields:[['rate','Lãi suất chiết khấu','0.12'],['cashFlows','Dòng tiền (cách nhau bằng dấu phẩy)','-100000,30000,35000,40000']]},
{id:'irr',label:'IRR',fields:[['cashFlows','Dòng tiền (cách nhau bằng dấu phẩy)','-100000,30000,35000,40000']]},
{id:'dcf',label:'Định giá DCF',fields:[['cashFlows','FCF từng năm, phân cách dấu phẩy','10000,12000,14000,16000,18000'],['discountRate','WACC (vd 0.12)','0.12'],['terminalGrowth','Tăng trưởng dài hạn (vd 0.03)','0.03']]},
{id:'capm',label:'CAPM',fields:[['riskFreeRate','Lãi suất phi rủi ro (vd 0.04)','0.04'],['beta','Beta','1.1'],['marketReturn','Lợi suất thị trường (vd 0.10)','0.10']]},
{id:'wacc',label:'WACC',fields:[['equity','Vốn chủ','700000'],['debt','Nợ vay','300000'],['costOfEquity','Chi phí vốn chủ (vd 0.14)','0.14'],['costOfDebt','Chi phí nợ (vd 0.08)','0.08'],['taxRate','Thuế suất (vd 0.20)','0.20']]},
{id:'bondPrice',label:'Định giá trái phiếu',fields:[['faceValue','Mệnh giá','1000000'],['couponRate','Coupon (vd 0.08)','0.08'],['yieldRate','Lợi suất yêu cầu (vd 0.09)','0.09'],['periods','Số kỳ trả lãi','5'],['paymentsPerYear','Số lần trả lãi/năm','1']]},
{id:'breakEven',label:'Điểm hòa vốn',fields:[['fixedCosts','Chi phí cố định','50000000'],['price','Giá bán/sản phẩm','200000'],['variableCost','Chi phí biến đổi/sản phẩm','120000']]},
{id:'unitEconomics',label:'Unit economics',fields:[['price','Doanh thu/khách','500000'],['variableCost','Chi phí biến đổi/khách','150000'],['cac','Chi phí có khách mới (CAC)','100000'],['monthlyFixedCosts','Chi phí cố định tháng','20000000'],['monthlyCustomers','Số khách/tháng','100']]},
{id:'runway',label:'Runway',fields:[['cash','Tiền mặt hiện có','300000000'],['monthlyBurn','Dòng tiền tiêu hao/tháng','25000000']]},
{id:'dilution',label:'Pha loãng cổ phần',fields:[['preMoney','Định giá trước đầu tư','10000000000'],['investment','Vốn gọi','2000000000']]}
];
const fmt=value=>Number.isFinite(value)?new Intl.NumberFormat('vi-VN',{maximumFractionDigits:4}).format(value):'Không xác định';
function parseInputs(method,form){
 const output={};
 for(const [key] of method.fields){
  const raw=form.elements.namedItem(key).value.trim();
  if(key==='cashFlows')output[key]=raw.split(/[;,\s]+/).filter(Boolean).map(Number);
  else output[key]=Number(raw);
 }
 return output;
}
function safeText(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function renderResult(value){
 if(value===null||typeof value!=='object')return '<strong>'+safeText(fmt(value))+'</strong>';
 return '<table class="pf-table"><tbody>'+Object.entries(value).map(([key,item])=>'<tr><td>'+safeText(key)+'</td><td>'+safeText(Array.isArray(item)?item.join(', '):typeof item==='object'?JSON.stringify(item):fmt(item))+'</td></tr>').join('')+'</tbody></table>';
}
function mount(){
 if(!root.document||root.document.getElementById('principia-finance-launcher'))return true;
 if(!root.PrincipiaFinanceCore)return false;
 const launcher=root.document.createElement('button');
 launcher.id='principia-finance-launcher';launcher.type='button';launcher.textContent='Tài chính & Kinh doanh';
 const panel=root.document.createElement('section');
 panel.id='principia-finance-panel';panel.setAttribute('aria-label','Trung tâm tài chính và kinh doanh');
 panel.innerHTML='<div class="pf-head"><div><div class="pf-muted">PRINCIPIA FINANCE SUITE</div><h2>Trung tâm Đầu tư & Kinh doanh</h2></div><button type="button" class="pf-close" aria-label="Đóng">Đóng ✕</button></div><div class="pf-tabs" role="tablist"><button class="pf-tab" data-tab="calc" aria-selected="true">Máy tính tài chính</button><button class="pf-tab" data-tab="plan" aria-selected="false">Kế hoạch kinh doanh</button><button class="pf-tab" data-tab="scenario" aria-selected="false">Kịch bản & rủi ro</button></div><div id="pf-content"></div><p class="pf-muted">Kết quả là mô phỏng theo dữ liệu bạn nhập, không phải báo giá trực tiếp hay khuyến nghị đầu tư.</p>';
 root.document.body.append(launcher,panel);
 const content=panel.querySelector('#pf-content');
 let tab='calc';
 function show(){
  panel.querySelectorAll('[data-tab]').forEach(button=>button.setAttribute('aria-selected',String(button.dataset.tab===tab)));
  if(tab==='calc')renderCalculators();
  if(tab==='plan')renderPlanner();
  if(tab==='scenario')renderScenarios();
 }
 function renderCalculators(){
  content.innerHTML='<div class="pf-grid">'+METHODS.map(method=>'<article class="pf-card"><h3>'+safeText(method.label)+'</h3><form data-method="'+method.id+'">'+method.fields.map(([key,label,value])=>'<div class="pf-field"><label>'+safeText(label)+'</label><input name="'+key+'" value="'+value.replace(/"/g,'&quot;')+'" required></div>').join('')+'<button class="pf-submit" type="submit">Tính toán</button><div class="pf-result" aria-live="polite">Nhập dữ liệu và tính toán.</div></form></article>').join('')+'</div>';
  content.querySelectorAll('form[data-method]').forEach(form=>form.addEventListener('submit',event=>{
   event.preventDefault();const method=METHODS.find(item=>item.id===form.dataset.method),result=form.querySelector('.pf-result');
   try{const inputs=parseInputs(method,form),output=root.PrincipiaFinanceCore.calculate(method.id,inputs);result.innerHTML=renderResult(output);}
   catch(error){result.textContent=error.message;}
  }));
 }
 function renderPlanner(){
  content.innerHTML='<article class="pf-card"><h3>Dự phóng hoạt động doanh nghiệp</h3><form id="pf-plan-form"><div class="pf-grid">'+[
  ['name','Tên dự án','Dự án mới'],['startupCost','Vốn đầu tư ban đầu','100000000'],['monthlyRevenue','Doanh thu tháng đầu','30000000'],['variableCostRate','Tỷ lệ chi phí biến đổi (0–1)','0.4'],['fixedCosts','Chi phí cố định/tháng','15000000'],['monthlyGrowth','Tăng trưởng doanh thu/tháng (-0.99 đến 5)','0.03'],['cashReserve','Tiền dự phòng','100000000'],['taxRate','Thuế suất (0–1)','0.2'],['months','Số tháng dự phóng (1–60)','12']
  ].map(([key,label,value])=>'<div class="pf-field"><label>'+label+'</label><input name="'+key+'" value="'+value+'" required></div>').join('')+'</div><button class="pf-submit" type="submit">Lập dự phóng</button><div class="pf-result" id="pf-plan-result">Chưa có dự phóng.</div></form></article>';
  content.querySelector('#pf-plan-form').addEventListener('submit',event=>{
   event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(Array.from(new FormData(form).entries()));
   try{const plan=root.PrincipiaBusinessPlanner.buildPlan(data);const summary={breakEvenRevenue:plan.breakEvenRevenue,firstMonthProfit:plan.firstMonthProfit,finalCash:plan.finalCash,paybackMonth:plan.paybackMonth};form.querySelector('#pf-plan-result').innerHTML=renderResult(summary)+'<table class="pf-table"><thead><tr><th>Tháng</th><th>Doanh thu</th><th>Lợi nhuận</th><th>Tiền cuối kỳ</th></tr></thead><tbody>'+plan.projection.map(row=>'<tr><td>'+row.month+'</td><td>'+fmt(row.revenue)+'</td><td>'+fmt(row.operatingProfit)+'</td><td>'+fmt(row.endingCash)+'</td></tr>').join('')+'</tbody></table>';}
   catch(error){form.querySelector('#pf-plan-result').textContent=error.message;}
  });
 }
 function renderScenarios(){
  content.innerHTML='<article class="pf-card"><h3>Phân tích ba kịch bản</h3><form id="pf-scenario-form"><div class="pf-grid">'+[
  ['revenue','Doanh thu cơ sở','100000000'],['variableCostRate','Tỷ lệ chi phí biến đổi','0.45'],['fixedCosts','Chi phí cố định','30000000'],['taxRate','Thuế suất','0.2']
  ].map(([key,label,value])=>'<div class="pf-field"><label>'+label+'</label><input name="'+key+'" value="'+value+'"></div>').join('')+'</div><button class="pf-submit" type="submit">So sánh kịch bản</button><div class="pf-result" id="pf-scenario-result">Chưa có kết quả.</div></form></article>';
  content.querySelector('#pf-scenario-form').addEventListener('submit',event=>{
   event.preventDefault();const form=event.currentTarget;const data=Object.fromEntries(Array.from(new FormData(form).entries()));
   try{const rows=root.PrincipiaFinanceCore.calculate('scenarioAnalysis',{...data,scenarios:[{name:'Xấu',revenueMultiplier:.7,fixedCostMultiplier:1.1},{name:'Cơ sở',revenueMultiplier:1,fixedCostMultiplier:1},{name:'Tốt',revenueMultiplier:1.25,fixedCostMultiplier:.95}]});form.querySelector('#pf-scenario-result').innerHTML=renderResult(rows);}
   catch(error){form.querySelector('#pf-scenario-result').textContent=error.message;}
  });
 }
 launcher.addEventListener('click',()=>{panel.classList.add('open');show();});
 panel.querySelector('.pf-close').addEventListener('click',()=>panel.classList.remove('open'));
 panel.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>{tab=button.dataset.tab;show();}));
 show();
 return true;
}
if(typeof module!=='undefined'&&module.exports)module.exports={mount};
root.PrincipiaFinanceUI=Object.freeze({mount});
if(root.document){const boot=()=>{let attempts=0;const retry=()=>{if(!mount()&&attempts++<40)root.setTimeout(retry,250);};retry();};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof window!=='undefined'?window:globalThis);
