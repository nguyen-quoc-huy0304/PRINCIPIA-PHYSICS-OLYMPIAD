/* PRINCIPIA 3D Atmosphere — lightweight procedural depth backgrounds. */
(() => {
  'use strict';
  const KEY='principia_3d_atmosphere_v1';
  const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
  const fine=window.matchMedia?.('(pointer:fine)').matches??false;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const defaults={enabled:true,scene:'cosmos',intensity:0.72};
  let settings=readSettings(),canvas,ctx,raf=0,last=0,width=0,height=0,dpr=1,stars=[],pointer={x:0,y:0};
  const scenes=['cosmos','aurora','grid','nebula'];
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
    [['cosmos','Vũ trụ quỹ đạo'],['aurora','Cực quang 3D'],['grid','Lưới không gian'],['nebula','Tinh vân chiều sâu']].forEach(([value,text])=>{const o=document.createElement('option');o.value=value;o.textContent=text;select.append(o)});
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
  function draw(t=0,staticFrame=false){
    if(!ctx)return;ctx.clearRect(0,0,width,height);
    if(settings.enabled){if(settings.scene==='cosmos')drawCosmos(t);else if(settings.scene==='aurora')drawAurora(t);else if(settings.scene==='grid')drawGrid(t);else drawNebula(t)}
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
