(function(root){
 'use strict';
 const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
 const money=value=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(value)+' ₫';
 function mount(){
  const panel=root.document?.getElementById('principia-economy-root'),tabs=panel?.querySelector('.pe-tabs'),content=panel?.querySelector('#pe-content');
  if(!panel||!tabs||!content||panel.dataset.enterpriseOperationsUiReady)return false;
  if(!root.PrincipiaEnterpriseOperations||!root.PrincipiaEconomyActiveWallet)return false;
  panel.dataset.enterpriseOperationsUiReady='1';
  const button=root.document.createElement('button');button.type='button';button.textContent='Vận hành doanh nghiệp';tabs.appendChild(button);
  let engine=null,wallet=null;
  function render(){
   const state=engine.getState(),companies=state.businesses,totalCash=companies.reduce((sum,item)=>sum+item.cash,0),employees=companies.reduce((sum,item)=>sum+item.employees.filter(x=>x.active).length,0);
   const companyOptions=companies.map(item=>'<option value="'+esc(item.id)+'">'+esc(item.name)+' · '+money(item.cash)+'</option>').join('');
   const materialOptions=Object.entries(root.PrincipiaEnterpriseOperations.MATERIALS).map(([id,item])=>'<option value="'+id+'">'+esc(item.name)+' ('+esc(item.unit)+')</option>').join('');
   const recipeOptions=Object.entries(root.PrincipiaEnterpriseOperations.RECIPES).map(([id,item])=>'<option value="'+id+'">'+esc(item.name)+'</option>').join('');
   const productOptions=Object.entries(root.PrincipiaEnterpriseOperations.PRODUCTS).map(([id,item])=>'<option value="'+id+'">'+esc(item.name)+'</option>').join('');
   content.innerHTML='<section class="peo"><header><b>PRINCIPIA · ENTERPRISE OPERATIONS</b><p>Vốn thành lập được trừ từ ví mô phỏng chung. Sau khi thành lập, mỗi doanh nghiệp có sổ tiền nội bộ riêng để quản lý nguyên liệu, sản xuất, bán hàng, lương và thuế.</p></header><div class="peo-kpis"><article><small>Ví cấp vốn</small><strong>'+money(wallet.getBalance())+'</strong></article><article><small>Doanh nghiệp</small><strong>'+companies.length+'</strong></article><article><small>Tiền nội bộ doanh nghiệp</small><strong>'+money(totalCash)+'</strong></article><article><small>Nhân sự đang làm</small><strong>'+employees+'</strong></article></div><p class="peo-status" role="status" aria-live="polite"></p><div class="peo-grid"><form data-enterprise-action="create"><h3>Thành lập doanh nghiệp</h3><label>Tên doanh nghiệp<input name="name" maxlength="80" minlength="2" required></label><label>Vốn ban đầu (VND)<input name="capital" type="number" min="1000000" step="1" required></label><button>Thành lập và cấp vốn</button></form><form data-enterprise-action="material"><h3>Nhập nguyên liệu</h3><label>Doanh nghiệp<select name="id" required>'+companyOptions+'</select></label><label>Nguyên liệu<select name="sku">'+materialOptions+'</select></label><label>Số lượng<input name="quantity" type="number" min="1" step="1" required></label><label>Giá nhập / đơn vị<input name="unitCost" type="number" min="1" step="1" required></label><button>Nhập kho</button></form><form data-enterprise-action="hire"><h3>Tuyển nhân sự</h3><label>Doanh nghiệp<select name="id" required>'+companyOptions+'</select></label><label>Vị trí<input name="role" maxlength="60" required></label><label>Lương tháng<input name="monthlyWage" type="number" min="1" step="1" required></label><button>Tuyển dụng</button></form><form data-enterprise-action="produce"><h3>Sản xuất</h3><label>Doanh nghiệp<select name="id" required>'+companyOptions+'</select></label><label>Công thức<select name="recipeId">'+recipeOptions+'</select></label><label>Số lượng<input name="quantity" type="number" min="1" step="1" required></label><button>Sản xuất hàng</button></form><form data-enterprise-action="sell"><h3>Bán thành phẩm</h3><label>Doanh nghiệp<select name="id" required>'+companyOptions+'</select></label><label>Sản phẩm<select name="productId">'+productOptions+'</select></label><label>Số lượng<input name="quantity" type="number" min="1" step="1" required></label><label>Giá bán / đơn vị<input name="unitPrice" type="number" min="1" step="1" required></label><button>Bán hàng và tính VAT</button></form><form data-enterprise-action="payroll"><h3>Trả lương</h3><label>Doanh nghiệp<select name="id" required>'+companyOptions+'</select></label><button>Chạy bảng lương tháng</button></form><form data-enterprise-action="tax"><h3>Quyết toán thuế</h3><label>Doanh nghiệp<select name="id" required>'+companyOptions+'</select></label><button>Nộp VAT và thuế lợi nhuận</button></form></div><h3>Sổ doanh nghiệp</h3>'+(companies.length?companies.map(company=>'<article class="peo-company"><header><b>'+esc(company.name)+'</b><strong>'+money(company.cash)+'</strong></header><p>Doanh thu kỳ: '+money(company.revenue)+' · Thuế phải nộp: '+money(company.taxPayable)+' · Nhân sự: '+company.employees.filter(x=>x.active).length+'</p><p>Nguyên liệu: '+Object.entries(company.materials).map(([sku,qty])=>esc(sku)+' '+qty).join(' · ')+'</p><p>Thành phẩm: '+Object.entries(company.products).map(([sku,qty])=>esc(sku)+' '+qty).join(' · ')+'</p></article>').join(''):'<p>Chưa có doanh nghiệp. Tạo doanh nghiệp đầu tiên bằng vốn mô phỏng.</p>')+'<h3>Sổ hoạt động</h3>'+(state.ledger.length?state.ledger.slice().reverse().slice(0,40).map(row=>'<article class="peo-row"><b>'+esc(row.type)+' · '+money(row.amount)+'</b><span>'+esc(row.note)+' · '+esc(row.at.slice(0,16).replace('T',' '))+'</span></article>').join(''):'<p>Chưa có bút toán.</p>')+'</section>';
   const status=content.querySelector('.peo-status');
   content.querySelectorAll('form[data-enterprise-action]').forEach(form=>form.addEventListener('submit',event=>{
    event.preventDefault();const values=Object.fromEntries(new FormData(form)),num=key=>Number(values[key]);
    try{
     switch(form.dataset.enterpriseAction){
      case 'create':engine.createBusiness(values.name,num('capital'));break;
      case 'material':engine.purchaseMaterial(values.id,values.sku,num('quantity'),num('unitCost'));break;
      case 'hire':engine.hire(values.id,values.role,num('monthlyWage'));break;
      case 'produce':engine.produce(values.id,values.recipeId,num('quantity'));break;
      case 'sell':engine.sell(values.id,values.productId,num('quantity'),num('unitPrice'));break;
      case 'payroll':engine.runPayroll(values.id);break;
      case 'tax':engine.closeTaxPeriod(values.id);break;
     }
     render();
    }catch(error){status.textContent=error.message;}
   }));
  }
  button.addEventListener('click',()=>{
   tabs.querySelectorAll('button').forEach(item=>item.classList.remove('active'));button.classList.add('active');
   try{wallet=root.PrincipiaEconomyActiveWallet;if(!wallet)throw new Error('Hãy chọn ví mô phỏng trong Kinh tế liên thông trước.');engine=root.PrincipiaEnterpriseOperations.createEnterpriseEngine({wallet,storage:root.localStorage});render();}
   catch(error){content.textContent='Không thể mở vận hành doanh nghiệp: '+error.message;}
  });
  return true;
 }
 function boot(){if(mount())return;root.setTimeout(boot,250);}
 if(typeof module!=='undefined'&&module.exports)module.exports={mount};
 if(root.document){if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof window!=='undefined'?window:globalThis);
