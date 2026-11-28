(function (root) {
  'use strict';

  const MAX_STREAMS = 5;
  const MAX_MONTHS = 60;
  const LIMITS = Object.freeze({
    capital: [0, 1e12], revenue: [0, 1e9], variableCost: [0, 1e9],
    fixedCost: [0, 1e9], revenueGrowthPct: [-20, 30],
    costInflationPct: [-10, 30], taxRatePct: [0, 100],
    downsideShockPct: [0, 100], upsideBoostPct: [0, 100]
  });
  const money = value => new Intl.NumberFormat('vi-VN', {
    style: 'currency', currency: 'VND', maximumFractionDigits: 0
  }).format(value);
  const number = value => new Intl.NumberFormat('vi-VN', {
    maximumFractionDigits: 1
  }).format(value);

  function numeric(value, label) {
    if (value === null || value === undefined || typeof value === 'boolean' || (typeof value === 'string' && !value.trim())) throw new TypeError(label + ' phải là số.');
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new RangeError(label + ' phải là số hữu hạn.');
    return parsed;
  }

  function validate(input) {
    if (!input || typeof input !== 'object' || !Array.isArray(input.streams)) {
      throw new TypeError('Dữ liệu so sánh không hợp lệ.');
    }
    const months = numeric(input.months, 'Thời hạn');
    if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) {
      throw new RangeError('Thời hạn phải từ 1 đến 60 tháng.');
    }
    if (input.streams.length < 1 || input.streams.length > MAX_STREAMS) {
      throw new RangeError('Cần từ 1 đến 5 nguồn thu.');
    }
    const names = new Set();
    const streams = input.streams.map((stream, index) => {
      if (!stream || typeof stream !== 'object') throw new TypeError('Nguồn thu ' + (index + 1) + ' không hợp lệ.');
      const name = typeof stream.name === 'string' ? stream.name.trim() : '';
      if (!name || name.length > 60) throw new TypeError('Tên nguồn thu phải có 1–60 ký tự.');
      const normalized = name.toLocaleLowerCase();
      if (names.has(normalized)) throw new TypeError('Tên các nguồn thu phải khác nhau.');
      names.add(normalized);
      const result = { name };
      for (const [key, range] of Object.entries(LIMITS)) {
        const value = numeric(stream[key], name + ': ' + key);
        if (value < range[0] || value > range[1]) {
          throw new RangeError(name + ': ' + key + ' ngoài phạm vi cho phép.');
        }
        result[key] = value;
      }
      return Object.freeze(result);
    });
    return Object.freeze({ months, streams: Object.freeze(streams) });
  }

  function simulateStream(stream, months, scenario) {
    if (!Number.isInteger(months) || months < 1 || months > MAX_MONTHS) throw new RangeError('Thời hạn mô phỏng không hợp lệ.');
    if (!['base', 'downside', 'upside'].includes(scenario)) throw new TypeError('Kịch bản mô phỏng không hợp lệ.');
    const roundMoney = value => Math.round((value + Number.EPSILON) * 100) / 100;
    const revenueShock = scenario === 'downside' ? 1 - stream.downsideShockPct / 100
      : scenario === 'upside' ? 1 + stream.upsideBoostPct / 100 : 1;
    const growth = 1 + stream.revenueGrowthPct / 100;
    const inflation = 1 + stream.costInflationPct / 100;
    let cumulative = -stream.capital;
    let paybackMonth = stream.capital === 0 ? 0 : null;
    let totalRevenue = 0;
    let totalVariableCost = 0;
    let totalFixedCost = 0;
    let totalTax = 0;
    for (let month = 1; month <= months; month += 1) {
      const growthFactor = Math.pow(growth, month - 1);
      const revenue = roundMoney(stream.revenue * revenueShock * growthFactor);
      const variableCost = roundMoney(stream.revenue > 0
        ? stream.variableCost * (revenue / stream.revenue)
        : stream.variableCost * revenueShock * growthFactor);
      const fixedCost = roundMoney(stream.fixedCost * Math.pow(inflation, month - 1));
      const operatingProfit = roundMoney(revenue - variableCost - fixedCost);
      const tax = roundMoney(Math.max(0, operatingProfit) * stream.taxRatePct / 100);
      cumulative = roundMoney(cumulative + operatingProfit - tax);
      totalRevenue = roundMoney(totalRevenue + revenue);
      totalVariableCost = roundMoney(totalVariableCost + variableCost);
      totalFixedCost = roundMoney(totalFixedCost + fixedCost);
      totalTax = roundMoney(totalTax + tax);
      if (paybackMonth === null && cumulative >= 0) paybackMonth = month;
    }
    const totalCosts = roundMoney(totalVariableCost + totalFixedCost + totalTax);
    return Object.freeze({
      totalRevenue, totalVariableCost, totalFixedCost, totalTax, totalCosts,
      netAfterCapital: cumulative,
      roiPct: stream.capital > 0 ? roundMoney(cumulative / stream.capital * 100) : null,
      paybackMonth
    });
  }

  function calculate(input) {
    const data = validate(input);
    const results = data.streams.map(stream => Object.freeze({
      name: stream.name,
      capital: stream.capital,
      base: simulateStream(stream, data.months, 'base'),
      downside: simulateStream(stream, data.months, 'downside'),
      upside: simulateStream(stream, data.months, 'upside')
    }));
    const ranked = results.slice().sort((a, b) =>
      b.base.netAfterCapital - a.base.netAfterCapital
    );
    const sum = scenario => results.reduce((total, item) =>
      total + item[scenario].netAfterCapital, 0
    );
    return Object.freeze({
      months: data.months,
      results: Object.freeze(results),
      ranking: Object.freeze(ranked.map(item => item.name)),
      totals: Object.freeze({
        base: sum('base'), downside: sum('downside'), upside: sum('upside')
      })
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function metric(label, value) {
    return '<article class="pe-compare-metric"><small>' + escapeHTML(label) +
      '</small><b>' + escapeHTML(value) + '</b></article>';
  }

  function field(label, name, value, min, max, step) {
    return '<label>' + escapeHTML(label) + '<input type="number" name="' + name +
      '" value="' + value + '" min="' + min + '" max="' + max + '" step="' + step +
      '" required></label>';
  }

  function streamMarkup(index) {
    const defaults = {
      capital: 0, revenue: 0, variableCost: 0, fixedCost: 0,
      revenueGrowthPct: 0, costInflationPct: 0, taxRatePct: 0,
      downsideShockPct: 20, upsideBoostPct: 15
    };
    return '<fieldset class="pe-compare-stream" data-stream><legend>Nguồn thu ' + (index + 1) +
      '</legend><div class="pe-compare-stream-grid">' +
      '<label class="pe-compare-name">Tên nguồn thu<input name="name" maxlength="60" value="Nguồn thu ' +
      (index + 1) + '" required></label>' +
      field('Vốn ban đầu (₫)', 'capital', defaults.capital, 0, 1000000000000, 1) +
      field('Doanh thu / tháng (₫)', 'revenue', defaults.revenue, 0, 1000000000, 1) +
      field('Chi phí biến đổi / tháng (₫)', 'variableCost', defaults.variableCost, 0, 1000000000, 1) +
      field('Chi phí cố định / tháng (₫)', 'fixedCost', defaults.fixedCost, 0, 1000000000, 1) +
      field('Tăng trưởng doanh thu / tháng (%)', 'revenueGrowthPct', defaults.revenueGrowthPct, -20, 30, 0.1) +
      field('Lạm phát chi phí / tháng (%)', 'costInflationPct', defaults.costInflationPct, -10, 30, 0.1) +
      field('Thuế trên lãi dương (%)', 'taxRatePct', defaults.taxRatePct, 0, 100, 0.1) +
      field('Doanh thu giảm ở kịch bản xấu (%)', 'downsideShockPct', defaults.downsideShockPct, 0, 100, 0.1) +
      field('Doanh thu tăng ở kịch bản tốt (%)', 'upsideBoostPct', defaults.upsideBoostPct, 0, 100, 0.1) +
      '</div><button type="button" class="pe-compare-remove" data-remove>Gỡ nguồn thu</button></fieldset>';
  }

  function readForm(form) {
    const streams = Array.from(form.querySelectorAll('[data-stream]')).map(card => {
      const value = name => card.querySelector('[name="' + name + '"]').value;
      return {
        name: value('name'), capital: value('capital'), revenue: value('revenue'),
        variableCost: value('variableCost'), fixedCost: value('fixedCost'),
        revenueGrowthPct: value('revenueGrowthPct'), costInflationPct: value('costInflationPct'),
        taxRatePct: value('taxRatePct'), downsideShockPct: value('downsideShockPct'),
        upsideBoostPct: value('upsideBoostPct')
      };
    });
    return { months: form.elements.namedItem('months').value, streams };
  }

  function renderResults(target, result) {
    const rows = result.results.map(item => {
      const payback = item.base.paybackMonth === null ? 'Không hoàn vốn' :
        item.base.paybackMonth === 0 ? 'Đã hòa vốn' : 'Tháng ' + item.base.paybackMonth;
      return '<tr><th>' + escapeHTML(item.name) + '</th><td>' + money(item.base.netAfterCapital) +
        '</td><td>' + (item.base.roiPct === null ? '—' : number(item.base.roiPct) + '%') +
        '</td><td>' + payback + '</td><td>' + money(item.downside.netAfterCapital) +
        '</td><td>' + money(item.upside.netAfterCapital) + '</td></tr>';
    }).join('');
    target.innerHTML =
      '<section class="pe-compare-output"><h3>Kết quả sau ' + result.months + ' tháng</h3>' +
      '<div class="pe-compare-summary">' +
      metric('Kịch bản cơ sở · dòng tiền ròng', money(result.totals.base)) +
      metric('Kịch bản xấu · dòng tiền ròng', money(result.totals.downside)) +
      metric('Kịch bản tốt · dòng tiền ròng', money(result.totals.upside)) +
      '</div><div class="pe-compare-table-wrap"><table><thead><tr><th>Nguồn thu</th>' +
      '<th>Cơ sở</th><th>ROI cơ sở</th><th>Hoàn vốn</th><th>Kịch bản xấu</th>' +
      '<th>Kịch bản tốt</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="pe-compare-ranking">Xếp hạng theo dòng tiền ròng kịch bản cơ sở: ' +
      result.ranking.map((name, index) => (index + 1) + '. ' + escapeHTML(name)).join(' · ') +
      '</p><p class="pe-compare-note">Dòng tiền đã trừ vốn ban đầu, chi phí và thuế giả định. Chưa tính vay nợ, khấu hao, vốn lưu động, thời điểm thu/chi, lạm phát sức mua, phí nền tảng hoặc biến động thị trường. Đây là mô phỏng, không phải cam kết lợi nhuận hay khuyến nghị đầu tư.</p></section>';
  }

  function mount() {
    const doc = root.document;
    const panel = doc && doc.getElementById('principia-economy-root');
    const tabs = panel && panel.querySelector('.pe-tabs');
    const content = panel && panel.querySelector('#pe-content');
    if (!panel || !tabs || !content || panel.dataset.incomeCompareReady) return false;
    panel.dataset.incomeCompareReady = 'true';
    const button = doc.createElement('button');
    button.type = 'button';
    button.dataset.incomeCompareTab = 'true';
    button.textContent = 'So sánh & dự báo thu nhập';
    tabs.appendChild(button);

    button.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      content.innerHTML = '<section class="pe-income-compare"><header><b>MÔ PHỎNG DÒNG TIỀN NHIỀU NGUỒN</b>' +
        '<p>So sánh tối đa 5 nguồn thu trong 1–60 tháng bằng ba kịch bản. Các tỷ lệ tăng trưởng được tính theo tháng.</p></header>' +
        '<form data-compare-form><label class="pe-compare-horizon">Thời gian dự báo (tháng)' +
        '<input type="number" name="months" min="1" max="60" value="12" required></label>' +
        '<div class="pe-compare-streams">' + [0, 1, 2].map(streamMarkup).join('') +
        '</div><div class="pe-compare-actions"><button type="button" data-add>Thêm nguồn thu</button>' +
        '<button type="submit">Tính và so sánh</button></div></form>' +
        '<div class="pe-compare-results" aria-live="polite"></div></section>';
      const form = content.querySelector('[data-compare-form]');
      const streams = form.querySelector('.pe-compare-streams');
      const output = content.querySelector('.pe-compare-results');
      let nextSourceNumber = 4;
      form.addEventListener('click', event => {
        const remove = event.target.closest('[data-remove]');
        if (remove) {
          if (streams.querySelectorAll('[data-stream]').length <= 1) {
            output.textContent = 'Cần giữ ít nhất một nguồn thu.';
            return;
          }
          remove.closest('[data-stream]').remove();
          streams.querySelectorAll('[data-stream]').forEach((card, index) => {
            card.querySelector('legend').textContent = 'Nguồn thu ' + (index + 1);
          });
        }
        if (event.target.closest('[data-add]')) {
          const cards = streams.querySelectorAll('[data-stream]');
          if (cards.length >= MAX_STREAMS) {
            output.textContent = 'Chỉ có thể so sánh tối đa 5 nguồn thu.';
            return;
          }
          streams.insertAdjacentHTML('beforeend', streamMarkup(nextSourceNumber - 1));
          nextSourceNumber += 1;
        }
      });
      form.addEventListener('submit', event => {
        event.preventDefault();
        try {
          const result = calculate(readForm(form));
          renderResults(output, result);
        } catch (error) {
          output.textContent = error.message;
        }
      });
    });

    panel.addEventListener('click', event => {
      if (event.target.closest('.pe-tabs > button') &&
          !event.target.closest('[data-income-compare-tab]')) button.classList.remove('active');
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

  const api = Object.freeze({ validate, calculate, simulateStream, MAX_STREAMS, MAX_MONTHS });
  root.PrincipiaIncomeComparison = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
