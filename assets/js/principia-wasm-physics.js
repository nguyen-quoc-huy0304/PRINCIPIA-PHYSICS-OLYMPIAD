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
    case 'projectileRange': return JSON.parse(wasm.physics_projectile_json(p.speed,p.angleDeg,p.gravity)).range;
    case 'projectileMaxHeight': return JSON.parse(wasm.physics_projectile_json(p.speed,p.angleDeg,p.gravity)).maxHeight;
    case 'linearRegression': return JSON.parse(wasm.physics_linear_regression_json(JSON.stringify(p.points)));
    case 'robotArmIK': return JSON.parse(wasm.physics_robot_arm_json(p.l1M,p.l2M,p.targetXM,p.targetYM,p.elbowBranch));
    case 'gradeQuiz': return JSON.parse(wasm.assessment_grade_json(JSON.stringify(p)));
    case 'recordProgress': return JSON.parse(wasm.progress_record_json(JSON.stringify(p.progress||{}),p.activity,p.day));
    case 'learningRecommend': return JSON.parse(wasm.learning_recommend_json(JSON.stringify(p)));
    case 'reviewSchedule': return JSON.parse(wasm.learning_review_schedule_json(p.quality,p.previousIntervalDays,p.easeFactor));
    case 'progressionSummary': return JSON.parse(wasm.progression_summary_json(JSON.stringify(p)));
    default: throw new TypeError('Unsupported Rust/WASM physics operation: '+operation);
  }
}
root.PrincipiaWasmPhysics=Object.freeze({compute,load:loadWasm,gradeQuiz:(payload)=>compute('gradeQuiz',payload),recordProgress:(progress,activity,day)=>compute('recordProgress',{progress,activity,day}),recommend:(context)=>compute('learningRecommend',context),scheduleReview:(quality,previousIntervalDays,easeFactor)=>compute('reviewSchedule',{quality,previousIntervalDays,easeFactor}),progression:(metrics)=>compute('progressionSummary',metrics)});
})(window);
