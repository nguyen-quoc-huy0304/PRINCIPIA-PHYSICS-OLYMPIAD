
(function(){
  function showStartupError(message){
    try{
      let box=document.getElementById('principiaStartupError');
      if(!box){
        box=document.createElement('div');box.id='principiaStartupError';
        box.style.cssText='position:fixed;left:12px;right:12px;bottom:12px;z-index:2147483647;padding:14px 16px;border:1px solid #d66;border-radius:14px;background:#fff1f1;color:#761b1b;font:13px/1.5 system-ui;box-shadow:0 8px 30px #0003;white-space:pre-wrap;max-height:38vh;overflow:auto';
        document.body.appendChild(box);
      }
      box.textContent='PRINCIPIA gặp lỗi khi khởi động:\n'+String(message||'Lỗi không xác định').slice(0,1400)+'\nHãy chụp phần thông báo này gửi lại để sửa đúng lỗi.';
    }catch(_){}
  }
  window.addEventListener('error',function(e){
    if(e&&e.target&&e.target!==window){
      const tag=e.target.tagName||'RESOURCE';
      const src=e.target.src||e.target.href||'';
      showStartupError('Không tải được '+tag+(src?' : '+src:''));
    }else{
      showStartupError((e.message||'JavaScript error')+(e.filename?'\n'+e.filename+':'+e.lineno+':'+e.colno:''));
    }
  },true);
  window.addEventListener('unhandledrejection',function(e){
    const r=e.reason;showStartupError(r&&(r.stack||r.message)||String(r||'Promise rejected'));
  });
})();
