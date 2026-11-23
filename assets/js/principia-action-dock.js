/* PRO viewport action dock: re-parent floating actions into one fixed viewport container. */
(()=> {
 'use strict';
 const ID='principiaViewportActionDock';
 function mount(){
  let dock=document.getElementById(ID);
  if(!dock){dock=document.createElement('div');dock.id=ID;dock.setAttribute('role','group');dock.setAttribute('aria-label','Thao tác nhanh');document.body.appendChild(dock);}
  const items=[
   document.querySelector('button.chat-bubble-btn.chat-messenger-launcher'),
   document.getElementById('principiaSearchTrigger'),
   document.getElementById('principiaDownloadFab')
  ].filter(Boolean);
  items.forEach(item=>{
   if(item.parentElement!==dock)dock.appendChild(item);
   item.style.setProperty('display','grid','important');
   item.style.setProperty('position','relative','important');
   ['inset','top','right','bottom','left','transform'].forEach(prop=>item.style.setProperty(prop,'auto','important'));
  });
 }
 function start(){mount();new MutationObserver(mount).observe(document.body,{childList:true,subtree:true});}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
