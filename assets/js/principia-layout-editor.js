/* PRINCIPIA launcher layout mode: edit the three floating access buttons. */
(()=> {
 'use strict';
 let enabled=false;
 const STYLE={
  width:'100%',marginBottom:'8px',padding:'9px 10px',border:'1px solid rgba(167,139,250,.65)',
  borderRadius:'10px',background:'rgba(124,92,210,.2)',color:'#fff',font:'inherit',
  cursor:'pointer',textAlign:'left'
 };
 function attachControl(){
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.querySelector('[data-layout-editor-toggle]'))return;
  const button=document.createElement('button');
  button.type='button';button.dataset.layoutEditorToggle='true';
  button.textContent='↔ Sắp xếp vị trí các nút';
  Object.assign(button.style,STYLE);
  const textToggle=panel.querySelector('[data-toggle]');
  if(textToggle)textToggle.insertAdjacentElement('beforebegin',button);
  else panel.prepend(button);
  button.addEventListener('click',()=>{
   document.dispatchEvent(new CustomEvent('principia:layout-edit-toggle',{detail:{enabled:!enabled}}));
  });
 }
 document.addEventListener('principia:layout-edit-changed',event=>{
  enabled=!!event.detail?.enabled;
  const button=document.querySelector('[data-layout-editor-toggle]');
  if(button)button.textContent=enabled?'✓ Hoàn tất bố trí nút':'↔ Sắp xếp vị trí các nút';
  const status=document.querySelector('#proSiteEditorPanel [data-status]');
  if(status)status.textContent=enabled?'Kéo 3 nút nổi đến vị trí mới. Vị trí tự lưu.':'Chọn “Sắp xếp vị trí các nút” để di chuyển AI, Internet và Bút.';
 });
 document.addEventListener('principia:rendered',attachControl);
 const observer=new MutationObserver(attachControl);
 observer.observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',attachControl,{once:true});
 else attachControl();
})();