(function(root){
'use strict';
const KEYS=Object.freeze({
 integrated:'principia:integrated-economy:v1',
 advanced:'principia:advanced-markets:v1',
 hub:'principia:simulation-hub:v1',
 portfolio:'principia:investment-portfolio:v1'
});
const money=value=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(Number.isFinite(value)?value:0)+' ₫';
function read(storage,key){try{const raw=storage.getItem(key);return raw?JSON.parse(raw):null;}catch(_){return null;}}
function summarize(storage){
 const integrated=read(storage,KEYS.integrated),advanced=read(storage,KEYS.advanced),hub=read(storage,KEYS.hub),portfolio=read(storage,KEYS.portfolio);
 const households=Array.isArray(integrated?.households)?integrated.households:[],firms=Array.isArray(integrated?.firms)?integrated.firms:[],banks=Array.isArray(integrated?.banks)?integrated.banks:[];
 const positions=Array.isArray(portfolio?.positions)?portfolio.positions:[];
 const integrity=integrated&&root.PrincipiaEconomyIntegrity?root.PrincipiaEconomyIntegrity.audit(integrated):null;
 const count=(obj,field)=>Array.isArray(obj?.[field])?obj[field].length:0;
 return Object.freeze({
  simulationOnly:true,
  modules:{integrated:Boolean(integrated),advanced:Boolean(advanced),hub:Boolean(hub),portfolio:Boolean(portfolio)},
  participants:{households:households.length,firms:firms.length,banks:banks.length},
  balances:{households:households.reduce((n,x)=>n+(Number(x.cash)||0),0),firms:firms.reduce((n,x)=>n+(Number(x.cash)||0),0),bankLiquidity:banks.reduce((n,x)=>n+(Number(x.liquidity)||0),0),advanced:Math.max(0,Number(advanced?.cash)||0),simulationHub:Math.max(0,Number(hub?.cash)||0)},
  activity:{integratedLedger:count(integrated,'ledger'),advancedLedger:count(advanced,'ledger'),simulationLedger:count(hub,'ledger'),portfolioPositions:positions.length,portfolioTrades:count(portfolio,'trades')},
  integrity,warnings:[...(!integrated?['Chưa khởi tạo nền kinh tế liên thông']:[]),...(integrity&&!integrity.healthy?integrity.issues.map(x=>'Kiểm tra '+x.name+': '+x.detail):[]),...(advanced||hub||portfolio?['Một số phân hệ đầu tư vẫn lưu ví riêng, không cộng gộp thành một số dư khả dụng']:[])]
 });
}
function escape(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function mount(){
 const panel=root.document?.getElementById('principia-economy-root');
 const tabs=panel?.querySelector('.pe-tabs'),content=panel?.querySelector('#pe-content');
 if(!panel||!tabs||!content||panel.dataset.economyControlCenter==='1')return false;
 panel.dataset.economyControlCenter='1';
 const button=root.document.createElement('button');button.type='button';button.textContent='Trung tâm kinh tế';tabs.appendChild(button);
 const storage=root.localStorage;
 function render(){
  const s=summarize(storage),labels={integrated:'Kinh tế liên thông',advanced:'Phái sinh & DeFi',hub:'Mô phỏng toàn diện',portfolio:'Danh mục đầu tư'};
  content.innerHTML='<section class="pec-center"><header><b>PRINCIPIA · ECONOMY CONTROL CENTER</b><p>Toàn bộ số liệu là tiền ảo và dữ liệu mô phỏng lưu trên thiết bị. Không kết nối giao dịch hoặc thị trường thật.</p></header><div class="pec-grid">'+Object.entries(s.modules).map(([key,ready])=>'<article><span>'+labels[key]+'</span><b class="'+(ready?'is-ready':'is-empty')+'">'+(ready?'Đã có dữ liệu':'Chưa khởi tạo')+'</b></article>').join('')+'</div><h3>Kiểm toán tự động</h3><div class="pec-grid"><article>Trạng thái<b>'+(s.integrity?(s.integrity.healthy?'Đạt':'Có lỗi'):'Chưa khả dụng')+'</b></article><article>Phép kiểm tra đạt<b>'+(s.integrity?s.integrity.checks.filter(x=>x.ok).length:0)+' / '+(s.integrity?s.integrity.checks.length:0)+'</b></article><article>Lỗi cần xử lý<b>'+(s.integrity?s.integrity.issues.length:'—')+'</b></article></div><h3>Quy mô mô phỏng</h3><div class="pec-grid"><article>Hộ gia đình<b>'+s.participants.households+'</b></article><article>Doanh nghiệp<b>'+s.participants.firms+'</b></article><article>Ngân hàng<b>'+s.participants.banks+'</b></article><article>Vị thế đầu tư<b>'+s.activity.portfolioPositions+'</b></article></div><h3>Số dư theo từng phân hệ</h3><div class="pec-grid"><article>Tiền hộ gia đình<b>'+money(s.balances.households)+'</b></article><article>Tiền doanh nghiệp<b>'+money(s.balances.firms)+'</b></article><article>Thanh khoản ngân hàng<b>'+money(s.balances.bankLiquidity)+'</b></article><article>Ví phái sinh & DeFi<b>'+money(s.balances.advanced)+'</b></article><article>Ví mô phỏng toàn diện<b>'+money(s.balances.simulationHub)+'</b></article></div><p class="pec-warning">'+s.warnings.map(escape).join('<br>')+'</p><h3>Hoạt động đã ghi nhận</h3><div class="pec-grid"><article>Sổ cái liên thông<b>'+s.activity.integratedLedger+'</b></article><article>Sổ phái sinh<b>'+s.activity.advancedLedger+'</b></article><article>Sổ mô phỏng<b>'+s.activity.simulationLedger+'</b></article><article>Lệnh danh mục<b>'+s.activity.portfolioTrades+'</b></article></div><button type="button" data-refresh>Đọc lại dữ liệu</button></section>';
  content.querySelector('[data-refresh]')?.addEventListener('click',render);
 }
 button.addEventListener('click',()=>{tabs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));button.classList.add('active');render();});
 return true;
}
if(typeof module!=='undefined'&&module.exports)module.exports={KEYS,summarize};
root.PrincipiaEconomyControlCenter=Object.freeze({summarize,mount});
if(root.document){if(mount())return;root.document.addEventListener('DOMContentLoaded',mount,{once:true});}
})(typeof window!=='undefined'?window:globalThis);
