/* PRO quick actions: AI, search and admin editor stay fixed to the viewport. */
(()=> {
 'use strict';
 const controls=[
  {selector:()=>document.querySelector('button.chat-bubble-btn.chat-messenger-launcher'),desktop:18,mobile:82},
  {selector:()=>document.getElementById('principiaSearchTrigger'),desktop:74,mobile:138},
  {selector:()=>document.getElementById('proSiteEditorFab'),desktop:130,mobile:194}
 ];
 function apply(item,index){
  const button=item.selector();
  if(!button)return;
  const mobile=window.matchMedia('(max-width:900px)').matches;
  const bottom=mobile?item.mobile:item.desktop;
  button.style.setProperty('position','fixed','important');
  button.style.setProperty('top','auto','important');
  button.style.setProperty('right',mobile?'12px':'18px','important');
  button.style.setProperty('bottom',mobile?'calc('+bottom+'px + env(safe-area-inset-bottom,0px))':bottom+'px','important');
  button.style.setProperty('left','auto','important');
  button.style.setProperty('z-index',String(2147483000+index),'important');
  button.style.setProperty('display','grid','important');
  button.style.setProperty('place-items','center','important');
  button.style.setProperty('width','46px','important');
  button.style.setProperty('height','46px','important');
  button.style.setProperty('min-width','46px','important');
  button.style.setProperty('min-height','46px','important');
  button.style.setProperty('border-radius','50%','important');
  button.style.setProperty('transform','none','important');
  button.style.setProperty('margin','0','important');
  button.style.setProperty('pointer-events','auto','important');
 }
 function mount(){
  controls.forEach(apply);
  const panel=document.getElementById('proSiteEditorPanel');
  if(panel)panel.style.setProperty('bottom',window.matchMedia('(max-width:900px)').matches?'250px':'186px','important');
  const download=document.getElementById('principiaDownloadFab');
  if(download){download.style.setProperty('display','none','important');download.setAttribute('aria-hidden','true');download.tabIndex=-1;}
 }
 function start(){
  mount();
  new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});
  window.addEventListener('resize',mount,{passive:true});
  document.addEventListener('principia:rendered',mount);
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
