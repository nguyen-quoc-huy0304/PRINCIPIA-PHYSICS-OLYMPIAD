(function (root) {
  'use strict';

  const STORAGE_KEY = 'principia:investment-portfolio:v1';
  const MAX_TRADES = 1000;
  const MAX_POSITIONS = 200;
  const DEFAULT_FEE_RATE = 0.0015;
  const DEFAULT_SELL_TAX_RATE = 0.001;
  const ASSET_TYPES = Object.freeze([
    {id:'stocks',name:'Cổ phiếu'},{id:'etf',name:'ETF'},{id:'open-funds',name:'Quỹ mở'},
    {id:'bonds-gov',name:'Trái phiếu Chính phủ'},{id:'bonds-corp',name:'Trái phiếu doanh nghiệp'},
    {id:'deposit',name:'Tiền gửi kỳ hạn / chứng chỉ tiền gửi'},{id:'gold',name:'Vàng trong nước'},
    {id:'gold-world',name:'Vàng quốc tế'},{id:'silver',name:'Bạc'},{id:'commodities',name:'Hàng hóa'},
    {id:'crypto',name:'Tiền mã hóa'},{id:'crypto-staking',name:'Staking'},{id:'fx',name:'Ngoại tệ'},
    {id:'property',name:'Bất động sản nhà ở'},{id:'commercial-property',name:'BĐS thương mại / cho thuê'},
    {id:'reit',name:'REIT / quỹ BĐS'},{id:'business',name:'Góp vốn doanh nghiệp'},
    {id:'startup',name:'Startup / gọi vốn'},{id:'franchise',name:'Nhượng quyền'},
    {id:'agriculture',name:'Nông nghiệp / trang trại'},{id:'p2p',name:'Cho vay ngang hàng'},
    {id:'vehicles',name:'Xe / phương tiện'},{id:'collectibles',name:'Đồ sưu tầm / nghệ thuật'},
    {id:'insurance',name:'Bảo hiểm liên kết đầu tư'}
  ]);

  function finitePositive(value, label) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0 || number > 1e15) {
      throw new TypeError(label + ' phải là số dương hợp lệ.');
    }
    return number;
  }

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function cleanText(value, label, maxLength) {
    const text = String(value == null ? '' : value).trim();
    if (!text || text.length > maxLength) throw new TypeError(label + ' không hợp lệ.');
    return text;
  }

  function initialState() {
    return {version:1, positions:[], trades:[], updatedAt:null};
  }

  function sanitize(raw) {
    const base = initialState();
    if (!raw || raw.version !== 1) return base;
    const allowedTypes = new Set(ASSET_TYPES.map(item => item.id));
    const positions = Array.isArray(raw.positions) ? raw.positions.slice(0, MAX_POSITIONS) : [];
    const safePositions = positions.filter(item =>
      item && typeof item.id === 'string' && allowedTypes.has(item.assetType) &&
      typeof item.symbol === 'string' && Number.isFinite(item.quantity) && item.quantity > 0 &&
      Number.isFinite(item.averageCost) && item.averageCost >= 0
    ).map(item => ({
      id:item.id.slice(0,180), assetType:item.assetType, symbol:item.symbol.slice(0,80),
      name:String(item.name || item.symbol).slice(0,100), quantity:item.quantity,
      averageCost:item.averageCost, invested:item.quantity * item.averageCost,
      lastPrice:Number.isFinite(item.lastPrice) && item.lastPrice > 0 ? item.lastPrice : null,
      priceSource:String(item.priceSource || 'Chưa định giá').slice(0,80),
      currency:String(item.currency || 'VND').slice(0,8)
    }));
    const rawTrades = Array.isArray(raw.trades) ? raw.trades.slice(-MAX_TRADES) : [];
    const trades = rawTrades.filter(item =>
      item && ['buy','sell'].includes(item.side) && allowedTypes.has(item.assetType) &&
      typeof item.symbol === 'string' && typeof item.at === 'string' &&
      Number.isFinite(item.quantity) && item.quantity > 0 &&
      Number.isFinite(item.price) && item.price > 0 &&
      Number.isFinite(item.gross) && item.gross >= 0
    ).map(item => ({
      id:String(item.id || '').slice(0,80),side:item.side,assetType:item.assetType,
      symbol:item.symbol.slice(0,80),name:String(item.name || item.symbol).slice(0,100),
      quantity:item.quantity,price:item.price,gross:item.gross,
      fee:Number.isFinite(item.fee) ? Math.max(0,item.fee) : 0,
      tax:Number.isFinite(item.tax) ? Math.max(0,item.tax) : 0,
      costBasis:Number.isFinite(item.costBasis) ? item.costBasis : null,
      realizedPnl:Number.isFinite(item.realizedPnl) ? item.realizedPnl : null,
      currency:String(item.currency || 'VND').slice(0,8),
      priceSource:String(item.priceSource || 'Nguồn không rõ').slice(0,80),
      at:item.at.slice(0,40)
    }));
    return {version:1,positions:safePositions,trades,walletIdentity:typeof raw.walletIdentity === 'string' ? raw.walletIdentity : null,updatedAt:typeof raw.updatedAt === 'string' ? raw.updatedAt : null};
  }

  function createEngine(storage, wallet) {
    if (wallet && (typeof wallet.transact !== 'function' || typeof wallet.getBalance !== 'function')) throw new TypeError('Ví liên thông không hợp lệ.');
    const store = storage || root.localStorage;
    let state;
    try { state = sanitize(JSON.parse(store && store.getItem(STORAGE_KEY) || 'null')); }
    catch (_) { state = initialState(); }

    function persist() {
      if (!store) return;
      try { store.setItem(STORAGE_KEY, JSON.stringify(state)); }
      catch (_) { throw new Error('Không thể lưu danh mục đầu tư trên thiết bị.'); }
    }

    if (wallet) {
      const identity = wallet.type + ':' + wallet.id;
      if (state.walletIdentity && state.walletIdentity !== identity) throw new Error('Danh mục đã liên kết với ví mô phỏng khác.');
      if (!state.walletIdentity && state.positions.length) throw new Error('Danh mục có vị thế từ ví cũ; không thể tự động chuyển sang ví chung.');
      state.walletIdentity = identity;
      persist();
    }

    function snapshot() { return clone(state); }
    let walletDelta = 0;

    function transact(mutator) {
      const previous = state;
      const previousStored = store && store.getItem(STORAGE_KEY);
      const previousDelta = walletDelta;
      state = clone(state);
      walletDelta = 0;
      try {
        const result = mutator();
        state.updatedAt = new Date().toISOString();
        persist();
        if (wallet && Math.abs(walletDelta) >= 0.01) {
          wallet.transact([{kind:walletDelta < 0 ? 'debit' : 'credit',amount:Math.abs(Math.round(walletDelta * 100) / 100),description:'Giao dịch danh mục đầu tư mô phỏng'}]);
        }
        walletDelta = 0;
        return result === undefined ? snapshot() : result;
      } catch (error) {
        state = previous;
        walletDelta = previousDelta;
        if (store) {
          try { if (previousStored == null) store.removeItem(STORAGE_KEY); else store.setItem(STORAGE_KEY, previousStored); }
          catch (rollbackError) { error.rollbackError = rollbackError; }
        }
        throw error;
      }
    }

    function trade(side, input) {
      const assetType = cleanText(input.assetType, 'Loại tài sản', 40);
      if (!ASSET_TYPES.some(item => item.id === assetType)) throw new TypeError('Loại tài sản không nằm trong danh mục hỗ trợ.');
      const symbol = cleanText(input.symbol, 'Mã tài sản', 80).toUpperCase();
      const name = cleanText(input.name || input.symbol, 'Tên tài sản', 100);
      const currency = cleanText(input.currency || 'VND', 'Đơn vị tiền', 8).toUpperCase();
      if (!['VND','USD','EUR','JPY','USDT'].includes(currency)) throw new TypeError('Đơn vị tiền chưa được hỗ trợ.');
      const priceSource = cleanText(input.priceSource || 'Giá nhập thủ công · mô phỏng', 'Nguồn giá', 80);
      const quantity = finitePositive(input.quantity, 'Số lượng');
      const price = finitePositive(input.price, 'Giá mỗi đơn vị');
      const feeRate = input.feeRate == null ? DEFAULT_FEE_RATE : Number(input.feeRate);
      const taxRate = side === 'sell' ? (input.taxRate == null ? DEFAULT_SELL_TAX_RATE : Number(input.taxRate)) : 0;
      if (!Number.isFinite(feeRate) || feeRate < 0 || feeRate > 0.1 ||
          !Number.isFinite(taxRate) || taxRate < 0 || taxRate > 0.2) {
        throw new RangeError('Phí hoặc thuế giao dịch vượt giới hạn hợp lệ.');
      }
      const gross = quantity * price;
      if (!Number.isFinite(gross) || gross > 1e15) throw new RangeError('Giá trị giao dịch vượt giới hạn.');
      const fee = gross * feeRate;
      const tax = gross * taxRate;
      const key = assetType + ':' + symbol;
      return transact(() => {
        let position = state.positions.find(item => item.id === key);
        if (position && position.currency !== currency) throw new TypeError('Không thể trộn nhiều đơn vị tiền trong cùng một vị thế.');
        if (side === 'buy') {
          if (!position && state.positions.length >= MAX_POSITIONS) throw new RangeError('Danh mục đã đạt giới hạn tài sản.');
          const totalCost = gross + fee;
          if (!Number.isFinite(totalCost)) throw new RangeError('Tổng chi phí không hợp lệ.');
          if (wallet) walletDelta = Math.round((walletDelta - totalCost) * 100) / 100;
          if (!position) {
            position = {id:key,assetType,symbol,name,quantity:0,averageCost:0,invested:0,lastPrice:null,priceSource:'Chưa định giá',currency};
            state.positions.push(position);
          }
          const newQuantity = position.quantity + quantity;
          position.averageCost = (position.quantity * position.averageCost + totalCost) / newQuantity;
          position.quantity = newQuantity;
          position.invested = newQuantity * position.averageCost;
          position.name = name;
        } else {
          if (!position || position.quantity + 1e-10 < quantity) throw new RangeError('Số lượng bán vượt tài sản đang nắm giữ.');
          const proceeds = gross - fee - tax;
          if (wallet) walletDelta = Math.round((walletDelta + proceeds) * 100) / 100;
          const costBasis = position.averageCost * quantity;
          position.quantity = Math.max(0, position.quantity - quantity);
          position.invested = position.quantity * position.averageCost;
          if (position.quantity <= 1e-10) state.positions = state.positions.filter(item => item.id !== key);
          state.trades.push({id:createId(),side,assetType,symbol,name,quantity,price,gross,fee,tax,costBasis,realizedPnl:proceeds-costBasis,currency:input.currency || 'VND',priceSource,at:new Date().toISOString()});
          trimTrades();
          return snapshot();
        }
        state.trades.push({id:createId(),side,assetType,symbol,name,quantity,price,gross,fee,tax,costBasis:gross+fee,realizedPnl:null,currency:input.currency || 'VND',priceSource:cleanText(input.priceSource || 'Giá nhập thủ công · mô phỏng', 'Nguồn giá', 80),at:new Date().toISOString()});
        trimTrades();
        return snapshot();
      });
    }

    function createId() {
      return 'trade-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,9);
    }

    function trimTrades() {
      if (state.trades.length > MAX_TRADES) state.trades.splice(0, state.trades.length - MAX_TRADES);
    }

    function markPrice(assetType, symbol, price, source, currency) {
      const key = cleanText(assetType, 'Loại tài sản', 40) + ':' + cleanText(symbol, 'Mã tài sản', 80).toUpperCase();
      const value = finitePositive(price, 'Giá tham chiếu');
      const label = cleanText(source, 'Nguồn giá', 80);
      return transact(() => {
        const position = state.positions.find(item => item.id === key);
        if (!position) throw new Error('Không tìm thấy tài sản trong danh mục.');
        position.lastPrice = value;
        position.priceSource = label;
        if (currency) position.currency = cleanText(currency, 'Đơn vị tiền', 8);
        return snapshot();
      });
    }

    function getSummary() {
      const positions = state.positions.map(item => ({
        ...item, costValue:item.quantity * item.averageCost,
        marketValue:item.lastPrice == null ? null : item.quantity * item.lastPrice,
        unrealizedPnl:item.lastPrice == null ? null : item.quantity * (item.lastPrice - item.averageCost)
      }));
      const valued = positions.filter(item => item.marketValue != null && item.currency === 'VND');
      return {
        positions, trades:state.trades.slice().reverse(),
        cash:wallet ? wallet.getBalance() : null,
        investedVnd:positions.filter(item => item.currency === 'VND').reduce((sum,item) => sum + item.costValue,0),
        marketValueVnd:valued.reduce((sum,item) => sum + item.marketValue,0),
        unrealizedPnlVnd:valued.reduce((sum,item) => sum + item.unrealizedPnl,0),
        unpricedCount:positions.filter(item => item.lastPrice == null).length
      };
    }

    return Object.freeze({
      getState:snapshot, getSummary, buy:input => trade('buy',input),
      sell:input => trade('sell',input), markPrice
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function money(value, currency) {
    return new Intl.NumberFormat('vi-VN',{maximumFractionDigits:2}).format(value) + ' ' + currency;
  }

  function mountUI() {
    const panel = root.document && root.document.getElementById('principia-economy-root');
    const tabs = panel && panel.querySelector('.pe-tabs');
    const content = panel && panel.querySelector('#pe-content');
    if (!panel || !tabs || !content || panel.dataset.portfolioInstalled === 'true') return false;
    panel.dataset.portfolioInstalled = 'true';
    let engine = null;
    const button = root.document.createElement('button');
    button.type = 'button';
    button.dataset.portfolioTab = 'true';
    button.textContent = 'Danh mục đầu tư';
    tabs.appendChild(button);

    function render() {
      const summary = engine.getSummary();
      const positions = summary.positions.map(item =>
        '<article class="pe-portfolio-position"><header><b>' + escapeHTML(item.name) + ' · ' + escapeHTML(item.symbol) + '</b><small>' + escapeHTML(item.assetType) + '</small></header>' +
        '<p>' + money(item.quantity,item.currency) + ' đơn vị · Giá vốn bình quân ' + money(item.averageCost,item.currency) + '</p>' +
        '<p>' + (item.marketValue == null ? 'Chưa có giá định giá được xác minh' : 'Giá trị tham chiếu: ' + money(item.marketValue,item.currency) + ' · Lãi/lỗ chưa thực hiện: ' + money(item.unrealizedPnl,item.currency)) +
        '</p><small>Nguồn giá: ' + escapeHTML(item.priceSource) + '</small></article>'
      ).join('') || '<p class="pe-portfolio-empty">Chưa có tài sản. Ghi nhận giao dịch mua đầu tiên bên dưới.</p>';
      const trades = summary.trades.slice(0,12).map(item =>
        '<p class="pe-portfolio-trade"><span>' + escapeHTML(item.side === 'buy' ? 'Mua' : 'Bán') + ' ' + escapeHTML(item.symbol) + '<small>' + escapeHTML(item.at.slice(0,10)) + ' · ' + escapeHTML(item.priceSource) + '</small></span><b>' + money(item.gross,item.currency) + '</b></p>'
      ).join('') || '<p class="pe-portfolio-empty">Chưa có giao dịch.</p>';
      content.innerHTML =
        '<section class="pe-portfolio-disclaimer">Sổ danh mục chỉ ghi nhận giao dịch mô phỏng. Giá nhập thủ công không phải giá thị trường đã xác minh. Chỉ đánh dấu giá tham chiếu khi có nguồn và thời điểm kiểm chứng; không tự tạo giá.</section>' +
        '<section class="pe-portfolio-summary">' + (summary.cash == null ? '' : '<article><small>Ví mô phỏng liên thông</small><b>' + money(summary.cash,'VND') + '</b></article>') + '<article><small>Vốn đã phân bổ (VND)</small><b>' + money(summary.investedVnd,'VND') + '</b></article><article><small>Giá trị đã định giá (VND)</small><b>' + money(summary.marketValueVnd,'VND') + '</b></article><article><small>Tài sản chưa có giá</small><b>' + summary.unpricedCount + '</b></article></section>' +
        '<h3>Tài sản đang nắm giữ</h3>' + positions +
        '<h3>Ghi nhận giao dịch mô phỏng</h3><form class="pe-portfolio-form">' +
        '<label>Loại tài sản<select name="assetType">' + ASSET_TYPES.map(item => '<option value="' + item.id + '">' + escapeHTML(item.name) + '</option>').join('') + '</select></label>' +
        '<label>Mã / ký hiệu<input name="symbol" maxlength="80" required placeholder="VD: FPT, BTC, XAU, mã căn hộ"></label>' +
        '<label>Tên tài sản<input name="name" maxlength="100" placeholder="Tên hiển thị"></label>' +
        '<div class="pe-portfolio-fields"><label>Số lượng<input name="quantity" type="number" min="0.00000001" step="any" required></label><label>Giá mỗi đơn vị<input name="price" type="number" min="0.00000001" step="any" required></label></div>' +
        '<div class="pe-portfolio-fields"><label>Phí giao dịch (%)<input name="fee" type="number" min="0" max="10" step="0.01" value="0.15"></label><label>Thuế bán (%)<input name="tax" type="number" min="0" max="20" step="0.01" value="0.1"></label></div>' +
        '<label>Đơn vị tiền<select name="currency"><option>VND</option><option>USD</option><option>EUR</option><option>JPY</option><option>USDT</option></select></label>' +
        '<label>Nguồn giá / ghi chú<input name="source" maxlength="80" value="Giá nhập thủ công · mô phỏng"></label>' +
        '<div class="pe-portfolio-actions"><button type="button" data-portfolio-buy>Mua mô phỏng</button><button type="button" data-portfolio-sell>Bán mô phỏng</button></div></form>' +
        '<h3>Giao dịch gần đây</h3>' + trades;
      content.querySelectorAll('[data-portfolio-buy],[data-portfolio-sell]').forEach(control => {
        control.addEventListener('click', () => {
          const form = control.closest('form');
          const data = new FormData(form);
          try {
            const input = {
              assetType:data.get('assetType'),symbol:data.get('symbol'),name:data.get('name'),
              quantity:data.get('quantity'),price:data.get('price'),
              feeRate:Number(data.get('fee')) / 100,taxRate:Number(data.get('tax')) / 100,
              currency:data.get('currency'),priceSource:data.get('source')
            };
            if (control.hasAttribute('data-portfolio-buy')) engine.buy(input);
            else engine.sell(input);
            render();
          } catch (error) { root.alert(error.message); }
        });
      });
    }

    button.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach(item => item.classList.remove('active'));
      button.classList.add('active');
      try { engine = createEngine(undefined, root.PrincipiaEconomyActiveWallet || undefined); render(); }
      catch (error) { content.textContent = 'Không thể mở danh mục: ' + error.message; }
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-tab],[data-investment-universe-tab]')) button.classList.remove('active');
    }, true);
    return true;
  }

  function boot() {
    if (mountUI()) return;
    root.setTimeout(boot, 250);
  }

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {createEngine,ASSET_TYPES,STORAGE_KEY,DEFAULT_FEE_RATE,DEFAULT_SELL_TAX_RATE};
  }
  root.PrincipiaInvestmentPortfolio = Object.freeze({createEngine,ASSET_TYPES});
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded',boot,{once:true});
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
