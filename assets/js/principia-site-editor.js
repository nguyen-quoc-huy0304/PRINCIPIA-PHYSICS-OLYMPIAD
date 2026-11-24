/* PRO site content editor. Admin-only; edits persist in this browser and can be exported/imported. */
(()=> {
 'use strict';
 const STORAGE='principia_site_edits_v1';
 let state={text:{},images:{}},enabled=false,toolbar=null,remoteRef=null,remoteUnsubscribe=null,remoteReady=false,remoteLoading=false;
 const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function isAdmin(){return !!window.PrincipiaAccess?.isOwner?.();}
 function normalizeState(value){
  const text={},images={};
  if(value&&typeof value.text==='object'&&value.text)Object.entries(value.text).slice(0,2500).forEach(([key,item])=>{if(typeof key==='string'&&key.length<=600&&typeof item==='string'&&item.length<=12000)text[key]=item});
  if(value&&typeof value.images==='object'&&value.images)Object.entries(value.images).slice(0,250).forEach(([key,item])=>{if(typeof key==='string'&&key.length<=600&&typeof item==='string'&&item.length<=1100000&&/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(item))images[key]=item});
  return {text,images};
 }
 function load(){try{state=normalizeState(JSON.parse(localStorage.getItem(STORAGE)||'{}'))}catch(_){state={text:{},images:{}}}}
 function persist(){
  try{localStorage.setItem(STORAGE,JSON.stringify(state));setStatus('Đã lưu trên thiết bị này.')}
  catch(error){setStatus('Không đủ dung lượng lưu. Hãy xuất bản sao hoặc giảm dung lượng ảnh.');return;}
  syncRemote();
 }
 function applyStoredEdits(){
  const elements=[...document.body.querySelectorAll('*')];
  elements.filter(el=>el.tagName==='IMG').forEach(img=>{const src=state.images[elementPath(img)];if(typeof src==='string'&&img.src!==src)img.src=src});
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const changes=[];let node;
  while((node=walker.nextNode()))if(!excluded(node)){
   const key=elementPath(node.parentElement)+':text:'+Array.prototype.indexOf.call(node.parentElement.childNodes,node);
   if(Object.prototype.hasOwnProperty.call(state.text,key)&&node.nodeValue!==state.text[key])changes.push({node,value:state.text[key]});
  }
  changes.forEach(({node,value})=>{node.nodeValue=value});
 }
 async function subscribeRemote(){
  if(remoteLoading||remoteUnsubscribe||!window.firebase?.auth?.().currentUser)return;
  remoteLoading=true;
  try{
   if(typeof window.principiaLeaderboardDb!=='function')throw new Error('Firestore adapter chưa sẵn sàng.');
   const db=await window.principiaLeaderboardDb();
   remoteRef=db.collection('principiaContent').doc('siteEdits');
   remoteUnsubscribe=remoteRef.onSnapshot(snapshot=>{
    if(snapshot.exists){
     state=normalizeState(snapshot.data());
     try{localStorage.setItem(STORAGE,JSON.stringify(state))}catch(_){}
     applyStoredEdits();if(isAdmin())scan();
    }else if(isAdmin())syncRemote();
    remoteReady=true;remoteLoading=false;
    const toggle=toolbar?.querySelector('[data-toggle]');if(toggle)toggle.disabled=false;
    const importer=toolbar?.querySelector('[data-import]');if(importer)importer.disabled=false;
    if(isAdmin())setStatus('Đã đồng bộ nội dung PRINCIPIA trên các thiết bị.');
   },error=>{remoteReady=true;remoteLoading=false;const toggle=toolbar?.querySelector('[data-toggle]');if(toggle)toggle.disabled=false;const importer=toolbar?.querySelector('[data-import]');if(importer)importer.disabled=false;setStatus('Không đồng bộ được: '+(error?.message||'lỗi Firestore')+'. Bản cục bộ vẫn được giữ.')});
  }catch(error){
   remoteReady=true;remoteLoading=false;
   const toggle=toolbar?.querySelector('[data-toggle]');if(toggle)toggle.disabled=false;
   const importer=toolbar?.querySelector('[data-import]');if(importer)importer.disabled=false;
   setStatus('Đang dùng bản lưu cục bộ: '+(error?.message||'Firestore chưa sẵn sàng'));
  }
 }
 function stopRemote(){remoteUnsubscribe?.();remoteUnsubscribe=null;remoteRef=null;remoteReady=false;remoteLoading=false;}
 function syncRemote(){
  if(!isAdmin()||!remoteRef||!remoteReady)return;
  const payload={text:state.text,images:state.images};
  if(new Blob([JSON.stringify(payload)]).size>800000){setStatus('Nội dung vượt giới hạn đồng bộ Firestore 800 KB. Bản cục bộ vẫn được lưu; hãy giảm dung lượng ảnh.');return;}
  remoteRef.set({...payload,updatedAt:window.firebase.firestore.FieldValue.serverTimestamp()})
   .then(()=>setStatus('Đã lưu và đồng bộ nội dung PRINCIPIA.'))
   .catch(error=>setStatus('Đã lưu cục bộ; đồng bộ thất bại: '+(error?.message||'Firestore')));
 }
 function setStatus(message){const el=toolbar?.querySelector('[data-status]');if(el)el.textContent=message;}
 function elementPath(element){
  const parts=[];let node=element;
  while(node&&node!==document.body&&node.parentElement){
   const siblings=[...node.parentElement.children].filter(item=>item.tagName===node.tagName);
   parts.unshift(node.tagName.toLowerCase()+':'+(siblings.indexOf(node)+1));
   node=node.parentElement;
  }
  return parts.join('/');
 }
 function excluded(node){
  const parent=node.parentElement;
  return !parent||parent.closest('[data-pro-editor-toolbar],[data-pro-edit-key],script,style,noscript,textarea,input,select,option,svg,[contenteditable="true"]')||!node.nodeValue.trim();
 }
 function scan(){
  if(!isAdmin()){applyStoredEdits();return;}
  const elements=[...document.body.querySelectorAll('*')];
  elements.forEach(el=>{if(!el.dataset.proEditPath)el.dataset.proEditPath=elementPath(el);});
  elements.filter(el=>el.tagName==='IMG').forEach(img=>{
   const key=img.dataset.proEditPath;
   if(state.images[key]&&img.src!==state.images[key])img.src=state.images[key];
   img.dataset.proImageEditKey=key;
   img.style.cursor=enabled?'copy':'';
   img.classList.toggle('pro-edit-image',enabled);
  });
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  const nodes=[];let node;
  while((node=walker.nextNode()))if(!excluded(node))nodes.push({node,key:elementPath(node.parentElement)+':text:'+Array.prototype.indexOf.call(node.parentElement.childNodes,node)});
  nodes.forEach(({node,key})=>{
   if(node.parentElement?.dataset.proEditKey===key)return;
   const span=document.createElement('span');span.dataset.proEditKey=key;span.textContent=node.nodeValue;
   node.parentNode.replaceChild(span,node);
  });
  document.querySelectorAll('[data-pro-edit-key]').forEach(el=>{
   if(Object.prototype.hasOwnProperty.call(state.text,el.dataset.proEditKey)&&el.textContent!==state.text[el.dataset.proEditKey])el.textContent=state.text[el.dataset.proEditKey];
   el.contentEditable=enabled?'true':'false';
   el.spellcheck=enabled;
   el.classList.toggle('pro-edit-text',enabled);
  });
 }
 function setEnabled(next){
  enabled=!!next;
  if(toolbar){const toggle=toolbar.querySelector('[data-toggle]');if(toggle)toggle.textContent=enabled?'✓ Hoàn tất sửa':'✎ Bật sửa chữ & ảnh';toolbar.classList.toggle('is-editing',enabled);}
  scan();
 }
 function makeToolbar(){
  if(!isAdmin()||toolbar)return;
  const fab=document.createElement('button');
  fab.type='button';fab.id='proSiteEditorFab';fab.dataset.proEditorToolbar='1';
  fab.innerHTML='<svg viewBox="0 0 24 24" width="21" height="21" aria-hidden="true"><path d="m4 16.5-.8 4.3 4.3-.8L19 8.5 15.5 5 4 16.5Z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m13.8 6.7 3.5 3.5M3 21h18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
  fab.setAttribute('aria-label','Công cụ sửa chữ và ảnh');fab.title='Sửa chữ & ảnh';
  Object.assign(fab.style,{position:'fixed',right:'18px',bottom:'130px',zIndex:'2147483005',display:'grid',placeItems:'center',width:'46px',height:'46px',minWidth:'46px',minHeight:'46px',borderRadius:'50%',border:'1px solid rgba(255,255,255,.25)',background:'rgba(20,22,36,.88)',backdropFilter:'blur(16px)',color:'#fff',boxShadow:'0 8px 24px #0005',cursor:'pointer'});
  const panel=document.createElement('div');panel.id='proSiteEditorPanel';panel.dataset.proEditorToolbar='1';
  panel.hidden=true;
  panel.innerHTML='<div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px"><strong>Chỉnh sửa trang</strong><button type="button" data-close aria-label="Đóng">×</button></div><button type="button" data-toggle style="width:100%;margin-bottom:7px">✎ Bật sửa chữ & ảnh</button><div style="display:flex;gap:7px"><button type="button" data-export>Xuất bản sao</button><button type="button" data-import>Nhập bản sao</button></div><span data-status style="display:block;margin-top:8px;font-size:11px;opacity:.75">Chỉ quản trị viên</span><input type="file" accept="application/json,.json" hidden>';
  Object.assign(panel.style,{position:'fixed',right:'18px',bottom:'186px',zIndex:'2147483005',width:'min(270px,calc(100vw - 36px))',padding:'12px',borderRadius:'14px',background:'rgba(18,20,34,.96)',border:'1px solid rgba(255,255,255,.22)',boxShadow:'0 8px 28px #0006',color:'#fff',font:'13px system-ui'});
  panel.querySelectorAll('button').forEach(button=>Object.assign(button.style,{border:'1px solid rgba(255,255,255,.22)',borderRadius:'9px',padding:'8px 10px',background:'rgba(255,255,255,.1)',color:'#fff',font:'inherit',cursor:'pointer'}));
  toolbar=panel;
  fab.addEventListener('click',()=>{
   panel.hidden=!panel.hidden;
   document.dispatchEvent(new CustomEvent('principia:layout-edit-toggle',{detail:{enabled:!panel.hidden}}));
  });
  panel.querySelector('[data-close]').addEventListener('click',()=>{
   panel.hidden=true;
   document.dispatchEvent(new CustomEvent('principia:layout-edit-toggle',{detail:{enabled:false}}));
  });
  panel.querySelector('[data-toggle]').addEventListener('click',()=>setEnabled(!enabled));
  panel.querySelector('[data-export]').addEventListener('click',()=>{
   const exported=typeof window.PrincipiaSiteEditor?.export==='function'?window.PrincipiaSiteEditor.export():JSON.stringify(state,null,2);
   const blob=new Blob([exported],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='pro-site-edits.json';link.click();URL.revokeObjectURL(url);setStatus('Đã xuất bản sao nội dung.');
  });
  const fileInput=panel.querySelector('input[type=file]');
  panel.querySelector('[data-import]').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',async()=>{
   const file=fileInput.files?.[0];if(!file)return;
   try{const parsed=JSON.parse(await file.text());if(!parsed||typeof parsed!=='object'||!parsed.text||!parsed.images)throw new Error('Sai định dạng');state={text:parsed.text,images:parsed.images};window.PrincipiaCanvaEditor?.importState?.(parsed.canvas);persist();scan();setStatus('Đã nhập nội dung.');}
   catch(_){setStatus('Tệp JSON không hợp lệ.');}
   fileInput.value='';
  });
  document.body.append(fab,panel);
 }
 function compressImage(file){
  return new Promise((resolve,reject)=>{
   if(!file.type.startsWith('image/'))return reject(new Error('Chỉ nhận tệp hình ảnh.'));
   const reader=new FileReader();
   reader.onerror=()=>reject(new Error('Không đọc được ảnh.'));
   reader.onload=()=>{
    const image=new Image();image.onerror=()=>reject(new Error('Ảnh không hợp lệ.'));
    image.onload=()=>{
     const scale=Math.min(1,1600/Math.max(image.width,image.height));
     const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
     canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
     let result=canvas.toDataURL('image/webp',.78);
     if(result.length>900000)result=canvas.toDataURL('image/jpeg',.62);
     if(result.length>1100000)return reject(new Error('Ảnh sau nén vẫn quá lớn. Hãy chọn ảnh nhỏ hơn.'));
     resolve(result);
    };
    image.src=reader.result;
   };
   reader.readAsDataURL(file);
  });
 }
 document.addEventListener('focusout',event=>{
  const target=event.target;if(!enabled||!target?.matches?.('[data-pro-edit-key]'))return;
  state.text[target.dataset.proEditKey]=target.textContent;persist();
 },true);
 document.addEventListener('click',async event=>{
  if(!enabled)return;
  const image=event.target.closest?.('img[data-pro-image-edit-key]');if(!image)return;
  event.preventDefault();event.stopPropagation();
  const picker=document.createElement('input');picker.type='file';picker.accept='image/*';
  picker.onchange=async()=>{const file=picker.files?.[0];if(!file)return;try{const src=await compressImage(file);state.images[image.dataset.proImageEditKey]=src;image.src=src;persist();}catch(error){setStatus(error.message||'Không thể thay ảnh.');}};
  picker.click();
 },true);
 document.addEventListener('principia:rendered',()=>queueMicrotask(()=>{applyStoredEdits();if(isAdmin()){makeToolbar();scan();}}));
 document.addEventListener('principia:auth-state-changed',event=>{if(event.detail?.authenticated){subscribeRemote();if(isAdmin())makeToolbar();else applyStoredEdits();return;}stopRemote();enabled=false;toolbar?.remove();toolbar=null;document.getElementById('proSiteEditorFab')?.remove();document.querySelectorAll('[data-pro-edit-key]').forEach(el=>{el.contentEditable='false';el.classList.remove('pro-edit-text')});});
 load();applyStoredEdits();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{if(isAdmin())makeToolbar();scan();},{once:true});else{if(isAdmin())makeToolbar();scan();}
 window.addEventListener('pagehide',stopRemote,{once:true});
 window.PrincipiaSiteEditor={setEnabled,export:()=>JSON.stringify(state),getState:()=>JSON.parse(JSON.stringify(state)),sync:subscribeRemote};
})();
