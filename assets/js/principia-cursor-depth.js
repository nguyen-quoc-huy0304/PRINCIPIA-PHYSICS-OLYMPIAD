/* PRINCIPIA Cursor Depth — layered parallax, magnetic particles and energy ripples. */
(()=>{'use strict';
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,fine=matchMedia('(pointer:fine)').matches;
if(reduce||!fine)return;
const host=document.getElementById('app')||document.body,canvas=document.createElement('canvas');
canvas.id='principiaCursorDepth';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);
const ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});if(!ctx){canvas.remove();return}
let w=0,h=0,dpr=1,raf=0,last=0,px=-999,py=-999,mx=-999,my=-999,speed=0,prevX=0,prevY=0,particles=[],waves=[];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function resize(){w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,w<720?.65:.9);canvas.width=w*dpr;canvas.height=h*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
particles=Array.from({length:Math.min(125,Math.max(45,Math.round(w*h/10500)))},()=>{const layer=Math.floor(Math.random()*3);return{x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*(.16+layer*.06),vy:(Math.random()-.5)*(.16+layer*.06),r:.5+Math.random()*1.3,layer,phase:Math.random()*6.28}})}
function draw(t){raf=0;if(document.hidden)return;if(t-last<32){raf=requestAnimationFrame(draw);return}const dt=Math.min(50,t-last||16);last=t;ctx.clearRect(0,0,w,h);mx+=(px-mx)*.13;my+=(py-my)*.13;speed*=.88;
for(let layer=0;layer<3;layer++){const list=particles.filter(a=>a.layer===layer),depth=(layer+1)*.5;
for(const a of list){a.x+=a.vx*dt*.04;a.y+=a.vy*dt*.04;if(a.x<0||a.x>w)a.vx*=-1;if(a.y<0||a.y>h)a.vy*=-1;
const dx=a.x-mx,dy=a.y-my,dist=Math.hypot(dx,dy);if(dist<175){const force=(175-dist)/175*.012*depth;a.x+=dx*force;a.y+=dy*force}
a.x+=(mx>-500?Math.sin(t*.0005+a.phase)*.1*depth:0);ctx.beginPath();ctx.arc(a.x,a.y,a.r*depth,0,Math.PI*2);ctx.fillStyle='rgba(160,178,255,'+(.22+depth*.13)+')';ctx.fill();
}
for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j],dist=Math.hypot(a.x-b.x,a.y-b.y);if(dist<(layer===2?105:85)){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle='rgba(130,150,255,'+((1-dist/105)*.08*depth)+')';ctx.lineWidth=.5;ctx.stroke()}}
}
if(mx>-500){const radius=110+speed*.5,glow=ctx.createRadialGradient(mx,my,0,mx,my,radius);glow.addColorStop(0,'rgba(125,145,255,.13)');glow.addColorStop(.5,'rgba(125,145,255,.045)');glow.addColorStop(1,'rgba(125,145,255,0)');ctx.fillStyle=glow;ctx.fillRect(mx-radius,my-radius,radius*2,radius*2)}
waves=waves.filter(a=>a.age<850);for(const a of waves){a.age+=dt;const k=a.age/850;ctx.beginPath();ctx.arc(a.x,a.y,a.age*.23,0,Math.PI*2);ctx.strokeStyle='rgba(145,170,255,'+((1-k)*.24)+')';ctx.lineWidth=1.2*(1-k);ctx.stroke();ctx.beginPath();ctx.arc(a.x,a.y,a.age*.15,0,Math.PI*2);ctx.strokeStyle='rgba(110,145,255,'+((1-k)*.1)+')';ctx.stroke()}
if(speed>2&&mx>-500){ctx.beginPath();ctx.moveTo(mx,my);ctx.lineTo(mx-(px-mx)*.65,my-(py-my)*.65);ctx.strokeStyle='rgba(135,155,255,'+clamp(speed/80,.02,.14)+')';ctx.lineWidth=clamp(speed/30,.5,2);ctx.stroke()}
raf=requestAnimationFrame(draw)}
addEventListener('pointermove',e=>{px=e.clientX;py=e.clientY;speed=Math.min(60,Math.hypot(px-prevX,py-prevY));prevX=px;prevY=py},{passive:true});
addEventListener('pointerdown',e=>{waves.push({x:e.clientX,y:e.clientY,age:0});if(waves.length>7)waves.shift()},{passive:true});
addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0}else if(!raf)raf=requestAnimationFrame(draw)});
resize();raf=requestAnimationFrame(draw);
})();