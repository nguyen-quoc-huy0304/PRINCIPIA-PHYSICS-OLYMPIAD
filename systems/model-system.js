"use strict";

/**
 * PRINCIPIA Model System — provider-agnostic registry and task router.
 * No credentials are stored here. Providers are injected by the host application.
 */

const TASKS = Object.freeze({
  chat: Object.freeze({ preferred: ["fast", "general"], budget: "standard" }),
  tutoring: Object.freeze({ preferred: ["reasoning", "general"], budget: "standard" }),
  physics: Object.freeze({ preferred: ["reasoning", "physics"], budget: "high" }),
  research: Object.freeze({ preferred: ["research", "reasoning"], budget: "high" }),
  coding: Object.freeze({ preferred: ["coding", "reasoning"], budget: "high" }),
  economy: Object.freeze({ preferred: ["reasoning", "general"], budget: "standard" }),
  summarize: Object.freeze({ preferred: ["fast", "general"], budget: "low" })
});

function safeString(value, field, max = 120) {
  if (typeof value !== "string" || !value.trim() || value.length > max) {
    throw new TypeError(`${field} must be a non-empty string (max ${max} chars)`);
  }
  return value.trim();
}

function normalizeModel(input) {
  if (!input || typeof input !== "object") throw new TypeError("Model descriptor must be an object");
  const id = safeString(input.id, "model.id");
  const role = safeString(input.role, "model.role");
  const provider = safeString(input.provider, "model.provider");
  const execute = input.execute;
  if (typeof execute !== "function") throw new TypeError("model.execute must be a function");
  return Object.freeze({ id, role, provider, enabled: input.enabled !== false, execute, maxTokens: Number.isInteger(input.maxTokens) && input.maxTokens > 0 ? input.maxTokens : 4096 });
}

function createModelRouter(models = []) {
  const registry = new Map();
  for (const descriptor of models) register(descriptor);

  function register(descriptor) {
    const model = normalizeModel(descriptor);
    if (registry.has(model.id)) throw new Error(`Duplicate model id: ${model.id}`);
    registry.set(model.id, model);
    return model.id;
  }

  function setEnabled(id, enabled) {
    if (typeof enabled !== "boolean") throw new TypeError("enabled must be boolean");
    const model = registry.get(safeString(id, "model id"));
    if (!model) throw new Error("Model not found");
    registry.set(model.id, Object.freeze({ ...model, enabled }));
  }

  function list() {
    return Array.from(registry.values(), ({ execute, ...publicModel }) => publicModel);
  }

  function candidates(task, preferredIds = []) {
    const taskConfig = TASKS[task] || TASKS.chat;
    const ids = [...preferredIds, ...taskConfig.preferred];
    const uniqueIds = [...new Set(ids)];
    const selected = uniqueIds.map(id => registry.get(id)).filter(model => model?.enabled);
    const fallback = Array.from(registry.values()).filter(model => model.enabled && !selected.includes(model));
    return [...selected, ...fallback];
  }

  async function run({ task = "chat", input, preferredIds = [], signal, context = {} } = {}) {
    if (typeof input !== "string" || !input.trim()) throw new TypeError("input must be a non-empty string");
    const attempts = [];
    for (const model of candidates(task, preferredIds)) {
      if (signal?.aborted) throw signal.reason || new Error("Request aborted");
      try {
        const output = await model.execute({ task, input, signal, context, maxTokens: model.maxTokens });
        if (typeof output !== "string" || !output.trim()) throw new Error("Model returned empty output");
        return Object.freeze({ modelId: model.id, provider: model.provider, output, attempts: attempts.slice() });
      } catch (error) {
        attempts.push(Object.freeze({ modelId: model.id, error: String(error?.message || error).slice(0, 300) }));
      }
    }
    const error = new Error("All enabled models failed or no model is configured");
    error.attempts = attempts;
    throw error;
  }

  return Object.freeze({ register, setEnabled, list, run, tasks: TASKS });
}

module.exports = { createModelRouter, TASKS };
