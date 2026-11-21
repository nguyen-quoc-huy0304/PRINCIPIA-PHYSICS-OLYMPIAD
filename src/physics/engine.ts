/** PRINCIPIA Physics Core — typed source. SI units throughout. */
type ProjectileResult = {
  range: number; flightTime: number; maxHeight: number;
  vx: number; vy: number; impactSpeed: number;
};
type MotionState = { position: number; velocity: number; acceleration: number };
const G = 9.80665;
const finite = (n: number, label: string): number => {
  if (!Number.isFinite(n)) throw new TypeError(label + " must be a finite number");
  return n;
};
function velocity(u: number, a: number, t: number): number {
  return finite(u,"u") + finite(a,"a") * finite(t,"t");
}
function displacement(u: number, a: number, t: number): number {
  u=finite(u,"u"); a=finite(a,"a"); t=finite(t,"t");
  return u*t + 0.5*a*t*t;
}
function kineticEnergy(mass: number, speed: number): number {
  mass=finite(mass,"mass"); speed=finite(speed,"speed");
  if(mass<0) throw new RangeError("mass cannot be negative");
  return 0.5*mass*speed*speed;
}
function projectile(speed: number, angleDeg: number, gravity=G): ProjectileResult {
  speed=finite(speed,"speed"); angleDeg=finite(angleDeg,"angleDeg"); gravity=finite(gravity,"gravity");
  if(speed<0 || gravity<=0) throw new RangeError("speed must be >= 0 and gravity > 0");
  const a=angleDeg*Math.PI/180, vx=speed*Math.cos(a), vy=speed*Math.sin(a);
  const flightTime=2*vy/gravity;
  return {range:vx*flightTime,flightTime,maxHeight:vy*vy/(2*gravity),vx,vy,impactSpeed:speed};
}
function state(u: number, a: number, t: number): MotionState {
  return {position:displacement(u,a,t),velocity:velocity(u,a,t),acceleration:finite(a,"a")};
}
const constants = Object.freeze({standardGravity:G});

declare global {
  interface Window {
    PrincipiaPhysics?: {
      version: string; backend: string;
      constants: Readonly<{standardGravity:number}>;
      velocity: typeof velocity; displacement: typeof displacement;
      kineticEnergy: typeof kineticEnergy; projectile: typeof projectile; state: typeof state;
    };
  }
}
window.PrincipiaPhysics = Object.freeze({
  version: "1.0.0", backend: "typescript",
  constants, velocity, displacement, kineticEnergy, projectile, state
});
