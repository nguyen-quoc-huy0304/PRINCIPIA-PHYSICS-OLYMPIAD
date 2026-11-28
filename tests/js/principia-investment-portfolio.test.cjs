const test = require('node:test');
const assert = require('node:assert/strict');
const {createEngine,ASSET_TYPES,STORAGE_KEY} = require('../../assets/js/principia-investment-portfolio.js');

function memoryStore() {
  const values = new Map();
  return {getItem:key => values.get(key) ?? null,setItem:(key,value) => values.set(key,value)};
}

const buyInput = {
  assetType:'stocks',symbol:'FPT',name:'FPT Corporation',
  quantity:10,price:100000,feeRate:0.0015,currency:'VND',
  priceSource:'Giá nhập thủ công · mô phỏng'
};

test('supports every asset class from the investment universe', () => {
  assert.equal(ASSET_TYPES.length,24);
  assert.equal(new Set(ASSET_TYPES.map(item => item.id)).size,24);
});

test('records a purchase with weighted average cost and fee', () => {
  const engine = createEngine(memoryStore());
  engine.buy(buyInput);
  engine.buy({...buyInput,quantity:10,price:120000});
  const position = engine.getSummary().positions[0];
  assert.equal(position.quantity,20);
  assert.equal(position.averageCost,110165);
  assert.equal(position.lastPrice,null);
  assert.equal(engine.getSummary().unpricedCount,1);
});

test('sale calculates fee, tax, cost basis and realized P/L', () => {
  const engine = createEngine(memoryStore());
  engine.buy(buyInput);
  engine.sell({...buyInput,quantity:4,price:120000,taxRate:0.001});
  const state = engine.getState();
  assert.equal(state.positions[0].quantity,6);
  assert.equal(state.trades.at(-1).realizedPnl,78200);
});

test('rejects overselling and invalid prices without changing state', () => {
  const engine = createEngine(memoryStore());
  engine.buy(buyInput);
  const before = engine.getState();
  assert.throws(() => engine.sell({...buyInput,quantity:11}),/vượt tài sản/);
  assert.throws(() => engine.buy({...buyInput,price:Infinity}),/số dương hợp lệ/);
  assert.deepEqual(engine.getState(),before);
});

test('persists positions across engine reloads', () => {
  const store = memoryStore();
  createEngine(store).buy(buyInput);
  const restored = createEngine(store);
  assert.equal(restored.getSummary().positions[0].quantity,10);
  assert.ok(store.getItem(STORAGE_KEY));
});

test('verified price marks valuation separately from acquisition price', () => {
  const engine = createEngine(memoryStore());
  engine.buy(buyInput);
  engine.markPrice('stocks','FPT',110000,'SSI FastConnect · 2026-11-27T09:00:00+07:00');
  const summary = engine.getSummary();
  assert.equal(summary.marketValueVnd,1100000);
  assert.equal(summary.unrealizedPnlVnd,98500);
  assert.equal(summary.positions[0].priceSource,'SSI FastConnect · 2026-11-27T09:00:00+07:00');
});

test('rejects unsupported asset types, excessive fees and non-finite values', () => {
  const engine = createEngine(memoryStore());
  assert.throws(() => engine.buy({...buyInput,assetType:'unknown'}),/không nằm trong danh mục/);
  assert.throws(() => engine.buy({...buyInput,feeRate:0.5}),/Phí hoặc thuế/);
  assert.throws(() => engine.buy({...buyInput,quantity:NaN}),/số dương hợp lệ/);
});

test('drops malformed or unsupported records restored from local storage', () => {
  const raw = {
    version:1,
    positions:[{id:'bad',assetType:'script',symbol:'X',quantity:1,averageCost:10}],
    trades:[{side:'buy',assetType:'stocks',symbol:'FPT',quantity:1,price:10,gross:10,at:42}]
  };
  const store = {getItem:() => JSON.stringify(raw),setItem:() => {}};
  const engine = createEngine(store);
  assert.equal(engine.getSummary().positions.length,0);
  assert.equal(engine.getSummary().trades.length,0);
});

test('prevents mixing currencies inside one position', () => {
  const engine = createEngine(memoryStore());
  engine.buy(buyInput);
  assert.throws(() => engine.buy({...buyInput,currency:'USD'}),/Không thể trộn/);
  assert.equal(engine.getSummary().positions[0].quantity,10);
});
test('portfolio buys and sells settle atomically through the selected shared wallet',()=>{let cash=2000;const wallet={getBalance:()=>cash,transact(ops){const delta=ops.reduce((sum,op)=>sum+(op.kind==='credit'?op.amount:-op.amount),0);if(cash+delta<0)throw Error('insufficient');cash=Math.round((cash+delta)*100)/100;}},engine=createEngine(memoryStore(),wallet);engine.buy({...buyInput,quantity:1,price:1000,feeRate:0});assert.equal(cash,1000);engine.sell({...buyInput,quantity:.5,price:1200,feeRate:0,taxRate:0});assert.equal(cash,1600);assert.equal(engine.getSummary().cash,1600);});
test('portfolio shared-wallet rejection restores both portfolio and virtual cash',()=>{let cash=500;const values=new Map(),store={getItem:k=>values.get(k)??null,setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},wallet={getBalance:()=>cash,transact(ops){const delta=ops.reduce((sum,op)=>sum+(op.kind==='credit'?op.amount:-op.amount),0);if(cash+delta<0)throw Error('insufficient');cash+=delta;}},engine=createEngine(store,wallet);assert.throws(()=>engine.buy({...buyInput,quantity:1,price:1000,feeRate:0}),/insufficient/);assert.equal(cash,500);assert.equal(engine.getState().positions.length,0);assert.equal(values.has(STORAGE_KEY),false);});
