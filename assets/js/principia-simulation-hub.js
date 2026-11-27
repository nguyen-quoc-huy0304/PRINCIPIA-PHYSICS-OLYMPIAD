(function(root){
'use strict';
const KEY='principia:simulation-hub:v1';
const INITIAL_CASH=100000000;
const MAX_ITEMS=300;
const ASSETS=[
{id:'stocks',name:'Cổ phiếu',risk:'high'},{id:'bonds',name:'Trái phiếu',risk:'low'},{id:'funds',name:'Quỹ mở / ETF',risk:'medium'},
{id:'gold',name:'Vàng',risk:'medium'},{id:'commodities',name:'Hàng hóa',risk:'high'},{id:'forex',name:'Ngoại tệ',risk:'high'},
{id:'crypto',name:'Crypto spot',risk:'very-high'},{id:'staking',name:'Staking',risk:'very-high'},{id:'defi',name:'DeFi / LP',risk:'very-high'},
{id:'real-estate',name:'Bất động sản',risk:'high'},{id:'collectibles',name:'Tài sản sưu tầm',risk:'high'},{id:'vehicles',name:'Xe / máy móc',risk:'medium'},
{id:'domains',name:'Tên miền / tài sản số',risk:'high'},{id:'startup',name:'Startup / góp vốn',risk:'very-high'},{id:'private-equity',name:'Private equity',risk:'very-high'}
];
const n=(v,label,min=0,max=1e12)=>{const x=Number(v);if(!Number.isFinite(x)||x<min||x>max)throw new RangeError(label+' không hợp lệ.');return x;};
const s=(v,label,max=100)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new TypeError(label+' không hợp lệ.');return v.trim();};
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
function createEngine({storage,now}={}){
 const store=storage||root.localStorage,clock=typeof now==='function'?now:()=>new Date().toISOString();
 const initial=()=>({cash:INITIAL_CASH,startingCash:INITIAL_CASH,day:0,positions:[],deposits:[],bonds:[],loans:[],properties:[],businesses:[],farms:[],insurance:[],pension:0,pensionRate:0,taxPaid:0,ledger:[],createdAt:clock(),updatedAt:clock()});
 function clean(raw){
  if(!raw||typeof raw!=='object')return initial();
  const base=initial();
  for(const k of ['positions','deposits','bonds','loans','properties','businesses','farms','insurance','ledger'])base[k]=Array.isArray(raw[k])?raw[k].slice(-MAX_ITEMS):[];
  for(const k of ['cash','startingCash','day','pension','pensionRate','taxPaid'])base[k]=Number.isFinite(raw[k])&&raw[k]>=0?raw[k]:base[k];
  base.createdAt=typeof raw.createdAt==='string'?raw.createdAt:base.createdAt;
  base.updatedAt=typeof raw.updatedAt==='string'?raw.updatedAt:base.updatedAt;
  return base;
 }
 let state;
 try{state=clean(JSON.parse(store&&store.getItem(KEY)||'null'));}catch(_){state=initial();}
 const snap=()=>JSON.parse(JSON.stringify(state));
 function commit(fn){const prev=state;state=snap();try{const result=fn();state.updatedAt=clock();if(store)store.setItem(KEY,JSON.stringify(state));return result===undefined?snap():result;}catch(e){state=prev;throw e;}}
 function debit(amount){if(state.cash+1e-8<amount)throw new Error('Không đủ vốn ảo.');state.cash=round(state.cash-amount);}
 function credit(amount){state.cash=round(state.cash+amount);if(!Number.isSafeInteger(Math.round(state.cash)))throw new RangeError('Số dư vượt giới hạn an toàn.');}
 function log(type,description,amount=0){state.ledger.push({id:'sim-'+state.day+'-'+state.ledger.length+'-'+Math.random().toString(36).slice(2,7),day:state.day,type,description,amount:round(amount),mode:'SIMULATION_ONLY',at:clock()});if(state.ledger.length>MAX_ITEMS)state.ledger.shift();}
 function buy(input){
  const symbol=s(input.symbol,'Mã tài sản',24).toUpperCase(),name=s(input.name||input.symbol,'Tên tài sản',100),asset=ASSETS.find(x=>x.id===input.asset);
  if(!asset)throw new TypeError('Loại tài sản không được hỗ trợ.');
  const qty=n(input.quantity,'Số lượng',0.00000001,1e9),price=n(input.price,'Giá',0.0001,1e12),fee=n(input.feeRate==null?.0015:input.feeRate,'Phí',0,.1),cost=round(qty*price*(1+fee));
  return commit(()=>{debit(cost);let p=state.positions.find(x=>x.symbol===symbol&&x.asset===asset.id);if(!p){if(state.positions.length>=MAX_ITEMS)throw new Error('Đã đạt giới hạn tài sản.');p={symbol,name,asset:asset.id,quantity:0,averageCost:0,markPrice:null,source:'Chưa định giá'};state.positions.push(p);}const old=p.quantity;p.averageCost=round((old*p.averageCost+cost)/(old+qty));p.quantity=round(old+qty);p.name=name;log('BUY','Mua '+name,cost);return snap();});
 }
 function sell({symbol,quantity,price,feeRate=.0015}){
  const key=s(symbol,'Mã tài sản',24).toUpperCase(),qty=n(quantity,'Số lượng',.00000001,1e9),px=n(price,'Giá',.0001,1e12),fee=n(feeRate,'Phí',0,.1);
  return commit(()=>{const p=state.positions.find(x=>x.symbol===key);if(!p||p.quantity+1e-9<qty)throw new Error('Số lượng bán vượt vị thế.');const proceeds=round(qty*px*(1-fee));p.quantity=round(p.quantity-qty);credit(proceeds);log('SELL','Bán '+p.name,proceeds);if(p.quantity<1e-9)state.positions=state.positions.filter(x=>x!==p);return snap();});
 }
 function mark({symbol,price,source}){const key=s(symbol,'Mã tài sản',24).toUpperCase(),px=n(price,'Giá tham chiếu',.0001,1e12),label=s(source,'Nguồn giá',120);return commit(()=>{const p=state.positions.find(x=>x.symbol===key);if(!p)throw new Error('Không tìm thấy vị thế.');p.markPrice=px;p.source=label;log('MARK','Định giá '+key,0);return snap();});}
 function openDeposit({name,amount,annualRate,days}){const label=s(name||'Tiền gửi kỳ hạn','Tên khoản gửi',100),principal=n(amount,'Số tiền',1,1e12),rate=n(annualRate,'Lãi suất',0,.5),term=n(days,'Kỳ hạn',1,3650);return commit(()=>{debit(principal);state.deposits.push({id:'dep-'+state.day+'-'+state.deposits.length,name:label,principal,annualRate:rate,termDays:term,remainingDays:term,interest:0});log('DEPOSIT','Mở tiền gửi '+label,principal);return snap();});}
 function buyBond({name,principal,couponRate,days}){const label=s(name,'Tên trái phiếu',100),amount=n(principal,'Mệnh giá',1,1e12),rate=n(couponRate,'Coupon',0,.5),term=n(days,'Kỳ hạn',1,36500);return commit(()=>{debit(amount);state.bonds.push({id:'bond-'+state.day+'-'+state.bonds.length,name:label,principal:amount,couponRate:rate,remainingDays:term,accrued:0});log('BOND','Mua trái phiếu '+label,amount);return snap();});}
 function borrow({name,amount,annualRate,days}){const label=s(name||'Khoản vay mô phỏng','Tên khoản vay',100),principal=n(amount,'Số tiền vay',1,1e12),rate=n(annualRate,'Lãi vay',0,2),term=n(days,'Kỳ hạn',1,36500);return commit(()=>{credit(principal);state.loans.push({id:'loan-'+state.day+'-'+state.loans.length,name:label,principal,balance:principal,annualRate:rate,remainingDays:term,accrued:0});log('BORROW','Giải ngân khoản vay '+label,principal);return snap();});}
 function repay({loanId,amount}){const id=s(loanId,'Mã khoản vay',100),paid=n(amount,'Số tiền trả',.01,1e12);return commit(()=>{const loan=state.loans.find(x=>x.id===id);if(!loan)throw new Error('Không tìm thấy khoản vay.');const due=round(loan.balance+loan.accrued),value=Math.min(due,paid);debit(value);loan.balance=round(Math.max(0,loan.balance-(value-loan.accrued)));loan.accrued=round(Math.max(0,loan.accrued-value));if(loan.balance<.01&&loan.accrued<.01)state.loans=state.loans.filter(x=>x!==loan);log('REPAY','Trả nợ '+loan.name,value);return snap();});}
 function acquireProperty({name,price,monthlyRent,occupancy=.9,monthlyCost=0}){const label=s(name,'Tên bất động sản',100),value=n(price,'Giá mua',1,1e12),rent=n(monthlyRent,'Tiền thuê tháng',0,1e10),occ=n(occupancy,'Tỷ lệ lấp đầy',0,1),cost=n(monthlyCost,'Chi phí tháng',0,1e10);return commit(()=>{debit(value);state.properties.push({id:'prop-'+state.day+'-'+state.properties.length,name:label,price:value,monthlyRent:rent,occupancy:occ,monthlyCost:cost,months:0});log('PROPERTY','Mua bất động sản '+label,value);return snap();});}
 function createBusiness({name,capital,monthlyRevenue,monthlyCost,taxRate=.2}){const label=s(name,'Tên doanh nghiệp',100),cap=n(capital,'Vốn doanh nghiệp',1,1e12),rev=n(monthlyRevenue,'Doanh thu tháng',0,1e12),cost=n(monthlyCost,'Chi phí tháng',0,1e12),tax=n(taxRate,'Thuế suất',0,.5);return commit(()=>{debit(cap);state.businesses.push({id:'biz-'+state.day+'-'+state.businesses.length,name:label,cash:cap,monthlyRevenue:rev,monthlyCost:cost,taxRate:tax,months:0,profit:0});log('BUSINESS','Thành lập '+label,cap);return snap();});}
 function startFarm({name,hectares,costPerHectare,yieldPerHectare,pricePerUnit,days,spoilage=0}){const label=s(name,'Tên cây trồng',100),area=n(hectares,'Diện tích',.01,1e6),cost=n(costPerHectare,'Chi phí/ha',0,1e10),yieldQty=n(yieldPerHectare,'Sản lượng/ha',0,1e9),price=n(pricePerUnit,'Giá bán',0,1e9),term=n(days,'Chu kỳ',1,730),loss=n(spoilage,'Hao hụt',0,1);return commit(()=>{const investment=round(area*cost);debit(investment);state.farms.push({id:'farm-'+state.day+'-'+state.farms.length,name:label,hectares:area,yieldPerHectare:yieldQty,pricePerUnit:price,remainingDays:term,spoilage:loss,cost:investment});log('FARM','Gieo trồng '+label,investment);return snap();});}
 function insure({name,premium,coverage,days}){const label=s(name,'Tên hợp đồng',100),fee=n(premium,'Phí bảo hiểm',0,1e12),cover=n(coverage,'Mức bảo vệ',0,1e12),term=n(days,'Thời hạn',1,36500);return commit(()=>{debit(fee);state.insurance.push({id:'ins-'+state.day+'-'+state.insurance.length,name:label,premium:fee,coverage:cover,remainingDays:term,active:true});log('INSURANCE','Mua bảo hiểm '+label,fee);return snap();});}
 function claim({policyId,lossAmount}){const id=s(policyId,'Mã hợp đồng',100),loss=n(lossAmount,'Thiệt hại',.01,1e12);return commit(()=>{const policy=state.insurance.find(x=>x.id===id&&x.active);if(!policy)throw new Error('Hợp đồng bảo hiểm không hoạt động.');const payout=Math.min(policy.coverage,loss);credit(payout);policy.active=false;log('CLAIM','Bồi thường '+policy.name,payout);return snap();});}
 function contributePension({amount,annualReturn=0}){const value=n(amount,'Khoản đóng',1,1e12),rate=n(annualReturn,'Tỷ suất mô phỏng',0,.5);return commit(()=>{debit(value);state.pension=round(state.pension+value);state.pensionRate=rate;log('PENSION','Đóng quỹ hưu trí',value);return snap();});}
 function assessTax({base,rate,label}){const taxable=n(base,'Cơ sở tính thuế',0,1e12),taxRate=n(rate,'Thuế suất',0,.5),name=s(label||'Thuế mô phỏng','Tên thuế',80),tax=round(taxable*taxRate);return commit(()=>{debit(tax);state.taxPaid=round(state.taxPaid+tax);log('TAX',name,tax);return{tax,state:snap()};});}
 function advance(days=1){
  const count=n(days,'Số ngày',1,3650);
  if(!Number.isInteger(count))throw new TypeError('Số ngày phải là số nguyên.');
  return commit(()=>{
   for(let d=0;d<count;d++){
    state.day++;
    for(const deposit of state.deposits){
     deposit.interest=round((deposit.principal+deposit.interest)*deposit.annualRate/365);
     deposit.remainingDays--;
     if(deposit.remainingDays<=0){
      const payout=round(deposit.principal+deposit.interest);
      credit(payout);log('MATURITY','Đáo hạn '+deposit.name,payout);deposit.matured=true;
     }
    }
    state.deposits=state.deposits.filter(item=>!item.matured);
    for(const bond of state.bonds){
     bond.accrued=round(bond.accrued+bond.principal*bond.couponRate/365);
     bond.remainingDays--;
     if(bond.remainingDays<=0){
      const payout=round(bond.principal+bond.accrued);
      credit(payout);log('BOND_MATURITY','Đáo hạn '+bond.name,payout);bond.matured=true;
     }
    }
    state.bonds=state.bonds.filter(item=>!item.matured);
    for(const loan of state.loans){
     loan.accrued=round(loan.accrued+loan.balance*loan.annualRate/365);
     loan.remainingDays=Math.max(0,loan.remainingDays-1);
    }
    if(state.day%30===0){
     for(const property of state.properties){
      const rent=round(property.monthlyRent*property.occupancy);
      const net=rent-property.monthlyCost;
      if(net>=0)credit(net);else debit(Math.min(state.cash,-net));
      log('RENT','Thuê '+property.name,net);property.months++;
     }
     for(const business of state.businesses){
      const gross=business.monthlyRevenue-business.monthlyCost;
      const tax=round(Math.max(0,gross)*business.taxRate);
      const net=gross-tax;
      business.cash=round(business.cash+net);
      business.profit=round(business.profit+net);
      log('BUSINESS_MONTH','Kỳ kinh doanh '+business.name,net);
      business.months++;
     }
    }
    for(const farm of state.farms){
     farm.remainingDays--;
     if(farm.remainingDays<=0){
      const revenue=round(farm.hectares*farm.yieldPerHectare*(1-farm.spoilage)*farm.pricePerUnit);
      credit(revenue);log('HARVEST','Thu hoạch '+farm.name,revenue);farm.harvested=true;
     }
    }
    state.farms=state.farms.filter(item=>!item.harvested);
    for(const policy of state.insurance){
     policy.remainingDays--;
     if(policy.remainingDays<=0)policy.active=false;
    }
    if(state.pension>0)state.pension=round(state.pension*(1+(state.pensionRate||0)/365));
   }
   return snap();
  });
 }
 function summary(){const holdings=state.positions.reduce((a,p)=>a+(p.markPrice==null?p.quantity*p.averageCost:p.quantity*p.markPrice),0),propertyValue=state.properties.reduce((a,p)=>a+p.price,0),businessValue=state.businesses.reduce((a,b)=>a+b.cash,0),debt=state.loans.reduce((a,l)=>a+l.balance+l.accrued,0),deposits=state.deposits.reduce((a,d)=>a+d.principal+d.interest,0),bonds=state.bonds.reduce((a,b)=>a+b.principal+b.accrued,0);return{...snap(),assets:round(state.cash+holdings+propertyValue+businessValue+deposits+bonds+state.pension),debt:round(debt),netWorth:round(state.cash+holdings+propertyValue+businessValue+deposits+bonds+state.pension-debt),holdings:round(holdings),virtualOnly:true};}
 function reset(){return commit(()=>{state=initial();return snap();});}
 return Object.freeze({getState:snap,getSummary:summary,buy,sell,mark,openDeposit,buyBond,borrow,repay,acquireProperty,createBusiness,startFarm,insure,claim,contributePension,assessTax,advance,reset,assets:ASSETS});
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function mount(){
 const panel=root.document&&root.document.getElementById('principia-economy-root'),tabs=panel&&panel.querySelector('.pe-tabs'),content=panel&&panel.querySelector('#pe-content');
 if(!panel||!tabs||!content||panel.dataset.simulationHubReady)return false;
 panel.dataset.simulationHubReady='1';const button=root.document.createElement('button');button.type='button';button.textContent='Mô phỏng toàn diện';tabs.appendChild(button);const engine=createEngine();
 button.addEventListener('click',()=>{tabs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));button.classList.add('active');render(content,engine);});return true;
}
function render(el,engine){
 const x=engine.getSummary(),fmt=v=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(v)+' ₫';
 const rows=(title,items,renderRow)=>'<h3>'+title+'</h3>'+(items.length?items.map(renderRow).join(''):'<p class="ps-muted">Chưa có dữ liệu.</p>');
 el.innerHTML='<section class="ps-hub"><header><b>PRINCIPIA · ECONOMY SIMULATOR</b><p>100% tiền ảo · Không nạp/rút · Không gửi lệnh ra thị trường thật · Dữ liệu giá do người dùng nhập hoặc nguồn tham chiếu được ghi nhãn.</p></header><div class="ps-stats"><article><small>Tiền ảo</small><strong>'+fmt(x.cash)+'</strong></article><article><small>Tổng tài sản</small><strong>'+fmt(x.assets)+'</strong></article><article><small>Nợ</small><strong>'+fmt(x.debt)+'</strong></article><article><small>Tài sản ròng</small><strong>'+fmt(x.netWorth)+'</strong></article><article><small>Ngày mô phỏng</small><strong>'+x.day+'</strong></article></div><nav class="ps-actions"><button data-action="advance">Tiến 30 ngày</button><button data-action="reset">Đặt lại toàn bộ</button></nav><div class="ps-grid"><form data-form="asset"><h3>Đầu tư tài sản</h3><label>Nhóm tài sản<select name="asset">'+engine.assets.map(a=>'<option value="'+a.id+'">'+a.name+' · rủi ro '+a.risk+'</option>').join('')+'</select></label><label>Mã tài sản<input name="symbol" maxlength="24" required placeholder="FPT / BTC / GOLD"></label><label>Tên tài sản<input name="name" maxlength="100" required></label><label>Số lượng<input name="quantity" type="number" min=".00000001" step="any" required></label><label>Giá mua (VND)<input name="price" type="number" min=".0001" step="any" required></label><button>Mua bằng vốn ảo</button></form><form data-form="mark"><h3>Định giá vị thế</h3><label>Mã tài sản<input name="symbol" maxlength="24" required></label><label>Giá tham chiếu<input name="price" type="number" min=".0001" step="any" required></label><label>Nguồn và thời điểm<input name="source" maxlength="120" required placeholder="Nhập thủ công · 27/11/2026"></label><button>Cập nhật giá</button></form><form data-form="deposit"><h3>Tiền gửi kỳ hạn</h3><label>Tên khoản gửi<input name="name" required></label><label>Số tiền<input name="amount" type="number" min="1" required></label><label>Lãi suất năm (vd 0.06 = 6%)<input name="annualRate" type="number" min="0" max=".5" step=".001" required></label><label>Kỳ hạn (ngày)<input name="days" type="number" min="1" max="3650" required></label><button>Mở tiền gửi ảo</button></form><form data-form="bond"><h3>Trái phiếu</h3><label>Tên trái phiếu<input name="name" required></label><label>Giá mua / mệnh giá<input name="principal" type="number" min="1" required></label><label>Coupon năm<input name="couponRate" type="number" min="0" max=".5" step=".001" required></label><label>Kỳ hạn (ngày)<input name="days" type="number" min="1" required></label><button>Mua trái phiếu ảo</button></form><form data-form="loan"><h3>Khoản vay mô phỏng</h3><label>Tên khoản vay<input name="name" required></label><label>Số tiền vay<input name="amount" type="number" min="1" required></label><label>Lãi suất năm<input name="annualRate" type="number" min="0" max="2" step=".001" required></label><label>Kỳ hạn ngày<input name="days" type="number" min="1" required></label><button>Giải ngân vốn ảo</button></form><form data-form="property"><h3>Bất động sản cho thuê</h3><label>Tên tài sản<input name="name" required></label><label>Giá mua<input name="price" type="number" min="1" required></label><label>Tiền thuê/tháng<input name="monthlyRent" type="number" min="0" required></label><label>Lấp đầy 0–1<input name="occupancy" type="number" min="0" max="1" step=".01" value=".9" required></label><label>Chi phí/tháng<input name="monthlyCost" type="number" min="0" value="0" required></label><button>Mua BĐS ảo</button></form><form data-form="business"><h3>Vận hành doanh nghiệp</h3><label>Tên doanh nghiệp<input name="name" required></label><label>Vốn ban đầu<input name="capital" type="number" min="1" required></label><label>Doanh thu/tháng<input name="monthlyRevenue" type="number" min="0" required></label><label>Chi phí/tháng (nhân sự, hàng hóa, vận hành)<input name="monthlyCost" type="number" min="0" required></label><label>Thuế suất 0–0.5<input name="taxRate" type="number" min="0" max=".5" step=".01" value=".2" required></label><button>Thành lập doanh nghiệp ảo</button></form><form data-form="farm"><h3>Nông nghiệp / sản xuất</h3><label>Cây trồng<input name="name" required></label><label>Diện tích (ha)<input name="hectares" type="number" min=".01" required></label><label>Chi phí/ha<input name="costPerHectare" type="number" min="0" required></label><label>Sản lượng/ha<input name="yieldPerHectare" type="number" min="0" required></label><label>Giá bán/đơn vị<input name="pricePerUnit" type="number" min="0" required></label><label>Chu kỳ ngày<input name="days" type="number" min="1" required></label><label>Hao hụt 0–1<input name="spoilage" type="number" min="0" max="1" step=".01" value="0" required></label><button>Gieo trồng mô phỏng</button></form><form data-form="insurance"><h3>Bảo hiểm</h3><label>Tên hợp đồng<input name="name" required></label><label>Phí bảo hiểm<input name="premium" type="number" min="0" required></label><label>Mức bảo vệ<input name="coverage" type="number" min="0" required></label><label>Thời hạn ngày<input name="days" type="number" min="1" required></label><button>Mua bảo hiểm ảo</button></form><form data-form="pension"><h3>Hưu trí dài hạn</h3><label>Khoản đóng<input name="amount" type="number" min="1" required></label><label>Lợi suất giả định năm<input name="annualReturn" type="number" min="0" max=".5" step=".001" value=".05" required></label><button>Đóng quỹ hưu trí ảo</button></form><form data-form="tax"><h3>Thuế & ngân sách</h3><label>Cơ sở tính thuế<input name="base" type="number" min="0" required></label><label>Thuế suất 0–0.5<input name="rate" type="number" min="0" max=".5" step=".001" required></label><label>Loại thuế<input name="label" maxlength="80" required placeholder="VAT / thu nhập / doanh nghiệp"></label><button>Nộp thuế mô phỏng</button></form></div><p class="ps-status" role="status" aria-live="polite"></p>'+rows('Danh mục tài sản',x.positions,p=>'<article class="ps-row"><b>'+esc(p.symbol)+' · '+esc(p.name)+'</b><span>'+p.quantity+' đơn vị · giá vốn '+fmt(p.averageCost)+' · '+(p.markPrice==null?'chưa định giá':'giá tham chiếu '+fmt(p.markPrice))+'</span><small>'+esc(p.source)+'</small></article>')+rows('Tiền gửi',x.deposits,p=>'<p>'+esc(p.name)+' · '+fmt(p.principal)+' · lãi tạm tính '+fmt(p.interest)+' · còn '+p.remainingDays+' ngày</p>')+rows('Trái phiếu',x.bonds,p=>'<p>'+esc(p.name)+' · '+fmt(p.principal)+' · coupon tích lũy '+fmt(p.accrued)+'</p>')+rows('Khoản vay',x.loans,p=>'<p>'+esc(p.name)+' · dư nợ '+fmt(p.balance+p.accrued)+' · <button type="button" data-repay="'+esc(p.id)+'">Trả hết khoản vay</button></p>')+rows('Bất động sản',x.properties,p=>'<p>'+esc(p.name)+' · '+fmt(p.price)+' · thuê/tháng '+fmt(p.monthlyRent*p.occupancy-p.monthlyCost)+'</p>')+rows('Doanh nghiệp',x.businesses,p=>'<p>'+esc(p.name)+' · tiền DN '+fmt(p.cash)+' · lãi lũy kế '+fmt(p.profit)+'</p>')+rows('Nông nghiệp',x.farms,p=>'<p>'+esc(p.name)+' · '+p.hectares+' ha · còn '+p.remainingDays+' ngày</p>')+rows('Bảo hiểm',x.insurance,p=>'<p>'+esc(p.name)+' · hạn mức '+fmt(p.coverage)+' · '+(p.active?'còn hiệu lực':'hết hiệu lực')+(p.active?' · <button type="button" data-claim="'+esc(p.id)+'">Khai báo tổn thất mô phỏng</button>':'')+'</p>')+'<h3>Quỹ hưu trí: '+fmt(x.pension)+' · Thuế đã nộp: '+fmt(x.taxPaid)+'</h3>'+rows('Lịch sử',x.ledger.slice().reverse().slice(0,30),p=>'<p class="ps-ledger"><b>'+esc(p.type)+'</b> · '+esc(p.description)+' · '+fmt(p.amount)+' · ngày '+p.day+'</p>')+'</section>';
 const status=el.querySelector('.ps-status');
 const actions={asset:d=>engine.buy({...d,quantity:Number(d.quantity),price:Number(d.price)}),mark:d=>engine.mark({...d,price:Number(d.price)}),deposit:d=>engine.openDeposit({...d,amount:Number(d.amount),annualRate:Number(d.annualRate),days:Number(d.days)}),bond:d=>engine.buyBond({...d,principal:Number(d.principal),couponRate:Number(d.couponRate),days:Number(d.days)}),loan:d=>engine.borrow({...d,amount:Number(d.amount),annualRate:Number(d.annualRate),days:Number(d.days)}),property:d=>engine.acquireProperty({...d,price:Number(d.price),monthlyRent:Number(d.monthlyRent),occupancy:Number(d.occupancy),monthlyCost:Number(d.monthlyCost)}),business:d=>engine.createBusiness({...d,capital:Number(d.capital),monthlyRevenue:Number(d.monthlyRevenue),monthlyCost:Number(d.monthlyCost),taxRate:Number(d.taxRate)}),farm:d=>engine.startFarm({...d,hectares:Number(d.hectares),costPerHectare:Number(d.costPerHectare),yieldPerHectare:Number(d.yieldPerHectare),pricePerUnit:Number(d.pricePerUnit),days:Number(d.days),spoilage:Number(d.spoilage)}),insurance:d=>engine.insure({...d,premium:Number(d.premium),coverage:Number(d.coverage),days:Number(d.days)}),pension:d=>engine.contributePension({amount:Number(d.amount),annualReturn:Number(d.annualReturn)}),tax:d=>engine.assessTax({...d,base:Number(d.base),rate:Number(d.rate)})};
 el.querySelectorAll('form[data-form]').forEach(form=>form.addEventListener('submit',event=>{event.preventDefault();try{const data=Object.fromEntries(new FormData(form).entries());actions[form.dataset.form](data);render(el,engine);}catch(e){status.textContent=e.message;}}));
 el.querySelector('[data-action="advance"]').addEventListener('click',()=>{try{engine.advance(30);render(el,engine);}catch(e){status.textContent=e.message;}});
 el.querySelector('[data-action="reset"]').addEventListener('click',()=>{if(root.confirm('Xóa toàn bộ dữ liệu mô phỏng và khởi tạo lại vốn ảo?'))render(el,engine.reset());});
 el.querySelectorAll('[data-repay]').forEach(btn=>btn.addEventListener('click',()=>{try{const loan=engine.getState().loans.find(v=>v.id===btn.dataset.repay);engine.repay({loanId:loan.id,amount:loan.balance+loan.accrued});render(el,engine);}catch(e){status.textContent=e.message;}}));
 el.querySelectorAll('[data-claim]').forEach(btn=>btn.addEventListener('click',()=>{
  const policy=engine.getState().insurance.find(v=>v.id===btn.dataset.claim);
  if(!policy)return;
  const raw=root.prompt('Nhập số tiền thiệt hại mô phỏng (VND):',String(policy.coverage));
  if(raw===null)return;
  try{engine.claim({policyId:policy.id,lossAmount:Number(raw)});render(el,engine);}
  catch(e){status.textContent=e.message;}
 }));
}
if(typeof module!=='undefined'&&module.exports)module.exports={createEngine,INITIAL_CASH,ASSETS,KEY};
root.PrincipiaSimulationHub=Object.freeze({createEngine,INITIAL_CASH,ASSETS});
if(root.document){const start=()=>{let tries=0;const retry=()=>{if(!mount()&&++tries<40)root.setTimeout(retry,250);};retry();};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',start,{once:true});else start();}
})(typeof window!=='undefined'?window:globalThis);
