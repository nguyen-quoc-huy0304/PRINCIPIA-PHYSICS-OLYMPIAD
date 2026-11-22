/* PRINCIPIA Physics Core — browser fallback, generated from src/physics/engine.ts. */
(function(root){
'use strict';
const G=9.80665;
function finite(n,label){n=Number(n);if(!Number.isFinite(n))throw new TypeError(label+' must be a finite number');return n}
function velocity(u,a,t){return finite(u,'u')+finite(a,'a')*finite(t,'t')}
function displacement(u,a,t){u=finite(u,'u');a=finite(a,'a');t=finite(t,'t');return u*t+.5*a*t*t}
function kineticEnergy(mass,speed){mass=finite(mass,'mass');speed=finite(speed,'speed');if(mass<0)throw new RangeError('mass cannot be negative');return .5*mass*speed*speed}
function projectile(speed,angleDeg,gravity){speed=finite(speed,'speed');angleDeg=finite(angleDeg,'angleDeg');gravity=gravity===undefined?G:finite(gravity,'gravity');if(speed<0||gravity<=0)throw new RangeError('speed must be >= 0 and gravity > 0');const a=angleDeg*Math.PI/180,vx=speed*Math.cos(a),vy=speed*Math.sin(a),flightTime=2*vy/gravity;return{range:vx*flightTime,flightTime,maxHeight:vy*vy/(2*gravity),vx,vy,impactSpeed:speed}}
function state(u,a,t){return{position:displacement(u,a,t),velocity:velocity(u,a,t),acceleration:finite(a,'a')}}
root.PrincipiaPhysics=Object.freeze({version:'1.0.0',backend:'javascript-fallback',constants:Object.freeze({standardGravity:G}),velocity,displacement,kineticEnergy,projectile,state});
})(window);
