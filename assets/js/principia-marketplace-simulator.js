(function(root){
'use strict';
const LIMITS=Object.freeze({
 initialBuyers:[0,1000000],newBuyers:[0,10000],buyerChurnPct:[0,100],
 newBuyerGrowthPct:[-20,10],ordersPerBuyer:[0,1000],averageOrderValue:[0,100000000],
 takeRatePct:[0,50],refundRatePct:[0,100],paymentFeePct:[0,30],
 variableCostPerOrder:[0,100000000],sellerSubsidyPerOrder:[0,100000000],
 buyerCAC:[0,1000000000],fixedCosts:[0,1000000000000],
 setupInvestment:[0,1000000000000],taxRatePct:[0,100]
});
const round=v=>Math.round((v+Number.EPSILON)*100)/100;
function numeric(v,label){
 if(v===null||v===undefined||typeof v==='boolean'||(typeof v==='string'&&!v.trim()))throw new TypeError(label+' phải là số.');
 const n=Number(v);if(!Number.isFinite(n))throw new TypeError(label+' phải là số hữu hạn.');return n;
}
function validate(input){
 if(!input||typeof input!=='object')throw new TypeError('Dữ liệu marketplace không hợp lệ.');
 const months=numeric(input.months,'Thời hạn');
 if(!Number.isInteger(months)||months<1||months>60)throw new RangeError('Thời hạn phải từ 1 đến 60 tháng.');
 const result={months};
 for(const [key,range] of Object.entries(LIMITS)){
  const value=numeric(input[key],key);
  if(value<range[0]||value>range[1])throw new RangeError(key+' ngoài phạm vi cho phép.');
  if(['initialBuyers','newBuyers'].includes(key)&&!Number.isInteger(value))throw new TypeError(key+' phải là số nguyên.');
  result[key]=value;
 }
 return Object.freeze(result);
}
function calculate(input){
 const d=validate(input);let buyers=d.initialBuyers,cash=-d.setupInvestment,payback=d.setupInvestment===0?0:null;
 let totalGMV=0,totalNetGMV=0,totalRevenue=0,totalFees=0,totalVariable=0,totalSubsidy=0,totalCAC=0,totalTax=0;
 const forecast=[];
 for(let month=1;month<=d.months;month+=1){
  const newBuyers=Math.round(d.newBuyers*Math.pow(1+d.newBuyerGrowthPct/100,month-1));
  const churnedBuyers=Math.min(buyers,Math.round(buyers*d.buyerChurnPct/100));
  buyers=buyers-churnedBuyers+newBuyers;
  const orders=Math.round(buyers*d.ordersPerBuyer);
  const gmv=round(orders*d.averageOrderValue);
  const netGMV=round(gmv*(1-d.refundRatePct/100));
  const platformRevenue=round(netGMV*d.takeRatePct/100);
  const paymentFees=round(netGMV*d.paymentFeePct/100);
  const variableCosts=round(orders*d.variableCostPerOrder);
  const sellerSubsidies=round(orders*d.sellerSubsidyPerOrder);
  const acquisitionCost=round(newBuyers*d.buyerCAC);
  const operatingProfit=round(platformRevenue-paymentFees-variableCosts-sellerSubsidies-acquisitionCost-d.fixedCosts);
  const tax=round(Math.max(0,operatingProfit)*d.taxRatePct/100);
  const netCashFlow=round(operatingProfit-tax);
  cash=round(cash+netCashFlow);
  totalGMV=round(totalGMV+gmv);totalNetGMV=round(totalNetGMV+netGMV);
  totalRevenue=round(totalRevenue+platformRevenue);totalFees=round(totalFees+paymentFees);
  totalVariable=round(totalVariable+variableCosts);totalSubsidy=round(totalSubsidy+sellerSubsidies);
  totalCAC=round(totalCAC+acquisitionCost);totalTax=round(totalTax+tax);
  if(payback===null&&cash>=0)payback=month;
  forecast.push(Object.freeze({month,buyers,newBuyers,churnedBuyers,orders,gmv,netGMV,platformRevenue,paymentFees,variableCosts,sellerSubsidies,acquisitionCost,tax,netCashFlow,cumulativeCash:cash}));
 }
 const contributionPerOrder=d.averageOrderValue*(1-d.refundRatePct/100)*(d.takeRatePct-d.paymentFeePct)/100-d.variableCostPerOrder-d.sellerSubsidyPerOrder;
 const breakEvenOrders=contributionPerOrder>0?Math.ceil((d.fixedCosts+d.newBuyers*d.buyerCAC)/contributionPerOrder):null;
 const last=forecast[forecast.length-1];
 return Object.freeze({
  months:d.months,finalBuyers:last.buyers,finalOrders:last.orders,finalGMV:last.gmv,
  finalPlatformRevenue:last.platformRevenue,finalNetCashFlow:last.netCashFlow,
  cumulativeCash:cash,paybackMonth:payback,contributionPerOrder:round(contributionPerOrder),
  breakEvenOrders,
  totals:Object.freeze({gmv:totalGMV,netGMV:totalNetGMV,platformRevenue:totalRevenue,paymentFees:totalFees,variableCosts:totalVariable,sellerSubsidies:totalSubsidy,buyerAcquisition:totalCAC,tax:totalTax}),
  forecast:Object.freeze(forecast)
 });
}
function escapeHTML(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const money=v=>new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(v);
const fmt=v=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(v);
function card(label,value){return '<article class="pe-market-metric"><small>'+escapeHTML(label)+'</small><b>'+escapeHTML(value)+'</b></article>';}
function field(label,name,value,min,max,step){return '<label>'+escapeHTML(label)+'<input type="number" name="'+name+'" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'" required></label>';}
function render(target,result){
 const rows=result.forecast.map(x=>'<tr><td>'+x.month+'</td><td>'+fmt(x.buyers)+'</td><td>'+fmt(x.orders)+'</td><td>'+money(x.gmv)+'</td><td>'+money(x.platformRevenue)+'</td><td>'+money(x.paymentFees)+'</td><td>'+money(x.netCashFlow)+'</td><td>'+money(x.cumulativeCash)+'</td></tr>').join('');
 target.innerHTML='<section class="pe-market-output"><h3>Kết quả marketplace</h3><div class="pe-market-metrics">'+
 card('GMV tháng cuối',money(result.finalGMV))+card('Doanh thu nền tảng',money(result.finalPlatformRevenue))+
 card('Người mua cuối kỳ',fmt(result.finalBuyers))+card('Đơn hàng cuối kỳ',fmt(result.finalOrders))+
 card('Lãi đóng góp / đơn',money(result.contributionPerOrder))+card('Đơn hàng hòa vốn / tháng',result.breakEvenOrders===null?'Không đạt':fmt(result.breakEvenOrders))+
 card('Dòng tiền sau vốn thiết lập',money(result.cumulativeCash))+card('Tháng hoàn vốn',result.paybackMonth===null?'Chưa hoàn vốn':result.paybackMonth===0?'Không cần vốn thiết lập':'Tháng '+result.paybackMonth)+
 '</div><div class="pe-market-table-wrap"><table><thead><tr><th>Tháng</th><th>Người mua</th><th>Đơn</th><th>GMV</th><th>Phí nền tảng</th><th>Phí thanh toán</th><th>Dòng tiền</th><th>Lũy kế</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
 '<p class="pe-market-note">GMV được giảm theo tỷ lệ hoàn/hủy trước khi tính phí nền tảng và phí thanh toán. Chi phí CAC áp dụng cho người mua mới; chi phí biến đổi và trợ giá tính theo tổng đơn. Chưa tính doanh thu quảng cáo, phí niêm yết, phí vận chuyển, gian lận, thuế gián thu, chi phí hoàn tiền ngoài GMV và vốn lưu động. Mô phỏng không phải dự báo chắc chắn.</p></section>';
}
function mount(){
 const doc=root.document,panel=doc&&doc.getElementById('principia-economy-root');
 const tabs=panel&&panel.querySelector('.pe-tabs'),content=panel&&panel.querySelector('#pe-content');
 if(!panel||!tabs||!content||panel.dataset.marketplaceSimulatorReady)return false;
 panel.dataset.marketplaceSimulatorReady='true';
 const button=doc.createElement('button');button.type='button';button.dataset.marketplaceSimulatorTab='true';button.textContent='Marketplace';tabs.appendChild(button);
 button.addEventListener('click',()=>{
  tabs.querySelectorAll('button').forEach(tab=>tab.classList.remove('active'));button.classList.add('active');
  content.innerHTML='<section class="pe-market"><header><b>MÔ PHỎNG SÀN / MARKETPLACE</b><p>Ước tính GMV, take rate, phí thanh toán, CAC, hoàn/hủy đơn và dòng tiền.</p></header>'+
  '<form data-market-form><div class="pe-market-inputs">'+
  field('Người mua hiện tại','initialBuyers',100,0,1000000,1)+
  field('Người mua mới tháng đầu','newBuyers',25,0,10000,1)+
  field('Tỷ lệ rời bỏ người mua / tháng (%)','buyerChurnPct',4,0,100,0.1)+
  field('Tăng trưởng người mua mới / tháng (%)','newBuyerGrowthPct',2,-20,10,0.1)+
  field('Số đơn / người mua / tháng','ordersPerBuyer',1.5,0,1000,0.1)+
  field('Giá trị đơn hàng trung bình (₫)','averageOrderValue',300000,0,100000000,1)+
  field('Phí nền tảng / take rate (%)','takeRatePct',10,0,50,0.1)+
  field('Tỷ lệ hoàn / hủy (%)','refundRatePct',3,0,100,0.1)+
  field('Phí thanh toán (%)','paymentFeePct',2,0,30,0.1)+
  field('Chi phí biến đổi / đơn (₫)','variableCostPerOrder',3000,0,100000000,1)+
  field('Trợ giá người bán / đơn (₫)','sellerSubsidyPerOrder',1000,0,100000000,1)+
  field('CAC người mua mới (₫)','buyerCAC',50000,0,1000000000,1)+
  field('Chi phí cố định / tháng (₫)','fixedCosts',20000000,0,1000000000000,1)+
  field('Vốn thiết lập ban đầu (₫)','setupInvestment',80000000,0,1000000000000,1)+
  field('Thuế trên lãi dương (%)','taxRatePct',20,0,100,0.1)+
  field('Thời hạn dự báo (tháng)','months',24,1,60,1)+
  '</div><button type="submit">Chạy mô phỏng marketplace</button></form><div class="pe-market-results" aria-live="polite"></div></section>';
  const form=content.querySelector('[data-market-form]'),output=content.querySelector('.pe-market-results');
  form.addEventListener('submit',event=>{
   event.preventDefault();
   try{const values=Object.fromEntries(Object.keys(LIMITS).map(key=>[key,form.elements.namedItem(key).value]));values.months=form.elements.namedItem('months').value;render(output,calculate(values));}
   catch(error){output.textContent=error.message;}
  });
 });
 panel.addEventListener('click',event=>{
  if(event.target.closest('.pe-tabs > button')&&!event.target.closest('[data-marketplace-simulator-tab]'))button.classList.remove('active');
 },true);
 return true;
}
function boot(){let attempts=0;const retry=()=>{if(mount()||++attempts>=40)return;root.setTimeout(retry,250);};retry();}
const api=Object.freeze({validate,calculate,LIMITS});
root.PrincipiaMarketplaceSimulator=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof window!=='undefined'?window:globalThis);
