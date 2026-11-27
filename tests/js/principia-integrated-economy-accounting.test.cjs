const test = require('node:test');
const assert = require('node:assert/strict');
const { createEngine } = require('../../assets/js/principia-integrated-economy.js');

function setup() {
  const values = new Map();
  const storage = {
    getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
  return createEngine({ storage, now: () => '2026-11-27T00:00:00.000Z' });
}

test('household consumption transfers cash to a stocked retailer', () => {
  const engine = setup();
  engine.createHousehold({ name: 'Household', cash: 50000, monthlyConsumption: 5000 });
  engine.createFirm({ name: 'Retailer', cash: 100000 });
  engine.createProduct({ sku: 'RICE', name: 'Rice', baseCost: 1000 });
  const household = engine.getState().households[0];
  const retailer = engine.getState().firms[0];
  engine.produce({ firmId: retailer.id, sku: 'RICE', quantity: 20 });
  engine.advance(30);
  const state = engine.getState();
  assert.equal(state.households[0].cash, 45000);
  assert.equal(state.firms[0].cash, 85000);
  assert.ok(state.firms[0].inventory[0].quantity < 20);
  assert.equal(state.ledger.at(-2).type, 'HOUSEHOLD_CONSUMPTION');
  assert.equal(household.id, state.ledger.at(-2).from);
});

test('income tax is assessed on new wages, not household wealth', () => {
  const engine = setup();
  engine.createHousehold({ name: 'Worker', cash: 1000000 });
  engine.createFirm({ name: 'Factory', cash: 100000, monthlyRevenue: 50000, monthlyCost: 5000, wage: 10000 });
  engine.hire({ firmId: engine.getState().firms[0].id, householdId: engine.getState().households[0].id });
  engine.advance(30);
  const before = engine.getState().households[0].cash;
  const result = engine.assessTax({ householdRate: 0.1, corporateRate: 0 });
  assert.equal(result.tax, 1000);
  assert.equal(engine.getState().households[0].cash, before - 1000);
  assert.equal(engine.getState().households[0].taxableIncome, 0);
  assert.equal(engine.assessTax({ householdRate: 0.1, corporateRate: 0 }).tax, 0);
});

test('corporate tax uses profit earned since the prior assessment', () => {
  const engine = setup();
  engine.createHousehold({ name: 'Buyer', cash: 10000 });
  engine.createFirm({ name: 'Shop', cash: 100000 });
  engine.createProduct({ sku: 'A', name: 'Item', baseCost: 100 });
  const firm = engine.getState().firms[0];
  const buyer = engine.getState().households[0];
  engine.produce({ firmId: firm.id, sku: 'A', quantity: 10 });
  engine.consumerSale({ firmId: firm.id, householdId: buyer.id, sku: 'A', quantity: 10, unitPrice: 200 });
  assert.equal(engine.assessTax({ householdRate: 0, corporateRate: 0.2 }).tax, 200);
  assert.equal(engine.assessTax({ householdRate: 0, corporateRate: 0.2 }).tax, 0);
});

test('bank lending is constrained by liquidity, not accounting equity', () => {
  const engine = setup();
  engine.createHousehold({ name: 'Borrower', cash: 0 });
  engine.createBank({ name: 'Bank', capital: 1000 });
  const bank = engine.getState().banks[0];
  const borrower = engine.getState().households[0];
  assert.throws(() => engine.borrow({ bankId: bank.id, borrowerType: 'household', borrowerId: borrower.id, amount: 1001 }));
  engine.borrow({ bankId: bank.id, borrowerType: 'household', borrowerId: borrower.id, amount: 800 });
  assert.equal(engine.getState().banks[0].capital, 1000);
  assert.equal(engine.getState().banks[0].liquidity, 200);
  assert.equal(engine.getState().banks[0].loansOutstanding, 800);
});

test('loan repayment restores liquidity and recognizes interest separately', () => {
  const engine = setup();
  engine.createHousehold({ name: 'Borrower', cash: 1000 });
  engine.createBank({ name: 'Bank', capital: 5000, lendingRate: 0.1 });
  const bank = engine.getState().banks[0];
  const borrower = engine.getState().households[0];
  engine.borrow({ bankId: bank.id, borrowerType: 'household', borrowerId: borrower.id, amount: 1000 });
  engine.advance(365);
  const loan = engine.getState().loans[0];
  engine.repay({ loanId: loan.id, amount: 100 });
  const after = engine.getState();
  assert.equal(after.banks[0].liquidity, 4100);
  assert.equal(after.banks[0].capital, 5010);
  assert.equal(after.banks[0].loansOutstanding, 990);
  assert.equal(after.loans[0].interestRepaid, 100);
});

test('deposit maturity cannot create bank liquidity and failed settlement rolls back', () => {
  const engine = setup();
  engine.createHousehold({ name: 'Saver', cash: 1000 });
  engine.createBank({ name: 'Thin Bank', capital: 0, depositRate: 0.1, lendingRate: 0.2 });
  const bank = engine.getState().banks[0];
  const saver = engine.getState().households[0];
  engine.deposit({ bankId: bank.id, householdId: saver.id, amount: 1000, termDays: 1 });
  assert.throws(() => engine.advance(1), /thiếu thanh khoản/);
  assert.equal(engine.getState().day, 0);
  assert.equal(engine.getState().deposits[0].paid, false);
  assert.equal(engine.getState().households[0].cash, 0);
});
