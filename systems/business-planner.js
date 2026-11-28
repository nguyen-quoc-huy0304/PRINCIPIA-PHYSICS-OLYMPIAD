"use strict";

const MAX_TEXT = 120;
const number = (value, name, min = 0, max = 1e15) => {
  const result = Number(value);
  if (!Number.isFinite(result) || result < min || result > max) throw new RangeError(name + " không hợp lệ.");
  return result;
};
const text = (value, name) => {
  if (typeof value !== "string" || !value.trim() || value.trim().length > MAX_TEXT) throw new TypeError(name + " không hợp lệ.");
  return value.trim();
};

function buildPlan(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Kế hoạch phải là object.");
  const name = text(input.name, "Tên dự án");
  const currency = input.currency === "USD" ? "USD" : "VND";
  const startupCost = number(input.startupCost, "Vốn ban đầu");
  const monthlyRevenue = number(input.monthlyRevenue, "Doanh thu tháng");
  const variableCostRate = number(input.variableCostRate, "Tỷ lệ chi phí biến đổi", 0, 1);
  const fixedCosts = number(input.fixedCosts, "Chi phí cố định tháng");
  const monthlyGrowth = number(input.monthlyGrowth ?? 0, "Tăng trưởng tháng", -0.99, 5);
  const cashReserve = number(input.cashReserve ?? startupCost, "Tiền dự phòng");
  const taxRate = number(input.taxRate ?? 0, "Thuế suất", 0, 1);
  const months = number(input.months ?? 12, "Thời gian dự phóng", 1, 60);
  if (!Number.isInteger(months)) throw new TypeError("Thời gian dự phóng phải là số nguyên.");
  const projection = [];
  let cash = cashReserve - startupCost;
  let revenue = monthlyRevenue;
  for (let month = 1; month <= months; month += 1) {
    const variableCosts = revenue * variableCostRate;
    const operatingProfit = revenue - variableCosts - fixedCosts;
    const tax = Math.max(0, operatingProfit) * taxRate;
    const netCashFlow = operatingProfit - tax;
    cash += netCashFlow;
    projection.push(Object.freeze({
      month, revenue: round(revenue), variableCosts: round(variableCosts),
      fixedCosts: round(fixedCosts), tax: round(tax),
      operatingProfit: round(operatingProfit), netCashFlow: round(netCashFlow),
      endingCash: round(cash)
    }));
    revenue *= 1 + monthlyGrowth;
  }
  const monthlyContribution = monthlyRevenue * (1 - variableCostRate);
  const breakEvenRevenue = monthlyContribution > 0
    ? round(fixedCosts / (1 - variableCostRate))
    : null;
  const cumulativeCashFlow = projection.reduce((total, item) => total + item.netCashFlow, 0);
  return Object.freeze({
    name, currency, startupCost: round(startupCost),
    breakEvenRevenue,
    firstMonthProfit: projection[0].operatingProfit,
    finalCash: round(cash),
    cumulativeCashFlow: round(cumulativeCashFlow),
    paybackMonth: projection.find(item => item.endingCash >= 0)?.month ?? null,
    projection: Object.freeze(projection)
  });
}

function validateBusinessModel(model) {
  if (!model || typeof model !== "object") throw new TypeError("Mô hình kinh doanh không hợp lệ.");
  return Object.freeze({
    customer: text(model.customer, "Khách hàng mục tiêu"),
    problem: text(model.problem, "Vấn đề cần giải quyết"),
    valueProposition: text(model.valueProposition, "Giá trị cung cấp"),
    channel: text(model.channel, "Kênh tiếp cận"),
    revenueStream: text(model.revenueStream, "Nguồn doanh thu"),
    keyCosts: text(model.keyCosts, "Chi phí chính"),
    keyRisks: text(model.keyRisks, "Rủi ro chính")
  });
}

function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }

module.exports = Object.freeze({ buildPlan, validateBusinessModel });
