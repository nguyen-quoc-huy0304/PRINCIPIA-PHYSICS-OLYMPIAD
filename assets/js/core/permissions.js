/* PRINCIPIA permission policy: one owner account, all other accounts are viewers. */
(function (w) {
 'use strict';
 const core=w.PrincipiaCore;if(!core)return;
 core.register('permissions',function(){
  const OWNER_EMAIL='huyquocnguyen03042011@gmail.com';
  w.PRINCIPIA_OWNER_EMAIL_PUBLIC=OWNER_EMAIL;
  function account(){try{return JSON.parse(localStorage.getItem('principia_google_account')||'null')}catch(_){return null}}
  function authenticatedUser(){try{return w.firebase?.apps?.length&&typeof w.firebase.auth==='function'?w.firebase.auth().currentUser:null}catch(_){return null}}
  function isOwner(){const user=authenticatedUser();return !!user&&String(user.email||'').toLowerCase()===OWNER_EMAIL}
  function role(){return isOwner()?'admin':'viewer'}
  function can(action){return isOwner()&&['content:write','media:write','settings:write','users:manage','release:publish'].includes(action)}
  function require(action){if(can(action))return true;w.principiaNotify?.('Tài khoản hiện tại chỉ có quyền xem.');return false}
  const policy=Object.freeze({ownerEmail:OWNER_EMAIL,account,isOwner,role,can,require});
  w.PrincipiaAccess=policy;core.emit('access:ready',{role:role()});return policy;
 });
 core.start('permissions');
})(window);
