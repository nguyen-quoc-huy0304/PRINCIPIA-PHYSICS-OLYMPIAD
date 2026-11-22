const test=require('node:test');const assert=require('node:assert/strict');const C=require('../../assets/js/principia-research-core.js');
function mem(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)}}
const record={id:'e1',title:'Con lắc',question:'Chu kỳ phụ thuộc chiều dài?',method:'Đo 5 lần',xUnit:'s',yUnit:'cm',points:[{x:1,y:2},{x:2,y:4},{x:3,y:6}]};
test('parses valid measurement pairs',()=>assert.deepEqual(C.parsePoints('1,2\n3,4'),[{x:1,y:2},{x:3,y:4}]));
test('rejects malformed, nonfinite and undersized data',()=>{assert.throws(()=>C.parsePoints('1,2,3\n2,3'));assert.throws(()=>C.parsePoints('1,NaN\n2,3'));assert.throws(()=>C.parsePoints('1,2'))});
test('computes sample statistics and linear fit',()=>{const s=C.summarize(record.points);assert.equal(s.mean,4);assert.equal(s.slope,2);assert.equal(s.intercept,0);assert.equal(s.standardDeviation,2)});
test('handles constant X without dividing by zero',()=>assert.equal(C.summarize([{x:1,y:2},{x:1,y:4}]).slope,null));
test('validates metadata and points',()=>{assert.equal(C.validate(record).summary.count,3);assert.throws(()=>C.validate({...record,title:''}))});
test('rejects unsafe imported identifiers',()=>assert.throws(()=>C.validate({...record,id:"bad' onclick='alert(1)"})));
test('persists, updates and removes experiment records',()=>{const s=C.createStore(mem());s.save(record);s.save({...record,title:'Đã cập nhật'});assert.equal(s.all().length,1);assert.equal(s.all()[0].title,'Đã cập nhật');s.remove('e1');assert.equal(s.all().length,0)});
test('exports and imports a validated archive',()=>{const a=C.createStore(mem()),b=C.createStore(mem());a.save(record);assert.equal(b.import(a.export()),1);assert.equal(b.all()[0].title,record.title)});
test('rejects malformed import and oversized file without data loss',()=>{const s=C.createStore(mem());s.save(record);assert.throws(()=>s.import('x'.repeat(5*1024*1024+1)));assert.throws(()=>s.import('{"schema":"bad","version":1,"experiments":[]}'));assert.equal(s.all().length,1)});
test('caps point count',()=>assert.throws(()=>C.parsePoints(Array(10001).fill('1,2').join('\n'))));

test('CSV export escapes units and exports all measurements',()=>{const item=C.validate({title:'CSV',xUnit:'s, "time"',yUnit:'m',rawPoints:'0,1\n1,2'});const csv=C.toCSV(item);assert.match(csv,/X \(s, ""time""\)/);assert.match(csv,/"0","1"/);assert.match(csv,/"1","2"/);});

test('exports one experiment as an independently importable JSON pack',()=>{const a=C.createStore(mem());a.save(record);a.save({...record,id:'e2',title:'Điện trở'});const pack=JSON.parse(a.exportOne('e1'));assert.equal(pack.schema,'principia-research-notebook');assert.equal(pack.experiments.length,1);assert.equal(pack.experiments[0].id,'e1');const b=C.createStore(mem());assert.equal(b.import(JSON.stringify(pack)),1);assert.equal(b.all()[0].title,record.title)});
test('single-experiment export rejects unknown IDs',()=>{const s=C.createStore(mem());assert.throws(()=>s.exportOne('missing'))});
test('failed import over merged record cap preserves all saved experiments',()=>{const s=C.createStore(mem());for(let i=0;i<500;i++)s.save({...record,id:'r'+i,title:'Thí nghiệm '+i});const before=s.all().map(x=>x.id);assert.throws(()=>s.import(JSON.stringify({schema:'principia-research-notebook',version:1,experiments:[{...record,id:'overflow'}]})));assert.deepEqual(s.all().map(x=>x.id),before)});
