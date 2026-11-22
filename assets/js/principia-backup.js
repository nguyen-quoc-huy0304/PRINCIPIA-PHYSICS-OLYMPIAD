/* PRINCIPIA progress backup — deliberately excludes authentication and secrets. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.PrincipiaProgressBackup=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';
  const VERSION=1, MAX_BYTES=2*1024*1024;
  const KEYS=['principia_learning_suite_v1','principia_game_physics_v1'];
  function safeObject(value){
    return value!==null&&typeof value==='object'&&!Array.isArray(value);
  }
  function validate(payload){
    if(!safeObject(payload)||payload.app!=='PRINCIPIA'||payload.version!==VERSION||!safeObject(payload.data)) return {ok:false,error:'Tệp sao lưu không đúng định dạng PRINCIPIA.'};
    const keys=Object.keys(payload.data);
    if(keys.some(key=>!KEYS.includes(key))||!keys.includes(KEYS[0])) return {ok:false,error:'Tệp chứa dữ liệu không được hỗ trợ.'};
    const learning=payload.data[KEYS[0]];
    if(!safeObject(learning)) return {ok:false,error:'Dữ liệu học tập không hợp lệ.'};
    for(const [field,max] of [['attempts',500],['notes',1000],['errors',500],['claimedQuests',100],['review',10000]]){
      if(learning[field]!==undefined&&(!Array.isArray(learning[field])&&field!=='review'||field==='review'&&!safeObject(learning[field]))) return {ok:false,error:'Trường '+field+' không hợp lệ.'};
      if(Array.isArray(learning[field])&&learning[field].length>max) return {ok:false,error:'Trường '+field+' vượt giới hạn.'};
      if(field==='review'&&safeObject(learning[field])&&Object.keys(learning[field]).length>max) return {ok:false,error:'Lịch ôn tập vượt giới hạn.'};
    }
    if(payload.data[KEYS[1]]!==undefined){
      const game=payload.data[KEYS[1]];
      if(!safeObject(game)) return {ok:false,error:'Dữ liệu trò chơi không hợp lệ.'};
      for(const key of ['score','best','shots','speed','gravity','angle','target']) if(game[key]!==undefined&&!Number.isFinite(Number(game[key]))) return {ok:false,error:'Thông số trò chơi không hợp lệ.'};
    }
    return {ok:true,keys:keys};
  }
  function create(storage,now){
    const data={};
    KEYS.forEach(key=>{const raw=storage.getItem(key);if(raw!==null){try{data[key]=JSON.parse(raw)}catch(_){}}});
    if(!data[KEYS[0]]) data[KEYS[0]]={attempts:[],notes:[],errors:[],claimedQuests:[]};
    const payload={app:'PRINCIPIA',version:VERSION,createdAt:(now||new Date()).toISOString(),data};
    const json=JSON.stringify(payload,null,2);
    if(new TextEncoder().encode(json).length>MAX_BYTES) throw new Error('Dữ liệu sao lưu vượt quá 2 MB.');
    return json;
  }
  function restore(storage,payload){
    const check=validate(payload);if(!check.ok)throw new Error(check.error);
    const old={};KEYS.forEach(key=>old[key]=storage.getItem(key));
    try{
      check.keys.forEach(key=>storage.setItem(key,JSON.stringify(payload.data[key])));
    }catch(error){
      KEYS.forEach(key=>{try{if(old[key]===null)storage.removeItem(key);else storage.setItem(key,old[key])}catch(_){ }});
      throw new Error('Không thể khôi phục dữ liệu. Dữ liệu cũ đã được giữ lại.');
    }
    return check.keys;
  }
  return {VERSION,MAX_BYTES,KEYS,validate,create,restore};
});
