/* PRINCIPIA Living Companion — 3D mascot, ambient learning nudges, shared AI chat entry. */
(()=> {
 'use strict';
 const STORAGE='principia-living-companion-v1';
 const DEFAULTS={enabled:true,quiet:false,color:'#9b87ff',scale:1};
 let cfg=readSettings(),lastNudge=0,drag=null,shellMaterials=[],nudgeTimer=0;
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function readSettings(){try{const saved=JSON.parse(localStorage.getItem(STORAGE)||'{}');return {...DEFAULTS,...saved,color:/^#[0-9a-f]{6}$/i.test(saved.color||'')?saved.color:DEFAULTS.color,scale:Number.isFinite(saved.scale)?clamp(saved.scale,.65,1.4):1}}catch(_){return {...DEFAULTS}}}
 function save(){try{localStorage.setItem(STORAGE,JSON.stringify(cfg))}catch(_){}}
 function welcomeMarkup(){return '<div class="plc-welcome-3d" aria-label="Mascot 3D PRINCIPIA"><div class="plc-fallback">✦</div><canvas class="plc-canvas" aria-hidden="true"></canvas><span class="plc-wave-label">HELLO! · READY?</span></div>'}
 window.principiaWelcomeCharacterMarkup=welcomeMarkup;
 function createScene(canvas,mode){
  if(!canvas||!window.THREE)return false;
  try{
   const T=window.THREE;
   let renderer=null;
   renderer=new T.WebGLRenderer({canvas,alpha:true,antialias:true});
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.7));
   renderer.setSize(canvas.clientWidth||300,canvas.clientHeight||300,false);
   const scene=new T.Scene(),camera=new T.PerspectiveCamera(32,Math.max(.1,(canvas.clientWidth||300)/(canvas.clientHeight||300)),.1,100);camera.position.set(0,0,5.6);
   scene.add(new T.HemisphereLight(0xffffff,0x392456,2.1));
   const light=new T.DirectionalLight(0xffffff,2.4);light.position.set(3,4,5);scene.add(light);
   const root=new T.Group();scene.add(root);let hand=null,eyes=[],sceneRaf=0;
   const mat=(color,metal=0.22,rough=.35)=>new T.MeshStandardMaterial({color,metalness:metal,roughness:rough});
   const shell=mat(cfg.color);shellMaterials.push(shell);const dark=mat('#201a39',.35),eye=mat('#dff8ff',.12,.18),accent=mat('#7ce8ff',.28,.2);
   const sphere=(name,scale,pos,m)=>{const o=new T.Mesh(new T.SphereGeometry(1,32,24),m);o.name=name;o.scale.set(...scale);o.position.set(...pos);root.add(o);return o};
   sphere('body',[.63,.72,.48],[0,-.35,0],shell);sphere('head',[.82,.72,.62],[0,.55,0],shell);
   sphere('face',[.63,.46,.12],[0,.52,.54],dark);
   const eyeL=sphere('eyeL',[.12,.15,.07],[-.25,.58,.68],eye),eyeR=sphere('eyeR',[.12,.15,.07],[.25,.58,.68],eye);eyes=[eyeL,eyeR];
   sphere('pupilL',[.045,.07,.03],[-.25,.56,.75],accent);sphere('pupilR',[.045,.07,.03],[.25,.56,.75],accent);
   sphere('core',[.16,.16,.08],[0,-.28,.47],accent);
   const armGeo=new T.CapsuleGeometry(.105,.4,4,12);
   const left=new T.Mesh(armGeo,shell);left.position.set(-.77,-.28,.05);left.rotation.z=.5;root.add(left);
   hand=new T.Group();hand.position.set(.72,-.16,.04);root.add(hand);
   const right=new T.Mesh(armGeo,shell);right.position.set(.1,-.18,0);right.rotation.z=-.35;hand.add(right);
   sphereIn(hand,'hand',[.17,.17,.17],[.15,.08,0],shell);
   for(let i=0;i<2;i++){const ear=sphere('ear',[.18,.28,.16],[i? .55:-.55,1.1,0],accent);ear.rotation.z=i?.4:-.4}
   const ring=new T.Mesh(new T.TorusGeometry(1.03,.025,8,96),accent);ring.rotation.x=Math.PI/2;ring.position.y=-.1;root.add(ring);
   root.scale.setScalar(mode==='welcome'?1.14:cfg.scale);
   canvas.parentElement.classList.add('plc-webgl-ready');
   const start=performance.now();
   const loop=()=>{if(!canvas.isConnected){renderer.dispose();renderer=null;cancelAnimationFrame(sceneRaf);return}
    const t=(performance.now()-start)/1000;
    root.position.y=Math.sin(t*1.7)*.08;
    root.rotation.y=Math.sin(t*.6)*.14;
    if(hand)hand.rotation.z=mode==='welcome'?Math.sin(t*4.2)*.52-.35:Math.sin(t*1.5)*.12;
    if(eyes.length&&Math.sin(t*2.1)>0.994){eyes.forEach(e=>e.scale.y=.025)}else eyes.forEach(e=>e.scale.y=.15);
    renderer.render(scene,camera);sceneRaf=requestAnimationFrame(loop)
   };loop();return true;
  }catch(err){console.warn('[PRINCIPIA Companion] 3D unavailable',err);renderer?.dispose();return false}
 }
 function sphereIn(parent,scale,pos,m){const o=new window.THREE.Mesh(new window.THREE.SphereGeometry(1,20,16),m);o.scale.set(...scale);o.position.set(...pos);parent.add(o)}
 function initWelcome(){document.querySelectorAll('.plc-welcome-3d').forEach(el=>{if(el.dataset.ready)return;el.dataset.ready='1';const canvas=el.querySelector('canvas');loadThree().then(()=>createScene(canvas,'welcome')).catch(()=>{});speakWelcomeOnce()})}
 function speakWelcomeOnce(){try{if(!('speechSynthesis'in window)||sessionStorage.getItem('principia-companion-greeted'))return;sessionStorage.setItem('principia-companion-greeted','1');const utterance=new SpeechSynthesisUtterance('Chào bạn! Sẵn sàng khám phá vật lý chưa?');utterance.lang='vi-VN';utterance.rate=1;window.speechSynthesis.speak(utterance)}catch(_){}}
 function loadThree(){
  if(window.THREE?.WebGLRenderer)return Promise.resolve(window.THREE);
  if(window.__principiaThreeLoading)return window.__principiaThreeLoading;
  const sources=[
   'https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js',
   'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js',
   'https://unpkg.com/three@0.160.0/build/three.min.js'
  ];
  window.__principiaThreeLoading=(async()=>{
   let lastError=null;
   for(const src of sources){
    try{
     await new Promise((resolve,reject)=>{
      const script=document.createElement('script');
      const timer=window.setTimeout(()=>{script.remove();reject(new Error('Timeout loading '+src))},12000);
      script.src=src;script.async=true;script.crossOrigin='anonymous';
      script.onload=()=>{window.clearTimeout(timer);if(window.THREE?.WebGLRenderer)resolve();else{script.remove();reject(new Error('Three.js loaded without WebGLRenderer: '+src))}};
      script.onerror=()=>{window.clearTimeout(timer);script.remove();reject(new Error('Unable to load '+src))};
      document.head.appendChild(script);
     });
     return window.THREE;
    }catch(error){lastError=error;console.warn('[PRINCIPIA] Three.js CDN failed; trying fallback.',error)}
   }
   throw lastError||new Error('All Three.js sources failed');
  })().catch(error=>{window.__principiaThreeLoading=null;throw error});
  return window.__principiaThreeLoading;
 }
 function mount(){
  initWelcome();
  if(document.body.classList.contains('principia-welcome-active'))return;
  if(!cfg.enabled||document.getElementById('principiaLivingCompanion'))return;
  const el=document.createElement('aside');el.id='principiaLivingCompanion';el.className='plc-companion'+(cfg.quiet?' is-quiet':'');el.innerHTML='<button class="plc-mascot" type="button" aria-label="Mở trợ lý AI PRINCIPIA" title="Mở trợ lý AI"><div class="plc-fallback">✦</div><canvas class="plc-canvas"></canvas><span class="plc-dot"></span></button><div class="plc-nudge" role="status" aria-live="polite"></div><div class="plc-controls"><button type="button" data-quiet aria-label="Bật hoặc tắt lời nhắc">◐</button><button type="button" data-color aria-label="Đổi màu nhân vật">◈</button><button type="button" data-hide aria-label="Ẩn companion">×</button></div>';
  document.body.appendChild(el);
  el.querySelector('.plc-mascot').addEventListener('click',e=>{if(e.currentTarget.dataset.suppressClick)return;if(typeof window.toggleChatBox==='function')window.toggleChatBox();else document.querySelector('.chat-bubble-btn')?.click();hideNudge()});el.querySelector('.plc-nudge').addEventListener('click',()=>{if(typeof window.toggleChatBox==='function')window.toggleChatBox();else document.querySelector('.chat-bubble-btn')?.click();hideNudge()});
  el.querySelector('[data-quiet]').addEventListener('click',()=>{cfg.quiet=!cfg.quiet;save();el.classList.toggle('is-quiet',cfg.quiet);toast(cfg.quiet?'Companion im lặng':'Đã bật lời nhắc')});
  el.querySelector('[data-color]').addEventListener('click',openColorPicker);
  el.querySelector('[data-hide]').addEventListener('click',()=>{cfg.enabled=false;save();el.remove();toast('Companion đã ẩn. Bật lại trong Cài đặt PRINCIPIA.')});
  restorePosition(el);dragElement(el);loadThree().then(()=>createScene(el.querySelector('canvas'),'floating')).catch(()=>{});
  scheduleNudge();
 }
 function openColorPicker(){const old=document.getElementById('plc-color-picker');if(old){old.remove();return}const p=document.createElement('div');p.id='plc-color-picker';p.className='plc-color-picker';['#9b87ff','#65d9ff','#79f0b4','#ffb86b','#ff80b7','#f1f5ff'].forEach(c=>{const b=document.createElement('button');b.style.background=c;b.title=c;b.setAttribute('aria-label','Màu '+c);b.addEventListener('click',()=>{cfg.color=c;shellMaterials.forEach(m=>m.color.set(c));save();p.remove();toast('Đã đổi màu companion')});p.appendChild(b)});document.body.appendChild(p)}
 function restorePosition(el){try{const p=JSON.parse(localStorage.getItem('principia_companion_position')||'{}');if(typeof p.left==='string'&&typeof p.top==='string'){el.style.left=p.left;el.style.top=p.top;el.style.right='auto';el.style.bottom='auto'}}catch(_){}}
 function dragElement(el){const btn=el.querySelector('.plc-mascot');btn.addEventListener('pointerdown',e=>{drag={x:e.clientX,y:e.clientY,left:el.offsetLeft,top:el.offsetTop,moved:false};btn.setPointerCapture(e.pointerId)});btn.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.abs(dx)+Math.abs(dy)>7)drag.moved=true;if(!drag.moved)return;el.style.left=clamp(drag.left+dx,4,innerWidth-el.offsetWidth-4)+'px';el.style.top=clamp(drag.top+dy,4,innerHeight-el.offsetHeight-4)+'px';el.style.right='auto';el.style.bottom='auto'});btn.addEventListener('pointerup',()=>{if(drag?.moved){try{localStorage.setItem('principia_companion_position',JSON.stringify({left:el.style.left,top:el.style.top}))}catch(_){}btn.dataset.suppressClick='1';setTimeout(()=>delete btn.dataset.suppressClick,160)}drag=null})}
 const hints=[
  'Thử chia bài toán thành dữ kiện, đại lượng cần tìm và định luật liên quan.',
  'Nếu đang bí, hãy vẽ sơ đồ lực hoặc phác đồ thị trước khi thay số.',
  'Cậu thử kiểm tra đơn vị ở từng bước. Một lỗi đơn vị thường chỉ ra bước sai.',
  'Đừng xem lời giải ngay. Viết thử một hướng và xác định chính xác chỗ mắc kẹt.',
  'Một câu hỏi tốt để bắt đầu: đại lượng nào được bảo toàn trong tình huống này?'
 ];
 function context(){const title=document.querySelector('#app h1,#app h2,.page-title')?.textContent?.trim();return title||document.title||'PRINCIPIA'}
 function scheduleNudge(){if(cfg.quiet)return;nudgeTimer=setTimeout(()=>{const now=Date.now(),quiz=typeof window.isPrincipiaQuizInProgress==='function'&&window.isPrincipiaQuizInProgress(),focused=document.activeElement?.tagName==='INPUT'||document.activeElement?.tagName==='TEXTAREA';if(!quiz&&!focused&&now-lastNudge>55000){const txt=context(),hint=contextHint(txt);showNudge(hint,txt);lastNudge=now}scheduleNudge()},65000)}
 function contextHint(title){const t=String(title||'').toLowerCase();if(/quiz|exam|test|olympiad/.test(t))return 'Đừng vội xem đáp án. Hãy xác định dữ kiện, chọn định luật phù hợp và thử một bước trước nhé.';if(/lab|simulation|thí nghiệm/.test(t))return 'Thử thay đổi một biến mỗi lần và dự đoán kết quả trước khi chạy mô phỏng để thấy quan hệ nhân quả.';if(/lesson|bài học|learn|study/.test(t))return 'Thử tự tóm tắt ý chính bằng 2–3 câu, sau đó tự đặt một câu hỏi kiểm tra lại kiến thức.';return hints[Math.floor(Math.random()*hints.length)]}
 function showNudge(message,title){const n=document.querySelector('.plc-nudge');if(!n||cfg.quiet)return;n.textContent=message;n.classList.add('visible');n.dataset.context=title;clearTimeout(n.hideTimer);n.hideTimer=setTimeout(()=>n.classList.remove('visible'),8500)}
 function hideNudge(){document.querySelector('.plc-nudge')?.classList.remove('visible')}
 function toast(text){const t=document.createElement('div');t.className='plc-toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)}
 window.principiaLivingCompanion={openAI:()=>document.querySelector('.plc-mascot')?.click(),setQuiet(v){cfg.quiet=!!v;save();document.querySelector('#principiaLivingCompanion')?.classList.toggle('is-quiet',cfg.quiet)},setEnabled(v){cfg.enabled=!!v;save();document.getElementById('principiaLivingCompanion')?.remove();if(v)mount()},showHint:()=>showNudge(hints[Math.floor(Math.random()*hints.length)],context()),hideNudge};
 document.addEventListener('DOMContentLoaded',mount);window.addEventListener('pageshow',mount);window.addEventListener('pagehide',()=>clearTimeout(nudgeTimer),{once:true});const observer=new MutationObserver(()=>{if(document.body.classList.contains('principia-welcome-active'))initWelcome();else mount()});observer.observe(document.body,{attributes:true,attributeFilter:['class']});
})();
