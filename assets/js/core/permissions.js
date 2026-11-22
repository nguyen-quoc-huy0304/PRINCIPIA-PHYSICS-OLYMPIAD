/* PRINCIPIA permission policy: one owner account, all other accounts are viewers. */
(function (w) {
 'use strict';
 const core=w.PrincipiaCore;if(!core)return;
 core.register('permissions',function(){
  const OWNER_EMAIL='huyquocnguyen03042011@gmail.com';
  function account(){try{return JSON.parse(localStorage.getItem('principia_google_account')||'null')}catch(_){return null}}
  function isOwner(){const a=account();return !!a&&String(a.email||'').toLowerCase()===OWNER_EMAIL&&!!w.PRINCIPIA_OWNER_UID_PUBLIC&&a.uid===w.PRINCIPIA_OWNER_UID_PUBLIC}
  function role(){return isOwner()?'admin':'viewer'}
  function can(action){return isOwner()&&['content:write','media:write','settings:write','users:manage','release:publish'].includes(action)}
  function require(action){if(can(action))return true;w.principiaNotify?.('Tài khoản hiện tại chỉ có quyền xem.');return false}
  const policy=Object.freeze({ownerEmail:OWNER_EMAIL,account,isOwner,role,can,require});
  w.PrincipiaAccess=policy;core.emit('access:ready',{role:role()});return policy;
 });
 core.start('permissions');
})(window);
