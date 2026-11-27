(function (root) {
  'use strict';

  const ITEMS = Object.freeze([
    {id:'stocks',group:'Thị trường vốn',name:'Cổ phiếu niêm yết',detail:'Cổ phiếu HOSE, HNX, UPCoM; cổ tức, quyền mua, chia tách và phí giao dịch.',risk:'Cao',liquidity:'Theo phiên',source:'SSI FastConnect · cần thông tin xác thực nhà cung cấp',live:false},
    {id:'etf',group:'Thị trường vốn',name:'ETF / Quỹ hoán đổi danh mục',detail:'ETF mô phỏng VN30, VN100, ngành và chỉ số quốc tế; NAV, tracking error, phí quản lý.',risk:'Trung bình–cao',liquidity:'Theo phiên',source:'Sở giao dịch / công ty quản lý quỹ',live:false},
    {id:'open-funds',group:'Thị trường vốn',name:'Quỹ mở cổ phiếu và trái phiếu',detail:'Mua chứng chỉ quỹ theo NAV, ngày giao dịch, phí mua/bán và thời gian thanh toán.',risk:'Thấp–cao',liquidity:'Theo kỳ giao dịch',source:'Công ty quản lý quỹ',live:false},
    {id:'bonds-gov',group:'Trái phiếu & thu nhập cố định',name:'Trái phiếu Chính phủ',detail:'Mệnh giá, coupon, lợi suất đến ngày đáo hạn, lịch trả lãi và rủi ro lãi suất.',risk:'Thấp–trung bình',liquidity:'Tùy mã',source:'HNX / Kho bạc Nhà nước',live:false},
    {id:'bonds-corp',group:'Trái phiếu & thu nhập cố định',name:'Trái phiếu doanh nghiệp',detail:'Coupon, tài sản bảo đảm, xếp hạng tín nhiệm, điều khoản mua lại và rủi ro vỡ nợ.',risk:'Trung bình–rất cao',liquidity:'Có thể thấp',source:'HNX / tổ chức phát hành',live:false},
    {id:'deposit',group:'Trái phiếu & thu nhập cố định',name:'Tiền gửi có kỳ hạn / chứng chỉ tiền gửi',detail:'Lãi suất theo ngân hàng, kỳ hạn, tất toán trước hạn và bảo hiểm tiền gửi theo quy định.',risk:'Thấp',liquidity:'Theo kỳ hạn',source:'Ngân hàng công bố',live:false},
    {id:'gold',group:'Kim loại quý & hàng hóa',name:'Vàng miếng SJC và vàng nhẫn',detail:'Giá mua/bán trong nước, chênh lệch hai chiều, phí và chênh lệch với giá thế giới.',risk:'Trung bình–cao',liquidity:'Theo cửa hàng',source:'Nhà vàng / SJC',live:false},
    {id:'gold-world',group:'Kim loại quý & hàng hóa',name:'Vàng giao ngay quốc tế',detail:'XAU/USD, giá bid/ask, quy đổi VND và chênh lệch tỷ giá.',risk:'Trung bình–cao',liquidity:'Gần 24/5',source:'Nhà cung cấp dữ liệu hàng hóa',live:false},
    {id:'silver',group:'Kim loại quý & hàng hóa',name:'Bạc',detail:'Bạc vật chất và giá bạc quốc tế XAG/USD.',risk:'Cao',liquidity:'Tùy sản phẩm',source:'Nhà cung cấp dữ liệu hàng hóa',live:false},
    {id:'commodities',group:'Kim loại quý & hàng hóa',name:'Hàng hóa phái sinh',detail:'Dầu thô, khí tự nhiên, cà phê, đường, cao su, lúa mì và kim loại công nghiệp.',risk:'Rất cao',liquidity:'Theo hợp đồng',source:'Sở giao dịch hàng hóa / CME',live:false},
    {id:'crypto',group:'Tài sản số',name:'Tiền mã hóa giao ngay',detail:'BTC, ETH và tài sản số khác; phí sàn, spread, biến động và rủi ro lưu ký.',risk:'Rất cao',liquidity:'24/7',source:'CoinGecko / sàn giao dịch',live:false},
    {id:'crypto-staking',group:'Tài sản số',name:'Staking / lợi suất tài sản số',detail:'Phần thưởng staking, thời gian khóa, slashing, rủi ro smart contract và nền tảng.',risk:'Rất cao',liquidity:'Có thể bị khóa',source:'Mạng blockchain / nền tảng',live:false},
    {id:'fx',group:'Tài sản số',name:'Ngoại tệ',detail:'USD, EUR, JPY, GBP, CNY; tỷ giá tham chiếu, tỷ giá ngân hàng và spread.',risk:'Trung bình–cao',liquidity:'Theo thị trường',source:'Frankfurter / ngân hàng',live:true},
    {id:'property',group:'Bất động sản & tài sản thực',name:'Nhà ở, căn hộ, đất nền',detail:'Giá chào bán và giá giao dịch, pháp lý, quy hoạch, thuế, phí sang tên và thanh khoản.',risk:'Trung bình–cao',liquidity:'Thấp',source:'Cổng tin đăng / dữ liệu giao dịch · chưa có feed đã xác minh',live:false},
    {id:'commercial-property',group:'Bất động sản & tài sản thực',name:'Bất động sản cho thuê / thương mại',detail:'Nhà phố, mặt bằng, văn phòng, kho xưởng; tỷ suất cho thuê ròng và tỷ lệ trống.',risk:'Trung bình–cao',liquidity:'Thấp',source:'Dữ liệu tin đăng và cho thuê',live:false},
    {id:'reit',group:'Bất động sản & tài sản thực',name:'Quỹ / cổ phiếu bất động sản',detail:'REIT quốc tế, doanh nghiệp bất động sản và quỹ đầu tư bất động sản.',risk:'Trung bình–cao',liquidity:'Theo phiên',source:'Sở giao dịch',live:false},
    {id:'business',group:'Kinh doanh & vốn tư nhân',name:'Góp vốn doanh nghiệp tư nhân',detail:'Mua phần vốn, chia lợi nhuận, định giá doanh nghiệp, pha loãng và quyền biểu quyết.',risk:'Rất cao',liquidity:'Rất thấp',source:'Báo cáo doanh nghiệp / hợp đồng',live:false},
    {id:'startup',group:'Kinh doanh & vốn tư nhân',name:'Đầu tư startup / gọi vốn cộng đồng',detail:'Vòng seed đến growth, định giá, tỷ lệ sở hữu, pha loãng và rủi ro mất toàn bộ vốn.',risk:'Rất cao',liquidity:'Rất thấp',source:'Hồ sơ gọi vốn / nền tảng được cấp phép',live:false},
    {id:'franchise',group:'Kinh doanh & vốn tư nhân',name:'Nhượng quyền thương hiệu',detail:'Phí nhượng quyền, tiền thuê, nhân sự, hàng tồn, doanh thu hòa vốn và royalty.',risk:'Cao',liquidity:'Thấp',source:'Hợp đồng nhượng quyền / báo cáo kinh doanh',live:false},
    {id:'agriculture',group:'Kinh doanh & vốn tư nhân',name:'Nông nghiệp / trang trại',detail:'Đất, giống, phân bón, nhân công, chu kỳ mùa vụ, sản lượng và giá đầu ra.',risk:'Cao',liquidity:'Theo mùa vụ',source:'Giá nông sản / dữ liệu địa phương',live:false},
    {id:'p2p',group:'Kinh doanh & vốn tư nhân',name:'Cho vay ngang hàng',detail:'Khoản vay, kỳ hạn, lãi thực nhận, nợ quá hạn, vỡ nợ và thu hồi vốn.',risk:'Rất cao',liquidity:'Thấp',source:'Nền tảng và hồ sơ khoản vay',live:false},
    {id:'vehicles',group:'Tài sản thực & sưu tầm',name:'Xe và phương tiện cho thuê',detail:'Khấu hao, bảo hiểm, bảo dưỡng, chi phí vận hành và doanh thu cho thuê.',risk:'Trung bình–cao',liquidity:'Trung bình',source:'Dữ liệu thị trường xe cũ',live:false},
    {id:'collectibles',group:'Tài sản thực & sưu tầm',name:'Đồ sưu tầm / nghệ thuật',detail:'Đồng hồ, tranh, đồ cổ, rượu sưu tầm; xác thực, bảo quản, phí đấu giá và thanh khoản.',risk:'Rất cao',liquidity:'Rất thấp',source:'Nhà đấu giá / giao dịch xác thực',live:false},
    {id:'insurance',group:'Tài chính cá nhân',name:'Bảo hiểm liên kết đầu tư',detail:'Phí bảo hiểm, phí quản lý, giá trị tài khoản, quyền lợi bảo vệ và rủi ro thị trường.',risk:'Trung bình–cao',liquidity:'Theo hợp đồng',source:'Doanh nghiệp bảo hiểm',live:false}
  ]);

  const GROUPS = [...new Set(ITEMS.map(item => item.group))];
  let activeGroup = 'Tất cả';
  let searchText = '';

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  }

  function render(content) {
    const query = searchText.trim().toLocaleLowerCase('vi');
    const visible = ITEMS.filter(item =>
      (activeGroup === 'Tất cả' || item.group === activeGroup) &&
      (!query || [item.name,item.group,item.detail,item.source].join(' ').toLocaleLowerCase('vi').includes(query))
    );
    const groups = ['Tất cả', ...GROUPS];
    content.innerHTML =
      '<section class="pe-universe-intro"><b>Danh mục đầu tư đa tài sản</b><p>Danh mục bao quát các kênh đầu tư phổ biến. Chỉ tài sản có nguồn dữ liệu và thời điểm cập nhật hợp lệ mới được phép định giá giao dịch trong mô phỏng. Không tự sinh giá thị trường.</p></section>' +
      '<label class="pe-universe-search">Tìm kênh đầu tư<input type="search" id="pe-universe-search" placeholder="Ví dụ: vàng, trái phiếu, ETF..." value="' + escapeHTML(searchText) + '"></label>' +
      '<div class="pe-universe-filters">' + groups.map(group => '<button type="button" data-invest-group="' + escapeHTML(group) + '" class="' + (group === activeGroup ? 'active' : '') + '">' + escapeHTML(group) + '</button>').join('') + '</div>' +
      '<p class="pe-universe-count">Hiển thị ' + visible.length + '/' + ITEMS.length + ' kênh đầu tư</p>' +
      visible.map(item => '<article class="pe-universe-card"><header><b>' + escapeHTML(item.name) + '</b><span>' + escapeHTML(item.risk) + '</span></header><small>' + escapeHTML(item.group) + ' · Thanh khoản: ' + escapeHTML(item.liquidity) + '</small><p>' + escapeHTML(item.detail) + '</p><footer><span>Nguồn dự kiến: ' + escapeHTML(item.source) + '</span><strong class="' + (item.live ? 'pe-universe-connected' : 'pe-universe-pending') + '">' + (item.live ? 'Có bộ kết nối nguồn' : 'Chưa kết nối nguồn giá') + '</strong></footer></article>').join('') ||
      '<p class="pe-live-empty">Không tìm thấy kênh đầu tư phù hợp.</p>';
    const input = content.querySelector('#pe-universe-search');
    input.addEventListener('input', () => { searchText = input.value; const position = input.selectionStart; render(content); const next = content.querySelector('#pe-universe-search'); next.focus(); next.setSelectionRange(position, position); });
    content.querySelectorAll('[data-invest-group]').forEach(button => button.addEventListener('click', () => { activeGroup = button.dataset.investGroup; render(content); }));
  }

  function install() {
    const panel = root.document.getElementById('principia-economy-root');
    const tabs = panel && panel.querySelector('.pe-tabs');
    const content = panel && panel.querySelector('#pe-content');
    if (!panel || !tabs || !content || panel.dataset.investmentUniverseInstalled === 'true') return false;
    panel.dataset.investmentUniverseInstalled = 'true';
    const button = root.document.createElement('button');
    button.type = 'button';
    button.dataset.investmentUniverseTab = 'true';
    button.textContent = 'Đầu tư đa tài sản';
    tabs.appendChild(button);
    button.addEventListener('click', event => {
      event.preventDefault();
      event.stopPropagation();
      tabs.querySelectorAll('[data-tab]').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      render(content);
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('[data-tab]')) button.classList.remove('active');
    }, true);
    return true;
  }

  function boot() {
    if (install()) return;
    root.setTimeout(boot, 200);
  }

  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, {once:true});
    else boot();
  }
  root.PrincipiaInvestmentUniverse = Object.freeze({items: ITEMS});
})(window);
