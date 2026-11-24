/* PRINCIPIA Component Vault
 * Local copy/export workbench for reusable patterns adapted from the supplied UI references.
 * Source snippets are retained only with attribution and reuse permission; other libraries are adapted as vanilla UI patterns.
 */
(() => {
  'use strict';
  const SOURCES = [
    ['Animate UI','https://animate-ui.com/','48 animated primitives and UI elements; React-based'],
    ['Kokonut UI','https://kokonutui.com/docs','116 public components; React + Tailwind; Pro collection separate'],
    ['Uiverse','https://uiverse.io/','7,411 community UI elements on the observed live page; inspect each item attribution/license'],
    ['Libraries.dev','https://libraries.dev/introduction','5 React effect libraries; not a component catalog'],
    ['UI/UX Pro Max','https://devanshutak25.github.io/ui-ux-ref/','757 reference entries across styles, palettes, charts and rules'],
    ['FeralUI','https://feralui.dev/','13 public components; license must be verified before copying'],
    ['Anime.js','https://animejs.com/','1 animation library; already vendored locally'],
    ['favico.js','http://lab.ejci.net/favico.js/','1 favicon library; already vendored locally'],
    ['Hairline UI','https://hairline.lucasmarkes.com/','224 React components; adapt each component to vanilla HTML/CSS/JS'],
    ['Koboyo Mascot','https://koboyo.com/page-mascot','52 mascot designs; held pending completion of character submissions'],
    ['LucianLabs','https://lucianlabs.dev/uxui-prompt/','480 interactive elements; MIT; supports plain HTML/CSS/JS'],
    ['ThreeUI','https://threeui.com/browse','51 interactive UI elements; includes PRO items and 3D dependencies']
  ];
  const BASE_ITEMS = [
    ['Glass action button','Buttons','Kokonut UI','<button class="pv-glass">Launch workspace <span>↗</span></button>','.pv-glass{display:inline-flex;gap:12px;align-items:center;padding:12px 18px;border:1px solid rgba(255,255,255,.24);border-radius:14px;color:#fff;background:linear-gradient(135deg,rgba(145,125,255,.5),rgba(55,160,210,.28));box-shadow:inset 0 1px rgba(255,255,255,.25),0 12px 30px rgba(20,20,50,.2);backdrop-filter:blur(16px);cursor:pointer;transition:transform .25s,filter .25s}.pv-glass:hover{transform:translateY(-2px);filter:brightness(1.15)}'],
    ['Magnetic action','Buttons','FeralUI','<button class="pv-magnetic">Explore <span>✦</span></button>','.pv-magnetic{padding:13px 22px;border:0;border-radius:999px;color:#fff;background:#6554d9;box-shadow:0 8px 24px #6554d944;transition:transform .2s cubic-bezier(.2,.8,.2,1)}.pv-magnetic:hover{transform:translateY(-3px) scale(1.03)}'],
    ['Liquid press button','Buttons','Animate UI','<button class="pv-liquid">Continue</button>','.pv-liquid{padding:12px 22px;border:1px solid #a99aff;border-radius:13px;color:white;background:linear-gradient(120deg,#6554d9,#328eb5);box-shadow:0 5px 0 #34276f;transition:transform .16s,box-shadow .16s}.pv-liquid:active{transform:translateY(4px);box-shadow:0 1px 0 #34276f}'],
    ['Shimmer button','Buttons','Uiverse','<button class="pv-shimmer">Save changes</button>','.pv-shimmer{position:relative;overflow:hidden;padding:12px 18px;border:1px solid #ffffff38;border-radius:11px;color:#fff;background:#272345}.pv-shimmer:after{content:"";position:absolute;inset:-40% auto -40% -45%;width:35%;background:linear-gradient(90deg,transparent,#ffffff66,transparent);transform:rotate(20deg);transition:transform .6s}.pv-shimmer:hover:after{transform:translateX(480%) rotate(20deg)}'],
    ['Gradient outline button','Buttons','Uiverse','<button class="pv-outline">Open details</button>','.pv-outline{padding:11px 18px;border:1px solid transparent;border-radius:12px;color:#e9e5ff;background:linear-gradient(#17172b,#17172b) padding-box,linear-gradient(110deg,#a98bff,#62c8e7) border-box;transition:box-shadow .2s}.pv-outline:hover{box-shadow:0 0 24px #9b83ff55}'],
    ['AI thinking state','AI & feedback','Kokonut UI','<div class="pv-thinking"><i></i><i></i><i></i><span>Analyzing the problem…</span></div>','.pv-thinking{display:flex;align-items:center;gap:6px;color:inherit;font:13px system-ui}.pv-thinking i{width:7px;height:7px;border-radius:50%;background:#a995ff;animation:pv-dot 1s infinite alternate}.pv-thinking i:nth-child(2){animation-delay:.18s}.pv-thinking i:nth-child(3){animation-delay:.36s}.pv-thinking span{margin-left:7px}@keyframes pv-dot{to{opacity:.35;transform:translateY(-4px)}}'],
    ['AI progress steps','AI & feedback','Kokonut UI','<ol class="pv-steps"><li class="done">Parse question</li><li class="active">Derive equations</li><li>Verify result</li></ol>','.pv-steps{display:grid;gap:9px;padding:0;list-style:none;font:13px system-ui}.pv-steps li{padding:9px 12px;border:1px solid #ffffff20;border-radius:10px;color:#999}.pv-steps li:before{content:"○";margin-right:9px}.pv-steps li.done:before{content:"✓";color:#64d6aa}.pv-steps li.active{color:inherit;border-color:#a995ff;background:#a995ff18}'],
    ['Typing indicator','AI & feedback','Animate UI','<div class="pv-typing"><b></b><b></b><b></b></div>','.pv-typing{display:flex;gap:5px;padding:12px}.pv-typing b{width:7px;height:7px;border-radius:50%;background:#9d8bff;animation:pv-type .7s infinite alternate}.pv-typing b:nth-child(2){animation-delay:.15s}.pv-typing b:nth-child(3){animation-delay:.3s}@keyframes pv-type{to{transform:translateY(-5px);opacity:.45}}'],
    ['Toast notification','AI & feedback','Animate UI','<div class="pv-toast"><strong>✓</strong><span>Progress saved successfully</span></div>','.pv-toast{display:flex;align-items:center;gap:10px;padding:12px 15px;border:1px solid #75d8ad55;border-radius:13px;color:inherit;background:#17382dcc;box-shadow:0 12px 32px #0003;font:13px system-ui}.pv-toast strong{color:#75d8ad}'],
    ['Glass information card','Cards','Kokonut UI','<article class="pv-card"><small>PHYSICS / 01</small><h3>Momentum</h3><p>Understand how motion is transferred in an isolated system.</p><a href="#">Open lesson ↗</a></article>','.pv-card{max-width:290px;padding:18px;border:1px solid #ffffff25;border-radius:18px;background:linear-gradient(145deg,#252344dd,#121c32dd);color:#f6f4ff;box-shadow:0 16px 45px #0003;backdrop-filter:blur(16px);font:14px system-ui;transition:transform .25s}.pv-card:hover{transform:translateY(-5px)}.pv-card small{color:#a995ff;letter-spacing:.12em}.pv-card h3{margin:12px 0 6px}.pv-card p{color:#c0bfd0;line-height:1.55}.pv-card a{color:#a9dfff;text-decoration:none}'],
    ['Spotlight card','Cards','Libraries.dev','<article class="pv-spot"><h3>Deep Work</h3><p>Focus session · 45 minutes</p></article>','.pv-spot{position:relative;overflow:hidden;padding:22px;border:1px solid #ffffff22;border-radius:16px;color:inherit;background:radial-gradient(240px circle at var(--x,50%) var(--y,50%),#8b79ff38,transparent 65%),#17172a;min-width:220px}.pv-spot h3{margin:0 0 7px}.pv-spot p{margin:0;color:#aaa}'],
    ['3D tilt tile','Cards','ThreeUI','<article class="pv-tilt"><strong>Orbital Mechanics</strong><span>3D interactive surface</span></article>','.pv-tilt{display:grid;gap:12px;min-width:220px;padding:22px;border:1px solid #ffffff25;border-radius:16px;color:white;background:linear-gradient(145deg,#24244b,#101c2d);box-shadow:12px 14px 30px #0004;transform:perspective(700px) rotateX(4deg) rotateY(-6deg);transition:transform .3s}.pv-tilt:hover{transform:perspective(700px) rotateX(0) rotateY(0) translateY(-4px)}.pv-tilt span{color:#aaa;font-size:12px}'],
    ['Border beam panel','Cards','Libraries.dev','<section class="pv-beam"><strong>Live simulation</strong><p>Model status: running</p></section>','.pv-beam{position:relative;isolation:isolate;padding:20px;border:1px solid #ffffff20;border-radius:15px;background:#18182b;color:inherit;overflow:hidden}.pv-beam:before{content:"";position:absolute;inset:-1px;padding:1px;border-radius:inherit;background:conic-gradient(from 0deg,transparent 0 70%,#a995ff,#62c8e7,transparent 90%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude;animation:pv-spin 5s linear infinite;pointer-events:none}@keyframes pv-spin{to{transform:rotate(360deg)}}'],
    ['Profile capsule','Cards','Kokonut UI','<div class="pv-profile"><span>PH</span><div><strong>Physics Mentor</strong><small>Online · Ready to help</small></div></div>','.pv-profile{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #ffffff20;border-radius:15px;background:#1b1b30;color:inherit;font:13px system-ui}.pv-profile>span{display:grid;place-items:center;width:42px;height:42px;border-radius:50%;background:linear-gradient(135deg,#a995ff,#5fc5e7);color:#15152a;font-weight:800}.pv-profile div{display:grid;gap:4px}.pv-profile small{color:#9d9bad}'],
    ['Animated progress bar','Progress','Animate UI','<div class="pv-progress"><span style="width:68%"></span></div>','.pv-progress{height:8px;overflow:hidden;border-radius:99px;background:#ffffff18}.pv-progress span{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,#9d86ff,#5cc6e8);box-shadow:0 0 14px #9d86ff88;animation:pv-grow 1s ease-out}@keyframes pv-grow{from{width:0}}'],
    ['Circular mastery ring','Progress','Kokonut UI','<div class="pv-ring"><span>82<small>%</small></span></div>','.pv-ring{display:grid;place-items:center;width:92px;height:92px;border-radius:50%;background:conic-gradient(#a995ff 0 82%,#ffffff18 82%);position:relative}.pv-ring:before{content:"";position:absolute;inset:7px;border-radius:50%;background:#19192c}.pv-ring span{z-index:1;color:white;font:700 23px system-ui}.pv-ring small{font-size:11px}'],
    ['Skeleton loader','Progress','Kokonut UI','<div class="pv-skeleton"><i></i><i></i><i></i></div>','.pv-skeleton{display:grid;gap:9px;width:240px}.pv-skeleton i{height:11px;border-radius:8px;background:linear-gradient(100deg,#ffffff0d 20%,#ffffff30 45%,#ffffff0d 70%);background-size:220% 100%;animation:pv-skel 1.4s infinite}.pv-skeleton i:nth-child(2){width:78%}.pv-skeleton i:nth-child(3){width:55%}@keyframes pv-skel{to{background-position-x:-220%}}'],
    ['Status badge','Labels','Uiverse','<span class="pv-badge">● Active</span>','.pv-badge{display:inline-flex;align-items:center;gap:7px;padding:6px 10px;border:1px solid #66d6a655;border-radius:99px;color:#8de4bb;background:#66d6a615;font:12px system-ui}'],
    ['Animated number','Labels','Animate UI','<strong class="pv-number">12,480 <small>XP</small></strong>','.pv-number{font:700 27px system-ui;color:inherit;font-variant-numeric:tabular-nums}.pv-number small{font-size:11px;color:#a995ff}'],
    ['Search input','Inputs','Kokonut UI','<label class="pv-search"><span>⌕</span><input placeholder="Search physics topics…"></label>','.pv-search{display:flex;align-items:center;gap:9px;padding:10px 13px;border:1px solid #ffffff25;border-radius:12px;background:#151529;color:#aaa}.pv-search:focus-within{border-color:#a995ff;box-shadow:0 0 0 3px #a995ff22}.pv-search input{min-width:0;border:0;outline:0;background:transparent;color:white;font:13px system-ui}.pv-search input::placeholder{color:#858397}'],
    ['Toggle switch','Inputs','Animate UI','<label class="pv-switch"><input type="checkbox" checked><span></span><b>Enable focus mode</b></label>','.pv-switch{display:inline-flex;align-items:center;gap:10px;color:inherit;font:13px system-ui}.pv-switch input{position:absolute;opacity:0}.pv-switch span{width:38px;height:22px;border-radius:99px;background:#555;transition:background .2s;position:relative}.pv-switch span:after{content:"";position:absolute;width:16px;height:16px;top:3px;left:3px;border-radius:50%;background:white;transition:transform .2s}.pv-switch input:checked+span{background:#8874ee}.pv-switch input:checked+span:after{transform:translateX(16px)}'],
    ['Segmented tabs','Navigation','Animate UI','<nav class="pv-tabs"><button class="active">Overview</button><button>Progress</button><button>Notes</button></nav>','.pv-tabs{display:flex;gap:4px;padding:4px;border:1px solid #ffffff1f;border-radius:12px;background:#17172a}.pv-tabs button{padding:8px 12px;border:0;border-radius:9px;color:#aaa;background:transparent;cursor:pointer}.pv-tabs button.active{color:white;background:#8e7bea55;box-shadow:inset 0 0 0 1px #a995ff44}'],
    ['Accordion disclosure','Navigation','Animate UI','<details class="pv-accordion"><summary>Why is momentum conserved?</summary><p>Because the net external impulse on an isolated system is zero.</p></details>','.pv-accordion{max-width:320px;padding:12px 14px;border:1px solid #ffffff22;border-radius:12px;color:inherit;background:#19192c;font:13px system-ui}.pv-accordion summary{cursor:pointer;font-weight:650}.pv-accordion p{color:#aaa;line-height:1.5}'],
    ['Tooltip hint','Navigation','Uiverse','<span class="pv-tip" data-tip="Open the detailed derivation">Hover for a hint</span>','.pv-tip{position:relative;border-bottom:1px dashed #a995ff;cursor:help;color:inherit;font:13px system-ui}.pv-tip:after{content:attr(data-tip);position:absolute;bottom:calc(100% + 9px);left:50%;transform:translate(-50%,5px);padding:7px 10px;border-radius:8px;background:#101020;color:white;font-size:11px;white-space:nowrap;opacity:0;pointer-events:none;transition:.2s}.pv-tip:hover:after{opacity:1;transform:translate(-50%,0)}'],
    ['Command palette row','Navigation','Kokonut UI','<div class="pv-command"><kbd>⌘ K</kbd><span>Search commands and pages</span><b>↵</b></div>','.pv-command{display:flex;align-items:center;gap:12px;max-width:320px;padding:11px;border:1px solid #ffffff24;border-radius:12px;background:#19192d;color:#ccc;font:12px system-ui}.pv-command span{flex:1}.pv-command kbd,.pv-command b{padding:4px 7px;border:1px solid #ffffff25;border-radius:6px;color:#a99aff}'],
    ['Hairline geometry','Visuals','Hairline UI','<svg class="pv-geometry" viewBox="0 0 180 100" role="img" aria-label="Geometric orbit"><path d="M12 78 52 15 92 78 132 15 168 78M12 78H168M52 15H132" fill="none" stroke="currentColor" stroke-width="1.2"/><circle cx="92" cy="48" r="15" fill="none" stroke="#a995ff"/><circle cx="92" cy="48" r="3" fill="#a995ff"/></svg>','.pv-geometry{width:180px;max-width:100%;color:#79c8e6;filter:drop-shadow(0 0 8px #a995ff55)}'],
    ['Orbital accent','Visuals','ThreeUI','<div class="pv-orbit"><i></i><b></b></div>','.pv-orbit{position:relative;width:72px;height:72px;border:1px solid #8f7cff66;border-radius:50%;display:grid;place-items:center;animation:pv-orbit 8s linear infinite}.pv-orbit:before,.pv-orbit:after{content:"";position:absolute;inset:12px;border:1px solid #62c8e766;border-radius:50%;transform:rotateX(65deg) rotate(35deg)}.pv-orbit:after{transform:rotateX(65deg) rotate(-35deg)}.pv-orbit i{width:9px;height:9px;border-radius:50%;background:#a995ff;box-shadow:0 0 16px #a995ff}.pv-orbit b{position:absolute;top:7px;right:10px;width:5px;height:5px;border-radius:50%;background:#6de1d1}@keyframes pv-orbit{to{transform:rotate(360deg)}}'],
    ['Mascot speech bubble','Visuals','Koboyo Mascot','<div class="pv-mascot"><span>✦</span><p>You are making progress. Keep going.</p></div>','.pv-mascot{display:flex;align-items:center;gap:10px;color:inherit;font:13px system-ui}.pv-mascot span{display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:linear-gradient(135deg,#a995ff,#6ccbe5);color:#17152b}.pv-mascot p{margin:0;padding:10px 13px;border:1px solid #ffffff22;border-radius:12px;background:#1a1a30}'],
    ['Theme switch chip','Controls','LucianLabs','<button class="pv-theme">◐ <span>Switch theme</span></button>','.pv-theme{display:inline-flex;align-items:center;gap:8px;padding:9px 12px;border:1px solid #ffffff25;border-radius:10px;color:inherit;background:#202039;cursor:pointer}.pv-theme:hover{border-color:#a995ff;box-shadow:0 0 18px #a995ff22}'],
    ['Copy code block','Developer','Kokonut UI','<pre class="pv-code"><code>const energy = 0.5 * mass * velocity ** 2;</code></pre>','.pv-code{max-width:340px;overflow:auto;padding:13px;border:1px solid #ffffff20;border-radius:11px;color:#bfe7ff;background:#101321;font:12px/1.6 ui-monospace,monospace}'],
    ['Timeline milestone','Data','UI/UX Pro Max','<ol class="pv-timeline"><li><b>01</b><span>Define model</span></li><li><b>02</b><span>Calculate forces</span></li><li><b>03</b><span>Verify units</span></li></ol>','.pv-timeline{display:grid;gap:10px;margin:0;padding:0;list-style:none;font:13px system-ui}.pv-timeline li{display:flex;align-items:center;gap:10px;color:inherit}.pv-timeline b{display:grid;place-items:center;width:27px;height:27px;border-radius:50%;color:#c7bbff;background:#a995ff22;border:1px solid #a995ff66}.pv-timeline span{padding:8px 12px;border-bottom:1px solid #ffffff18}'],
    ['Metric card','Data','UI/UX Pro Max','<div class="pv-metric"><small>WEEKLY STUDY TIME</small><strong>12.5h</strong><span>↗ 18% vs last week</span></div>','.pv-metric{display:grid;gap:7px;min-width:180px;padding:15px;border:1px solid #ffffff20;border-radius:13px;background:#1a1a30;color:inherit;font:12px system-ui}.pv-metric small{color:#aaa;letter-spacing:.08em}.pv-metric strong{font-size:26px;font-variant-numeric:tabular-nums}.pv-metric span{color:#71d5a9}'],
    ['Focus timer face','Controls','LucianLabs','<div class="pv-timer"><strong>25:00</strong><small>FOCUS SESSION</small></div>','.pv-timer{display:grid;gap:5px;place-items:center;width:150px;padding:18px;border:1px solid #a995ff44;border-radius:18px;background:radial-gradient(circle,#a995ff18,#18182b 70%);color:inherit}.pv-timer strong{font:700 28px ui-monospace,monospace;font-variant-numeric:tabular-nums}.pv-timer small{color:#a995ff;letter-spacing:.12em;font-size:9px}'],
    ['Floating label input','Inputs','Kokonut UI','<label class="pv-field"><input placeholder=" "><span>Your answer</span></label>','.pv-field{position:relative;display:block;width:220px}.pv-field input{width:100%;padding:18px 11px 8px;border:1px solid #ffffff30;border-radius:10px;background:#17172b;color:white;outline:0}.pv-field span{position:absolute;left:11px;top:12px;color:#999;pointer-events:none;transition:.18s;font:12px system-ui}.pv-field input:focus+span,.pv-field input:not(:placeholder-shown)+span{top:4px;font-size:9px;color:#b8a8ff}'],
    ['Image zoom frame','Visuals','Animate UI','<div class="pv-zoom"><span>PHYSICS / VISUAL</span></div>','.pv-zoom{display:grid;place-items:center;width:220px;height:120px;border-radius:14px;background:radial-gradient(circle at 35% 35%,#74c6e8,#302c64 55%,#101425);overflow:hidden;transition:transform .3s}.pv-zoom:hover{transform:scale(1.035)}.pv-zoom span{color:white;font:700 11px system-ui;letter-spacing:.18em;text-shadow:0 2px 8px #000}'],
    ['Reveal heading','Typography','Anime.js','<h3 class="pv-reveal">Think. Derive. Verify.</h3>','.pv-reveal{color:inherit;font:700 clamp(18px,3vw,28px) system-ui;letter-spacing:-.04em;animation:pv-reveal .7s cubic-bezier(.2,.8,.2,1) both}@keyframes pv-reveal{from{opacity:0;transform:translateY(12px);filter:blur(5px)}to{opacity:1;transform:none;filter:none}}'],
    ['Shimmer text','Typography','Animate UI','<strong class="pv-text-shimmer">PRINCIPIA</strong>','.pv-text-shimmer{font:800 26px system-ui;letter-spacing:.08em;background:linear-gradient(100deg,#8d7aff 20%,#fff 45%,#65c8e8 60%,#8d7aff 80%);background-size:220% auto;color:transparent;background-clip:text;animation:pv-text 3s linear infinite}@keyframes pv-text{to{background-position:220% center}}'],
    ['Blur reveal surface','Cards','Animate UI','<article class="pv-blur"><strong>Solution unlocked</strong><p>Reveal content after the learner attempts the problem.</p></article>','.pv-blur{padding:17px;border:1px solid #ffffff24;border-radius:14px;background:#1b1b30;color:inherit;animation:pv-blur .55s ease both}@keyframes pv-blur{from{opacity:0;filter:blur(9px);transform:translateY(8px)}to{opacity:1;filter:blur(0);transform:none}}.pv-blur p{margin:7px 0 0;color:#aaa;font-size:12px}'],
    ['Scroll progress marker','Progress','Animate UI','<div class="pv-scroll"><span></span></div>','.pv-scroll{height:3px;background:#ffffff20;overflow:hidden}.pv-scroll span{display:block;width:62%;height:100%;background:linear-gradient(90deg,#a995ff,#62c8e7);box-shadow:0 0 10px #a995ff}'],
    ['Favicon badge API','Developer','favico.js','<code class="pv-code">new Favico({ animation: "popFade" }).badge(3);</code>','.pv-code{display:block;padding:10px;border-radius:9px;background:#111528;color:#bfe7ff;font:12px ui-monospace,monospace}']
  ];
  const ITEMS = [...BASE_ITEMS, ...(window.PRINCIPIA_EXTRA_COMPONENTS || []), ...(window.PRINCIPIA_COMPONENT_BATCHES || [])];
  const SKINS = [["Aurora","#9d8cff","#58d6df"],["Nebula","#bb83ff","#ff86c8"],["Solar","#ffad4d","#ffe27a"],["Glacier","#68c9ff","#a2f2ff"],["Emerald","#46d6a2","#a6efc8"],["Rose Quartz","#ff83ad","#ffc1d6"],["Amethyst","#9b72ed","#d0a7ff"],["Cyberpunk","#f35dff","#35e6ff"],["Midnight","#8295ff","#63c7f4"],["Obsidian","#d1d5e8","#858ca8"],["Copper","#d58b63","#f2c49a"],["Sakura","#ff9dbd","#c4a1ff"],["Arctic","#75e1d4","#91baff"],["Volcanic","#ff765e","#ffbf69"],["Forest","#62bd83","#b3dc8a"],["Royal","#7779ff","#d19cff"],["Ocean","#368fe0","#55d8d0"],["Lavender","#b4a0ff","#e4b6ff"],["Candy","#ff73ce","#8f83ff"],["Lime","#9bd64b","#e0ee7b"],["Sandstone","#d5b47c","#f1dfb0"],["Steel","#91a9c5","#d2e0f1"],["Ruby","#e34f72","#ff9b9b"],["Topaz","#e6ad37","#8dd9dc"],["Monochrome","#d8dce8","#8b94aa"]], ...(window.PRINCIPIA_EXTRA_SKINS || []);
  const VARIANTS = ['violet','cyan','mono'];
  const variantCSS = {
    violet:':root{--pv-accent:#a995ff;--pv-accent2:#65c8e8}',
    cyan:':root{--pv-accent:#56d6d0;--pv-accent2:#72aaff}',
    mono:':root{--pv-accent:#d9d9e6;--pv-accent2:#8c8ca3}'
  };
  let activeCategory='All', activeVariant='violet', activeSkin='Aurora', searchTerm='', currentPage=0;
  const pageSize=30;
  const rootId='principia-component-vault';
  const escapeHTML = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  function buildItem(item,index){
    const [name,category,source,html,css]=item;
    const id='pv-'+index;
    const attributedHTML=source==='LucianLabs'?'<!-- Lucian UX/UI Prompt · MIT License (c) 2026 Seokwoooo · https://lucianlabs.dev/uxui-prompt/ -->\n'+html:html;
    return {id,name,category,source,html:attributedHTML,css:css.replace(/#a995ff/g,'var(--pv-accent)').replace(/#65c8e8/g,'var(--pv-accent2)')};
  }
  const catalogCount = ITEMS.length * SKINS.length;
  function buildVariant(item,index,skinIndex){
    const base=buildItem(item,index);
    const [skinName,accent,accent2]=SKINS[skinIndex];
    const wrapper='pv-skin-'+skinIndex;
    const colorMap={
      '#a995ff':accent,'#65c8e8':accent2,'#6554d9':accent,'#9d8bff':accent,
      '#8d7aff':accent,'#b8a8ff':accent,'#a98bff':accent,'#62c8e7':accent2,
      '#9b83ff':accent,'#328eb5':accent2,'#56d6d0':accent,'#72aaff':accent2
    };
    const css=base.css.replace(/#[0-9a-f]{6}/gi,color=>colorMap[color.toLowerCase()]||color);
    const skinCSS='.'+wrapper+'{--pv-accent:'+accent+';--pv-accent2:'+accent2+';--pv-skin-shadow:0 12px 32px '+accent+'22;--ux-accent:'+accent+';--ux-accent-2:'+accent2+';--ux-accent-soft:'+accent+'22;--ux-accent-ink:#10121c;--ux-mint:'+accent2+';--ux-page:#10121c;--ux-surface:#191b2b;--ux-surface-2:#22253a;--ux-surface-3:#30344c;--ux-ink:#f5f4ff;--ux-ink-2:#c1bfd2;--ux-ink-3:#9290a8;--ux-line:'+accent+'33;--ux-line-2:'+accent+'66;--ux-glass:'+accent+'18;--ux-glass-line:'+accent+'55;--ux-shadow:'+accent+'22;--ux-shadow-strong:'+accent+'55;--ux-grad:linear-gradient(120deg,'+accent+','+accent2+')}';
    return {...base,id:base.id+'-'+skinIndex,name:base.name+' — '+skinName,skin:skinName,html:'<div class="'+wrapper+'">'+base.html+'</div>',css:css+'\\n'+skinCSS};
  }
  function make(tag,attrs={},text=''){
    const node=document.createElement(tag);
    Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));
    if(text)node.textContent=text;
    return node;
  }
  function mount(){
    const panel=document.getElementById('proSiteEditorPanel');
    if(!panel||panel.querySelector('#'+rootId))return;
    const section=make('section',{id:rootId});
    section.className='pr-vault';
    const header=make('button',{type:'button','aria-expanded':'false',class:'pr-vault-toggle'},'▦ Component Vault · '+catalogCount.toLocaleString('vi-VN')+' biến thể');
    const body=make('div',{class:'pr-vault-body',hidden:''});
    const sourceRow=make('div',{class:'pr-vault-sources'});
    SOURCES.forEach(([name,url,detail])=>{
      const a=make('a',{href:url,target:'_blank',rel:'noopener noreferrer',title:detail},name+' · '+(detail.split(';')[0]));
      sourceRow.append(a);
    });
    const sourceNote=make('p',{class:'pr-vault-source-note'},
      'Số lượng là thống kê công bố trên trang nguồn, không phải số mẫu đã nhập vào PRINCIPIA. Chỉ sao chép mã khi giấy phép cho phép; các thư viện React cần chuyển đổi trước khi dùng trong ứng dụng HTML/CSS/JS hiện tại.');
    const controls=make('div',{class:'pr-vault-controls'});
    const search=make('input',{type:'search',placeholder:'Tìm component…','aria-label':'Tìm component'});
    const categories=['All',...new Set(ITEMS.map(item=>item[1]))];
    const select=make('select',{'aria-label':'Lọc danh mục'});
    categories.forEach(category=>select.append(make('option',{value:category},category)));
    const variant=make('select',{'aria-label':'Accent màu'});
    VARIANTS.forEach(value=>variant.append(make('option',{value},'Accent: '+value)));
    const skin=make('select',{'aria-label':'Đổi skin giao diện'});
    SKINS.forEach(([name])=>skin.append(make('option',{value:name},'Skin: '+name)));
    skin.value=activeSkin;
    controls.append(search,select,skin,variant);
    const count=make('p',{class:'pr-vault-count','aria-live':'polite'});
    const grid=make('div',{class:'pr-vault-grid'});
    const pager=make('nav',{class:'pr-vault-pager','aria-label':'Phân trang component'});
    body.append(sourceRow,sourceNote,controls,count,grid,pager);
    section.append(header,body);
    const status=panel.querySelector('[data-status]');
    if(status)panel.insertBefore(section,status);else panel.append(section);
    header.addEventListener('click',()=>{const open=body.hidden;body.hidden=!open;header.setAttribute('aria-expanded',String(open))});
    search.addEventListener('input',()=>{searchTerm=search.value.trim().toLowerCase();currentPage=0;render(grid,count,pager)});
    select.addEventListener('change',()=>{activeCategory=select.value;currentPage=0;render(grid,count,pager)});
    skin.addEventListener('change',()=>{activeSkin=skin.value;currentPage=0;render(grid,count,pager)});
    variant.addEventListener('change',()=>{activeVariant=variant.value;currentPage=0;render(grid,count,pager)});
    render(grid,count,pager);
  }
  function render(grid,count,pager){
    const skinIndex=Math.max(0,SKINS.findIndex(skin=>skin[0]===activeSkin));
    const visible=ITEMS.map((item,index)=>({item,index})).filter(({item})=>
      (activeCategory==='All'||item[1]===activeCategory)&&
      (!searchTerm||(item[0]+' '+item[1]+' '+item[2]).toLowerCase().includes(searchTerm))
    );
    const pageCount=Math.max(1,Math.ceil(visible.length/pageSize));
    currentPage=Math.min(currentPage,pageCount-1);
    const pageItems=visible.slice(currentPage*pageSize,(currentPage+1)*pageSize)
      .map(({item,index})=>buildVariant(item,index,skinIndex));
    grid.replaceChildren();
    pageItems.forEach(item=>{
      const card=make('article',{class:'pr-vault-item'});
      const title=make('strong',{},item.name);
      const meta=make('small',{},item.category+' · '+item.source+' · '+item.skin);
      const preview=make('div',{class:'pr-vault-preview'});
      const frame=make('div',{class:'pr-vault-frame'});
      const previewFrame=make('iframe',{class:'pr-vault-live-frame',title:item.name,loading:'lazy',sandbox:'allow-scripts'});
      const previewDocument='<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; img-src data: blob:; style-src \'unsafe-inline\'; script-src \'unsafe-inline\'; font-src data:; connect-src \'none\'; form-action \'none\'; base-uri \'none\'"><style>html,body{margin:0;min-height:100%;background:transparent}body{display:grid;place-items:center;padding:8px;box-sizing:border-box;overflow:auto}</style><style>'+(window.PRINCIPIA_LUCIAN_TOKENS||'')+'\n'+variantCSS[activeVariant]+'\n'+item.css+'</style></head><body>'+item.html+'</body></html>';
      previewFrame.srcdoc=previewDocument;
      frame.append(previewFrame);
      preview.append(frame);
      const actions=make('div',{class:'pr-vault-actions'});
      const copyHTML=make('button',{type:'button'},'Copy HTML');
      const copyCSS=make('button',{type:'button'},'Copy CSS');
      const copyBoth=make('button',{type:'button'},'Copy HTML + CSS');
      copyHTML.addEventListener('click',()=>copy(item.html,copyHTML));
      copyCSS.addEventListener('click',()=>copy((window.PRINCIPIA_LUCIAN_TOKENS||'')+'\n'+variantCSS[activeVariant]+'\n'+item.css,copyCSS));
      copyBoth.addEventListener('click',()=>copy(item.html+'\n<style>\n'+(window.PRINCIPIA_LUCIAN_TOKENS||'')+'\n'+variantCSS[activeVariant]+'\n'+item.css+'\n</style>',copyBoth));
      actions.append(copyHTML,copyCSS,copyBoth);
      const link=SOURCES.find(source=>source[0]===item.source);
      const sourceLink=make('a',{href:link?.[1]||'https://uiverse.io/',target:'_blank',rel:'noopener noreferrer'},'Source ↗');
      card.append(title,meta,preview,actions,sourceLink);
      grid.append(card);
    });
    count.textContent=visible.length+' cấu trúc · skin '+activeSkin+' · '+ITEMS.length+' cấu trúc gốc × '+SKINS.length+' skin = '+catalogCount.toLocaleString('vi-VN')+' biến thể · trang '+(currentPage+1)+'/'+pageCount;
    pager.replaceChildren();
    const previous=make('button',{type:'button'},'← Trước');
    const next=make('button',{type:'button'},'Tiếp →');
    previous.disabled=currentPage===0;
    next.disabled=currentPage>=pageCount-1;
    const pageLabel=make('span',{},'Trang '+(currentPage+1)+' / '+pageCount);
    previous.addEventListener('click',()=>{currentPage=Math.max(0,currentPage-1);render(grid,count,pager)});
    next.addEventListener('click',()=>{currentPage=Math.min(pageCount-1,currentPage+1);render(grid,count,pager)});
    pager.append(previous,pageLabel,next);
  }
  async function copy(value,button){
    try{await navigator.clipboard.writeText(value);const old=button.textContent;button.textContent='Copied';setTimeout(()=>button.textContent=old,1100)}
    catch(_){const field=make('textarea');field.value=value;document.body.append(field);field.select();const ok=document.execCommand('copy');field.remove();button.textContent=ok?'Copied':'Copy failed'}
  }
  function init(){
    mount();
    const observer=new MutationObserver(()=>mount());
    observer.observe(document.body,{childList:true,subtree:true});
    window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
    window.PrincipiaComponentVault=Object.freeze({refresh:mount,count:catalog.length,sources:SOURCES.length});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();