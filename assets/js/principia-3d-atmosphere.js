/* PRINCIPIA 3D Atmosphere — lightweight procedural depth backgrounds. */
(() => {
  'use strict';
  const KEY='principia_3d_atmosphere_v1';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  const fine=window.matchMedia?.('(pointer:fine)').matches??false;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const defaults={enabled:true,scene:'cosmos',intensity:0.72};
  let settings=readSettings(),canvas,ctx,raf=0,last=0,width=0,height=0,dpr=1,stars=[],pointer={x:0,y:0};
  const scenes=['cosmos','aurora','grid','nebula','vortex','tunnel','particles','waves','planet','moon','crystal','stardust','horizon','galaxy','rings','fluid'];
  function readSettings(){
    try{const v=JSON.parse(localStorage.getItem(KEY)||'{}');return{enabled:v.enabled!==false,scene:scenes.includes(v.scene)?v.scene:'cosmos',intensity:clamp(Number(v.intensity)||0.72,0.15,1)}}
    catch(_){return{...defaults}}
  }
  function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){/* Storage may be unavailable. */}}
  function buildControls(){
    const panel=document.getElementById('proSiteEditorPanel');
    if(!panel||panel.querySelector('[data-pr-3d-settings]'))return;
    const section=document.createElement('section');section.className='pr-3d-settings';section.dataset.pr3dSettings='';
    const title=document.createElement('strong');title.textContent='Nền không gian 3D';section.append(title);
    const enabled=document.createElement('label');enabled.className='pr-3d-toggle';
    const check=document.createElement('input');check.type='checkbox';check.checked=settings.enabled;
    const label=document.createElement('span');label.textContent='Bật nền 3D động';
    check.addEventListener('change',()=>{settings.enabled=check.checked;persist();apply();});enabled.append(check,label);section.append(enabled);
    const selectLabel=document.createElement('label');selectLabel.textContent='Phong cách nền';
    const select=document.createElement('select');select.className='pr-3d-select';
    [['cosmos','Vũ trụ quỹ đạo'],['aurora','Cực quang 3D'],['grid','Lưới không gian'],['nebula','Tinh vân chiều sâu'],['vortex','Hố đen hấp dẫn'],['tunnel','Đường hầm warp'],['particles','Mạng hạt 3D'],['waves','Sóng không gian 3D'],['planet','Hành tinh 3D'],['moon','Nguyệt thực'],['crystal','Tinh thể phát sáng'],['stardust','Mưa sao'],['horizon','Chân trời neon'],['galaxy','Thiên hà xoắn ốc'],['rings','Vành đai hành tinh'],['fluid','Dòng năng lượng']].forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o)});
    select.value=settings.scene;select.addEventListener('change',()=>{settings.scene=select.value;persist();draw(performance.now(),true)});selectLabel.append(select);section.append(selectLabel);
    const intensityLabel=document.createElement('label');intensityLabel.textContent='Cường độ hiệu ứng';
    const range=document.createElement('input');range.type='range';range.min='0.15';range.max='1';range.step='0.05';range.value=String(settings.intensity);
    range.addEventListener('input',()=>{settings.intensity=clamp(Number(range.value),0.15,1);persist();});intensityLabel.append(range);section.append(intensityLabel);
    const note=document.createElement('small');note.textContent='Tự giảm mật độ trên điện thoại và tôn trọng chế độ giảm chuyển động của thiết bị.';section.append(note);
    const status=panel.querySelector('[data-status]');if(status)panel.insertBefore(section,status);else panel.append(section);
  }
  function seedStars(){
    const count=Math.round((width<700?42:105)*settings.intensity);
    stars=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,z:Math.random(),r:Math.random()*1.5+.25,phase:Math.random()*Math.PI*2}));
  }
  function resize(){
    if(!canvas)return;width=innerWidth;height=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);canvas.style.width=width+'px';canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);seedStars();draw(performance.now(),true);
  }
  function glow(x,y,r,color,alpha){
    const g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,color.replace('ALPHA',String(alpha)));g.addColorStop(1,color.replace('ALPHA','0'));
    ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);
  }
  function drawCosmos(t){
    const px=pointer.x*(fine?18:0),py=pointer.y*(fine?12:0);
    stars.forEach(s=>{
      const depth=.35+s.z*.9,x=(s.x-width/2)*depth+width/2+px*depth,y=(s.y-height/2)*depth+height/2+py*depth;
      const twinkle=.55+.45*Math.sin(t*.0008+s.phase);
      ctx.fillStyle='rgba(207,220,255,'+(twinkle*.72*settings.intensity)+')';ctx.beginPath();ctx.arc(x,y,s.r*depth,0,Math.PI*2);ctx.fill();
    });
    const cx=width*.72+px,cy=height*.35+py,orbit=Math.min(width,height)*.18;
    glow(cx,cy,orbit*1.8,'rgba(104,124,255,ALPHA)',.09*settings.intensity);
    [1,.72,.46].forEach((scale,i)=>{ctx.save();ctx.translate(cx,cy);ctx.rotate(-.35+i*.6);ctx.strokeStyle='rgba(142,169,255,'+(.18*settings.intensity)+')';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,0,orbit*scale,orbit*scale*.36,0,0,Math.PI*2);ctx.stroke();ctx.restore()});
    const a=t*.00016;ctx.fillStyle='rgba(173,206,255,.9)';ctx.beginPath();ctx.arc(cx+Math.cos(a)*orbit,cy+Math.sin(a)*orbit*.36,3,0,Math.PI*2);ctx.fill();
  }
  function drawAurora(t){
    for(let band=0;band<4;band++){
      const y=height*(.28+band*.105),phase=t*.00018+band*1.7;
      const gradient=ctx.createLinearGradient(0,y-130,0,y+180);
      gradient.addColorStop(0,'rgba(90,235,220,0)');gradient.addColorStop(.45,'rgba(93,220,204,'+(.075*settings.intensity)+')');gradient.addColorStop(1,'rgba(126,112,255,0)');
      ctx.fillStyle=gradient;ctx.beginPath();ctx.moveTo(0,height);
      for(let x=0;x<=width+12;x+=12){const wave=Math.sin(x*.004+phase)*55+Math.sin(x*.009-phase*1.4)*23;ctx.lineTo(x,y+wave)}
      ctx.lineTo(width,height);ctx.closePath();ctx.fill();
    }
    stars.forEach(s=>{ctx.fillStyle='rgba(210,239,255,'+(.5*s.z*settings.intensity)+')';ctx.fillRect(s.x,s.y,s.r,s.r)});
  }
  function drawGrid(t){
    const horizon=height*.43,shift=(t*.018)%46;
    ctx.strokeStyle='rgba(126,159,255,'+(.17*settings.intensity)+')';ctx.lineWidth=1;
    for(let i=-14;i<=14;i++){ctx.beginPath();ctx.moveTo(width/2+i*12,horizon);ctx.lineTo(width/2+i*width*.12,height);ctx.stroke()}
    for(let i=0;i<18;i++){const p=(i/18+shift/46/18)%1,y=horizon+(p*p)*(height-horizon);ctx.globalAlpha=(.12+p*.38)*settings.intensity;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
    ctx.globalAlpha=1;glow(width*.5,horizon,Math.min(width,height)*.28,'rgba(91,139,255,ALPHA)',.11*settings.intensity);
  }
  function drawNebula(t){
    const drift=t*.000025;
    glow(width*.22+Math.sin(drift)*width*.05,height*.35,Math.min(width,height)*.42,'rgba(108,89,255,ALPHA)',.18*settings.intensity);
    glow(width*.76+Math.cos(drift*.8)*width*.04,height*.62,Math.min(width,height)*.38,'rgba(52,181,220,ALPHA)',.13*settings.intensity);
    glow(width*.52,height*.18,Math.min(width,height)*.25,'rgba(215,112,190,ALPHA)',.07*settings.intensity);
    stars.forEach(s=>{const z=.5+s.z*.8;ctx.fillStyle='rgba(230,231,255,'+(.65*s.z*settings.intensity)+')';ctx.beginPath();ctx.arc(s.x+Math.sin(drift+s.phase)*12,s.y,s.r*z,0,Math.PI*2);ctx.fill()});
  }
  function drawVortex(t){
    const cx=width*.5,cy=height*.48,base=Math.min(width,height)*.19,spin=t*.00022;
    glow(cx,cy,base*2.6,'rgba(118,91,255,ALPHA)',.16*settings.intensity);
    for(let i=0;i<7;i++){
      ctx.save();ctx.translate(cx,cy);ctx.rotate(spin*(i%2?1:-1)+i*.42);ctx.scale(1,.28+i*.045);
      ctx.strokeStyle='rgba('+(i%2?'110,190,255':'190,135,255')+','+(.08+i*.025)*settings.intensity+')';
      ctx.lineWidth=1.2+i*.25;ctx.beginPath();ctx.ellipse(0,0,base*(.55+i*.18),base*(.55+i*.18),0,0,Math.PI*2);ctx.stroke();ctx.restore();
    }
    ctx.fillStyle='rgba(3,5,17,.9)';ctx.beginPath();ctx.arc(cx,cy,base*.31,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='rgba(175,183,255,.48)';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(cx,cy,base*.33,0,Math.PI*2);ctx.stroke();
  }
  function drawTunnel(t){
    const cx=width*.5,cy=height*.5,phase=(t*.00035)%1;
    for(let i=0;i<95;i++){
      const a=i*2.399963,depth=(i/95+phase)%1,r=depth* Math.max(width,height)*.72;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;
      ctx.strokeStyle='rgba(145,174,255,'+((1-depth)*.55*settings.intensity)+')';ctx.lineWidth=.5+depth*1.4;
      ctx.beginPath();ctx.moveTo(cx+Math.cos(a)*5,cy+Math.sin(a)*5);ctx.lineTo(x,y);ctx.stroke();
      ctx.fillStyle='rgba(205,224,255,'+((1-depth)*.8*settings.intensity)+')';ctx.fillRect(x,y,1+depth*2,1+depth*2);
    }
    glow(cx,cy,Math.min(width,height)*.2,'rgba(99,128,255,ALPHA)',.12*settings.intensity);
  }
  function drawParticles(t){
    const points=stars.map((s,i)=>({x:(s.x/Math.max(width,1)-.5)*2,y:(s.y/Math.max(height,1)-.5)*2,z:.2+s.z*1.8,phase:s.phase,i}));
    const projected=points.map(p=>{const depth=2.8/(p.z+1.2);return{x:width*.5+p.x*width*.32*depth+pointer.x*12,y:height*.5+p.y*height*.3*depth+Math.sin(t*.0003+p.phase)*8,z:depth}});
    projected.forEach((p,i)=>{for(let j=i+1;j<projected.length;j++){const q=projected[j],dx=p.x-q.x,dy=p.y-q.y,d=dx*dx+dy*dy;if(d<Math.pow(Math.min(width,height)*.105,2)){ctx.strokeStyle='rgba(130,165,255,'+((1-d/Math.pow(Math.min(width,height)*.105,2))*.13*settings.intensity)+')';ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke()}}ctx.fillStyle='rgba(190,215,255,'+(.65*p.z*settings.intensity)+')';ctx.beginPath();ctx.arc(p.x,p.y,1.1+p.z*1.2,0,Math.PI*2);ctx.fill()});
  }
  function drawWaves(t){
    const cols=Math.min(44,Math.max(20,Math.floor(width/28))),rows=18;
    for(let row=0;row<rows;row++){
      const z=row/(rows-1),y0=height*(.32+z*.78);
      ctx.beginPath();
      for(let col=0;col<=cols;col++){
        const x=col/cols*width,depth=.35+z*.85;
        const wave=Math.sin(col*.34+t*.0008+row*.24)*18+Math.cos(col*.13-t*.00045)*11;
        const y=y0+wave*depth;
        if(col===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
      }
      ctx.strokeStyle='rgba(119,160,255,'+((.06+z*.16)*settings.intensity)+')';ctx.lineWidth=.7+z*.5;ctx.stroke();
    }
    for(let col=0;col<=cols;col+=2){
      ctx.beginPath();
      for(let row=0;row<rows;row++){const z=row/(rows-1),x=col/cols*width,y=height*(.32+z*.78)+(Math.sin(col*.34+t*.0008+row*.24)*18+Math.cos(col*.13-t*.00045)*11)*(.35+z*.85);if(!row)ctx.moveTo(x,y);else ctx.lineTo(x,y)}
      ctx.strokeStyle='rgba(104,205,226,'+(.08*settings.intensity)+')';ctx.lineWidth=.6;ctx.stroke();
    }
  }
  function drawPlanet(t){
    const cx=width*.72,cy=height*.46,r=Math.min(width,height)*.19;
    glow(cx,cy,r*2.3,'rgba(75,135,255,ALPHA)',.17*settings.intensity);
    const g=ctx.createRadialGradient(cx-r*.35,cy-r*.38,r*.08,cx,cy,r);
    g.addColorStop(0,'rgba(105,198,229,.96)');g.addColorStop(.55,'rgba(49,99,183,.96)');g.addColorStop(1,'rgba(9,17,56,.98)');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    for(let i=0;i<8;i++){const y=cy-r+i*r*.29+Math.sin(t*.0002+i)*8;ctx.strokeStyle='rgba(125,218,224,.12)';ctx.lineWidth=7+i%3*4;ctx.beginPath();ctx.moveTo(cx-r,y);ctx.bezierCurveTo(cx-r*.2,y-18,cx+r*.15,y+24,cx+r,y-8);ctx.stroke()}
    ctx.restore();ctx.strokeStyle='rgba(158,199,255,.3)';ctx.lineWidth=1;ctx.beginPath();ctx.arc(cx,cy,r+2,0,Math.PI*2);ctx.stroke();
    ctx.save();ctx.translate(cx,cy);ctx.rotate(-.28+t*.00004);ctx.strokeStyle='rgba(177,196,255,.55)';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,r*1.7,r*.43,0,0,Math.PI*2);ctx.stroke();ctx.restore();
    stars.forEach(s=>{ctx.fillStyle='rgba(222,232,255,'+(.6*s.z*settings.intensity)+')';ctx.fillRect(s.x,s.y,s.r,s.r)});
  }
  function drawMoon(t){
    const cx=width*.53,cy=height*.48,r=Math.min(width,height)*.2;
    glow(cx,cy,r*2.1,'rgba(139,157,255,ALPHA)',.13*settings.intensity);
    const g=ctx.createRadialGradient(cx-r*.45,cy-r*.38,r*.05,cx,cy,r);
    g.addColorStop(0,'#e5e9f6');g.addColorStop(.7,'#8b91aa');g.addColorStop(1,'#24283e');
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fill();
    ctx.save();ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.clip();
    for(let i=0;i<18;i++){const x=cx+Math.sin(i*17.3)*r*.78,y=cy+Math.cos(i*9.1)*r*.78,cr=2+(i%5)*2;ctx.fillStyle='rgba(34,40,64,.13)';ctx.beginPath();ctx.arc(x,y,cr,0,Math.PI*2);ctx.fill();ctx.strokeStyle='rgba(255,255,255,.09)';ctx.stroke()}
    ctx.restore();
    const phase=(Math.sin(t*.00012)+1)/2;ctx.fillStyle='rgba(5,8,22,'+(.72*(1-phase)) +')';ctx.beginPath();ctx.arc(cx+r*(phase-.5)*1.4,cy,r*1.02,0,Math.PI*2);ctx.fill();
    stars.forEach(s=>{ctx.fillStyle='rgba(226,232,255,'+(.5*s.z*settings.intensity)+')';ctx.fillRect(s.x,s.y,s.r,s.r)});
  }
  function drawCrystal(t){
    const cx=width*.5,cy=height*.48,scale=Math.min(width,height)*.2;
    glow(cx,cy,scale*2,'rgba(101,139,255,ALPHA)',.13*settings.intensity);
    for(let i=0;i<9;i++){
      const x=cx+(i-4)*scale*.2,top=cy-scale*(.65+(i%3)*.18),bottom=cy+scale*(.55+(i%2)*.1),w=scale*(.08+(i%3)*.025);
      ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x+w,bottom);ctx.lineTo(x-w,bottom);ctx.closePath();
      const g=ctx.createLinearGradient(x-w,top,x+w,bottom);g.addColorStop(0,'rgba(91,193,255,.05)');g.addColorStop(.5,'rgba(179,158,255,'+(.3*settings.intensity)+')');g.addColorStop(1,'rgba(99,225,232,.08)');
      ctx.fillStyle=g;ctx.fill();ctx.strokeStyle='rgba(194,205,255,.35)';ctx.stroke();
    }
    ctx.strokeStyle='rgba(137,180,255,.22)';ctx.beginPath();ctx.ellipse(cx,cy+scale*.58,scale*.65,scale*.16,0,0,Math.PI*2);ctx.stroke();
  }
  function drawStardust(t){
    stars.forEach((s,i)=>{const speed=22+s.z*80,y=(s.y+t*.001*speed)%(height+20),x=s.x+Math.sin(t*.0003+s.phase)*18;
      ctx.strokeStyle='rgba(190,213,255,'+(.18+s.z*.52)*settings.intensity+')';ctx.lineWidth=.5+s.z;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-2,y-5-s.z*12);ctx.stroke();
    });
  }
  function drawHorizon(t){
    const horizon=height*.58;
    const g=ctx.createLinearGradient(0,horizon-80,0,height);g.addColorStop(0,'rgba(103,73,190,0)');g.addColorStop(.35,'rgba(99,108,255,'+(.13*settings.intensity)+')');g.addColorStop(1,'rgba(8,15,42,.2)');
    ctx.fillStyle=g;ctx.fillRect(0,horizon-100,width,height-horizon+100);
    ctx.strokeStyle='rgba(155,135,255,'+(.3*settings.intensity)+')';ctx.lineWidth=1.3;ctx.beginPath();
    for(let x=0;x<=width;x+=8){const y=horizon+Math.sin(x*.006+t*.0005)*13+Math.sin(x*.013-t*.0003)*7;if(x===0)ctx.moveTo(x,y);else ctx.lineTo(x,y)}ctx.stroke();
    for(let i=0;i<16;i++){const p=(i/16+(t*.00008)%1)%1,y=horizon+p*p*(height-horizon);ctx.strokeStyle='rgba(111,155,255,'+((1-p)*.18*settings.intensity)+')';ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(width,y);ctx.stroke()}
  }
  function drawGalaxy(t){
    const cx=width*.5,cy=height*.48,arms=4,spin=t*.00012;
    glow(cx,cy,Math.min(width,height)*.34,'rgba(127,101,255,ALPHA)',.17*settings.intensity);
    for(let i=0;i<420;i++){const arm=i%arms,progress=i/420,angle=progress*15+arm*Math.PI*2/arms+spin,r=progress*Math.min(width,height)*.38;
      const seed=Math.sin(i*127.1+arm*311.7)*43758.5453,spread=((seed-Math.floor(seed))-.5)*Math.max(2,r*.08),x=cx+Math.cos(angle)*r+Math.cos(angle+Math.PI/2)*spread,y=cy+Math.sin(angle)*r+Math.sin(angle+Math.PI/2)*spread;
      ctx.fillStyle='rgba('+(i%3?'171,183,255':'255,204,235')+','+((1-progress)*.6*settings.intensity)+')';ctx.fillRect(x,y,.8+progress*1.2,.8+progress*1.2);
    }
  }
  function drawRings(t){
    const cx=width*.58,cy=height*.5,r=Math.min(width,height)*.2;
    glow(cx,cy,r*2.2,'rgba(95,139,255,ALPHA)',.12*settings.intensity);
    ctx.fillStyle='rgba(52,81,153,.88)';ctx.beginPath();ctx.arc(cx,cy,r*.52,0,Math.PI*2);ctx.fill();
    const bands=12;
    for(let i=0;i<bands;i++){ctx.save();ctx.translate(cx,cy);ctx.rotate(-.3);ctx.scale(1,.28);
      ctx.strokeStyle='rgba('+(i%2?'147,178,255':'208,190,255')+','+(.12+i*.018)*settings.intensity+')';ctx.lineWidth=2+i%3;
      ctx.beginPath();ctx.arc(0,0,r*(.72+i*.075),0,Math.PI*2);ctx.stroke();ctx.restore()}
    ctx.save();ctx.translate(cx,cy);ctx.scale(1,.28);ctx.fillStyle='rgba(4,8,23,.92)';ctx.beginPath();ctx.arc(0,0,r*.5,0,Math.PI*2);ctx.fill();ctx.restore();
  }
  function drawFluid(t){
    const bands=22;
    for(let i=0;i<bands;i++){const y=height*(i/(bands-1)),phase=t*.00035+i*.24;ctx.beginPath();
      for(let x=0;x<=width;x+=8){const yy=y+Math.sin(x*.004+phase)*18+Math.cos(x*.009-phase*1.3)*9;if(x===0)ctx.moveTo(x,yy);else ctx.lineTo(x,yy)}
      ctx.strokeStyle='rgba('+(i%2?'91,178,229':'160,132,255')+','+(.07+i/bands*.12)*settings.intensity+')';ctx.lineWidth=.8+i/bands;ctx.stroke();
    }
    glow(width*.32,height*.42,Math.min(width,height)*.3,'rgba(86,169,235,ALPHA)',.08*settings.intensity);
  }
  function draw(t=0,staticFrame=false){
    if(!ctx)return;ctx.clearRect(0,0,width,height);
    if(settings.enabled){if(settings.scene==='cosmos')drawCosmos(t);else if(settings.scene==='aurora')drawAurora(t);else if(settings.scene==='grid')drawGrid(t);else if(settings.scene==='vortex')drawVortex(t);else if(settings.scene==='tunnel')drawTunnel(t);else if(settings.scene==='particles')drawParticles(t);else if(settings.scene==='waves')drawWaves(t);else if(settings.scene==='planet')drawPlanet(t);else if(settings.scene==='moon')drawMoon(t);else if(settings.scene==='crystal')drawCrystal(t);else if(settings.scene==='stardust')drawStardust(t);else if(settings.scene==='horizon')drawHorizon(t);else if(settings.scene==='galaxy')drawGalaxy(t);else if(settings.scene==='rings')drawRings(t);else if(settings.scene==='fluid')drawFluid(t);else drawNebula(t)}
    if(!staticFrame&&settings.enabled&&!reduced&&!document.hidden)raf=requestAnimationFrame(draw);
  }
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0}
  function apply(){
    document.documentElement.classList.toggle('pr-3d-background-on',settings.enabled);
    document.documentElement.dataset.pr3dScene=settings.scene;
    stop();if(settings.enabled&&!reduced&&!document.hidden)raf=requestAnimationFrame(draw);else draw(performance.now(),true);
  }
  function init(){
    canvas=document.createElement('canvas');canvas.id='principia3DAtmosphere';canvas.setAttribute('aria-hidden','true');
    const app=document.getElementById('app');(app||document.body).prepend(canvas);ctx=canvas.getContext('2d',{alpha:true,desynchronized:true});
    if(!ctx){canvas.remove();return}
    resize();addEventListener('resize',resize,{passive:true});
    if(fine)addEventListener('pointermove',e=>{pointer.x=(e.clientX/Math.max(1,width)-.5)*2;pointer.y=(e.clientY/Math.max(1,height)-.5)*2},{passive:true});
    document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();else apply()});
    const observer=new MutationObserver(buildControls);observer.observe(document.body,{childList:true,subtree:true});
    buildControls();apply();
    window.Principia3D=Object.freeze({setEnabled(value){settings.enabled=Boolean(value);persist();buildControls();apply()},setScene(value){if(!scenes.includes(value))return false;settings.scene=value;persist();buildControls();draw(performance.now(),true);return true},getSettings:()=>Object.freeze({...settings})});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
