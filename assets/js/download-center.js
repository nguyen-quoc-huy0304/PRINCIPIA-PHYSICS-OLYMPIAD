(function(){
  const RELEASES='https://github.com/nguyen-quoc-huy0304/PRINCIPIA-PHYSICS-OLYMPIAD.ghithub.io/releases/latest';
  const DOWNLOADS='https://github.com/nguyen-quoc-huy0304/PRINCIPIA-PHYSICS-OLYMPIAD.ghithub.io/releases/download/desktop-v1.0.3/';
  // Platform marks are embedded SVGs: no external icon CDN requests during startup.
  const svgData=svg=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
  const ICONS={
    windows:svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#0078D4" d="M2 5.2 14 3.5v11.2H2zm14-2 14-2v13.5H16zM2 16.8h12v11.7L2 26.8zm14 0h14v13.7l-14-2z"/></svg>'),
    apple:svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#fff" d="M23.1 17.1c0-3.1 2.5-4.6 2.6-4.7-1.4-2.1-3.6-2.4-4.4-2.4-1.9-.2-3.7 1.1-4.7 1.1s-2.5-1.1-4.1-1.1c-2.1 0-4.1 1.2-5.2 3.1-2.2 3.8-.6 9.4 1.5 12.5 1 1.5 2.2 3.2 3.8 3.1 1.5-.1 2.1-1 4-1s2.4 1 4.1 1c1.7 0 2.7-1.5 3.7-3 1.2-1.7 1.7-3.4 1.7-3.5-.1 0-3-1.2-3-5.1zM20 7.9c.8-1 1.4-2.4 1.2-3.8-1.2.1-2.7.9-3.6 1.9-.8.9-1.5 2.3-1.3 3.7 1.4.1 2.8-.7 3.7-1.8z"/></svg>'),
    linux:svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path fill="#FCC624" d="M16 2C9 2 9 9 9 13c0 2-2 4-4 7-2 3 0 6 3 5l4-2h8l4 2c3 1 5-2 3-5-2-3-4-5-4-7 0-4 0-11-7-11z"/><path fill="#222" d="M12 12h2v2h-2zm6 0h2v2h-2z"/><path d="M13 18q3 3 6 0" stroke="#222" stroke-width="1.4" fill="none"/></svg>'),
    android:svgData('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><g fill="#3DDC84"><path d="M8 11 5.5 6.7l1.4-.8L9.5 10a14 14 0 0 1 13 0l2.6-4.1 1.4.8L24 11a9 9 0 0 1 3 7H5a9 9 0 0 1 3-7zM5 20h22v6a2 2 0 0 1-2 2h-2v2h-3v-2h-8v2H9v-2H7a2 2 0 0 1-2-2z"/></g><circle cx="11" cy="15" r="1" fill="#173d2d"/><circle cx="21" cy="15" r="1" fill="#173d2d"/></svg>')
  };
  const PLATFORMS=[
    {id:'windows',name:'Windows',logo:ICONS.windows,detail:'Windows 10 / 11 · bộ cài .exe',status:'Tải trực tiếp',available:true,file:'PRINCIPIA-Setup.exe'},
    {id:'mac',name:'macOS',logo:ICONS.apple,detail:'MacBook & iMac · bộ cài .dmg',status:'Bản x64 đang được build',available:true,file:'PRINCIPIA-mac-x64.dmg'},
    {id:'linux',name:'Linux',logo:ICONS.linux,detail:'Linux · AppImage',status:'Bản x64 đang được build',available:true,file:'PRINCIPIA-linux-x64.AppImage'},
    {id:'android',name:'Android',logo:ICONS.android,detail:'Android · cần gói APK riêng',status:'Chuẩn bị bản cài',available:false},
    {id:'ios',name:'iOS',logo:ICONS.apple,detail:'iPhone & iPad · cần ký ứng dụng Apple',status:'Chuẩn bị bản App Store',available:false}
  ];
  function mount(){
    // Hide the floating download entry point on phones; keep desktop access unchanged.
    const mobileDevice=/Android|iPhone|iPad|iPod|Mobile|IEMobile|Windows Phone/i.test(navigator.userAgent||'');
    
    // Download center is only for the public website, never the installed desktop app.
    if(window.principiaDesktop) return;
    if(/\\b(PRINCIPIA_APP|standalone)\\b/i.test(navigator.userAgent)) return;
    if(document.getElementById('principiaDownloadFab'))return;
    const fab=document.createElement('button');fab.id='principiaDownloadFab';fab.type='button';fab.style.display='none';fab.setAttribute('aria-hidden','true');fab.tabIndex=-1;fab.innerHTML='<span aria-hidden="true">⇩</span>';fab.setAttribute('aria-label','Tải ứng dụng PRINCIPIA');fab.title='Tải ứng dụng';document.body.appendChild(fab);
    const overlay=document.createElement('div');overlay.id='principiaDownloadOverlay';overlay.innerHTML='<section class="pd-modal" role="dialog" aria-modal="true" aria-labelledby="pdTitle"><header class="pd-head"><div><div class="pd-kicker">PRINCIPIA • PHYSICS OLYMPIAD</div><h2 id="pdTitle">Tải ứng dụng</h2><p>Mang PRINCIPIA theo bạn trên mọi thiết bị.</p></div><button class="pd-close" type="button" aria-label="Đóng">×</button></header><div class="pd-grid"></div><footer class="pd-foot"><span>🔄 Ứng dụng desktop sẽ kiểm tra bản cập nhật khi khởi động.</span><a href="'+RELEASES+'" target="_blank" rel="noopener">Lịch sử phiên bản ↗</a></footer></section>';
    document.body.appendChild(overlay);
    const grid=overlay.querySelector('.pd-grid');
    PLATFORMS.forEach(p=>{const card=document.createElement('article');card.className='pd-platform'+(p.available?'':' is-soon');const logo=document.createElement('div');logo.className='pd-logo pd-'+p.id;const logoImg=document.createElement('img');logoImg.src=p.logo;logoImg.alt=p.name+' logo';logoImg.loading='lazy';logoImg.referrerPolicy='no-referrer';logoImg.style.cssText='width:27px;height:27px;object-fit:contain';logo.appendChild(logoImg);const info=document.createElement('div');info.className='pd-info';const name=document.createElement('strong');name.textContent=p.name;const detail=document.createElement('small');detail.textContent=p.detail;const action=document.createElement(p.available?'a':'span');action.className='pd-action'+(p.available?'':' disabled');action.textContent=p.status;if(p.available){action.href=DOWNLOADS+p.file;action.setAttribute('download',p.file);action.target='_blank';action.rel='noopener';}else action.setAttribute('aria-disabled','true');info.append(name,detail,action);card.append(logo,info);grid.appendChild(card);});
    const close=()=>overlay.classList.remove('open');fab.addEventListener('click',()=>overlay.classList.add('open'));overlay.querySelector('.pd-close').addEventListener('click',close);overlay.addEventListener('click',e=>{if(e.target===overlay)close();});document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();