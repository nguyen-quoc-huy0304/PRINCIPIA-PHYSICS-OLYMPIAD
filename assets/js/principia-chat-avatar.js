/* PRINCIPIA assistant portrait upload: background removal with resilient local storage. */
(()=> {
 'use strict';
 const MAX_FILE_BYTES=8*1024*1024;
 const MAX_SIDE=560;
 const DB_NAME='principia-assistant-media';
 const STORE='portraits';
 const KEY='chat-avatar';
 const status=message=>{const el=document.getElementById('principiaChatAvatarStatus');if(el)el.textContent=message;};
 function openDB(){
  return new Promise((resolve,reject)=>{
   if(!('indexedDB' in window)){reject(new Error('IndexedDB không khả dụng'));return;}
   const request=indexedDB.open(DB_NAME,1);
   request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
   request.onsuccess=()=>resolve(request.result);
   request.onerror=()=>reject(request.error||new Error('Không mở được kho ảnh'));
  });
 }
 async function dbGet(){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
   const request=db.transaction(STORE,'readonly').objectStore(STORE).get(KEY);
   request.onsuccess=()=>{db.close();resolve(request.result||'')};
   request.onerror=()=>{db.close();reject(request.error)};
  });
 }
 async function dbSet(value){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).put(value,KEY);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(tx.error)};
   tx.onabort=()=>{db.close();reject(tx.error||new Error('Không lưu được ảnh'))};
  });
 }
 async function dbDelete(){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite');
   tx.objectStore(STORE).delete(KEY);
   tx.oncomplete=()=>{db.close();resolve()};
   tx.onerror=()=>{db.close();reject(tx.error)};
  });
 }
 async function getAvatar(){
  try{const value=await dbGet();if(value)return value}catch(_){}
  try{return localStorage.getItem('principia_chat_avatar')||''}catch(_){return ''}
 }
 async function refresh(){
  const root=document.getElementById('chatCharacterPortrait');
  if(!root)return;
  const avatar=await getAvatar();
  root.replaceChildren();
  const img=document.createElement('img');
  img.src=avatar||'/assets/images/principia-chat-character.png';
  img.alt='Nhân vật trợ lý PRINCIPIA';
  root.appendChild(img);
  root.classList.add('has-character');
  root.setAttribute('aria-hidden','false');
 }
 window.refreshPrincipiaChatCharacter=refresh;
 window.addEventListener('principia:character-updated',refresh);
 window.removePrincipiaChatAvatar=async()=>{
  try{await dbDelete()}catch(_){}
  try{localStorage.removeItem('principia_chat_avatar')}catch(_){}
  await refresh();
  status('Đã khôi phục nhân vật PRINCIPIA mặc định.');
 };
 function imageBitmap(blob){
  if(typeof createImageBitmap==='function')return createImageBitmap(blob);
  return new Promise((resolve,reject)=>{
   const url=URL.createObjectURL(blob),img=new Image();
   img.onload=()=>{URL.revokeObjectURL(url);resolve(img)};
   img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Không đọc được ảnh'))};
   img.src=url;
  });
 }
 async function encodeImage(blob){
  const bitmap=await imageBitmap(blob);
  const scale=Math.min(1,MAX_SIDE/Math.max(bitmap.width,bitmap.height));
  const canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(bitmap.width*scale));
  canvas.height=Math.max(1,Math.round(bitmap.height*scale));
  const ctx=canvas.getContext('2d');
  if(!ctx)throw new Error('Thiết bị không hỗ trợ xử lý ảnh');
  ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  bitmap.close?.();
  for(const quality of [.78,.66,.54,.42]){
   const data=canvas.toDataURL('image/webp',quality);
   if(data.length<=1_400_000)return data;
  }
  throw new Error('Ảnh quá lớn sau khi nén. Hãy chọn ảnh khác.');
 }
 window.uploadPrincipiaChatAvatar=async file=>{
  if(!file)return;
  if(!/^image\/(png|jpeg|webp)$/.test(file.type)){status('Chỉ hỗ trợ PNG, JPG hoặc WEBP.');return}
  if(file.size>MAX_FILE_BYTES){status('Ảnh phải nhỏ hơn 8 MB.');return}
  const input=document.getElementById('principiaChatAvatarFile');
  if(input)input.disabled=true;
  let processed=file,removed=false;
  status('Đang xử lý ảnh…');
  try{
   try{
    status('Đang tải công cụ tách nền…');
    const {removeBackground}=await import('https://esm.sh/@imgly/background-removal@1.5.5');
    processed=await removeBackground(file,{output:{format:'image/png'}});
    removed=true;
   }catch(error){
    console.warn('PRINCIPIA background removal unavailable; using uploaded image:',error);
   }
   status(removed?'Đang nén ảnh đã tách nền…':'Đang nén ảnh để lưu…');
   const data=await encodeImage(processed);
   await dbSet(data);
   try{localStorage.setItem('principia_chat_avatar',data)}catch(_){}
   await refresh();
   status(removed?'Đã tải ảnh, tự động tách nền và cập nhật nhân vật.':'Đã tải và cập nhật ảnh. Tách nền không khả dụng lúc này; ảnh gốc vẫn được giữ.');
  }catch(error){
   console.error('PRINCIPIA chat avatar upload failed:',error);
   status('Không lưu được ảnh: '+(error?.message||'Lỗi không xác định')+'. Hãy thử ảnh nhỏ hơn.');
  }finally{
   if(input){input.disabled=false;input.value='';}
  }
 };
 document.addEventListener('DOMContentLoaded',refresh);
 window.addEventListener('storage',event=>{if(event.key==='principia_chat_avatar')refresh()});
})();
