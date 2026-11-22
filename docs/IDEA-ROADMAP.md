# PRINCIPIA — Idea backlog & implementation roadmap

> Quy tắc nền tảng: chỉ duy trì **một website PRINCIPIA chính thức** trên Cloudflare Pages. Không tạo website phụ, website test, preview site, V1/V2 song song hoặc bản sao triển khai. Kiểm thử bằng CI, unit test và môi trường cục bộ; không dựng thêm website.

## Trạng thái

- **Có mã nguồn — chờ nghiệm thu:** đã tìm thấy mã nguồn/tích hợp trong repo; chưa khẳng định chạy ổn trên mọi thiết bị.
- **Đang triển khai:** có một phần nền tảng nhưng còn thiếu chức năng hoặc kiểm thử.
- **Chưa làm:** chưa có bằng chứng triển khai đầy đủ trong repo hiện tại.
- **Chờ đầu vào:** cần tài nguyên hoặc quyết định cụ thể của người dùng.

## A. Nền tảng, tài khoản và phát hành

| # | Ý tưởng / yêu cầu | Trạng thái |
|---:|---|---|
| 1 | Một website PRINCIPIA chính thức duy nhất; giữ nguyên dữ liệu và giao diện hiện có khi bổ sung tính năng | Đang áp dụng — ràng buộc bắt buộc |
| 2 | Không tạo website phụ, trang test, trang preview, V1/V2 hoặc site demo riêng | Đang áp dụng — ràng buộc bắt buộc |
| 3 | Tài khoản quản trị duy nhất `huyquocnguyen03042011@gmail.com`; tài khoản khác chỉ xem | Đang triển khai / cần nghiệm thu quyền truy cập |
| 4 | Đăng nhập Google mở trình duyệt theo luồng web | Cần rà soát và kiểm thử |
| 5 | Đăng nhập email/mật khẩu | Cần rà soát và kiểm thử |
| 6 | Nút hiện/ẩn mật khẩu | Cần rà soát và kiểm thử |
| 7 | Quên và đặt lại mật khẩu | Cần rà soát và kiểm thử |
| 8 | Đồng bộ tài khoản, bài học và dữ liệu qua Firebase | Đang triển khai / cần nghiệm thu |
| 9 | Cập nhật ứng dụng desktop, thông báo phiên bản mới và quy trình update an toàn | Chưa nghiệm thu |
| 10 | Bản desktop riêng, giao diện desktop không bị ép thành giao diện mobile | Có mã nguồn nền tảng desktop; cần nghiệm thu |
| 11 | Bản mobile riêng, điều hướng dưới màn hình và hành vi theo trang | Đang triển khai / cần nghiệm thu |
| 12 | Hỗ trợ Windows, Linux, macOS, Android và iOS | Đang triển khai; chưa xác nhận build/phát hành đủ nền tảng |
| 13 | Phân phối riêng tư/miễn phí qua các cửa hàng ứng dụng khi đáp ứng điều kiện | Chưa làm — cần hoàn thiện build, ký và quy trình phát hành |

## B. Học tập và ôn thi Olympic

| # | Ý tưởng / yêu cầu | Trạng thái |
|---:|---|---|
| 14 | Phòng luyện thi Olympic với bộ câu hỏi thật | Có mã nguồn nền tảng; cần nghiệm thu ngân hàng câu hỏi |
| 15 | Chọn bài luyện 5 / 10 / 20 / tất cả câu | Có mã nguồn — chờ nghiệm thu |
| 16 | Đồng hồ đếm giờ và nộp bài | Có mã nguồn — chờ nghiệm thu |
| 17 | Xem đáp án, lời giải và rà soát câu sai | Có mã nguồn nền tảng — cần kiểm thử |
| 18 | Phân tích điểm yếu theo chủ đề | Có mã nguồn nền tảng — cần kiểm thử |
| 19 | Nhật ký lỗi sai và ôn lại câu đã sai | Có mã nguồn nền tảng — cần kiểm thử |
| 20 | Flashcard và thẻ ghi nhớ có hình ảnh | Có mã nguồn — chờ nghiệm thu |
| 21 | Ôn tập ngắt quãng theo lịch 1 / 2 / 4 / 7 ngày và điều chỉnh theo kết quả | Có mã nguồn — chờ nghiệm thu |
| 22 | Thử thách khoa học mỗi ngày, câu hỏi lấy từ ngân hàng câu hỏi | Có mã nguồn — chờ nghiệm thu |
| 23 | Sổ tay học tập và ghi chú cá nhân | Có mã nguồn nền tảng — cần kiểm thử |
| 24 | Thư viện công thức khoa học | Có mã nguồn nền tảng — cần kiểm thử độ chính xác |
| 25 | Tìm kiếm toàn cục trong nội dung học tập | Có mã nguồn — cần nghiệm thu |
| 26 | Huy hiệu, thành tích, nhiệm vụ và XP | Có mã nguồn; bổ sung 8 thành tựu có tiến độ và điều kiện thực tế — chờ CI/nghiệm thu |
| 27 | Thông báo và nhắc học trong ứng dụng | Có mã nguồn nền tảng — cần kiểm thử |
| 28 | Thảo luận với AI và trợ giúp học tập | Có mã nguồn cầu nối; cần nghiệm thu nhà cung cấp, giới hạn và chất lượng |
| 29 | AI chấm bài, giải thích từng bước và phản hồi theo rubric | Đang triển khai / cần thiết kế và kiểm chứng |
| 30 | Hỗ trợ câu hỏi có ảnh, sơ đồ, đồ thị và hình minh họa | Có mã nguồn hiển thị media; ngân hàng câu hỏi cần bổ sung dữ liệu |

## C. Phòng thí nghiệm và công cụ kỹ thuật

| # | Ý tưởng / yêu cầu | Trạng thái |
|---:|---|---|
| 31 | Nhúng mô phỏng PhET trực tiếp trong khu vực học tập, tải khi người dùng chọn | Có mã nguồn tích hợp; cần xác minh từng đường dẫn mô phỏng |
| 32 | Bộ chọn mô phỏng theo cơ học, điện từ, sóng/quang và nhiệt học | Có mã nguồn — chờ nghiệm thu |
| 33 | Physics Arcade: môi trường trọng lực, tốc độ và cache | Có mã nguồn nền tảng — cần kiểm thử gameplay |
| 34 | Phòng thí nghiệm cánh tay robot 2 khớp, động học thuận/nghịch | Có mã nguồn — chờ nghiệm thu build và giao diện |
| 35 | Phân tích số liệu thí nghiệm, hồi quy tuyến tính, R², RMSE và đồ thị | Có mã nguồn — chờ nghiệm thu build và kết quả |
| 36 | Thí nghiệm vật lý tương tác và đo đạc tham số | Có mã nguồn phòng thí nghiệm con lắc đơn; cần nghiệm thu giao diện, mô hình và đo đạc |
| 37 | Xây dựng phòng lab, lắp thiết bị và tạo thí nghiệm | Chưa làm đầy đủ |
| 38 | Công cụ nghiên cứu khoa học và ghi nhận kết quả thí nghiệm | Đang triển khai / cần đặc tả |
| 39 | Mô hình hóa vật lý nâng cao, kiểm tra sai số và đơn vị SI | Có mã nguồn va chạm 1D/2D; thêm/bớt 2–12 vật, chọn/kéo trực tiếp trên canvas, chỉnh khối lượng/bán kính/Vx/Vy; tự tạm dừng khi ra khỏi màn hình; 11 ca kiểm thử đã viết, CI và nghiệm thu trình duyệt còn chờ |
| 40 | Tích hợp thư viện mã nguồn mở phù hợp giấy phép, có ghi công và khóa phiên bản | Đang triển khai — xét từng thư viện |

## D. Game, khám phá và thử thách

| # | Ý tưởng / yêu cầu | Trạng thái |
|---:|---|---|
| 41 | Câu đố vật lý tương tác | Có mã nguồn câu đố cân bằng lực vector; cần nghiệm thu giao diện và gameplay |
| 42 | Khám phá không gian và thiên văn | Có mã nguồn Space Explorer tính quỹ đạo tròn Trái Đất/Mặt Trăng/Sao Hỏa; cần nghiệm thu giao diện và mô hình |
| 43 | Lắp ráp robot, máy móc và hệ thống kỹ thuật | Có mã nguồn thử thách lắp ráp tay máy 2 khâu; cần nghiệm thu gameplay và giao diện |
| 44 | Giải mã bí ẩn khoa học | Có mã nguồn chế độ điều tra 3 manh mối lấy từ ngân hàng câu hỏi; 5/5 unit test chạy local đạt, chờ CI và nghiệm thu giao diện |
| 45 | Thử thách khoa học do AI hỗ trợ | Đang triển khai / cần kiểm soát chất lượng |
| 46 | Chế độ chơi nhiều người | Chưa làm |
| 47 | Bảng xếp hạng | Chưa nghiệm thu |
| 48 | Nhiệm vụ ngày và mùa giải | Có nhiệm vụ tuần với 3 mục tiêu thực tế, tiến độ và nhận XP một lần mỗi tuần; cần CI và nghiệm thu giao diện |
| 49 | Hệ thống XP, cấp độ và phần thưởng | Có 11 cấp XP, tiến độ lên cấp; phần thưởng nâng cao còn triển khai |
| 50 | Quiz thời gian thực | Chưa làm |
| 51 | Thế giới khoa học mở để tự do khám phá | Chưa làm |
| 52 | Người dùng tự tạo màn chơi/thử thách và chia sẻ | Chưa làm |
| 53 | Thành tựu và bộ sưu tập tiến trình chơi | Có mã nguồn thành tựu học tập và bộ sưu tập — chờ CI/nghiệm thu |

## E. Nhân vật, giao diện và trải nghiệm

| # | Ý tưởng / yêu cầu | Trạng thái |
|---:|---|---|
| 54 | Giữ màn hình chào và phong cách nhận diện PRINCIPIA | Đang áp dụng — không tự ý xóa |
| 55 | Dùng logo người dùng cung cấp, crop tròn đúng ảnh gốc; không tự chế logo | Chờ đối chiếu bản cuối trong app |
| 56 | Bộ nhân vật PRINCIPIA lấy từ ảnh người dùng gửi; chọn ngẫu nhiên, không cố định một nhân vật | Chờ người dùng gửi đủ tài nguyên và xác nhận thời điểm random |
| 57 | Giao diện desktop và mobile tách riêng, tối ưu từng kích thước | Đang triển khai / cần nghiệm thu |
| 58 | Điều hướng quay lại nhất quán trên mọi nền tảng | Đang triển khai / cần nghiệm thu |
| 59 | Trong bài học, thanh Home ẩn và thanh điều hướng phù hợp xuất hiện ở cuối màn hình | Cần nghiệm thu |
| 60 | Loại bỏ Giveaway; không làm mất màn hình chào hoặc phần giao diện đã được duyệt | Đang áp dụng — ràng buộc bắt buộc |

## F. Hiệu năng, độ chính xác và chất lượng

| # | Ý tưởng / yêu cầu | Trạng thái |
|---:|---|---|
| 61 | Giảm lag, tối ưu tải và phản hồi giao diện | Đang triển khai |
| 62 | Mục tiêu vận hành trên thiết bị RAM khoảng 1 GB | Chưa benchmark đạt mục tiêu |
| 63 | Chỉ tải AI model/provider được chọn, không preload tất cả | Đang áp dụng — cần đo kiểm |
| 64 | Rust làm lõi an toàn/nhạy hiệu năng; chỉ dùng C++ khi benchmark chứng minh có lợi | Đang triển khai |
| 65 | Kiểm thử công thức, trường hợp biên, sai số số học và đơn vị | Đang triển khai; chưa nghiệm thu toàn bộ |
| 66 | Kiểm thử tự động trên CI cho Rust, desktop, WASM và các bản build | Có workflow CI; hiện còn lỗi cần xử lý |
| 67 | Kiểm thử thực tế trên Windows, Linux, macOS, Android và iOS | Chưa hoàn tất |
| 68 | Rà soát giấy phép, dependency, attribution và nghĩa vụ công bố mã nguồn trước khi tái sử dụng | Đang áp dụng theo từng thư viện |
| 69 | Video học tập dùng liên kết YouTube; không tải lại video trái phép | Đang áp dụng — ràng buộc nội dung |

| 70 | Sao lưu/khôi phục tiến độ học tập và game trên thiết bị; không đưa token đăng nhập vào tệp | Có mã nguồn — 6/6 unit test chạy local đạt; chờ CI và nghiệm thu trình duyệt |
| 71 | Khôi phục đầy đủ danh sách hơn 100 ý tưởng PRINCIPIA đã trao đổi, đối chiếu từng mục với backlog 70 mục hiện có để không bỏ sót | Đang rà soát lịch sử trao đổi; không tự bịa các mục chưa tìm thấy |
| 72 | Theo dõi chuỗi ngày học liên tiếp, cấp độ XP và thành tựu theo tiến độ thực tế | Có mã nguồn core + tích hợp; 9/9 unit test chạy local đạt; GitHub Actions lần chạy gần nhất thất bại trước khi có step/log, trình duyệt chưa xác nhận |
| 73 | Mùa giải tuần với nhiệm vụ theo lượt luyện, số câu và ghi chú; phần thưởng XP không nhận trùng | Có mã nguồn core + giao diện; 5 unit test đã viết, chưa chạy local; chờ CI và nghiệm thu trình duyệt |
| 74 | Xuất dữ liệu đo trong Sổ nghiên cứu ra CSV có đơn vị và hỗ trợ dấu phẩy/ngoặc kép an toàn | Có mã nguồn core + nút xuất theo từng thí nghiệm; đã thêm unit test, chưa chạy local; chờ CI và nghiệm thu trình duyệt |
| 75 | Tìm kiếm công thức theo biểu thức hoặc tên bài học; lịch ôn dùng ngày địa phương nhất quán | Có mã nguồn tìm kiếm trực tiếp trong thư viện công thức; đã sửa mốc ngày ôn tập khỏi lệch UTC; cần kiểm thử trình duyệt và CI |
| 76 | Cho phép chỉnh sửa ghi chú học tập đã lưu mà không phải xóa và tạo lại | Có nút sửa, form nạp nội dung hiện tại, lưu cập nhật và giữ ngày tạo; ghi thêm thời điểm cập nhật; cần nghiệm thu trình duyệt |

| 77 | Ngân hàng câu hỏi có tìm kiếm theo nội dung câu hỏi, đáp án, chủ đề và đường dẫn bài học | Có mã nguồn giao diện trong Learning Suite; cần nghiệm thu trên trình duyệt và thiết bị thực tế |

| 78 | Ngân hàng câu hỏi nâng cao: lọc theo chủ đề, lưu câu yêu thích bền vững và xuất CSV theo bộ lọc hiện tại | Đã tích hợp trong Learning Suite; cần kiểm tra tương tác thực tế trên trình duyệt |

| 79 | Tìm kiếm sổ tay kiến thức theo tiêu đề và nội dung | Đã tích hợp bộ lọc trực tiếp, giữ nguyên sửa/xóa ghi chú |
| 80 | Sao chép nhanh công thức trong thư viện công thức | Đã thêm thao tác sao chép với phương án dự phòng cho trình duyệt hạn chế Clipboard API |
| 81 | Lọc phân tích học tập theo 7 ngày, 30 ngày hoặc toàn bộ lịch sử | Đã tích hợp bộ lọc trong Learning Suite; chờ CI và nghiệm thu trình duyệt |
| 82 | Xuất lịch sử luyện tập và độ chính xác ra CSV | Đã tích hợp xuất CSV; chờ kiểm tra tệp thực tế và CI |
| 83 | Tìm kiếm sổ lỗi sai theo câu hỏi và nội dung sửa lỗi | Đã tích hợp tìm kiếm trực tiếp; chờ nghiệm thu giao diện |
| 84 | Xuất sổ lỗi sai ra CSV để lưu trữ và phân tích | Đã tích hợp xuất CSV; chờ kiểm tra dữ liệu thực tế |
| 85 | Xuất toàn bộ sổ tay kiến thức thành Markdown | Đã tích hợp tải tệp Markdown; chờ kiểm tra trên thiết bị |
| 86 | Đếm ký tự ghi chú và giới hạn nội dung mỗi ghi chú | Đã tích hợp bộ đếm 10.000 ký tự |
| 87 | Lưu ghi chú nhanh bằng Ctrl+Enter hoặc Cmd+Enter | Đã tích hợp phím tắt trong ô soạn ghi chú |
| 88 | Ôn flashcard chỉ từ các câu hỏi yêu thích | Đã tích hợp chế độ flashcard yêu thích |
| 89 | Tạo lượt luyện Olympic riêng từ tối đa 10 câu yêu thích | Đã tích hợp chế độ luyện câu yêu thích |
| 90 | Lưu lịch sử 30 thử thách mỗi ngày gần nhất | Đã tích hợp lưu kết quả và màn hình lịch sử trên thiết bị |
| 91 | Màn hình lịch sử luyện tập có lọc theo chế độ và tìm kiếm | Đã tích hợp danh sách và bộ lọc trong Learning Suite; chờ kiểm tra trình duyệt |
| 92 | Xuất toàn bộ lịch sử luyện tập chi tiết ra CSV | Đã tích hợp xuất CSV có thời điểm, chế độ, số câu đúng và độ chính xác |
| 93 | Biểu đồ xu hướng độ chính xác 10 lượt luyện gần nhất | Đã tích hợp biểu đồ cột gọn trong màn hình lịch sử |
| 94 | Tìm lịch sử thử thách hằng ngày theo ngày hoặc chủ đề | Đã tích hợp tìm kiếm trực tiếp |
| 95 | Lọc lịch sử thử thách theo đúng/sai | Đã tích hợp bộ lọc kết quả |
| 96 | Xuất lịch sử thử thách hằng ngày ra CSV | Đã tích hợp tải CSV UTF-8 |
| 97 | Xáo trộn thứ tự flashcard để luyện lại | Đã tích hợp thao tác xáo trộn |
| 98 | Đánh dấu câu hỏi đã thuộc và lưu trên thiết bị | Đã tích hợp trạng thái thành thạo trong dữ liệu học tập |
| 99 | Bộ flashcard riêng cho các câu đã thuộc | Đã tích hợp chế độ flashcard thành thạo |
| 100 | Xem lịch ôn tập dự kiến trong 7 ngày tới | Đã tích hợp thống kê số thẻ đến hạn từng ngày |

| 101 | Bộ đếm phiên tập trung với các mốc 15 / 25 / 45 / 60 phút | Có mã nguồn — chờ kiểm thử giao diện |
| 102 | Tùy chỉnh thời lượng tập trung từ 5 đến 120 phút | Có mã nguồn — chờ kiểm thử biên |
| 103 | Tạm dừng và tiếp tục phiên học mà không mất thời gian đã tích lũy | Có mã nguồn — chờ kiểm thử thao tác |
| 104 | Kết thúc sớm và lưu thời gian thực tế của phiên | Có mã nguồn — chờ kiểm thử |
| 105 | Lưu lịch sử các phiên tập trung trên thiết bị | Có mã nguồn — lưu LocalStorage |
| 106 | Đặt mục tiêu học tập theo phút mỗi ngày | Có mã nguồn — chờ kiểm thử |
| 107 | Theo dõi tiến độ mục tiêu tập trung trong ngày | Có mã nguồn — chờ kiểm thử |
| 108 | Tổng hợp thời gian tập trung trong 7 ngày gần nhất | Có mã nguồn — chờ kiểm thử |
| 109 | Theo dõi chuỗi ngày có hoạt động tập trung | Có mã nguồn — chờ kiểm thử |
| 110 | Tìm kiếm lịch sử và xuất phiên tập trung ra CSV | Có mã nguồn — chờ kiểm thử |

| 111 | Lọc đề Olympic theo chủ đề bài học | Đã tích hợp bộ lọc chủ đề trước khi tạo đề; chờ nghiệm thu |
| 112 | Tạo đề ngẫu nhiên theo chủ đề đã chọn | Đã tích hợp lấy mẫu ngẫu nhiên từ tập câu hỏi phù hợp |
| 113 | Đảo thứ tự đáp án trong mỗi đề nhưng giữ đúng đáp án chuẩn | Đã tích hợp xáo trộn lựa chọn và ánh xạ lại đáp án đúng |
| 114 | Lưới điều hướng nhanh tới từng câu trong bài thi | Đã tích hợp nút điều hướng theo số câu |
| 115 | Đánh dấu câu cần xem lại trong lúc làm bài | Đã tích hợp trạng thái đánh dấu theo từng câu |
| 116 | Lọc nhanh câu chưa trả lời hoặc câu đã đánh dấu | Đã tích hợp ba chế độ xem: tất cả, chưa trả lời, đánh dấu |
| 117 | Hiển thị số câu đã trả lời và còn bỏ trống theo thời gian thực | Đã tích hợp bộ đếm và thanh tiến độ |
| 118 | Xác nhận trước khi nộp bài nếu còn câu chưa trả lời | Đã tích hợp cảnh báo và cho phép quay lại bài thi |
| 119 | Lọc riêng các câu sai trong màn hình kết quả | Đã tích hợp chế độ xem toàn bộ hoặc chỉ câu sai |
| 120 | Tạo lượt luyện mới chỉ từ các câu trả lời sai | Đã tích hợp nút luyện lại câu sai từ kết quả vừa nộp |


| # | Ý tưởng / yêu cầu | Trạng thái |
|---:|---|---|
| 121 | Phím tắt 1–9 để chọn đáp án và phím mũi tên để chuyển câu | Đã tích hợp trong phòng thi; cần nghiệm thu bàn phím trên desktop và Android |
| 122 | Điều hướng câu trước / câu tiếp ngay trong bài thi | Đã thêm nút chuyển câu và giữ vị trí câu hiện tại |
| 123 | Bỏ chọn đáp án đã chọn khi phát hiện bấm nhầm | Đã thêm thao tác xóa lựa chọn cho câu hiện tại |
| 124 | Tự lưu bản nháp bài thi khi trả lời hoặc đánh dấu câu | Đã lưu cục bộ sau mỗi thay đổi; không đồng bộ máy chủ |
| 125 | Khôi phục bài thi đang làm sau khi tải lại trang | Đã thêm tiếp tục bản nháp nếu thời hạn thi chưa hết |
| 126 | Xóa bản nháp bài thi theo xác nhận của người dùng | Đã thêm thao tác xóa riêng, không tự xóa khi đóng cửa sổ |
| 127 | Cảnh báo trực quan khi còn 5 phút và 1 phút | Đã thêm thông báo trong phòng thi và đổi màu đồng hồ |
| 128 | Lưu thời gian làm bài thực tế vào lịch sử kết quả | Đã ghi durationSeconds trong lượt luyện Olympic |
| 129 | Hiển thị thời lượng làm bài ở màn hình kết quả | Đã thêm thời gian phút/giây trong kết quả thi |
| 130 | Giữ tiến độ câu hiện tại khi chuyển câu và khôi phục bản nháp | Đã lưu chỉ số câu hiện tại cùng bản nháp bài thi |
| 131 | Hồ sơ tư duy & học tập: tổng hợp lịch sử luyện tập, phân bố chế độ, lỗi thường gặp và gợi ý ôn tập có giải thích | Đã tích hợp trong Learning Suite; chỉ mô tả dữ liệu học tập cục bộ, chưa thay thế đánh giá chuyên môn; cần nghiệm thu trình duyệt |

| 132 | Hành trình học mỗi ngày: mục tiêu 5/10/15 phút, truy hồi chủ động, ôn tập giãn cách, ghi chú phản tư và thưởng XP tự nguyện | Đã tích hợp trong Learning Suite; tiến độ lưu cục bộ theo ngày; cần nghiệm thu trên trình duyệt và kiểm tra luồng XP |

| 133 | Bản đồ tri thức tương tác: nhóm câu hỏi theo chủ đề, theo dõi thẻ đã thuộc, câu đến hạn, yêu thích và lỗi sai; mở thẳng ngân hàng câu hỏi theo chủ đề | Đã tích hợp; dữ liệu dựa trên ngân hàng hiện có và tiến độ cục bộ; cần nghiệm thu trình duyệt |

## Nguyên tắc nghiệm thu

1. Không đánh dấu hoàn thành chỉ vì đã tạo file hoặc commit code.
2. Mỗi tính năng cần kiểm tra giao diện, luồng thao tác, dữ liệu đầu vào/đầu ra và lỗi biên.
3. Tính năng khoa học phải có ca kiểm chứng độc lập và nêu rõ giả thiết/mức sai số; không tuyên bố chính xác tuyệt đối khi chưa chứng minh.
4. Chỉ triển khai trên website PRINCIPIA hiện tại và các gói ứng dụng chính thức; không tạo thêm website.
5. Giữ các tính năng đang có; chỉ xóa khi người dùng yêu cầu rõ ràng.
6. Cập nhật trạng thái trong bảng này sau mỗi đợt code và ghi rõ commit/build/test.