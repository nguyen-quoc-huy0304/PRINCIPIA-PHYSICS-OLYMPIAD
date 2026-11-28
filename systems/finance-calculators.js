"use strict";

const LIMIT = 1e15;
const finite = (value, name, min = -LIMIT, max = LIMIT) => {
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    throw new RangeError(name + " không hợp lệ.");
  }
  return number;
};
const positive = (value, name) => finite(value, name, 0, LIMIT);
const ratio = (a, b, name) => {
  if (b === 0) throw new RangeError(name + ": mẫu số bằng 0.");
  return a / b;
};
const round = value => Math.round((value + Number.EPSILON) * 1e8) / 1e8;
const sum = values => values.reduce((total, value) => total + value, 0);

function parseSeries(values, name = "Chuỗi dữ liệu", minLength = 2) {
  if (!Array.isArray(values) || values.length < minLength || values.length > 10000) {
    throw new TypeError(name + " phải có từ " + minLength + " đến 10.000 phần tử.");
  }
  return values.map((value, index) => finite(value, name + "[" + index + "]"));
}

function npv(rate, cashFlows) {
  const r = finite(rate, "Lãi suất chiết khấu", -0.999999, 100);
  const flows = parseSeries(cashFlows, "Dòng tiền", 1);
  return round(flows.reduce((total, flow, index) => total + flow / ((1 + r) ** (index + 1)), 0));
}

function irr(cashFlows, { tolerance = 1e-9, maxIterations = 500 } = {}) {
  const flows = parseSeries(cashFlows, "Dòng tiền", 2);
  if (!flows.some(value => value > 0) || !flows.some(value => value < 0)) {
    throw new RangeError("IRR cần ít nhất một dòng tiền âm và một dòng tiền dương.");
  }
  const valueAt = rate => flows.reduce((total, flow, index) => total + flow / ((1 + rate) ** index), 0);
  let low = -0.9999;
  let high = 1;
  let lowValue = valueAt(low);
  let highValue = valueAt(high);
  while (lowValue * highValue > 0 && high < 1e6) {
    high = high * 2 + 1;
    highValue = valueAt(high);
  }
  if (lowValue * highValue > 0) throw new RangeError("Không tìm thấy nghiệm IRR duy nhất trong miền tìm kiếm.");
  for (let index = 0; index < maxIterations; index += 1) {
    const middle = (low + high) / 2;
    const middleValue = valueAt(middle);
    if (Math.abs(middleValue) < tolerance) return round(middle);
    if (lowValue * middleValue <= 0) high = middle;
    else { low = middle; lowValue = middleValue; }
  }
  return round((low + high) / 2);
}

function dcf({ cashFlows, discountRate, terminalGrowth = 0 }) {
  const flows = parseSeries(cashFlows, "FCF", 1);
  const rate = finite(discountRate, "WACC", 0.000001, 10);
  const growth = finite(terminalGrowth, "Tăng trưởng dài hạn", -0.99, 0.99);
  if (growth >= rate) throw new RangeError("Tăng trưởng dài hạn phải thấp hơn WACC.");
  const presentValue = flows.reduce((total, flow, index) => total + flow / ((1 + rate) ** (index + 1)), 0);
  const terminalValue = flows[flows.length - 1] * (1 + growth) / (rate - growth);
  return Object.freeze({
    presentValue: round(presentValue),
    terminalValue: round(terminalValue),
    terminalPresentValue: round(terminalValue / ((1 + rate) ** flows.length)),
    enterpriseValue: round(presentValue + terminalValue / ((1 + rate) ** flows.length))
  });
}

function capm({ riskFreeRate, beta, marketReturn }) {
  const rf = finite(riskFreeRate, "Lãi suất phi rủi ro", -1, 10);
  const b = finite(beta, "Beta", -100, 100);
  const market = finite(marketReturn, "Lợi suất thị trường", -1, 10);
  return round(rf + b * (market - rf));
}

function wacc({ equity, debt, costOfEquity, costOfDebt, taxRate }) {
  const e = positive(equity, "Giá trị vốn chủ");
  const d = finite(debt, "Nợ vay", 0, LIMIT);
  const ke = finite(costOfEquity, "Chi phí vốn chủ", -1, 10);
  const kd = finite(costOfDebt, "Chi phí nợ", -1, 10);
  const tax = finite(taxRate, "Thuế suất", 0, 1);
  if (e + d === 0) throw new RangeError("Tổng nguồn vốn phải lớn hơn 0.");
  return round((e / (e + d)) * ke + (d / (e + d)) * kd * (1 - tax));
}

function bondPrice({ faceValue, couponRate, yieldRate, periods, paymentsPerYear = 1 }) {
  const face = positive(faceValue, "Mệnh giá");
  const coupon = finite(couponRate, "Coupon", 0, 10);
  const yieldValue = finite(yieldRate, "Lợi suất", -0.99, 10);
  const count = finite(periods, "Số kỳ", 1, 1000);
  const frequency = finite(paymentsPerYear, "Số lần trả lãi/năm", 1, 12);
  if (!Number.isInteger(count) || !Number.isInteger(frequency)) throw new TypeError("Số kỳ phải là số nguyên.");
  const periodicYield = yieldValue / frequency;
  if (periodicYield <= -1) throw new RangeError("Lợi suất mỗi kỳ phải lớn hơn -100%.");
  const payment = face * coupon / frequency;
  let price = 0;
  for (let period = 1; period <= count; period += 1) price += payment / ((1 + periodicYield) ** period);
  price += face / ((1 + periodicYield) ** count);
  return round(price);
}

function portfolioStats(returns, weights) {
  const series = parseSeries(returns, "Lợi suất", 2);
  const allocation = parseSeries(weights, "Tỷ trọng", 1);
  if (allocation.some(value => value < 0) || Math.abs(sum(allocation) - 1) > 1e-6) {
    throw new RangeError("Tỷ trọng phải không âm và tổng bằng 1.");
  }
  const mean = sum(series) / series.length;
  const variance = sum(series.map(value => (value - mean) ** 2)) / (series.length - 1);
  const stdDev = Math.sqrt(variance);
  return Object.freeze({
    meanReturn: round(mean),
    volatility: round(stdDev),
    sharpe: stdDev === 0 ? null : round(mean / stdDev),
    observations: series.length,
    allocationCount: allocation.length
  });
}

function historicalVaR(returns, confidence = 0.95, portfolioValue = 1) {
  const series = parseSeries(returns, "Lợi suất", 2);
  const level = finite(confidence, "Mức tin cậy", 0.5, 0.999);
  const value = positive(portfolioValue, "Giá trị danh mục");
  const sorted = series.slice().sort((a, b) => a - b);
  const index = Math.max(0, Math.floor((1 - level) * sorted.length));
  return round(Math.max(0, -sorted[index] * value));
}

function breakEven({ fixedCosts, price, variableCost }) {
  const fixed = positive(fixedCosts, "Chi phí cố định");
  const sellingPrice = positive(price, "Giá bán");
  const variable = finite(variableCost, "Chi phí biến đổi", 0, LIMIT);
  if (sellingPrice <= variable) throw new RangeError("Giá bán phải lớn hơn chi phí biến đổi.");
  const units = fixed / (sellingPrice - variable);
  return Object.freeze({ units: round(units), sales: round(units * sellingPrice), contribution: round(sellingPrice - variable) });
}

function unitEconomics({ price, variableCost, cac, monthlyFixedCosts, monthlyCustomers }) {
  const sellingPrice = positive(price, "Giá bán");
  const variable = finite(variableCost, "Chi phí biến đổi", 0, LIMIT);
  const acquisition = finite(cac, "CAC", 0, LIMIT);
  const fixed = finite(monthlyFixedCosts, "Chi phí cố định", 0, LIMIT);
  const customers = positive(monthlyCustomers, "Số khách hàng");
  const contribution = sellingPrice - variable;
  return Object.freeze({
    contributionPerUnit: round(contribution),
    contributionMargin: round(ratio(contribution, sellingPrice, "Biên đóng góp")),
    monthlyOperatingProfit: round(contribution * customers - fixed),
    cacPaybackUnits: contribution > 0 ? round(acquisition / contribution) : null
  });
}

function runway({ cash, monthlyBurn }) {
  const balance = positive(cash, "Tiền mặt");
  const burn = finite(monthlyBurn, "Burn rate", 0, LIMIT);
  return burn === 0 ? Infinity : round(balance / burn);
}

function dilution({ preMoney, investment }) {
  const pre = positive(preMoney, "Định giá trước đầu tư");
  const amount = positive(investment, "Vốn đầu tư");
  return Object.freeze({ postMoney: round(pre + amount), investorOwnership: round(amount / (pre + amount)), existingOwnership: round(pre / (pre + amount)) });
}

function scenarioAnalysis({ revenue, variableCostRate, fixedCosts, taxRate = 0, scenarios }) {
  const baseRevenue = positive(revenue, "Doanh thu");
  const variableRate = finite(variableCostRate, "Tỷ lệ chi phí biến đổi", 0, 1);
  const fixed = finite(fixedCosts, "Chi phí cố định", 0, LIMIT);
  const tax = finite(taxRate, "Thuế suất", 0, 1);
  if (!Array.isArray(scenarios) || scenarios.length < 1 || scenarios.length > 20) {
    throw new TypeError("Cần từ 1 đến 20 kịch bản.");
  }
  return Object.freeze(scenarios.map(item => {
    if (!item || typeof item.name !== "string" || !item.name.trim() || item.name.length > 60) {
      throw new TypeError("Tên kịch bản không hợp lệ.");
    }
    const multiplier = finite(item.revenueMultiplier, "Hệ số doanh thu", 0, 100);
    const costs = fixed * finite(item.fixedCostMultiplier ?? 1, "Hệ số chi phí", 0, 100);
    const adjustedRevenue = baseRevenue * multiplier;
    const variableCosts = adjustedRevenue * variableRate;
    const pretax = adjustedRevenue - variableCosts - costs;
    const taxPaid = Math.max(0, pretax) * tax;
    return Object.freeze({
      name: item.name.trim(),
      revenue: round(adjustedRevenue),
      totalCosts: round(variableCosts + costs),
      profitBeforeTax: round(pretax),
      estimatedTax: round(taxPaid),
      netProfit: round(pretax - taxPaid)
    });
  }));
}

const METHODS = Object.freeze({
  npv, irr, dcf, capm, wacc, bondPrice, portfolioStats, historicalVaR,
  breakEven, unitEconomics, runway, dilution, scenarioAnalysis
});

function calculate(method, inputs) {
  if (typeof method !== "string" || !Object.hasOwn(METHODS, method)) throw new TypeError("Mô hình tính toán không được hỗ trợ.");
  if (!inputs || typeof inputs !== "object" || Array.isArray(inputs)) throw new TypeError("Dữ liệu đầu vào phải là object.");
  return METHODS[method](inputs);
}

module.exports = Object.freeze({ calculate, METHODS, npv, irr, dcf, capm, wacc, bondPrice, portfolioStats, historicalVaR, breakEven, unitEconomics, runway, dilution, scenarioAnalysis });
