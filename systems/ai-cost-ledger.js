"use strict";

/**
 * PRINCIPIA AI Unit Economics — cost accounting, budgets, and usage metrics.
 * Costs are caller-supplied rates; no vendor pricing is assumed.
 */

function nonNegative(value, field) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) throw new RangeError(`${field} must be a finite non-negative number`);
  return value;
}

function createAiCostLedger({ budget = Infinity, warnAt = 0.8 } = {}) {
  if (!(budget === Infinity || (typeof budget === "number" && Number.isFinite(budget) && budget >= 0))) throw new RangeError("budget must be non-negative or Infinity");
  if (typeof warnAt !== "number" || !Number.isFinite(warnAt) || warnAt < 0 || warnAt > 1) throw new RangeError("warnAt must be 0..1");
  const records = [];
  let totalCost = 0;

  function record({ modelId, task = "unknown", inputTokens = 0, outputTokens = 0, inputCostPerMillion = 0, outputCostPerMillion = 0, fixedCost = 0 } = {}) {
    if (typeof modelId !== "string" || !modelId.trim() || modelId.length > 120) throw new TypeError("modelId required");
    if (typeof task !== "string" || task.length > 80) throw new TypeError("task must be a string up to 80 chars");
    inputTokens = nonNegative(inputTokens, "inputTokens");
    outputTokens = nonNegative(outputTokens, "outputTokens");
    inputCostPerMillion = nonNegative(inputCostPerMillion, "inputCostPerMillion");
    outputCostPerMillion = nonNegative(outputCostPerMillion, "outputCostPerMillion");
    fixedCost = nonNegative(fixedCost, "fixedCost");
    const cost = inputTokens * inputCostPerMillion / 1e6 + outputTokens * outputCostPerMillion / 1e6 + fixedCost;
    if (!Number.isFinite(cost) || !Number.isFinite(totalCost + cost)) throw new RangeError("Cost overflow");
    totalCost += cost;
    const entry = Object.freeze({ id: records.length + 1, modelId: modelId.trim(), task, inputTokens, outputTokens, cost, timestamp: new Date().toISOString() });
    records.push(entry);
    return Object.freeze({ entry, totalCost, remainingBudget: budget === Infinity ? Infinity : Math.max(0, budget - totalCost), overBudget: totalCost > budget, warning: budget !== Infinity && totalCost >= budget * warnAt });
  }

  function report() {
    const byModel = {};
    const byTask = {};
    for (const item of records) {
      byModel[item.modelId] = (byModel[item.modelId] || 0) + item.cost;
      byTask[item.task] = (byTask[item.task] || 0) + item.cost;
    }
    return Object.freeze({ budget, totalCost, remainingBudget: budget === Infinity ? Infinity : Math.max(0, budget - totalCost), utilization: budget === Infinity || budget === 0 ? null : totalCost / budget, overBudget: totalCost > budget, records: records.slice(), byModel: Object.freeze(byModel), byTask: Object.freeze(byTask) });
  }

  function reset() {
    records.length = 0;
    totalCost = 0;
    return report();
  }
  return Object.freeze({ record, report, reset });
}

module.exports = { createAiCostLedger };
