(function (root) {
  'use strict';

  const numberFormat = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
  const currency = value => numberFormat.format(value) + ' ₫';
  const fields = Object.freeze([
    ['capital', 'Vốn đầu tư ban đầu', 0, 1000000000000],
    ['price', 'Giá bán / doanh thu mỗi đơn vị', 0, 1000000000000],
    ['volume', 'Số đơn vị bán mỗi tháng', 0, 100000000],
    ['variable', 'Chi phí biến đổi mỗi đơn vị', 0, 1000000000000],
    ['fixed', 'Chi phí cố định mỗi tháng', 0, 1000000000000],
    ['hours', 'Số giờ làm mỗi tháng', 0, 744]
  ]);

  function validate(values) {
    if (!values || typeof values !== 'object') throw new TypeError('Dữ liệu kế hoạch không hợp lệ');
    const result = {};
    for (const [key, , min, max] of fields) {
      const value = Number(values[key]);
      if (!Number.isFinite(value) || value < min || value > max) {
        throw new RangeError('Giá trị ' + key + ' nằm ngoài phạm vi cho phép');
      }
      result[key] = value;
    }
    return result;
  }

  function calculate(values) {
    const v = validate(values);
    const revenue = v.price * v.volume;
    const variableCosts = v.variable * v.volume;
    const contributionPerUnit = v.price - v.variable;
    const net = revenue - variableCosts - v.fixed;
    const breakEvenUnits = contributionPerUnit > 0 ? Math.ceil(v.fixed / contributionPerUnit) : null;
    return Object.freeze({
      revenue,
      variableCosts,
      fixedCosts: v.fixed,
      net,
      margin: revenue > 0 ? net / revenue * 100 : null,
      breakEvenUnits,
      monthlyRoi: v.capital > 0 ? net / v.capital * 100 : null,
      hourlyIncome: v.hours > 0 ? net / v.hours : null,
      paybackMonths: net > 0 && v.capital > 0 ? v.capital / net : null
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function metric(label, value, detail) {
    return '<article class="pe-income-metric"><span>' + escapeHTML(label) +
      '</span><b>' + escapeHTML(value) + '</b><small>' + escapeHTML(detail || '') + '</small></article>';
  }

  function renderResults(rootElement, form) {
    const values = Object.fromEntries(fields.map(([key]) => [key, form.elements.namedItem(key).value]));
    const result = calculate(values);
    const netLabel = result.net >= 0 ? 'Lợi nhuận / dòng tiền ròng tháng' : 'Lỗ dự kiến mỗi tháng';
    rootElement.innerHTML = [
      metric('Doanh thu tháng', currency(result.revenue), 'Giá bán × số lượng'),
      metric('Chi phí biến đổi', currency(result.variableCosts), 'Chi phí theo sản lượng'),
      metric('Tổng chi phí tháng', currency(result.variableCosts + result.fixedCosts), 'Biến đổi + cố định'),
      metric(netLabel, currency(result.net), 'Chưa tính thuế và chi phí tài chính'),
      metric('Biên ròng', result.margin === null ? '—' : result.margin.toFixed(2) + '%', 'Lợi nhuận ròng / doanh thu'),
      metric('Sản lượng hòa vốn', result.breakEvenUnits === null ? 'Không đạt' : numberFormat.format(result.breakEvenUnits) + ' đơn vị', 'Mỗi tháng, với giá và chi phí hiện tại'),
      metric('ROI tháng trên vốn', result.monthlyRoi === null ? '—' : result.monthlyRoi.toFixed(2) + '%', 'Không phải lợi suất được bảo đảm'),
      metric('Thu nhập ròng / giờ', result.hourlyIncome === null ? '—' : currency(result.hourlyIncome), 'Dựa trên số giờ bạn nhập'),
      metric('Thời gian hoàn vốn', result.paybackMonths === null ? '—' : result.paybackMonths.toFixed(1) + ' tháng', 'Ước tính nếu lợi nhuận tháng giữ nguyên')
    ].join('');
  }

  function mount() {
    const panel = root.document && root.document.getElementById('principia-economy-root');
    const tabs = panel && panel.querySelector('.pe-tabs');
    const content = panel && panel.querySelector('#pe-content');
    if (!panel || !tabs || !content || panel.dataset.incomePlannerReady) return false;
    panel.dataset.incomePlannerReady = 'true';

    const button = root.document.createElement('button');
    button.type = 'button';
    button.dataset.incomePlannerTab = 'true';
    button.textContent = 'Máy tính kế hoạch thu nhập';
    tabs.appendChild(button);

    button.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      content.innerHTML =
        '<section class="pe-income-planner"><header><b>MÔ PHỎNG DOANH THU & HÒA VỐN</b>' +
        '<p>Nhập giả định của một công việc, dịch vụ hoặc mô hình kinh doanh để ước tính kết quả hàng tháng.</p></header>' +
        '<form data-income-planner-form><div class="pe-income-fields">' +
        fields.map(([key, label, min, max]) =>
          '<label>' + escapeHTML(label) + '<input name="' + key + '" type="number" inputmode="decimal" min="' +
          min + '" max="' + max + '" step="any" value="0" required></label>'
        ).join('') +
        '</div><p class="pe-income-hint">Nhập cùng một đơn vị tiền tệ cho tất cả khoản tiền. Mặc định hiển thị VND; nếu dùng đơn vị khác, hãy tự quy đổi kết quả.</p>' +
        '<button type="reset" class="pe-income-reset">Đặt lại</button></form>' +
        '<div class="pe-income-results" aria-live="polite"></div>' +
        '<p class="pe-income-disclaimer">Đây là mô hình tính toán theo giả định người dùng nhập, không dự báo thị trường. Kết quả chưa tự động tính thuế, lãi vay, khấu hao, hoàn hàng, phí nền tảng hoặc biến động nhu cầu.</p></section>';

      const form = content.querySelector('[data-income-planner-form]');
      const results = content.querySelector('.pe-income-results');
      const update = () => {
        try {
          renderResults(results, form);
          form.querySelectorAll('input').forEach(input => input.setCustomValidity(''));
        } catch (error) {
          results.textContent = error.message;
        }
      };
      form.addEventListener('input', update);
      form.addEventListener('reset', () => root.setTimeout(update, 0));
      update();
    });

    panel.addEventListener('click', event => {
      if (event.target.closest('.pe-tabs > button') && !event.target.closest('[data-income-planner-tab]')) {
        button.classList.remove('active');
      }
    }, true);
    return true;
  }

  function boot() {
    let attempts = 0;
    const retry = () => {
      if (mount() || ++attempts >= 40) return;
      root.setTimeout(retry, 250);
    };
    retry();
  }

  const api = Object.freeze({ calculate, validate });
  root.PrincipiaIncomePlanner = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
