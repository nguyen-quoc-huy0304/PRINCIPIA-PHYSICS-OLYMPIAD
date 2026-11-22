/* PRINCIPIA navigation adapter — exposes stable route events without replacing legacy screens. */
(function(w){
 'use strict';const core=w.PrincipiaCore;if(!core)return;
 core.register('navigation',function(){
  let current=null;
  function go(route,meta){if(typeof route!=='string'||!route.trim())return false;const next=route.trim();const previous=current;current=next;core.emit('navigation:change',{route:next,previous,meta:meta||{}});return true}
  function get(){return current}
  w.addEventListener('principia:page-changed',e=>{const page=e.detail?.page;if(page)go(page,{source:'legacy-adapter'})});
  const api=Object.freeze({go,get,onChange(fn){return core.on('navigation:change',fn)}});
  w.PrincipiaNavigation=api;return api;
 });
 core.start('navigation');
})(window);
