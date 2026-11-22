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

## Nguyên tắc nghiệm thu

1. Không đánh dấu hoàn thành chỉ vì đã tạo file hoặc commit code.
2. Mỗi tính năng cần kiểm tra giao diện, luồng thao tác, dữ liệu đầu vào/đầu ra và lỗi biên.
3. Tính năng khoa học phải có ca kiểm chứng độc lập và nêu rõ giả thiết/mức sai số; không tuyên bố chính xác tuyệt đối khi chưa chứng minh.
4. Chỉ triển khai trên website PRINCIPIA hiện tại và các gói ứng dụng chính thức; không tạo thêm website.
5. Giữ các tính năng đang có; chỉ xóa khi người dùng yêu cầu rõ ràng.
6. Cập nhật trạng thái trong bảng này sau mỗi đợt code và ghi rõ commit/build/test.