(function(root){
'use strict';
const MIN_POINTS=3,MAX_POINTS=5000;
const num=(v,k,min=0,max=1e12)=>{const x=Number(v);if(!Number.isFinite(x)||x<min||x>max)throw new RangeError(k+' không hợp lệ.');return x;};
const str=(v,k,max=100)=>{if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new TypeError(k+' không hợp lệ.');return v.trim();};
const round=x=>Math.round((x+Number.EPSILON)*100)/100;
function classify(name){
 const n=name.toLowerCase();
 if(/arbitrage|mev|funding rate|cash.and.carry|triangular/.test(n))return'arbitrage';
 if(/flip|wholesale|dropship|retail|import|export|domain|sneaker|collectible|vehicle|machinery|website|social channel|in.game item/.test(n))return'flip';
 if(/angel|venture capital|private equity|seed round|private sale|crowdfunding|lbo|roll.up|startup|launchpad|ido|ieo|ico/.test(n))return'venture';
 if(/rental|reit|bond|treasury bill|savings|cds|p2p|invoice factoring|franchis|joint venture|leaseback|vending|royalt|intellectual property|agriculture|forestry|mining|carbon credit|insurance|staking|restaking|validator|masternode|yield farming|liquidity|lending|borrowing|mining|depin/.test(n))return'income';
 if(/short selling/.test(n))return'short';\n if(/margin|futures|options|warrant|cfd|forex/.test(n))return'leveraged';
 if(/pairs|statistical|mean reversion/.test(n))return'mean-reversion';
 if(/scalping|day trading|swing|position|growth/.test(n))return'momentum';
 return'dca';
}
function run({strategy,prices,referencePrices=[],capital=100000000,allocation=.25,feeRate=.0015,annualYield=0,periodDays=1,leverage=1,targetProfit=.08,stopLoss=.05,exitMultiplier=2}){
 const name=str(strategy,'Chiến lược',120),family=classify(name),series=Array.isArray(prices)?prices.map((x,i)=>num(x,'Giá '+i,.000001,1e12)):String(prices||'').split(/[;,\s]+/).filter(Boolean).map((x,i)=>num(x,'Giá '+i,.000001,1e12));
 if(series.length<MIN_POINTS||series.length>MAX_POINTS)throw new RangeError('Chuỗi giá cần từ 3 đến 5.000 điểm.');
 const refs=Array.isArray(referencePrices)?referencePrices.map((x,i)=>num(x,'Giá đối chiếu '+i,.000001,1e12)):String(referencePrices||'').split(/[;,\s]+/).filter(Boolean).map((x,i)=>num(x,'Giá đối chiếu '+i,.000001,1e12));
 if(family==='arbitrage'&&(refs.length!==series.length||refs.length<MIN_POINTS))throw new Error('Arbitrage cần chuỗi giá đối chiếu cùng độ dài.');
 const start=num(capital,'Vốn ban đầu',1,1e12),weight=num(allocation,'Tỷ lệ phân bổ',.001,1),fee=num(feeRate,'Phí giao dịch',0,.1),yieldRate=num(annualYield,'Lợi suất năm',0,5),days=num(periodDays,'Số ngày mỗi điểm',.01,3650),lev=num(leverage,'Đòn bẩy mô phỏng',1,100),target=num(targetProfit,'Mục tiêu lợi nhuận',.001,10),stop=num(stopLoss,'Ngưỡng cắt lỗ',.001,.99),multiple=num(exitMultiplier,'Hệ số thoái vốn',0,100);
 let cash=start,units=0,entry=0,invested=0,realized=0,income=0,trades=0,peak=start,maxDrawdown=0,locked=false,borrowed=0,leveragedMargin=0,shortCollateral=0,shortUnits=0,shortEntry=0;
 const history=[];
 const transactBuy=(amount,price)=>{const spend=Math.min(cash,amount),qty=spend/(price*(1+fee));if(qty<=0)return;const gross=qty*price;cash=round(cash-gross-gross*fee);units+=qty;invested+=gross;entry=units?((entry*(units-qty)+gross+gross*fee)/units):price;trades++;};
 const transactSell=(qty,price)=>{const sold=Math.min(units,qty);if(sold<=0)return;const gross=sold*price,net=gross-gross*fee,cost=sold*entry,pnl=net-cost;cash=round(cash+net);units-=sold;realized=round(realized+pnl);trades++;if(units<1e-10){units=0;entry=0;}};
 for(let i=0;i<series.length;i++){
  const price=series[i],window=series.slice(Math.max(0,i-4),i+1),avg=window.reduce((a,b)=>a+b,0)/window.length;
  if(family==='arbitrage'){
   const other=refs[i],low=Math.min(price,other),high=Math.max(price,other),gross=weight*start,net=high*(1-fee)-low*(1+fee);
   if(net>0&&cash>=gross){const qty=gross/(low*(1+fee));const pnl=round(qty*net);cash=round(cash+pnl);realized=round(realized+pnl);trades++;}
  }else if(family==='dca'){
   const installment=start*weight/series.length;
   transactBuy(installment,price);
  }else if(family==='income'){
   if(i===0)transactBuy(start*weight,price);
   const coupon=round(units*price*yieldRate*days/365);cash=round(cash+coupon);income=round(income+coupon);
  }else if(family==='venture'){
   if(i===0){transactBuy(start*weight,price);locked=true;}
   if(i===series.length-1&&locked){const proceeds=units*price*multiple;cash=round(cash+proceeds*(1-fee));realized=round(realized+proceeds*(1-fee)-units*entry);units=0;locked=false;trades++;}
  }else if(family==='flip'){
   if(units===0&&i>0&&price<=avg*.97)transactBuy(start*weight,price);
   else if(units>0&&(price>=entry*(1+target)||price<=entry*(1-stop)))transactSell(units,price);
  }else if(family==='momentum'){
   if(i>=2&&price>avg&&units===0)transactBuy(start*weight*lev,price);
   else if(i>=2&&price<avg&&units>0)transactSell(units,price);
  }else if(family==='mean-reversion'){
   if(price<avg*.97&&units===0)transactBuy(start*weight,price);
   else if(price>avg*1.03&&units>0)transactSell(units,price);
  }else if(family==='short'){
   if(i===0&&shortUnits===0){
    shortCollateral=Math.min(cash,start*weight);
    const notional=shortCollateral*lev;
    shortUnits=notional/price;
    shortEntry=price;
    cash=round(cash-shortCollateral);
    trades++;
   }else if(shortUnits>0&&(price<=shortEntry*(1-target/lev)||price>=shortEntry*(1+stop/lev))){
    const pnl=round(shortUnits*(shortEntry-price)-shortUnits*price*fee);
    cash=round(cash+shortCollateral+pnl);
    realized=round(realized+pnl);
    shortUnits=0;shortCollateral=0;shortEntry=0;trades++;
   }
  }else if(family==='leveraged'){
   if(i===0&&units===0){
    leveragedMargin=Math.min(cash,start*weight);
    const notional=leveragedMargin*lev;
    borrowed=notional-leveragedMargin;
    cash=round(cash-leveragedMargin);
    units=notional/price;
    entry=price;
    invested+=leveragedMargin;
    trades++;
   }else if(units>0&&(price<=entry*(1-stop/lev)||price>=entry*(1+target/lev))){
    const net=units*price*(1-fee);
    const pnl=round(net-borrowed-leveragedMargin);
    cash=round(cash+net-borrowed);
    realized=round(realized+pnl);
    units=0;borrowed=0;leveragedMargin=0;entry=0;trades++;
   }
  }
  const shortUnrealized=shortUnits?shortUnits*(shortEntry-price):0;\n  const equity=round(cash+units*price-borrowed+shortCollateral+shortUnrealized),drawdown=peak>0?(peak-equity)/peak:0;
  peak=Math.max(peak,equity);maxDrawdown=Math.max(maxDrawdown,drawdown);
  history.push({index:i,price,cash:round(cash),units:round(units),equity,drawdown:round(drawdown)});
 }
 const final=history[history.length-1],finalEquity=final.equity,totalReturn=round((finalEquity-start)/start),unrealized=round(units*(series[series.length-1]-entry)+shortUnits*(shortEntry-series[series.length-1]));
 return Object.freeze({strategy:name,family,startingCapital:start,finalEquity,netProfit:round(finalEquity-start),returnPct:round(totalReturn*100),realizedPnl:realized,unrealizedPnl:unrealized,income,feesAndTradingCount:trades,maxDrawdownPct:round(maxDrawdown*100),cash:cash,openUnits:units,borrowed,shortUnits,history,assumptions:{feeRate:fee,annualYield,periodDays:days,leverage:lev,targetProfit:target,stopLoss:stop,exitMultiplier:multiple},warning:'Backtest giả lập theo quy tắc khái quát, chỉ dùng chuỗi giá đầu vào; không dự báo lợi nhuận, không mô phỏng đầy đủ điều khoản từng sản phẩm.'});
}
function mount(){
 const panel=root.document&&root.document.getElementById('principia-economy-root'),tabs=panel&&panel.querySelector('.pe-tabs'),content=panel&&panel.querySelector('#pe-content');
 if(!panel||!tabs||!content||panel.dataset.strategyLabReady)return false;
 const catalog=root.PrincipiaInvestmentModels&&root.PrincipiaInvestmentModels.items;
 if(!Array.isArray(catalog)||catalog.length!==70)return false;
 const button=root.document.createElement('button');button.type='button';button.textContent='Phòng thí nghiệm 70 mô hình';tabs.appendChild(button);panel.dataset.strategyLabReady='1';
 button.addEventListener('click',()=>{tabs.querySelectorAll('button').forEach(x=>x.classList.remove('active'));button.classList.add('active');render(content,catalog);});return true;
}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function render(el,catalog){
 el.innerHTML='<section class="psl"><header><b>70-MODEL STRATEGY LAB</b><p>Chạy backtest bằng chuỗi giá do bạn nhập hoặc dữ liệu lịch sử đã xác minh. Không tự tạo giá thị trường.</p></header><form id="psl-form"><label>Mô hình đầu tư<select name="strategy">'+catalog.map(x=>'<option value="'+esc(x.name)+'">'+esc(x.group)+' · '+esc(x.name)+'</option>').join('')+'</select></label><label>Chuỗi giá (cách nhau dấu phẩy)<textarea name="prices" rows="3" required placeholder="100, 102, 98, 105, 110"></textarea></label><label>Chuỗi giá đối chiếu (bắt buộc với arbitrage)<textarea name="referencePrices" rows="2" placeholder="99, 101, 100, 103, 108"></textarea></label><div class="psl-grid"><label>Vốn ảo<input name="capital" type="number" min="1" value="100000000" required></label><label>Phân bổ vốn (0–1)<input name="allocation" type="number" min=".001" max="1" step=".01" value=".25" required></label><label>Phí mỗi chiều<input name="feeRate" type="number" min="0" max=".1" step=".0001" value=".0015" required></label><label>Lợi suất năm (0–5)<input name="annualYield" type="number" min="0" max="5" step=".01" value=".05" required></label><label>Số ngày mỗi điểm<input name="periodDays" type="number" min=".01" max="3650" value="1" required></label><label>Đòn bẩy giả định<input name="leverage" type="number" min="1" max="100" value="1" required></label><label>Mục tiêu chốt lời<input name="targetProfit" type="number" min=".001" max="10" step=".01" value=".08" required></label><label>Cắt lỗ<input name="stopLoss" type="number" min=".001" max=".99" step=".01" value=".05" required></label><label>Hệ số thoái vốn (VC/PE)<input name="exitMultiplier" type="number" min="0" max="100" step=".1" value="2" required></label></div><button>Chạy mô phỏng</button></form><div id="psl-result" aria-live="polite"></div></section>';
 const form=el.querySelector('#psl-form'),result=el.querySelector('#psl-result');
 form.addEventListener('submit',ev=>{ev.preventDefault();try{const d=Object.fromEntries(new FormData(form));const out=run({...d,capital:+d.capital,allocation:+d.allocation,feeRate:+d.feeRate,annualYield:+d.annualYield,periodDays:+d.periodDays,leverage:+d.leverage,targetProfit:+d.targetProfit,stopLoss:+d.stopLoss,exitMultiplier:+d.exitMultiplier});result.innerHTML='<div class="psl-result"><h3>'+esc(out.strategy)+' · '+esc(out.family)+'</h3><div class="psl-grid"><article>Vốn cuối<strong>'+fmt(out.finalEquity)+'</strong></article><article>Lãi/lỗ<strong>'+fmt(out.netProfit)+'</strong></article><article>Hiệu suất<strong>'+out.returnPct.toFixed(2)+'%</strong></article><article>Drawdown tối đa<strong>'+out.maxDrawdownPct.toFixed(2)+'%</strong></article><article>Giao dịch<strong>'+out.feesAndTradingCount+'</strong></article><article>Thu nhập mô phỏng<strong>'+fmt(out.income)+'</strong></article></div><p>'+esc(out.warning)+'</p><table><thead><tr><th>Điểm</th><th>Giá</th><th>Tiền mặt</th><th>Vị thế</th><th>Tài sản ròng</th></tr></thead><tbody>'+out.history.slice(-30).map(h=>'<tr><td>'+h.index+'</td><td>'+h.price+'</td><td>'+fmt(h.cash)+'</td><td>'+h.units.toFixed(6)+'</td><td>'+fmt(h.equity)+'</td></tr>').join('')+'</tbody></table></div>';}catch(e){result.textContent=e.message;}});
}
const fmt=v=>new Intl.NumberFormat('vi-VN',{maximumFractionDigits:0}).format(v)+' ₫';
if(typeof module!=='undefined'&&module.exports)module.exports={run,classify};
root.PrincipiaStrategyLab=Object.freeze({run,classify});
if(root.document){const boot=()=>{let i=0;const retry=()=>{if(!mount()&&++i<40)root.setTimeout(retry,250);};retry();};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof window!=='undefined'?window:globalThis);
