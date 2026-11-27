const test = require('node:test');
const assert = require('node:assert/strict');
const { createEnterpriseEngine } = require('../../assets/js/principia-enterprise-operations.js');

function fixture() {
  const values = new Map();
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const wallet = {
    balance: 100000000,
    debit(amount) {
      if (!Number.isSafeInteger(amount) || amount <= 0 || amount > this.balance) throw new RangeError('Ví không đủ tiền.');
      this.balance -= amount;
    },
    credit(amount) { this.balance += amount; }
  };
  const engine = createEnterpriseEngine({ wallet, storage, now: () => new Date('2026-01-01T00:00:00.000Z') });
  return { engine, wallet, storage };
}

test('creates a company with separate business cash and records owner capital', () => {
  const f = fixture();
  f.engine.createBusiness('Tiệm bánh', 20000000);
  const company = f.engine.getState().businesses[0];
  assert.equal(company.cash, 20000000);
  assert.equal(f.wallet.balance, 80000000);
  assert.equal(f.engine.getState().ledger[0].type, 'capital');
});

test('purchases materials and produces finished goods using recipe quantities', () => {
  const f = fixture();
  f.engine.createBusiness('Tiệm bánh', 20000000);
  const id = f.engine.getState().businesses[0].id;
  f.engine.purchaseMaterial(id, 'flour', 10, 20000);
  f.engine.purchaseMaterial(id, 'sugar', 2, 25000);
  f.engine.purchaseMaterial(id, 'packaging', 10, 1000);
  f.engine.produce(id, 'bread', 10);
  const company = f.engine.getState().businesses[0];
  assert.equal(company.products.bread, 10);
  assert.equal(company.materials.flour, 0);
  assert.equal(company.materials.sugar, 1);
  assert.equal(company.materialValues.sugar, 25000);
  assert.equal(company.cash, 19715000);
  assert.equal(company.productionCost, 260000);
});

test('blocks production when a recipe lacks inputs without mutating inventory', () => {
  const f = fixture();
  f.engine.createBusiness('Xưởng', 5000000);
  const id = f.engine.getState().businesses[0].id;
  const before = f.engine.getState();
  assert.throws(() => f.engine.produce(id, 'bread', 1), /Thiếu nguyên liệu/);
  assert.deepEqual(f.engine.getState(), before);
});

test('sales track VAT separately and enforce available finished inventory', () => {
  const f = fixture();
  f.engine.createBusiness('Tiệm bánh', 20000000);
  const id = f.engine.getState().businesses[0].id;
  f.engine.purchaseMaterial(id, 'flour', 2, 20000);
  f.engine.purchaseMaterial(id, 'sugar', 1, 25000);
  f.engine.purchaseMaterial(id, 'packaging', 2, 1000);
  f.engine.produce(id, 'bread', 2);
  f.engine.sell(id, 'bread', 2, 10000);
  const company = f.engine.getState().businesses[0];
  assert.equal(company.products.bread, 0);
  assert.equal(company.revenue, 20000);
  assert.equal(company.taxPayable, 1600);
  assert.throws(() => f.engine.sell(id, 'bread', 1, 10000), /Tồn kho/);
});

test('payroll and tax settlement are bounded by available cash', () => {
  const f = fixture();
  f.engine.createBusiness('Cửa hàng', 10000000);
  const id = f.engine.getState().businesses[0].id;
  f.engine.hire(id, 'Thu ngân', 5000000);
  f.engine.runPayroll(id);
  assert.equal(f.engine.getState().businesses[0].payrollAccrued, 5000000);
  const result = f.engine.closeTaxPeriod(id);
  assert.equal(result.profit, -5000000);
  assert.equal(result.incomeTax, 0);
  assert.equal(f.engine.getState().businesses[0].payrollAccrued, 0);
});

test('persists business state and validates company names and capital', () => {
  const f = fixture();
  assert.throws(() => f.engine.createBusiness('A', 1000000), /Tên doanh nghiệp/);
  assert.throws(() => f.engine.createBusiness('Doanh nghiệp', 10), /Vốn thành lập/);
  f.engine.createBusiness('Doanh nghiệp', 3000000);
  const restored = createEnterpriseEngine({ wallet: f.wallet, storage: f.storage });
  assert.equal(restored.getState().businesses[0].name, 'Doanh nghiệp');
});
