"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const registry = require("../../systems/economic-forms.js");

test("registry contains at least 70 unique economic forms", () => {
  assert.ok(registry.FORM_COUNT > 70);
  assert.equal(new Set(registry.FORMS.map(form => form.id)).size, registry.FORM_COUNT);
});

test("each form has category, name and a meaningful description", () => {
  for (const form of registry.FORMS) {
    assert.ok(form.id.startsWith(form.category + "."));
    assert.ok(form.name.length > 2);
    assert.ok(form.description.length > 30);
    assert.equal(registry.getForm(form.id), form);
  }
});

test("category filtering and text search work", () => {
  assert.equal(registry.listForms("digital").length, 10);
  assert.ok(registry.searchForms("cooperative").length >= 3);
  assert.deepEqual(registry.searchForms("   "), []);
});

test("invalid inputs fail explicitly", () => {
  assert.throws(() => registry.listForms(42), TypeError);
  assert.throws(() => registry.getForm(null), TypeError);
  assert.throws(() => registry.searchForms({}), TypeError);
});
