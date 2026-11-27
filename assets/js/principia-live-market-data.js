(function (root) {
  'use strict';

  const API_BASE = String(root.PRINCIPIA_MARKET_API_BASE || '/market-api').replace(/\/$/, '');
  const STOCK_SYMBOLS = ['FPT', 'VCB', 'VNM', 'HPG', 'MWG'];
  const REFRESH_MS = 60000;
  const FX_REFRESH_MS = 3600000;
  const PROPERTY_REFRESH_MS = 300000;
  let stockTimer = null;
  let fxTimer = null;
  let propertyTimer = null;
  let active = false;
  let stockPayload = null;
  let fxPayload = null;
  let propertyPayload = null;
  let errors = {};

  function escapeHTML(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function money(value, currency) {
    const number = Number(value);
    if (!Number.isFinite(number)) return '—';
    return new Intl.NumberFormat('vi-VN', {
      maximumFractionDigits: currency === 'VND' ? 0 : 4
    }).format(number) + ' ' + currency;
  }

  async function getJSON(path) {
    const response = await fetch(API_BASE + path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'omit',
      cache: 'no-store',
      signal: typeof AbortSignal.timeout === 'function' ? AbortSignal.timeout(10000) : undefined
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || ('HTTP ' + response.status));
    }
    return response.json();
  }

  function formatTime(value) {
    if (!value) return 'Chưa có dấu thời gian từ nguồn';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? escapeHTML(value) :
      new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'medium' }).format(date);
  }

  function render(panel) {
    const content = panel.querySelector('#pe-content');
    if (!content || !active) return;
    const stocks = stockPayload && Array.isArray(stockPayload.data) ? stockPayload.data : [];
    const fx = fxPayload && fxPayload.rates ? fxPayload.rates : {};
    const listings = propertyPayload && Array.isArray(propertyPayload.data) ?
      propertyPayload.data : (propertyPayload && Array.isArray(propertyPayload.listings) ? propertyPayload.listings : []);
    const stockHTML = stocks.length ? stocks.slice(-30).reverse().map(item => {
      const symbol = item.Symbol || item.symbol || item.Code || '—';
      const price = item.Close || item.close || item.Price || item.price;
      const time = item.Time || item.time || item.TradingDate || '';
      return '<article class="pe-live-row"><b>' + escapeHTML(symbol) + '</b><span>' +
        escapeHTML(price == null ? '—' : price) + '</span><small>' + escapeHTML(time) + '</small></article>';
    }).join('') : '<p class="pe-live-empty">' +
      escapeHTML(errors.stocks || 'Chưa có dữ liệu cổ phiếu từ nhà cung cấp.') + '</p>';
    const fxHTML = Object.keys(fx).length ? ['VND', 'EUR', 'JPY', 'CNY', 'GBP'].map(code => {
      return fx[code] == null ? '' : '<article class="pe-live-row"><b>' + code +
        '</b><span>' + money(fx[code], code) + '</span></article>';
    }).join('') : '<p class="pe-live-empty">' + escapeHTML(errors.fx || 'Chưa có tỷ giá.') + '</p>';
    const listingHTML = listings.length ? listings.slice(0, 12).map(item => {
      const title = item.title || item.name || item.listing_title || 'Tin bất động sản';
      const price = item.price_vnd || item.price || item.priceVnd;
      const area = item.area_m2 || item.area;
      const location = [item.ward, item.district, item.province].filter(Boolean).join(', ');
      return '<article class="pe-live-listing"><b>' + escapeHTML(title) + '</b><strong>' +
        escapeHTML(price ? money(price, 'VND') : 'Liên hệ') + '</strong><small>' +
        escapeHTML([area ? area + ' m²' : '', location].filter(Boolean).join(' · ')) +
        '</small></article>';
    }).join('') : '<p class="pe-live-empty">' +
      escapeHTML(errors.realEstate || 'Chưa có tin đăng từ nhà cung cấp.') + '</p>';
    content.innerHTML = '<section class="pe-live-disclaimer">Dữ liệu từ nhà cung cấp bên ngoài. Giá chứng khoán chỉ cập nhật khi thị trường và API có dữ liệu; tỷ giá là giá tham chiếu cập nhật định kỳ; BĐS là giá rao bán, không phải giá giao dịch đã xác minh.</section>' +
      '<h3>Chứng khoán Việt Nam · dữ liệu trong phiên</h3><small class="pe-live-source">' +
      escapeHTML(stockPayload ? stockPayload.provider + ' · lấy lúc ' + formatTime(stockPayload.fetchedAt) : 'SSI FastConnect · chưa kết nối') +
      '</small>' + stockHTML + '<h3>Tỷ giá ngoại tệ</h3><small class="pe-live-source">' +
      escapeHTML(fxPayload ? fxPayload.provider + ' · nguồn cập nhật ' + formatTime(fxPayload.providerUpdatedAt) : 'Frankfurter · chưa kết nối') +
      '</small><div class="pe-live-grid">' + fxHTML + '</div><h3>Bất động sản · tin đăng mới</h3><small class="pe-live-source">' +
      escapeHTML(propertyPayload ? 'BDS Chat · lấy lúc ' + formatTime(propertyPayload.fetchedAt) : 'BDS Chat · chưa kết nối') +
      '</small>' + listingHTML + '<button type="button" class="pe-action" data-live-refresh>↻ Cập nhật ngay</button>';
    content.querySelector('[data-live-refresh]').addEventListener('click', () => refreshAll(panel));
  }

  async function refreshStocks(panel) {
    try {
      stockPayload = await getJSON('/v1/market/stocks?symbols=' + encodeURIComponent(STOCK_SYMBOLS.join(',')));
      errors.stocks = '';
    } catch (error) { errors.stocks = error.message; }
    render(panel);
  }

  async function refreshFX(panel) {
    try {
      fxPayload = await getJSON('/v1/market/fx?base=USD');
      errors.fx = '';
    } catch (error) { errors.fx = error.message; }
    render(panel);
  }

  async function refreshProperties(panel) {
    try {
      propertyPayload = await getJSON('/v1/market/real-estate?limit=12');
      errors.realEstate = '';
    } catch (error) { errors.realEstate = error.message; }
    render(panel);
  }

  async function refreshAll(panel) {
    await Promise.all([refreshStocks(panel), refreshFX(panel), refreshProperties(panel)]);
  }

  function stop() {
    active = false;
    if (stockTimer) root.clearInterval(stockTimer);
    if (fxTimer) root.clearInterval(fxTimer);
    if (propertyTimer) root.clearInterval(propertyTimer);
    stockTimer = null;
    fxTimer = null;
    propertyTimer = null;
  }

  function start(panel) {
    stop();
    active = true;
    refreshAll(panel);
    stockTimer = root.setInterval(() => refreshStocks(panel), REFRESH_MS);
    fxTimer = root.setInterval(() => refreshFX(panel), FX_REFRESH_MS);
    propertyTimer = root.setInterval(() => refreshProperties(panel), PROPERTY_REFRESH_MS);
  }

  function install() {
    const panel = root.document && root.document.getElementById('principia-economy-root');
    if (!panel || panel.dataset.liveMarketInstalled === 'true') return false;
    const tabs = panel.querySelector('.pe-tabs');
    if (!tabs) return false;
    panel.dataset.liveMarketInstalled = 'true';
    const button = root.document.createElement('button');
    button.type = 'button';
    button.dataset.tab = 'live-market';
    button.textContent = 'Dữ liệu thực';
    tabs.appendChild(button);
    const observer = new MutationObserver(() => {
      const isOpen = !panel.hidden;
      const selected = panel.querySelector('[data-tab="live-market"]');
      const isSelected = selected && selected.classList.contains('active');
      if (isOpen && isSelected && !active) start(panel);
      else if ((!isOpen || !isSelected) && active) stop();
    });
    observer.observe(panel, { attributes: true, attributeFilter: ['hidden'], subtree: true, childList: true });
    button.addEventListener('click', () => {
      tabs.querySelectorAll('[data-tab]').forEach(item => item.classList.toggle('active', item === button));
      active = true;
      start(panel);
    });
    return true;
  }

  function boot() {
    if (install()) return;
    root.setTimeout(boot, 250);
  }

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(window);
