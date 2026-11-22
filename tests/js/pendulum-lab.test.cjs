const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assets/js/principia-pendulum-lab.js', 'utf8');
const context = { document:{readyState:'loading',addEventListener(){}}, localStorage:{getItem(){return null;},setItem(){}}, Math, Number, Object, JSON, RangeError, window:null };
context.window=context;
vm.runInNewContext(source,context,{filename:'principia-pendulum-lab.js'});
const math=context.PrincipiaPendulumMath;

test('one metre pendulum has period close to two seconds',()=>{
 const r=math.pendulumAt(1,9.81,5);
 assert.ok(Math.abs(r.periodSeconds-2.006)<0.01);
 assert.equal(r.approximation,'small-angle');
});
test('longer pendulum has a longer period',()=>{
 assert.ok(math.pendulumAt(2,9.81,10).periodSeconds>math.pendulumAt(1,9.81,10).periodSeconds);
});
test('stronger gravity shortens the period',()=>{
 assert.ok(math.pendulumAt(1,15,10).periodSeconds<math.pendulumAt(1,9.81,10).periodSeconds);
});
test('energy-based maximum speed is zero at zero amplitude',()=>{
 assert.equal(math.pendulumAt(1,9.81,0).maxSpeedMps,0);
});
test('invalid physical parameters are rejected',()=>{
 assert.throws(()=>math.pendulumAt(0,9.81,10),RangeError);
 assert.throws(()=>math.pendulumAt(1,0,10),RangeError);
 assert.throws(()=>math.pendulumAt(1,9.81,90),RangeError);
});
