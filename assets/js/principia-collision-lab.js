(function () {
  'use strict';

  function collide1D(m1, u1, m2, u2, restitution) {
    const values = [m1, u1, m2, u2, restitution];
    if (!values.every(Number.isFinite)) throw new TypeError('All inputs must be finite numbers.');
    if (m1 <= 0 || m2 <= 0) throw new RangeError('Masses must be greater than zero.');
    if (restitution < 0 || restitution > 1) throw new RangeError('Coefficient of restitution must be between 0 and 1.');

    const totalMass = m1 + m2;
    const momentumBefore = m1 * u1 + m2 * u2;
    const relativeApproach = u1 - u2;
    const v1 = (m1 * u1 + m2 * u2 - m2 * restitution * relativeApproach) / totalMass;
    const v2 = (m1 * u1 + m2 * u2 + m1 * restitution * relativeApproach) / totalMass;
    const momentumAfter = m1 * v1 + m2 * v2;
    const kineticBefore = 0.5 * m1 * u1 * u1 + 0.5 * m2 * u2 * u2;
    const kineticAfter = 0.5 * m1 * v1 * v1 + 0.5 * m2 * v2 * v2;

    return {
      v1, v2, momentumBefore, momentumAfter, momentumError: momentumAfter - momentumBefore,
      kineticBefore, kineticAfter, kineticChange: kineticAfter - kineticBefore,
      energyLoss: Math.max(0, kineticBefore - kineticAfter),
      restitution, totalMass
    };
  }

  function resolveDiskCollision(a, b, restitution) {
    if (!a || !b || ![a.x,a.y,a.vx,a.vy,a.mass,a.radius,b.x,b.y,b.vx,b.vy,b.mass,b.radius,restitution].every(Number.isFinite)) {
      throw new TypeError('Bodies and restitution must contain finite numbers.');
    }
    if (a.mass <= 0 || b.mass <= 0 || a.radius <= 0 || b.radius <= 0) throw new RangeError('Masses and radii must be positive.');
    if (restitution < 0 || restitution > 1) throw new RangeError('Restitution must be between 0 and 1.');
    let dx = b.x - a.x, dy = b.y - a.y;
    let distance = Math.hypot(dx, dy);
    const minDistance = a.radius + b.radius;
    if (distance >= minDistance) return { collided: false, impulse: 0 };
    if (distance < 1e-12) { dx = 1; dy = 0; distance = 1; }
    const nx = dx / distance, ny = dy / distance;
    const invA = 1 / a.mass, invB = 1 / b.mass;
    const relativeNormal = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
    const penetration = minDistance - distance;
    const correction = Math.max(penetration - 0.01, 0) * 0.8 / (invA + invB);
    a.x -= nx * correction * invA; a.y -= ny * correction * invA;
    b.x += nx * correction * invB; b.y += ny * correction * invB;
    if (relativeNormal >= 0) return { collided: true, impulse: 0 };
    const impulse = -(1 + restitution) * relativeNormal / (invA + invB);
    a.vx -= impulse * invA * nx; a.vy -= impulse * invA * ny;
    b.vx += impulse * invB * nx; b.vy += impulse * invB * ny;
    return { collided: true, impulse };
  }

  function momentumAndEnergy2D(bodies) {
    return bodies.reduce((sum, body) => {
      if (!body || ![body.mass, body.vx, body.vy].every(Number.isFinite) || body.mass <= 0) throw new TypeError('Invalid body state.');
      sum.px += body.mass * body.vx;
      sum.py += body.mass * body.vy;
      sum.kinetic += 0.5 * body.mass * (body.vx * body.vx + body.vy * body.vy);
      return sum;
    }, { px: 0, py: 0, kinetic: 0 });
  }

  const api = { collide1D, resolveDiskCollision, momentumAndEnergy2D };
  if (typeof window !== 'undefined') window.PrincipiaCollisionMath = api;
  if (typeof document === 'undefined') return;

  function init() {
    const root = document.getElementById('principia-collision-lab');
    if (!root || root.dataset.ready === '1') return;
    root.dataset.ready = '1';
    const ids = ['m1', 'u1', 'm2', 'u2', 'e'];
    const el = (id) => root.querySelector('[data-collision="' + id + '"]');
    const fmt = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 4 });
    const read = () => ids.map((id) => Number(el(id).value));
    function update() {
      try {
        const [m1, u1, m2, u2, e] = read();
        const r = collide1D(m1, u1, m2, u2, e);
        el('v1').textContent = fmt(r.v1) + ' m/s';
        el('v2').textContent = fmt(r.v2) + ' m/s';
        el('p-before').textContent = fmt(r.momentumBefore) + ' kg·m/s';
        el('p-after').textContent = fmt(r.momentumAfter) + ' kg·m/s';
        el('k-before').textContent = fmt(r.kineticBefore) + ' J';
        el('k-after').textContent = fmt(r.kineticAfter) + ' J';
        el('loss').textContent = fmt(r.energyLoss) + ' J';
        el('error').textContent = fmt(r.momentumError) + ' kg·m/s';
        el('status').textContent = e === 1 ? 'Va chạm đàn hồi lý tưởng: động năng được bảo toàn.' :
          e === 0 ? 'Va chạm mềm hoàn toàn: hai vật có cùng vận tốc sau va chạm.' :
          'Va chạm không đàn hồi một phần: động lượng bảo toàn, một phần động năng chuyển hóa.';
        const maxV = Math.max(1, Math.abs(u1), Math.abs(u2), Math.abs(r.v1), Math.abs(r.v2));
        el('before-a').style.left = (8 + 42 * (u1 / maxV + 1) / 2) + '%';
        el('before-b').style.left = (8 + 42 * (u2 / maxV + 1) / 2) + '%';
        el('after-a').style.left = (8 + 42 * (r.v1 / maxV + 1) / 2) + '%';
        el('after-b').style.left = (8 + 42 * (r.v2 / maxV + 1) / 2) + '%';
        el('error-note').textContent = Math.abs(r.momentumError) < 1e-10 ? 'Sai lệch số học gần 0 (sai số dấu phẩy động).' : 'Có sai lệch cần kiểm tra.';
      } catch (error) {
        el('status').textContent = error.message;
      }
    }
    ids.forEach((id) => el(id).addEventListener('input', update));
    el('reset').addEventListener('click', () => {
      const defaults = { m1: 1, u1: 3, m2: 2, u2: -1, e: 1 };
      ids.forEach((id) => { el(id).value = defaults[id]; });
      update();
    });
    update();
    init2D(root);
  }

  function init2D(root) {
    const canvas = root.querySelector('[data-collision2d="canvas"]');
    if (!canvas || canvas.dataset.ready === '1') return;
    canvas.dataset.ready = '1';
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const fmt2D = (n) => Number(n).toLocaleString('vi-VN', { maximumFractionDigits: 3 });
    const status = root.querySelector('[data-collision2d="status"]');
    const energy = root.querySelector('[data-collision2d="energy"]');
    const momentum = root.querySelector('[data-collision2d="momentum"]');
    const start = root.querySelector('[data-collision2d="start"]');
    const reset = root.querySelector('[data-collision2d="reset"]');
    const add = root.querySelector('[data-collision2d="add"]');
    const remove = root.querySelector('[data-collision2d="remove"]');
    const presetSelect = root.querySelector('[data-collision2d="preset"]');
    const applyPresetButton = root.querySelector('[data-collision2d="apply-preset"]');
    const restitutionInput = root.querySelector('[data-collision2d="e"]');
    const restitutionLabel = root.querySelector('[data-collision2d="e-label"]');
    restitutionInput.addEventListener('input', () => { restitutionLabel.textContent = Number(restitutionInput.value).toLocaleString('vi-VN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); });
    let bodies = [], running = false, last = 0, raf = 0, selectedBody = 0, dragging = false;
    const seed = () => [
      { x: 65, y: 72, vx: 115, vy: 34, mass: 1, radius: 15, color: '#3b82f6' },
      { x: 235, y: 105, vx: -70, vy: -18, mass: 2, radius: 21, color: '#f97316' },
      { x: 130, y: 205, vx: 38, vy: -82, mass: 1.4, radius: 18, color: '#10b981' },
      { x: 300, y: 205, vx: -42, vy: 62, mass: 0.8, radius: 13, color: '#a855f7' }
    ];
    function resize() {
      const width = Math.max(280, canvas.clientWidth || 560);
      const height = 280;
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(width * ratio); canvas.height = Math.round(height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      canvas.dataset.width = String(width); canvas.dataset.height = String(height);
      bodies.forEach((b) => { b.x = Math.min(width - b.radius, Math.max(b.radius, b.x)); b.y = Math.min(height - b.radius, Math.max(b.radius, b.y)); });
      draw();
    }
    function draw() {
      const width = Number(canvas.dataset.width || 560), height = Number(canvas.dataset.height || 280);
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#0b1220'; ctx.fillRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(255,255,255,.10)'; ctx.lineWidth = 1;
      for (let x = 20; x < width; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,height); ctx.stroke(); }
      for (let y = 20; y < height; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(width,y); ctx.stroke(); }
      bodies.forEach((b,index) => {
        ctx.beginPath(); ctx.arc(b.x,b.y,b.radius,0,Math.PI*2); ctx.fillStyle=b.color; ctx.fill();
        if(index===selectedBody){ctx.beginPath();ctx.arc(b.x,b.y,b.radius+4,0,Math.PI*2);ctx.strokeStyle='#facc15';ctx.lineWidth=2.5;ctx.stroke();}
        ctx.strokeStyle='rgba(255,255,255,.85)'; ctx.lineWidth=1.5; ctx.stroke();
        ctx.fillStyle='#fff'; ctx.font='12px sans-serif'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.mass+' kg',b.x,b.y);
        const scale=0.16; ctx.beginPath(); ctx.moveTo(b.x,b.y); ctx.lineTo(b.x+b.vx*scale,b.y+b.vy*scale);
        ctx.strokeStyle='#fff'; ctx.lineWidth=2; ctx.stroke();
        const angle=Math.atan2(b.vy,b.vx); ctx.beginPath(); ctx.moveTo(b.x+b.vx*scale,b.y+b.vy*scale);
        ctx.lineTo(b.x+b.vx*scale-6*Math.cos(angle-0.5),b.y+b.vy*scale-6*Math.sin(angle-0.5));
        ctx.lineTo(b.x+b.vx*scale-6*Math.cos(angle+0.5),b.y+b.vy*scale-6*Math.sin(angle+0.5)); ctx.closePath(); ctx.fillStyle='#fff'; ctx.fill();
      });
      const totals=momentumAndEnergy2D(bodies);
      energy.textContent=fmt2D(totals.kinetic)+' J (đơn vị mô phỏng)';
      momentum.textContent='px '+fmt2D(totals.px)+' · py '+fmt2D(totals.py)+' kg·m/s';
    }
    
    const editor = {
      mass: root.querySelector('[data-collision2d-edit="mass"]'),
      radius: root.querySelector('[data-collision2d-edit="radius"]'),
      vx: root.querySelector('[data-collision2d-edit="vx"]'),
      vy: root.querySelector('[data-collision2d-edit="vy"]'),
      selected: root.querySelector('[data-collision2d-edit="selected"]')
    };
    function syncEditor() {
      const b=bodies[selectedBody]; if(!b) return;
      if(editor.mass) editor.mass.value=b.mass;
      if(editor.radius) editor.radius.value=b.radius;
      if(editor.vx) editor.vx.value=Math.round(b.vx*10)/10;
      if(editor.vy) editor.vy.value=Math.round(b.vy*10)/10;
      if(editor.selected) editor.selected.textContent='Đang chọn vật '+(selectedBody+1)+'/'+bodies.length;
    }
    ['mass','radius','vx','vy'].forEach((key)=>{
      const input=editor[key]; if(!input) return;
      input.addEventListener('change',()=>{
        const b=bodies[selectedBody], value=Number(input.value);
        if(!b || !Number.isFinite(value) || ((key==='mass'||key==='radius')&&value<=0)){syncEditor();status.textContent='Giá trị không hợp lệ.';return;}
        if(key==='mass') b.mass=Math.min(1000,value);
        if(key==='radius') b.radius=Math.min(45,Math.max(6,value));
        if(key==='vx') b.vx=Math.max(-500,Math.min(500,value));
        if(key==='vy') b.vy=Math.max(-500,Math.min(500,value));
        resize(); syncEditor(); status.textContent='Đã cập nhật vật '+(selectedBody+1)+'.';
      });
    });
    canvas.style.touchAction = 'none';
    canvas.addEventListener('pointerdown',(event)=>{
      const rect=canvas.getBoundingClientRect();
      const x=(event.clientX-rect.left)*(Number(canvas.dataset.width||560)/rect.width);
      const y=(event.clientY-rect.top)*(Number(canvas.dataset.height||280)/rect.height);
      let best=-1,dist=Infinity;
      bodies.forEach((b,index)=>{const d=Math.hypot(b.x-x,b.y-y);if(d<=b.radius+12&&d<dist){best=index;dist=d;}});
      if(best>=0){
        if(running) stop();
        selectedBody=best; dragging=true;
        if(canvas.setPointerCapture) canvas.setPointerCapture(event.pointerId);
        syncEditor(); draw(); status.textContent='Đã chọn vật '+(best+1)+'. Kéo để đổi vị trí ban đầu.';
      }
    });
    canvas.addEventListener('pointermove',(event)=>{
      if(!dragging) return;
      const rect=canvas.getBoundingClientRect(), b=bodies[selectedBody];
      if(!b || !rect.width || !rect.height) return;
      const x=(event.clientX-rect.left)*(Number(canvas.dataset.width||560)/rect.width);
      const y=(event.clientY-rect.top)*(Number(canvas.dataset.height||280)/rect.height);
      b.x=Math.max(b.radius,Math.min(Number(canvas.dataset.width||560)-b.radius,x));
      b.y=Math.max(b.radius,Math.min(Number(canvas.dataset.height||280)-b.radius,y));
      draw();
    });
    const releaseDrag=()=>{dragging=false;};
    canvas.addEventListener('pointerup',releaseDrag);
    canvas.addEventListener('pointercancel',releaseDrag);

    function step(dt) {
      const width=Number(canvas.dataset.width||560), height=Number(canvas.dataset.height||280);
      bodies.forEach((b)=>{
        b.x+=b.vx*dt; b.y+=b.vy*dt;
        if(b.x-b.radius<0){b.x=b.radius;b.vx=Math.abs(b.vx);}
        if(b.x+b.radius>width){b.x=width-b.radius;b.vx=-Math.abs(b.vx);}
        if(b.y-b.radius<0){b.y=b.radius;b.vy=Math.abs(b.vy);}
        if(b.y+b.radius>height){b.y=height-b.radius;b.vy=-Math.abs(b.vy);}
      });
      const e=Number(restitutionInput.value);
      for(let i=0;i<bodies.length;i++) for(let j=i+1;j<bodies.length;j++) resolveDiskCollision(bodies[i],bodies[j],e);
    }
    function tick(time) {
      if(!running) return;
      if(!last) last=time;
      const elapsed=Math.min((time-last)/1000,0.04); last=time;
      const substeps=2, dt=elapsed/substeps;
      for(let i=0;i<substeps;i++) step(dt);
      draw(); raf=requestAnimationFrame(tick);
    }
    function stop() { running=false; last=0; if(raf) cancelAnimationFrame(raf); raf=0; start.textContent='▶ Chạy mô phỏng'; status.textContent='Đã tạm dừng.'; }
    function resetWorld() { stop(); bodies=seed(); selectedBody=0; resize(); syncEditor(); status.textContent='Đã đặt lại 4 vật.'; }

    function applyPreset() {
      const width=Number(canvas.dataset.width||560), height=Number(canvas.dataset.height||280);
      const scaleX=width/560, scaleY=height/280;
      const presets = {
        headon: { label:'Hai vật đối đầu', e:1, bodies:[
          {x:120,y:140,vx:105,vy:0,mass:1,radius:18,color:'#3b82f6'},
          {x:440,y:140,vx:-55,vy:0,mass:1.5,radius:21,color:'#f97316'}]},
        oblique: { label:'Va chạm xiên', e:0.85, bodies:[
          {x:150,y:105,vx:105,vy:38,mass:1.2,radius:17,color:'#3b82f6'},
          {x:330,y:170,vx:-28,vy:-8,mass:1.8,radius:22,color:'#f97316'}]},
        chain: { label:'Va chạm dây chuyền 3 vật', e:1, bodies:[
          {x:75,y:140,vx:125,vy:0,mass:1,radius:15,color:'#3b82f6'},
          {x:270,y:140,vx:0,vy:0,mass:1,radius:18,color:'#10b981'},
          {x:465,y:140,vx:0,vy:0,mass:1,radius:18,color:'#f97316'}]},
        cluster: { label:'Cụm 6 vật', e:0.92, bodies:[
          {x:100,y:80,vx:82,vy:52,mass:1,radius:14,color:'#3b82f6'},
          {x:280,y:75,vx:-48,vy:62,mass:1.3,radius:17,color:'#f97316'},
          {x:460,y:90,vx:-76,vy:25,mass:0.9,radius:13,color:'#10b981'},
          {x:130,y:220,vx:65,vy:-54,mass:1.5,radius:19,color:'#a855f7'},
          {x:310,y:215,vx:-30,vy:-70,mass:0.8,radius:12,color:'#eab308'},
          {x:470,y:220,vx:-65,vy:-35,mass:1.1,radius:16,color:'#ec4899'}]}
      };
      const preset=presets[presetSelect && presetSelect.value];
      if(!preset) return;
      stop();
      restitutionInput.value=String(preset.e);
      restitutionLabel.textContent=preset.e.toLocaleString('vi-VN',{minimumFractionDigits:2,maximumFractionDigits:2});
      bodies=preset.bodies.map(b=>({...b,x:b.x*scaleX,y:b.y*scaleY}));
      selectedBody=0;
      resize(); syncEditor();
      status.textContent='Đã nạp kịch bản: '+preset.label+'. Có thể kéo vật hoặc chỉnh thông số.';
    }

    function addBody() {
      if (bodies.length >= 12) { status.textContent='Đã đạt giới hạn 12 vật để giữ mô phỏng nhẹ.'; return; }
      const width=Number(canvas.dataset.width||560), height=Number(canvas.dataset.height||280);
      const radius=11 + (bodies.length % 4) * 2;
      const candidates=[];
      for(let y=radius+8;y<height-radius;y+=28) for(let x=radius+8;x<width-radius;x+=28) {
        if(bodies.every(b=>Math.hypot(b.x-x,b.y-y)>b.radius+radius+5)) candidates.push({x,y});
      }
      if(!candidates.length){status.textContent='Không còn vị trí trống. Hãy thu nhỏ số vật hoặc đặt lại.';return;}
      const point=candidates[Math.floor(Math.random()*candidates.length)];
      const colors=['#38bdf8','#fb7185','#facc15','#c084fc','#34d399'];
      bodies.push({x:point.x,y:point.y,vx:(Math.random()-.5)*150,vy:(Math.random()-.5)*150,mass:0.7+(bodies.length%4)*0.45,radius,color:colors[bodies.length%colors.length]});
      selectedBody=bodies.length-1; syncEditor(); draw(); status.textContent='Đã thêm vật. Hiện có '+bodies.length+'/12 vật.';
    }
    function removeBody() {
      if(bodies.length<=2){status.textContent='Cần giữ ít nhất 2 vật để mô phỏng va chạm.';return;}
      bodies.pop(); selectedBody=Math.min(selectedBody,bodies.length-1); syncEditor(); draw(); status.textContent='Đã bỏ vật cuối. Còn '+bodies.length+' vật.';
    }
    start.addEventListener('click',()=>{
      if(running){stop();return;}
      if(document.hidden || !onScreen){status.textContent='Mở phòng thí nghiệm trên màn hình để chạy mô phỏng.';return;}
      running=true; start.textContent='Ⅱ Tạm dừng'; status.textContent='Đang mô phỏng va chạm 2D.'; last=0; raf=requestAnimationFrame(tick);
    });
    reset.addEventListener('click',resetWorld);
    if(add) add.addEventListener('click',addBody);
    if(remove) remove.addEventListener('click',removeBody);
    if(applyPresetButton) applyPresetButton.addEventListener('click',applyPreset);
    document.addEventListener('visibilitychange',()=>{if(document.hidden) stop();});
    if(typeof ResizeObserver!=='undefined') new ResizeObserver(resize).observe(canvas);
    let onScreen=true;
    if(typeof IntersectionObserver!=='undefined') {
      const visibilityObserver=new IntersectionObserver((entries)=>{
        onScreen=entries.some(entry=>entry.isIntersecting);
        if(!onScreen && running) stop();
      },{threshold:0.01});
      visibilityObserver.observe(root);
    }
    else window.addEventListener('resize',resize);
    bodies=seed(); resize(); syncEditor(); status.textContent='Sẵn sàng: 4 vật, va chạm đĩa tròn 2D.';
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();