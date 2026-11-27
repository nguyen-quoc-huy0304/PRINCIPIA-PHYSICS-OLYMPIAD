(function(root){
'use strict';
const KEY='principia:macro-society:v1',MAX=500;
const num=(v,k,min=0,max=1e12)=>{const x=Number(v);if(!Number.isFinite(x)||x<min||x>max)throw new RangeError(k+' không hợp lệ.');return x;};
const str=(v,k,max=100)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new TypeError(k+' không hợp lệ.');return v.trim();};
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
function createEngine({storage,now}={}){
 const store=storage||root.localStorage,clock=now||(()=>new Date().toISOString());
 const initial=()=>({month:0,cpi:100,policyRate:.04,unemployment:0,treasury:10000000000,households:[],firms:[],goods:[],history:[],moneySupply:100000000000,createdAt:clock()});
 let state;try{state=JSON.parse(store&&store.getItem(KEY)||'null')||initial();}catch(_){state=initial();}
 for(const k of ['households','firms','goods','history'])if(!Array.isArray(state[k]))state[k]=[];
 const snap=()=>JSON.parse(JSON.stringify(state));
 function commit(fn){const prev=state;state=snap();try{const result=fn();if(store)store.setItem(KEY,JSON.stringify(state));return result===undefined?snap():result;}catch(e){state=prev;throw e;}}
 function createHousehold({name,savings,monthlyIncome,consumptionRate=.7,skills='general'}){const label=str(name,'Tên hộ gia đình'),cash=num(savings,'Tiết kiệm',0,1e12),income=num(monthlyIncome,'Thu nhập tháng',0,1e10),rate=num(consumptionRate,'Tỷ lệ tiêu dùng',0,1),skill=str(skills,'Kỹ năng',60);return commit(()=>{if(state.households.length>=MAX)throw new Error('Đạt giới hạn hộ gia đình.');const h={id:'hh-'+(state.households.length+1)+'-'+state.month,name:label,savings:cash,monthlyIncome:income,consumptionRate:rate,skills:skill,employed:income>0,consumption:0,utility:0};state.households.push(h);return snap();});}
 function createFirm({name,sector,capital,monthlyWage,employees,capacity,unitCost,unitPrice,productivity=1}){const label=str(name,'Tên doanh nghiệp'),industry=str(sector,'Ngành',60),funds=num(capital,'Vốn',0,1e12),wage=num(monthlyWage,'Lương tháng',0,1e9),staff=num(employees,'Nhân sự',0,1e6),output=num(capacity,'Công suất',0,1e9),cost=num(unitCost,'Chi phí đơn vị',0,1e9),price=num(unitPrice,'Giá bán',.01,1e9),prod=num(productivity,'Năng suất',.01,100);return commit(()=>{if(state.firms.length>=MAX)throw new Error('Đạt giới hạn doanh nghiệp.');const f={id:'firm-'+(state.firms.length+1)+'-'+state.month,name:label,sector:industry,capital:funds,monthlyWage:wage,employees:staff,capacity:output,unitCost:cost,unitPrice:price,productivity:prod,inventory:0,revenue:0,profit:0,produced:0,sold:0,alive:true};state.firms.push(f);return snap();});}
 function setPolicy({policyRate,governmentSpending,taxRate}){const rate=num(policyRate,'Lãi suất điều hành',0,.5),spending=num(governmentSpending,'Chi tiêu công',0,1e12),tax=num(taxRate,'Thuế suất doanh nghiệp',0,.5);return commit(()=>{state.policyRate=rate;state.governmentSpending=spending;state.corporateTaxRate=tax;return snap();});}
 function hire({firmId,workers}){const id=str(firmId,'Doanh nghiệp',100),count=num(workers,'Số lao động',1,1e6);if(!Number.isInteger(count))throw new TypeError('Số lao động phải là số nguyên.');return commit(()=>{const f=state.firms.find(x=>x.id===id&&x.alive);if(!f)throw new Error('Không tìm thấy doanh nghiệp.');f.employees=Math.min(1e6,f.employees+count);return snap();});}
 function setPrice({firmId,unitPrice}){const id=str(firmId,'Doanh nghiệp',100),price=num(unitPrice,'Giá bán',.01,1e9);return commit(()=>{const f=state.firms.find(x=>x.id===id);if(!f)throw new Error('Không tìm thấy doanh nghiệp.');f.unitPrice=price;return snap();});}
 function advance(months=1){
  const count=num(months,'Số tháng',1,120);
  if(!Number.isInteger(count))throw new TypeError('Số tháng phải là số nguyên.');
  return commit(()=>{
   for(let m=0;m<count;m++){
    state.month++;
    let wageBill=0,totalOutput=0,totalSupplyValue=0,totalSales=0,totalDemand=0,totalTax=0,totalIncome=0;
    for(const firm of state.firms){
     if(!firm.alive)continue;
     const labor=Math.min(firm.employees,firm.capacity*firm.productivity);
     const wages=round(labor*firm.monthlyWage);
     wageBill+=wages;
     const availableCapital=Math.max(0,firm.capital-wages);
     const affordableOutput=availableCapital/Math.max(.01,firm.unitCost);
     const produced=Math.min(firm.capacity*firm.productivity,affordableOutput);
     firm.produced=round(produced);
     firm.inventory=round(firm.inventory+produced);
     totalOutput+=produced;
     totalSupplyValue+=produced*firm.unitPrice;
    }
    for(const household of state.households){
     const gross=round(household.monthlyIncome);
     const incomeTax=round(gross*.03);
     const disposable=round(gross-incomeTax);
     const spending=round(disposable*household.consumptionRate);
     household.savings=round(Math.max(0,household.savings+disposable-spending));
     household.consumption=spending;
     household.utility=round(Math.log1p(spending));
     totalIncome+=gross;
     totalTax+=incomeTax;
     totalDemand+=spending;
    }
    let unfilledDemand=totalDemand;
    for(const firm of state.firms){
     if(!firm.alive)continue;
     const sold=round(Math.min(firm.inventory,unfilledDemand/Math.max(.01,firm.unitPrice)));
     const revenue=round(sold*firm.unitPrice);
     const cost=round(sold*firm.unitCost);
     const labor=Math.min(firm.employees,firm.capacity*firm.productivity);
     const wages=round(labor*firm.monthlyWage);
     const profit=round(revenue-cost-wages);
     firm.inventory=round(Math.max(0,firm.inventory-sold));
     firm.sold=sold;
     firm.revenue=revenue;
     firm.profit=profit;
     firm.capital=round(firm.capital+profit);
     totalSales+=revenue;
     unfilledDemand=Math.max(0,unfilledDemand-revenue);
     if(profit>0){
      const tax=round(profit*(state.corporateTaxRate??.2));
      firm.capital=round(firm.capital-tax);
      totalTax+=tax;
     }
     if(firm.capital<0)firm.alive=false;
    }
    const demandSupply=totalSupplyValue>0?totalDemand/totalSupplyValue:1;
    const inflation=totalSupplyValue>0?Math.max(-.05,Math.min(.1,(demandSupply-1)*.015)):0;
    state.cpi=round(state.cpi*(1+inflation));
    const employed=state.households.filter(h=>h.employed).length;
    state.unemployment=state.households.length?round((state.households.length-employed)/state.households.length):0;
    const governmentSpending=state.governmentSpending||0;
    state.treasury=round(state.treasury+totalTax-governmentSpending);
    state.moneySupply=round(Math.max(0,state.moneySupply+governmentSpending-totalTax));
    state.history.push({month:state.month,cpi:state.cpi,inflation,unemployment:state.unemployment,output:round(totalOutput),demand:round(totalDemand),sales:round(totalSales),wages:round(wageBill),income:round(totalIncome),tax:round(totalTax),treasury:state.treasury,policyRate:state.policyRate});
    if(state.history.length>MAX)state.history.shift();
   }
   return snap();
  });
 }
 function summary(){const employed=state.households.filter(h=>h.employed).length;return{...snap(),population:state.households.length,employed,unemployed:state.households.length-employed,totalSavings:round(state.households.reduce((a,h)=>a+h.savings,0)),businesses:state.firms.filter(f=>f.alive).length,aggregateCapital:round(state.firms.reduce((a,f)=>a+f.capital,0)),latest:state.history.at(-1)||null,simulationOnly:true};}
 return Object.freeze({getState:snap,getSummary:summary,createHousehold,createFirm,setPolicy,hire,setPrice,advance});
}
function mount(){const panel=root.document&&root.document.getElementById('principia-economy-root'),tabs=panel&&panel.querySelector('.pe-tabs'),content=panel&&panel.querySelector('#pe-content');if(!panel||!tabs||!content||panel.dataset.macroSocietyReady)return false;const e=createEngine(),b=root.document.createElement('button');b.type='button';b.textContent='Xã hội & kinh tế vĩ mô';tabs.appendChild(b);panel.dataset.macroSocietyReady='1';b.addEventListener('click',()=>{tabs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(content,e);});return true;}
function render(el,e){const x=e.getSummary(),fmt=n=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(n)+' ₫',latest=x.latest;el.innerHTML='<section class="pms"><header><b>MACRO SOCIETY SIMULATOR</b><p>Mô hình vi mô/vĩ mô dựa trên giả định người dùng nhập; không phải số liệu thống kê thực tế.</p></header><div class="pms-stats"><article>Tháng <b>'+x.month+'</b></article><article>CPI <b>'+x.cpi.toFixed(2)+'</b></article><article>Thất nghiệp <b>'+(x.unemployment*100).toFixed(2)+'%</b></article><article>Ngân khố <b>'+fmt(x.treasury)+'</b></article><article>Hộ gia đình <b>'+x.population+'</b></article><article>Doanh nghiệp <b>'+x.businesses+'</b></article></div><div class="pms-grid"><form data-kind="house"><h3>Hộ gia đình</h3><input name="name" placeholder="Tên hộ" required><input name="savings" type="number" min="0" placeholder="Tiết kiệm" required><input name="monthlyIncome" type="number" min="0" placeholder="Thu nhập tháng" required><input name="consumptionRate" type="number" min="0" max="1" step=".01" value=".7" placeholder="Tỷ lệ tiêu dùng" required><input name="skills" placeholder="Kỹ năng" value="general"><button>Tạo hộ gia đình</button></form><form data-kind="firm"><h3>Doanh nghiệp</h3><input name="name" placeholder="Tên công ty" required><input name="sector" placeholder="Ngành nghề" required><input name="capital" type="number" min="0" placeholder="Vốn" required><input name="monthlyWage" type="number" min="0" placeholder="Lương/người/tháng" required><input name="employees" type="number" min="0" step="1" placeholder="Nhân viên" required><input name="capacity" type="number" min="0" placeholder="Công suất/tháng" required><input name="unitCost" type="number" min="0" placeholder="Chi phí/đơn vị" required><input name="unitPrice" type="number" min=".01" placeholder="Giá bán/đơn vị" required><input name="productivity" type="number" min=".01" max="100" step=".1" value="1" placeholder="Năng suất" required><button>Thành lập công ty</button></form><form data-kind="policy"><h3>Chính sách công</h3><input name="policyRate" type="number" min="0" max=".5" step=".001" value=".04" placeholder="Lãi suất điều hành" required><input name="governmentSpending" type="number" min="0" placeholder="Chi tiêu công/tháng" required><input name="taxRate" type="number" min="0" max=".5" step=".01" value=".2" placeholder="Thuế doanh nghiệp" required><button>Cập nhật chính sách</button></form></div><p class="pms-status" role="status"></p><h3>Doanh nghiệp đang hoạt động</h3>'+x.firms.map(f=>'<article><b>'+escapeHTML(f.name)+'</b> · '+escapeHTML(f.sector)+' · '+f.employees+' lao động · vốn '+fmt(f.capital)+' · tồn kho '+f.inventory+'<form data-hire="'+f.id+'"><input name="workers" type="number" min="1" step="1" placeholder="Tuyển thêm lao động" required><button>Tuyển dụng</button></form><form data-price="'+f.id+'"><input name="unitPrice" type="number" min=".01" step="any" placeholder="Giá mới" required><button>Đổi giá</button></form></article>').join('')+'<button type="button" data-advance>Chạy 1 tháng</button><button type="button" data-advance-year>Chạy 12 tháng</button><h3>Lịch sử kinh tế</h3>'+x.history.slice().reverse().slice(0,18).map(h=>'<p>Tháng '+h.month+' · CPI '+h.cpi+' · lạm phát '+(h.inflation*100).toFixed(2)+'% · thất nghiệp '+(h.unemployment*100).toFixed(2)+'% · sản lượng '+h.output+' · doanh số '+fmt(h.sales)+' · thuế '+fmt(h.tax)+'</p>').join('')+'</section>';
 const status=el.querySelector('.pms-status');el.querySelectorAll('form[data-kind]').forEach(f=>f.addEventListener('submit',ev=>{ev.preventDefault();const d=Object.fromEntries(new FormData(f));try{if(f.dataset.kind==='house')e.createHousehold({...d,savings:+d.savings,monthlyIncome:+d.monthlyIncome,consumptionRate:+d.consumptionRate});if(f.dataset.kind==='firm')e.createFirm({...d,capital:+d.capital,monthlyWage:+d.monthlyWage,employees:+d.employees,capacity:+d.capacity,unitCost:+d.unitCost,unitPrice:+d.unitPrice,productivity:+d.productivity});if(f.dataset.kind==='policy')e.setPolicy({policyRate:+d.policyRate,governmentSpending:+d.governmentSpending,taxRate:+d.taxRate});render(el,e);}catch(err){status.textContent=err.message;}}));el.querySelectorAll('form[data-hire]').forEach(f=>f.addEventListener('submit',ev=>{ev.preventDefault();try{e.hire({firmId:f.dataset.hire,workers:+new FormData(f).get('workers')});render(el,e);}catch(err){status.textContent=err.message;}}));el.querySelectorAll('form[data-price]').forEach(f=>f.addEventListener('submit',ev=>{ev.preventDefault();try{e.setPrice({firmId:f.dataset.price,unitPrice:+new FormData(f).get('unitPrice')});render(el,e);}catch(err){status.textContent=err.message;}}));el.querySelector('[data-advance]').addEventListener('click',()=>{e.advance(1);render(el,e);});el.querySelector('[data-advance-year]').addEventListener('click',()=>{e.advance(12);render(el,e);});}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
if(typeof module!=='undefined'&&module.exports)module.exports={createEngine,KEY};
root.PrincipiaMacroSociety=Object.freeze({createEngine});
if(root.document){const start=()=>{let n=0;const retry=()=>{if(!mount()&&++n<40)root.setTimeout(retry,250);};retry();};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window!=='undefined'?window:globalThis);
