/* PRINCIPIA Dimensional World — raw WebGL cinematic 3D scene, no framework dependency. */
(() => {
 'use strict';
 const KEY='principia_dimensional_world_v1';
 const REDUCED=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
 const defaults={enabled:true,scene:'planet',intensity:.82};
 const scenes=['planet','nebula','wireframe','aurora'];
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 let settings=readSettings(),canvas,gl,program,raf=0,last=0,uniforms={},buffer;
 let pointer={x:0,y:0},dpr=1,failed=false;
 function readSettings(){try{const s=JSON.parse(localStorage.getItem(KEY)||'{}');return{enabled:s.enabled!==false,scene:scenes.includes(s.scene)?s.scene:'planet',intensity:clamp(Number(s.intensity)||.82,.2,1)}}catch(_){return{...defaults}}}
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){/* Storage is optional. */}}
 const vertex=`attribute vec2 aPosition; varying vec2 vUv; void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
 const fragment=`precision highp float;
 varying vec2 vUv;
 uniform vec2 uResolution;
 uniform vec2 uPointer;
 uniform float uTime;
 uniform float uIntensity;
 uniform float uScene;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
 mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}
 vec2 mapScene(vec3 p){
  p.xz=rot(.28+uTime*.035)*p.xz;p.xy=rot(-.38+uPointer.x*.12)*p.xy;
  float sphere=length(p)-.72;
  float ring=length(vec2(length(p.xy)-1.13,p.z))-.018;
  float torus=length(vec2(length(p.xz)-.94,p.y))-.012;
  return vec2(min(sphere,min(ring,torus)),sphere<min(ring,torus)?1.:ring<torus?2.:3.);
 }
 vec3 normalAt(vec3 p){vec2 e=vec2(.002,0.);return normalize(vec3(mapScene(p+e.xyy).x-mapScene(p-e.xyy).x,mapScene(p+e.yxy).x-mapScene(p-e.yxy).x,mapScene(p+e.yyx).x-mapScene(p-e.yyx).x));}
 vec3 background(vec2 uv){
  vec3 col=vec3(.018,.03,.075);
  float n=noise(uv*vec2(5.,3.)+uTime*.018);
  col+=vec3(.025,.045,.12)*n;
  float neb=pow(max(0.,1.-length((uv-vec2(.24,.7))*vec2(1.1,.8))),3.);
  col+=vec3(.12,.08,.35)*neb*.32;
  float neb2=pow(max(0.,1.-length((uv-vec2(.83,.3))*vec2(1.4,.9))),3.);
  col+=vec3(.025,.19,.25)*neb2*.28;
  vec2 grid=uv*vec2(145.,90.);vec2 cell=fract(grid)-.5;
  float star=step(.997,hash(floor(grid)));
  float sparkle=star*(1.-smoothstep(.02,.48,length(cell)));
  col+=vec3(.6,.76,1.)*sparkle*(.35+.65*sin(uTime*1.5+hash(floor(grid))*6.));
  return col;
 }
 void main(){
  vec2 uv=(gl_FragCoord.xy-.5*uResolution)/uResolution.y;
  vec2 screen=vUv;
  vec3 col=background(screen);
  float vignette=(1.-smoothstep(.18,1.25,length(uv)));
  if(uScene<.5||uScene>1.5){
   vec3 ro=vec3(uPointer.x*.16,uPointer.y*.12,3.5);
   vec3 rd=normalize(vec3(uv,-1.75));
   float t=0.,material=0.;
   for(int i=0;i<46;i++){vec3 p=ro+rd*t;vec2 h=mapScene(p);if(h.x<.002){material=h.y;break;}t+=h.x*.78;if(t>7.)break;}
   if(t<7.){
    vec3 p=ro+rd*t,n=normalAt(p),light=normalize(vec3(-.7,.8,1.2));
    float diff=max(dot(n,light),0.);
    float fres=pow(1.-max(dot(n,-rd),0.),3.);
    float spec=pow(max(dot(reflect(-light,n),-rd),0.),36.);
    vec3 base=material<1.5?vec3(.18,.29,.68):material<2.5?vec3(.34,.78,.94):vec3(.65,.43,.98);
    float bands=sin(atan(p.y,p.x)*26.+p.z*12.)*.5+.5;
    if(uScene>1.5&&uScene<2.5)base*=.35+.65*step(.78,bands);
    col=mix(base*.26,base*(.38+diff*.8),.7)+vec3(.35,.48,1.)*fres*.75+vec3(.55,.8,1.)*spec*.75;
    col+=vec3(.09,.18,.42)*pow(max(0.,1.-length(p.xy)*.55),3.);
   }else{
    float glow=exp(-abs(length(uv)-.78)*8.);
    col+=vec3(.14,.2,.52)*glow*.25;
   }
   if(uScene>2.5){
    float wave=sin(screen.x*18.+uTime*.55+sin(screen.x*8.)*2.);
    float aur=(1.-smoothstep(0.,.22,abs(screen.y-(.55+wave*.08))));
    col+=vec3(.08,.8,.62)*aur*.25;
   }
  }else if(uScene<1.5){
   float rings=sin(length(uv-vec2(.12,.12))*45.-uTime*.6);
   col+=vec3(.12,.22,.6)*(1.-smoothstep(.2,.96,abs(rings)))*.12;
  }else{
   float wire=abs(sin(uv.x*42.+sin(uv.y*12.+uTime*.15)*2.));
   col+=vec3(.12,.2,.42)*smoothstep(.94,.99,wire)*.3;
  }
  col*=vignette;
  float topFade=smoothstep(0.,.16,screen.y);
  col*=.65+.35*topFade;
  gl_FragColor=vec4(col*uIntensity,1.);
 }`;
 function compile(type,source){
  const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
  if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS)){const error=gl.getShaderInfoLog(shader);gl.deleteShader(shader);throw new Error(error||'WebGL shader compilation failed')}
  return shader;
 }
 function initGL(){
  gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'low-power',depth:false,stencil:false});
  if(!gl)return false;
  const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);
  program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program)||'WebGL program link failed');
  gl.useProgram(program);buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  uniforms={resolution:gl.getUniformLocation(program,'uResolution'),pointer:gl.getUniformLocation(program,'uPointer'),time:gl.getUniformLocation(program,'uTime'),intensity:gl.getUniformLocation(program,'uIntensity'),scene:gl.getUniformLocation(program,'uScene')};
  return true;
 }
 function resize(){
  if(!canvas||!gl)return;
  const mobile=matchMedia('(max-width:760px)').matches;
  dpr=Math.min(devicePixelRatio||1,mobile?.72:1.15);
  const w=Math.max(1,Math.floor(innerWidth*dpr)),h=Math.max(1,Math.floor(innerHeight*dpr));
  if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);gl.uniform2f(uniforms.resolution,w,h)}
 }
 function render(now){
  raf=0;if(!settings.enabled||document.hidden||!gl)return;
  if(now-last<38){raf=requestAnimationFrame(render);return}
  last=now;resize();
  gl.useProgram(program);gl.uniform1f(uniforms.time,now*.001);gl.uniform2f(uniforms.pointer,pointer.x,pointer.y);
  gl.uniform1f(uniforms.intensity,settings.intensity);
  gl.uniform1f(uniforms.scene,scenes.indexOf(settings.scene));
  gl.drawArrays(gl.TRIANGLES,0,6);
  raf=requestAnimationFrame(render);
 }
 function apply(){
  document.documentElement.classList.toggle('pr-dimensional-world-on',settings.enabled&&!failed);
  document.documentElement.dataset.prWorldScene=settings.scene;
  if(!gl)return;
  if(settings.enabled&&!REDUCED&&!document.hidden){if(!raf)raf=requestAnimationFrame(render)}
  else{if(raf)cancelAnimationFrame(raf);raf=0;gl.uniform1f(uniforms.time,performance.now()*.001);gl.uniform1f(uniforms.intensity,settings.intensity);gl.uniform1f(uniforms.scene,scenes.indexOf(settings.scene));gl.drawArrays(gl.TRIANGLES,0,6)}
 }
 function mountSettings(){
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.querySelector('[data-pr-world-settings]'))return;
  const section=document.createElement('section');section.className='pr-world-settings';section.dataset.prWorldSettings='';
  const heading=document.createElement('strong');heading.textContent='Không gian 3D thời gian thực';section.append(heading);
  const toggleLabel=document.createElement('label'),toggle=document.createElement('input'),toggleText=document.createElement('span');
  toggle.type='checkbox';toggle.checked=settings.enabled;toggleText.textContent='Bật nền 3D WebGL';toggleLabel.append(toggle,toggleText);
  toggle.addEventListener('change',()=>{settings.enabled=toggle.checked;persist();apply()});section.append(toggleLabel);
  const sceneLabel=document.createElement('label');sceneLabel.textContent='Cảnh 3D';
  const select=document.createElement('select');
  [['planet','Hành tinh & quỹ đạo'],['nebula','Tinh vân không gian'],['wireframe','Lưới khối 3D'],['aurora','Cực quang tương tác']].forEach(([v,t])=>{const o=document.createElement('option');o.value=v;o.textContent=t;select.append(o)});
  select.value=settings.scene;select.addEventListener('change',()=>{settings.scene=select.value;persist();apply()});sceneLabel.append(select);section.append(sceneLabel);
  const strengthLabel=document.createElement('label');strengthLabel.textContent='Cường độ chiều sâu';
  const range=document.createElement('input');range.type='range';range.min='.2';range.max='1';range.step='.05';range.value=String(settings.intensity);
  range.addEventListener('input',()=>{settings.intensity=Number(range.value);persist();apply()});strengthLabel.append(range);section.append(strengthLabel);
  const note=document.createElement('small');note.textContent='WebGL tự giảm độ phân giải trên điện thoại và dừng khi chuyển tab.';section.append(note);
  const status=panel.querySelector('[data-status]');if(status)panel.insertBefore(section,status);else panel.append(section);
 }
 function init(){
  canvas=document.createElement('canvas');canvas.id='principiaDimensionalWorld';canvas.setAttribute('aria-hidden','true');
  Object.assign(canvas.style,{position:'fixed',inset:'0',width:'100%',height:'100%',zIndex:'0',pointerEvents:'none',opacity:'0',transition:'opacity .9s ease'});
  document.body.prepend(canvas);
  try{if(!initGL())throw new Error('WebGL unavailable')}catch(error){failed=true;canvas.remove();console.warn('[PRINCIPIA] 3D WebGL fallback:',error.message);return}
  resize();addEventListener('resize',resize,{passive:true});
  if(matchMedia('(pointer:fine)').matches)addEventListener('pointermove',event=>{pointer.x=clamp((event.clientX/innerWidth-.5)*2,-1,1);pointer.y=clamp((.5-event.clientY/innerHeight)*2,-1,1)},{passive:true});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0}else apply()});
  const observer=new MutationObserver(mountSettings);observer.observe(document.body,{childList:true,subtree:true});
  mountSettings();apply();canvas.style.opacity=settings.enabled&&!REDUCED?'.92':'.5';
  window.PrincipiaWorld3D=Object.freeze({setEnabled(value){settings.enabled=Boolean(value);persist();apply();canvas.style.opacity=settings.enabled&&!REDUCED?'.92':'.5'},setScene(value){if(!scenes.includes(value))return false;settings.scene=value;persist();mountSettings();apply();return true},getSettings:()=>({...settings})});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
