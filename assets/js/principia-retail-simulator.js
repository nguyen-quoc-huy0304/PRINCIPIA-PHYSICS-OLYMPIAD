(function (root) {
  'use strict';

  const KEY = 'principia:retail-simulator:v1';
  const INITIAL_CASH = 50000000;
  const MAX_RECORDS = 2000;
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;

  function amount(value, label, min = 0, max = Number.MAX_SAFE_INTEGER) {
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
      throw new RangeError(label + ' phải là số nguyên hợp lệ.');
    }
    return parsed;
  }

  function text(value, label, max = 100) {
    if (typeof value !== 'string' || !value.trim() || value.trim().length > max) {
      throw new TypeError(label + ' không hợp lệ.');
    }
    return value.trim();
  }

  function fresh() {
    return {
      version: 1, virtualCash: INITIAL_CASH, day: 0, store: null,
      products: [], batches: [], expenses: [], ledger: [],
      revenue: 0, costOfGoods: 0, vatPayable: 0, taxPaid: 0,
      operatingExpenses: 0, wasteValue: 0, salesCount: 0
    };
  }

  function sanitize(raw) {
    if (!raw || raw.version !== 1) return fresh();
    const state = fresh();
    for (const key of ['virtualCash', 'day', 'revenue', 'costOfGoods', 'vatPayable', 'taxPaid', 'operatingExpenses', 'wasteValue', 'salesCount']) {
      const value = raw[key];
      if (Number.isSafeInteger(value) && value >= 0) state[key] = value;
    }
    if (raw.store && typeof raw.store.name === 'string' && Number.isSafeInteger(raw.store.cash) && raw.store.cash >= 0) {
      state.store = { name: raw.store.name.slice(0, 80), cash: raw.store.cash, createdAt: typeof raw.store.createdAt === 'string' ? raw.store.createdAt : '' };
    }
    state.products = Array.isArray(raw.products) ? raw.products.filter(item =>
      item && typeof item.sku === 'string' && /^[A-Z0-9_-]{1,24}$/.test(item.sku) &&
      typeof item.name === 'string' && Number.isSafeInteger(item.salePrice) && item.salePrice > 0 &&
      Number.isFinite(item.vatRate) && item.vatRate >= 0 && item.vatRate <= 0.2
    ).slice(-500) : [];
    state.batches = Array.isArray(raw.batches) ? raw.batches.filter(item =>
      item && typeof item.id === 'string' && typeof item.sku === 'string' &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
      Number.isSafeInteger(item.unitCost) && item.unitCost >= 0 &&
      Number.isSafeInteger(item.expiresOn) && item.expiresOn >= 0
    ).slice(-MAX_RECORDS) : [];
    state.expenses = Array.isArray(raw.expenses) ? raw.expenses.filter(item =>
      item && Number.isSafeInteger(item.amount) && item.amount > 0 && typeof item.category === 'string'
    ).slice(-MAX_RECORDS) : [];
    state.ledger = Array.isArray(raw.ledger) ? raw.ledger.filter(item =>
      item && typeof item.type === 'string' && Number.isSafeInteger(item.amount) && item.amount >= 0
    ).slice(-MAX_RECORDS) : [];
    return state;
  }

  function createEngine({ storage = root.localStorage, now = () => new Date() } = {}) {
    let state;
    try { state = sanitize(JSON.parse(storage?.getItem(KEY) || 'null')); }
    catch (_) { state = fresh(); }

    const snapshot = () => JSON.parse(JSON.stringify(state));
    function persist() {
      try { storage?.setItem(KEY, JSON.stringify(state)); }
      catch (_) { throw new Error('Lưu dữ liệu thất bại; giao dịch đã được hoàn tác.'); }
    }
    function commit(operation) {
      const previous = state;
      state = snapshot();
      try {
        const result = operation();
        persist();
        return result === undefined ? snapshot() : result;
      } catch (error) {
        state = previous;
        throw error;
      }
    }
    function requireStore() {
      if (!state.store) throw new Error('Cần thành lập cửa hàng trước.');
      return state.store;
    }
    function product(sku) {
      const key = text(sku, 'Mã hàng', 24).toUpperCase();
      const item = state.products.find(entry => entry.sku === key);
      if (!item) throw new Error('Không tìm thấy mặt hàng.');
      return item;
    }
    function log(type, description, value) {
      state.ledger.push({ id: 'retail-' + state.day + '-' + state.ledger.length, day: state.day, type, description: description.slice(0, 120), amount: value, mode: 'SIMULATION_ONLY' });
      if (state.ledger.length > MAX_RECORDS) state.ledger.shift();
    }
    function createStore({ name, capital }) {
      const label = text(name, 'Tên cửa hàng', 80);
      const funds = amount(capital, 'Vốn thành lập', 1);
      return commit(() => {
        if (state.store) throw new Error('Đã có cửa hàng; không thể tạo cửa hàng thứ hai trong mô hình này.');
        if (funds > state.virtualCash) throw new RangeError('Không đủ vốn ảo.');
        state.virtualCash -= funds;
        state.store = { name: label, cash: funds, createdAt: now().toISOString() };
        log('STORE_OPEN', 'Thành lập ' + label, funds);
        return snapshot();
      });
    }
    function addProduct({ sku, name, category, unit, shelfLifeDays, salePrice, vatRate = 0.08 }) {
      const code = text(sku, 'Mã hàng', 24).toUpperCase();
      if (!/^[A-Z0-9_-]{1,24}$/.test(code)) throw new TypeError('Mã hàng chỉ được chứa A-Z, 0-9, gạch dưới và gạch ngang.');
      const item = {
        sku: code, name: text(name, 'Tên mặt hàng'), category: text(category, 'Danh mục', 60),
        unit: text(unit, 'Đơn vị', 20), shelfLifeDays: amount(shelfLifeDays, 'Hạn sử dụng', 1, 36500),
        salePrice: amount(salePrice, 'Giá bán', 1), vatRate: Number(vatRate)
      };
      if (!Number.isFinite(item.vatRate) || item.vatRate < 0 || item.vatRate > 0.2) throw new RangeError('Thuế VAT phải nằm trong khoảng 0–20%.');
      return commit(() => {
        requireStore();
        if (state.products.some(entry => entry.sku === code)) throw new Error('Mã hàng đã tồn tại.');
        if (state.products.length >= 500) throw new RangeError('Đã đạt giới hạn mặt hàng.');
        state.products.push(item);
        log('PRODUCT', 'Đăng ký ' + item.name, 0);
        return snapshot();
      });
    }
    function purchaseStock({ sku, quantity, unitCost, expiryDays, supplier = 'Nhà cung cấp chưa đặt tên' }) {
      const item = product(sku), qty = amount(quantity, 'Số lượng', 1), cost = amount(unitCost, 'Giá nhập', 0);
      const expiry = amount(expiryDays, 'Hạn còn lại', 1, 36500);
      const vendor = text(supplier, 'Nhà cung cấp', 100);
      const total = qty * cost;
      if (!Number.isSafeInteger(total)) throw new RangeError('Tổng tiền nhập hàng vượt giới hạn.');
      return commit(() => {
        const store = requireStore();
        if (store.cash < total) throw new RangeError('Không đủ tiền trong quỹ cửa hàng.');
        store.cash -= total;
        state.batches.push({ id: 'batch-' + state.day + '-' + state.batches.length, sku: item.sku, quantity: qty, unitCost: cost, expiresOn: state.day + Math.min(expiry, item.shelfLifeDays), supplier: vendor });
        log('STOCK_IN', 'Nhập ' + item.name + ' từ ' + vendor, total);
        return snapshot();
      });
    }
    function sell({ sku, quantity, unitPrice }) {
      const item = product(sku), qty = amount(quantity, 'Số lượng bán', 1);
      const price = unitPrice === undefined ? item.salePrice : amount(unitPrice, 'Giá bán', 1);
      return commit(() => {
        const store = requireStore();
        const available = state.batches.filter(batch => batch.sku === item.sku && batch.expiresOn > state.day).reduce((sum, batch) => sum + batch.quantity, 0);
        if (available < qty) throw new RangeError('Tồn kho khả dụng không đủ.');
        let remaining = qty, cogs = 0;
        const batches = state.batches.filter(batch => batch.sku === item.sku && batch.expiresOn > state.day).sort((a, b) => a.expiresOn - b.expiresOn || a.id.localeCompare(b.id));
        for (const batch of batches) {
          const used = Math.min(remaining, batch.quantity);
          batch.quantity -= used;
          remaining -= used;
          cogs += used * batch.unitCost;
          if (!remaining) break;
        }
        state.batches = state.batches.filter(batch => batch.quantity > 0);
        const revenue = qty * price;
        const vat = Math.round(revenue * item.vatRate);
        const total = revenue + vat;
        if (![revenue, vat, total, cogs, store.cash + total].every(Number.isSafeInteger)) throw new RangeError('Giá trị giao dịch vượt giới hạn an toàn.');
        store.cash += total;
        state.revenue += revenue;
        state.costOfGoods += cogs;
        state.vatPayable += vat;
        state.salesCount++;
        log('SALE', 'Bán ' + item.name + ' x' + qty, total);
        return { state: snapshot(), revenue, vat, total, costOfGoods: cogs, grossProfit: revenue - cogs };
      });
    }
    function addExpense({ category, amount: value, note }) {
      const label = text(category, 'Loại chi phí', 60), cost = amount(value, 'Chi phí', 1);
      const description = text(note, 'Nội dung chi phí', 120);
      return commit(() => {
        const store = requireStore();
        if (store.cash < cost) throw new RangeError('Không đủ tiền trong quỹ cửa hàng.');
        store.cash -= cost;
        state.operatingExpenses += cost;
        state.expenses.push({ day: state.day, category: label, amount: cost, note: description });
        if (state.expenses.length > MAX_RECORDS) state.expenses.shift();
        log('EXPENSE', label + ': ' + description, cost);
        return snapshot();
      });
    }
    function advance(days = 1) {
      const count = amount(days, 'Số ngày', 1, 3650);
      return commit(() => {
        requireStore();
        for (let day = 0; day < count; day++) {
          state.day++;
          const expired = state.batches.filter(batch => batch.expiresOn <= state.day);
          for (const batch of expired) {
            const loss = batch.quantity * batch.unitCost;
            state.wasteValue += loss;
            log('EXPIRED', 'Hủy hàng hết hạn ' + batch.sku, loss);
          }
          state.batches = state.batches.filter(batch => batch.expiresOn > state.day);
        }
        return snapshot();
      });
    }
    function closeTaxPeriod({ corporateTaxRate = 0.2 } = {}) {
      const rate = Number(corporateTaxRate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 0.5) throw new RangeError('Thuế suất doanh nghiệp phải nằm trong khoảng 0–50%.');
      return commit(() => {
        const store = requireStore();
        const profitBeforeTax = state.revenue - state.costOfGoods - state.operatingExpenses - state.wasteValue;
        const incomeTax = Math.round(Math.max(0, profitBeforeTax) * rate);
        const vatPaid = state.vatPayable;
        const totalTax = vatPaid + incomeTax;
        if (store.cash < totalTax) throw new RangeError('Không đủ tiền nộp thuế mô phỏng.');
        store.cash -= totalTax;
        state.taxPaid += totalTax;
        state.vatPayable = 0;
        log('TAX', 'Quyết toán VAT và thuế lợi nhuận', totalTax);
        const result = { state: snapshot(), vatPaid, incomeTax, profitBeforeTax, totalTax };
        state.revenue = 0;
        state.costOfGoods = 0;
        state.operatingExpenses = 0;
        state.wasteValue = 0;
        return { ...result, state: snapshot() };
      });
    }
    function summary() {
      const inventoryValue = state.batches.reduce((sum, batch) => sum + batch.quantity * batch.unitCost, 0);
      const inventoryUnits = state.batches.reduce((sum, batch) => sum + batch.quantity, 0);
      return { ...snapshot(), inventoryValue, inventoryUnits, virtualOnly: true };
    }
    function reset() { return commit(() => { state = fresh(); return snapshot(); }); }
    return Object.freeze({ getState: snapshot, getSummary: summary, createStore, addProduct, purchaseStock, sell, addExpense, advance, closeTaxPeriod, reset });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  }

  function mount() {
    const panel = root.document?.getElementById('principia-economy-root');
    const tabs = panel?.querySelector('.pe-tabs');
    const content = panel?.querySelector('#pe-content');
    if (!panel || !tabs || !content || panel.dataset.retailSimulatorReady) return false;
    panel.dataset.retailSimulatorReady = '1';
    const button = root.document.createElement('button');
    button.type = 'button';
    button.textContent = 'Cửa hàng bán lẻ';
    tabs.appendChild(button);
    const engine = createEngine();
    button.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      render(content, engine);
    });
    return true;
  }

  function render(element, engine) {
    const state = engine.getSummary();
    const money = value => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(value) + ' ₫';
    const escape = escapeHTML;
    const status = '<p class="prs-status" role="status" aria-live="polite"></p>';
    const store = state.store;
    const products = state.products;
    const productOptions = products.map(item => '<option value="' + escape(item.sku) + '">' + escape(item.name) + ' (' + escape(item.unit) + ')</option>').join('');
    const inventory = products.map(item => {
      const batches = state.batches.filter(batch => batch.sku === item.sku);
      const quantity = batches.reduce((sum, batch) => sum + batch.quantity, 0);
      const value = batches.reduce((sum, batch) => sum + batch.quantity * batch.unitCost, 0);
      return '<article class="prs-row"><b>' + escape(item.name) + ' · ' + escape(item.sku) + '</b><span>' + quantity + ' ' + escape(item.unit) + ' · vốn tồn ' + money(value) + ' · giá bán ' + money(item.salePrice) + '</span></article>';
    }).join('') || '<p>Chưa có mặt hàng.</p>';
    const ledger = state.ledger.slice().reverse().slice(0, 25).map(item => '<article class="prs-row"><b>' + escape(item.type) + '</b><span>' + escape(item.description) + ' · ' + money(item.amount) + ' · ngày ' + item.day + '</span></article>').join('') || '<p>Chưa có giao dịch.</p>';
    element.innerHTML = '<section class="prs"><header><b>PRINCIPIA · RETAIL BUSINESS SIMULATOR</b><p>Tiền ảo hoàn toàn · Không kết nối thanh toán thật · Giá bán, chi phí và hạn sử dụng do người mô phỏng thiết lập.</p></header>' +
      '<div class="prs-stats"><article><small>Vốn ảo chưa phân bổ</small><strong>' + money(state.virtualCash) + '</strong></article><article><small>Tiền cửa hàng</small><strong>' + money(store?.cash || 0) + '</strong></article><article><small>Giá trị tồn kho</small><strong>' + money(state.inventoryValue) + '</strong></article><article><small>Đơn vị tồn kho</small><strong>' + state.inventoryUnits + '</strong></article><article><small>Ngày mô phỏng</small><strong>' + state.day + '</strong></article><article><small>Thuế đã nộp</small><strong>' + money(state.taxPaid) + '</strong></article></div>' +
      status +
      (!store ? '<form data-action="store"><h3>Thành lập cửa hàng</h3><input name="name" maxlength="80" placeholder="Tên cửa hàng" required><input name="capital" type="number" min="1" step="1" placeholder="Vốn ban đầu (VND)" required><button>Thành lập bằng vốn ảo</button></form>' :
      '<div class="prs-grid"><form data-action="product"><h3>Đăng ký mặt hàng</h3><input name="sku" maxlength="24" placeholder="Mã hàng: RICE01" required><input name="name" maxlength="100" placeholder="Tên sản phẩm" required><input name="category" maxlength="60" placeholder="Danh mục" required><input name="unit" maxlength="20" placeholder="Đơn vị: kg, chai, hộp..." required><input name="shelfLifeDays" type="number" min="1" step="1" placeholder="Hạn sử dụng (ngày)" required><input name="salePrice" type="number" min="1" step="1" placeholder="Giá bán (VND)" required><input name="vatRate" type="number" min="0" max=".2" step=".01" value=".08" placeholder="VAT 0–0.2" required><button>Lưu mặt hàng</button></form>' +
      '<form data-action="purchase"><h3>Nhập hàng từ nhà cung cấp</h3><select name="sku" required>' + productOptions + '</select><input name="quantity" type="number" min="1" step="1" placeholder="Số lượng" required><input name="unitCost" type="number" min="0" step="1" placeholder="Giá nhập/đơn vị" required><input name="expiryDays" type="number" min="1" step="1" placeholder="Còn hạn (ngày)" required><input name="supplier" maxlength="100" placeholder="Nhà cung cấp" required><button>Nhập kho</button></form>' +
      '<form data-action="sale"><h3>Bán hàng tại quầy</h3><select name="sku" required>' + productOptions + '</select><input name="quantity" type="number" min="1" step="1" placeholder="Số lượng bán" required><input name="unitPrice" type="number" min="1" step="1" placeholder="Giá bán (để trống dùng giá niêm yết)"><button>Ghi nhận bán hàng</button></form>' +
      '<form data-action="expense"><h3>Chi phí vận hành</h3><input name="category" maxlength="60" placeholder="Điện nước / thuê mặt bằng / lương..." required><input name="amount" type="number" min="1" step="1" placeholder="Số tiền (VND)" required><input name="note" maxlength="120" placeholder="Ghi chú" required><button>Ghi nhận chi phí</button></form></div>' +
      '<div class="prs-actions"><button type="button" data-advance>Tiến 1 ngày</button><button type="button" data-advance-month>Tiến 30 ngày</button><button type="button" data-tax>Quyết toán VAT & thuế lợi nhuận</button></div>' +
      '<h3>Hàng hóa trong kho</h3><div class="prs-list">' + inventory + '</div><h3>Sổ giao dịch</h3><div class="prs-list">' + ledger + '</div>') + '</section>';

    const message = element.querySelector('.prs-status');
    element.querySelectorAll('form[data-action]').forEach(form => form.addEventListener('submit', event => {
      event.preventDefault();
      const data = Object.fromEntries(new FormData(form).entries());
      try {
        const action = form.dataset.action;
        if (action === 'store') engine.createStore({ name: data.name, capital: Number(data.capital) });
        if (action === 'product') engine.addProduct({ ...data, shelfLifeDays: Number(data.shelfLifeDays), salePrice: Number(data.salePrice), vatRate: Number(data.vatRate) });
        if (action === 'purchase') engine.purchaseStock({ ...data, quantity: Number(data.quantity), unitCost: Number(data.unitCost), expiryDays: Number(data.expiryDays) });
        if (action === 'sale') engine.sell({ sku: data.sku, quantity: Number(data.quantity), ...(data.unitPrice ? { unitPrice: Number(data.unitPrice) } : {}) });
        if (action === 'expense') engine.addExpense({ ...data, amount: Number(data.amount) });
        render(element, engine);
      } catch (error) { message.textContent = error.message; }
    }));
    element.querySelector('[data-advance]')?.addEventListener('click', () => {
      try { engine.advance(1); render(element, engine); } catch (error) { message.textContent = error.message; }
    });
    element.querySelector('[data-advance-month]')?.addEventListener('click', () => {
      try { engine.advance(30); render(element, engine); } catch (error) { message.textContent = error.message; }
    });
    element.querySelector('[data-tax]')?.addEventListener('click', () => {
      try {
        const result = engine.closeTaxPeriod();
        message.textContent = 'Đã quyết toán: VAT ' + money(result.vatPaid) + ', thuế lợi nhuận ' + money(result.incomeTax) + '.';
        render(element, engine);
      } catch (error) { message.textContent = error.message; }
    });
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { createEngine, INITIAL_CASH, KEY };
  root.PrincipiaRetailSimulator = Object.freeze({ createEngine, INITIAL_CASH });
  if (root.document) {
    const start = () => { let attempts = 0; const retry = () => { if (!mount() && ++attempts < 40) root.setTimeout(retry, 250); }; retry(); };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', start, { once: true });
    else start();
  }
})(typeof window !== 'undefined' ? window : globalThis);
