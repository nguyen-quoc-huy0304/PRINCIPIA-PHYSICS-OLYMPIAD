/* PRINCIPIA Learning Science Engine — context-aware study strategies, motivation and focus. */
(() => {
  'use strict';

  const STORE = 'principia_learning_science_v1';
  const MAX_RECENT = 16;
  const METHODS = [
    { id:'retrieval', group:'memory', goals:['remember','understand','solve','recover'], triggers:['recall','memory','quiz','review'], weight:5, guide:'Bắt đầu bằng câu hỏi gợi nhớ không nhìn tài liệu. Sau khi người học trả lời mới đưa phản hồi và yêu cầu tự sửa.' },
    { id:'spacing', group:'memory', goals:['remember','recover'], triggers:['review','forget','due'], weight:5, guide:'Chia ôn tập thành nhiều lần cách quãng; ưu tiên nội dung sắp quên và tăng khoảng cách khi truy xuất thành công.' },
    { id:'interleaving', group:'practice', goals:['solve','olympiad','transfer'], triggers:['problem','similar','procedure'], weight:4, guide:'Trộn các dạng bài gần nhau sau khi đã hiểu từng dạng; yêu cầu người học nhận diện khi nào dùng nguyên lý nào.' },
    { id:'elaborative-interrogation', group:'understanding', goals:['understand','solve'], triggers:['why','cause','concept'], weight:4, guide:'Đặt câu hỏi vì sao và điều kiện nào khiến quy luật đúng; yêu cầu nối nguyên nhân với định luật và bằng chứng.' },
    { id:'self-explanation', group:'understanding', goals:['understand','solve','teach'], triggers:['reasoning','steps','concept'], weight:5, guide:'Yêu cầu giải thích vì sao từng bước hợp lệ, đại lượng đại diện cho gì và giả thiết nào đang được dùng.' },
    { id:'worked-examples', group:'scaffold', goals:['understand','recover'], triggers:['new','beginner','stuck'], weight:4, guide:'Đưa một ví dụ mẫu ngắn có giải thích, sau đó che dần các bước để người học tự hoàn thiện và giải bài tương tự.' },
    { id:'faded-guidance', group:'scaffold', goals:['understand','solve','recover'], triggers:['hint','mistake','confidence-low'], weight:4, guide:'Giảm dần mức hỗ trợ: mô tả hướng đi, gợi ý bước kế, rồi để trống phần cốt lõi cho người học tự làm.' },
    { id:'dual-coding', group:'representation', goals:['understand','remember'], triggers:['visual','force','field','circuit','graph'], weight:4, guide:'Kết hợp lời giải thích với sơ đồ, đồ thị hoặc hình lực có nhãn; yêu cầu người học tự vẽ và giải thích quan hệ giữa hình với công thức.' },
    { id:'concrete-examples', group:'understanding', goals:['understand'], triggers:['abstract','concept','new'], weight:3, guide:'Bắt đầu bằng hiện tượng hoặc ví dụ cụ thể, sau đó rút ra nguyên lý chung và thử một ví dụ khác.' },
    { id:'chunking', group:'cognitive-load', goals:['understand','solve','recover'], triggers:['complex','overload','multi-step'], weight:4, guide:'Chia vấn đề thành các phần nhỏ có tên rõ ràng; chỉ ghép các phần thành lời giải tổng thể sau khi từng phần đã vững.' },
    { id:'analogical-learning', group:'understanding', goals:['understand','transfer'], triggers:['analogy','new-context','model'], weight:3, guide:'Liên hệ bài mới với một tình huống đã biết, chỉ rõ điểm tương đồng và giới hạn của phép tương tự để tránh áp dụng sai.' },
    { id:'generation', group:'memory', goals:['remember','understand','teach'], triggers:['before-reading','prediction'], weight:3, guide:'Cho người học dự đoán, tự tạo câu hỏi hoặc phác thảo lời giải trước khi xem đáp án; sau đó đối chiếu và chỉnh sửa.' },
    { id:'cumulative-retrieval', group:'memory', goals:['remember','recover'], triggers:['long-term','cumulative','review'], weight:4, guide:'Trộn câu hỏi của chủ đề hiện tại với kiến thức cũ đã học để kiểm tra khả năng giữ kiến thức theo thời gian.' },
    { id:'deliberate-practice', group:'practice', goals:['solve','olympiad','recover'], triggers:['weak-skill','error','mastery'], weight:5, guide:'Chọn đúng một kỹ năng còn yếu, luyện ở độ khó vừa sức, phản hồi cụ thể, lặp lại có điều chỉnh và ghi nhận tiến bộ thực chất.' },
    { id:'error-analysis', group:'practice', goals:['recover','solve','olympiad'], triggers:['mistake','error','wrong'], weight:5, guide:'Phân loại lỗi khái niệm, chọn mô hình, đại số, đơn vị, giả thiết hoặc tính toán; yêu cầu sửa nguyên nhân chứ không chỉ sửa đáp số.' },
    { id:'metacognitive-calibration', group:'metacognition', goals:['remember','understand','solve','recover'], triggers:['confidence','reflection','self-check'], weight:4, guide:'Trước khi xem kết quả, yêu cầu tự chấm mức chắc chắn; sau đó so sánh tự tin với độ chính xác và chọn phần cần học lại.' },
    { id:'transfer-practice', group:'transfer', goals:['solve','olympiad','teach'], triggers:['mastered','new-context','variant'], weight:5, guide:'Đổi dữ kiện, biểu diễn hoặc bối cảnh nhưng giữ nguyên nguyên lý; yêu cầu người học tự nhận ra điểm bất biến và giải thích lựa chọn.' },
    { id:'varied-practice', group:'practice', goals:['solve','olympiad'], triggers:['application','multiple-types'], weight:3, guide:'Luyện nhiều biến thể có chủ đích, thay đổi một yếu tố mỗi lần và yêu cầu dự đoán tác động trước khi tính.' },
    { id:'concept-mapping', group:'representation', goals:['understand','teach','remember'], triggers:['relations','system','chapter'], weight:3, guide:'Tạo bản đồ khái niệm từ trí nhớ, nối định luật, đại lượng, điều kiện áp dụng và ví dụ bằng các mũi tên có ý nghĩa.' },
    { id:'feynman-teachback', group:'teaching', goals:['teach','understand','remember'], triggers:['explain','teach','simple'], weight:5, guide:'Yêu cầu giảng lại bằng ngôn ngữ đơn giản, không đọc tài liệu; học sinh AI hỏi đúng một câu vào chỗ thiếu căn cứ rồi yêu cầu giảng lại.' },
    { id:'socratic-questioning', group:'teaching', goals:['understand','teach','olympiad'], triggers:['assumption','proof','reason'], weight:4, guide:'Dùng câu hỏi gợi mở ngắn về điều đã biết, giả thiết, bằng chứng và hệ quả; không biến thành chuỗi câu hỏi dồn dập.' },
    { id:'polya-problem-solving', group:'problem-solving', goals:['solve','olympiad'], triggers:['olympiad','proof','complex'], weight:5, guide:'Đi theo nhịp: hiểu đề, lập kế hoạch, thực hiện, nhìn lại; ở mỗi chặng yêu cầu nêu lý do và kiểm tra kết quả.' },
    { id:'first-principles', group:'problem-solving', goals:['understand','solve','olympiad'], triggers:['derive','fundamental','model'], weight:4, guide:'Quay về định nghĩa, định luật nền và giả thiết; tự suy ra hệ thức thay vì ghi nhớ công thức không rõ điều kiện.' },
    { id:'problem-decomposition', group:'problem-solving', goals:['solve','olympiad','recover'], triggers:['multi-step','complex','system'], weight:4, guide:'Tách dữ kiện, mục tiêu, vật/hệ, định luật và các ẩn; giải từng phần rồi kiểm tra tính nhất quán khi ghép lại.' },
    { id:'multiple-solutions', group:'problem-solving', goals:['olympiad','transfer'], triggers:['advanced','proof','optimization'], weight:3, guide:'Sau một lời giải đúng, tìm thêm cách biểu diễn hoặc cách giải khác và so sánh giả thiết, độ ngắn, tính tổng quát.' },
    { id:'counterexample-testing', group:'problem-solving', goals:['olympiad','understand'], triggers:['claim','proof','boundary'], weight:3, guide:'Thử trường hợp biên hoặc phản ví dụ để kiểm tra mệnh đề, miền áp dụng và giả thiết ẩn trước khi kết luận.' },
    { id:'dimensional-analysis', group:'physics', goals:['solve','olympiad','recover'], triggers:['formula','unit','equation'], weight:5, guide:'Kiểm tra thứ nguyên, đơn vị và giới hạn hợp lý trước khi chấp nhận công thức hoặc kết quả số.' },
    { id:'prediction-observation', group:'physics', goals:['understand','transfer'], triggers:['experiment','simulation','phenomenon'], weight:3, guide:'Yêu cầu dự đoán kết quả trước khi xem mô phỏng hoặc dữ liệu; so sánh dự đoán với quan sát và giải thích sai lệch.' },
    { id:'exam-wrapper', group:'assessment', goals:['recover','remember','olympiad'], triggers:['exam','test','after-quiz'], weight:4, guide:'Sau bài kiểm tra, phân tích câu sai, câu đoán đúng, thời gian và mức tự tin; chuyển mỗi phát hiện thành một hành động ôn cụ thể.' },
    { id:'self-determination', group:'motivation', goals:['understand','remember','solve','teach'], triggers:['choice','autonomy','motivation'], weight:3, guide:'Cho người học quyền chọn thứ tự hoặc ví dụ trong phạm vi mục tiêu; giải thích tiêu chí thành công và tạo cảm giác tiến bộ có thể kiểm chứng.' },
    { id:'growth-mindset', group:'motivation', goals:['recover','solve','olympiad'], triggers:['failure','stuck','mistake'], weight:3, guide:'Diễn giải lỗi như thông tin về kỹ năng cần luyện, không gắn nhãn năng lực; đưa ra một bước sửa cụ thể và vừa sức.' },
    { id:'goal-gradient', group:'motivation', goals:['remember','solve','recover'], triggers:['progress','milestone','long-plan'], weight:3, guide:'Chia mục tiêu dài thành các mốc gần, hiển thị tiến độ thực chất và xác định bước nhỏ tiếp theo; không tạo áp lực chuỗi ngày.' },
    { id:'implementation-intentions', group:'planning', goals:['remember','solve','recover'], triggers:['habit','schedule','start'], weight:4, guide:'Chuyển ý định thành kế hoạch nếu-thì gắn với thời điểm hoặc tín hiệu cụ thể, ví dụ khi mở bài học thì giải một câu truy xuất trước.' },
    { id:'woop', group:'planning', goals:['solve','olympiad','recover'], triggers:['obstacle','goal','plan'], weight:3, guide:'Làm rõ mong muốn, kết quả, trở ngại có thể gặp và kế hoạch vượt trở ngại bằng một hành động cụ thể.' },
    { id:'immediate-feedback', group:'feedback', goals:['solve','recover','remember'], triggers:['attempt','answer','mistake'], weight:4, guide:'Phản hồi sớm, cụ thể và gắn với bước làm; giải thích vì sao đúng hoặc sai, sau đó cho cơ hội sửa ngay.' },
    { id:'peer-instruction', group:'social', goals:['understand','teach','solve'], triggers:['discussion','classroom','peer'], weight:3, guide:'Để người học chọn đáp án và nêu lý do trước, sau đó nghe lập luận khác, tự đánh giá lại và giải thích thay đổi nếu có.' },
    { id:'collaborative-retrieval', group:'social', goals:['remember','teach'], triggers:['group','study-together'], weight:2, guide:'Tổ chức truy xuất kiến thức theo lượt; mỗi người tự trả lời trước khi nhóm thống nhất, không để một người làm thay.' },
    { id:'sleep-recovery', group:'wellbeing', goals:['remember','recover'], triggers:['fatigue','overload','late'], weight:3, guide:'Khi dấu hiệu mệt hoặc quá tải xuất hiện, giảm khối lượng, đề xuất nghỉ và duy trì lịch ngủ đều đặn; không cổ súy thức khuya hay học đến kiệt sức.' },
    { id:'attention-restoration', group:'focus', goals:['understand','solve','remember'], triggers:['distracted','fatigue','focus'], weight:3, guide:'Giảm thông báo và tab không liên quan, làm một nhiệm vụ tại một thời điểm; nghỉ ngắn khi chú ý suy giảm rồi quay lại đúng điểm dừng.' },
    { id:'environment-design', group:'focus', goals:['understand','solve','remember'], triggers:['distraction','habit','start'], weight:3, guide:'Chuẩn bị tài liệu, dụng cụ và không gian trước phiên học; đặt điện thoại ngoài tầm với nếu người học muốn giảm xao nhãng.' },
    { id:'time-blocking', group:'focus', goals:['solve','remember','olympiad'], triggers:['schedule','deadline','long-plan'], weight:3, guide:'Đặt một nhiệm vụ và thời lượng rõ cho phiên học; để khoảng đệm cho nghỉ và việc phát sinh, không lấp kín toàn bộ ngày.' },
    { id:'pomodoro-flexible', group:'focus', goals:['understand','remember','solve'], triggers:['short-session','start','focus'], weight:3, guide:'Dùng một chặng tập trung ngắn rồi nghỉ; điều chỉnh độ dài theo năng lượng và độ khó thay vì ép mọi người theo một chu kỳ cố định.' },
    { id:'deep-work', group:'focus', goals:['olympiad','solve','teach'], triggers:['deep','complex','proof'], weight:3, guide:'Dành một khối thời gian không gián đoạn cho nhiệm vụ khó; xác định đầu ra trước và nghỉ phục hồi sau phiên.' },
    { id:'ultradian-breaks', group:'wellbeing', goals:['olympiad','solve','remember'], triggers:['long-session','fatigue'], weight:2, guide:'Sau một khối tập trung dài, tạm rời màn hình, vận động nhẹ và quay lại khi sẵn sàng; không xem thời lượng nghỉ là quy tắc y khoa.' },
    { id:'habit-stacking', group:'planning', goals:['remember','solve'], triggers:['routine','habit','start'], weight:2, guide:'Gắn hành động học nhỏ với một thói quen đã ổn định, giữ bước khởi động ngắn và dễ lặp lại.' },
    { id:'chinese-error-notebook', group:'practice', goals:['recover','solve','olympiad'], triggers:['wrong','error','mistake'], weight:4, guide:'Ghi lỗi theo nguyên nhân, lời giải đúng, dấu hiệu nhận biết và một bài biến thể; định kỳ tự làm lại mà không xem đáp án.' },
    { id:'chinese-dictation', group:'memory', goals:['remember','understand'], triggers:['formula','definition','law'], weight:3, guide:'Đóng tài liệu và tự viết lại định luật, công thức, điều kiện áp dụng cùng đơn vị; sau đó đối chiếu và sửa bằng màu khác.' },
    { id:'chinese-targeted-volume', group:'practice', goals:['solve','olympiad'], triggers:['fluency','speed','practice'], weight:3, guide:'Luyện số lượng bài vừa đủ nhưng có phân loại mục tiêu và độ khó; dừng để phân tích lỗi, không chạy theo số bài.' },
    { id:'chinese-topic-training', group:'practice', goals:['solve','olympiad','recover'], triggers:['weak-topic','chapter','theme'], weight:3, guide:'Tập trung một chuyên đề trong phiên ngắn, xen kẽ câu nền tảng và câu vận dụng; kết thúc bằng một câu chuyển giao.' },
    { id:'group-study', group:'social', goals:['remember','teach','solve'], triggers:['group','classroom','study-together'], weight:2, guide:'Học cùng người khác bằng cách mỗi người tự giải trước, sau đó giải thích và phản biện trên bằng chứng; tránh so sánh điểm số.' },
    { id:'planned-review', group:'planning', goals:['remember','recover'], triggers:['review','weekly','plan'], weight:3, guide:'Cuối phiên ghi điều đã hiểu, phần còn yếu và thời điểm ôn lại; đầu tuần điều chỉnh kế hoạch theo dữ liệu thực tế.' }
  ];

  const GOAL_ALIASES = {
    understand:['understand','teach'], remember:['remember','recover'],
    solve:['solve','olympiad'], olympiad:['olympiad','solve'],
    teach:['teach','understand'], recover:['recover','remember'],
    transfer:['transfer','solve']
  };

  function safeContext(context = {}) {
    const energy = Number(context.energy);
    const confidence = Number(context.confidence);
    const percent = Number(context.percent);
    const errors = Number(context.errorCount);
    const minutes = Number(context.minutes);
    return {
      goal: Object.hasOwn(GOAL_ALIASES, context.goal) ? context.goal : 'understand',
      topic: String(context.topic || 'Vật lý').slice(0, 120),
      phase: String(context.phase || '').slice(0, 40),
      energy: [1,2,3].includes(energy) ? energy : 2,
      confidence: Number.isFinite(confidence) ? Math.max(1, Math.min(5, confidence)) : 3,
      percent: Number.isFinite(percent) ? Math.max(0, Math.min(100, percent)) : null,
      errorCount: Number.isFinite(errors) ? Math.max(0, Math.min(100, errors)) : 0,
      minutes: Number.isFinite(minutes) ? Math.max(5, Math.min(180, minutes)) : 25,
      fatigue: context.fatigue === true,
      distracted: context.distracted === true
    };
  }

  function loadRecent() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || '{}');
      return Array.isArray(raw.recent) ? raw.recent.filter(id => typeof id === 'string').slice(-MAX_RECENT) : [];
    } catch (_) { return []; }
  }

  function saveRecent(ids) {
    try { localStorage.setItem(STORE, JSON.stringify({ recent: ids.slice(-MAX_RECENT) })); }
    catch (_) { /* Learning guidance remains available without persistence. */ }
  }

  function scoreMethod(method, context, recent) {
    const goals = GOAL_ALIASES[context.goal] || [context.goal];
    let score = goals.includes(context.goal) ? 1 : 0;
    if (method.goals.some(goal => goals.includes(goal))) score += method.weight;
    const topic = context.topic.toLocaleLowerCase('vi');
    if (method.triggers.some(trigger => topic.includes(trigger))) score += 1;
    if (context.errorCount >= 2 && ['error-analysis','deliberate-practice','faded-guidance','chinese-error-notebook'].includes(method.id)) score += 5;
    if (context.percent !== null && context.percent >= 85 && ['transfer-practice','interleaving','multiple-solutions'].includes(method.id)) score += 4;
    if (context.energy === 1 && ['chunking','worked-examples','pomodoro-flexible','environment-design'].includes(method.id)) score += 4;
    if (context.energy === 3 && ['deep-work','deliberate-practice','polya-problem-solving'].includes(method.id)) score += 3;
    if (context.confidence <= 2 && ['worked-examples','faded-guidance','growth-mindset'].includes(method.id)) score += 4;
    if (context.fatigue && ['sleep-recovery','attention-restoration','ultradian-breaks'].includes(method.id)) score += 8;
    if (context.distracted && ['attention-restoration','environment-design','pomodoro-flexible'].includes(method.id)) score += 6;
    if (recent.includes(method.id)) score -= 5;
    return score;
  }

  function select(input = {}) {
    const context = safeContext(input);
    const recent = loadRecent();
    const ranked = METHODS.map(method => ({ method, score: scoreMethod(method, context, recent) }))
      .sort((a, b) => b.score - a.score || a.method.id.localeCompare(b.method.id));
    const chosen = [];
    const groups = new Set();
    for (const entry of ranked) {
      if (chosen.length >= 4) break;
      if (entry.score <= 0 || (groups.has(entry.method.group) && chosen.length < 3)) continue;
      chosen.push(entry.method);
      groups.add(entry.method.group);
    }
    if (chosen.length < 2) {
      for (const entry of ranked) {
        if (chosen.length >= 2) break;
        if (!chosen.some(item => item.id === entry.method.id)) chosen.push(entry.method);
      }
    }
    const ids = chosen.map(item => item.id);
    saveRecent(recent.filter(id => !ids.includes(id)).concat(ids));
    return chosen.map(({ id, group, guide }) => ({ id, group, guide }));
  }

  function directive(input = {}) {
    const context = safeContext(input);
    const chosen = select(context);
    const methods = chosen.map((item, index) => (index + 1) + '. ' + item.guide).join('\\n');
    return [
      'HƯỚNG DẪN HỌC CÁ NHÂN HÓA NỘI BỘ — không hiển thị tên kỹ thuật cho người học:',
      'Mục tiêu=' + context.goal + '; chủ đề=' + context.topic + '; năng lượng=' + context.energy + '/3; độ tự tin=' + context.confidence + '/5; kết quả gần nhất=' + (context.percent === null ? 'chưa có' : context.percent + '%') + '; lỗi chưa xử lý=' + context.errorCount + '.',
      'Chỉ phối hợp các cách sau khi chúng bổ trợ nhau; không nhồi tất cả vào một phiên:',
      methods,
      'Giữ tải nhận thức vừa sức. Mỗi lượt chỉ hỏi một câu; cho thời gian tự nghĩ; phản hồi cụ thể; buộc người học tự làm lại và thử chuyển giao trước khi kết luận đã thành thạo. Không cổ súy thức khuya, học đến kiệt sức, so sánh điểm số hay duy trì chuỗi ngày bằng áp lực.'
    ].join('\\n\\n');
  }

  function focusPlan(input = {}) {
    const context = safeContext(input);
    const focusMinutes = context.energy === 1 ? Math.min(15, context.minutes) : context.energy === 3 ? Math.min(50, context.minutes) : Math.min(25, context.minutes);
    const breakMinutes = context.energy === 1 ? 5 : focusMinutes >= 45 ? 10 : 5;
    return Object.freeze({
      focusMinutes,
      breakMinutes,
      cycles: Math.max(1, Math.min(4, Math.ceil(context.minutes / Math.max(1, focusMinutes)))),
      mode: context.energy === 1 ? 'gentle' : context.energy === 3 ? 'deep' : 'steady',
      instruction: context.energy === 3
        ? 'Tắt xao nhãng, làm một nhiệm vụ khó có đầu ra rõ, sau đó nghỉ phục hồi.'
        : context.energy === 1
          ? 'Chỉ bắt đầu bằng một chặng ngắn; ưu tiên hoàn thành một việc nhỏ rồi nghỉ.'
          : 'Tập trung một nhiệm vụ trong chặng vừa phải, nghỉ ngắn và kiểm tra kết quả.'
    });
  }

  window.PrincipiaLearningScience = Object.freeze({
    select,
    directive,
    focusPlan,
    methods: () => METHODS.map(({ id, group, weight }) => ({ id, group, weight })),
    stats: () => ({ strategyCount: METHODS.length, groups: [...new Set(METHODS.map(method => method.group))].length })
  });
})();
