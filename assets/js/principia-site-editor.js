/* PRO site content editor. Admin-only; edits persist in this browser and can be exported/imported. */
(()=> {
 'use strict';
 const STORAGE='principia_site_edits_v1';
 let state={text:{},images:{}},enabled=false,toolbar=null;
 const escapeHtml=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function isAdmin(){
  let account=null;try{account=JSON.parse(localStorage.getItem('principia_google_account')||'null')}catch(_){}
  return !!account&&String(account.email||'').toLowerCase()==='huyquocnguyen03042011@gmail.com'&&account.uid===window.PRINCIPIA_OWNER_UID_PUBLIC;
 }
 function load(){try{const parsed=JSON.parse(localStorage.getItem(STORAGE)||'{}');state={text:parsed.text||{},images:parsed.images||{}}}catch(_){state={text:{},images:{}}}}
 function persist(){try{localStorage.setItem(STORAGE,JSON.stringify(state));setStatus('Đã lưu trên thiết bị này.')}catch(error){setStatus('Không đủ dung lượng lưu. Hãy xuất bản sao hoặc giảm dung lượng ảnh.');}}
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
  if(!isAdmin())return;
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
  if(toolbar){toolbar.querySelector('[data-toggle]').textContent=enabled?'✓ Hoàn tất':'✎ Sửa chữ & ảnh';toolbar.classList.toggle('is-editing',enabled);}
  scan();
 }
 function makeToolbar(){
  if(!isAdmin()||toolbar)return;
  toolbar=document.createElement('div');toolbar.dataset.proEditorToolbar='1';toolbar.id='proSiteEditorToolbar';
  toolbar.innerHTML='<button type="button" data-toggle>✎ Sửa chữ & ảnh</button><button type="button" data-export>Xuất</button><button type="button" data-import>Nhập</button><span data-status>Chỉ quản trị viên</span><input type="file" accept="application/json,.json" hidden>';
  Object.assign(toolbar.style,{position:'fixed',left:'12px',bottom:'12px',zIndex:'2147483005',display:'flex',gap:'6px',alignItems:'center',padding:'8px',borderRadius:'14px',background:'rgba(18,20,34,.94)',border:'1px solid rgba(255,255,255,.22)',boxShadow:'0 8px 28px #0005',color:'#fff',font:'12px system-ui',maxWidth:'calc(100vw - 24px)',flexWrap:'wrap'});
  toolbar.querySelectorAll('button').forEach(button=>Object.assign(button.style,{border:'1px solid rgba(255,255,255,.24)',borderRadius:'10px',padding:'8px 10px',background:'rgba(255,255,255,.1)',color:'#fff',font:'inherit'}));
  toolbar.querySelector('[data-toggle]').addEventListener('click',()=>setEnabled(!enabled));
  toolbar.querySelector('[data-export]').addEventListener('click',()=>{
   const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='pro-site-edits.json';link.click();URL.revokeObjectURL(url);setStatus('Đã xuất bản sao nội dung.');
  });
  const fileInput=toolbar.querySelector('input[type=file]');
  toolbar.querySelector('[data-import]').addEventListener('click',()=>fileInput.click());
  fileInput.addEventListener('change',async()=>{
   const file=fileInput.files?.[0];if(!file)return;
   try{const parsed=JSON.parse(await file.text());if(!parsed||typeof parsed!=='object'||!parsed.text||!parsed.images)throw new Error('Sai định dạng');state={text:parsed.text,images:parsed.images};persist();scan();setStatus('Đã nhập nội dung.');}
   catch(_){setStatus('Tệp JSON không hợp lệ.');}
   fileInput.value='';
  });
  document.body.appendChild(toolbar);
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
 document.addEventListener('principia:rendered',()=>queueMicrotask(()=>{makeToolbar();scan();}));
 load();
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{makeToolbar();scan();},{once:true});else{makeToolbar();scan();}
 window.PrincipiaSiteEditor={setEnabled,export:()=>JSON.stringify(state),getState:()=>JSON.parse(JSON.stringify(state))};
})();
