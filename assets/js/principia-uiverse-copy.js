/* Uiverse MIT button pattern integration.
 * Original CSS/HTML pattern: Web-Potato, https://uiverse.io/Web-Potato/silent-ape-24
 * Only text/action buttons in content areas are enhanced; docks, navigation and editors are excluded.
 */
(() => {
 'use strict';
 const SELECTOR='#app .main .hero button.primary,#app .main .sectionhead .toolbar button,#principiaLabCodeStudio .pr-code-run';
 const EXCLUDED='#proSiteEditorPanel,.principia-mobile-nav,.principia-action-dock,[role="dialog"]';
 function enhance(root=document){
  root.querySelectorAll?.(SELECTOR).forEach(button=>{
   if(button.dataset.prUiverseCopied||button.disabled||!button.textContent.trim()||button.closest(EXCLUDED))return;
   const label=document.createElement('span');
   label.className='pr-uiverse-label';
   while(button.firstChild)label.append(button.firstChild);
   button.append(label);
   button.classList.add('pr-uiverse-button');
   button.dataset.prUiverseCopied='1';
  });
 }
 function init(){
  enhance();
  const app=document.getElementById('app')||document.body;
  const observer=new MutationObserver(records=>{
   for(const record of records)for(const node of record.addedNodes)if(node.nodeType===1)enhance(node);
  });
  observer.observe(app,{childList:true,subtree:true});
  document.addEventListener('principia:rendered',()=>enhance());
  window.PrincipiaUiverse=Object.freeze({refresh:enhance});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
