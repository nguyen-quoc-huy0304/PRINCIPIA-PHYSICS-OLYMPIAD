(function (root) {
  'use strict';

  const CATEGORY_LABELS = Object.freeze({
    investment_strategy: 'Chiến lược đầu tư',
    asset_classes: 'Lớp tài sản',
    valuation_models: 'Định giá',
    business_revenue: 'Mô hình doanh thu',
    business_operating: 'Vận hành doanh nghiệp',
    funding_capital: 'Vốn & huy động vốn'
  });
  const PAGE_SIZE = 24;

  function filterModels(models, category = 'all', query = '') {
    if (!Array.isArray(models)) throw new TypeError('models must be an array');
    if (typeof category !== 'string' || typeof query !== 'string') {
      throw new TypeError('category and query must be strings');
    }
    const term = query.trim().toLocaleLowerCase('vi');
    return models.filter(item => {
      const categoryMatch = category === 'all' || item.category === category;
      if (!categoryMatch) return false;
      if (!term) return true;
      const searchable = [
        item.id, item.name, item.description, item.category,
        ...item.evaluationMetrics, ...item.keyRisks, ...item.sourceRefs
      ].join(' ').toLocaleLowerCase('vi');
      return searchable.includes(term);
    });
  }

  function getPage(items, page = 1, pageSize = PAGE_SIZE) {
    if (!Array.isArray(items)) throw new TypeError('items must be an array');
    if (!Number.isInteger(page) || page < 1) throw new RangeError('page must be a positive integer');
    if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) {
      throw new RangeError('pageSize must be between 1 and 100');
    }
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function render(content, library, state) {
    const visible = filterModels(library.MODELS, state.category, state.query);
    const pageItems = getPage(visible, state.page);
    const categories = ['all', ...library.getCategories()];
    content.innerHTML =
      '<section class="pe-business-library-intro"><b>THƯ VIỆN ĐẦU TƯ & KINH DOANH · ' +
      library.MODEL_COUNT + ' MÔ HÌNH</b><p>Tra cứu chiến lược đầu tư, lớp tài sản, phương pháp định giá, mô hình doanh thu, vận hành và cấu trúc vốn. Đây là thư viện học tập, không phải khuyến nghị đầu tư.</p></section>' +
      '<label class="pe-business-library-search">Tìm mô hình<input type="search" data-business-search maxlength="120" placeholder="Ví dụ: DCF, nhượng quyền, subscription, venture capital..." value="' + escapeHTML(state.query) + '"></label>' +
      '<div class="pe-business-library-filters">' + categories.map(category =>
        '<button type="button" data-business-category="' + escapeHTML(category) + '" class="' +
        (category === state.category ? 'active' : '') + '">' +
        escapeHTML(category === 'all' ? 'Tất cả' : CATEGORY_LABELS[category]) + '</button>'
      ).join('') + '</div>' +
      '<p class="pe-business-library-count">Hiển thị ' + pageItems.length + '/' + visible.length +
      ' mô hình · Tổng thư viện ' + library.MODEL_COUNT + '</p>' +
      '<div class="pe-business-library-list">' + pageItems.map(item =>
        '<article class="pe-business-model-card"><header><b>' + escapeHTML(item.name) +
        '</b><small>' + escapeHTML(CATEGORY_LABELS[item.category]) + '</small></header>' +
        '<p>' + escapeHTML(item.description) + '</p>' +
        '<div class="pe-business-model-detail"><section><strong>Chỉ số đánh giá</strong><ul>' +
        item.evaluationMetrics.map(value => '<li>' + escapeHTML(value) + '</li>').join('') +
        '</ul></section><section><strong>Rủi ro chính</strong><ul>' +
        item.keyRisks.map(value => '<li>' + escapeHTML(value) + '</li>').join('') +
        '</ul></section></div><footer>Nguồn tham khảo: ' +
        item.sourceRefs.map(escapeHTML).join(' · ') + '</footer></article>'
      ).join('') + '</div>' +
      (pageItems.length < visible.length ? '<button type="button" class="pe-business-library-more" data-business-more>Xem thêm 24 mô hình</button>' : '') +
      (visible.length ? '' : '<p class="pe-business-library-empty">Không tìm thấy mô hình phù hợp.</p>');

    const search = content.querySelector('[data-business-search]');
    search.addEventListener('input', () => {
      state.query = search.value.slice(0, 120);
      state.page = 1;
      const position = search.selectionStart;
      render(content, library, state);
      const next = content.querySelector('[data-business-search]');
      next.focus();
      next.setSelectionRange(position, position);
    });
    content.querySelectorAll('[data-business-category]').forEach(button => {
      button.addEventListener('click', () => {
        state.category = button.dataset.businessCategory;
        state.page = 1;
        render(content, library, state);
      });
    });
    const more = content.querySelector('[data-business-more]');
    if (more) more.addEventListener('click', () => {
      state.page += 1;
      render(content, library, state);
    });
  }

  function mount() {
    const panel = root.document && root.document.getElementById('principia-economy-root');
    const tabs = panel && panel.querySelector('.pe-tabs');
    const content = panel && panel.querySelector('#pe-content');
    const library = root.PrincipiaInvestmentBusinessModels;
    if (!panel || !tabs || !content || !library || panel.dataset.businessLibraryReady) return false;
    if (!Array.isArray(library.MODELS) || library.MODEL_COUNT !== library.MODELS.length) return false;

    const button = root.document.createElement('button');
    button.type = 'button';
    button.dataset.businessLibraryTab = 'true';
    button.textContent = '141 mô hình đầu tư & kinh doanh';
    tabs.appendChild(button);
    panel.dataset.businessLibraryReady = 'true';
    const state = { category: 'all', query: '', page: 1 };
    button.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      render(content, library, state);
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-tab]')) button.classList.remove('active');
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

  const api = Object.freeze({ filterModels, getPage, CATEGORY_LABELS, PAGE_SIZE });
  root.PrincipiaInvestmentBusinessLibraryUI = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
