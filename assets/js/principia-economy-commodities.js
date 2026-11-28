(function(root){'use strict';
const KEY='principia:commodities-sim:v1',MAX_LOG=300,SEED=250000000;
const ASSETS=[
{id:'gold',name:'Vàng',cat:'Kim loại quý',unit:'gram',price:2450000,vol:.018},
{id:'silver',name:'Bạc',cat:'Kim loại quý',unit:'gram',price:31500,vol:.035},
{id:'platinum',name:'Bạch kim',cat:'Kim loại quý',unit:'gram',price:980000,vol:.03},
{id:'palladium',name:'Palladium',cat:'Kim loại quý',unit:'gram',price:1050000,vol:.04},
{id:'copper',name:'Đồng',cat:'Kim loại công nghiệp',unit:'kg',price:245000,vol:.025},
{id:'aluminum',name:'Nhôm',cat:'Kim loại công nghiệp',unit:'kg',price:68000,vol:.022},
{id:'steel',name:'Thép',cat:'Kim loại công nghiệp',unit:'kg',price:24500,vol:.018},
{id:'iron-ore',name:'Quặng sắt',cat:'Kim loại công nghiệp',unit:'tấn',price:2850000,vol:.04},
{id:'lithium',name:'Lithium',cat:'Kim loại công nghiệp',unit:'kg',price:2350000,vol:.055},
{id:'nickel',name:'Niken',cat:'Kim loại công nghiệp',unit:'kg',price:365000,vol:.035},
{id:'oil',name:'Dầu thô',cat:'Năng lượng',unit:'thùng',price:1850000,vol:.045},
{id:'gas',name:'Khí tự nhiên',cat:'Năng lượng',unit:'MMBtu',price:92000,vol:.07},
{id:'coal',name:'Than',cat:'Năng lượng',unit:'tấn',price:2850000,vol:.04},
{id:'electricity',name:'Điện',cat:'Năng lượng',unit:'MWh',price:1850000,vol:.035},
{id:'uranium',name:'Uranium',cat:'Năng lượng',unit:'kg',price:2850000,vol:.06},
{id:'rice',name:'Gạo',cat:'Nông sản',unit:'tấn',price:12500000,vol:.025},
{id:'wheat',name:'Lúa mì',cat:'Nông sản',unit:'tấn',price:7800000,vol:.03},
{id:'corn',name:'Ngô',cat:'Nông sản',unit:'tấn',price:5900000,vol:.035},
{id:'soybean',name:'Đậu nành',cat:'Nông sản',unit:'tấn',price:14200000,vol:.03},
{id:'cotton',name:'Bông',cat:'Nông sản',unit:'tấn',price:38500000,vol:.035},
{id:'coffee',name:'Cà phê',cat:'Nông sản',unit:'tấn',price:95000000,vol:.05},
{id:'cocoa',name:'Ca cao',cat:'Nông sản',unit:'tấn',price:175000000,vol:.065},
{id:'sugar',name:'Đường',cat:'Nông sản',unit:'tấn',price:8200000,vol:.035},
{id:'rubber',name:'Cao su',cat:'Nông sản',unit:'tấn',price:38500000,vol:.04},
{id:'orange-juice',name:'Nước cam cô đặc',cat:'Nông sản',unit:'tấn',price:52500000,vol:.06},
{id:'timber',name:'Gỗ',cat:'Nguyên liệu',unit:'m³',price:6200000,vol:.035},
{id:'cement',name:'Xi măng',cat:'Nguyên liệu',unit:'tấn',price:1850000,vol:.02},
{id:'fertilizer',name:'Phân bón',cat:'Nguyên liệu',unit:'tấn',price:9200000,vol:.045},
{id:'shipping',name:'Cước vận tải',cat:'Chỉ số mô phỏng',unit:'đơn vị',price:1000000,vol:.04},
{id:'carbon',name:'Tín chỉ carbon',cat:'Chỉ số mô phỏng',unit:'tấn CO₂',price:850000,vol:.05}
].map(Object.freeze);
const clone=x=>JSON.parse(JSON.stringify(x));
const safeInt=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
function initial(){return {version:1,cash:SEED,prices:Object.fromEntries(ASSETS.map(a=>[a.id,a.price])),holdings:{},ledger:[],tick:0};}
function sanitize(raw){const s=initial();if(!raw||raw.version!==1)return s;s.cash=safeInt(raw.cash,0,Number.MAX_SAFE_INTEGER)?raw.cash:s.cash;s.tick=safeInt(raw.tick,0,1e9)?raw.tick:0;
for(const a of ASSETS){const p=raw.prices?.[a.id];if(Number.isSafeInteger(p)&&p>0&&p<1e15)s.prices[a.id]=p;const q=raw.holdings?.[a.id];if(Number.isSafeInteger(q)&&q>=0&&q<=1e9)s.holdings[a.id]=q;}
s.ledger=Array.isArray(raw.ledger)?raw.ledger.filter(x=>x&&typeof x.type==='string'&&Number.isSafeInteger(x.amount)&&typeof x.note==='string').slice(-MAX_LOG):[];return s;}
function createEngine(storage=root.localStorage,random=Math.random){let state;try{state=sanitize(JSON.parse(storage?.getItem(KEY)||'null'));}catch(_){state=initial();}
function persist(){try{storage?.setItem(KEY,JSON.stringify(state));}catch(e){throw new Error('Không lưu được trạng thái mô phỏng. '+e.message);}}
const snapshot=()=>clone(state);
function record(type,amount,note){state.ledger.push({id:'cm-'+Date.now().toString(36)+'-'+state.ledger.length,type,amount,note:String(note).slice(0,120),tick:state.tick,simulationOnly:true});if(state.ledger.length>MAX_LOG)state.ledger.splice(0,state.ledger.length-MAX_LOG);}
function trade(id,quantity,side){if(!Number.isSafeInteger(quantity)||quantity<1||quantity>1000000)throw new RangeError('Số lượng phải từ 1 đến 1.000.000 đơn vị.');const asset=ASSETS.find(a=>a.id===id);if(!asset||!['buy','sell'].includes(side))throw new TypeError('Lệnh mô phỏng không hợp lệ.');const price=state.prices[id],gross=price*quantity,fee=Math.ceil(gross*.001);if(!Number.isSafeInteger(gross)||gross>Number.MAX_SAFE_INTEGER)throw new RangeError('Giá trị lệnh quá lớn.');if(side==='buy'){if(state.cash<gross+fee)throw new Error('Không đủ tiền ảo trong ví.');state.cash-=gross+fee;state.holdings[id]=(state.holdings[id]||0)+quantity;}else{if((state.holdings[id]||0)<quantity)throw new Error('Không đủ hàng trong kho để bán.');state.holdings[id]-=quantity;state.cash+=gross-fee;}record(side,gross,side==='buy'?'Mua '+quantity+' '+asset.name+' (phí 0,1%)':'Bán '+quantity+' '+asset.name+' (phí 0,1%)');persist();return snapshot();}
function simulate(){state.tick++;for(const a of ASSETS){const drift=(random()-.5)*2*a.vol;state.prices[a.id]=Math.max(1,Math.round(state.prices[a.id]*(1+drift)));}record('tick',0,'Cập nhật biến động giá mô phỏng #'+state.tick);persist();return snapshot();}
function reset(){state=initial();persist();return snapshot();}
function getMarket(){return clone(ASSETS.map(a=>({...a,price:state.prices[a.id],quantity:state.holdings[a.id]||0})));}
return Object.freeze({getState:snapshot,getMarket,trade,simulate,reset});}
function esc(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function money(v){return new Intl.NumberFormat('vi-VN',{style:'currency',currency:'VND',maximumFractionDigits:0}).format(v);}
function mount(engine){if(!root.document||root.document.getElementById('principia-commodities-root'))return;const link=root.document.createElement('link');link.rel='stylesheet';link.href='/assets/css/principia-economy-commodities.css?v=20261128-sim1';root.document.head.appendChild(link);
const launch=root.document.createElement('button');launch.id='principia-commodities-launch';launch.type='button';launch.textContent='Thị trường hàng hóa';root.document.body.appendChild(launch);
const panel=root.document.createElement('aside');panel.id='principia-commodities-root';panel.hidden=true;panel.innerHTML='<header><div><strong>COMMODITY SIMULATOR</strong><small>Chỉ mô phỏng · Không liên kết thị trường thật</small></div><button data-close aria-label="Đóng">×</button></header><section class="pcm-summary"><div><small>Ví tiền ảo</small><b data-cash></b></div><div><small>Giá trị danh mục</small><b data-value></b></div><div><small>Chu kỳ mô phỏng</small><b data-tick></b></div></section><div class="pcm-controls"><input data-search type="search" placeholder="Tìm hàng hóa..."><select data-category><option value="">Tất cả nhóm</option></select><button data-simulate>Thay đổi giá (mô phỏng)</button><button data-reset>Reset ví</button></div><main data-list></main><section class="pcm-ledger"><h3>Lịch sử lệnh</h3><div data-ledger></div></section><footer>Tiền ảo nội bộ · Giá được tạo ngẫu nhiên trong ứng dụng · Không dùng dữ liệu thực</footer>';root.document.body.appendChild(panel);
let filter='',category='';const cats=[...new Set(ASSETS.map(a=>a.cat))];
panel.querySelector('[data-category]').innerHTML='<option value="">Tất cả nhóm</option>'+cats.map(c=>'<option>'+esc(c)+'</option>').join('');
function render(){const s=engine.getState(),market=engine.getMarket(),value=market.reduce((sum,a)=>sum+a.price*(s.holdings[a.id]||0),0);panel.querySelector('[data-cash]').textContent=money(s.cash);panel.querySelector('[data-value]').textContent=money(value);panel.querySelector('[data-tick]').textContent=s.tick;const list=panel.querySelector('[data-list]');const shown=market.filter(a=>(!filter||a.name.toLowerCase().includes(filter)||a.id.includes(filter))&&(!category||a.cat===category));list.innerHTML=shown.map(a=>'<article class="pcm-item"><div class="pcm-item-title"><b>'+esc(a.name)+'</b><small>'+esc(a.cat)+' · '+esc(a.unit)+'</small></div><strong>'+money(a.price)+'</strong><small>Đang giữ: '+a.quantity+'</small><div><input data-qty="'+a.id+'" type="number" min="1" max="1000000" value="1"><button data-buy="'+a.id+'">Mua</button><button data-sell="'+a.id+'">Bán</button></div></article>').join('')||'<p>Không tìm thấy hàng hóa.</p>';panel.querySelector('[data-ledger]').innerHTML=s.ledger.slice(-15).reverse().map(x=>'<p><span>'+esc(x.note)+'<small>Chu kỳ '+x.tick+'</small></span><b>'+money(x.amount)+'</b></p>').join('')||'<p>Chưa có giao dịch.</p>';}
panel.addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;try{if(b.hasAttribute('data-close')){panel.hidden=true;return;}if(b.hasAttribute('data-simulate'))engine.simulate();else if(b.hasAttribute('data-reset')){if(!root.confirm('Reset ví hàng hóa? Số dư và kho của mô phỏng này sẽ về ban đầu.'))return;engine.reset();}else if(b.dataset.buy||b.dataset.sell){const id=b.dataset.buy||b.dataset.sell,qty=Number(panel.querySelector('[data-qty="'+id+'"]').value);engine.trade(id,qty,b.dataset.buy?'buy':'sell');}render();}catch(err){root.alert(err.message);}});
panel.querySelector('[data-search]').addEventListener('input',e=>{filter=e.target.value.trim().toLowerCase();render();});panel.querySelector('[data-category]').addEventListener('change',e=>{category=e.target.value;render();});launch.addEventListener('click',()=>{panel.hidden=!panel.hidden;if(!panel.hidden)render();});render();}
const api=Object.freeze({ASSETS,createEngine,mount});root.PrincipiaSimulatedCommodities=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;if(root.document){const boot=()=>{try{mount(createEngine());}catch(e){root.console?.error('[PRINCIPIA commodities]',e);}};if(root.document.readyState==='loading')root.document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();}
})(typeof window!=='undefined'?window:globalThis);