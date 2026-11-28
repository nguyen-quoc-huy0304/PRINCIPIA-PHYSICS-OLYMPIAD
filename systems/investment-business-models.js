"use strict";

/**
 * PRINCIPIA Investment & Business Model Library.
 * Research-backed taxonomy, not financial advice or a recommendation to invest.
 * Categories are overlapping lenses: strategy, asset class, valuation,
 * revenue design, operating design, and funding structure are distinct.
 */
const MODELS = Object.freeze([
  {
    "id": "investment_strategy.value_investing",
    "category": "investment_strategy",
    "name": "Đầu tư giá trị",
    "description": "Mua tài sản khi giá thị trường thấp hơn ước tính giá trị nội tại.",
    "evaluationMetrics": [
      "Margin of safety",
      "intrinsic value",
      "P/E",
      "P/B"
    ],
    "keyRisks": [
      "Value trap",
      "sai lệch định giá"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.growth_investing",
    "category": "investment_strategy",
    "name": "Đầu tư tăng trưởng",
    "description": "Ưu tiên doanh nghiệp có doanh thu, lợi nhuận hoặc dòng tiền tăng trưởng cao.",
    "evaluationMetrics": [
      "Revenue CAGR",
      "EPS growth",
      "ROIC"
    ],
    "keyRisks": [
      "Định giá cao",
      "tăng trưởng không bền"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.income_investing",
    "category": "investment_strategy",
    "name": "Đầu tư tạo thu nhập",
    "description": "Tập trung cổ tức, coupon, tiền thuê hoặc dòng tiền định kỳ.",
    "evaluationMetrics": [
      "Dividend yield",
      "payout ratio",
      "coverage"
    ],
    "keyRisks": [
      "Cắt giảm cổ tức",
      "rủi ro tín dụng"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.dividend_growth",
    "category": "investment_strategy",
    "name": "Tăng trưởng cổ tức",
    "description": "Chọn doanh nghiệp có lịch sử và năng lực tăng cổ tức dài hạn.",
    "evaluationMetrics": [
      "Dividend CAGR",
      "FCF payout"
    ],
    "keyRisks": [
      "Yield trap",
      "chu kỳ ngành"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.quality_investing",
    "category": "investment_strategy",
    "name": "Đầu tư chất lượng",
    "description": "Chọn doanh nghiệp có lợi nhuận, bảng cân đối và quản trị tốt.",
    "evaluationMetrics": [
      "ROIC",
      "ROE",
      "leverage",
      "margins"
    ],
    "keyRisks": [
      "Trả giá quá cao"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.momentum_investing",
    "category": "investment_strategy",
    "name": "Đầu tư động lượng",
    "description": "Mua tài sản có xu hướng giá mạnh và bán tài sản yếu theo quy tắc.",
    "evaluationMetrics": [
      "Relative strength",
      "trend",
      "turnover"
    ],
    "keyRisks": [
      "Đảo chiều nhanh",
      "whipsaw"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.contrarian_investing",
    "category": "investment_strategy",
    "name": "Đầu tư ngược xu hướng",
    "description": "Đi ngược tâm lý đám đông khi dữ liệu cho thấy định giá hoặc kỳ vọng lệch lạc.",
    "evaluationMetrics": [
      "Valuation spread",
      "sentiment"
    ],
    "keyRisks": [
      "Bắt dao rơi",
      "sai thời điểm"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.index_investing",
    "category": "investment_strategy",
    "name": "Đầu tư chỉ số",
    "description": "Nắm danh mục mô phỏng một chỉ số thị trường.",
    "evaluationMetrics": [
      "Tracking error",
      "expense ratio"
    ],
    "keyRisks": [
      "Rủi ro thị trường",
      "tập trung chỉ số"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.passive_investing",
    "category": "investment_strategy",
    "name": "Đầu tư thụ động",
    "description": "Duy trì phân bổ dài hạn, hạn chế giao dịch và dự báo ngắn hạn.",
    "evaluationMetrics": [
      "Costs",
      "tracking difference"
    ],
    "keyRisks": [
      "Không tránh được thị trường giảm"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.active_investing",
    "category": "investment_strategy",
    "name": "Đầu tư chủ động",
    "description": "Chọn tài sản hoặc thời điểm nhằm vượt chuẩn tham chiếu.",
    "evaluationMetrics": [
      "Alpha",
      "information ratio"
    ],
    "keyRisks": [
      "Phí cao",
      "underperformance"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.top_down",
    "category": "investment_strategy",
    "name": "Phân tích từ vĩ mô xuống",
    "description": "Chọn quốc gia, ngành và tài sản dựa trên chu kỳ và chính sách kinh tế.",
    "evaluationMetrics": [
      "GDP",
      "rates",
      "inflation",
      "sector breadth"
    ],
    "keyRisks": [
      "Dự báo vĩ mô sai"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.bottom_up",
    "category": "investment_strategy",
    "name": "Phân tích từ doanh nghiệp lên",
    "description": "Phân tích từng công ty, lợi thế cạnh tranh và dòng tiền.",
    "evaluationMetrics": [
      "Unit economics",
      "moat",
      "DCF"
    ],
    "keyRisks": [
      "Bỏ qua rủi ro hệ thống"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.factor_investing",
    "category": "investment_strategy",
    "name": "Đầu tư nhân tố",
    "description": "Phân bổ theo yếu tố như value, size, quality, momentum, low volatility.",
    "evaluationMetrics": [
      "Factor exposure",
      "factor premium"
    ],
    "keyRisks": [
      "Factor crowding",
      "chu kỳ dài"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.low_volatility",
    "category": "investment_strategy",
    "name": "Chiến lược biến động thấp",
    "description": "Ưu tiên tài sản có biến động hoặc beta thấp hơn thị trường.",
    "evaluationMetrics": [
      "Beta",
      "volatility",
      "downside deviation"
    ],
    "keyRisks": [
      "Lệch ngành",
      "tụt hậu lúc tăng mạnh"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.small_cap_investing",
    "category": "investment_strategy",
    "name": "Đầu tư vốn hóa nhỏ",
    "description": "Tìm doanh nghiệp nhỏ có tiềm năng tăng trưởng hoặc định giá hấp dẫn.",
    "evaluationMetrics": [
      "Market cap",
      "liquidity",
      "growth"
    ],
    "keyRisks": [
      "Thanh khoản thấp",
      "quản trị yếu"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.thematic_investing",
    "category": "investment_strategy",
    "name": "Đầu tư theo chủ đề",
    "description": "Đầu tư theo xu hướng dài hạn như AI, năng lượng, già hóa dân số.",
    "evaluationMetrics": [
      "Theme exposure",
      "revenue purity"
    ],
    "keyRisks": [
      "Định giá theo trào lưu"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.sector_rotation",
    "category": "investment_strategy",
    "name": "Luân chuyển ngành",
    "description": "Thay đổi tỷ trọng ngành theo chu kỳ kinh tế hoặc tín hiệu định lượng.",
    "evaluationMetrics": [
      "Relative sector return",
      "cycle indicators"
    ],
    "keyRisks": [
      "Sai chu kỳ",
      "turnover"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.global_macro",
    "category": "investment_strategy",
    "name": "Chiến lược vĩ mô toàn cầu",
    "description": "Đặt cược theo lãi suất, tiền tệ, hàng hóa và chính sách giữa các quốc gia.",
    "evaluationMetrics": [
      "Rates",
      "FX",
      "macro scenario PnL"
    ],
    "keyRisks": [
      "Đòn bẩy",
      "tương quan thay đổi"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.long_short_equity",
    "category": "investment_strategy",
    "name": "Cổ phiếu mua-bán hai chiều",
    "description": "Mua vị thế kỳ vọng tăng và bán khống vị thế kỳ vọng giảm.",
    "evaluationMetrics": [
      "Net/gross exposure",
      "beta",
      "borrow cost"
    ],
    "keyRisks": [
      "Short squeeze",
      "borrow recall"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.market_neutral",
    "category": "investment_strategy",
    "name": "Trung lập thị trường",
    "description": "Cân bằng rủi ro thị trường giữa các vị thế mua và bán.",
    "evaluationMetrics": [
      "Beta neutrality",
      "residual alpha"
    ],
    "keyRisks": [
      "Tương quan vỡ",
      "phí giao dịch"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.pairs_trading",
    "category": "investment_strategy",
    "name": "Giao dịch cặp",
    "description": "Giao dịch chênh lệch giữa hai tài sản có quan hệ thống kê ổn định.",
    "evaluationMetrics": [
      "Spread z-score",
      "cointegration"
    ],
    "keyRisks": [
      "Quan hệ lịch sử đứt gãy"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.statistical_arbitrage",
    "category": "investment_strategy",
    "name": "Chênh lệch thống kê",
    "description": "Khai thác sai lệch định giá ngắn hạn bằng mô hình thống kê.",
    "evaluationMetrics": [
      "Signal decay",
      "Sharpe",
      "turnover"
    ],
    "keyRisks": [
      "Overfit",
      "chi phí giao dịch"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.event_driven",
    "category": "investment_strategy",
    "name": "Đầu tư theo sự kiện",
    "description": "Khai thác biến động quanh sáp nhập, chia tách, tái cấu trúc hoặc phá sản.",
    "evaluationMetrics": [
      "Deal spread",
      "event probability"
    ],
    "keyRisks": [
      "Thương vụ thất bại"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.merger_arbitrage",
    "category": "investment_strategy",
    "name": "Chênh lệch sáp nhập",
    "description": "Mua/bán chứng khoán liên quan đến thương vụ M&A để hưởng chênh lệch hoàn tất.",
    "evaluationMetrics": [
      "Deal spread",
      "break risk"
    ],
    "keyRisks": [
      "Bị cơ quan quản lý chặn"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.activist_investing",
    "category": "investment_strategy",
    "name": "Đầu tư chủ động cổ đông",
    "description": "Mua cổ phần đủ ảnh hưởng để thúc đẩy thay đổi quản trị hoặc chiến lược.",
    "evaluationMetrics": [
      "Voting rights",
      "catalysts",
      "valuation gap"
    ],
    "keyRisks": [
      "Xung đột",
      "chi phí vận động"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.distressed_investing",
    "category": "investment_strategy",
    "name": "Đầu tư tài sản khó khăn",
    "description": "Đầu tư nợ hoặc vốn của tổ chức gặp khủng hoảng/tái cơ cấu.",
    "evaluationMetrics": [
      "Recovery value",
      "seniority",
      "coverage"
    ],
    "keyRisks": [
      "Mất vốn",
      "quy trình pháp lý"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.arbitrage",
    "category": "investment_strategy",
    "name": "Kinh doanh chênh lệch giá",
    "description": "Khai thác chênh lệch giá của cùng tài sản hoặc tài sản liên quan.",
    "evaluationMetrics": [
      "Spread after costs",
      "execution risk"
    ],
    "keyRisks": [
      "Rủi ro thực thi",
      "funding"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.carry_trade",
    "category": "investment_strategy",
    "name": "Giao dịch hưởng chênh lệch lợi suất",
    "description": "Nắm tài sản lợi suất cao và tài trợ bằng đồng tiền/lãi suất thấp.",
    "evaluationMetrics": [
      "Carry",
      "FX volatility",
      "funding cost"
    ],
    "keyRisks": [
      "Đảo chiều tỷ giá"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.risk_parity",
    "category": "investment_strategy",
    "name": "Phân bổ cân bằng rủi ro",
    "description": "Phân bổ vốn để các nhóm tài sản đóng góp rủi ro tương đương.",
    "evaluationMetrics": [
      "Risk contribution",
      "leverage"
    ],
    "keyRisks": [
      "Tăng đòn bẩy",
      "tương quan đồng biến"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "investment_strategy.trend_following",
    "category": "investment_strategy",
    "name": "Theo xu hướng",
    "description": "Dùng quy tắc xu hướng để nắm vị thế khi giá tăng/giảm kéo dài.",
    "evaluationMetrics": [
      "Moving averages",
      "breakout",
      "drawdown"
    ],
    "keyRisks": [
      "Thị trường đi ngang"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.public_equity",
    "category": "asset_classes",
    "name": "Cổ phiếu niêm yết",
    "description": "Sở hữu một phần doanh nghiệp niêm yết; lợi nhuận từ tăng giá và cổ tức.",
    "evaluationMetrics": [
      "Total return",
      "volatility",
      "liquidity"
    ],
    "keyRisks": [
      "Rủi ro doanh nghiệp và thị trường"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.government_bonds",
    "category": "asset_classes",
    "name": "Trái phiếu chính phủ",
    "description": "Cho chính phủ vay theo kỳ hạn và điều khoản coupon.",
    "evaluationMetrics": [
      "Yield",
      "duration",
      "credit rating"
    ],
    "keyRisks": [
      "Lãi suất",
      "lạm phát",
      "chủ quyền"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.corporate_bonds",
    "category": "asset_classes",
    "name": "Trái phiếu doanh nghiệp",
    "description": "Cho doanh nghiệp vay; lợi suất phản ánh lãi suất và rủi ro tín dụng.",
    "evaluationMetrics": [
      "YTM",
      "spread",
      "coverage"
    ],
    "keyRisks": [
      "Vỡ nợ",
      "thanh khoản"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.money_market",
    "category": "asset_classes",
    "name": "Công cụ thị trường tiền tệ",
    "description": "Công cụ nợ ngắn hạn có kỳ hạn và rủi ro thường thấp hơn cổ phiếu.",
    "evaluationMetrics": [
      "Yield",
      "maturity",
      "credit quality"
    ],
    "keyRisks": [
      "Tái đầu tư",
      "tín dụng"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.mutual_funds",
    "category": "asset_classes",
    "name": "Quỹ tương hỗ",
    "description": "Góp vốn vào danh mục được quản lý theo bản cáo bạch.",
    "evaluationMetrics": [
      "NAV",
      "expense ratio",
      "tracking"
    ],
    "keyRisks": [
      "Phí",
      "thanh khoản theo điều lệ"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.etfs",
    "category": "asset_classes",
    "name": "Quỹ ETF",
    "description": "Quỹ giao dịch trên sàn, thường mô phỏng chỉ số hoặc chiến lược.",
    "evaluationMetrics": [
      "Tracking error",
      "spread",
      "AUM"
    ],
    "keyRisks": [
      "Sai lệch giá/NAV",
      "thanh khoản"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.private_equity",
    "category": "asset_classes",
    "name": "Vốn cổ phần tư nhân",
    "description": "Đầu tư vốn vào công ty chưa niêm yết, thường qua quỹ hoặc giao dịch trực tiếp.",
    "evaluationMetrics": [
      "IRR",
      "MOIC",
      "DPI"
    ],
    "keyRisks": [
      "Illiquidity",
      "định giá",
      "đòn bẩy"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.venture_capital",
    "category": "asset_classes",
    "name": "Vốn đầu tư mạo hiểm",
    "description": "Đầu tư doanh nghiệp khởi nghiệp tăng trưởng cao qua nhiều vòng vốn.",
    "evaluationMetrics": [
      "Ownership",
      "dilution",
      "runway",
      "exit multiple"
    ],
    "keyRisks": [
      "Tỷ lệ thất bại cao"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.angel_investing",
    "category": "asset_classes",
    "name": "Đầu tư thiên thần",
    "description": "Cá nhân đầu tư sớm vào startup, thường đổi lấy cổ phần hoặc công cụ chuyển đổi.",
    "evaluationMetrics": [
      "Valuation cap",
      "dilution",
      "portfolio outcomes"
    ],
    "keyRisks": [
      "Mất toàn bộ vốn",
      "thiếu thanh khoản"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.real_estate",
    "category": "asset_classes",
    "name": "Bất động sản trực tiếp",
    "description": "Mua đất/nhà/tòa nhà để cho thuê, vận hành hoặc bán lại.",
    "evaluationMetrics": [
      "Cap rate",
      "NOI",
      "cash-on-cash"
    ],
    "keyRisks": [
      "Đòn bẩy",
      "pháp lý",
      "chu kỳ"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.reit",
    "category": "asset_classes",
    "name": "Quỹ tín thác đầu tư bất động sản",
    "description": "Sở hữu hoặc tài trợ bất động sản tạo thu nhập và phân phối theo quy định.",
    "evaluationMetrics": [
      "FFO",
      "NAV",
      "occupancy",
      "leverage"
    ],
    "keyRisks": [
      "Lãi suất",
      "nợ",
      "tập trung tài sản"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.infrastructure",
    "category": "asset_classes",
    "name": "Hạ tầng",
    "description": "Đầu tư tài sản thiết yếu như điện, nước, giao thông và viễn thông.",
    "evaluationMetrics": [
      "Project IRR",
      "availability",
      "cash yield"
    ],
    "keyRisks": [
      "Pháp lý",
      "xây dựng",
      "chính sách"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.commodities",
    "category": "asset_classes",
    "name": "Hàng hóa",
    "description": "Tiếp xúc với năng lượng, kim loại hoặc nông sản qua hợp đồng hay quỹ.",
    "evaluationMetrics": [
      "Spot/futures curve",
      "roll yield"
    ],
    "keyRisks": [
      "Biến động cung cầu",
      "lưu kho"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.precious_metals",
    "category": "asset_classes",
    "name": "Kim loại quý",
    "description": "Nắm vàng/bạc hoặc công cụ liên quan như tài sản đa dạng hóa.",
    "evaluationMetrics": [
      "Real rates",
      "spread",
      "custody cost"
    ],
    "keyRisks": [
      "Không tạo dòng tiền",
      "biến động"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.agriculture_land",
    "category": "asset_classes",
    "name": "Đất nông nghiệp",
    "description": "Đầu tư đất hoặc hoạt động nông nghiệp tạo tiền thuê/sản lượng.",
    "evaluationMetrics": [
      "Yield per hectare",
      "land value"
    ],
    "keyRisks": [
      "Thời tiết",
      "nước",
      "quyền sử dụng"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.timberland",
    "category": "asset_classes",
    "name": "Rừng trồng",
    "description": "Đầu tư đất rừng và sản lượng gỗ theo chu kỳ sinh trưởng.",
    "evaluationMetrics": [
      "Biological growth",
      "stumpage price"
    ],
    "keyRisks": [
      "Cháy rừng",
      "sâu bệnh",
      "thanh khoản"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.private_credit",
    "category": "asset_classes",
    "name": "Tín dụng tư nhân",
    "description": "Cho doanh nghiệp vay ngoài thị trường trái phiếu đại chúng.",
    "evaluationMetrics": [
      "Yield",
      "default rate",
      "recovery"
    ],
    "keyRisks": [
      "Vỡ nợ",
      "định giá không minh bạch"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.hedge_funds",
    "category": "asset_classes",
    "name": "Quỹ phòng hộ",
    "description": "Quỹ dùng nhiều chiến lược như long-short, macro, relative value.",
    "evaluationMetrics": [
      "Net returns",
      "Sharpe",
      "drawdown"
    ],
    "keyRisks": [
      "Đòn bẩy",
      "thanh khoản",
      "phí"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.digital_assets",
    "category": "asset_classes",
    "name": "Tài sản số",
    "description": "Tài sản dựa trên sổ cái hoặc hệ thống số; cần phân biệt quyền pháp lý và rủi ro lưu ký.",
    "evaluationMetrics": [
      "Volatility",
      "liquidity",
      "custody"
    ],
    "keyRisks": [
      "Biến động",
      "pháp lý",
      "bảo mật"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "asset_classes.cash_deposits",
    "category": "asset_classes",
    "name": "Tiền gửi và tiền mặt",
    "description": "Tiền gửi ngân hàng hoặc công cụ tương đương tiền để bảo toàn thanh khoản.",
    "evaluationMetrics": [
      "Real yield",
      "deposit insurance limits"
    ],
    "keyRisks": [
      "Lạm phát",
      "rủi ro tổ chức"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.dcf_fcff",
    "category": "valuation_models",
    "name": "DCF dòng tiền tự do doanh nghiệp",
    "description": "Chiết khấu FCFF bằng WACC để ước tính enterprise value.",
    "evaluationMetrics": [
      "WACC",
      "terminal growth",
      "EV"
    ],
    "keyRisks": [
      "Sai giả định dài hạn"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.dcf_fcfe",
    "category": "valuation_models",
    "name": "DCF dòng tiền vốn chủ",
    "description": "Chiết khấu FCFE bằng cost of equity để ước tính equity value.",
    "evaluationMetrics": [
      "Cost of equity",
      "FCFE"
    ],
    "keyRisks": [
      "Dự báo nợ và dòng tiền"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.dividend_discount",
    "category": "valuation_models",
    "name": "Chiết khấu cổ tức",
    "description": "Định giá cổ phiếu bằng giá trị hiện tại của cổ tức dự kiến.",
    "evaluationMetrics": [
      "Dividend growth",
      "cost of equity"
    ],
    "keyRisks": [
      "Không phù hợp công ty không chia cổ tức"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.gordon_growth",
    "category": "valuation_models",
    "name": "Gordon Growth Model",
    "description": "Mô hình cổ tức tăng trưởng ổn định vĩnh viễn.",
    "evaluationMetrics": [
      "D1",
      "ke",
      "g"
    ],
    "keyRisks": [
      "Nhạy cảm với g gần ke"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.residual_income",
    "category": "valuation_models",
    "name": "Thu nhập thặng dư",
    "description": "Định giá bằng vốn chủ hiện tại cộng PV thu nhập vượt chi phí vốn.",
    "evaluationMetrics": [
      "ROE",
      "book value",
      "cost of equity"
    ],
    "keyRisks": [
      "Dự báo lợi nhuận và vốn"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.comparables_pe",
    "category": "valuation_models",
    "name": "Định giá P/E tương đối",
    "description": "So sánh giá cổ phiếu với lợi nhuận trên mỗi cổ phần.",
    "evaluationMetrics": [
      "P/E",
      "EPS",
      "peer set"
    ],
    "keyRisks": [
      "Khác biệt tăng trưởng/chất lượng"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.comparables_ev_ebitda",
    "category": "valuation_models",
    "name": "Định giá EV/EBITDA",
    "description": "So sánh giá trị doanh nghiệp với EBITDA.",
    "evaluationMetrics": [
      "EV/EBITDA",
      "net debt"
    ],
    "keyRisks": [
      "Bỏ qua capex và vốn lưu động"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.comparables_pb",
    "category": "valuation_models",
    "name": "Định giá P/B",
    "description": "So sánh giá trị vốn hóa với giá trị sổ sách.",
    "evaluationMetrics": [
      "P/B",
      "ROE"
    ],
    "keyRisks": [
      "Giá trị sổ sách lỗi thời"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.precedent_transactions",
    "category": "valuation_models",
    "name": "Giao dịch tương đương",
    "description": "Dùng bội số giao dịch M&A đã hoàn tất để ước tính giá trị.",
    "evaluationMetrics": [
      "Transaction multiples",
      "control premium"
    ],
    "keyRisks": [
      "Khác biệt thời điểm và điều kiện"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.asset_based_valuation",
    "category": "valuation_models",
    "name": "Định giá dựa trên tài sản",
    "description": "Ước tính giá trị tài sản trừ nợ phải trả, điều chỉnh giá trị hợp lý.",
    "evaluationMetrics": [
      "NAV",
      "liquidation value"
    ],
    "keyRisks": [
      "Tài sản vô hình khó định giá"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.sum_of_the_parts",
    "category": "valuation_models",
    "name": "Tổng các bộ phận",
    "description": "Định giá từng mảng kinh doanh rồi cộng lại và điều chỉnh nợ/công ty mẹ.",
    "evaluationMetrics": [
      "Segment multiples",
      "net debt"
    ],
    "keyRisks": [
      "Chiết khấu holding company"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.venture_capital_method",
    "category": "valuation_models",
    "name": "Phương pháp VC",
    "description": "Ước tính giá trị thoái vốn tương lai rồi chiết khấu theo lợi suất mục tiêu.",
    "evaluationMetrics": [
      "Exit value",
      "dilution",
      "target return"
    ],
    "keyRisks": [
      "Exit multiple bất định"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.berkus_method",
    "category": "valuation_models",
    "name": "Phương pháp Berkus",
    "description": "Định giá startup sớm bằng điểm cho các yếu tố giảm rủi ro.",
    "evaluationMetrics": [
      "Team",
      "product",
      "market",
      "execution"
    ],
    "keyRisks": [
      "Chủ quan",
      "không thay thế thẩm định"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.scorecard_valuation",
    "category": "valuation_models",
    "name": "Định giá scorecard",
    "description": "So sánh startup với startup tương đồng và điều chỉnh theo tiêu chí.",
    "evaluationMetrics": [
      "Comparable median",
      "weights"
    ],
    "keyRisks": [
      "Mẫu so sánh yếu"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.market_penetration_method",
    "category": "valuation_models",
    "name": "Định giá theo thâm nhập thị trường",
    "description": "Ước tính doanh thu từ thị trường mục tiêu, tỷ lệ tiếp cận và mức chi tiêu.",
    "evaluationMetrics": [
      "TAM",
      "SAM",
      "SOM",
      "conversion"
    ],
    "keyRisks": [
      "TAM bị thổi phồng"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.cap_rate_valuation",
    "category": "valuation_models",
    "name": "Định giá bất động sản theo cap rate",
    "description": "Chia NOI ổn định cho tỷ suất vốn hóa phù hợp.",
    "evaluationMetrics": [
      "NOI",
      "cap rate"
    ],
    "keyRisks": [
      "NOI và cap rate biến động"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.discounted_cash_flow_project",
    "category": "valuation_models",
    "name": "DCF dự án",
    "description": "Chiết khấu dòng tiền dự án theo tỷ lệ phản ánh rủi ro.",
    "evaluationMetrics": [
      "NPV",
      "IRR",
      "WACC"
    ],
    "keyRisks": [
      "Sai dự báo và chi phí vốn"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.economic_value_added",
    "category": "valuation_models",
    "name": "Giá trị kinh tế gia tăng EVA",
    "description": "Đo lợi nhuận hoạt động sau thuế trừ chi phí vốn sử dụng.",
    "evaluationMetrics": [
      "NOPAT",
      "invested capital",
      "WACC"
    ],
    "keyRisks": [
      "Đo lường kế toán"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.real_options_valuation",
    "category": "valuation_models",
    "name": "Định giá quyền chọn thực",
    "description": "Định giá tính linh hoạt trì hoãn, mở rộng, thu hẹp hoặc từ bỏ dự án.",
    "evaluationMetrics": [
      "Volatility",
      "option value",
      "decision nodes"
    ],
    "keyRisks": [
      "Khó ước lượng tham số"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.black_scholes",
    "category": "valuation_models",
    "name": "Black-Scholes",
    "description": "Định giá quyền chọn kiểu châu Âu theo giả định mô hình.",
    "evaluationMetrics": [
      "Spot",
      "strike",
      "volatility",
      "rates",
      "time"
    ],
    "keyRisks": [
      "Giả định biến động và phân phối"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.binomial_option",
    "category": "valuation_models",
    "name": "Mô hình cây nhị thức",
    "description": "Định giá quyền chọn qua các bước giá lên/xuống và chiết khấu.",
    "evaluationMetrics": [
      "Up/down factors",
      "risk-neutral probability"
    ],
    "keyRisks": [
      "Rời rạc hóa",
      "giả định"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.capm",
    "category": "valuation_models",
    "name": "CAPM",
    "description": "Ước tính lợi suất yêu cầu từ lãi suất phi rủi ro và beta thị trường.",
    "evaluationMetrics": [
      "Risk-free rate",
      "beta",
      "ERP"
    ],
    "keyRisks": [
      "Beta không ổn định"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.apt",
    "category": "valuation_models",
    "name": "Arbitrage Pricing Theory",
    "description": "Mô hình lợi suất dựa trên nhiều nhân tố rủi ro hệ thống.",
    "evaluationMetrics": [
      "Factor sensitivities",
      "premia"
    ],
    "keyRisks": [
      "Chọn nhân tố và ước lượng"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.wacc",
    "category": "valuation_models",
    "name": "Chi phí vốn bình quân gia quyền",
    "description": "Tính chi phí vốn kết hợp nợ và vốn chủ theo tỷ trọng thị trường.",
    "evaluationMetrics": [
      "Cost of debt",
      "cost of equity",
      "weights"
    ],
    "keyRisks": [
      "Cấu trúc vốn mục tiêu"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "valuation_models.economic_profit",
    "category": "valuation_models",
    "name": "Lợi nhuận kinh tế",
    "description": "So sánh lợi nhuận với chi phí cơ hội của toàn bộ vốn.",
    "evaluationMetrics": [
      "ROIC",
      "WACC",
      "invested capital"
    ],
    "keyRisks": [
      "Đo lường vốn và chu kỳ"
    ],
    "sourceRefs": [
      "CFA Institute"
    ]
  },
  {
    "id": "business_revenue.one_time_sales",
    "category": "business_revenue",
    "name": "Bán hàng một lần",
    "description": "Khách hàng trả tiền một lần để sở hữu sản phẩm hoặc nhận dịch vụ xác định.",
    "evaluationMetrics": [
      "Gross margin",
      "conversion",
      "repeat rate"
    ],
    "keyRisks": [
      "Phụ thuộc doanh số mới"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.subscription",
    "category": "business_revenue",
    "name": "Thuê bao định kỳ",
    "description": "Thu phí hàng tháng/năm để duy trì quyền truy cập hoặc dịch vụ.",
    "evaluationMetrics": [
      "MRR",
      "ARR",
      "churn",
      "LTV"
    ],
    "keyRisks": [
      "Rời bỏ",
      "chi phí phục vụ"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.usage_based",
    "category": "business_revenue",
    "name": "Tính phí theo mức sử dụng",
    "description": "Tính tiền theo dung lượng, lượt gọi, thời gian hoặc đơn vị tiêu thụ.",
    "evaluationMetrics": [
      "Usage",
      "gross margin",
      "net retention"
    ],
    "keyRisks": [
      "Doanh thu khó dự báo"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.freemium",
    "category": "business_revenue",
    "name": "Miễn phí cơ bản, trả phí nâng cao",
    "description": "Cấp phiên bản miễn phí và bán tính năng, dung lượng hoặc hỗ trợ cao cấp.",
    "evaluationMetrics": [
      "Activation",
      "conversion",
      "ARPPU"
    ],
    "keyRisks": [
      "Chi phí free users"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.advertising",
    "category": "business_revenue",
    "name": "Quảng cáo",
    "description": "Cung cấp nội dung/dịch vụ và bán khả năng tiếp cận người xem cho nhà quảng cáo.",
    "evaluationMetrics": [
      "CPM",
      "CPC",
      "fill rate"
    ],
    "keyRisks": [
      "Phụ thuộc quảng cáo và dữ liệu"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.sponsorship",
    "category": "business_revenue",
    "name": "Tài trợ",
    "description": "Đối tác trả tiền để gắn thương hiệu với nội dung, sự kiện hoặc cộng đồng.",
    "evaluationMetrics": [
      "Sponsor retention",
      "reach"
    ],
    "keyRisks": [
      "Phụ thuộc nhà tài trợ"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.marketplace_commission",
    "category": "business_revenue",
    "name": "Sàn thu hoa hồng",
    "description": "Kết nối người mua và người bán, thu phần trăm giao dịch.",
    "evaluationMetrics": [
      "GMV",
      "take rate",
      "liquidity"
    ],
    "keyRisks": [
      "Mất cân bằng hai phía"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.transaction_fee",
    "category": "business_revenue",
    "name": "Phí giao dịch",
    "description": "Thu phí cố định hoặc biến đổi trên mỗi giao dịch.",
    "evaluationMetrics": [
      "Transactions",
      "fee per transaction"
    ],
    "keyRisks": [
      "Cạnh tranh phí"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.brokerage",
    "category": "business_revenue",
    "name": "Môi giới",
    "description": "Kết nối các bên và thu phí khi giao dịch hoặc hợp đồng hoàn tất.",
    "evaluationMetrics": [
      "Close rate",
      "commission"
    ],
    "keyRisks": [
      "Chu kỳ giao dịch",
      "pháp lý"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.affiliate",
    "category": "business_revenue",
    "name": "Tiếp thị liên kết",
    "description": "Nhận hoa hồng từ khách hàng hoặc đơn hàng được giới thiệu và ghi nhận.",
    "evaluationMetrics": [
      "CTR",
      "conversion",
      "EPC"
    ],
    "keyRisks": [
      "Phụ thuộc đối tác"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.licensing",
    "category": "business_revenue",
    "name": "Cấp phép",
    "description": "Cho phép bên khác sử dụng phần mềm, thương hiệu, sáng chế hoặc nội dung.",
    "evaluationMetrics": [
      "Royalty rate",
      "license count"
    ],
    "keyRisks": [
      "Vi phạm bản quyền",
      "tập trung"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.white_label",
    "category": "business_revenue",
    "name": "Nhãn trắng",
    "description": "Cung cấp sản phẩm để đối tác đổi thương hiệu và bán lại.",
    "evaluationMetrics": [
      "Partner margin",
      "deployment cost"
    ],
    "keyRisks": [
      "Phụ thuộc đối tác"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.franchise",
    "category": "business_revenue",
    "name": "Nhượng quyền",
    "description": "Cấp quyền dùng thương hiệu, quy trình và hệ thống vận hành để nhận phí/royalty.",
    "evaluationMetrics": [
      "Royalty",
      "unit economics",
      "franchisee ROI"
    ],
    "keyRisks": [
      "Kiểm soát chất lượng",
      "tranh chấp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.leasing",
    "category": "business_revenue",
    "name": "Cho thuê tài sản",
    "description": "Thu tiền định kỳ để khách hàng sử dụng tài sản mà không cần mua đứt.",
    "evaluationMetrics": [
      "Utilization",
      "yield",
      "residual value"
    ],
    "keyRisks": [
      "Khấu hao",
      "hư hỏng"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.rental",
    "category": "business_revenue",
    "name": "Cho thuê ngắn hạn",
    "description": "Thu phí theo ngày/giờ cho tài sản hoặc không gian.",
    "evaluationMetrics": [
      "Occupancy",
      "utilization",
      "yield"
    ],
    "keyRisks": [
      "Mùa vụ",
      "bảo trì"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.razor_blade",
    "category": "business_revenue",
    "name": "Dao cạo và lưỡi dao",
    "description": "Bán thiết bị nền với biên thấp, thu lợi nhuận từ vật tư bổ sung lặp lại.",
    "evaluationMetrics": [
      "Attach rate",
      "refill margin"
    ],
    "keyRisks": [
      "Khách thay thế vật tư"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.reverse_razor_blade",
    "category": "business_revenue",
    "name": "Mô hình ngược dao cạo",
    "description": "Bán vật tư/đầu vào rẻ để thúc đẩy mua thiết bị hoặc dịch vụ biên cao.",
    "evaluationMetrics": [
      "Bundle margin",
      "repeat purchase"
    ],
    "keyRisks": [
      "Khách chỉ mua phần rẻ"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.bundling",
    "category": "business_revenue",
    "name": "Bán gói",
    "description": "Gộp nhiều sản phẩm/dịch vụ thành gói có giá tổng hợp.",
    "evaluationMetrics": [
      "Bundle attach",
      "ARPU"
    ],
    "keyRisks": [
      "Giảm biên từng sản phẩm"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.unbundling",
    "category": "business_revenue",
    "name": "Tách gói",
    "description": "Tách sản phẩm tích hợp thành dịch vụ riêng để bán theo nhu cầu.",
    "evaluationMetrics": [
      "Revenue per module"
    ],
    "keyRisks": [
      "Mất giá trị gói"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.pay_what_you_want",
    "category": "business_revenue",
    "name": "Khách tự chọn giá",
    "description": "Khách hàng tự quyết mức thanh toán theo hướng dẫn hoặc giá trị cảm nhận.",
    "evaluationMetrics": [
      "Average paid",
      "conversion"
    ],
    "keyRisks": [
      "Giá trung bình thấp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.name_your_price",
    "category": "business_revenue",
    "name": "Khách đề xuất giá",
    "description": "Người mua đưa giá, nhà cung cấp chấp nhận hoặc từ chối theo quy tắc.",
    "evaluationMetrics": [
      "Bid acceptance",
      "margin"
    ],
    "keyRisks": [
      "Khách trả thấp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.dynamic_pricing",
    "category": "business_revenue",
    "name": "Định giá động",
    "description": "Điều chỉnh giá theo cung cầu, thời gian, tồn kho hoặc phân khúc.",
    "evaluationMetrics": [
      "Yield",
      "conversion",
      "elasticity"
    ],
    "keyRisks": [
      "Phản ứng tiêu cực",
      "pháp lý"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.tiered_pricing",
    "category": "business_revenue",
    "name": "Định giá theo cấp",
    "description": "Các gói khác nhau về tính năng, giới hạn và mức dịch vụ.",
    "evaluationMetrics": [
      "Plan mix",
      "upgrade rate"
    ],
    "keyRisks": [
      "Thiết kế gói phức tạp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.outcome_based",
    "category": "business_revenue",
    "name": "Thu phí theo kết quả",
    "description": "Phí gắn với kết quả hoặc KPI đã thống nhất và cách đo kiểm.",
    "evaluationMetrics": [
      "Outcome attainment",
      "margin"
    ],
    "keyRisks": [
      "Khó quy trách nhiệm"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.productized_service",
    "category": "business_revenue",
    "name": "Dịch vụ chuẩn hóa",
    "description": "Đóng gói dịch vụ thành phạm vi, quy trình và mức giá lặp lại.",
    "evaluationMetrics": [
      "Delivery hours",
      "gross margin"
    ],
    "keyRisks": [
      "Phạm vi phát sinh"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.managed_service",
    "category": "business_revenue",
    "name": "Dịch vụ quản trị thuê ngoài",
    "description": "Khách trả phí định kỳ để nhà cung cấp vận hành một chức năng.",
    "evaluationMetrics": [
      "Recurring revenue",
      "SLA",
      "utilization"
    ],
    "keyRisks": [
      "Chi phí nhân sự",
      "SLA"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.direct_to_consumer",
    "category": "business_revenue",
    "name": "Bán trực tiếp D2C",
    "description": "Thương hiệu bán thẳng cho người tiêu dùng, kiểm soát dữ liệu và trải nghiệm.",
    "evaluationMetrics": [
      "CAC",
      "AOV",
      "repeat rate"
    ],
    "keyRisks": [
      "Chi phí marketing/logistics"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.b2b_enterprise",
    "category": "business_revenue",
    "name": "Bán hàng doanh nghiệp B2B",
    "description": "Bán sản phẩm/dịch vụ theo hợp đồng, giấy phép hoặc triển khai cho tổ chức.",
    "evaluationMetrics": [
      "ACV",
      "sales cycle",
      "retention"
    ],
    "keyRisks": [
      "Chu kỳ bán dài"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.ecommerce_retail",
    "category": "business_revenue",
    "name": "Bán lẻ thương mại điện tử",
    "description": "Bán hàng qua website/app hoặc sàn số.",
    "evaluationMetrics": [
      "AOV",
      "conversion",
      "returns"
    ],
    "keyRisks": [
      "Quảng cáo",
      "hoàn trả"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.social_commerce",
    "category": "business_revenue",
    "name": "Thương mại qua mạng xã hội",
    "description": "Khám phá, tư vấn và giao dịch qua mạng xã hội/nội dung trực tiếp.",
    "evaluationMetrics": [
      "Live conversion",
      "CAC"
    ],
    "keyRisks": [
      "Phụ thuộc nền tảng"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_revenue.community_membership",
    "category": "business_revenue",
    "name": "Hội viên cộng đồng",
    "description": "Thu phí thành viên để cung cấp quyền truy cập, nội dung hoặc mạng lưới.",
    "evaluationMetrics": [
      "Member retention",
      "ARPU"
    ],
    "keyRisks": [
      "Giảm tương tác"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.vertical_integration",
    "category": "business_operating",
    "name": "Tích hợp dọc",
    "description": "Sở hữu hoặc kiểm soát nhiều công đoạn trong chuỗi cung ứng.",
    "evaluationMetrics": [
      "Cost per stage",
      "control",
      "margin"
    ],
    "keyRisks": [
      "Vốn lớn",
      "kém linh hoạt"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.horizontal_integration",
    "category": "business_operating",
    "name": "Tích hợp ngang",
    "description": "Mở rộng bằng cách sở hữu hoặc hợp nhất đối thủ/cùng tầng giá trị.",
    "evaluationMetrics": [
      "Market share",
      "synergies"
    ],
    "keyRisks": [
      "Chống độc quyền",
      "tích hợp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.asset_light",
    "category": "business_operating",
    "name": "Mô hình ít tài sản",
    "description": "Tập trung thương hiệu, phần mềm hoặc điều phối; thuê ngoài tài sản nặng vốn.",
    "evaluationMetrics": [
      "ROIC",
      "fixed asset turnover"
    ],
    "keyRisks": [
      "Phụ thuộc nhà cung cấp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.asset_heavy",
    "category": "business_operating",
    "name": "Mô hình thâm dụng tài sản",
    "description": "Sở hữu nhà máy, thiết bị, kho hoặc hạ tầng để kiểm soát năng lực.",
    "evaluationMetrics": [
      "Asset utilization",
      "capex"
    ],
    "keyRisks": [
      "Khấu hao",
      "công suất dư"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.platform_multi_sided",
    "category": "business_operating",
    "name": "Nền tảng đa phía",
    "description": "Kết nối từ hai nhóm người dùng trở lên và tạo hiệu ứng mạng lưới.",
    "evaluationMetrics": [
      "Network liquidity",
      "take rate"
    ],
    "keyRisks": [
      "Chicken-and-egg",
      "trust"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.peer_to_peer",
    "category": "business_operating",
    "name": "Ngang hàng P2P",
    "description": "Người dùng giao dịch trực tiếp, nền tảng cung cấp niềm tin và điều phối.",
    "evaluationMetrics": [
      "Match rate",
      "dispute rate"
    ],
    "keyRisks": [
      "Gian lận",
      "chất lượng"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.dropshipping",
    "category": "business_operating",
    "name": "Bán hàng không lưu kho",
    "description": "Nhà bán nhận đơn và nhà cung cấp giao trực tiếp cho khách.",
    "evaluationMetrics": [
      "Contribution margin",
      "delivery time"
    ],
    "keyRisks": [
      "Kiểm soát chất lượng thấp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.print_on_demand",
    "category": "business_operating",
    "name": "In theo đơn",
    "description": "Chỉ sản xuất/in khi có đơn đặt hàng.",
    "evaluationMetrics": [
      "Unit margin",
      "defect rate"
    ],
    "keyRisks": [
      "Biên lợi nhuận",
      "thời gian giao"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.on_demand",
    "category": "business_operating",
    "name": "Cung ứng theo yêu cầu",
    "description": "Điều phối dịch vụ hoặc hàng hóa gần thời điểm khách cần.",
    "evaluationMetrics": [
      "Fulfillment time",
      "utilization"
    ],
    "keyRisks": [
      "Cân bằng cung cầu"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.franchise_network",
    "category": "business_operating",
    "name": "Mạng lưới nhượng quyền",
    "description": "Mở rộng thông qua các đơn vị nhận quyền vận hành theo tiêu chuẩn chung.",
    "evaluationMetrics": [
      "Same-store sales",
      "compliance"
    ],
    "keyRisks": [
      "Chất lượng không đồng đều"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.cooperative_business",
    "category": "business_operating",
    "name": "Doanh nghiệp hợp tác xã",
    "description": "Thành viên cùng sở hữu và quản trị, lợi ích phân bổ theo quy tắc hợp tác.",
    "evaluationMetrics": [
      "Member value",
      "surplus distribution"
    ],
    "keyRisks": [
      "Ra quyết định chậm"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.social_enterprise",
    "category": "business_operating",
    "name": "Doanh nghiệp xã hội",
    "description": "Kết hợp doanh thu thương mại với mục tiêu xã hội/môi trường đo lường được.",
    "evaluationMetrics": [
      "Impact metrics",
      "operating margin"
    ],
    "keyRisks": [
      "Đánh đổi tác động và tài chính"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.open_source_commercial",
    "category": "business_operating",
    "name": "Thương mại hóa mã nguồn mở",
    "description": "Mã nguồn mở kết hợp hỗ trợ, hosting, dual licensing hoặc tính năng doanh nghiệp.",
    "evaluationMetrics": [
      "Paid conversion",
      "support margin"
    ],
    "keyRisks": [
      "Khó chuyển đổi trả phí"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.crowdsourcing",
    "category": "business_operating",
    "name": "Huy động cộng đồng đóng góp",
    "description": "Phân tán việc tạo nội dung, dữ liệu, ý tưởng hoặc giải pháp cho cộng đồng rộng.",
    "evaluationMetrics": [
      "Contribution rate",
      "moderation cost"
    ],
    "keyRisks": [
      "Chất lượng",
      "quyền sở hữu"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.crowdfunding",
    "category": "business_operating",
    "name": "Gọi vốn cộng đồng",
    "description": "Huy động nhiều khoản đóng góp nhỏ theo hình thức quyên góp, thưởng, nợ hoặc vốn.",
    "evaluationMetrics": [
      "Funding conversion",
      "fulfillment"
    ],
    "keyRisks": [
      "Không đạt mục tiêu",
      "nghĩa vụ"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.collaborative_consumption",
    "category": "business_operating",
    "name": "Tiêu dùng cộng tác",
    "description": "Tăng mức sử dụng tài sản qua chia sẻ, trao đổi hoặc cho thuê.",
    "evaluationMetrics": [
      "Utilization",
      "trust",
      "maintenance"
    ],
    "keyRisks": [
      "Hư hỏng",
      "tranh chấp"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.servitization",
    "category": "business_operating",
    "name": "Chuyển sản phẩm thành dịch vụ",
    "description": "Bán kết quả/khả năng sử dụng thay vì chỉ bán thiết bị.",
    "evaluationMetrics": [
      "Recurring service revenue"
    ],
    "keyRisks": [
      "Chi phí vòng đời",
      "SLA"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.circular_business",
    "category": "business_operating",
    "name": "Kinh doanh tuần hoàn",
    "description": "Tái sử dụng, sửa chữa, tái sản xuất và thu hồi vật liệu trong mô hình doanh thu.",
    "evaluationMetrics": [
      "Material recovery",
      "lifecycle margin"
    ],
    "keyRisks": [
      "Reverse logistics"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.local_business",
    "category": "business_operating",
    "name": "Kinh doanh địa phương",
    "description": "Phục vụ thị trường địa lý hẹp bằng cửa hàng, dịch vụ hoặc chuỗi địa phương.",
    "evaluationMetrics": [
      "Footfall",
      "repeat rate"
    ],
    "keyRisks": [
      "Thị trường giới hạn"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "business_operating.export_business",
    "category": "business_operating",
    "name": "Kinh doanh xuất khẩu",
    "description": "Bán hàng/dịch vụ qua biên giới qua nhà phân phối hoặc trực tiếp.",
    "evaluationMetrics": [
      "Export margin",
      "FX exposure"
    ],
    "keyRisks": [
      "Hải quan",
      "tỷ giá",
      "logistics"
    ],
    "sourceRefs": [
      "OECD",
      "European Commission"
    ]
  },
  {
    "id": "funding_capital.bootstrapping",
    "category": "funding_capital",
    "name": "Tự tài trợ",
    "description": "Dùng tiền cá nhân và dòng tiền khách hàng để phát triển mà không gọi vốn ngoài.",
    "evaluationMetrics": [
      "Runway",
      "burn multiple"
    ],
    "keyRisks": [
      "Tăng trưởng chậm",
      "rủi ro cá nhân"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.friends_family",
    "category": "funding_capital",
    "name": "Vốn từ gia đình và bạn bè",
    "description": "Huy động vốn từ mạng lưới cá nhân theo thỏa thuận rõ ràng.",
    "evaluationMetrics": [
      "Terms",
      "dilution",
      "repayment"
    ],
    "keyRisks": [
      "Rủi ro quan hệ"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.angel_round",
    "category": "funding_capital",
    "name": "Vòng vốn thiên thần",
    "description": "Nhà đầu tư cá nhân góp vốn sớm đổi lấy cổ phần hoặc quyền chuyển đổi.",
    "evaluationMetrics": [
      "Pre/post-money",
      "dilution"
    ],
    "keyRisks": [
      "Định giá và quyền kiểm soát"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.seed_equity",
    "category": "funding_capital",
    "name": "Vốn hạt giống",
    "description": "Gọi vốn cổ phần để kiểm chứng sản phẩm và thị trường.",
    "evaluationMetrics": [
      "Runway",
      "milestones",
      "dilution"
    ],
    "keyRisks": [
      "Chưa có product-market fit"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.series_equity",
    "category": "funding_capital",
    "name": "Vòng vốn tăng trưởng",
    "description": "Gọi vốn qua các vòng A/B/C để mở rộng quy mô và thị trường.",
    "evaluationMetrics": [
      "ARR",
      "growth",
      "burn multiple"
    ],
    "keyRisks": [
      "Pha loãng",
      "áp lực tăng trưởng"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.convertible_note",
    "category": "funding_capital",
    "name": "Khoản vay chuyển đổi",
    "description": "Khoản vay có thể chuyển thành cổ phần theo điều kiện vòng vốn sau.",
    "evaluationMetrics": [
      "Interest",
      "maturity",
      "cap",
      "discount"
    ],
    "keyRisks": [
      "Đáo hạn",
      "tranh chấp điều khoản"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.safe",
    "category": "funding_capital",
    "name": "Thỏa thuận SAFE",
    "description": "Quyền nhận cổ phần tương lai theo điều kiện định trước, thường không phải khoản vay.",
    "evaluationMetrics": [
      "Valuation cap",
      "discount",
      "dilution"
    ],
    "keyRisks": [
      "Pha loãng cộng dồn"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.venture_debt",
    "category": "funding_capital",
    "name": "Nợ đầu tư mạo hiểm",
    "description": "Khoản vay bổ sung cho startup đã có vốn cổ phần và khả năng trả nợ.",
    "evaluationMetrics": [
      "Debt service",
      "warrants",
      "runway"
    ],
    "keyRisks": [
      "Áp lực trả nợ"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.bank_loan",
    "category": "funding_capital",
    "name": "Vay ngân hàng",
    "description": "Vay có tài sản bảo đảm hoặc tín chấp theo điều kiện tín dụng.",
    "evaluationMetrics": [
      "DSCR",
      "interest coverage",
      "collateral"
    ],
    "keyRisks": [
      "Lãi suất",
      "tài sản bảo đảm"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.revenue_based_financing",
    "category": "funding_capital",
    "name": "Tài trợ theo doanh thu",
    "description": "Nhà đầu tư nhận tỷ lệ doanh thu cho tới khi đạt mức hoàn trả thỏa thuận.",
    "evaluationMetrics": [
      "Revenue share",
      "repayment cap"
    ],
    "keyRisks": [
      "Doanh thu giảm vẫn chịu áp lực"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.project_finance",
    "category": "funding_capital",
    "name": "Tài trợ dự án",
    "description": "Vay dựa chủ yếu vào dòng tiền và tài sản của dự án tách biệt.",
    "evaluationMetrics": [
      "DSCR",
      "LLCR",
      "project IRR"
    ],
    "keyRisks": [
      "Chậm tiến độ",
      "vượt vốn"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.leasing_finance",
    "category": "funding_capital",
    "name": "Thuê tài chính",
    "description": "Dùng tài sản qua hợp đồng thuê dài hạn với cấu trúc tài chính xác định.",
    "evaluationMetrics": [
      "Lease liability",
      "payment coverage"
    ],
    "keyRisks": [
      "Cam kết thanh toán dài hạn"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.trade_credit",
    "category": "funding_capital",
    "name": "Tín dụng thương mại",
    "description": "Nhà cung cấp cho phép thanh toán sau khi nhận hàng/dịch vụ.",
    "evaluationMetrics": [
      "Payables days",
      "cash conversion cycle"
    ],
    "keyRisks": [
      "Đứt nguồn cung"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.factoring",
    "category": "funding_capital",
    "name": "Bao thanh toán",
    "description": "Bán hoặc chuyển nhượng khoản phải thu để nhận tiền sớm.",
    "evaluationMetrics": [
      "Advance rate",
      "fee",
      "debtor quality"
    ],
    "keyRisks": [
      "Truy đòi",
      "chất lượng con nợ"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  },
  {
    "id": "funding_capital.ipo",
    "category": "funding_capital",
    "name": "Phát hành cổ phiếu lần đầu",
    "description": "Doanh nghiệp chào bán cổ phần ra công chúng và niêm yết theo quy định.",
    "evaluationMetrics": [
      "Float",
      "valuation",
      "governance"
    ],
    "keyRisks": [
      "Công bố thông tin",
      "biến động giá"
    ],
    "sourceRefs": [
      "CFA Institute",
      "OECD"
    ]
  }
].map(item => Object.freeze({
  ...item,
  evaluationMetrics: Object.freeze(item.evaluationMetrics),
  keyRisks: Object.freeze(item.keyRisks),
  sourceRefs: Object.freeze(item.sourceRefs)
})));
const INDEX = new Map(MODELS.map(item => [item.id, item]));

function listModels(category) {
  if (category === undefined || category === null || category === "") return MODELS.slice();
  if (typeof category !== "string") throw new TypeError("category must be a string");
  return MODELS.filter(item => item.category === category.trim().toLowerCase());
}
function getModel(id) {
  if (typeof id !== "string") throw new TypeError("id must be a string");
  return INDEX.get(id) || null;
}
function searchModels(query) {
  if (typeof query !== "string") throw new TypeError("query must be a string");
  const terms = query.trim().toLocaleLowerCase().split(/\\s+/).filter(Boolean);
  if (!terms.length) return [];
  return MODELS.filter(item => {
    const text = [item.id,item.name,item.description,item.category,...item.evaluationMetrics,...item.keyRisks].join(" ").toLocaleLowerCase();
    return terms.every(term => text.includes(term));
  });
}
function getCategories() {
  return Object.freeze([...new Set(MODELS.map(item => item.category))]);
}
module.exports = Object.freeze({ MODELS, MODEL_COUNT: MODELS.length, listModels, getModel, searchModels, getCategories });
