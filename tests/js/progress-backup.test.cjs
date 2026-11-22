const test=require('node:test');
const assert=require('node:assert/strict');
const backup=require('../../assets/js/principia-backup.js');
function storage(seed={}){const data={...seed};return {getItem:k=>data[k]??null,setItem:(k,v)=>{data[k]=v},removeItem:k=>{delete data[k]},data};}
test('creates a versioned backup with learning data and game data only',()=>{
 const s=storage({'principia_learning_suite_v1':JSON.stringify({attempts:[{score:4,total:5}],notes:[]}), 'principia_game_physics_v1':JSON.stringify({best:90}), 'firebase:authUser':JSON.stringify({token:'secret'})});
 const payload=JSON.parse(backup.create(s,new Date('2026-01-01T00:00:00.000Z')));
 assert.equal(payload.app,'PRINCIPIA');assert.equal(payload.version,1);
 assert.deepEqual(Object.keys(payload.data).sort(),['principia_game_physics_v1','principia_learning_suite_v1']);
 assert.equal(JSON.stringify(payload).includes('secret'),false);
});
test('rejects foreign or unsupported backup payloads',()=>{
 assert.equal(backup.validate({app:'OTHER',version:1,data:{}}).ok,false);
 assert.equal(backup.validate({app:'PRINCIPIA',version:1,data:{'firebase:authUser':{token:'x'}}}).ok,false);
});
test('rejects malformed learning arrays and oversized collections',()=>{
 assert.equal(backup.validate({app:'PRINCIPIA',version:1,data:{principia_learning_suite_v1:{attempts:{}}}}).ok,false);
 assert.equal(backup.validate({app:'PRINCIPIA',version:1,data:{principia_learning_suite_v1:{notes:Array(1001).fill({})}}}).ok,false);
});
test('restores allowed keys without touching unrelated storage',()=>{
 const s=storage({'principia_learning_suite_v1':'old','firebase:authUser':'keep'});
 const p={app:'PRINCIPIA',version:1,data:{principia_learning_suite_v1:{attempts:[],notes:[]},principia_game_physics_v1:{best:10}}};
 backup.restore(s,p);
 assert.deepEqual(JSON.parse(s.getItem('principia_game_physics_v1')),{best:10});
 assert.equal(s.getItem('firebase:authUser'),'keep');
});
test('rolls back when storage fails during restore',()=>{
 const s=storage({'principia_learning_suite_v1':'old'});
 const original=s.setItem;s.setItem=(k,v)=>{if(k==='principia_game_physics_v1')throw Error('quota');original(k,v)};
 const p={app:'PRINCIPIA',version:1,data:{principia_learning_suite_v1:{attempts:[]},principia_game_physics_v1:{best:10}}};
 assert.throws(()=>backup.restore(s,p),/Dữ liệu cũ đã được giữ lại/);
 assert.equal(s.getItem('principia_learning_suite_v1'),'old');
});
test('rejects non-finite game physics settings',()=>{
 const p={app:'PRINCIPIA',version:1,data:{principia_learning_suite_v1:{},principia_game_physics_v1:{speed:'NaN'}}};
 assert.equal(backup.validate(p).ok,false);
});
