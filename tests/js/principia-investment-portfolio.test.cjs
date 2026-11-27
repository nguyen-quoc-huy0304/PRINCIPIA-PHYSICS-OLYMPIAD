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
  assert.equal(position.averageCost,110082.5);
  assert.equal(position.lastPrice,null);
  assert.equal(engine.getSummary().unpricedCount,1);
});

test('sale calculates fee, tax, cost basis and realized P/L', () => {
  const engine = createEngine(memoryStore());
  engine.buy(buyInput);
  engine.sell({...buyInput,quantity:4,price:120000,taxRate:0.001});
  const state = engine.getState();
  assert.equal(state.positions[0].quantity,6);
  assert.equal(state.trades[0].realizedPnl,77520);
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
  assert.equal(summary.unrealizedPnlVnd,98485);
  assert.equal(summary.positions[0].priceSource,'SSI FastConnect · 2026-11-27T09:00:00+07:00');
});

test('rejects unsupported asset types, excessive fees and non-finite values', () => {
  const engine = createEngine(memoryStore());
  assert.throws(() => engine.buy({...buyInput,assetType:'unknown'}),/không nằm trong danh mục/);
  assert.throws(() => engine.buy({...buyInput,feeRate:0.5}),/Phí hoặc thuế/);
  assert.throws(() => engine.buy({...buyInput,quantity:NaN}),/số dương hợp lệ/);
});
