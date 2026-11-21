(function(){
  const RELEASES='https://github.com/nguyen-quoc-huy0304/PRINCIPIA-PHYSICS-OLYMPIAD.ghithub.io/releases/latest';
  const DOWNLOADS='https://github.com/nguyen-quoc-huy0304/PRINCIPIA-PHYSICS-OLYMPIAD.ghithub.io/releases/latest/download/';
  const PLATFORMS=[
    {id:'android',name:'Android',logo:'🤖',detail:'Điện thoại & máy tính bảng Android',status:'Sắp ra mắt',available:false},
    {id:'ios',name:'iOS',logo:'',detail:'iPhone & iPad · qua App Store',status:'Sắp ra mắt',available:false},
    {id:'windows',name:'Windows',logo:'⊞',detail:'Windows 10 / 11 · bộ cài .exe',status:'Tải trực tiếp',available:true,file:'PRINCIPIA-Setup.exe'},
    {id:'mac',name:'macOS',logo:'',detail:'MacBook & iMac · .dmg',status:'Tải trực tiếp',available:true,file:'PRINCIPIA-mac-arm64.dmg'},
    {id:'linux',name:'Linux',logo:'🐧',detail:'AppImage / .deb',status:'Tải trực tiếp',available:true,file:'PRINCIPIA-linux-x64.AppImage'}
  ];
  function mount(){
    // Download center is only for the public website, never the installed desktop app.
    if(window.principiaDesktop?.isDesktop === true) return;
    if(/\\b(PRINCIPIA_APP|standalone)\\b/i.test(navigator.userAgent)) return;
    if(document.getElementById('principiaDownloadFab'))return;
    const fab=document.createElement('button');fab.id='principiaDownloadFab';fab.type='button';fab.innerHTML='<span aria-hidden="true">↓</span> Tải ứng dụng';fab.setAttribute('aria-label','Tải ứng dụng PRINCIPIA');document.body.appendChild(fab);
    const overlay=document.createElement('div');overlay.id='principiaDownloadOverlay';overlay.innerHTML='<section class="pd-modal" role="dialog" aria-modal="true" aria-labelledby="pdTitle"><header class="pd-head"><div><div class="pd-kicker">PRINCIPIA • PHYSICS OLYMPIAD</div><h2 id="pdTitle">Tải ứng dụng</h2><p>Mang PRINCIPIA theo bạn trên mọi thiết bị.</p></div><button class="pd-close" type="button" aria-label="Đóng">×</button></header><div class="pd-grid"></div><footer class="pd-foot"><span>🔄 Ứng dụng desktop sẽ kiểm tra bản cập nhật khi khởi động.</span><a href="'+RELEASES+'" target="_blank" rel="noopener">Lịch sử phiên bản ↗</a></footer></section>';
    document.body.appendChild(overlay);
    const grid=overlay.querySelector('.pd-grid');
    PLATFORMS.forEach(p=>{const card=document.createElement('article');card.className='pd-platform'+(p.available?'':' is-soon');const logo=document.createElement('div');logo.className='pd-logo pd-'+p.id;logo.textContent=p.logo;const info=document.createElement('div');info.className='pd-info';const name=document.createElement('strong');name.textContent=p.name;const detail=document.createElement('small');detail.textContent=p.detail;const action=document.createElement(p.available?'a':'span');action.className='pd-action'+(p.available?'':' disabled');action.textContent=p.status;if(p.available){action.href=DOWNLOADS+p.file;action.setAttribute('download',p.file);}else action.setAttribute('aria-disabled','true');info.append(name,detail,action);card.append(logo,info);grid.appendChild(card);});
    const close=()=>overlay.classList.remove('open');fab.addEventListener('click',()=>overlay.classList.add('open'));overlay.querySelector('.pd-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();