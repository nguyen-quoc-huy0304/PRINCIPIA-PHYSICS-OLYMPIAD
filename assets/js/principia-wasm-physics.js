/* PRINCIPIA Rust/WASM physics adapter. JS is limited to browser integration. */
(function(root){
'use strict';
const WASM_URL='../wasm/pkg/principia_core.js';
let wasmPromise=null;
function loadWasm(){
  if(!wasmPromise){
    wasmPromise=import(WASM_URL).then(async module=>{
      await module.default();
      return module;
    }).catch(error=>{
      wasmPromise=null;
      throw new Error('Rust WebAssembly physics core is unavailable: '+error.message);
    });
  }
  return wasmPromise;
}
async function compute(operation,params){
  const wasm=await loadWasm();
  const p=params||{};
  switch(operation){
    case 'velocity': return wasm.physics_velocity(p.initial,p.acceleration,p.seconds);
    case 'displacement': return wasm.physics_displacement(p.initial,p.acceleration,p.seconds);
    case 'kineticEnergy': return wasm.physics_kinetic_energy(p.massKg,p.speedMps);
    case 'pendulum': return JSON.parse(wasm.physics_pendulum_json(p.lengthM,p.gravityMps2,p.amplitudeDeg));
    case 'collision1D': return JSON.parse(wasm.physics_collision_1d_json(p.massA,p.velocityA,p.massB,p.velocityB,p.restitution));
    case 'collision2D': return JSON.parse(wasm.physics_disk_collision_json(JSON.stringify(p.bodyA),JSON.stringify(p.bodyB),p.restitution));
    case 'scoreProjectile': return JSON.parse(wasm.score_projectile_json(p.speed,p.angleDeg,p.targetM,p.gravity));
    case 'projectileRange': return JSON.parse(wasm.physics_projectile_json(p.speed,p.angleDeg,p.gravity)).range;
    case 'projectileMaxHeight': return JSON.parse(wasm.physics_projectile_json(p.speed,p.angleDeg,p.gravity)).maxHeight;
    case 'linearRegression': return JSON.parse(wasm.physics_linear_regression_json(JSON.stringify(p.points)));
    case 'robotArmIK': return JSON.parse(wasm.physics_robot_arm_json(p.l1M,p.l2M,p.targetXM,p.targetYM,p.elbowBranch));
    case 'robotForwardKinematics': return JSON.parse(wasm.physics_robot_forward_json(p.l1,p.l2,p.shoulderRad,p.elbowRad));
    case 'robotAssemblyCheck': return JSON.parse(wasm.robot_assembly_evaluate_json(p.base,p.joint,p.link1,p.link2,p.tool,p.link1Mm,p.link2Mm,p.shoulderDeg,p.elbowDeg,p.targetX,p.targetY));
    case 'forceBalanceTarget': return JSON.parse(wasm.force_balance_target_json(p.forceAX,p.forceAY,p.forceBX,p.forceBY));
    case 'forceBalanceScore': return JSON.parse(wasm.force_balance_score_json(p.x,p.y,p.targetX,p.targetY));
    case 'gradeQuiz': return JSON.parse(wasm.assessment_grade_json(JSON.stringify(p)));
    case 'recordProgress': return JSON.parse(wasm.progress_record_json(JSON.stringify(p.progress||{}),p.activity,p.day));
    case 'learningRecommend': return JSON.parse(wasm.learning_recommend_json(JSON.stringify(p)));\n    case 'learningOrchestrate': return JSON.parse(wasm.learning_orchestrate_json(JSON.stringify(p)));
    case 'reviewSchedule': return JSON.parse(wasm.learning_review_schedule_json(p.quality,p.previousIntervalDays,p.easeFactor));
    case 'progressionSummary': return JSON.parse(wasm.progression_summary_json(JSON.stringify(p)));
    case 'gameChallenge': return JSON.parse(wasm.generate_game_challenge_json(p.seed));
    case 'gameTrajectory': return JSON.parse(wasm.game_trajectory_json(p.speed,p.angleDeg,p.gravity,p.samples||49));
    case 'gameClampTarget': return wasm.clamp_game_target(p.target,p.speed,p.gravity);
    default: throw new TypeError('Unsupported Rust/WASM physics operation: '+operation);
  }
}
root.PrincipiaWasmPhysics=Object.freeze({compute,load:loadWasm,collide1D:(massA,velocityA,massB,velocityB,restitution)=>compute('collision1D',{massA,velocityA,massB,velocityB,restitution}),resolveDiskCollision:(bodyA,bodyB,restitution)=>compute('collision2D',{bodyA,bodyB,restitution}),gradeQuiz:(payload)=>compute('gradeQuiz',payload),recordProgress:(progress,activity,day)=>compute('recordProgress',{progress,activity,day}),recommend:(context)=>compute('learningRecommend',context),orchestrateLearning:(payload)=>compute('learningOrchestrate',payload),scheduleReview:(quality,previousIntervalDays,easeFactor)=>compute('reviewSchedule',{quality,previousIntervalDays,easeFactor}),progression:(metrics)=>compute('progressionSummary',metrics),createGameChallenge:(seed)=>compute('gameChallenge',{seed}),gameTrajectory:(speed,angleDeg,gravity,samples)=>compute('gameTrajectory',{speed,angleDeg,gravity,samples}),clampGameTarget:(target,speed,gravity)=>compute('gameClampTarget',{target,speed,gravity})});
})(window);
