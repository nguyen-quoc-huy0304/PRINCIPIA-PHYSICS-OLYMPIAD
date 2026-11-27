const test = require('node:test');
const assert = require('node:assert/strict');
const { createEngine, INITIAL_CASH } = require('../../assets/js/principia-retail-simulator.js');

function fixture() {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  let current = new Date('2026-01-01T00:00:00.000Z');
  const engine = createEngine({ storage, now: () => current });
  return { engine, storage, setDay(day) { current = new Date(day); } };
}

test('creates a shop using virtual capital and registers validated products', () => {
  const { engine } = fixture();
  assert.equal(engine.getSummary().virtualCash, INITIAL_CASH);
  engine.createStore({ name: 'Tạp hóa An Bình', capital: 20000000 });
  engine.addProduct({ sku: 'WATER', name: 'Nước suối', category: 'Đồ uống', unit: 'chai', shelfLifeDays: 365, salePrice: 8000 });
  assert.equal(engine.getSummary().storeCash, 20000000);
  assert.equal(engine.getState().products.length, 1);
});

test('purchases stock and sells FIFO inventory with VAT and gross margin', () => {
  const { engine } = fixture();
  engine.createStore({ name: 'Cửa hàng', capital: 10000000 });
  engine.addProduct({ sku: 'RICE', name: 'Gạo', category: 'Thực phẩm', unit: 'kg', shelfLifeDays: 180, salePrice: 20000, vatRate: 0.05 });
  engine.purchaseStock({ sku: 'RICE', quantity: 100, unitCost: 12000, expiryDays: 90, supplier: 'Nhà cung cấp A' });
  const sale = engine.sell({ sku: 'RICE', quantity: 10 });
  assert.equal(sale.revenue, 200000);
  assert.equal(sale.vat, 10000);
  assert.equal(sale.costOfGoods, 120000);
  assert.equal(engine.getSummary().inventoryValue, 1080000);
  assert.equal(engine.getSummary().storeCash, 10000000 - 1200000 + 210000);
});

test('blocks overselling and insufficient stock purchase without mutating state', () => {
  const { engine } = fixture();
  engine.createStore({ name: 'Cửa hàng', capital: 1000000 });
  engine.addProduct({ sku: 'MILK', name: 'Sữa', category: 'Đồ uống', unit: 'hộp', shelfLifeDays: 30, salePrice: 15000 });
  const before = engine.getState();
  assert.throws(() => engine.sell({ sku: 'MILK', quantity: 1 }), /Tồn kho/);
  assert.deepEqual(engine.getState(), before);
  assert.throws(() => engine.purchaseStock({ sku: 'MILK', quantity: 100, unitCost: 20000, expiryDays: 20 }), /Không đủ tiền/);
  assert.deepEqual(engine.getState(), before);
});

test('expires unsold stock and records inventory write-off', () => {
  const { engine } = fixture();
  engine.createStore({ name: 'Cửa hàng', capital: 1000000 });
  engine.addProduct({ sku: 'YOGURT', name: 'Sữa chua', category: 'Thực phẩm', unit: 'hộp', shelfLifeDays: 7, salePrice: 10000 });
  engine.purchaseStock({ sku: 'YOGURT', quantity: 10, unitCost: 5000, expiryDays: 2 });
  engine.advance(2);
  assert.equal(engine.getSummary().inventoryUnits, 0);
  assert.equal(engine.getSummary().wasteValue, 50000);
});

test('records operating expenses, computes taxes and persists state', () => {
  const { engine, storage } = fixture();
  engine.createStore({ name: 'Tạp hóa', capital: 5000000 });
  engine.addProduct({ sku: 'SOAP', name: 'Xà phòng', category: 'Gia dụng', unit: 'bánh', shelfLifeDays: 1000, salePrice: 20000, vatRate: 0.08 });
  engine.purchaseStock({ sku: 'SOAP', quantity: 10, unitCost: 10000, expiryDays: 900 });
  engine.sell({ sku: 'SOAP', quantity: 5 });
  engine.addExpense({ category: 'Điện nước', amount: 10000, note: 'Hóa đơn tháng' });
  const result = engine.closeTaxPeriod({ corporateTaxRate: 0.2 });
  assert.equal(result.vatPaid, 8000);
  assert.equal(result.profitBeforeTax, 40000);
  assert.equal(result.incomeTax, 8000);
  const restored = createEngine({ storage, now: () => new Date('2026-01-02T00:00:00.000Z') });
  assert.equal(restored.getSummary().taxPaid, 16000);
  assert.equal(restored.getState().store.name, 'Tạp hóa');
});

test('rejects malformed values and rolls back when storage persistence fails', () => {
  const { engine } = fixture();
  engine.createStore({ name: 'Cửa hàng', capital: 1000000 });
  assert.throws(() => engine.addProduct({ sku: 'bad sku', name: 'X', category: 'X', unit: 'cái', shelfLifeDays: 10, salePrice: 1 }), /Mã hàng/);
  assert.throws(() => engine.advance(1.5), /số nguyên/);
  const failing = createEngine({ storage: { getItem: () => null, setItem: () => { throw new Error('disk full'); } } });
  assert.throws(() => failing.createStore({ name: 'Không lưu', capital: 1000000 }), /Lưu dữ liệu thất bại/);
  assert.equal(failing.getSummary().virtualCash, INITIAL_CASH);
});
