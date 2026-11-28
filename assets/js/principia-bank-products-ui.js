(function(root){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const money=value=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(value)+' ₫';
 function mount(){
  const panel=root.document?.getElementById('principia-economy-root');
  const tabs=panel?.querySelector('.pe-tabs');
  const content=panel?.querySelector('#pe-content');
  if(!panel||!tabs||!content||panel.dataset.bankProductsUiReady)return false;
  if(!root.PrincipiaBankProducts||!root.PrincipiaEconomyActiveWallet)return false;
  panel.dataset.bankProductsUiReady='1';
  const button=root.document.createElement('button');
  button.type='button';
  button.textContent='Sản phẩm ngân hàng';
  tabs.appendChild(button);
  let engine=null,wallet=null;
  function render(){
   const state=engine.getState(),deposits=state.deposits.filter(item=>item.status!=='closed'),loans=state.loans.filter(item=>item.remaining>0);
   const depositOptions=deposits.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.id)+' · '+money(item.principal)+'</option>').join('');
   const loanOptions=loans.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.id)+' · dư nợ '+money(item.remaining)+'</option>').join('');
   content.innerHTML='<section class="pbp"><header><b>PRINCIPIA · BANK PRODUCTS</b><p>Tiền gửi kỳ hạn và khoản vay đều dùng ví mô phỏng đã chọn. Không có tiền thật hoặc kết nối ngân hàng.</p></header><div class="pbp-kpis"><article><small>Số dư ví chung</small><strong>'+money(wallet.getBalance())+'</strong></article><article><small>Sổ tiền gửi</small><strong>'+deposits.length+'</strong></article><article><small>Khoản vay còn dư</small><strong>'+loans.length+'</strong></article><article><small>Bút toán ngân hàng</small><strong>'+state.ledger.length+'</strong></article></div><p class="pbp-status" role="status" aria-live="polite"></p><div class="pbp-grid"><form data-bank-action="deposit"><h3>Mở tiền gửi kỳ hạn</h3><label>Số tiền (VND)<input name="amount" type="number" min="1" step="1" required></label><label>Lãi suất năm<input name="annualRate" type="number" min="0" max=".3" step=".001" value=".05" required></label><label>Kỳ hạn (ngày)<input name="termDays" type="number" min="1" max="3650" step="1" value="90" required></label><button>Mở sổ tiết kiệm ảo</button></form><form data-bank-action="settle"><h3>Tất toán tiền gửi</h3><label>Sổ đang hoạt động<select name="depositId" required>'+depositOptions+'</select></label><label class="pbp-check"><input name="earlyWithdrawal" type="checkbox"> Xác nhận tất toán trước hạn</label><button '+(deposits.length?'':'disabled')+'>Tất toán</button></form><form data-bank-action="loan"><h3>Giải ngân khoản vay</h3><label>Số tiền vay (VND)<input name="principal" type="number" min="1" step="1" required></label><label>Lãi suất năm<input name="annualRate" type="number" min="0" max=".5" step=".001" value=".12" required></label><label>Thời hạn (tháng)<input name="termMonths" type="number" min="1" max="600" step="1" value="12" required></label><button>Giải ngân tiền ảo</button></form><form data-bank-action="repay"><h3>Trả khoản vay</h3><label>Khoản vay<select name="loanId" required>'+loanOptions+'</select></label><label>Số tiền trả (VND)<input name="amount" type="number" min="1" step="1" required></label><button '+(loans.length?'':'disabled')+'>Thanh toán</button></form></div><h3>Tiền gửi</h3>'+ (state.deposits.length?state.deposits.slice().reverse().map(item=>'<article class="pbp-row"><b>'+esc(item.id)+' · '+money(item.principal)+'</b><span>'+esc(item.status)+' · đáo hạn '+esc(item.maturesAt.slice(0,10))+' · lãi tích lũy '+money(item.accruedInterest)+'</span></article>').join(''):'<p>Chưa có tiền gửi.</p>')+'<h3>Khoản vay</h3>'+ (state.loans.length?state.loans.slice().reverse().map(item=>'<article class="pbp-row"><b>'+esc(item.id)+' · '+money(item.principal)+'</b><span>'+esc(item.status)+' · còn '+money(item.remaining)+' · kỳ hạn '+item.termMonths+' tháng</span></article>').join(''):'<p>Chưa có khoản vay.</p>')+'<h3>Sổ giao dịch</h3>'+ (state.ledger.length?state.ledger.slice().reverse().slice(0,30).map(item=>'<article class="pbp-row"><b>'+esc(item.type)+' · '+money(item.amount)+'</b><span>'+esc(item.reference)+' · '+esc(item.at.slice(0,16).replace('T',' '))+'</span></article>').join(''):'<p>Chưa có giao dịch.</p>')+'</section>';
   const status=content.querySelector('.pbp-status');
   content.querySelectorAll('form[data-bank-action]').forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault();
    const values=Object.fromEntries(new FormData(form));
    const number=key=>Number(values[key]);
    try{
     switch(form.dataset.bankAction){
      case 'deposit':engine.openTermDeposit(number('amount'),number('annualRate'),number('termDays'));break;
      case 'settle':engine.settleTermDeposit(values.depositId,values.earlyWithdrawal==='on');break;
      case 'loan':engine.createLoan(number('principal'),number('annualRate'),number('termMonths'));break;
      case 'repay':engine.repayLoan(values.loanId,number('amount'));break;
     }
     render();
    }catch(error){status.textContent=error.message;}
   }));
  }
  button.addEventListener('click',()=>{
   tabs.querySelectorAll('button').forEach(item=>item.classList.remove('active'));
   button.classList.add('active');
   try{
    wallet=root.PrincipiaEconomyActiveWallet;
    if(!wallet)throw new Error('Hãy chọn ví mô phỏng trong mục Kinh tế liên thông trước.');
    engine=root.PrincipiaBankProducts.createBankEngine({wallet,storage:root.localStorage});
    render();
   }catch(error){content.textContent='Không thể mở sản phẩm ngân hàng: '+error.message;}
  });
  return true;
 }
 function boot(){if(mount())return;root.setTimeout(boot,250);}
 if(typeof module!=='undefined'&&module.exports)module.exports={mount};
 if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof window!=='undefined'?window:globalThis);
