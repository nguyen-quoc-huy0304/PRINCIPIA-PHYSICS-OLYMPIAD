(function (root) {
  'use strict';

  const STORAGE_KEY = 'principia:economy:v1';
  const MAX_LEDGER = 500;
  const CURRENCIES = Object.freeze({ USD: 25400, EUR: 27600, JPY: 170, CNY: 3500 });
  const STOCKS = Object.freeze({
    VNF: { name: 'VietNova Foods', price: 28500, volatility: 0.045, dividend: 0.012 },
    TCH: { name: 'Tech Horizon', price: 64200, volatility: 0.075, dividend: 0.004 },
    GBE: { name: 'Green Build Energy', price: 41800, volatility: 0.06, dividend: 0.008 },
    BKB: { name: 'Bac Kim Bank', price: 19200, volatility: 0.035, dividend: 0.018 }
  });
  const PROPERTIES = Object.freeze([
    { id: 'room', name: 'Phòng trọ mini', price: 420000000, rent: 4200000, maintenance: 350000 },
    { id: 'apartment', name: 'Căn hộ nhỏ', price: 1250000000, rent: 9500000, maintenance: 900000 },
    { id: 'shop-house', name: 'Nhà phố thương mại', price: 2850000000, rent: 21000000, maintenance: 2200000 }
  ]);
  const GOODS = Object.freeze([
    { id: 'rice', name: 'Gạo 5 kg', cost: 78000, price: 95000 },
    { id: 'milk', name: 'Sữa hộp', cost: 265000, price: 315000 },
    { id: 'noodles', name: 'Mì gói (thùng)', cost: 92000, price: 118000 },
    { id: 'water', name: 'Nước suối (thùng)', cost: 58000, price: 78000 },
    { id: 'eggs', name: 'Trứng (vỉ)', cost: 28000, price: 36000 }
  ]);

  function number(value, label) {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < 0) throw new TypeError(label + ' phải là số nguyên không âm.');
    return parsed;
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function createInitialState() {
    return {
      version: 1, month: 1, year: 2026,
      cash: 20000000, bank: 0, foreign: {}, loans: [],
      stocks: {}, properties: [], shop: null,
      income: 12000000, livingCost: 8000000,
      taxPaid: 0, ledger: []
    };
  }
  function sanitizeState(raw) {
    const base = createInitialState();
    if (!raw || raw.version !== 1) return base;
    const safe = { ...base, ...raw };
    for (const key of ['cash', 'bank', 'income', 'livingCost', 'taxPaid', 'month', 'year']) {
      if (!Number.isSafeInteger(safe[key]) || safe[key] < 0) safe[key] = base[key];
    }
    safe.foreign = safe.foreign && typeof safe.foreign === 'object' ? safe.foreign : {};
    safe.stocks = safe.stocks && typeof safe.stocks === 'object' ? safe.stocks : {};
    safe.loans = Array.isArray(safe.loans) ? safe.loans : [];
    safe.properties = Array.isArray(safe.properties) ? safe.properties : [];
    safe.ledger = Array.isArray(safe.ledger) ? safe.ledger.slice(-MAX_LEDGER) : [];
    safe.shop = safe.shop && typeof safe.shop === 'object' ? safe.shop : null;
    return safe;
  }
  function progressiveIncomeTax(monthlyIncome) {
    const annual = Math.max(0, monthlyIncome * 12 - 132000000);
    const brackets = [[60000000, 0.05], [60000000, 0.1], [96000000, 0.15], [168000000, 0.2], [240000000, 0.25], [384000000, 0.3], [Infinity, 0.35]];
    let remaining = annual;
    let tax = 0;
    for (const [limit, rate] of brackets) {
      const taxable = Math.min(remaining, limit);
      tax += taxable * rate;
      remaining -= taxable;
      if (remaining <= 0) break;
    }
    return Math.round(tax / 12);
  }
  function createEngine(storage) {
    const store = storage || root.localStorage;
    let state;
    try { state = sanitizeState(JSON.parse(store && store.getItem(STORAGE_KEY) || 'null')); }
    catch (_) { state = createInitialState(); }
    function persist() {
      try { if (store) store.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch (_) { throw new Error('Không thể lưu dữ liệu kinh tế trên thiết bị.'); }
    }
    function record(type, amount, note) {
      state.ledger.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), month: state.month, year: state.year, type, amount, note: String(note).slice(0, 120) });
      if (state.ledger.length > MAX_LEDGER) state.ledger.splice(0, state.ledger.length - MAX_LEDGER);
    }
    function commit() { persist(); return getState(); }
    function requireCash(amount) {
      if (state.cash < amount) throw new RangeError('Không đủ tiền mặt trong ví mô phỏng.');
    }
    function getState() { return clone(state); }
    function deposit(amount) {
      amount = number(amount, 'Số tiền'); requireCash(amount);
      state.cash -= amount; state.bank += amount; record('deposit', amount, 'Gửi tiền vào ngân hàng'); return commit();
    }
    function withdraw(amount) {
      amount = number(amount, 'Số tiền');
      if (state.bank < amount) throw new RangeError('Số dư ngân hàng không đủ.');
      state.bank -= amount; state.cash += amount; record('withdraw', amount, 'Rút tiền ngân hàng'); return commit();
    }
    function takeLoan(amount, annualRate) {
      amount = number(amount, 'Khoản vay');
      const rate = Number(annualRate);
      if (amount < 1000000 || amount > 2000000000 || !Number.isFinite(rate) || rate < 0.01 || rate > 0.36) throw new RangeError('Khoản vay hoặc lãi suất không hợp lệ.');
      state.loans.push({ id: 'loan-' + Date.now().toString(36), principal: amount, annualRate: rate, remaining: amount });
      state.cash += amount; record('loan', amount, 'Vay ngân hàng, lãi suất ' + (rate * 100).toFixed(1) + '%/năm'); return commit();
    }
    function repayLoan(amount, loanId) {
      amount = number(amount, 'Số tiền trả nợ');
      const loan = state.loans.find(item => item.id === loanId && item.remaining > 0);
      if (!loan) throw new Error('Không tìm thấy khoản vay còn dư nợ.');
      requireCash(amount);
      if (amount > loan.remaining) throw new RangeError('Số tiền trả vượt dư nợ.');
      state.cash -= amount; loan.remaining -= amount; record('repayment', amount, 'Trả nợ ngân hàng'); return commit();
    }
    function exchange(currency, amount, direction) {
      amount = number(amount, 'Số lượng ngoại tệ');
      if (!Object.prototype.hasOwnProperty.call(CURRENCIES, currency) || amount < 1 || !['buy', 'sell'].includes(direction)) throw new TypeError('Lệnh đổi ngoại tệ không hợp lệ.');
      const rate = CURRENCIES[currency];
      if (direction === 'buy') {
        const cost = Math.round(amount * rate * 1.01);
        requireCash(cost); state.cash -= cost; state.foreign[currency] = (state.foreign[currency] || 0) + amount;
        record('fx-buy', cost, 'Mua ' + currency + ' (phí 1%)');
      } else {
        if ((state.foreign[currency] || 0) < amount) throw new RangeError('Không đủ ngoại tệ để bán.');
        const proceeds = Math.round(amount * rate * 0.99);
        state.foreign[currency] -= amount; state.cash += proceeds;
        record('fx-sell', proceeds, 'Bán ' + currency + ' (phí 1%)');
      }
      return commit();
    }
    function buyStock(symbol, quantity) {
      quantity = number(quantity, 'Số cổ phiếu');
      const stock = STOCKS[symbol];
      if (!stock || quantity < 1 || quantity > 100000) throw new TypeError('Mã hoặc số lượng cổ phiếu không hợp lệ.');
      const cost = stock.price * quantity;
      requireCash(cost); state.cash -= cost; state.stocks[symbol] = (state.stocks[symbol] || 0) + quantity;
      record('stock-buy', cost, 'Mua ' + quantity + ' cổ phiếu ' + symbol); return commit();
    }
    function sellStock(symbol, quantity) {
      quantity = number(quantity, 'Số cổ phiếu');
      if (!STOCKS[symbol] || quantity < 1 || (state.stocks[symbol] || 0) < quantity) throw new RangeError('Không đủ cổ phiếu để bán.');
      const proceeds = STOCKS[symbol].price * quantity;
      state.stocks[symbol] -= quantity; state.cash += proceeds;
      record('stock-sell', proceeds, 'Bán ' + quantity + ' cổ phiếu ' + symbol); return commit();
    }
    function buyProperty(propertyId) {
      const property = PROPERTIES.find(item => item.id === propertyId);
      if (!property) throw new Error('Bất động sản không tồn tại.');
      requireCash(property.price);
      state.cash -= property.price; state.properties.push({ id: property.id + '-' + Date.now().toString(36), type: property.id, value: property.price, rent: property.rent, maintenance: property.maintenance });
      record('property-buy', property.price, 'Mua ' + property.name); return commit();
    }
    function openShop() {
      if (state.shop) throw new Error('Bạn đã sở hữu cửa hàng.');
      const setupCost = 12000000;
      requireCash(setupCost); state.cash -= setupCost;
      state.shop = { name: 'Tạp hóa PRINCIPIA', inventory: {}, revenue: 0, costs: 0, profit: 0 };
      record('shop-open', setupCost, 'Mở cửa hàng tạp hóa'); return commit();
    }
    function restock(goodsId, quantity) {
      quantity = number(quantity, 'Số lượng nhập');
      const good = GOODS.find(item => item.id === goodsId);
      if (!state.shop || !good || quantity < 1 || quantity > 10000) throw new Error('Không thể nhập hàng.');
      const cost = good.cost * quantity; requireCash(cost); state.cash -= cost;
      state.shop.inventory[goodsId] = (state.shop.inventory[goodsId] || 0) + quantity;
      state.shop.costs += cost; record('shop-restock', cost, 'Nhập ' + quantity + ' ' + good.name); return commit();
    }
    function sellGoods(goodsId, quantity) {
      quantity = number(quantity, 'Số lượng bán');
      const good = GOODS.find(item => item.id === goodsId);
      if (!state.shop || !good || quantity < 1 || (state.shop.inventory[goodsId] || 0) < quantity) throw new RangeError('Cửa hàng không đủ hàng tồn.');
      const revenue = good.price * quantity;
      const cost = good.cost * quantity;
      const vat = Math.round(revenue * 0.08);
      state.shop.inventory[goodsId] -= quantity;
      state.shop.revenue += revenue; state.shop.profit += revenue - cost - vat;
      state.cash += revenue - vat; state.taxPaid += vat;
      record('shop-sale', revenue, 'Bán ' + quantity + ' ' + good.name + ', VAT mô phỏng 8%: ' + vat);
      return commit();
    }
    function advanceMonth() {
      state.month += 1;
      if (state.month > 12) { state.month = 1; state.year += 1; }
      const salaryTax = progressiveIncomeTax(state.income);
      const salaryNet = state.income - salaryTax;
      const depositInterest = Math.round(state.bank * 0.045 / 12);
      const loanInterest = state.loans.reduce((sum, loan) => sum + Math.round(loan.remaining * loan.annualRate / 12), 0);
      const rentIncome = state.properties.reduce((sum, property) => sum + property.rent, 0);
      const propertyCosts = state.properties.reduce((sum, property) => sum + property.maintenance, 0);
      const shopProfit = state.shop ? Math.max(0, state.shop.profit) : 0;
      const businessTax = Math.round(shopProfit * 0.2);
      const net = salaryNet + depositInterest + rentIncome + shopProfit - businessTax - loanInterest - propertyCosts - state.livingCost;
      state.cash += net;
      state.taxPaid += salaryTax + businessTax;
      state.bank += depositInterest;
      state.shop && (state.shop.profit = Math.max(0, state.shop.profit - businessTax));
      record('monthly-close', net, 'Lương sau thuế ' + salaryNet + ', lãi gửi ' + depositInterest + ', tiền thuê ' + rentIncome + ', lãi vay ' + loanInterest + ', thuế ' + (salaryTax + businessTax));
      for (const [symbol, stock] of Object.entries(STOCKS)) {
        const change = 1 + (Math.random() * 2 - 1) * stock.volatility;
        STOCKS[symbol].price = Math.max(1000, Math.round(stock.price * change));
      }
      return commit();
    }
    function getMarket() {
      return { currencies: clone(CURRENCIES), stocks: clone(STOCKS), properties: clone(PROPERTIES), goods: clone(GOODS) };
    }
    return Object.freeze({ getState, getMarket, deposit, withdraw, takeLoan, repayLoan, exchange, buyStock, sellStock, buyProperty, openShop, restock, sellGoods, advanceMonth, progressiveIncomeTax });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  }
  function formatMoney(value) {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value);
  }
  function mountUI(engine) {
    if (!root.document || root.document.getElementById('principia-economy-root')) return;
    const style = root.document.createElement('link');
    style.rel = 'stylesheet'; style.href = '/assets/css/principia-economy.css?v=20261127-economy1';
    root.document.head.appendChild(style);
    const launcher = root.document.createElement('button');
    launcher.id = 'principia-economy-launcher'; launcher.type = 'button';
    launcher.textContent = 'Kinh tế mô phỏng';
    launcher.setAttribute('aria-controls', 'principia-economy-root');
    root.document.body.appendChild(launcher);
    const panel = root.document.createElement('aside');
    panel.id = 'principia-economy-root'; panel.hidden = true;
    panel.setAttribute('aria-label', 'Xã hội kinh tế mô phỏng');
    panel.innerHTML = '<header class="pe-head"><div><strong>PRINCIPIA ECONOMY</strong><small>Xã hội mô phỏng · VND</small></div><button type="button" data-close aria-label="Đóng">×</button></header><nav class="pe-tabs"><button data-tab="overview">Tổng quan</button><button data-tab="bank">Ngân hàng</button><button data-tab="market">Thị trường</button><button data-tab="property">Bất động sản</button><button data-tab="shop">Tạp hóa</button></nav><main class="pe-content" id="pe-content"></main><footer>Tiền và giao dịch chỉ tồn tại trong mô phỏng giáo dục, không có giá trị thanh toán thật.</footer>';
    root.document.body.appendChild(panel);
    let tab = 'overview';
    function render() {
      const state = engine.getState();
      const market = engine.getMarket();
      const content = panel.querySelector('#pe-content');
      const balance = state.cash + state.bank + Object.entries(state.foreign).reduce((sum, [code, amount]) => sum + amount * market.currencies[code], 0);
      const field = (label, name, placeholder, type) => '<label>' + label + '<input name="' + name + '" type="' + (type || 'number') + '" min="1" step="1" placeholder="' + placeholder + '" required></label>';
      const action = (label, name, extra) => '<button class="pe-action" data-action="' + name + '"' + (extra || '') + '>' + label + '</button>';
      let html = '';
      if (tab === 'overview') {
        html = '<section class="pe-grid"><article><small>Tài sản thanh khoản</small><strong>' + formatMoney(balance) + '</strong></article><article><small>Tiền mặt</small><strong>' + formatMoney(state.cash) + '</strong></article><article><small>Tiền ngân hàng</small><strong>' + formatMoney(state.bank) + '</strong></article><article><small>Thuế đã nộp</small><strong>' + formatMoney(state.taxPaid) + '</strong></article></section><h3>Hộ gia đình</h3><p>Lương tháng: ' + formatMoney(state.income) + ' · Chi phí sinh hoạt: ' + formatMoney(state.livingCost) + '</p><p>Tháng ' + state.month + '/' + state.year + ' · Khoản vay: ' + state.loans.filter(x => x.remaining > 0).length + ' · Bất động sản: ' + state.properties.length + '</p>' + action('Chốt tháng & tính lương, lãi, thuế', 'month') + '<h3>Sổ giao dịch gần đây</h3>' + ledgerHTML(state.ledger);
      } else if (tab === 'bank') {
        html = '<h3>Ngân hàng mô phỏng</h3><p>Lãi tiền gửi 4,5%/năm; lãi vay theo hợp đồng. Lãi được tính khi chốt tháng.</p><div class="pe-form">' + field('Số tiền gửi (VND)', 'amount', '5000000') + action('Gửi tiền', 'deposit') + '</div><div class="pe-form">' + field('Số tiền rút (VND)', 'amount', '1000000') + action('Rút tiền', 'withdraw') + '</div><div class="pe-form">' + field('Số tiền vay (VND)', 'amount', '50000000') + field('Lãi suất năm (0.01–0.36)', 'rate', '0.12') + action('Vay ngân hàng', 'loan') + '</div><h4>Dư nợ</h4>' + state.loans.map(loan => '<p>' + formatMoney(loan.remaining) + ' · ' + (loan.annualRate * 100).toFixed(1) + '%/năm ' + (loan.remaining ? '<button data-repay="' + escapeHTML(loan.id) + '">Trả 1 triệu</button>' : '· Đã tất toán') + '</p>').join('') + '<h4>Đổi ngoại tệ</h4><p>' + Object.entries(market.currencies).map(([code, rate]) => code + ': ' + formatMoney(rate) + ' / đơn vị').join(' · ') + '</p><div class="pe-form">' + '<select name="currency">' + Object.keys(market.currencies).map(code => '<option>' + code + '</option>').join('') + '</select>' + field('Số ngoại tệ', 'amount', '100') + action('Mua ngoại tệ', 'fx-buy') + action('Bán ngoại tệ', 'fx-sell') + '</div><p>Số dư ngoại tệ: ' + Object.entries(state.foreign).map(([code, amount]) => code + ' ' + amount).join(' · ') + '</p>';
      } else if (tab === 'market') {
        html = '<h3>Thị trường chứng khoán giả lập</h3><p>Giá thay đổi mỗi tháng theo biến động ngẫu nhiên; đây không phải dữ liệu sàn thật.</p>' + Object.entries(market.stocks).map(([code, stock]) => '<article class="pe-row"><span><b>' + code + '</b> · ' + stock.name + '<small>' + formatMoney(stock.price) + ' / cổ phiếu · Sở hữu: ' + (state.stocks[code] || 0) + '</small></span><span><button data-stock-buy="' + code + '">Mua 1</button><button data-stock-sell="' + code + '">Bán 1</button></span></article>').join('');
      } else if (tab === 'property') {
        html = '<h3>Thị trường bất động sản</h3><p>Cho thuê tạo dòng tiền; mỗi tháng trừ chi phí bảo trì.</p>' + market.properties.map(item => '<article class="pe-row"><span><b>' + item.name + '</b><small>Giá ' + formatMoney(item.price) + ' · Thuê ' + formatMoney(item.rent) + '/tháng · Bảo trì ' + formatMoney(item.maintenance) + '</small></span>' + action('Mua', 'property', ' data-id="' + item.id + '"') + '</article>').join('') + '<h4>Tài sản đang sở hữu</h4>' + state.properties.map(item => '<p>' + escapeHTML(item.type) + ' · Giá trị ' + formatMoney(item.value) + ' · Thuê ' + formatMoney(item.rent) + '/tháng</p>').join('');
      } else if (tab === 'shop') {
        html = '<h3>Kinh doanh tạp hóa</h3><p>Mở cửa hàng 12 triệu VND. Nhập hàng, định giá niêm yết, bán hàng và nộp VAT mô phỏng 8%; lợi nhuận chịu thuế mô phỏng 20% khi chốt tháng.</p>';
        if (!state.shop) html += action('Mở cửa hàng · 12 triệu', 'shop-open');
        else {
          html += '<p>Doanh thu lũy kế: ' + formatMoney(state.shop.revenue) + ' · Lợi nhuận trước thuế: ' + formatMoney(state.shop.profit) + '</p>';
          html += market.goods.map(good => '<article class="pe-row"><span><b>' + good.name + '</b><small>Giá nhập ' + formatMoney(good.cost) + ' · Giá bán ' + formatMoney(good.price) + ' · Tồn: ' + (state.shop.inventory[good.id] || 0) + '</small></span><span><button data-restock="' + good.id + '">Nhập 5</button><button data-sell-good="' + good.id + '">Bán 1</button></span></article>').join('');
        }
      }
      content.innerHTML = html;
      panel.querySelectorAll('[data-tab]').forEach(button => button.classList.toggle('active', button.dataset.tab === tab));
    }
    function ledgerHTML(entries) {
      return entries.slice(-8).reverse().map(entry => '<p class="pe-ledger"><span>' + escapeHTML(entry.note) + '<small>' + entry.month + '/' + entry.year + '</small></span><b>' + formatMoney(entry.amount) + '</b></p>').join('') || '<p>Chưa có giao dịch.</p>';
    }
    function formNumber(form, name) {
      const input = form.querySelector('[name="' + name + '"]');
      if (!input) throw new Error('Thiếu trường ' + name);
      const value = Number(input.value);
      if (!Number.isSafeInteger(value) || value <= 0) throw new TypeError('Nhập số nguyên dương hợp lệ.');
      return value;
    }
    function runAction(button) {
      const form = button.closest('.pe-form');
      const amount = form && form.querySelector('[name="amount"]') ? formNumber(form, 'amount') : 0;
      switch (button.dataset.action) {
        case 'month': engine.advanceMonth(); break;
        case 'deposit': engine.deposit(amount); break;
        case 'withdraw': engine.withdraw(amount); break;
        case 'loan': {
          const rate = Number(form.querySelector('[name="rate"]').value);
          engine.takeLoan(amount, rate); break;
        }
        case 'fx-buy':
        case 'fx-sell': engine.exchange(form.querySelector('[name="currency"]').value, amount, button.dataset.action === 'fx-buy' ? 'buy' : 'sell'); break;
        case 'property': engine.buyProperty(button.dataset.id); break;
        case 'shop-open': engine.openShop(); break;
        default: return;
      }
    }
    panel.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button) return;
      try {
        if (button.hasAttribute('data-close')) { panel.hidden = true; return; }
        if (button.dataset.tab) { tab = button.dataset.tab; render(); return; }
        if (button.dataset.stockBuy) engine.buyStock(button.dataset.stockBuy, 1);
        else if (button.dataset.stockSell) engine.sellStock(button.dataset.stockSell, 1);
        else if (button.dataset.restock) engine.restock(button.dataset.restock, 5);
        else if (button.dataset.sellGood) engine.sellGoods(button.dataset.sellGood, 1);
        else if (button.dataset.repay) engine.repayLoan(1000000, button.dataset.repay);
        else if (button.dataset.action) runAction(button);
        else return;
        render();
      } catch (error) { root.alert(error.message); }
    });
    launcher.addEventListener('click', () => { panel.hidden = !panel.hidden; if (!panel.hidden) render(); });
    render();
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createEngine, createInitialState, progressiveIncomeTax, CURRENCIES, STOCKS, PROPERTIES, GOODS, STORAGE_KEY };
  root.PrincipiaEconomy = Object.freeze({ createEngine, mountUI });
  if (root.document) {
    const boot = () => { try { mountUI(createEngine()); } catch (error) { root.console && root.console.error('[PRINCIPIA economy]', error); } };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
