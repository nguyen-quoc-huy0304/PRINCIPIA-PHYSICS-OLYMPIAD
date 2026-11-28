(function (root) {
  'use strict';
  const LIMITS = Object.freeze({
    initialCustomers: [0, 1000000], newCustomers: [0, 10000],
    arpu: [0, 10000000], churnPct: [0, 100], grossMarginPct: [0, 100],
    cac: [0, 1000000000], fixedCosts: [0, 1000000000000],
    setupInvestment: [0, 1000000000000], acquisitionGrowthPct: [-20, 10],
    taxRatePct: [0, 100]
  });
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  function numeric(value, label) {
    if (value === null || value === undefined || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) throw new TypeError(label + ' phải là số.');
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new TypeError(label + ' phải là số hữu hạn.');
    return parsed;
  }
  function validate(input) {
    if (!input || typeof input !== 'object') throw new TypeError('Dữ liệu SaaS không hợp lệ.');
    const months = numeric(input.months, 'Thời hạn');
    if (!Number.isInteger(months) || months < 1 || months > 60) throw new RangeError('Thời hạn dự báo phải từ 1 đến 60 tháng.');
    const result = { months };
    for (const [key, range] of Object.entries(LIMITS)) {
      const value = numeric(input[key], key);
      if (!Number.isFinite(value) || value < range[0] || value > range[1]) throw new RangeError(key + ' nằm ngoài phạm vi cho phép.');
      if (['initialCustomers', 'newCustomers'].includes(key) && !Number.isInteger(value)) throw new TypeError(key + ' phải là số nguyên.');
      result[key] = value;
    }
    return Object.freeze(result);
  }
  function calculate(input) {
    const data = validate(input);
    const grossProfitPerCustomer = data.arpu * data.grossMarginPct / 100;
    const ltv = data.churnPct > 0 ? round(grossProfitPerCustomer / (data.churnPct / 100)) : null;
    const cacPaybackMonths = grossProfitPerCustomer > 0 ? round(data.cac / grossProfitPerCustomer) : null;
    const ltvToCac = ltv !== null && data.cac > 0 ? round(ltv / data.cac) : null;
    const breakEvenCustomers = grossProfitPerCustomer > 0
      ? Math.ceil((data.fixedCosts + data.newCustomers * data.cac) / grossProfitPerCustomer) : null;
    let customers = data.initialCustomers;
    let cumulativeCash = -data.setupInvestment;
    let paybackMonth = data.setupInvestment === 0 ? 0 : null;
    let totalRevenue = 0, totalGrossProfit = 0, totalAcquisitionCost = 0, totalFixedCosts = 0, totalTax = 0;
    const forecast = [];
    for (let month = 1; month <= data.months; month += 1) {
      const newCustomers = Math.round(data.newCustomers * Math.pow(1 + data.acquisitionGrowthPct / 100, month - 1));
      const churnedCustomers = Math.min(customers, Math.round(customers * data.churnPct / 100));
      customers = customers - churnedCustomers + newCustomers;
      const mrr = round(customers * data.arpu);
      const grossProfit = round(mrr * data.grossMarginPct / 100);
      const acquisitionCost = round(newCustomers * data.cac);
      const operatingProfit = round(grossProfit - acquisitionCost - data.fixedCosts);
      const tax = round(Math.max(0, operatingProfit) * data.taxRatePct / 100);
      const netCashFlow = round(operatingProfit - tax);
      cumulativeCash = round(cumulativeCash + netCashFlow);
      totalRevenue = round(totalRevenue + mrr);
      totalGrossProfit = round(totalGrossProfit + grossProfit);
      totalAcquisitionCost = round(totalAcquisitionCost + acquisitionCost);
      totalFixedCosts = round(totalFixedCosts + data.fixedCosts);
      totalTax = round(totalTax + tax);
      if (paybackMonth === null && cumulativeCash >= 0) paybackMonth = month;
      forecast.push(Object.freeze({month,customers,newCustomers,churnedCustomers,mrr,arr:round(mrr*12),grossProfit,acquisitionCost,fixedCosts:data.fixedCosts,tax,netCashFlow,cumulativeCash}));
    }
    const last = forecast[forecast.length - 1];
    return Object.freeze({
      months:data.months,ltv,cacPaybackMonths,ltvToCac,breakEvenCustomers,
      finalCustomers:last.customers,finalMrr:last.mrr,finalArr:last.arr,
      finalMonthlyNet:last.netCashFlow,cumulativeCash,paybackMonth,
      totals:Object.freeze({revenue:totalRevenue,grossProfit:totalGrossProfit,acquisitionCost:totalAcquisitionCost,fixedCosts:totalFixedCosts,tax:totalTax}),
      forecast:Object.freeze(forecast)
    });
  }
  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }
  const money = value => new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(value);
  const fmt = value => new Intl.NumberFormat('vi-VN',{maximumFractionDigits:1}).format(value);
  function card(label,value){return '<article class="pe-saas-metric"><small>'+escapeHTML(label)+'</small><b>'+escapeHTML(value)+'</b></article>';}
  function input(label,name,value,min,max,step){return '<label>'+escapeHTML(label)+'<input type="number" name="'+name+'" value="'+value+'" min="'+min+'" max="'+max+'" step="'+step+'" required></label>';}
  function render(target,result){
    const rows=result.forecast.map(item=>'<tr><td>'+item.month+'</td><td>'+fmt(item.customers)+'</td><td>'+fmt(item.newCustomers)+'</td><td>'+money(item.mrr)+'</td><td>'+money(item.acquisitionCost)+'</td><td>'+money(item.tax)+'</td><td>'+money(item.netCashFlow)+'</td><td>'+money(item.cumulativeCash)+'</td></tr>').join('');
    target.innerHTML='<section class="pe-saas-output"><h3>Kết quả mô phỏng SaaS</h3><div class="pe-saas-metrics">'+
      card('MRR cuối kỳ',money(result.finalMrr))+card('ARR quy đổi cuối kỳ',money(result.finalArr))+
      card('Khách hàng cuối kỳ',fmt(result.finalCustomers))+card('Lãi ròng tháng cuối',money(result.finalMonthlyNet))+
      card('LTV / khách hàng',result.ltv===null?'Không xác định khi churn = 0':money(result.ltv))+
      card('LTV / CAC',result.ltvToCac===null?'—':fmt(result.ltvToCac)+' lần')+
      card('Hoàn vốn CAC',result.cacPaybackMonths===null?'—':fmt(result.cacPaybackMonths)+' tháng')+
      card('Khách hàng hòa vốn',result.breakEvenCustomers===null?'Không đạt':fmt(result.breakEvenCustomers))+
      card('Dòng tiền sau vốn thiết lập',money(result.cumulativeCash))+
      card('Tháng hoàn vốn thiết lập',result.paybackMonth===null?'Chưa hoàn vốn':result.paybackMonth===0?'Không cần vốn thiết lập':'Tháng '+result.paybackMonth)+
      '</div><div class="pe-saas-table-wrap"><table><thead><tr><th>Tháng</th><th>Khách hàng</th><th>Khách mới</th><th>MRR</th><th>Chi phí CAC</th><th>Thuế</th><th>Dòng tiền tháng</th><th>Lũy kế</th></tr></thead><tbody>'+rows+'</tbody></table></div>'+
      '<p class="pe-saas-note">ARR = MRR × 12. LTV dùng ARPU × biên lợi nhuận gộp / churn tháng, giả định churn ổn định. Khách hàng cuối tháng được tính doanh thu trọn tháng. Chưa mô phỏng hoàn tiền, phí thanh toán, nợ xấu, chiết khấu năm, thay đổi giá, chi phí hỗ trợ theo khách hàng hoặc doanh thu dịch vụ chuyên nghiệp. Mô phỏng không phải dự báo chắc chắn.</p></section>';
  }
  function mount(){
    const doc=root.document,panel=doc&&doc.getElementById('principia-economy-root');
    const tabs=panel&&panel.querySelector('.pe-tabs'),content=panel&&panel.querySelector('#pe-content');
    if(!panel||!tabs||!content||panel.dataset.saasSimulatorReady)return false;
    panel.dataset.saasSimulatorReady='true';
    const button=doc.createElement('button');button.type='button';button.dataset.saasSimulatorTab='true';button.textContent='SaaS & thuê bao';tabs.appendChild(button);
    button.addEventListener('click',()=>{
      tabs.querySelectorAll('button').forEach(tab=>tab.classList.remove('active'));button.classList.add('active');
      content.innerHTML='<section class="pe-saas"><header><b>MÔ PHỎNG SAAS / SUBSCRIPTION</b><p>Tính MRR, ARR, churn, CAC, LTV, biên lợi nhuận, hòa vốn và dòng tiền theo tháng.</p></header>'+
        '<form data-saas-form><div class="pe-saas-inputs">'+
        input('Khách hàng hiện tại','initialCustomers',100,0,1000000,1)+
        input('Khách hàng mới tháng đầu','newCustomers',20,0,10000,1)+
        input('Doanh thu bình quân / khách / tháng (ARPU · ₫)','arpu',199000,0,10000000,1)+
        input('Tỷ lệ rời bỏ khách hàng / tháng (%)','churnPct',3,0,100,0.1)+
        input('Biên lợi nhuận gộp (%)','grossMarginPct',80,0,100,0.1)+
        input('Chi phí có được một khách hàng (CAC · ₫)','cac',250000,0,1000000000,1)+
        input('Chi phí cố định mỗi tháng (₫)','fixedCosts',15000000,0,1000000000000,1)+
        input('Vốn thiết lập ban đầu (₫)','setupInvestment',50000000,0,1000000000000,1)+
        input('Tăng trưởng khách mới / tháng (%)','acquisitionGrowthPct',2,-20,10,0.1)+
        input('Thuế trên lợi nhuận dương (%)','taxRatePct',20,0,100,0.1)+
        input('Thời hạn dự báo (tháng)','months',24,1,60,1)+
        '</div><button type="submit">Chạy mô phỏng SaaS</button></form><div class="pe-saas-results" aria-live="polite"></div></section>';
      const form=content.querySelector('[data-saas-form]'),output=content.querySelector('.pe-saas-results');
      form.addEventListener('submit',event=>{
        event.preventDefault();
        try{const values=Object.fromEntries(Object.keys(LIMITS).map(key=>[key,form.elements.namedItem(key).value]));values.months=form.elements.namedItem('months').value;render(output,calculate(values));}
        catch(error){output.textContent=error.message;}
      });
    });
    panel.addEventListener('click',event=>{
      if(event.target.closest('.pe-tabs > button')&&!event.target.closest('[data-saas-simulator-tab]'))button.classList.remove('active');
    },true);
    return true;
  }
  function boot(){let attempts=0;const retry=()=>{if(mount()||++attempts>=40)return;root.setTimeout(retry,250);};retry();}
  const api=Object.freeze({validate,calculate,LIMITS});
  root.PrincipiaSaaSSimulator=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof window!=='undefined'?window:globalThis);
