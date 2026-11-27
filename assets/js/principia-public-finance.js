(function(root){
'use strict';
const KEY='principia:public-finance:v1', MAX=5000;
const DEFAULTS=Object.freeze({vat:0.08,personal:0.05,corporate:0.2,property:0.005});
function fresh(){return {version:1,rates:{...DEFAULTS},periods:[],debt:0,treasury:0,policy:{inflation:0.02,unemployment:0.05}}}
function safeInt(n,label,min=0){if(!Number.isSafeInteger(n)||n<min)throw new TypeError(label+' không hợp lệ');return n}
function pct(n,label,max=1){if(!Number.isFinite(n)||n<0||n>max)throw new RangeError(label+' ngoài giới hạn');return n}
function sanitize(s){if(!s||s.version!==1)return fresh();const x=fresh();if(s.rates&&Object.keys(DEFAULTS).every(k=>Number.isFinite(s.rates[k])&&s.rates[k]>=0&&s.rates[k]<=1))x.rates={...s.rates};x.debt=Number.isSafeInteger(s.debt)&&s.debt>=0?s.debt:0;x.treasury=Number.isSafeInteger(s.treasury)&&s.treasury>=0?s.treasury:0;x.policy={inflation:pct(Number(s.policy?.inflation)||0,'Lạm phát',2),unemployment:pct(Number(s.policy?.unemployment)||0,'Thất nghiệp',1)};x.periods=Array.isArray(s.periods)?s.periods.filter(p=>p&&typeof p.id==='string'&&Number.isSafeInteger(p.taxCollected)&&Number.isSafeInteger(p.spending)&&Number.isSafeInteger(p.balance)).slice(-60):[];return x}
function createPublicFinanceEngine({storage=root.localStorage,now=()=>new Date()}={}){
let state;try{state=sanitize(JSON.parse(storage?.getItem(KEY)||'null'))}catch{state=fresh()}
function persist(){try{storage?.setItem(KEY,JSON.stringify(state))}catch{throw Error('Lưu ngân sách thất bại')}}
function snapshot(){return JSON.parse(JSON.stringify(state))}
function setTaxRates(rates){const next={...state.rates};for(const k of Object.keys(DEFAULTS))if(rates[k]!==undefined)next[k]=pct(rates[k],k,1);state.rates=next;persist();return snapshot()}
function setEconomicIndicators({inflation,unemployment}){state.policy={inflation:pct(inflation,'Lạm phát',2),unemployment:pct(unemployment,'Thất nghiệp',1)};persist();return snapshot()}
function assessTaxes({income=0,companyProfit=0,consumption=0,propertyValue=0}={}){for(const [v,k] of [[income,'Thu nhập'],[companyProfit,'Lợi nhuận'],[consumption,'Chi tiêu'],[propertyValue,'Giá trị tài sản']])safeInt(v,k);return {personal:Math.round(income*state.rates.personal),corporate:Math.round(Math.max(0,companyProfit)*state.rates.corporate),vat:Math.round(consumption*state.rates.vat),property:Math.round(propertyValue*state.rates.property)}}
function closePeriod({label,taxes={},spending=0,borrowing=0}={}){if(typeof label!=='string'||!label.trim()||label.length>80)throw TypeError('Tên kỳ ngân sách không hợp lệ');safeInt(spending,'Chi tiêu ngân sách');safeInt(borrowing,'Vay công');const taxCollected=Object.values(taxes).reduce((a,b)=>a+safeInt(b,'Thuế thu được'),0);safeInt(taxCollected,'Tổng thuế');const revenue=taxCollected+borrowing;const balance=revenue-spending;const treasury=state.treasury+balance;const debt=state.debt+borrowing;if(!Number.isSafeInteger(treasury)||treasury<0)throw RangeError('Ngân khố không đủ chi');if(!Number.isSafeInteger(debt))throw RangeError('Nợ công vượt giới hạn');const period={id:'budget-'+Date.parse(now()),label:label.trim(),taxCollected,revenue,spending,borrowing,balance,at:new Date(now()).toISOString()};state.treasury=treasury;state.debt=debt;state.periods.push(period);if(state.periods.length>60)state.periods.shift();persist();return snapshot()}
function repayDebt(amount){safeInt(amount,'Trả nợ',1);if(amount>state.treasury||amount>state.debt)throw RangeError('Không đủ ngân khố hoặc dư nợ');state.treasury-=amount;state.debt-=amount;persist();return snapshot()}
return Object.freeze({getState:snapshot,setTaxRates,setEconomicIndicators,assessTaxes,closePeriod,repayDebt})}
if(typeof module!=='undefined'&&module.exports)module.exports={createPublicFinanceEngine,DEFAULTS,KEY};
root.PrincipiaPublicFinance=Object.freeze({createPublicFinanceEngine,DEFAULTS});
})(typeof window!=='undefined'?window:globalThis);
