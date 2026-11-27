const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('assets/js/principia-investment-universe.js', 'utf8');
const sandbox = { window: {}, Object, Set, String };
vm.runInNewContext(source, sandbox, { filename: 'principia-investment-universe.js' });

test('investment universe covers major asset classes', () => {
  const items = sandbox.window.PrincipiaInvestmentUniverse.items;
  assert.ok(items.length >= 20);
  for (const group of [
    'Thị trường vốn',
    'Trái phiếu & thu nhập cố định',
    'Kim loại quý & hàng hóa',
    'Tài sản số',
    'Bất động sản & tài sản thực',
    'Kinh doanh & vốn tư nhân',
    'Tài chính cá nhân'
  ]) assert.ok(items.some(item => item.group === group), 'missing group: ' + group);
});

test('each investment has risk, liquidity, detail and a data-source status', () => {
  const items = sandbox.window.PrincipiaInvestmentUniverse.items;
  for (const item of items) {
    assert.ok(item.id && item.name && item.group && item.detail && item.risk && item.liquidity && item.source);
    assert.equal(typeof item.live, 'boolean');
  }
});

test('investment identifiers are unique', () => {
  const ids = sandbox.window.PrincipiaInvestmentUniverse.items.map(item => item.id);
  assert.equal(new Set(ids).size, ids.length);
});
