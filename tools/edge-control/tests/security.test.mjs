import test from "node:test";
import assert from "node:assert/strict";
import { isLocalHostHeader, isSameOriginRequest, isValidHttpUrl } from "../security.mjs";

test("accepts only valid HTTP and HTTPS URLs", () => {
  assert.equal(isValidHttpUrl("https://example.com"), true);
  assert.equal(isValidHttpUrl("http://localhost:3000"), true);
  assert.equal(isValidHttpUrl("javascript:alert(1)"), false);
  assert.equal(isValidHttpUrl("file:///C:/secret.txt"), false);
  assert.equal(isValidHttpUrl("https://user:pass@example.com"), false);
  assert.equal(isValidHttpUrl("not a URL"), false);
  assert.equal(isValidHttpUrl("x".repeat(2049)), false);
});

test("restricts host header to loopback dashboard hosts", () => {
  assert.equal(isLocalHostHeader("127.0.0.1:4317"), true);
  assert.equal(isLocalHostHeader("localhost:4317"), true);
  assert.equal(isLocalHostHeader("example.com"), false);
});

test("allows same-origin requests only", () => {
  assert.equal(isSameOriginRequest("http://127.0.0.1:4317", "127.0.0.1:4317"), true);
  assert.equal(isSameOriginRequest("https://evil.example", "127.0.0.1:4317"), false);
  assert.equal(isSameOriginRequest(undefined, "127.0.0.1:4317"), true);
});
