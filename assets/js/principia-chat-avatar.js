/* PRINCIPIA chat avatar upload with automatic local background removal. */
(()=>{
 const MAX_FILE_BYTES=8*1024*1024;
 const MAX_OUTPUT_SIDE=720;
 const status=message=>{const el=document.getElementById('principiaChatAvatarStatus');if(el)el.textContent=message;};
 const refresh=()=>{if(typeof window.refreshPrincipiaChatCharacter==='function')window.refreshPrincipiaChatCharacter();};
 window.removePrincipiaChatAvatar=()=>{
  try{localStorage.removeItem('principia_chat_avatar');refresh();status('Đã khôi phục nhân vật PRINCIPIA cũ.');}
  catch(error){status('Không thể cập nhật ảnh trên thiết bị này.');}
 };
 window.uploadPrincipiaChatAvatar=async file=>{
  if(!file)return;
  if(!/^image\/(png|jpeg|webp)$/.test(file.type)){status('Chỉ hỗ trợ PNG, JPG hoặc WEBP.');return;}
  if(file.size>MAX_FILE_BYTES){status('Ảnh phải nhỏ hơn 8 MB.');return;}
  const input=document.getElementById('principiaChatAvatarFile');
  if(input)input.disabled=true;
  status('Đang tải công cụ tách nền và xử lý ảnh…');
  try{
   const {removeBackground}=await import('https://esm.sh/@imgly/background-removal@1.5.5');
   const result=await removeBackground(file,{output:{format:'image/png'}});
   const bitmap=await createImageBitmap(result);
   const scale=Math.min(1,MAX_OUTPUT_SIDE/Math.max(bitmap.width,bitmap.height));
   const canvas=document.createElement('canvas');
   canvas.width=Math.max(1,Math.round(bitmap.width*scale));
   canvas.height=Math.max(1,Math.round(bitmap.height*scale));
   const ctx=canvas.getContext('2d');
   if(!ctx)throw new Error('Canvas unavailable');
   ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
   bitmap.close?.();
   const data=canvas.toDataURL('image/webp',0.86);
   if(data.length>2_500_000)throw new Error('Ảnh sau xử lý vẫn quá lớn để lưu.');
   localStorage.setItem('principia_chat_avatar',data);
   refresh();
   status('Đã tách nền và cập nhật nhân vật chat.');
  }catch(error){
   console.error('PRINCIPIA chat avatar background removal:',error);
   status('Không tách được nền. Kiểm tra kết nối mạng và thử ảnh khác.');
  }finally{
   if(input){input.disabled=false;input.value='';}
  }
 };
 document.addEventListener('DOMContentLoaded',refresh);
 window.addEventListener('storage',event=>{if(event.key==='principia_chat_avatar')refresh();});
})();