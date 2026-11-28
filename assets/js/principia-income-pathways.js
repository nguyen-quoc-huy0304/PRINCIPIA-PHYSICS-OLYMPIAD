(function (root) {
  'use strict';

  const CATEGORIES = Object.freeze({
    employment: 'Việc làm & nghề nghiệp',
    freelance: 'Freelance & dịch vụ',
    commerce: 'Bán hàng & thương mại',
    digital: 'Sản phẩm số & phần mềm',
    creator: 'Nội dung & cộng đồng',
    intellectual: 'Bản quyền & tài sản trí tuệ',
    rental: 'Cho thuê & tài sản',
    business: 'Sở hữu & vận hành doanh nghiệp',
    investment: 'Đầu tư & thị trường vốn',
    finance: 'Tài chính & cấp vốn',
    agriculture: 'Nông nghiệp & sản xuất',
    mobility: 'Vận tải & dịch vụ địa phương'
  });

  const RAW = [
    ['employment','Nhân viên toàn thời gian','Lương cố định, thưởng và phúc lợi theo hợp đồng lao động.','Thấp','Chuyên môn theo vị trí','Cao','Lương/thưởng','Thấp','Trung bình','Hợp đồng, thuế thu nhập và quyền lao động.'],
    ['employment','Nhân viên bán thời gian','Làm theo ca hoặc số giờ; phù hợp khi cần lịch linh hoạt.','Thấp','Kỷ luật, giao tiếp','Trung bình','Lương theo giờ/ca','Thấp','Thấp','Kiểm tra giờ làm, tiền công và điều kiện lao động.'],
    ['employment','Làm thêm giờ / ca đêm','Tăng thu nhập từ giờ làm thêm hợp pháp hoặc phụ cấp ca.','Không đáng kể','Chuyên môn công việc','Trung bình','Tiền công/phụ cấp','Thấp','Thấp','Tuân thủ giới hạn giờ làm và sức khỏe.'],
    ['employment','Thực tập có lương','Học nghề trong doanh nghiệp và nhận trợ cấp/lương thực tập.','Thấp','Nền tảng chuyên môn','Cao','Trợ cấp/lương','Thấp','Trung bình','Xác minh chương trình và thỏa thuận thực tập.'],
    ['employment','Học nghề có trả lương','Đào tạo nghề tại nơi làm việc, có thể nhận lương học việc.','Thấp','Sẵn sàng học nghề','Cao','Lương học việc','Thấp','Trung bình','Đối chiếu chứng chỉ và hợp đồng đào tạo.'],
    ['employment','Hoa hồng bán hàng','Nhận hoa hồng theo doanh số, khách hàng hoặc hợp đồng chốt được.','Thấp','Bán hàng, đàm phán','Cao','Hoa hồng','Trung bình','Cao','Kiểm tra cách tính, thời điểm trả và điều kiện hoàn hoa hồng.'],
    ['employment','Thưởng theo hiệu suất','Thu nhập biến đổi dựa trên KPI, chất lượng hoặc kết quả nhóm.','Thấp','Năng suất, chuyên môn','Cao','Thưởng KPI','Trung bình','Trung bình','Không coi thưởng chưa cam kết là thu nhập chắc chắn.'],
    ['employment','Làm việc từ xa cho công ty nước ngoài','Nhận lương từ nhà tuyển dụng quốc tế theo hợp đồng từ xa.','Thấp','Ngoại ngữ, chuyên môn','Cao','Lương ngoại tệ/nội tệ','Trung bình','Cao','Thuế, tỷ giá, hợp đồng xuyên biên giới và bảo mật.'],
    ['employment','Làm việc theo dự án / hợp đồng','Thực hiện một dự án theo thời hạn, phạm vi và phí đã thỏa thuận.','Thấp','Quản lý dự án','Trung bình','Phí hợp đồng','Trung bình','Cao','Nêu rõ nghiệm thu, sở hữu sản phẩm và điều khoản thanh toán.'],
    ['employment','Giảng dạy tại cơ sở đào tạo','Dạy học tại trường, trung tâm hoặc tổ chức đào tạo.','Thấp','Kiến thức, sư phạm','Cao','Lương/tiết dạy','Thấp','Trung bình','Yêu cầu bằng cấp, giấy phép và bảo vệ người học khi áp dụng.'],

    ['freelance','Thiết kế đồ họa','Thiết kế logo, nhận diện, ấn phẩm, banner và tài liệu thương hiệu.','Thấp–trung bình','Thiết kế, portfolio','Trung bình','Phí theo sản phẩm/dự án','Trung bình','Cao','Quy định số vòng sửa, quyền sử dụng và bàn giao file.'],
    ['freelance','Lập trình phần mềm','Xây website, ứng dụng, API, tự động hóa hoặc tích hợp hệ thống.','Thấp–trung bình','Lập trình, kiểm thử','Cao','Phí dự án/bảo trì','Trung bình','Rất cao','Bảo mật, phạm vi, nghiệm thu và bảo trì.'],
    ['freelance','Phân tích dữ liệu','Làm sạch dữ liệu, dashboard, báo cáo và mô hình phân tích.','Thấp','SQL, thống kê, trực quan hóa','Trung bình','Phí dự án/giờ','Trung bình','Cao','Bảo mật dữ liệu và không đưa ra kết luận vượt dữ liệu.'],
    ['freelance','Viết nội dung / copywriting','Viết bài, nội dung bán hàng, email, tài liệu và kịch bản.','Thấp','Viết, nghiên cứu','Trung bình','Phí bài/gói nội dung','Trung bình','Cao','Kiểm chứng thông tin, bản quyền và nội dung quảng cáo.'],
    ['freelance','Biên dịch / phiên dịch','Dịch tài liệu, phụ đề, cuộc họp hoặc nội dung chuyên ngành.','Thấp','Ngoại ngữ, thuật ngữ','Trung bình','Phí từ/giờ/dự án','Thấp–trung bình','Cao','Bảo mật, độ chính xác và chứng nhận với tài liệu đặc thù.'],
    ['freelance','Dựng video / hậu kỳ','Biên tập video, motion graphics, âm thanh và phụ đề.','Thấp–trung bình','Dựng phim, kể chuyện','Trung bình','Phí video/dự án','Trung bình','Cao','Quyền nhạc, footage, font và thời hạn chỉnh sửa.'],
    ['freelance','Chụp ảnh / quay phim','Cung cấp ảnh sản phẩm, sự kiện, chân dung hoặc video thương mại.','Trung bình','Nhiếp ảnh, thiết bị','Trung bình','Phí buổi/gói','Trung bình','Cao','Hợp đồng, quyền hình ảnh, giấy phép địa điểm.'],
    ['freelance','Tư vấn chuyên môn','Bán thời gian tư vấn theo kinh nghiệm và năng lực đã chứng minh.','Thấp','Chuyên môn sâu','Trung bình','Phí giờ/gói','Trung bình','Cao','Không tư vấn lĩnh vực cần giấy phép nếu chưa đủ điều kiện.'],
    ['freelance','Gia sư cá nhân','Dạy một-kèm-một hoặc nhóm nhỏ theo môn học/kỹ năng.','Thấp','Kiến thức, sư phạm','Trung bình','Phí buổi/tháng','Thấp','Trung bình','Minh bạch học phí, lịch học và bảo vệ trẻ em.'],
    ['freelance','Huấn luyện thể chất','Hướng dẫn tập luyện theo mục tiêu và năng lực người học.','Trung bình','Chứng chỉ, kiến thức an toàn','Trung bình','Phí buổi/gói','Trung bình','Cao','Sàng lọc an toàn; không thay thế tư vấn y tế.'],
    ['freelance','Sửa chữa điện tử / máy tính','Chẩn đoán, sửa chữa, nâng cấp và bảo trì thiết bị.','Trung bình','Kỹ thuật, dụng cụ','Trung bình','Phí công/linh kiện','Trung bình','Cao','An toàn điện, bảo hành và quyền riêng tư dữ liệu.'],
    ['freelance','Dịch vụ vệ sinh / dọn dẹp','Dọn nhà, văn phòng, vệ sinh chuyên sâu theo lịch.','Thấp–trung bình','Quy trình, độ tin cậy','Trung bình','Phí theo giờ/diện tích','Thấp–trung bình','Trung bình','An toàn hóa chất, trách nhiệm tài sản và bảo hiểm phù hợp.'],

    ['commerce','Bán lẻ cửa hàng','Mua hàng từ nhà cung cấp và bán trực tiếp cho khách.','Trung bình–cao','Bán hàng, tồn kho','Cao','Biên lợi nhuận','Cao','Cao','Giấy phép, thuế, hàng giả và quản lý tồn kho.'],
    ['commerce','Cửa hàng thương mại điện tử','Bán sản phẩm qua website hoặc sàn trực tuyến.','Thấp–trung bình','Marketing, vận hành','Trung bình','Biên lợi nhuận','Cao','Rất cao','Chính sách sàn, bảo vệ người tiêu dùng và hoàn trả.'],
    ['commerce','Bán hàng qua mạng xã hội','Tìm khách và chốt đơn qua mạng xã hội, livestream hoặc tin nhắn.','Thấp','Nội dung, chăm sóc khách','Trung bình','Biên lợi nhuận','Trung bình','Cao','Công khai giá, nguồn gốc, quảng cáo và dữ liệu khách hàng.'],
    ['commerce','Dropshipping','Bán hàng, nhà cung cấp thực hiện lưu kho và giao hàng.','Thấp','Marketing, chọn nhà cung cấp','Trung bình','Biên lợi nhuận','Cao','Cao','Người bán vẫn chịu trách nhiệm với khách; kiểm soát chất lượng và hoàn hàng.'],
    ['commerce','Print-on-demand','In áo, cốc, poster theo đơn; không cần trữ nhiều hàng.','Thấp','Thiết kế, marketing','Trung bình','Biên lợi nhuận/đơn','Trung bình','Cao','Tránh sử dụng hình ảnh, nhãn hiệu không có quyền.'],
    ['commerce','Bán buôn / phân phối','Mua số lượng lớn và phân phối cho đại lý/cửa hàng.','Cao','Nguồn hàng, logistics','Cao','Biên lợi nhuận/chiết khấu','Cao','Cao','Công nợ, chất lượng, hợp đồng và vốn lưu động.'],
    ['commerce','Nhập khẩu / xuất khẩu','Kinh doanh hàng hóa xuyên biên giới.','Cao','Ngoại thương, logistics','Cao','Biên thương mại','Cao','Rất cao','Hải quan, thuế, tiêu chuẩn hàng hóa, cấm vận và tỷ giá.'],
    ['commerce','Mua đi bán lại hàng đã qua sử dụng','Tìm nguồn hàng cũ, kiểm định, sửa nhẹ và bán lại.','Thấp–trung bình','Định giá, kiểm tra hàng','Trung bình','Chênh lệch mua-bán','Trung bình','Cao','Nguồn gốc hợp pháp, tình trạng và chính sách đổi trả.'],
    ['commerce','Bán đồ thủ công','Tự làm hoặc đặt làm sản phẩm thủ công để bán.','Thấp–trung bình','Chế tác, định giá','Trung bình','Biên lợi nhuận','Trung bình','Cao','An toàn sản phẩm, bản quyền mẫu và chi phí thời gian.'],
    ['commerce','Bán thực phẩm / đồ uống','Sản xuất hoặc kinh doanh đồ ăn, thức uống.','Trung bình','Chế biến, dịch vụ','Cao','Biên lợi nhuận','Cao','Cao','An toàn thực phẩm, nguồn gốc và giấy phép.'],
    ['commerce','Kinh doanh hàng theo mùa','Bán sản phẩm có nhu cầu theo mùa, lễ hội hoặc sự kiện.','Thấp–trung bình','Dự báo nhu cầu','Cao','Biên lợi nhuận theo mùa','Cao','Trung bình','Rủi ro tồn kho và hàng hết mùa.'],

    ['digital','Bán ebook / sách điện tử','Tạo sách hướng dẫn, tài liệu chuyên môn hoặc truyện số.','Thấp','Viết, biên tập','Trung bình','Bán bản quyền/bản tải','Thấp–trung bình','Rất cao','Bản quyền nội dung, cập nhật và hoàn tiền.'],
    ['digital','Bán khóa học trực tuyến','Đóng gói kiến thức thành bài học, bài tập và đánh giá.','Thấp–trung bình','Chuyên môn, sư phạm','Cao','Bán khóa học','Trung bình','Rất cao','Không cam kết kết quả phi thực tế; bảo vệ dữ liệu học viên.'],
    ['digital','Bán template / tài nguyên thiết kế','Bán mẫu trình chiếu, tài liệu, giao diện, preset và bộ thiết kế.','Thấp','Thiết kế, đóng gói','Trung bình','Bán lượt tải/license','Thấp–trung bình','Rất cao','License tài nguyên và mô tả phạm vi sử dụng.'],
    ['digital','Bán plugin / extension','Phát triển tiện ích cho trình duyệt, CMS hoặc phần mềm.','Trung bình','Lập trình, hỗ trợ','Cao','Bán license/subscription','Trung bình','Rất cao','Bảo mật, tương thích và chính sách nền tảng.'],
    ['digital','Phần mềm SaaS','Cung cấp phần mềm trực tuyến theo thuê bao.','Trung bình–cao','Phát triển, vận hành','Cao','Thuê bao định kỳ','Cao','Rất cao','Bảo mật, uptime, quyền riêng tư và churn.'],
    ['digital','Ứng dụng di động trả phí','Bán ứng dụng hoặc tính năng cao cấp trên cửa hàng ứng dụng.','Trung bình','Phát triển app','Cao','Bán app/IAP','Cao','Rất cao','Quy định store, dữ liệu cá nhân và hoàn tiền.'],
    ['digital','API-as-a-Service','Bán quyền truy cập API theo mức sử dụng hoặc gói thuê bao.','Trung bình','Backend, hạ tầng','Cao','Phí gọi API/subscription','Cao','Rất cao','Rate limit, bảo mật, SLA và chi phí hạ tầng.'],
    ['digital','Micro-SaaS','Giải quyết một vấn đề hẹp bằng phần mềm nhỏ, tập trung.','Thấp–trung bình','Lập trình, tìm thị trường','Trung bình','Thuê bao','Trung bình','Rất cao','Xác thực nhu cầu và hỗ trợ liên tục.'],
    ['digital','Bán dữ liệu / báo cáo được cấp quyền','Cung cấp bộ dữ liệu hoặc báo cáo có quyền khai thác hợp pháp.','Trung bình','Phân tích, quản trị dữ liệu','Trung bình','License/gói báo cáo','Trung bình','Cao','Quyền thu thập, dữ liệu cá nhân và nguồn gốc.'],
    ['digital','Bán game / nội dung game','Bán trò chơi, DLC, vật phẩm hợp lệ hoặc nội dung mở rộng.','Trung bình–cao','Phát triển game','Cao','Bán game/DLC','Cao','Rất cao','Điều khoản nền tảng, loot box và bảo vệ người chơi.'],

    ['creator','Kênh video quảng cáo','Tạo video và nhận chia sẻ doanh thu quảng cáo khi đủ điều kiện.','Thấp–trung bình','Sản xuất nội dung','Cao','Quảng cáo','Trung bình','Rất cao','Điều kiện kiếm tiền, nhạc/bản quyền và nội dung tài trợ.'],
    ['creator','Livestream nhận quà / donate','Phát trực tiếp và nhận ủng hộ tự nguyện từ người xem.','Thấp','Giao tiếp, lịch phát','Cao','Donate/quà tặng','Trung bình','Cao','Quy tắc nền tảng, thuế và minh bạch mục đích quyên góp.'],
    ['creator','Podcast tài trợ','Xuất bản podcast và nhận phí tài trợ hoặc quảng cáo.','Thấp–trung bình','Âm thanh, phỏng vấn','Cao','Tài trợ/quảng cáo','Trung bình','Cao','Công bố nội dung quảng cáo và quyền âm thanh.'],
    ['creator','Blog / website quảng cáo','Xuất bản nội dung có giá trị và kiếm tiền từ quảng cáo hiển thị.','Thấp–trung bình','Viết, SEO','Cao','Quảng cáo','Trung bình','Cao','Cookie, quyền riêng tư và nội dung nguyên bản.'],
    ['creator','Affiliate marketing','Giới thiệu sản phẩm/dịch vụ và nhận hoa hồng từ giao dịch hợp lệ.','Thấp','Nội dung, phân tích','Trung bình','Hoa hồng giới thiệu','Trung bình','Cao','Công bố liên kết tiếp thị; không spam hoặc quảng cáo sai.'],
    ['creator','Newsletter trả phí','Gửi nội dung chuyên sâu định kỳ cho người đăng ký trả phí.','Thấp','Nghiên cứu, viết','Trung bình','Phí thành viên','Thấp–trung bình','Cao','Quyền riêng tư, hủy đăng ký và tính chính xác.'],
    ['creator','Cộng đồng thành viên','Thu phí tham gia cộng đồng có tài liệu, sự kiện hoặc hỗ trợ.','Thấp–trung bình','Quản trị cộng đồng','Cao','Membership','Trung bình','Cao','Quy tắc cộng đồng, bảo vệ thành viên và cam kết rõ ràng.'],
    ['creator','Livestream bán hàng','Trình diễn sản phẩm và chốt đơn trực tiếp qua livestream.','Thấp–trung bình','Bán hàng, trình bày','Trung bình','Biên lợi nhuận/hoa hồng','Trung bình','Cao','Thông tin sản phẩm trung thực và quy định thương mại điện tử.'],
    ['creator','UGC cho thương hiệu','Sản xuất video/ảnh dạng nội dung người dùng cho nhãn hàng.','Thấp','Quay dựng, sáng tạo','Trung bình','Phí nội dung','Thấp–trung bình','Cao','Quyền sử dụng hình ảnh, thời hạn và phạm vi quảng cáo.'],
    ['creator','Tài trợ thương hiệu / đại sứ','Nhận phí để giới thiệu thương hiệu theo hợp đồng.','Thấp','Uy tín, nội dung','Cao','Phí tài trợ','Trung bình','Cao','Công khai tài trợ và không đưa tuyên bố sai lệch.'],

    ['intellectual','Bản quyền sách / truyện','Nhận tiền từ việc cấp phép xuất bản hoặc bán quyền tác phẩm.','Thấp','Sáng tác','Cao','Royalty/bản quyền','Thấp–trung bình','Rất cao','Đăng ký, chứng minh quyền tác giả và hợp đồng cấp phép.'],
    ['intellectual','Bản quyền âm nhạc','Nhận tiền từ sáng tác, biểu diễn, ghi âm hoặc cấp phép nhạc.','Trung bình','Sáng tác, sản xuất','Cao','Royalty/license','Trung bình','Rất cao','Phân chia quyền tác giả, quyền liên quan và mẫu âm thanh.'],
    ['intellectual','Cấp phép ảnh / video stock','Cấp phép sử dụng ảnh, video hoặc footage tự tạo.','Thấp–trung bình','Nhiếp ảnh, quay phim','Cao','Phí license','Thấp–trung bình','Cao','Model release, quyền địa điểm và tài sản xuất hiện.'],
    ['intellectual','Cấp phép bằng sáng chế','Cấp quyền khai thác sáng chế theo hợp đồng.','Cao','Nghiên cứu, pháp lý IP','Cao','Phí license/royalty','Trung bình','Rất cao','Tình trạng bảo hộ, phạm vi lãnh thổ và hiệu lực bằng.'],
    ['intellectual','Cấp phép nhãn hiệu / thương hiệu','Cho đối tác sử dụng thương hiệu theo điều kiện kiểm soát.','Trung bình','Xây dựng thương hiệu','Cao','Royalty/phí cấp phép','Trung bình','Cao','Đăng ký nhãn hiệu, tiêu chuẩn chất lượng và giám sát.'],
    ['intellectual','Bán font / bộ icon / UI kit','Bán tài sản thiết kế số do mình sở hữu.','Thấp','Thiết kế','Trung bình','Bán license','Thấp','Rất cao','Kiểm tra license font, thư viện và tài nguyên nền.'],
    ['intellectual','Bán mô hình 3D / asset game','Bán model, texture, animation hoặc asset tự tạo.','Thấp–trung bình','3D, kỹ thuật','Trung bình','Bán asset/license','Thấp–trung bình','Cao','Quyền với texture, plugin và nội dung bên thứ ba.'],
    ['intellectual','Franchise / nhượng quyền thương hiệu','Cấp quyền kinh doanh theo thương hiệu và quy trình chuẩn hóa.','Cao','Hệ thống hóa, pháp lý','Cao','Phí nhượng quyền/royalty','Cao','Rất cao','Công bố thông tin và hợp đồng theo luật áp dụng.'],

    ['rental','Cho thuê phòng / nhà ở','Cho thuê bất động sản dài hạn hoặc theo kỳ hợp pháp.','Cao','Quản lý tài sản','Trung bình','Tiền thuê','Trung bình','Trung bình','Quyền sở hữu, hợp đồng, thuế và an toàn cư trú.'],
    ['rental','Cho thuê mặt bằng / văn phòng','Cho doanh nghiệp thuê địa điểm kinh doanh hoặc làm việc.','Rất cao','Quản lý bất động sản','Trung bình','Tiền thuê','Trung bình','Trung bình','Pháp lý xây dựng, PCCC và điều khoản thuê.'],
    ['rental','Cho thuê kho / bãi','Cung cấp không gian lưu trữ hàng hóa hoặc thiết bị.','Rất cao','Vận hành kho','Trung bình','Tiền thuê/phí lưu kho','Trung bình','Cao','PCCC, bảo hiểm, an ninh và trách nhiệm hàng hóa.'],
    ['rental','Cho thuê xe / phương tiện','Cho thuê xe máy, ô tô hoặc phương tiện đủ điều kiện.','Cao','Quản lý phương tiện','Trung bình','Tiền thuê','Cao','Cao','Đăng kiểm, bảo hiểm, bằng lái và hợp đồng.'],
    ['rental','Cho thuê thiết bị / máy móc','Cho thuê máy ảnh, công cụ, máy công trình hoặc thiết bị chuyên dụng.','Trung bình–cao','Bảo trì, định giá','Trung bình','Phí thuê','Trung bình','Cao','Đặt cọc, kiểm kê, bảo hiểm và hao mòn.'],
    ['rental','Cho thuê đồ sự kiện','Cho thuê bàn ghế, âm thanh, ánh sáng, trang trí và đạo cụ.','Trung bình','Logistics, bảo trì','Trung bình','Phí thuê/gói','Trung bình','Cao','Kiểm kê, vận chuyển và trách nhiệm hư hỏng.'],
    ['rental','Cho thuê đất nông nghiệp','Cho thuê quyền sử dụng đất theo quy định và hợp đồng.','Cao','Quản lý đất','Thấp','Tiền thuê','Thấp–trung bình','Trung bình','Quyền sử dụng đất và mục đích sử dụng được phép.'],
    ['rental','Cho thuê chỗ đỗ xe','Khai thác bãi đỗ xe hoặc chỗ đỗ riêng.','Cao','Vận hành địa điểm','Thấp','Phí theo giờ/tháng','Trung bình','Trung bình','Quy hoạch, an toàn và phòng cháy chữa cháy.'],

    ['business','Mở cửa hàng chuyên doanh','Xây dựng cửa hàng tập trung vào một nhóm sản phẩm.','Trung bình–cao','Bán lẻ, quản lý','Cao','Biên lợi nhuận','Cao','Cao','Vốn lưu động, tồn kho và giấy phép.'],
    ['business','Nhà hàng / quán cà phê','Bán dịch vụ ăn uống tại chỗ hoặc mang đi.','Cao','Ẩm thực, vận hành','Cao','Doanh thu món/đồ uống','Cao','Cao','An toàn thực phẩm, nhân sự, mặt bằng và hao hụt.'],
    ['business','Agency dịch vụ','Tổ chức đội ngũ cung cấp marketing, thiết kế, phần mềm hoặc truyền thông.','Trung bình','Bán hàng, quản lý đội ngũ','Cao','Phí retainer/dự án','Cao','Rất cao','Hợp đồng khách hàng, chất lượng và quản trị nhân sự.'],
    ['business','Marketplace / sàn trung gian','Kết nối người mua và người bán, thu phí giao dịch hoặc dịch vụ.','Cao','Công nghệ, vận hành','Cao','Phí giao dịch/quảng cáo','Cao','Rất cao','Thanh toán, gian lận, tranh chấp và hiệu ứng mạng lưới.'],
    ['business','Mô hình subscription','Bán quyền truy cập hoặc hàng hóa định kỳ theo gói.','Trung bình','Sản phẩm, chăm sóc khách','Trung bình','Doanh thu định kỳ','Trung bình','Rất cao','Hủy gói, churn, gia hạn và minh bạch thanh toán.'],
    ['business','Mô hình freemium','Cung cấp bản miễn phí và thu tiền từ tính năng nâng cao.','Trung bình–cao','Sản phẩm số, phân tích','Cao','Nâng cấp trả phí','Cao','Rất cao','Chi phí người dùng miễn phí và chuyển đổi trả phí.'],
    ['business','B2B cung cấp cho doanh nghiệp','Bán sản phẩm/dịch vụ theo hợp đồng cho tổ chức.','Trung bình–cao','Bán hàng B2B','Cao','Hợp đồng/định kỳ','Trung bình','Rất cao','Chu kỳ bán dài, công nợ và SLA.'],
    ['business','B2C bán trực tiếp người tiêu dùng','Phát triển sản phẩm/dịch vụ bán trực tiếp cho cá nhân.','Trung bình','Marketing, trải nghiệm khách','Cao','Doanh thu bán lẻ','Cao','Cao','Chi phí thu hút khách và dịch vụ sau bán.'],
    ['business','B2B2C qua đối tác','Tiếp cận khách hàng cuối qua doanh nghiệp trung gian.','Trung bình','Quan hệ đối tác','Cao','Chia sẻ doanh thu','Trung bình','Cao','Phụ thuộc đối tác và phân chia dữ liệu/doanh thu.'],
    ['business','Mua doanh nghiệp đang hoạt động','Mua lại cơ sở có khách hàng, nhân sự và dòng tiền hiện hữu.','Rất cao','Thẩm định, quản trị','Cao','Dòng tiền doanh nghiệp','Rất cao','Cao','Due diligence pháp lý, thuế, nợ và phụ thuộc chủ cũ.'],
    ['business','Mua và cải thiện doanh nghiệp nhỏ','Chuẩn hóa quy trình, công nghệ và bán hàng để tăng lợi nhuận.','Rất cao','Vận hành, tài chính','Cao','Lợi nhuận/dòng tiền','Rất cao','Cao','Rủi ro tích hợp, nhân sự và vốn vay.'],
    ['business','Kinh doanh dịch vụ định kỳ','Bảo trì, vệ sinh, chăm sóc hoặc hỗ trợ theo hợp đồng tháng/năm.','Trung bình','Vận hành, chăm sóc khách','Trung bình','Phí định kỳ','Trung bình','Cao','Chất lượng dịch vụ và chi phí nhân sự.'],

    ['investment','Cổ phiếu nhận cổ tức / tăng giá','Sở hữu cổ phần; lợi nhuận có thể đến từ cổ tức và biến động giá.','Trung bình','Phân tích doanh nghiệp','Thấp','Cổ tức/lãi vốn','Cao','Cao','Có thể mất vốn; cổ tức không được bảo đảm.'],
    ['investment','ETF / quỹ chỉ số','Đầu tư theo rổ tài sản và chỉ số thông qua quỹ.','Thấp–trung bình','Phân bổ tài sản','Thấp','Tăng giá/phân phối','Trung bình','Cao','Rủi ro thị trường, tracking error và phí.'],
    ['investment','Quỹ mở / quỹ tương hỗ','Góp vốn vào danh mục do công ty quản lý quỹ vận hành.','Thấp–trung bình','Đánh giá quỹ','Thấp','Tăng NAV/phân phối','Trung bình','Trung bình','Đọc bản cáo bạch, phí và thời gian thanh toán.'],
    ['investment','Trái phiếu chính phủ','Cho chính phủ vay theo kỳ hạn và điều khoản phát hành.','Trung bình','Hiểu lãi suất','Thấp','Coupon/lợi suất','Thấp–trung bình','Trung bình','Lạm phát, lãi suất, tỷ giá và điều kiện phát hành.'],
    ['investment','Trái phiếu doanh nghiệp','Cho doanh nghiệp vay thông qua chứng khoán nợ.','Trung bình','Phân tích tín dụng','Thấp','Coupon','Cao','Trung bình','Rủi ro vỡ nợ, tài sản bảo đảm và thanh khoản.'],
    ['investment','Tiền gửi / chứng chỉ tiền gửi','Nhận lãi theo kỳ hạn tại tổ chức tín dụng hợp pháp.','Thấp','So sánh lãi suất','Thấp','Tiền lãi','Thấp','Thấp','Điều kiện bảo hiểm tiền gửi và rút trước hạn.'],
    ['investment','Bất động sản cho thuê','Đầu tư tài sản để thu tiền thuê và có thể tăng giá.','Rất cao','Định giá, quản lý tài sản','Thấp','Tiền thuê/lãi vốn','Cao','Trung bình','Đòn bẩy, trống phòng, sửa chữa và pháp lý.'],
    ['investment','Vàng / kim loại quý','Nắm giữ tài sản vật chất hoặc sản phẩm đầu tư phù hợp pháp luật.','Trung bình','Theo dõi thị trường','Thấp','Chênh lệch giá','Cao','Trung bình','Không tạo dòng tiền tự thân; spread và lưu trữ.'],
    ['investment','Quỹ REIT / bất động sản niêm yết','Đầu tư gián tiếp vào danh mục bất động sản tạo dòng tiền.','Trung bình','Phân tích quỹ','Thấp','Phân phối/tăng giá','Trung bình–cao','Cao','Lãi suất, nợ và chất lượng tài sản.'],
    ['investment','Quỹ hưu trí / đầu tư dài hạn','Tích lũy theo chương trình dài hạn có quy định cụ thể.','Thấp–trung bình','Kỷ luật tài chính','Thấp','Tăng trưởng dài hạn','Trung bình','Trung bình','Điều kiện rút, phí và rủi ro thị trường.'],
    ['investment','Đầu tư thiên thần / startup','Góp vốn vào doanh nghiệp giai đoạn sớm để đổi lấy cổ phần.','Cao','Thẩm định startup','Thấp','Cổ phần/thoái vốn','Rất cao','Rất cao','Có thể mất toàn bộ vốn; thanh khoản rất thấp.'],
    ['investment','Private equity / góp vốn tư nhân','Đầu tư hoặc mua cổ phần doanh nghiệp chưa niêm yết.','Rất cao','Tài chính doanh nghiệp','Thấp','Cổ tức/thoái vốn','Rất cao','Cao','Thẩm định, quyền cổ đông và thời gian nắm giữ.'],
    ['investment','Cho vay có bảo đảm hợp pháp','Cho vay theo hợp đồng, tài sản bảo đảm và khả năng trả nợ được thẩm định.','Trung bình–cao','Thẩm định tín dụng','Thấp','Lãi vay','Cao','Trung bình','Tuân thủ quy định cho vay, lãi suất, thu hồi nợ.'],
    ['investment','Đầu tư hàng hóa / phái sinh','Giao dịch hợp đồng hàng hóa hoặc công cụ phái sinh được phép.','Trung bình–cao','Phân tích thị trường','Thấp','Lãi/lỗ giao dịch','Rất cao','Cao','Đòn bẩy có thể gây lỗ lớn; chỉ dùng đơn vị được cấp phép.'],

    ['finance','Góp vốn đối tác kinh doanh','Góp vốn theo tỷ lệ sở hữu và thỏa thuận phân chia lợi nhuận/rủi ro.','Trung bình–cao','Thẩm định, đàm phán','Thấp','Chia lợi nhuận','Rất cao','Cao','Hợp đồng, quyền kiểm soát, kế toán và cơ chế thoái vốn.'],
    ['finance','Gọi vốn cộng đồng hợp pháp','Huy động vốn từ nhiều người qua nền tảng và hình thức được phép.','Trung bình','Trình bày dự án','Trung bình','Vốn góp/tài trợ','Cao','Cao','Phân biệt quyên góp, cho vay và chứng khoán; tuân thủ giấy phép.'],
    ['finance','Tài trợ dự án / grant','Nhận tài trợ không hoàn lại theo tiêu chí của chương trình.','Thấp','Viết đề xuất, quản lý dự án','Cao','Khoản tài trợ','Thấp','Trung bình','Điều kiện sử dụng và báo cáo minh bạch.'],
    ['finance','Bán quyền sử dụng theo license','Cấp quyền sử dụng sản phẩm, nội dung hoặc công nghệ trong thời hạn.','Thấp–trung bình','Sở hữu tài sản IP','Trung bình','Phí license/royalty','Thấp','Rất cao','Quy định lãnh thổ, thời hạn, độc quyền và chấm dứt.'],
    ['finance','Phí giới thiệu khách hàng B2B','Kết nối khách hàng với nhà cung cấp và nhận phí giới thiệu minh bạch.','Thấp','Mạng lưới, giao tiếp','Trung bình','Phí giới thiệu','Thấp–trung bình','Cao','Công bố xung đột lợi ích và điều kiện trả phí.'],
    ['finance','Môi giới có giấy phép','Kết nối giao dịch trong ngành được quản lý và nhận hoa hồng hợp pháp.','Trung bình','Chứng chỉ, bán hàng','Trung bình','Hoa hồng','Trung bình','Cao','Chỉ hoạt động trong phạm vi giấy phép/chứng chỉ.'],
    ['finance','Quản lý tài sản / danh mục có ủy quyền','Quản lý tài sản khách hàng theo hợp đồng và khuôn khổ pháp lý.','Cao','Tài chính, quản trị rủi ro','Cao','Phí quản lý/hiệu suất','Cao','Cao','Yêu cầu cấp phép, ủy thác và nghĩa vụ ủy thác.'],

    ['agriculture','Trồng trọt thương mại','Trồng cây lương thực, rau, quả hoặc cây công nghiệp để bán.','Trung bình–cao','Canh tác, thị trường','Cao','Bán nông sản','Cao','Cao','Thời tiết, dịch bệnh, đầu ra và an toàn thực phẩm.'],
    ['agriculture','Chăn nuôi','Nuôi gia súc/gia cầm theo quy mô và chuỗi cung ứng.','Cao','Chăn nuôi, thú y','Cao','Bán vật nuôi/sản phẩm','Cao','Cao','Dịch bệnh, phúc lợi động vật, môi trường và giá thức ăn.'],
    ['agriculture','Nuôi trồng thủy sản','Nuôi cá, tôm hoặc thủy sản theo tiêu chuẩn và thị trường.','Cao','Thủy sản, quản lý nước','Cao','Bán sản lượng','Cao','Cao','Dịch bệnh, nguồn nước và tiêu chuẩn xuất khẩu.'],
    ['agriculture','Chế biến nông sản','Sơ chế, sấy, đóng gói hoặc chế biến để tăng giá trị sản phẩm.','Cao','Công nghệ thực phẩm','Cao','Biên chế biến','Cao','Cao','An toàn thực phẩm, truy xuất nguồn gốc và thiết bị.'],
    ['agriculture','Vườn ươm / bán giống','Sản xuất và bán cây giống, hạt giống hoặc vật tư nông nghiệp.','Trung bình','Sinh học, canh tác','Trung bình','Bán giống/vật tư','Trung bình','Cao','Chất lượng giống và chứng nhận khi cần.'],
    ['agriculture','Nông nghiệp hợp đồng','Sản xuất theo đơn đặt hàng/tiêu chuẩn với doanh nghiệp thu mua.','Trung bình–cao','Canh tác, hợp đồng','Cao','Giá hợp đồng','Trung bình','Cao','Điều khoản chất lượng, giá và rủi ro bên mua.'],
    ['agriculture','Du lịch nông trại','Kết hợp trải nghiệm, giáo dục và dịch vụ tham quan nông nghiệp.','Cao','Dịch vụ, nông nghiệp','Trung bình','Vé/gói trải nghiệm','Trung bình','Cao','An toàn khách, bảo hiểm và quy hoạch.'],

    ['mobility','Giao hàng / chuyển phát','Giao hàng theo đơn qua doanh nghiệp hoặc nền tảng hợp pháp.','Thấp–trung bình','Di chuyển, đúng giờ','Trung bình','Phí chuyến/đơn','Trung bình','Trung bình','An toàn giao thông, bảo hiểm và chi phí phương tiện.'],
    ['mobility','Vận tải hành khách','Chở khách theo tuyến hoặc hợp đồng với phương tiện đủ điều kiện.','Cao','Lái xe, điều phối','Cao','Cước chuyến','Cao','Cao','Giấy phép, đăng kiểm, bảo hiểm và an toàn.'],
    ['mobility','Dịch vụ chuyển nhà / vận chuyển','Vận chuyển đồ đạc, hàng hóa và dịch vụ bốc xếp.','Trung bình','Logistics, chăm sóc khách','Trung bình','Phí chuyến/gói','Trung bình','Cao','Trách nhiệm hư hỏng, bảo hiểm và hợp đồng.'],
    ['mobility','Dịch vụ sửa chữa tại nhà','Cung cấp sửa điện nước, lắp đặt hoặc bảo trì tận nơi.','Thấp–trung bình','Tay nghề kỹ thuật','Trung bình','Phí công/vật tư','Thấp–trung bình','Cao','An toàn, chứng chỉ nghề và bảo hành.'],
    ['mobility','Chăm sóc thú cưng','Trông giữ, dắt đi dạo, vệ sinh hoặc chăm sóc thú cưng.','Thấp–trung bình','Chăm sóc động vật','Trung bình','Phí dịch vụ','Thấp–trung bình','Cao','An toàn động vật, tiêm phòng và trách nhiệm trông giữ.'],
    ['mobility','Dịch vụ tổ chức sự kiện','Lập kế hoạch, điều phối, trang trí và vận hành sự kiện.','Trung bình','Quản lý, nhà cung cấp','Cao','Phí tổ chức','Trung bình','Cao','Hợp đồng, giấy phép địa điểm và an toàn sự kiện.'],
    ['mobility','Dịch vụ chăm sóc người cao tuổi tại nhà','Hỗ trợ sinh hoạt không thuộc phạm vi y tế nếu chưa đủ điều kiện.','Thấp–trung bình','Chăm sóc, giao tiếp','Cao','Phí theo giờ/gói','Thấp–trung bình','Trung bình','Kiểm tra nhân thân, an toàn và giới hạn nghiệp vụ.'],
    ['employment','Làm việc theo ca cuối tuần','Nhận ca vào cuối tuần tại bán lẻ, dịch vụ, sự kiện hoặc kho vận.','Thấp','Đúng giờ, dịch vụ khách hàng','Trung bình','Lương theo ca','Thấp','Thấp','Xác minh lịch ca, phụ cấp và điều kiện lao động.'],
    ['employment','Nghề kỹ thuật viên chuyên môn','Làm kỹ thuật viên điện, cơ khí, mạng, phòng lab hoặc thiết bị.','Trung bình','Đào tạo nghề, an toàn','Cao','Lương/phụ cấp','Thấp–trung bình','Cao','Chứng chỉ và quy trình an toàn theo ngành.'],
    ['employment','Chăm sóc khách hàng / hỗ trợ kỹ thuật','Giải đáp yêu cầu khách hàng qua điện thoại, chat hoặc hệ thống ticket.','Thấp','Giao tiếp, xử lý vấn đề','Trung bình','Lương/KPI','Thấp','Trung bình','Bảo mật thông tin khách hàng và tiêu chuẩn dịch vụ.'],
    ['employment','Tuyển dụng / headhunting','Tìm ứng viên phù hợp cho doanh nghiệp và nhận lương hoặc phí tuyển dụng.','Thấp','Đánh giá, giao tiếp','Trung bình','Lương/phí tuyển dụng','Trung bình','Cao','Bảo vệ dữ liệu ứng viên và minh bạch phí.'],
    ['freelance','Làm CV / hồ sơ nghề nghiệp','Viết và thiết kế CV, hồ sơ năng lực hoặc tối ưu hồ sơ ứng tuyển.','Thấp','Viết, thiết kế, tuyển dụng','Trung bình','Phí theo hồ sơ','Thấp','Cao','Không bịa bằng cấp, kinh nghiệm hoặc thành tích.'],
    ['freelance','Quản trị mạng xã hội','Lập lịch nội dung, trả lời bình luận và theo dõi hiệu quả kênh.','Thấp','Social media, viết nội dung','Trung bình','Phí tháng/gói','Trung bình','Cao','Quyền truy cập tài khoản, bảo mật và duyệt nội dung.'],
    ['freelance','SEO / quảng cáo hiệu suất','Tối ưu tìm kiếm và quản lý chiến dịch quảng cáo theo mục tiêu.','Thấp–trung bình','SEO, analytics, ads','Trung bình','Phí dịch vụ/retainer','Trung bình','Cao','Không bảo đảm thứ hạng hoặc doanh số; minh bạch ngân sách ads.'],
    ['freelance','Kế toán / ghi sổ thuê ngoài','Ghi nhận giao dịch, đối soát và lập báo cáo theo phạm vi được phép.','Thấp–trung bình','Kế toán, phần mềm','Trung bình','Phí tháng/dự án','Trung bình','Cao','Chứng chỉ, bảo mật và giới hạn dịch vụ theo luật.'],
    ['freelance','Thiết kế nội thất','Tư vấn bố trí không gian, bản vẽ và lựa chọn vật liệu.','Trung bình','Thiết kế, kỹ thuật','Cao','Phí thiết kế/dự án','Trung bình','Cao','Phạm vi trách nhiệm kỹ thuật và giấy phép liên quan.'],
    ['freelance','Trang điểm / làm tóc tại nhà','Cung cấp dịch vụ làm đẹp theo lịch hẹn hoặc sự kiện.','Trung bình','Tay nghề, vệ sinh','Trung bình','Phí dịch vụ','Trung bình','Cao','Vệ sinh dụng cụ, dị ứng và điều kiện hành nghề.'],
    ['freelance','May đo / sửa quần áo','May mới, chỉnh sửa và sửa chữa trang phục.','Trung bình','May mặc, đo đạc','Trung bình','Phí sản phẩm/công','Thấp–trung bình','Cao','Thống nhất số lần chỉnh sửa và thời hạn giao.'],
    ['freelance','Dịch vụ phiên âm / phụ đề','Chuyển âm thanh thành văn bản và tạo phụ đề có căn chỉnh thời gian.','Thấp','Ngôn ngữ, nghe hiểu','Trung bình','Phí phút âm thanh','Thấp','Cao','Bảo mật bản ghi và kiểm tra độ chính xác.'],
    ['commerce','Máy bán hàng tự động','Kinh doanh qua máy bán hàng đặt tại địa điểm có lưu lượng phù hợp.','Cao','Chọn địa điểm, bảo trì','Trung bình','Biên bán hàng','Cao','Cao','Hợp đồng vị trí, an toàn điện và quản lý hàng hóa.'],
    ['commerce','Bán hàng ký gửi','Bán hàng thay chủ sở hữu và nhận phần trăm khi giao dịch hoàn tất.','Thấp','Định giá, bán hàng','Trung bình','Hoa hồng ký gửi','Thấp–trung bình','Cao','Biên nhận, quyền sở hữu và trách nhiệm mất/hỏng.'],
    ['commerce','Hộp sản phẩm định kỳ','Tuyển chọn và giao hộp hàng theo tháng/quý cho người đăng ký.','Trung bình','Nguồn hàng, tuyển chọn','Trung bình','Subscription box','Trung bình','Cao','Tỷ lệ hủy, tồn kho và chi phí giao hàng.'],
    ['commerce','Bán sản phẩm số kèm dịch vụ','Bán sản phẩm vật lý cùng cài đặt, hướng dẫn hoặc hỗ trợ.','Trung bình','Bán hàng, kỹ thuật','Trung bình','Biên hàng + phí dịch vụ','Trung bình','Cao','Tách rõ bảo hành sản phẩm và phạm vi dịch vụ.'],
    ['commerce','Kinh doanh hàng refurbished','Thu mua thiết bị lỗi/đã dùng, kiểm định, tân trang và bán lại.','Trung bình–cao','Sửa chữa, kiểm định','Trung bình','Chênh lệch giá trị','Cao','Cao','Nguồn gốc, tiêu chuẩn an toàn và bảo hành.'],
    ['digital','Bán theme / giao diện website','Thiết kế và bán giao diện cho website, CMS hoặc nền tảng thương mại.','Thấp–trung bình','UI, frontend','Trung bình','Bán license','Thấp','Rất cao','License thư viện, cập nhật và hỗ trợ tương thích.'],
    ['digital','Bán workflow tự động hóa','Xây quy trình tự động hóa công việc và bán template hoặc triển khai.','Thấp–trung bình','Tích hợp, quy trình','Trung bình','Bán template/phí triển khai','Trung bình','Rất cao','Bảo mật token, quyền truy cập và xử lý lỗi.'],
    ['digital','Chatbot / AI agent theo ngành','Xây trợ lý AI cho một quy trình cụ thể và thu phí triển khai/vận hành.','Trung bình','AI, phần mềm, nghiệp vụ','Trung bình','Phí setup/subscription','Cao','Rất cao','Kiểm soát dữ liệu, sai sót mô hình và giám sát con người.'],
    ['digital','No-code / low-code solutions','Tạo ứng dụng nội bộ và workflow bằng công cụ no-code/low-code.','Thấp–trung bình','Thiết kế quy trình','Trung bình','Phí dự án/bảo trì','Trung bình','Cao','Giới hạn nền tảng, quyền sở hữu dữ liệu và chi phí thuê bao.'],
    ['digital','Bán khóa học trực tiếp theo cohort','Tổ chức khóa học theo nhóm có lịch học, bài tập và phản hồi trực tiếp.','Thấp','Chuyên môn, điều phối','Trung bình','Học phí theo khóa','Trung bình','Cao','Quy mô lớp, hoàn phí và chất lượng giảng dạy.'],
    ['digital','Webinar / workshop trả phí','Tổ chức buổi chuyên đề trực tuyến hoặc trực tiếp có vé tham dự.','Thấp','Chuyên môn, thuyết trình','Trung bình','Vé tham dự','Thấp–trung bình','Cao','Nội dung thực chất, điều kiện hoàn vé và bản quyền tài liệu.'],
    ['digital','Bán dữ liệu huấn luyện / bộ dữ liệu mở có license','Cung cấp bộ dữ liệu tự tạo hoặc được cấp quyền để nghiên cứu/huấn luyện.','Trung bình','Data engineering, quản trị dữ liệu','Trung bình','Phí license','Trung bình','Cao','Nguồn gốc, quyền riêng tư, consent và giấy phép dữ liệu.'],
    ['creator','Bán nội dung độc quyền cho fan','Cung cấp bài viết, video, hậu trường hoặc tài liệu độc quyền cho thành viên trả phí.','Thấp','Sản xuất nội dung','Cao','Membership','Trung bình','Cao','Quy định nền tảng và ranh giới nội dung phù hợp.'],
    ['creator','Tổ chức sự kiện cộng đồng có vé','Bán vé cho hội thảo, meetup, buổi biểu diễn hoặc hoạt động cộng đồng.','Trung bình','Tổ chức, truyền thông','Trung bình','Doanh thu vé/tài trợ','Trung bình','Cao','Giấy phép sự kiện, hoàn vé và an toàn người tham dự.'],
    ['creator','Bán preset / LUT / sample pack','Bán bộ preset chỉnh ảnh, LUT màu, sample âm thanh hoặc project file.','Thấp','Thiết kế/âm thanh','Trung bình','Bán lượt tải/license','Thấp','Rất cao','Chỉ phân phối tài nguyên tự tạo hoặc có quyền.'],
    ['creator','Đọc sách nói / voice-over','Thu âm sách nói, quảng cáo, video hướng dẫn hoặc lồng tiếng.','Thấp–trung bình','Giọng đọc, thu âm','Trung bình','Phí theo phút/dự án','Thấp','Cao','Quyền tác phẩm, quyền sử dụng giọng và điều khoản tái sử dụng.'],
    ['intellectual','Cấp phép thiết kế công nghiệp','Cấp quyền khai thác kiểu dáng hoặc thiết kế sản phẩm đã được bảo hộ.','Trung bình','Thiết kế, pháp lý IP','Cao','Phí license/royalty','Trung bình','Cao','Tình trạng bảo hộ và phạm vi cấp phép.'],
    ['intellectual','Nhượng quyền nội dung / format chương trình','Cấp quyền sử dụng format, giáo trình hoặc quy trình nội dung có sở hữu.','Trung bình','Sáng tạo, chuẩn hóa','Cao','Phí license/royalty','Trung bình','Cao','Chứng minh quyền sở hữu và kiểm soát chất lượng.'],
    ['rental','Cho thuê đồ gia dụng / thiết bị gia đình','Cho thuê dụng cụ, thiết bị gia đình hoặc đồ dùng theo ngày/tháng.','Trung bình','Quản lý tài sản','Trung bình','Phí thuê','Trung bình','Cao','Đặt cọc, vệ sinh, an toàn và hao mòn.'],
    ['rental','Cho thuê studio / không gian sáng tạo','Cho thuê phòng chụp, phòng thu, phòng tập hoặc không gian làm việc.','Rất cao','Vận hành địa điểm','Trung bình','Phí theo giờ/gói','Cao','Cao','Cách âm, PCCC, đặt lịch và trách nhiệm thiết bị.'],
    ['business','Co-working / không gian làm việc chung','Bán chỗ ngồi, phòng họp và tiện ích văn phòng theo gói.','Rất cao','Bất động sản, vận hành','Trung bình','Phí thành viên/phòng','Cao','Cao','Tỷ lệ lấp đầy, hợp đồng thuê và chi phí cố định.'],
    ['business','White-label sản phẩm / phần mềm','Cung cấp sản phẩm do mình vận hành để đối tác gắn thương hiệu riêng.','Trung bình–cao','Sản phẩm, tích hợp','Trung bình','Phí license/thuê bao','Cao','Rất cao','Quyền thương hiệu, SLA, bảo mật và hỗ trợ đối tác.'],
    ['business','Nhà cung cấp dịch vụ fulfillment','Lưu kho, đóng gói và xử lý đơn hàng cho người bán khác.','Cao','Kho vận, công nghệ','Trung bình','Phí lưu kho/xử lý','Cao','Cao','Độ chính xác tồn kho, bảo hiểm và trách nhiệm hàng hóa.'],
    ['business','Kinh doanh giáo dục / trung tâm đào tạo','Vận hành cơ sở đào tạo kỹ năng, ngoại ngữ hoặc chuyên môn.','Cao','Giáo dục, quản trị','Cao','Học phí','Cao','Cao','Giấy phép, chất lượng giảng dạy và bảo vệ học viên.'],
    ['business','Kinh doanh chăm sóc sức khỏe không khám chữa bệnh','Cung cấp dịch vụ hỗ trợ sức khỏe/lối sống trong phạm vi được phép.','Trung bình–cao','Vận hành, chuyên môn phù hợp','Cao','Phí dịch vụ/gói','Trung bình–cao','Cao','Không thực hiện hoạt động y tế khi thiếu giấy phép/chuyên môn.'],
    ['investment','Cho thuê chứng khoán / lending qua đơn vị được phép','Nhận phí/lợi suất từ chương trình cho vay chứng khoán hợp pháp.','Cao','Hiểu thị trường vốn','Thấp','Phí cho vay tài sản','Cao','Trung bình','Chỉ qua đơn vị được phép; rủi ro đối tác và thu hồi tài sản.'],
    ['investment','Đầu tư theo chiến lược phân bổ tài sản','Phân bổ giữa tiền mặt, trái phiếu, cổ phiếu và tài sản khác theo mục tiêu.','Thấp–cao','Quản trị danh mục','Thấp','Lãi, cổ tức, tăng giá','Trung bình–cao','Cao','Đa dạng hóa không loại bỏ rủi ro; tái cân bằng và phí.'],
    ['investment','Đầu tư theo quỹ mục tiêu / lifecycle','Sử dụng danh mục tự điều chỉnh theo thời hạn và mục tiêu đầu tư.','Thấp–trung bình','Kỷ luật dài hạn','Thấp','Tăng trưởng danh mục','Trung bình','Trung bình','Kiểm tra glide path, phí và mức rủi ro.'],
    ['agriculture','Sản xuất phân hữu cơ / vật tư nông nghiệp','Sản xuất và bán vật tư đầu vào nông nghiệp đáp ứng tiêu chuẩn.','Trung bình–cao','Sản xuất, kiểm soát chất lượng','Cao','Biên sản xuất','Cao','Cao','Tiêu chuẩn sản phẩm, môi trường và kiểm nghiệm.'],
    ['agriculture','Dịch vụ cơ giới hóa nông nghiệp','Cho thuê hoặc vận hành máy cày, máy gặt và thiết bị canh tác.','Cao','Vận hành máy móc','Theo mùa vụ','Phí theo diện tích/giờ','Trung bình–cao','Cao','Bảo dưỡng, an toàn và nhu cầu mùa vụ.'],
    ['mobility','Cho thuê tài xế / lái xe theo giờ','Cung cấp tài xế theo lịch, chuyến hoặc hợp đồng.','Thấp–trung bình','Lái xe, dịch vụ','Trung bình','Phí giờ/chuyến','Trung bình','Cao','Giấy phép, bảo hiểm và điều kiện lái xe.'],
    ['mobility','Dịch vụ hướng dẫn du lịch','Tổ chức tour hoặc hướng dẫn khách theo quy định.','Thấp–trung bình','Ngoại ngữ, kiến thức địa phương','Trung bình','Phí tour/ngày','Trung bình','Cao','Thẻ hướng dẫn viên/giấy phép khi bắt buộc và an toàn khách.'],
    ['mobility','Dịch vụ giặt ủi','Nhận giặt, sấy, là và giao nhận quần áo theo đơn.','Trung bình–cao','Vận hành, chăm sóc khách','Trung bình','Phí theo kg/món','Cao','Cao','Hóa chất, thất lạc và xử lý đồ đặc biệt.'],
    ['mobility','Dịch vụ làm vườn / cảnh quan','Thiết kế, chăm sóc cây xanh và bảo trì cảnh quan.','Thấp–trung bình','Làm vườn, thiết kế','Trung bình','Phí công/gói bảo trì','Trung bình','Cao','An toàn dụng cụ, hóa chất và xử lý chất thải.']

  ];

  const PATHWAYS = Object.freeze(RAW.map((row, index) => Object.freeze({
    id: 'income-' + String(index + 1).padStart(3, '0'),
    category: row[0],
    name: row[1],
    description: row[2],
    startupCapital: row[3],
    skills: row[4],
    timeToIncome: row[5],
    incomeType: row[6],
    risk: row[7],
    scalability: row[8],
    considerations: row[9]
  })));

  function normalize(value) {
    return String(value).trim().toLocaleLowerCase('vi');
  }

  function filterPathways(items, category, query) {
    if (!Array.isArray(items)) throw new TypeError('items phải là một mảng');
    if (typeof category !== 'string' || typeof query !== 'string') {
      throw new TypeError('category và query phải là chuỗi');
    }
    const term = normalize(query);
    return items.filter(item => {
      if (category !== 'all' && item.category !== category) return false;
      if (!term) return true;
      return [item.name, item.description, item.skills, item.incomeType,
        item.startupCapital, item.timeToIncome, item.risk, item.scalability,
        item.considerations, CATEGORIES[item.category]].join(' ').toLocaleLowerCase('vi').includes(term);
    });
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function render(content, state) {
    const visible = filterPathways(PATHWAYS, state.category, state.query);
    const groups = ['all', ...Object.keys(CATEGORIES)];
    const pageItems = visible.slice(0, state.limit);
    content.innerHTML =
      '<section class="pe-income-intro"><b>MAP KIẾM TIỀN · ' + PATHWAYS.length + ' CON ĐƯỜNG</b>' +
      '<p>Danh mục phương thức tạo thu nhập từ lao động, kỹ năng, thương mại, tài sản, sở hữu trí tuệ, doanh nghiệp và đầu tư. Không có phương pháp nào bảo đảm lợi nhuận.</p></section>' +
      '<label class="pe-income-search">Tìm cách kiếm tiền<input type="search" maxlength="100" data-income-search placeholder="Ví dụ: ít vốn, làm online, cho thuê, SaaS, cổ tức..." value="' + escapeHTML(state.query) + '"></label>' +
      '<div class="pe-income-filters">' + groups.map(key =>
        '<button type="button" data-income-category="' + key + '" class="' + (key === state.category ? 'active' : '') + '">' +
        escapeHTML(key === 'all' ? 'Tất cả' : CATEGORIES[key]) + '</button>'
      ).join('') + '</div>' +
      '<div class="pe-income-summary"><b>' + visible.length + '</b> cách phù hợp · đang hiển thị ' + pageItems.length + '/' + visible.length +
      '<span>Vốn, thời gian và rủi ro là mức định tính để sàng lọc, không phải cam kết kết quả.</span></div>' +
      '<div class="pe-income-list">' + pageItems.map(item =>
        '<article class="pe-income-card"><header><b>' + escapeHTML(item.name) + '</b><small>' + escapeHTML(CATEGORIES[item.category]) + '</small></header>' +
        '<p>' + escapeHTML(item.description) + '</p><dl>' +
        '<div><dt>Vốn ban đầu</dt><dd>' + escapeHTML(item.startupCapital) + '</dd></div>' +
        '<div><dt>Kỹ năng chính</dt><dd>' + escapeHTML(item.skills) + '</dd></div>' +
        '<div><dt>Thời gian tạo thu nhập</dt><dd>' + escapeHTML(item.timeToIncome) + '</dd></div>' +
        '<div><dt>Cách thu tiền</dt><dd>' + escapeHTML(item.incomeType) + '</dd></div>' +
        '<div><dt>Rủi ro</dt><dd>' + escapeHTML(item.risk) + '</dd></div>' +
        '<div><dt>Khả năng mở rộng</dt><dd>' + escapeHTML(item.scalability) + '</dd></div></dl>' +
        '<footer><b>Lưu ý:</b> ' + escapeHTML(item.considerations) + '</footer></article>'
      ).join('') + '</div>' +
      (pageItems.length < visible.length ? '<button type="button" data-income-more class="pe-income-more">Xem thêm ' + Math.min(24, visible.length - pageItems.length) + ' cách</button>' : '') +
      (visible.length ? '' : '<p class="pe-income-empty">Không tìm thấy phương thức phù hợp.</p>');

    const search = content.querySelector('[data-income-search]');
    search.addEventListener('input', () => {
      state.query = search.value.slice(0, 100);
      state.limit = 24;
      const cursor = search.selectionStart;
      render(content, state);
      const next = content.querySelector('[data-income-search]');
      next.focus();
      next.setSelectionRange(cursor, cursor);
    });
    content.querySelectorAll('[data-income-category]').forEach(button => {
      button.addEventListener('click', () => {
        state.category = button.dataset.incomeCategory;
        state.limit = 24;
        render(content, state);
      });
    });
    const more = content.querySelector('[data-income-more]');
    if (more) more.addEventListener('click', () => {
      state.limit += 24;
      render(content, state);
    });
  }

  function mount() {
    const panel = root.document && root.document.getElementById('principia-economy-root');
    const tabs = panel && panel.querySelector('.pe-tabs');
    const content = panel && panel.querySelector('#pe-content');
    if (!panel || !tabs || !content || panel.dataset.incomePathwaysReady) return false;
    panel.dataset.incomePathwaysReady = 'true';
    const button = root.document.createElement('button');
    button.type = 'button';
    button.dataset.incomePathwaysTab = 'true';
    button.textContent = 'Tất cả cách kiếm tiền';
    tabs.appendChild(button);
    const state = { category: 'all', query: '', limit: 24 };
    button.addEventListener('click', () => {
      tabs.querySelectorAll('button').forEach(tab => tab.classList.remove('active'));
      button.classList.add('active');
      render(content, state);
    });
    panel.addEventListener('click', event => {
      if (event.target.closest('button') && !event.target.closest('[data-income-pathways-tab]')) {
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

  const api = Object.freeze({ PATHWAYS, CATEGORIES, filterPathways });
  root.PrincipiaIncomePathways = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root.document) {
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', boot, { once: true });
    else boot();
  }
})(typeof window !== 'undefined' ? window : globalThis);
