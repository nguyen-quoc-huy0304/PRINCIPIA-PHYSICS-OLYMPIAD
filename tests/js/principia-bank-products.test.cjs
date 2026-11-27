const test = require('node:test');
const assert = require('node:assert/strict');
const { createBankEngine } = require('../../assets/js/principia-bank-products.js');

function fixture(start = '2026-01-01T00:00:00.000Z') {
  const data = new Map();
  const storage = {
    getItem: key => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value)
  };
  const wallet = {
    balance: 100000000,
    debit(amount) {
      if (!Number.isSafeInteger(amount) || amount <= 0 || amount > this.balance) {
        throw new RangeError('Ví không đủ tiền hoặc số tiền không hợp lệ.');
      }
      this.balance -= amount;
    },
    credit(amount) {
      if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(this.balance + amount)) {
        throw new RangeError('Số dư ví vượt giới hạn.');
      }
      this.balance += amount;
    }
  };
  let now = new Date(start);
  return {
    storage, wallet, setNow(value) { now = new Date(value); },
    engine: createBankEngine({ storage, wallet, now: () => now })
  };
}

test('opens term deposit, compounds interest by elapsed days and pays at maturity', () => {
  const f = fixture();
  f.engine.openTermDeposit(10000000, 0.06, 365);
  assert.equal(f.wallet.balance, 90000000);
  f.setNow('2027-01-01T00:00:00.000Z');
  const id = f.engine.getState().deposits[0].id;
  const result = f.engine.settleTermDeposit(id, false);
  assert.ok(result.interest > 600000);
  assert.equal(result.early, false);
  assert.equal(f.wallet.balance, 100000000 + result.interest);
  assert.equal(result.state.deposits[0].status, 'closed');
});

test('requires explicit early-withdrawal confirmation and applies statutory simulation rate', () => {
  const f = fixture();
  f.engine.openTermDeposit(5000000, 0.08, 180);
  const id = f.engine.getState().deposits[0].id;
  f.setNow('2026-02-01T00:00:00.000Z');
  assert.throws(() => f.engine.settleTermDeposit(id, false), /cần xác nhận/);
  const result = f.engine.settleTermDeposit(id, true);
  assert.equal(result.early, true);
  assert.ok(result.interest > 0);
  assert.equal(f.wallet.balance, 100000000 - 5000000 + result.payout);
});

test('creates an amortizing loan with a bounded repayment amount', () => {
  const f = fixture();
  f.engine.createLoan(12000000, 0.12, 12);
  const loan = f.engine.getState().loans[0];
  assert.ok(loan.monthlyPayment > 1000000);
  assert.equal(f.wallet.balance, 112000000);
  const result = f.engine.repayLoan(loan.id, loan.monthlyPayment);
  assert.ok(result.interestPaid > 0);
  assert.ok(result.principalPaid > 0);
  assert.ok(result.state.loans[0].remaining < 12000000);
});

test('rejects invalid products and preserves state when wallet refuses a debit', () => {
  const f = fixture();
  assert.throws(() => f.engine.openTermDeposit(0, 0.05, 90), /số nguyên dương/);
  assert.throws(() => f.engine.createLoan(1000000, 0.8, 12), /không hợp lệ/);
  const before = f.engine.getState();
  assert.throws(() => f.engine.openTermDeposit(200000000, 0.05, 90), /Ví không đủ/);
  assert.deepEqual(f.engine.getState(), before);
});

test('persists sanitized deposit and loan records across reloads', () => {
  const f = fixture();
  f.engine.openTermDeposit(2000000, 0.04, 90);
  f.engine.createLoan(3000000, 0.1, 24);
  const reloaded = createBankEngine({ storage: f.storage, wallet: f.wallet, now: () => new Date('2026-01-02') });
  assert.equal(reloaded.getState().deposits.length, 1);
  assert.equal(reloaded.getState().loans.length, 1);
  assert.equal(reloaded.getState().ledger.length, 2);
});
