"use strict";

/**
 * PRINCIPIA Economic Forms Registry.
 * A taxonomy of 100 economic arrangements and organizing principles.
 * These are descriptive categories, not mutually exclusive country labels.
 */

const FORMS = Object.freeze([
  {
    "id": "ownership.private_capitalism",
    "category": "ownership",
    "name": "Chủ nghĩa tư bản tư nhân",
    "description": "Tư liệu sản xuất chủ yếu thuộc sở hữu tư nhân; đầu tư và sản xuất hướng tới lợi nhuận."
  },
  {
    "id": "ownership.state_capitalism",
    "category": "ownership",
    "name": "Chủ nghĩa tư bản nhà nước",
    "description": "Nhà nước nắm hoặc kiểm soát doanh nghiệp chiến lược và vận hành theo cơ chế tích lũy vốn."
  },
  {
    "id": "ownership.socialism",
    "category": "ownership",
    "name": "Chủ nghĩa xã hội",
    "description": "Sở hữu xã hội hoặc công hữu giữ vai trò chủ đạo, hướng tới phân phối theo mục tiêu xã hội."
  },
  {
    "id": "ownership.market_socialism",
    "category": "ownership",
    "name": "Chủ nghĩa xã hội thị trường",
    "description": "Doanh nghiệp sở hữu xã hội hoạt động trong cơ chế giá và cạnh tranh thị trường."
  },
  {
    "id": "ownership.cooperative_economy",
    "category": "ownership",
    "name": "Kinh tế hợp tác xã",
    "description": "Thành viên cùng sở hữu, quản trị dân chủ và chia sẻ lợi ích theo quy tắc hợp tác."
  },
  {
    "id": "ownership.worker_cooperatives",
    "category": "ownership",
    "name": "Hợp tác xã công nhân",
    "description": "Người lao động đồng sở hữu và trực tiếp quản trị doanh nghiệp."
  },
  {
    "id": "ownership.consumer_cooperatives",
    "category": "ownership",
    "name": "Hợp tác xã tiêu dùng",
    "description": "Người tiêu dùng góp vốn, cùng mua hàng và kiểm soát dịch vụ."
  },
  {
    "id": "ownership.producer_cooperatives",
    "category": "ownership",
    "name": "Hợp tác xã sản xuất",
    "description": "Các nhà sản xuất phối hợp đầu vào, chế biến hoặc tiêu thụ."
  },
  {
    "id": "ownership.community_ownership",
    "category": "ownership",
    "name": "Sở hữu cộng đồng",
    "description": "Tài sản hoặc nguồn lực được cộng đồng cùng quản lý và hưởng lợi."
  },
  {
    "id": "ownership.commons_based",
    "category": "ownership",
    "name": "Kinh tế tài nguyên chung",
    "description": "Nguồn lực dùng chung được quản trị bằng quy tắc cộng đồng và cơ chế giám sát."
  },
  {
    "id": "coordination.free_market",
    "category": "coordination",
    "name": "Kinh tế thị trường tự do",
    "description": "Giá cả và phân bổ nguồn lực chủ yếu hình thành qua cung cầu và trao đổi tự nguyện."
  },
  {
    "id": "coordination.mixed_economy",
    "category": "coordination",
    "name": "Kinh tế hỗn hợp",
    "description": "Thị trường tư nhân kết hợp điều tiết, cung ứng và tái phân phối của nhà nước."
  },
  {
    "id": "coordination.planned_economy",
    "category": "coordination",
    "name": "Kinh tế kế hoạch hóa tập trung",
    "description": "Cơ quan trung ương quyết định mục tiêu sản lượng, đầu vào và phân phối chủ yếu."
  },
  {
    "id": "coordination.indicative_planning",
    "category": "coordination",
    "name": "Kế hoạch hóa định hướng",
    "description": "Nhà nước đặt mục tiêu và tín hiệu định hướng nhưng doanh nghiệp vẫn tự quyết nhiều hoạt động."
  },
  {
    "id": "coordination.participatory_planning",
    "category": "coordination",
    "name": "Kế hoạch hóa có sự tham gia",
    "description": "Cộng đồng và người lao động tham gia xây dựng ưu tiên và phân bổ ngân sách."
  },
  {
    "id": "coordination.decentralized_planning",
    "category": "coordination",
    "name": "Kế hoạch hóa phi tập trung",
    "description": "Quyết định sản xuất và phân bổ được phân quyền cho địa phương hoặc đơn vị."
  },
  {
    "id": "coordination.market_coordination",
    "category": "coordination",
    "name": "Điều phối bằng thị trường",
    "description": "Giá, cạnh tranh và hợp đồng là cơ chế phối hợp chính."
  },
  {
    "id": "coordination.network_economy",
    "category": "coordination",
    "name": "Kinh tế mạng lưới",
    "description": "Hoạt động được tổ chức qua mạng lưới doanh nghiệp, nhà cung cấp và người dùng."
  },
  {
    "id": "coordination.platform_economy",
    "category": "coordination",
    "name": "Kinh tế nền tảng",
    "description": "Nền tảng số kết nối nhiều nhóm người dùng và điều phối giao dịch."
  },
  {
    "id": "coordination.gig_economy",
    "category": "coordination",
    "name": "Kinh tế việc làm theo nhiệm vụ",
    "description": "Lao động nhận công việc ngắn hạn hoặc theo đơn hàng qua trung gian hay nền tảng."
  },
  {
    "id": "development.subsistence",
    "category": "development",
    "name": "Kinh tế tự cung tự cấp",
    "description": "Hộ gia đình hoặc cộng đồng sản xuất chủ yếu để tự tiêu dùng."
  },
  {
    "id": "development.traditional_economy",
    "category": "development",
    "name": "Kinh tế truyền thống",
    "description": "Tập quán, quan hệ cộng đồng và kỹ năng truyền đời định hình sản xuất, trao đổi."
  },
  {
    "id": "development.industrial_economy",
    "category": "development",
    "name": "Kinh tế công nghiệp",
    "description": "Sản xuất quy mô lớn, cơ giới hóa và chế tạo giữ vai trò trung tâm."
  },
  {
    "id": "development.post_industrial",
    "category": "development",
    "name": "Kinh tế hậu công nghiệp",
    "description": "Dịch vụ, tri thức và hoạt động chuyên môn chiếm tỷ trọng lớn."
  },
  {
    "id": "development.knowledge_economy",
    "category": "development",
    "name": "Kinh tế tri thức",
    "description": "Tri thức, nghiên cứu và đổi mới là nguồn tạo giá trị chủ yếu."
  },
  {
    "id": "development.innovation_economy",
    "category": "development",
    "name": "Kinh tế đổi mới sáng tạo",
    "description": "Tăng trưởng dựa vào thương mại hóa ý tưởng, công nghệ và mô hình kinh doanh mới."
  },
  {
    "id": "development.green_economy",
    "category": "development",
    "name": "Kinh tế xanh",
    "description": "Tăng trưởng gắn với giảm ô nhiễm, hiệu quả tài nguyên và bảo vệ hệ sinh thái."
  },
  {
    "id": "development.circular_economy",
    "category": "development",
    "name": "Kinh tế tuần hoàn",
    "description": "Thiết kế để giảm chất thải, sửa chữa, tái sử dụng và tái chế vật liệu."
  },
  {
    "id": "development.bioeconomy",
    "category": "development",
    "name": "Kinh tế sinh học",
    "description": "Sử dụng tài nguyên sinh học và công nghệ sinh học để tạo sản phẩm, năng lượng."
  },
  {
    "id": "development.blue_economy",
    "category": "development",
    "name": "Kinh tế biển xanh",
    "description": "Khai thác bền vững đại dương, vùng ven biển và tài nguyên nước."
  },
  {
    "id": "exchange.barter",
    "category": "exchange",
    "name": "Kinh tế trao đổi hàng hóa",
    "description": "Hàng hóa và dịch vụ được đổi trực tiếp mà không cần tiền làm trung gian."
  },
  {
    "id": "exchange.monetary_economy",
    "category": "exchange",
    "name": "Kinh tế tiền tệ",
    "description": "Tiền làm phương tiện trao đổi, đơn vị tính toán và lưu trữ giá trị."
  },
  {
    "id": "exchange.cashless_economy",
    "category": "exchange",
    "name": "Kinh tế không tiền mặt",
    "description": "Thanh toán chủ yếu qua phương tiện điện tử thay vì tiền mặt."
  },
  {
    "id": "exchange.sharing_economy",
    "category": "exchange",
    "name": "Kinh tế chia sẻ",
    "description": "Tài sản hoặc năng lực nhàn rỗi được nhiều người tiếp cận thông qua chia sẻ."
  },
  {
    "id": "exchange.access_economy",
    "category": "exchange",
    "name": "Kinh tế quyền sử dụng",
    "description": "Người dùng trả tiền để tiếp cận tài sản hoặc dịch vụ thay vì sở hữu."
  },
  {
    "id": "exchange.gift_economy",
    "category": "exchange",
    "name": "Kinh tế quà tặng",
    "description": "Trao tặng và nghĩa vụ tương hỗ tạo luồng phân phối ngoài trao đổi giá cả trực tiếp."
  },
  {
    "id": "exchange.reciprocity_economy",
    "category": "exchange",
    "name": "Kinh tế tương hỗ",
    "description": "Trao đổi dựa trên quan hệ có đi có lại và nghĩa vụ xã hội."
  },
  {
    "id": "exchange.solidarity_economy",
    "category": "exchange",
    "name": "Kinh tế đoàn kết",
    "description": "Tổ chức sản xuất và phân phối đặt hợp tác, công bằng và lợi ích cộng đồng làm trọng tâm."
  },
  {
    "id": "exchange.local_exchange_trading",
    "category": "exchange",
    "name": "Mạng lưới trao đổi địa phương",
    "description": "Thành viên trao đổi hàng hóa, dịch vụ bằng đơn vị tín dụng nội bộ."
  },
  {
    "id": "exchange.time_banking",
    "category": "exchange",
    "name": "Ngân hàng thời gian",
    "description": "Một giờ đóng góp được ghi nhận thành tín dụng để đổi lấy giờ dịch vụ khác."
  },
  {
    "id": "labor.wage_labor",
    "category": "labor",
    "name": "Kinh tế lao động tiền công",
    "description": "Lao động được thuê và trả công theo thời gian, sản phẩm hoặc hợp đồng."
  },
  {
    "id": "labor.self_employment",
    "category": "labor",
    "name": "Kinh tế tự doanh",
    "description": "Cá nhân tự tổ chức hoạt động nghề nghiệp và chịu rủi ro kinh doanh."
  },
  {
    "id": "labor.informal_economy",
    "category": "labor",
    "name": "Kinh tế phi chính thức",
    "description": "Hoạt động tạo thu nhập nằm ngoài một phần cơ chế đăng ký, thuế hoặc bảo hộ chính thức."
  },
  {
    "id": "labor.formal_economy",
    "category": "labor",
    "name": "Kinh tế chính thức",
    "description": "Hoạt động được đăng ký và vận hành trong khuôn khổ pháp luật, thuế và thống kê."
  },
  {
    "id": "labor.family_business",
    "category": "labor",
    "name": "Kinh tế hộ gia đình",
    "description": "Sản xuất, kinh doanh do hộ hoặc gia đình sở hữu và điều hành."
  },
  {
    "id": "labor.social_enterprise",
    "category": "labor",
    "name": "Doanh nghiệp xã hội",
    "description": "Doanh nghiệp dùng hoạt động thương mại để theo đuổi mục tiêu xã hội hoặc môi trường."
  },
  {
    "id": "labor.employee_owned",
    "category": "labor",
    "name": "Doanh nghiệp sở hữu bởi người lao động",
    "description": "Người lao động nắm cổ phần hoặc quyền sở hữu đáng kể trong doanh nghiệp."
  },
  {
    "id": "labor.freelance_economy",
    "category": "labor",
    "name": "Kinh tế lao động tự do",
    "description": "Cá nhân cung cấp dịch vụ độc lập theo dự án hoặc hợp đồng."
  },
  {
    "id": "labor.care_economy",
    "category": "labor",
    "name": "Kinh tế chăm sóc",
    "description": "Hoạt động chăm sóc trẻ em, người cao tuổi và hỗ trợ đời sống, có hoặc không có trả công."
  },
  {
    "id": "labor.volunteer_economy",
    "category": "labor",
    "name": "Kinh tế tình nguyện",
    "description": "Giá trị dịch vụ được tạo ra thông qua lao động tự nguyện không nhận lương."
  },
  {
    "id": "finance.bank_based",
    "category": "finance",
    "name": "Hệ thống tài chính dựa vào ngân hàng",
    "description": "Tín dụng ngân hàng là kênh cấp vốn chủ yếu cho doanh nghiệp và hộ gia đình."
  },
  {
    "id": "finance.market_based_finance",
    "category": "finance",
    "name": "Tài chính dựa vào thị trường vốn",
    "description": "Doanh nghiệp huy động vốn chủ yếu qua cổ phiếu, trái phiếu và thị trường chứng khoán."
  },
  {
    "id": "finance.islamic_finance",
    "category": "finance",
    "name": "Tài chính Hồi giáo",
    "description": "Giao dịch tài chính tuân theo nguyên tắc Sharia, hạn chế lãi suất và nhấn mạnh chia sẻ rủi ro."
  },
  {
    "id": "finance.microfinance",
    "category": "finance",
    "name": "Tài chính vi mô",
    "description": "Dịch vụ tiết kiệm, tín dụng và bảo hiểm quy mô nhỏ phục vụ nhóm ít tiếp cận ngân hàng."
  },
  {
    "id": "finance.community_finance",
    "category": "finance",
    "name": "Tài chính cộng đồng",
    "description": "Nguồn vốn được huy động và phân bổ thông qua tổ chức cộng đồng."
  },
  {
    "id": "finance.mutual_credit",
    "category": "finance",
    "name": "Tín dụng tương hỗ",
    "description": "Các thành viên tạo tín dụng lẫn nhau dựa trên giao dịch và hạn mức thống nhất."
  },
  {
    "id": "finance.crowdfunding",
    "category": "finance",
    "name": "Tài trợ cộng đồng",
    "description": "Nhiều cá nhân góp khoản vốn nhỏ cho dự án hoặc doanh nghiệp."
  },
  {
    "id": "finance.venture_capital",
    "category": "finance",
    "name": "Vốn đầu tư mạo hiểm",
    "description": "Nhà đầu tư góp vốn vào doanh nghiệp tăng trưởng cao, chấp nhận rủi ro lớn."
  },
  {
    "id": "finance.public_finance",
    "category": "finance",
    "name": "Tài chính công",
    "description": "Nhà nước huy động thu ngân sách và phân bổ chi tiêu cho hàng hóa, dịch vụ công."
  },
  {
    "id": "finance.cooperative_banking",
    "category": "finance",
    "name": "Ngân hàng hợp tác",
    "description": "Tổ chức tín dụng thuộc sở hữu thành viên, phục vụ cộng đồng hoặc nhóm nghề nghiệp."
  },
  {
    "id": "trade.free_trade",
    "category": "trade",
    "name": "Thương mại tự do",
    "description": "Hạn chế thuế quan và rào cản để thúc đẩy trao đổi xuyên biên giới."
  },
  {
    "id": "trade.protectionism",
    "category": "trade",
    "name": "Chủ nghĩa bảo hộ thương mại",
    "description": "Dùng thuế quan, hạn ngạch hoặc tiêu chuẩn để bảo vệ ngành trong nước."
  },
  {
    "id": "trade.export_led",
    "category": "trade",
    "name": "Mô hình tăng trưởng hướng xuất khẩu",
    "description": "Năng lực sản xuất và nhu cầu nước ngoài là động lực tăng trưởng quan trọng."
  },
  {
    "id": "trade.import_substitution",
    "category": "trade",
    "name": "Công nghiệp hóa thay thế nhập khẩu",
    "description": "Phát triển sản xuất nội địa để thay thế hàng hóa nhập khẩu."
  },
  {
    "id": "trade.global_value_chains",
    "category": "trade",
    "name": "Chuỗi giá trị toàn cầu",
    "description": "Các công đoạn thiết kế, sản xuất và phân phối đặt tại nhiều quốc gia."
  },
  {
    "id": "trade.regional_integration",
    "category": "trade",
    "name": "Hội nhập kinh tế khu vực",
    "description": "Các nền kinh tế giảm rào cản và phối hợp chính sách trong một khu vực."
  },
  {
    "id": "trade.fair_trade",
    "category": "trade",
    "name": "Thương mại công bằng",
    "description": "Giao dịch chú trọng điều kiện lao động, giá hợp lý và lợi ích nhà sản xuất nhỏ."
  },
  {
    "id": "trade.ethical_trade",
    "category": "trade",
    "name": "Thương mại có đạo đức",
    "description": "Chuỗi cung ứng áp dụng tiêu chuẩn về quyền lao động, môi trường và minh bạch."
  },
  {
    "id": "trade.commodity_economy",
    "category": "trade",
    "name": "Kinh tế hàng hóa",
    "description": "Sản phẩm được sản xuất chủ yếu để trao đổi trên thị trường."
  },
  {
    "id": "trade.cross_border_digital",
    "category": "trade",
    "name": "Thương mại số xuyên biên giới",
    "description": "Hàng hóa hoặc dịch vụ được tiếp thị, đặt mua và cung cấp qua hạ tầng số quốc tế."
  },
  {
    "id": "welfare.welfare_state",
    "category": "welfare",
    "name": "Nhà nước phúc lợi",
    "description": "Nhà nước cung cấp bảo hiểm xã hội và dịch vụ thiết yếu để giảm rủi ro, bất bình đẳng."
  },
  {
    "id": "welfare.universal_basic_services",
    "category": "welfare",
    "name": "Dịch vụ cơ bản phổ quát",
    "description": "Mọi người được tiếp cận các dịch vụ thiết yếu như y tế, giáo dục, giao thông."
  },
  {
    "id": "welfare.basic_income",
    "category": "welfare",
    "name": "Thu nhập cơ bản",
    "description": "Cá nhân nhận khoản tiền định kỳ không kèm điều kiện lao động."
  },
  {
    "id": "welfare.negative_income_tax",
    "category": "welfare",
    "name": "Thuế thu nhập âm",
    "description": "Hệ thống thuế chuyển khoản hỗ trợ cho người có thu nhập dưới ngưỡng."
  },
  {
    "id": "welfare.redistributive_economy",
    "category": "welfare",
    "name": "Kinh tế tái phân phối",
    "description": "Thuế và chuyển giao điều chỉnh phân phối thu nhập, tài sản."
  },
  {
    "id": "welfare.inclusive_economy",
    "category": "welfare",
    "name": "Kinh tế bao trùm",
    "description": "Mở rộng cơ hội tham gia và hưởng lợi cho nhóm dễ bị loại trừ."
  },
  {
    "id": "welfare.social_market_economy",
    "category": "welfare",
    "name": "Kinh tế thị trường xã hội",
    "description": "Cạnh tranh thị trường kết hợp chính sách xã hội và bảo vệ người lao động."
  },
  {
    "id": "welfare.community_development",
    "category": "welfare",
    "name": "Kinh tế phát triển cộng đồng",
    "description": "Nguồn lực và quyết định phát triển được huy động từ cộng đồng địa phương."
  },
  {
    "id": "welfare.public_service_economy",
    "category": "welfare",
    "name": "Kinh tế dịch vụ công",
    "description": "Dịch vụ thiết yếu được tổ chức theo mục tiêu tiếp cận phổ quát thay vì tối đa hóa lợi nhuận."
  },
  {
    "id": "welfare.solidarity_purchasing",
    "category": "welfare",
    "name": "Mua sắm đoàn kết",
    "description": "Người tiêu dùng phối hợp mua hàng để hỗ trợ nhà sản xuất và mục tiêu xã hội."
  },
  {
    "id": "digital.digital_economy",
    "category": "digital",
    "name": "Kinh tế số",
    "description": "Dữ liệu, phần mềm, kết nối và hạ tầng số tham gia sâu vào sản xuất, phân phối."
  },
  {
    "id": "digital.data_economy",
    "category": "digital",
    "name": "Kinh tế dữ liệu",
    "description": "Dữ liệu được thu thập, quản trị, phân tích và trao đổi để tạo giá trị."
  },
  {
    "id": "digital.creator_economy",
    "category": "digital",
    "name": "Kinh tế nhà sáng tạo",
    "description": "Cá nhân kiếm thu nhập từ nội dung, cộng đồng và sản phẩm số."
  },
  {
    "id": "digital.attention_economy",
    "category": "digital",
    "name": "Kinh tế chú ý",
    "description": "Sự chú ý hữu hạn của người dùng trở thành nguồn lực cạnh tranh và doanh thu."
  },
  {
    "id": "digital.api_economy",
    "category": "digital",
    "name": "Kinh tế API",
    "description": "Doanh nghiệp tạo giá trị bằng cách cung cấp và kết nối dịch vụ qua giao diện lập trình."
  },
  {
    "id": "digital.open_source_economy",
    "category": "digital",
    "name": "Kinh tế mã nguồn mở",
    "description": "Phần mềm mở được phát triển cộng tác và tạo doanh thu qua dịch vụ, hỗ trợ hoặc sản phẩm."
  },
  {
    "id": "digital.token_economy",
    "category": "digital",
    "name": "Kinh tế token",
    "description": "Token kỹ thuật số biểu diễn quyền truy cập, tiện ích hoặc quyền lợi trong hệ thống."
  },
  {
    "id": "digital.blockchain_economy",
    "category": "digital",
    "name": "Kinh tế blockchain",
    "description": "Sổ cái phân tán hỗ trợ ghi nhận, xác minh và thực thi giao dịch."
  },
  {
    "id": "digital.machine_economy",
    "category": "digital",
    "name": "Kinh tế máy móc tự chủ",
    "description": "Thiết bị và phần mềm tự động trao đổi dữ liệu, dịch vụ hoặc thanh toán."
  },
  {
    "id": "digital.subscription_economy",
    "category": "digital",
    "name": "Kinh tế thuê bao",
    "description": "Khách hàng trả phí định kỳ để duy trì quyền truy cập sản phẩm hoặc dịch vụ."
  },
  {
    "id": "resources.agricultural_economy",
    "category": "resources",
    "name": "Kinh tế nông nghiệp",
    "description": "Đất đai, cây trồng, vật nuôi và chuỗi cung ứng nông sản giữ vai trò trung tâm."
  },
  {
    "id": "resources.agrarian_economy",
    "category": "resources",
    "name": "Kinh tế điền địa",
    "description": "Sở hữu đất và quan hệ sản xuất nông thôn định hình phân phối nguồn lực."
  },
  {
    "id": "resources.resource_extraction",
    "category": "resources",
    "name": "Kinh tế khai thác tài nguyên",
    "description": "Thu nhập phụ thuộc đáng kể vào khai thác khoáng sản, nhiên liệu hoặc tài nguyên tự nhiên."
  },
  {
    "id": "resources.rental_economy",
    "category": "resources",
    "name": "Kinh tế địa tô",
    "description": "Thu nhập chủ yếu đến từ quyền sở hữu và cho thuê tài sản hoặc tài nguyên khan hiếm."
  },
  {
    "id": "resources.regenerative_economy",
    "category": "resources",
    "name": "Kinh tế tái tạo",
    "description": "Hoạt động kinh tế hướng tới phục hồi vốn tự nhiên và năng lực hệ sinh thái."
  },
  {
    "id": "resources.low_carbon_economy",
    "category": "resources",
    "name": "Kinh tế carbon thấp",
    "description": "Giảm phát thải khí nhà kính thông qua công nghệ, năng lượng và thay đổi sản xuất."
  },
  {
    "id": "resources.bio_regional",
    "category": "resources",
    "name": "Kinh tế vùng sinh thái",
    "description": "Sản xuất và tiêu dùng được tổ chức theo giới hạn sinh thái và đặc trưng địa phương."
  },
  {
    "id": "resources.ecosystem_services",
    "category": "resources",
    "name": "Kinh tế dịch vụ hệ sinh thái",
    "description": "Định giá và quản trị lợi ích con người nhận từ hệ sinh thái."
  },
  {
    "id": "resources.energy_transition",
    "category": "resources",
    "name": "Kinh tế chuyển dịch năng lượng",
    "description": "Chuyển từ nhiên liệu phát thải cao sang hệ thống năng lượng sạch và hiệu quả."
  },
  {
    "id": "resources.degrowth",
    "category": "resources",
    "name": "Kinh tế hậu tăng trưởng/giảm tăng trưởng có chủ đích",
    "description": "Ưu tiên phúc lợi và giới hạn sinh thái thay vì tối đa hóa GDP vật chất."
  }
].map(form => Object.freeze(form)));
const BY_ID = new Map(FORMS.map(form => [form.id, form]));

function listForms(category) {
  if (category === undefined || category === null || category === "") return FORMS.slice();
  if (typeof category !== "string") throw new TypeError("category must be a string");
  return FORMS.filter(form => form.category === category.trim().toLowerCase());
}

function getForm(id) {
  if (typeof id !== "string") throw new TypeError("id must be a string");
  return BY_ID.get(id) || null;
}

function searchForms(query) {
  if (typeof query !== "string") throw new TypeError("query must be a string");
  const terms = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  return FORMS.filter(form => {
    const haystack = `${form.id} ${form.name} ${form.description} ${form.category}`.toLocaleLowerCase();
    return terms.every(term => haystack.includes(term));
  });
}

function getFormCategories() {
  return Object.freeze([...new Set(FORMS.map(form => form.category))]);
}

module.exports = Object.freeze({
  FORMS,
  FORM_COUNT: FORMS.length,
  getForm,
  listForms,
  searchForms,
  getFormCategories
});
