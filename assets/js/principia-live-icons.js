/* PRINCIPIA Live UI Icons — semantic icons and tactile motion on existing controls. */
(() => {
  'use strict';
  const ICONS = {
    home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',
    learn:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"/><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20M8 7h8M8 10h6"/>',
    quiz:'<path d="M9 11a3 3 0 1 1 5.7 1.3c-.8 1.1-2.7 1.3-2.7 3"/><path d="M12 19h.01"/><circle cx="12" cy="12" r="9"/>',
    challenge:'<path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2z"/><path d="m19 14 1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>',
    rank:'<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/>',
    lab:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3"/><path d="M8 15h8"/>',
    notes:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h8"/>',
    ai:'<path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1m0-12.8-2.1 2.1m-8.6 8.6-2.1 2.1"/><circle cx="12" cy="12" r="4"/>',
    search:'<circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/>',
    settings:'<path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z"/><path d="m19.4 15 .1.1 1.4 1.1-1.4 2.4-1.7-.6a8 8 0 0 1-1.5.9l-.3 1.8h-2.8l-.3-1.8a8 8 0 0 1-1.5-.9l-1.7.6-1.4-2.4 1.4-1.1a7 7 0 0 1 0-1.8l-1.4-1.1 1.4-2.4 1.7.6a8 8 0 0 1 1.5-.9l.3-1.8h2.8l.3 1.8a8 8 0 0 1 1.5.9l1.7-.6 1.4 2.4-1.4 1.1a7 7 0 0 1 0 1.7Z"/>',
    profile:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    trophy:'<path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4"/>',
    play:'<path d="m8 5 12 7-12 7z"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    flash:'<path d="m13 2-3 9h7l-6 11 2-9H6z"/>',
    book:'<path d="M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 0 4 22z"/><path d="M4 4.5v15A2.5 2.5 0 0 1 6.5 17H20"/>',
    arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    games:'<path d="M6 11h12a4 4 0 0 1 3.8 5.2l-.5 1.6a2 2 0 0 1-3.2.9L15.5 16h-7l-2.6 2.7a2 2 0 0 1-3.2-.9l-.5-1.6A4 4 0 0 1 6 11Z"/><path d="M8 13v4m-2-2h4m6-1h.01m2 2h.01"/>',
    progress:'<path d="M4 19V5m0 14h17"/><path d="m7 15 4-4 3 2 5-6"/><path d="M16 7h3v3"/>',
    discover:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8z"/>',
    music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    research:'<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h5M8 16h3"/><circle cx="17" cy="17" r="3"/>',
    classroom:'<path d="M3 4h18v13H3z"/><path d="m7 21 5-4 5 4M8 9h8m-8 4h5"/>',
    community:'<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0m1-5a5 5 0 0 1 5 5"/>',
    store:'<path d="M4 9h16l-1 12H5L4 9Z"/><path d="m3 9 2-6h14l2 6M9 13v3m6-3v3"/>',
    admin:'<path d="M12 3 20 6v5c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z"/><path d="m9 12 2 2 4-4"/>',
    edit:'<path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5z"/><path d="m13.8 6.7 3.5 3.5"/>',
    more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.6 2.6 0 1 1 4.6 1.7c-1.2 1.1-2.1 1.4-2.1 3.3M12 17.5h.01"/>',
    star:'<path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z"/>'
  };
  const RULES = [
    [/home|trang chủ|dashboard|overview/i,'home'],
    [/learn|học tập|bài học|lessons|course/i,'learn'],
    [/quiz|trắc nghiệm|luyện đề|exam|test/i,'quiz'],
    [/daily challenge|thử thách|nhiệm vụ ngày|daily quest/i,'challenge'],
    [/rank|ranking|leaderboard|xếp hạng/i,'rank'],
    [/physics lab|phòng thí nghiệm|mô phỏng|simulation/i,'lab'],
    [/notes|ghi chú|notebook|sổ lỗi sai/i,'notes'],
    [/ai coach|trợ lý|assistant|ai tutor|gia sư/i,'ai'],
    [/search|tìm kiếm/i,'search'],
    [/setting|cài đặt|tùy chỉnh/i,'settings'],
    [/profile|tài khoản|hồ sơ/i,'profile'],
    [/calendar|lịch học|schedule|study plan/i,'calendar'],
    [/achievement|thành tích|trophy|phần thưởng/i,'trophy'],
    [/start|bắt đầu|continue|tiếp tục|launch|play/i,'play'],
    [/submit|nộp bài|complete|hoàn thành|correct/i,'check'],
    [/notification|thông báo/i,'bell'],
    [/flashcard|thẻ ghi nhớ|flash/i,'flash'],
    [/library|thư viện|textbook|tài liệu/i,'book'],
    [/game|games|đố vui|trò chơi|mini game/i,'games'],
    [/progress|tiến độ|thống kê|analytics/i,'progress'],
    [/discover|khám phá|explore/i,'discover'],
    [/music|âm nhạc|focus/i,'music'],
    [/research|nghiên cứu|sổ nghiên cứu/i,'research'],
    [/classroom|lớp học|giảng dạy/i,'classroom'],
    [/community|cộng đồng|multiplayer/i,'community'],
    [/shop|store|cửa hàng|vật phẩm/i,'store'],
    [/admin|quản trị|administrator/i,'admin'],
    [/edit|chỉnh sửa|editor/i,'edit'],
    [/more|thêm|khác/i,'more'],
    [/help|trợ giúp|hỗ trợ/i,'help'],
    [/favorite|yêu thích|featured/i,'star']
  ];
  const SELECTOR = '#app .nav a,#app .nav button,#app nav a,#app nav button,#app button,#app [role="button"],#app a';
  function labelOf(node) {
    return (node.getAttribute('aria-label') || node.getAttribute('title') || node.innerText || node.textContent || '').replace(/\s+/g,' ').trim().slice(0,140);
  }
  const SLOT_KEYS=Object.freeze([...new Set(RULES.map(([,icon])=>icon))]);
  const OVERRIDE_KEY='principia_icon_slot_overrides_v1';
  function readOverrides(){
    try{
      const saved=JSON.parse(localStorage.getItem(OVERRIDE_KEY)||'{}');
      return Object.fromEntries(Object.entries(saved).filter(([slot,icon])=>SLOT_KEYS.includes(slot)&&Object.prototype.hasOwnProperty.call(ICONS,icon)));
    }catch(_){return {}}
  }
  let overrides=readOverrides();
  function baseIcon(label) {
    for (const [pattern, icon] of RULES) if (pattern.test(label)) return icon;
    return null;
  }
  function choose(label) {
    const base=baseIcon(label);
    return base?(overrides[base]||base):null;
  }
  function applyOverrides(){
    document.querySelectorAll('#app [data-pr-icon-done="1"]').forEach(node=>{
      const icon=choose(labelOf(node));
      if(!icon||!Object.prototype.hasOwnProperty.call(ICONS,icon))return;
      const svg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS[icon]+'</svg>';
      const holder=node.querySelector(':scope > .nav-default-icon');
      const live=node.querySelector(':scope > .pr-live-icon');
      if(holder)holder.innerHTML=svg;
      else if(live){live.className='pr-live-icon pr-live-icon-'+icon;live.innerHTML=svg;}
    });
  }
  function setOverrides(next){
    const safe={};
    if(next&&typeof next==='object'){
      Object.entries(next).forEach(([slot,icon])=>{
        if(SLOT_KEYS.includes(slot)&&Object.prototype.hasOwnProperty.call(ICONS,icon)&&icon!==slot)safe[slot]=icon;
      });
    }
    overrides=safe;
    try{localStorage.setItem(OVERRIDE_KEY,JSON.stringify(overrides))}catch(_){}
    applyOverrides();
    return {...overrides};
  }
  function decorate(root=document) {
    const nodes = [];
    if (root instanceof Element && root.matches(SELECTOR)) nodes.push(root);
    root.querySelectorAll?.(SELECTOR).forEach(node => nodes.push(node));
    for (const node of nodes) {
      if (node.dataset.prIconDone || node.closest('#proSiteEditorPanel,.principia-mobile-nav,[data-pr-no-icon]')) continue;
      const icon = choose(labelOf(node));
      if (!icon || !Object.prototype.hasOwnProperty.call(ICONS,icon)) continue;
      const svg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS[icon]+'</svg>';
      const navHolder=node.querySelector(':scope > .nav-default-icon');
      if(navHolder){
        if(!navHolder.dataset.prOriginalMarkup)navHolder.dataset.prOriginalMarkup=navHolder.innerHTML;
        navHolder.innerHTML=svg;
        navHolder.classList.add('pr-nav-live-icon');
        navHolder.setAttribute('aria-hidden','true');
      }else{
        if(node.querySelector('.pr-live-icon,svg,img')){node.dataset.prIconDone='1';continue}
        const span=document.createElement('span');
        span.className='pr-live-icon pr-live-icon-'+icon;
        span.setAttribute('aria-hidden','true');
        span.innerHTML=svg;
        node.insertBefore(span,node.firstChild);
      }
      node.classList.add('pr-icon-enhanced');
      node.dataset.prIconDone='1';
    }
  }
  function setupPressMotion() {
    document.addEventListener('pointerdown',event=>{
      const node=event.target instanceof Element?event.target.closest('#app button,#app a,#app [role="button"]'):null;
      if(!node||node.matches(':disabled,[aria-disabled="true"]')||node.closest('#proSiteEditorPanel,.principia-mobile-nav'))return;
      node.classList.remove('pr-tactile-press');
      requestAnimationFrame(()=>node.classList.add('pr-tactile-press'));
      window.setTimeout(()=>node.classList.remove('pr-tactile-press'),360);
    },{passive:true});
  }
  function init() {
    decorate();
    setupPressMotion();
    const observer=new MutationObserver(records=>records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)decorate(node)})));
    observer.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});
    document.addEventListener('principia:rendered',()=>decorate());
    document.addEventListener('principia:page-changed',()=>decorate());
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    window.PrincipiaLiveIcons=Object.freeze({
      refresh:decorate,
      icons:Object.keys(ICONS).length,
      names:Object.freeze(Object.keys(ICONS)),
      slots:Object.freeze(SLOT_KEYS.map(key=>Object.freeze({key,label:key}))),
      getOverrides(){return {...overrides}},
      setOverrides,
      getSvg(name){return Object.prototype.hasOwnProperty.call(ICONS,name)?'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'+ICONS[name]+'</svg>':'';}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
