const test = require('node:test');
const assert = require('node:assert/strict');
const { createEngine, CURRENCIES, PROPERTIES, GOODS } = require('../../assets/js/principia-economy.js');

function memoryStore() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value) };
}

test('starts with a real-unit VND household budget and persists state', () => {
  const storage = memoryStore();
  const engine = createEngine(storage);
  assert.equal(engine.getState().cash, 20000000);
  engine.deposit(5000000);
  assert.equal(engine.getState().bank, 5000000);
  assert.equal(createEngine(storage).getState().bank, 5000000);
});

test('rejects invalid and unaffordable bank transactions', () => {
  const engine = createEngine(memoryStore());
  assert.throws(() => engine.deposit(-1), /nguyên không âm/);
  assert.throws(() => engine.deposit(21000000), /Không đủ tiền mặt/);
  assert.throws(() => engine.withdraw(1), /không đủ/);
  assert.throws(() => engine.takeLoan(1000, 0.12), /không hợp lệ/);
});

test('loan principal can be repaid only up to remaining balance', () => {
  const engine = createEngine(memoryStore());
  engine.takeLoan(10000000, 0.12);
  const loan = engine.getState().loans[0];
  engine.repayLoan(4000000, loan.id);
  assert.equal(engine.getState().loans[0].remaining, 6000000);
  assert.throws(() => engine.repayLoan(7000000, loan.id), /vượt dư nợ/);
});

test('foreign exchange applies a spread and tracks currencies', () => {
  const engine = createEngine(memoryStore());
  engine.exchange('USD', 100, 'buy');
  assert.equal(engine.getState().foreign.USD, 100);
  const before = engine.getState().cash;
  engine.exchange('USD', 50, 'sell');
  assert.equal(engine.getState().foreign.USD, 50);
  assert.ok(engine.getState().cash > before);
  assert.equal(CURRENCIES.USD, 25400);
});

test('stock trading checks holdings and cash', () => {
  const engine = createEngine(memoryStore());
  engine.buyStock('VNF', 10);
  assert.equal(engine.getState().stocks.VNF, 10);
  engine.sellStock('VNF', 4);
  assert.equal(engine.getState().stocks.VNF, 6);
  assert.throws(() => engine.sellStock('VNF', 7), /Không đủ cổ phiếu/);
});

test('real estate purchases produce rent and incur maintenance each month', () => {
  const engine = createEngine(memoryStore());
  const property = PROPERTIES.find(item => item.id === 'room');
  engine.takeLoan(property.price, 0.01);
  engine.buyProperty('room');
  const cashBefore = engine.getState().cash;
  engine.advanceMonth();
  assert.equal(engine.getState().properties.length, 1);
  assert.ok(engine.getState().cash > cashBefore - 8000000);
});

test('grocery shop supports inventory, sales and VAT records', () => {
  const engine = createEngine(memoryStore());
  engine.openShop();
  const good = GOODS[0];
  engine.restock(good.id, 10);
  engine.sellGoods(good.id, 2);
  const state = engine.getState();
  assert.equal(state.shop.inventory[good.id], 8);
  assert.equal(state.shop.revenue, good.price * 2);
  assert.ok(state.taxPaid > 0);
  assert.throws(() => engine.sellGoods(good.id, 100), /không đủ hàng/);
});

test('monthly close advances calendar and records taxes and interest', () => {
  const engine = createEngine(memoryStore());
  engine.deposit(10000000);
  engine.takeLoan(5000000, 0.12);
  const previousMonth = engine.getState().month;
  engine.advanceMonth();
  const state = engine.getState();
  assert.equal(state.month, previousMonth + 1);
  assert.ok(state.taxPaid > 0);
  assert.equal(state.ledger.at(-1).type, 'monthly-close');
});

test('monthly close taxes retail profit once and resets the monthly tax base', () => {
  const engine = createEngine(memoryStore());
  engine.openShop();
  const good = GOODS[0];
  engine.restock(good.id, 10);
  engine.sellGoods(good.id, 2);
  const beforeClose = engine.getState().shop.monthlyProfit;
  assert.ok(beforeClose > 0);
  engine.advanceMonth();
  assert.equal(engine.getState().shop.monthlyProfit, 0);
  assert.ok(engine.getState().taxPaid > 0);
});

test('simulated stock prices persist across engine reloads', () => {
  const storage = memoryStore();
  const first = createEngine(storage);
  first.advanceMonth();
  const prices = first.getMarket().stocks;
  const second = createEngine(storage);
  assert.deepEqual(
    Object.keys(second.getMarket().stocks).map(code => second.getMarket().stocks[code].price),
    Object.keys(prices).map(code => prices[code].price)
  );
});
