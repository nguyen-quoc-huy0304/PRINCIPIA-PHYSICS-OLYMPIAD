/* PRINCIPIA data boundary — versioned, namespaced local persistence. */
(function(w){
 'use strict';const core=w.PrincipiaCore;if(!core)return;
 core.register('repository',function(){
  const storage=core.storage(),PREFIX='principia:v1:';
  function read(key,fallback){return storage.get(PREFIX+key,fallback)}
  function write(key,value){const ok=storage.set(PREFIX+key,value);if(ok)core.emit('data:changed',{key});return ok}
  function remove(key){const ok=storage.remove(PREFIX+key);if(ok)core.emit('data:changed',{key,removed:true});return ok}
  function transact(key,updater,fallback){const current=read(key,fallback);const next=updater(current);if(next===undefined)throw new Error('Transaction must return a value');write(key,next);return next}
  const api=Object.freeze({read,write,remove,transact});
  w.PrincipiaData=api;return api;
 });
 core.start('repository');
})(window);
