"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const { createModelRouter } = require("../../systems/model-system");

test("router selects role-based model and falls back after errors", async () => {
  const router = createModelRouter([
    { id: "reasoning", role: "reasoning", provider: "test", execute: async () => { throw new Error("offline"); } },
    { id: "fast", role: "fast", provider: "test", execute: async () => "ok" }
  ]);
  const result = await router.run({ task: "physics", input: "solve" });
  assert.equal(result.modelId, "fast");
  assert.equal(result.output, "ok");
  assert.equal(result.attempts.length, 1);
});
test("router rejects empty inputs and disabled models", async () => {
  const router = createModelRouter([{ id: "fast", role: "fast", provider: "mock", execute: async () => "x" }]);
  router.setEnabled("fast", false);
  await assert.rejects(router.run({ input: " " }), /input/);
  await assert.rejects(router.run({ input: "hello" }), /no model is configured/);
});
