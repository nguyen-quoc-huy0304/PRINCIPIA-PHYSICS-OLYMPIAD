/* PRINCIPIA Delight Motion — additive motion layer, independent from core navigation. */
(() => {
  'use strict';
  const KEY='principia_delight_motion_v1';
  const REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  const FINE=window.matchMedia?.('(hover:hover) and (pointer:fine)').matches??false;
  const defaults={enabled:true,scrollProgress:true,spotlight:true,stagger:true};
  const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
  let settings=readSettings(),observer=null,frame=0,lastProgress=-1;
  const CARD='#app .panel,#app .tile,#app .stat,#app .feature-card';
  const EXCLUDED='.modal,.modalbg,[role="dialog"],#proSiteEditorPanel,#principiaM3ECanvasWorkspace,.chat-box,.principia-mobile-nav';

  function readSettings(){
    try{const saved=JSON.parse(localStorage.getItem(KEY)||'{}');return Object.fromEntries(Object.keys(defaults).map(k=>[k,typeof saved[k]==='boolean'?saved[k]:defaults[k]]))}
    catch(_){return{...defaults}}
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){/* Storage is optional. */}}
  function apply(){
    const root=document.documentElement;
    root.classList.toggle('pr-delight-off',!settings.enabled||REDUCED);
    root.classList.toggle('pr-scroll-progress-off',!settings.scrollProgress);
    root.classList.toggle('pr-spotlight-off',!settings.spotlight||!FINE);
    root.classList.toggle('pr-stagger-off',!settings.stagger);
    if(!settings.enabled||REDUCED)document.getElementById('prDelightProgress')?.remove();
    else mountProgress();
  }
  function mountSettings(){
    const panel=document.getElementById('proSiteEditorPanel');
    if(!panel||panel.querySelector('[data-pr-delight-settings]'))return;
    const section=document.createElement('section');
    section.className='pr-delight-settings';section.dataset.prDelightSettings='';
    const heading=document.createElement('strong');heading.textContent='Animation nâng cao';section.append(heading);
    const options=[
      ['enabled','Bật bộ animation nâng cao'],
      ['scrollProgress','Thanh tiến độ cuộn trang'],
      ['spotlight','Ánh sáng tương tác theo chuột'],
      ['stagger','Hiệu ứng xuất hiện theo nhịp']
    ];
    options.forEach(([key,labelText])=>{
      const label=document.createElement('label'),input=document.createElement('input'),span=document.createElement('span');
      input.type='checkbox';input.checked=settings[key];span.textContent=labelText;
      input.addEventListener('change',()=>{settings[key]=input.checked;persist();apply();});
      label.append(input,span);section.append(label);
    });
    const note=document.createElement('small');note.textContent='Hiệu ứng tự tắt khi thiết bị bật giảm chuyển động.';section.append(note);
    const status=panel.querySelector('[data-status]');
    if(status)panel.insertBefore(section,status);else panel.append(section);
  }
  function mountProgress(){
    if(document.getElementById('prDelightProgress'))return;
    const bar=document.createElement('div');bar.id='prDelightProgress';bar.setAttribute('aria-hidden','true');
    const fill=document.createElement('span');bar.append(fill);document.body.append(bar);
  }
  function updateProgress(){
    frame=0;
    if(!settings.enabled||!settings.scrollProgress||REDUCED)return;
    const doc=document.documentElement;
    const max=doc.scrollHeight-window.innerHeight;
    const value=max>0?clamp(window.scrollY/max,0,1):0;
    const percent=Math.round(value*1000)/10;
    if(percent===lastProgress)return;
    lastProgress=percent;
    document.documentElement.style.setProperty('--pr-scroll-progress',percent+'%');
  }
  function onScroll(){
    if(frame)return;
    frame=requestAnimationFrame(updateProgress);
  }
  function observeCards(root=document){
    if(!settings.enabled||!settings.stagger||REDUCED||!observer)return;
    const nodes=[];
    if(root instanceof Element&&root.matches(CARD))nodes.push(root);
    root.querySelectorAll?.(CARD).forEach(node=>nodes.push(node));
    nodes.forEach((node,index)=>{
      if(node.closest(EXCLUDED)||node.dataset.prDelightSeen)return;
      node.dataset.prDelightSeen='1';
      node.classList.add('pr-delight-reveal');
      node.style.setProperty('--pr-delight-delay',Math.min(index%5,4)*55+'ms');
      observer.observe(node);
    });
  }
  function pointerSpotlight(event){
    if(!settings.enabled||!settings.spotlight||!FINE||REDUCED)return;
    const target=event.target instanceof Element?event.target.closest(CARD):null;
    if(!target||target.closest(EXCLUDED))return;
    const rect=target.getBoundingClientRect();
    if(!rect.width||!rect.height)return;
    target.style.setProperty('--pr-spot-x',Math.round(event.clientX-rect.left)+'px');
    target.style.setProperty('--pr-spot-y',Math.round(event.clientY-rect.top)+'px');
  }
  function init(){
    observer=(!REDUCED&&'IntersectionObserver'in window)?new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(!entry.isIntersecting)return;
        entry.target.classList.add('pr-delight-visible');observer.unobserve(entry.target);
      });
    },{threshold:.06,rootMargin:'0px 0px -22px 0px'}):null;
    apply();observeCards();
    window.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onScroll,{passive:true});
    document.addEventListener('pointermove',pointerSpotlight,{passive:true});
    const mutations=new MutationObserver(records=>{
      records.forEach(record=>record.addedNodes.forEach(node=>{if(node.nodeType===Node.ELEMENT_NODE)observeCards(node)}));
      mountSettings();
    });
    mutations.observe(document.body,{childList:true,subtree:true});
    document.addEventListener('principia:rendered',()=>{observeCards();mountSettings()});
    document.addEventListener('principia:page-changed',()=>{observeCards();mountSettings()});
    mountSettings();updateProgress();
    window.addEventListener('pagehide',()=>{mutations.disconnect();observer?.disconnect();cancelAnimationFrame(frame)},{once:true});
    window.PrincipiaDelight=Object.freeze({getSettings:()=>({...settings}),setEnabled(value){settings.enabled=Boolean(value);persist();apply();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
