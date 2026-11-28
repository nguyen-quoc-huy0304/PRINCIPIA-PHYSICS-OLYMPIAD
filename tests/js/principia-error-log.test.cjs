'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-error-log.js'), 'utf8');

function harness(seed = [], coreAvailable = true) {
  const values = new Map([['principia_error_log_v1', JSON.stringify(seed)]]), listeners = new Map();
  let coreListener = null;
  const window = {
    addEventListener(type, handler) { listeners.set(type, handler); },
    confirm: () => true,
  };
  if (coreAvailable) window.PrincipiaCore = { on(type, handler) { if (type === 'core:error') coreListener = handler; } };
  const document = {
    addEventListener() {}, head: { appendChild() {} }, body: { appendChild() {} },
    createElement() { return { setAttribute() {}, addEventListener() {}, append() {}, appendChild() {}, remove() {}, click() {}, focus() {}, setAttribute() {}, classList: { add() {}, remove() {} }, style: {}, hidden: true }; }
  };
  const localStorage = { getItem(key) { return values.get(key) || null; }, setItem(key, value) { values.set(key, String(value)); } };
  vm.runInNewContext(source, { window, document, localStorage, Date, JSON, Math, Object, String, Array, Set, Map, Number, RegExp, Error, console }, { filename: 'principia-error-log.js' });
  return { api: window.PrincipiaErrorLog, listeners, values, window, core: () => coreListener };
}

test('error log captures window errors with sanitized message and location', () => {
  const h = harness();
  h.listeners.get('error')({ error: new Error('request failed?api_key=SECRET123 Bearer abcdef'), filename: '/assets/app.js', lineno: 12, colno: 5 });
  const entries = h.api.list();
  assert.equal(entries.length, 1);
  assert.equal(entries[0].source, 'window:error');
  assert.equal(entries[0].filename, '/assets/app.js');
  assert.equal(entries[0].line, 12);
  assert.match(entries[0].message, /\[REDACTED\]/);
  assert.doesNotMatch(entries[0].message, /SECRET123|abcdef/);
});

test('error log captures unhandled rejections and core errors', () => {
  const h = harness();
  h.listeners.get('unhandledrejection')({ reason: 'Network unavailable' });
  h.core()({ error: new Error('module failed'), source: 'module:learning-lab', time: 50 });
  const entries = h.api.list();
  assert.equal(entries.length, 2);
  assert.equal(entries[0].kind, 'core:error');
  assert.equal(entries[0].source, 'module:learning-lab');
  assert.equal(entries[0].time, 50);
  assert.equal(entries[1].kind, 'unhandledrejection');
});

test('core error listener binds after the core-ready event', () => {
  const h = harness([], false);
  h.window.PrincipiaCore = { on(type, handler) { if (type === 'core:error') h._core = handler; } };
  h.listeners.get('principia:core-ready')();
  h._core({ error: 'late core failure', source: 'core:late', time: 7 });
  assert.equal(h.api.list()[0].message, 'late core failure');
});

test('error log deduplicates repeated events within the configured interval', () => {
  const h = harness();
  h.api.report('same error', 'test', { time: 1000 });
  h.api.report('same error', 'test', { time: 4000 });
  assert.equal(h.api.list().length, 1);
  assert.equal(h.api.list()[0].count, 2);
  assert.equal(h.api.list()[0].lastSeen, 4000);
});

test('error log persists entries and clear resets storage', () => {
  const h = harness();
  h.api.report('persisted', 'test', { time: 123 });
  const restored = harness(JSON.parse(h.values.get('principia_error_log_v1')));
  assert.equal(restored.api.list()[0].message, 'persisted');
  restored.api.clear();
  assert.equal(JSON.stringify(restored.api.list()), '[]');
  assert.equal(restored.values.get('principia_error_log_v1'), '[]');
});

test('error log is wired before the app and exposed from command center', () => {
  const html = fs.readFileSync(path.resolve(__dirname, '../../index.html'), 'utf8');
  const logger = html.indexOf('principia-error-log.js');
  const app = html.indexOf('app-part-01.js');
  const runtime = html.indexOf('core/runtime.js');
  assert.ok(logger >= 0 && logger < app && app < runtime);
  const command = fs.readFileSync(path.resolve(__dirname, '../../assets/js/principia-command-center.js'), 'utf8');
  assert.match(command, /id:'error-log'/);
  assert.match(command, /PrincipiaErrorLog\?\.open/);
  assert.match(command, /errorLog\.addEventListener/);
});
test('stored error entries are sanitized before rendering or re-export', () => {
  const h = harness([{ message: 'leaked?password=hunter2', fingerprint: 'fingerprint', stack: 'Bearer token123', count: 0, time: 10 }]);
  const entry = h.api.list()[0];
  assert.equal(entry.message, 'leaked?password=[REDACTED]');
  assert.equal(entry.stack, 'Bearer [REDACTED]');
  assert.equal(entry.count, 1);
});

test('error log redacts quoted JSON credentials including values with spaces and escapes', () => {
  const h = harness();
  const raw = JSON.stringify({ api_key: 'secret-key-value', password: 'pass with spaces', authorization: 'Bearer abc.123', nested: { access_token: 'token-value', client_secret: 'client-secret-value' }, private_key: 12345, secret: 'pass "quoted" value' });
  const safe = h.api.redact(raw);
  assert.doesNotMatch(safe, /secret-key-value|pass with spaces|abc\.123|token-value|client-secret-value|12345|pass "quoted" value/);
  assert.match(safe, /"api_key":"\[REDACTED\]"/);
  assert.match(safe, /"password":"\[REDACTED\]"/);
  assert.match(safe, /"authorization":"\[REDACTED\]"/);
  assert.match(safe, /"access_token":"\[REDACTED\]"/);
  assert.match(safe, /"client_secret":"\[REDACTED\]"/);
  assert.match(safe, /"private_key":\[REDACTED\]/);
  assert.match(safe, /"secret":"\[REDACTED\]"/);
});
