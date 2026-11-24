/* PRINCIPIA — 1,640 advanced, topic-specific learning playbooks.
 * 41 distinct problem-solving / self-regulation strategies × 40 physics topics.
 * These are contextual applications, not 1,600 independent scientific methods.
 */
(() => {
  'use strict';
  const base = window.PRINCIPIA_STUDY_METHOD_PLAYBOOKS;
  if (!Array.isArray(base) || base.length !== 1240) {
    throw new Error('The 1,240 foundational study playbooks must load before advanced playbooks.');
  }
  const topics = [...new Set(base.map(item => {
    const marker = ' cho ';
    const index = String(item.title || '').indexOf(marker);
    return index < 0 ? '' : item.title.slice(index + marker.length);
  }).filter(Boolean))];
  if (topics.length !== 40) throw new Error('Expected exactly 40 physics topics for advanced playbooks.');

  const methods = [
    { name: 'Goal-Free Exploration', group: 'Khám phá có định hướng', steps: ['Liệt kê những đại lượng có thể xác định từ dữ kiện của {topic}, chưa vội chọn đáp án.', 'Tìm quan hệ giữa các đại lượng bằng định luật và giả thiết phù hợp.', 'Sau khi hiểu cấu trúc, quay lại xác định mục tiêu cụ thể của bài.'], check: 'Nhận ra được nhiều quan hệ hợp lệ mà không suy luận vượt dữ kiện.' },
    { name: 'Means–Ends Analysis', group: 'Chiến lược giải bài', steps: ['Viết trạng thái hiện tại và đại lượng đích của {topic}.', 'Xác định khoảng cách giữa hai trạng thái và phép biến đổi có thể thu hẹp khoảng cách.', 'Chia thành các mục tiêu trung gian, giải lần lượt rồi kiểm tra chuỗi phụ thuộc.'], check: 'Mỗi bước đều làm tiến gần mục tiêu và không tạo vòng lặp.' },
    { name: 'Invariant Hunting', group: 'Chiến lược giải bài', steps: ['Theo dõi những đại lượng của {topic} có thể không đổi trong điều kiện đã cho.', 'Kiểm tra từng ứng viên bằng định luật bảo toàn và ngoại lực/tác động trao đổi.', 'Dùng đại lượng bất biến để rút gọn bài toán và xác minh kết quả.'], check: 'Nêu rõ đại lượng bất biến cùng điều kiện bảo toàn.' },
    { name: 'Symmetry Exploitation', group: 'Tư duy vật lý', steps: ['Tìm đối xứng hình học, thời gian hoặc hoán đổi vật trong {topic}.', 'Dự đoán hệ quả của đối xứng lên đại lượng hoặc nghiệm.', 'Dùng hệ quả đó để giảm số ẩn, sau đó kiểm tra điều kiện biên.'], check: 'Kết luận từ đối xứng có căn cứ và không bỏ qua điều kiện phá vỡ đối xứng.' },
    { name: 'Conservation-Law Selection', group: 'Chiến lược giải bài', steps: ['Liệt kê hệ cần xét và các tương tác trong bài {topic}.', 'Kiểm tra điều kiện bảo toàn năng lượng, động lượng, mômen động lượng hoặc điện tích.', 'Chọn hệ thức phù hợp nhất, ghi rõ hệ kín và khoảng thời gian xét.'], check: 'Định luật được chọn đúng hệ và đúng điều kiện áp dụng.' },
    { name: 'Graph-First Reasoning', group: 'Trực quan hóa', steps: ['Chọn trục, đại lượng và đơn vị để dựng đồ thị cho {topic}.', 'Đánh dấu độ dốc, diện tích, giao điểm hoặc cực trị có ý nghĩa vật lý.', 'Đọc thông tin từ đồ thị rồi đối chiếu với phương trình và dấu.'], check: 'Giải thích đúng ý nghĩa vật lý của độ dốc, diện tích và điểm đặc biệt.' },
    { name: 'Equation-First Modeling', group: 'Mô hình hóa', steps: ['Đặt hệ, chiều dương, ẩn số và giả thiết cho {topic}.', 'Viết phương trình tổng quát trước khi thay số.', 'Kiểm tra số phương trình độc lập, đơn vị và điều kiện nghiệm.'], check: 'Mô hình đủ phương trình độc lập và nghiệm thỏa giả thiết.' },
    { name: 'Parameter Sweep', group: 'Thí nghiệm & mô phỏng', steps: ['Chọn một tham số của {topic} và giữ các tham số khác cố định.', 'Thay đổi tham số theo một dải có kiểm soát, dự đoán xu hướng trước mỗi lần.', 'Ghi kết quả thành bảng hoặc đồ thị và giải thích xu hướng.'], check: 'Phân biệt được quan hệ nhân quả với thay đổi đồng thời nhiều biến.' },
    { name: 'Scaling Analysis', group: 'Tư duy định lượng', steps: ['Xác định các đại lượng chi phối {topic} và đơn vị của chúng.', 'Ước lượng cách kết quả thay đổi khi một đại lượng tăng gấp đôi hoặc gấp mười.', 'So sánh dự đoán tỷ lệ với biểu thức chính xác hoặc dữ liệu mô phỏng.'], check: 'Dự đoán đúng xu hướng tỷ lệ và nêu rõ giả thiết xấp xỉ.' },
    { name: 'Limiting-Case Reasoning', group: 'Tư duy vật lý', steps: ['Chọn giới hạn có ý nghĩa vật lý của {topic}, chẳng hạn tiến về 0 hoặc rất lớn.', 'Rút gọn mô hình trong giới hạn đó và dự đoán kết quả.', 'So sánh với công thức tổng quát để phát hiện sai dấu hoặc thiếu hệ số.'], check: 'Kết quả giới hạn khớp trực giác và mô hình đã biết.' },
    { name: 'Counterexample Construction', group: 'Phản biện', steps: ['Viết một khẳng định thường gặp về {topic}.', 'Tìm điều kiện biên hoặc tình huống khác giả thiết có thể làm khẳng định sai.', 'Kiểm tra phản ví dụ bằng định luật và sửa khẳng định cho chính xác.'], check: 'Phản ví dụ hợp lệ và chỉ ra đúng giới hạn của khẳng định.' },
    { name: 'Proof by Contradiction', group: 'Chứng minh', steps: ['Giả sử kết luận cần chứng minh trong {topic} là sai.', 'Suy luận từ giả sử cùng các định luật và điều kiện đã cho.', 'Tìm mâu thuẫn cụ thể rồi kết luận phạm vi mà chứng minh có hiệu lực.'], check: 'Mâu thuẫn xuất phát từ giả thiết rõ ràng, không từ một bước tính sai.' },
    { name: 'Constraint Mapping', group: 'Mô hình hóa', steps: ['Liệt kê ràng buộc hình học, dây không dãn, tiếp xúc hoặc điều kiện mạch trong {topic}.', 'Chuyển từng ràng buộc thành quan hệ giữa tọa độ, vận tốc hoặc đại lượng.', 'Dùng các quan hệ này để giảm số ẩn và kiểm tra tính nhất quán.'], check: 'Mọi ràng buộc đều được biểu diễn và không đếm thiếu bậc tự do.' },
    { name: 'Vector Projection', group: 'Tư duy vật lý', steps: ['Vẽ hệ trục thuận tiện cho {topic} và biểu diễn các vectơ.', 'Chiếu vectơ lên trục hoặc phương chuyển động cần xét.', 'Giải theo từng thành phần rồi ghép lại bằng độ lớn và hướng.'], check: 'Dấu của từng thành phần nhất quán với hệ trục đã chọn.' },
    { name: 'Causal-Chain Mapping', group: 'Hiểu sâu', steps: ['Bắt đầu từ tác động đầu vào của {topic}.', 'Nối các biến trung gian bằng quan hệ nhân quả và định luật tương ứng.', 'Đổi một mắt xích để dự đoán hệ quả, rồi kiểm tra bằng mô hình.'], check: 'Chuỗi nhân quả không nhầm tương quan với nguyên nhân.' },
    { name: 'Misconception Diagnosis', group: 'Sửa lỗi', steps: ['Viết dự đoán ban đầu về {topic} trước khi xem lời giải.', 'So sánh với kết quả đúng và xác định niềm tin nào dẫn đến sai lệch.', 'Tạo một câu hỏi phân biệt để kiểm tra xem quan niệm cũ đã được sửa chưa.'], check: 'Giải thích được vì sao quan niệm cũ sai và áp dụng đúng ở tình huống mới.' },
    { name: 'Confidence-Weighted Retrieval', group: 'Siêu nhận thức', steps: ['Tự trả lời câu hỏi về {topic} và ghi mức tự tin trước khi kiểm tra.', 'Đối chiếu đáp án, phân biệt nhớ chắc, đoán đúng và sai tự tin.', 'Ưu tiên ôn lại mục sai tự tin hoặc đúng nhưng thiếu căn cứ.'], check: 'Mức tự tin được hiệu chỉnh theo độ chính xác thực tế.' },
    { name: 'Cumulative Mini-Exam', group: 'Thi cử', steps: ['Chọn câu hỏi {topic} cùng kiến thức nền từ các buổi trước.', 'Làm trong thời gian ngắn, trộn thứ tự và không xem gợi ý.', 'Phân tích lỗi theo nguyên nhân rồi lên lịch ôn đúng phần yếu.'], check: 'Kết quả phản ánh khả năng nhớ và chọn chiến lược khi không báo trước dạng bài.' },
    { name: 'Exam Wrapper', group: 'Phản tư sau kiểm tra', steps: ['Sau bài kiểm tra {topic}, ghi cách bạn chuẩn bị và phân bổ thời gian.', 'Phân loại lỗi kiến thức, chiến lược, đọc đề, thời gian và tâm lý.', 'Chọn một thay đổi cụ thể cho lần kiểm tra tiếp theo và đo lại.'], check: 'Kế hoạch cải thiện gắn với lỗi có bằng chứng, không chỉ học lâu hơn.' },
    { name: 'Question Ladder', group: 'Tạo câu hỏi', steps: ['Tạo câu hỏi mức nhận biết về {topic}.', 'Nâng lên giải thích cơ chế, dự đoán biến đổi và vận dụng.', 'Kết thúc bằng câu hỏi phản biện giả thiết hoặc thiết kế thí nghiệm.'], check: 'Câu hỏi tăng dần độ sâu và mỗi câu có tiêu chí trả lời rõ.' },
    { name: 'Plan–Do–Review', group: 'Tự điều chỉnh', steps: ['Lập mục tiêu và dự kiến trở ngại khi học {topic}.', 'Thực hiện một phiên ngắn, ghi dữ kiện thực tế thay vì ước lượng.', 'Đối chiếu mục tiêu, rút ra một điều chỉnh cho phiên tiếp theo.'], check: 'Có thay đổi kế hoạch dựa trên dữ liệu của chính phiên học.' },
    { name: 'Desirable Difficulty', group: 'Luyện tập', steps: ['Chọn bài {topic} đủ thử thách nhưng vẫn có thể tự làm.', 'Giảm dần gợi ý, tăng khoảng cách ôn hoặc trộn dạng bài.', 'Nếu độ chính xác sụt mạnh, quay lại mức hỗ trợ vừa đủ rồi tăng lại.'], check: 'Độ khó tăng nhưng người học vẫn tạo được nỗ lực truy xuất có ý nghĩa.' },
    { name: 'Generation Before Instruction', group: 'Tạo sinh', steps: ['Trước khi học lời giải {topic}, tự dự đoán công thức hoặc cách tiếp cận.', 'Ghi cả phần chưa chắc chắn, sau đó học nội dung chuẩn.', 'So sánh dự đoán với lời giải và sửa mô hình tư duy.'], check: 'Nêu được điều gì trong dự đoán ban đầu cần giữ hoặc thay đổi.' },
    { name: 'Concrete-to-Abstract Ladder', group: 'Hiểu sâu', steps: ['Bắt đầu bằng hiện tượng hoặc ví dụ cụ thể của {topic}.', 'Rút ra đại lượng, quy luật và biểu diễn toán học chung.', 'Thử dùng biểu thức trừu tượng để giải một tình huống mới.'], check: 'Chuyển được từ ví dụ sang nguyên lý và quay lại ứng dụng.' },
    { name: 'Abstract-to-Concrete Ladder', group: 'Hiểu sâu', steps: ['Viết định luật hoặc mô hình tổng quát của {topic}.', 'Tạo một ví dụ số và một tình huống đời sống thỏa giả thiết.', 'Chỉ ra trường hợp không thỏa giả thiết để thấy giới hạn mô hình.'], check: 'Ví dụ đúng với mô hình và nêu được điều kiện không áp dụng.' },
    { name: 'Case-Based Learning', group: 'Ứng dụng', steps: ['Chọn một tình huống thực tế có dữ kiện liên quan đến {topic}.', 'Xác định điều gì đã biết, điều gì cần giả định và mô hình phù hợp.', 'Giải quyết tình huống, đánh giá sai số và đề xuất cách cải thiện.'], check: 'Kết luận gắn với dữ kiện thực tế và nêu được giới hạn.' },
    { name: 'Inquiry Learning Cycle', group: 'Khám phá', steps: ['Đặt câu hỏi có thể kiểm chứng về {topic}.', 'Đưa giả thuyết, xác định biến và cách thu thập bằng chứng.', 'Phân tích bằng chứng, kết luận và đề xuất câu hỏi tiếp theo.'], check: 'Kết luận dựa trên bằng chứng và không vượt quá dữ liệu.' },
    { name: 'Simulation Lab Notebook', group: 'Thí nghiệm & mô phỏng', steps: ['Ghi giả thuyết và thông số ban đầu của mô phỏng {topic}.', 'Chỉ thay đổi một biến mỗi lượt và lưu lại kết quả.', 'So sánh dự đoán với quan sát, ghi sai số hoặc yếu tố mô hình bỏ qua.'], check: 'Nhật ký có thể tái lập và tách rõ dự đoán với quan sát.' },
    { name: 'Data-to-Law Induction', group: 'Phân tích dữ liệu', steps: ['Thu thập bảng dữ liệu hoặc kết quả mô phỏng về {topic}.', 'Tìm quy luật bằng đồ thị, tỷ số hoặc phép biến đổi tuyến tính.', 'Đề xuất định luật rồi kiểm tra bằng dữ liệu độc lập hoặc trường hợp biên.'], check: 'Quy luật phù hợp dữ liệu và được kiểm tra ngoài mẫu ban đầu.' },
    { name: 'Model Falsification', group: 'Tư duy khoa học', steps: ['Viết dự đoán có thể kiểm chứng từ mô hình {topic}.', 'Tìm phép thử có khả năng bác bỏ dự đoán nếu mô hình sai.', 'Đối chiếu kết quả và phân biệt mô hình sai với phép đo không đủ chính xác.'], check: 'Phép thử có thể phân biệt ít nhất hai cách giải thích.' },
    { name: 'Peer Instruction', group: 'Học cùng người khác', steps: ['Trả lời độc lập một câu khái niệm về {topic}.', 'Giải thích lựa chọn cho bạn học và lắng nghe lập luận đối lập.', 'Bỏ phiếu lại, sau đó xác nhận bằng nguyên lý hoặc ví dụ phản chứng.'], check: 'Lựa chọn cuối cùng đi kèm lý do vật lý, không chỉ theo số đông.' },
    { name: 'Structured Debate Map', group: 'Phản biện', steps: ['Viết một mệnh đề tranh luận về {topic}.', 'Tách luận điểm, bằng chứng, giả định và phản biện thành sơ đồ.', 'Đánh giá bằng chứng mạnh nhất và sửa kết luận nếu cần.'], check: 'Phân biệt được dữ kiện với ý kiến và giả định.' },
    { name: 'Error Prediction', group: 'Sửa lỗi', steps: ['Trước khi giải {topic}, dự đoán hai lỗi dễ mắc và dấu hiệu nhận biết.', 'Giải bài, đánh dấu thời điểm có nguy cơ mắc lỗi.', 'So sánh lỗi thực tế với dự đoán và tạo quy tắc phòng tránh.'], check: 'Quy tắc phòng lỗi cụ thể và có thể áp dụng ở bài tương tự.' },
    { name: 'Solution Compression', group: 'Tư duy lời giải', steps: ['Giải đầy đủ bài {topic} và ghi lý do mọi bước.', 'Rút gọn các bước lặp nhưng giữ lại điều kiện và lập luận cốt lõi.', 'Kiểm tra người khác vẫn có thể tái tạo lời giải từ bản rút gọn.'], check: 'Lời giải ngắn hơn nhưng không mất tính đúng đắn hoặc bước suy luận thiết yếu.' },
    { name: 'Representation Translation', group: 'Trực quan hóa', steps: ['Biểu diễn {topic} bằng lời, hình, bảng, đồ thị và phương trình.', 'Chuyển từ dạng này sang dạng khác, ghi rõ thông tin được giữ lại.', 'Dùng một biểu diễn để phát hiện lỗi hoặc suy ra điều khó thấy ở dạng khác.'], check: 'Các biểu diễn nhất quán và chuyển đổi được hai chiều.' },
    { name: 'Transfer Ladder', group: 'Chuyển giao', steps: ['Giải một ví dụ quen thuộc về {topic}.', 'Giải bài cùng nguyên lý nhưng thay bối cảnh hoặc cách biểu diễn.', 'Giải tình huống mới có thêm yếu tố gây nhiễu và giải thích phần kiến thức được chuyển giao.'], check: 'Nhận ra nguyên lý chung dù bối cảnh và hình thức đề thay đổi.' },
    { name: 'Concept Boundary Testing', group: 'Phân biệt', steps: ['Nêu định nghĩa và điều kiện áp dụng của khái niệm trong {topic}.', 'Tạo ví dụ nằm sát ranh giới và một phản ví dụ gần giống.', 'Giải thích chính xác yếu tố nào làm trường hợp thuộc hoặc không thuộc khái niệm.'], check: 'Phân loại đúng trường hợp biên và giải thích bằng điều kiện cần.' },
    { name: 'Multi-Solution Tournament', group: 'Chiến lược giải bài', steps: ['Tạo ít nhất hai cách giải cho cùng bài {topic}.', 'So sánh độ ngắn, giả thiết, độ tổng quát và nguy cơ sai của từng cách.', 'Chọn cách phù hợp với mục tiêu rồi kiểm tra bằng cách độc lập.'], check: 'Lựa chọn chiến lược dựa trên tiêu chí rõ ràng, không chỉ độ dài.' },
    { name: 'Pre-Mortem Study', group: 'Tự điều chỉnh', steps: ['Giả sử phiên học {topic} đã thất bại và liệt kê nguyên nhân có thể.', 'Chọn hai rủi ro có khả năng cao nhất và biện pháp phòng ngừa.', 'Sau phiên học, so sánh dự đoán với điều thực sự xảy ra.'], check: 'Biện pháp phòng ngừa cụ thể và được cập nhật theo kết quả.' },
    { name: 'Interruption Recovery', group: 'Tập trung', steps: ['Trước khi học {topic}, ghi bước tiếp theo ngay cả khi bị gián đoạn.', 'Khi mất tập trung, ghi việc chen ngang vào danh sách và quay về bước đã ghi.', 'Cuối phiên kiểm tra nguyên nhân gián đoạn và điều chỉnh môi trường.'], check: 'Có thể quay lại nhiệm vụ mà không phải tái khởi động từ đầu.' },
    { name: 'Mastery Gate', group: 'Thành thạo', steps: ['Đặt tiêu chí đạt trước khi luyện {topic}: độ chính xác, giải thích và chuyển giao.', 'Làm bài độc lập không gợi ý, ghi cả mức tự tin.', 'Chỉ chuyển cấp khi đạt tiêu chí; nếu chưa, quay lại kỹ năng thành phần yếu nhất.'], check: 'Quyết định chuyển cấp dựa trên bằng chứng độc lập, không dựa vào cảm giác.' }
  ];

  const out = [];
  for (const method of methods) {
    for (const topic of topics) {
      const id = 1472 + out.length;
      out.push({
        id,
        kind: 'advanced-playbook',
        category: 'Ứng dụng nâng cao · ' + method.group,
        title: method.name + ' cho ' + topic,
        desc: 'Kịch bản chuyên sâu áp dụng ' + method.name + ' vào ' + topic + '.',
        steps: method.steps.map(step => step.replaceAll('{topic}', topic)),
        check: method.check,
        example: 'Với ' + topic + ', hãy chọn một bài đang học, ghi giả thiết và thực hiện từng bước; đối chiếu kết quả bằng một cách độc lập.',
        duration: 12
      });
    }
  }
  if (methods.length !== 41 || out.length !== 1640) throw new Error('Advanced study catalog count mismatch.');
  if (new Set(out.map(item => item.title)).size !== out.length) throw new Error('Advanced study titles must be unique.');
  window.PRINCIPIA_STUDY_METHOD_ADVANCED_PLAYBOOKS = out;
  window.PRINCIPIA_STUDY_METHOD_ADVANCED_COUNT = out.length;
})();
