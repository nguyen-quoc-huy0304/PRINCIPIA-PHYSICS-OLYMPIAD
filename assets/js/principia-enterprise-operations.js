(function (root) {
  'use strict';

  const STORAGE_KEY = 'principia:enterprise-operations:v1';
  const MAX_BUSINESSES = 25;
  const MAX_LEDGER = 2000;
  const MATERIALS = Object.freeze({
    flour: { name: 'Bột mì', unit: 'kg' },
    sugar: { name: 'Đường', unit: 'kg' },
    packaging: { name: 'Bao bì', unit: 'cái' },
    milk: { name: 'Sữa nguyên liệu', unit: 'lít' }
  });
  const RECIPES = Object.freeze({
    bread: { name: 'Bánh mì', output: 'bread', materials: { flour: 1, sugar: 0.1, packaging: 1 }, laborCost: 2500 },
    milk_carton: { name: 'Sữa đóng hộp', output: 'milk_carton', materials: { milk: 1, packaging: 1 }, laborCost: 1800 }
  });
  const PRODUCTS = Object.freeze({
    bread: { name: 'Bánh mì', unit: 'ổ' },
    milk_carton: { name: 'Sữa hộp', unit: 'hộp' }
  });

  function integer(value, label, minimum) {
    if (!Number.isSafeInteger(value) || value < (minimum || 1)) {
      throw new TypeError(label + ' không hợp lệ.');
    }
    return value;
  }
  function rate(value, label, maximum) {
    if (!Number.isFinite(value) || value < 0 || value > maximum) {
      throw new RangeError(label + ' ngoài giới hạn.');
    }
    return value;
  }
  function date(value) {
    const result = new Date(value);
    if (!Number.isFinite(result.getTime())) throw new TypeError('Thời điểm không hợp lệ.');
    return result;
  }
  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function freshState() { return { version: 1, businesses: [], ledger: [] }; }

  function sanitizeState(raw) {
    if (!raw || raw.version !== 1) return freshState();
    const validBusiness = item => item && typeof item.id === 'string' &&
      typeof item.name === 'string' && Number.isSafeInteger(item.cash) && item.cash >= 0 &&
      Number.isSafeInteger(item.taxPayable) && item.taxPayable >= 0 &&
      Number.isSafeInteger(item.revenue) && item.revenue >= 0 &&
      Number.isSafeInteger(item.costOfGoods) && item.costOfGoods >= 0 &&
      item.materials && typeof item.materials === 'object' &&
      item.products && typeof item.products === 'object' &&
      Array.isArray(item.employees);
    return {
      version: 1,
      businesses: Array.isArray(raw.businesses) ? raw.businesses.filter(validBusiness).slice(-MAX_BUSINESSES) : [],
      ledger: Array.isArray(raw.ledger) ? raw.ledger.filter(row =>
        row && typeof row.id === 'string' && typeof row.businessId === 'string' &&
        typeof row.type === 'string' && Number.isSafeInteger(row.amount) &&
        row.amount >= 0 && Number.isFinite(Date.parse(row.at))
      ).slice(-MAX_LEDGER) : []
    };
  }

  function createEnterpriseEngine(options) {
    if (!options || !options.wallet ||
        typeof options.wallet.debit !== 'function' ||
        typeof options.wallet.credit !== 'function') {
      throw new TypeError('Cần ví mô phỏng hỗ trợ debit và credit.');
    }
    const storage = options.storage || root.localStorage;
    const wallet = options.wallet;
    const now = typeof options.now === 'function' ? options.now : () => new Date();
    let state;
    try { state = sanitizeState(JSON.parse(storage && storage.getItem(STORAGE_KEY) || 'null')); }
    catch (_) { state = freshState(); }

    function persist() {
      if (!storage) return;
      try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch (_) { throw new Error('Không thể lưu sổ doanh nghiệp.'); }
    }
    function snapshot() { return copy(state); }
    function business(id) {
      const item = state.businesses.find(entry => entry.id === id);
      if (!item) throw new Error('Không tìm thấy doanh nghiệp.');
      return item;
    }
    function log(company, type, amount, note, at) {
      state.ledger.push({
        id: 'ent-' + at.getTime().toString(36) + '-' + state.ledger.length,
        businessId: company.id, type, amount, note: String(note).slice(0, 120),
        at: at.toISOString()
      });
      if (state.ledger.length > MAX_LEDGER) state.ledger.shift();
    }
    function createBusiness(name, capital) {
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 80) {
        throw new TypeError('Tên doanh nghiệp cần từ 2 đến 80 ký tự.');
      }
      integer(capital, 'Vốn thành lập', 1000000);
      if (state.businesses.length >= MAX_BUSINESSES) throw new RangeError('Đã đạt giới hạn doanh nghiệp.');
      const at = date(now());
      wallet.debit(capital);
      const company = {
        id: 'biz-' + at.getTime().toString(36) + '-' + (state.businesses.length + 1),
        name: name.trim(), cash: capital, taxPayable: 0, revenue: 0, costOfGoods: 0,
        materials: {}, products: {}, employees: [], payrollAccrued: 0,
        vatRate: 0.08, profitTaxRate: 0.2, createdAt: at.toISOString()
      };
      state.businesses.push(company);
      log(company, 'capital', capital, 'Góp vốn thành lập', at);
      persist();
      return snapshot();
    }
    function purchaseMaterial(id, sku, quantity, unitCost) {
      const company = business(id);
      if (!Object.prototype.hasOwnProperty.call(MATERIALS, sku)) throw new Error('Nguyên liệu không được hỗ trợ.');
      integer(quantity, 'Số lượng');
      integer(unitCost, 'Giá nhập');
      const total = quantity * unitCost;
      integer(total, 'Tổng tiền');
      if (company.cash < total) throw new RangeError('Doanh nghiệp không đủ tiền mua nguyên liệu.');
      const at = date(now());
      company.cash -= total;
      company.materials[sku] = (company.materials[sku] || 0) + quantity;
      log(company, 'material-purchase', total, 'Nhập ' + MATERIALS[sku].name + ' x' + quantity, at);
      persist();
      return snapshot();
    }
    function hire(id, role, monthlyWage) {
      const company = business(id);
      if (typeof role !== 'string' || role.trim().length < 2 || role.trim().length > 60) {
        throw new TypeError('Vị trí nhân sự không hợp lệ.');
      }
      integer(monthlyWage, 'Lương tháng');
      if (company.employees.length >= 500) throw new RangeError('Doanh nghiệp đã đạt giới hạn nhân sự.');
      const employee = {
        id: company.id + '-staff-' + (company.employees.length + 1),
        role: role.trim(), monthlyWage, active: true, hiredAt: date(now()).toISOString()
      };
      company.employees.push(employee);
      persist();
      return copy(employee);
    }
    function produce(id, recipeId, quantity) {
      const company = business(id);
      const recipe = RECIPES[recipeId];
      if (!recipe) throw new Error('Công thức sản xuất không tồn tại.');
      integer(quantity, 'Số lượng sản xuất');
      for (const [sku, perUnit] of Object.entries(recipe.materials)) {
        const needed = Math.ceil(perUnit * quantity * 100) / 100;
        if ((company.materials[sku] || 0) < needed) {
          throw new RangeError('Thiếu nguyên liệu: ' + MATERIALS[sku].name + '.');
        }
      }
      const labor = recipe.laborCost * quantity;
      if (company.cash < labor) throw new RangeError('Không đủ tiền thanh toán chi phí nhân công sản xuất.');
      const at = date(now());
      for (const [sku, perUnit] of Object.entries(recipe.materials)) {
        company.materials[sku] = Math.round(((company.materials[sku] || 0) - perUnit * quantity) * 100) / 100;
      }
      company.cash -= labor;
      company.products[recipe.output] = (company.products[recipe.output] || 0) + quantity;
      log(company, 'production', labor, 'Sản xuất ' + recipe.name + ' x' + quantity, at);
      persist();
      return snapshot();
    }
    function sell(id, productId, quantity, unitPrice, vatRate) {
      const company = business(id);
      if (!Object.prototype.hasOwnProperty.call(PRODUCTS, productId)) throw new Error('Sản phẩm không hợp lệ.');
      integer(quantity, 'Số lượng bán');
      integer(unitPrice, 'Đơn giá');
      const taxRate = vatRate === undefined ? company.vatRate : rate(vatRate, 'Thuế VAT', 0.2);
      if ((company.products[productId] || 0) < quantity) throw new RangeError('Tồn kho thành phẩm không đủ.');
      const net = quantity * unitPrice;
      integer(net, 'Doanh thu');
      const vat = Math.round(net * taxRate);
      const total = net + vat;
      integer(total, 'Tổng thanh toán');
      const at = date(now());
      company.products[productId] -= quantity;
      company.cash += total;
      company.revenue += net;
      company.taxPayable += vat;
      log(company, 'sale', total, 'Bán ' + PRODUCTS[productId].name + ' x' + quantity + ' (VAT ' + vat + ')', at);
      persist();
      return snapshot();
    }
    function recordCostOfGoods(id, amount) {
      const company = business(id);
      integer(amount, 'Giá vốn');
      if (amount > company.cash) throw new RangeError('Không đủ tiền ghi nhận giá vốn.');
      company.cash -= amount;
      company.costOfGoods += amount;
      log(company, 'cost-of-goods', amount, 'Ghi nhận giá vốn hàng bán', date(now()));
      persist();
      return snapshot();
    }
    function runPayroll(id) {
      const company = business(id);
      const total = company.employees.filter(item => item.active).reduce((sum, item) => sum + item.monthlyWage, 0);
      integer(total, 'Tổng lương', 0);
      if (total === 0) throw new Error('Không có nhân viên đang làm việc.');
      if (company.cash < total) throw new RangeError('Không đủ tiền trả lương.');
      const at = date(now());
      company.cash -= total;
      company.payrollAccrued += total;
      log(company, 'payroll', total, 'Chi trả lương tháng', at);
      persist();
      return snapshot();
    }
    function closeTaxPeriod(id) {
      const company = business(id);
      const profit = company.revenue - company.costOfGoods - company.payrollAccrued;
      const taxableProfit = Math.max(0, profit);
      const incomeTax = Math.round(taxableProfit * company.profitTaxRate);
      const totalTax = company.taxPayable + incomeTax;
      if (company.cash < totalTax) throw new RangeError('Không đủ tiền nộp thuế VAT và thuế lợi nhuận.');
      const at = date(now());
      company.cash -= totalTax;
      company.taxPayable = 0;
      company.revenue = 0;
      company.costOfGoods = 0;
      company.payrollAccrued = 0;
      log(company, 'tax-payment', totalTax, 'Nộp VAT và thuế lợi nhuận: ' + incomeTax, at);
      persist();
      return { state: snapshot(), incomeTax, vatPaid: totalTax - incomeTax, profit };
    }

    return Object.freeze({
      getState: snapshot, createBusiness, purchaseMaterial, hire, produce,
      sell, recordCostOfGoods, runPayroll, closeTaxPeriod
    });
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createEnterpriseEngine, sanitizeState, MATERIALS, RECIPES, PRODUCTS, STORAGE_KEY };
  }
  root.PrincipiaEnterpriseOperations = Object.freeze({ createEnterpriseEngine, MATERIALS, RECIPES, PRODUCTS });
})(typeof window !== 'undefined' ? window : globalThis);
