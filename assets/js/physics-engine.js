/* PRINCIPIA Physics Core — native Rust/C++ bridge with browser fallback. */
(function(root){
'use strict';
const G=9.80665;
let lastBackend='javascript-fallback';
function finite(n,label){n=Number(n);if(!Number.isFinite(n))throw new TypeError(label+' must be a finite number');return n}
function velocity(u,a,t){return finite(u,'u')+finite(a,'a')*finite(t,'t')}
function displacement(u,a,t){u=finite(u,'u');a=finite(a,'a');t=finite(t,'t');return u*t+.5*a*t*t}
function kineticEnergy(mass,speed){mass=finite(mass,'mass');speed=finite(speed,'speed');if(mass<0)throw new RangeError('mass cannot be negative');return .5*mass*speed*speed}
function projectile(speed,angleDeg,gravity){speed=finite(speed,'speed');angleDeg=finite(angleDeg,'angleDeg');gravity=gravity===undefined?G:finite(gravity,'gravity');if(speed<0||gravity<=0)throw new RangeError('speed must be >= 0 and gravity > 0');const a=angleDeg*Math.PI/180,vx=speed*Math.cos(a),vy=speed*Math.sin(a),flightTime=2*vy/gravity;return{range:vx*flightTime,flightTime,maxHeight:vy*vy/(2*gravity),vx,vy,impactSpeed:speed}}
function state(u,a,t){return{position:displacement(u,a,t),velocity:velocity(u,a,t),acceleration:finite(a,'a')}}
const fallback=Object.freeze({velocity:p=>velocity(p.initial,p.acceleration,p.seconds),displacement:p=>displacement(p.initial,p.acceleration,p.seconds),kineticEnergy:p=>kineticEnergy(p.massKg,p.speedMps),projectileRange:p=>projectile(p.speed,p.angleDeg,p.gravity).range,projectileMaxHeight:p=>projectile(p.speed,p.angleDeg,p.gravity).maxHeight});
const operations=Object.freeze({
  velocity:p=>({initial:p.initial,acceleration:p.acceleration,seconds:p.seconds}),
  displacement:p=>({initial:p.initial,acceleration:p.acceleration,seconds:p.seconds}),
  kineticEnergy:p=>({massKg:p.massKg,speedMps:p.speedMps}),
  projectileRange:p=>({speed:p.speed,angleDeg:p.angleDeg,gravity:p.gravity===undefined?G:p.gravity}),
  projectileMaxHeight:p=>({speed:p.speed,angleDeg:p.angleDeg,gravity:p.gravity===undefined?G:p.gravity})
});
async function compute(operation,params){
  if(!Object.prototype.hasOwnProperty.call(operations,operation))throw new TypeError('Unsupported physics operation: '+operation);
  const p=operations[operation](params||{});
  // Desktop uses the Rust sidecar, which calls the C++17 numerical kernel.
  if(root.principiaDesktop&&typeof root.principiaDesktop.computePhysics==='function'){
    try{
      const value=await root.principiaDesktop.computePhysics(operation,p);
      if(!Number.isFinite(Number(value)))throw new Error('Native core returned a non-finite result');
      lastBackend='rust-cpp';
      return Number(value);
    }catch(error){
      // Keep the lesson/lab usable if a desktop sidecar is absent or unavailable.
      lastBackend='javascript-fallback';
    }
  }
  const value=fallback[operation](p);
  if(!Number.isFinite(value))throw new RangeError('Physics result is outside the supported numeric range');
  lastBackend='javascript-fallback';
  return value;
}
async function computeProjectile(speed,angleDeg,gravity){
  const params={speed,angleDeg,gravity:gravity===undefined?G:gravity};
  const [range,maxHeight]=await Promise.all([compute('projectileRange',params),compute('projectileMaxHeight',params)]);
  const angle=finite(angleDeg,'angleDeg')*Math.PI/180;
  const vx=finite(speed,'speed')*Math.cos(angle),vy=finite(speed,'speed')*Math.sin(angle);
  return{range,maxHeight,flightTime:2*vy/params.gravity,vx,vy,impactSpeed:finite(speed,'speed')};
}
const api={
  version:'1.2.0',
  constants:Object.freeze({standardGravity:G}),
  velocity,displacement,kineticEnergy,projectile,state,
  compute,computeProjectile,
  async simulateRigidBodyDrop(params){
    if(!root.principiaDesktop||typeof root.principiaDesktop.computePhysics!=='function')throw new Error('Mô phỏng vật rắn 3D Rapier hiện cần bản desktop native.');
    const p=params||{};
    const payload={initialHeightM:finite(p.initialHeightM,'initialHeightM'),gravityMps2:finite(p.gravityMps2,'gravityMps2'),radiusM:finite(p.radiusM,'radiusM'),restitution:finite(p.restitution,'restitution'),steps:finite(p.steps,'steps')};
    if(!Number.isInteger(payload.steps)||payload.steps<0||payload.steps>60000)throw new RangeError('steps must be an integer from 0 to 60000');
    const result=await root.principiaDesktop.computePhysics('rigidBodyDrop',payload);
    if(!result||!Array.isArray(result.positionM)||!Array.isArray(result.velocityMps))throw new Error('Rapier returned an invalid state');
    lastBackend='rapier3d-rust';
    return result;
  },
  async solveRobotArm(params){
    const p=params||{},l1=finite(p.l1M,'l1M'),l2=finite(p.l2M,'l2M');
    const x=finite(p.targetXM,'targetXM'),y=finite(p.targetYM,'targetYM'),branch=Number(p.elbowBranch===undefined?1:p.elbowBranch);
    if(l1<=0||l2<=0)throw new RangeError('Chiều dài hai khâu phải lớn hơn 0.');
    if(branch!==1&&branch!==-1)throw new RangeError('Nhánh khuỷu tay phải là +1 hoặc -1.');
    if(root.principiaDesktop&&typeof root.principiaDesktop.computePhysics==='function'){
      const r=await root.principiaDesktop.computePhysics('robotArmIK',{l1M:l1,l2M:l2,targetXM:x,targetYM:y,elbowBranch:branch});
      if(!r||!Number.isFinite(Number(r.shoulderDeg))||!Number.isFinite(Number(r.elbowDeg)))throw new Error('Native robotics core returned an invalid solution');
      lastBackend='rust-robotics';return r;
    }
    const r2=x*x+y*y,r=Math.sqrt(r2),tol=1e-12*Math.max(l1+l2,1);
    if(r>l1+l2+tol||r<Math.abs(l1-l2)-tol)throw new RangeError('Điểm đích nằm ngoài vùng với tới của robot.');
    const c=Math.max(-1,Math.min(1,(r2-l1*l1-l2*l2)/(2*l1*l2)));
    const elbow=branch*Math.acos(c),shoulder=Math.atan2(y,x)-Math.atan2(l2*Math.sin(elbow),l1+l2*Math.cos(elbow));
    const ex=l1*Math.cos(shoulder)+l2*Math.cos(shoulder+elbow),ey=l1*Math.sin(shoulder)+l2*Math.sin(shoulder+elbow);
    lastBackend='javascript-analytical-fallback';
    return {shoulderRad:shoulder,elbowRad:elbow,shoulderDeg:shoulder*180/Math.PI,elbowDeg:elbow*180/Math.PI,endXM:ex,endYM:ey,targetErrorM:Math.hypot(ex-x,ey-y),singular:Math.abs(Math.sin(elbow))<1e-10};
  },
  get backend(){return lastBackend}
};
root.PrincipiaPhysics=Object.freeze(api);
})(window);
