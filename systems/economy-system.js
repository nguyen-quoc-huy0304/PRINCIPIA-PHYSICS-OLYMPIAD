"use strict";

/**
 * PRINCIPIA Economic Systems — deterministic, validated economic simulation primitives.
 * These are a simulation ledger, not investment advice or real-world financial services.
 */

const DEFAULT_CONFIG = Object.freeze({
  startingCash: 10000,
  priceIndex: 100,
  interestRate: 0.03,
  taxRate: 0.1,
  production: 100,
  demand: 100,
  supply: 100,
  unemployment: 0.05,
  debt: 0,
  treasury: 0,
  reserveRatio: 0.1
});

function finiteRange(value, field, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${field} must be between ${min} and ${max}`);
  }
  return value;
}

function createEconomy(config = {}) {
  const state = { ...DEFAULT_CONFIG, ...config };
  state.startingCash = finiteRange(state.startingCash, "startingCash", 0, 1e12);
  state.priceIndex = finiteRange(state.priceIndex, "priceIndex", 0.01, 1e9);
  state.interestRate = finiteRange(state.interestRate, "interestRate", -0.5, 1);
  state.taxRate = finiteRange(state.taxRate, "taxRate", 0, 1);
  state.production = finiteRange(state.production, "production", 0, 1e9);
  state.demand = finiteRange(state.demand, "demand", 0, 1e9);
  state.supply = finiteRange(state.supply, "supply", 0, 1e9);
  state.unemployment = finiteRange(state.unemployment, "unemployment", 0, 1);
  state.debt = finiteRange(state.debt, "debt", 0, 1e12);
  state.treasury = finiteRange(state.treasury, "treasury", -1e12, 1e12);
  state.reserveRatio = finiteRange(state.reserveRatio, "reserveRatio", 0, 1);
  let tick = 0;

  function snapshot() {
    return Object.freeze({ ...state, tick });
  }

  function simulateTick({ productivity = 0, demandShock = 0, supplyShock = 0, fiscalSpending = 0, taxAdjustment = 0 } = {}) {
    productivity = finiteRange(productivity, "productivity", -1, 1);
    demandShock = finiteRange(demandShock, "demandShock", -1, 1);
    supplyShock = finiteRange(supplyShock, "supplyShock", -1, 1);
    fiscalSpending = finiteRange(fiscalSpending, "fiscalSpending", 0, 1e9);
    taxAdjustment = finiteRange(taxAdjustment, "taxAdjustment", -0.5, 0.5);

    const taxRate = Math.min(1, Math.max(0, state.taxRate + taxAdjustment));
    const production = Math.max(0, state.production * (1 + productivity + supplyShock));
    const demand = Math.max(0, state.demand * (1 + demandShock));
    const supply = Math.max(0, state.supply * (1 + supplyShock + productivity));
    const scarcity = supply > 0 ? (demand - supply) / Math.max(supply, 1) : demand > 0 ? 1 : 0;
    const inflation = Math.max(-0.25, Math.min(0.25, scarcity * 0.02));
    const priceIndex = Math.max(0.01, state.priceIndex * (1 + inflation));
    const revenue = state.startingCash * taxRate;
    const treasury = state.treasury + revenue + fiscalSpending * -1;
    const debt = Math.max(0, state.debt + fiscalSpending - revenue);
    const unemployment = Math.min(1, Math.max(0, state.unemployment - productivity * 0.1 + (demand < production ? 0.02 : -0.01)));
    const interestCost = debt * Math.max(0, state.interestRate);
    const gdpProxy = production * priceIndex / 100;
    const next = { ...state, production, demand, supply, priceIndex, taxRate, treasury, debt, unemployment, interestCost, inflationRate: inflation, gdpProxy, tick: tick + 1 };
    for (const [key, value] of Object.entries(next)) if (typeof value === "number" && !Number.isFinite(value)) throw new Error(`Non-finite economic state: ${key}`);
    Object.assign(state, next);
    tick += 1;
    return snapshot();
  }

  function applyPolicy(policy = {}) {
    const changes = {};
    if (policy.interestRate !== undefined) changes.interestRate = finiteRange(policy.interestRate, "interestRate", -0.5, 1);
    if (policy.taxRate !== undefined) changes.taxRate = finiteRange(policy.taxRate, "taxRate", 0, 1);
    if (policy.reserveRatio !== undefined) changes.reserveRatio = finiteRange(policy.reserveRatio, "reserveRatio", 0, 1);
    if (policy.production !== undefined) changes.production = finiteRange(policy.production, "production", 0, 1e9);
    if (policy.demand !== undefined) changes.demand = finiteRange(policy.demand, "demand", 0, 1e9);
    Object.assign(state, changes);
    return snapshot();
  }

  return Object.freeze({ snapshot, simulateTick, applyPolicy });
}

function calculateCompoundInterest({ principal, annualRate, periods, compoundingPerYear = 1 }) {
  principal = finiteRange(principal, "principal", 0, 1e12);
  annualRate = finiteRange(annualRate, "annualRate", -0.99, 10);
  periods = finiteRange(periods, "periods", 0, 1e6);
  compoundingPerYear = finiteRange(compoundingPerYear, "compoundingPerYear", 1, 365);
  const amount = principal * Math.pow(1 + annualRate / compoundingPerYear, periods * compoundingPerYear);
  if (!Number.isFinite(amount)) throw new RangeError("Interest calculation overflow");
  return Object.freeze({ principal, amount, interest: amount - principal });
}

function createPersonalFinanceLedger(initialBalance = 0) {
  initialBalance = finiteRange(initialBalance, "initialBalance", -1e12, 1e12);
  let balance = initialBalance;
  const entries = [];
  function record({ type, amount, description = "" }) {
    if (!["income", "expense", "transfer"].includes(type)) throw new TypeError("Invalid transaction type");
    amount = finiteRange(amount, "amount", 0, 1e12);
    if (typeof description !== "string" || description.length > 300) throw new TypeError("Invalid description");
    const delta = type === "expense" ? -amount : amount;
    balance += delta;
    if (!Number.isFinite(balance)) throw new RangeError("Balance overflow");
    const entry = Object.freeze({ id: entries.length + 1, type, amount, description, balance, timestamp: new Date().toISOString() });
    entries.push(entry);
    return entry;
  }
  function summary() {
    return Object.freeze({ balance, count: entries.length, income: entries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0), expenses: entries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0), entries: entries.slice() });
  }
  return Object.freeze({ record, summary });
}

module.exports = { createEconomy, calculateCompoundInterest, createPersonalFinanceLedger, DEFAULT_CONFIG };
