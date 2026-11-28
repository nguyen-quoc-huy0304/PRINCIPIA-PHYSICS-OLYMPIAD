(function(root){
'use strict';
const EPS=1e-7;
const finiteNonNegative=value=>Number.isFinite(value)&&value>=-EPS;
function audit(state){
 const issues=[],checks=[];
 const add=(name,ok,detail)=>{checks.push({name,ok,detail});if(!ok)issues.push({name,detail});};
 if(!state||state.version!==1){add('state-version',false,'Không có trạng thái kinh tế phiên bản 1');return Object.freeze({healthy:false,checks,issues,simulationOnly:true});}
 const arrays=['households','firms','banks','loans','deposits','ledger','journal'];
 for(const key of arrays)add('array-'+key,Array.isArray(state[key]),'Trường '+key+' phải là mảng');
 if(arrays.some(key=>!Array.isArray(state[key])))return Object.freeze({healthy:false,checks,issues,simulationOnly:true});
 const unique=(items,label)=>{const ids=items.map(x=>x&&x.id).filter(Boolean);add('unique-'+label,new Set(ids).size===ids.length,'ID trong '+label+' không được trùng');};
 for(const key of ['households','firms','banks','loans','deposits'])unique(state[key],key);
 for(const [key,items,field] of [['households',state.households,'cash'],['firms',state.firms,'cash'],['banks',state.banks,'liquidity']]){
  add('balances-'+key,items.every(x=>finiteNonNegative(x?.[field])),'Số dư '+key+' phải hữu hạn và không âm');
 }
 add('government-balance',finiteNonNegative(state.government?.cash)&&finiteNonNegative(state.government?.debt),'Ngân sách và nợ công phải hữu hạn, không âm');
 add('inventory',state.firms.every(f=>Array.isArray(f.inventory)&&f.inventory.every(i=>finiteNonNegative(i.quantity)&&finiteNonNegative(i.unitCost))),'Tồn kho và giá vốn phải hữu hạn, không âm');
 add('loan-values',state.loans.every(l=>finiteNonNegative(l.principal)&&finiteNonNegative(l.repaid)&&l.repaid<=l.principal+(Number(l.interest)||0)+EPS),'Khoản vay có giá trị không hợp lệ');
 add('deposit-values',state.deposits.every(d=>finiteNonNegative(d.principal)&&Number.isFinite(d.rate)&&d.rate>=0),'Tiền gửi hoặc lãi suất không hợp lệ');
 const loanByBank=new Map(),depositByBank=new Map();
 state.loans.forEach(l=>{if(l.status==='active'||l.status==='overdue')loanByBank.set(l.bankId,(loanByBank.get(l.bankId)||0)+Math.max(0,l.principal-(l.principalRepaid||0)));});
 state.deposits.filter(d=>!d.paid).forEach(d=>depositByBank.set(d.bankId,(depositByBank.get(d.bankId)||0)+d.principal));
 const loanMismatch=state.banks.some(b=>Math.abs((Number(b.loansOutstanding)||0)-(loanByBank.get(b.id)||0))>0.01);
 const depositMismatch=state.banks.some(b=>Math.abs((Number(b.depositsOutstanding)||0)-(depositByBank.get(b.id)||0))>0.01);
 add('loan-reconciliation',!loanMismatch,'Dư nợ ngân hàng phải khớp các khoản vay còn hiệu lực');
 add('deposit-reconciliation',!depositMismatch,'Tiền gửi ngân hàng phải khớp các khoản chưa tất toán');
 add('ledger-simulation-only',state.ledger.every(x=>x.simulationOnly===true),'Mọi giao dịch phải được đánh dấu mô phỏng');
 const unbalanced=state.journal.some(entry=>{const lines=Array.isArray(entry.lines)?entry.lines:[];const debit=lines.reduce((n,x)=>n+(Number(x.debit)||0),0),credit=lines.reduce((n,x)=>n+(Number(x.credit)||0),0);return lines.length!==2||Math.abs(debit-credit)>EPS||Math.abs(debit-(Number(entry.amount)||0))>EPS;});
 add('double-entry-journal',!unbalanced,'Sổ nhật ký phải cân bằng Nợ/Có theo từng giao dịch');
 return Object.freeze({healthy:issues.length===0,checks,issues,simulationOnly:true});
}
if(typeof module!=='undefined'&&module.exports)module.exports={audit};
root.PrincipiaEconomyIntegrity=Object.freeze({audit});
})(typeof window!=='undefined'?window:globalThis);
