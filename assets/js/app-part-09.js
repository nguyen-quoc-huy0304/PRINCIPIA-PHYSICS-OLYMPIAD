
/* PRINCIPIA_MUSIC_ISLAND_V1: embedded Music & Focus island */
(function(){
 'use strict';
 const KEY='principia_music_island_v1';
 const defaults={source:'spotify',url:'',track:'',focus:false,customSources:[]};
 const platformIcons={spotify:'🟢',youtube:'▶️',soundmusic:'🎧',other:'🌐'};
 function read(){try{return Object.assign({},defaults,JSON.parse(localStorage.getItem(KEY)||'{}'))}catch(e){return {...defaults}}}
 function save(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}
 function safeUrl(raw,source){
  let u=String(raw||'').trim();if(!u)return '';
  if(!/^https?:\/\//i.test(u))u='https://'+u;
  try{
   const x=new URL(u);if(!/^https?:$/.test(x.protocol))return '';
   if(source==='spotify'&&/open\.spotify\.com$/i.test(x.hostname)&&!x.pathname.startsWith('/embed/'))x.pathname='/embed'+x.pathname;
   if(source==='youtube'){
    let id='';if(/youtu\.be$/i.test(x.hostname))id=x.pathname.split('/').filter(Boolean)[0]||'';
    else if(/youtube(-nocookie)?\.com$/i.test(x.hostname)){id=x.searchParams.get('v')||((x.pathname.match(/\/(?:shorts|live|embed)\/([^/?]+)/)||[])[1]||'');}
    if(id)return 'https://www.youtube-nocookie.com/embed/'+encodeURIComponent(id)+'?autoplay=1&rel=0';
   }
   if(source==='soundcloud'&&/soundcloud\.com$/i.test(x.hostname))return 'https://w.soundcloud.com/player/?url='+encodeURIComponent(x.href)+'&auto_play=true&visual=true';
   return x.href;
  }catch(e){return ''}
 }
 function renderSources(){
  const r=ensure(),sel=r.querySelector('#pmSource'),v=read();if(!sel)return;
  sel.querySelectorAll('option[data-custom]').forEach(o=>o.remove());
  (v.customSources||[]).forEach((p,i)=>{const o=document.createElement('option');o.value='custom:'+i;o.textContent='🌐 '+p.name;o.dataset.custom='1';sel.appendChild(o)});
  sel.value=v.source;const icon=r.querySelector('#pmPlatformIcon');if(icon)icon.textContent=platformIcons[v.source]||(v.source.startsWith('custom:')?'🌐':'🌐');
 }
 function addPlatform(){
  const name=prompt('Tên nền tảng muốn thêm (VD: SoundCloud, Nhaccuatui):');if(!name||!name.trim())return;
  const sample=prompt('Nhập tên miền hoặc link nền tảng (VD: https://soundcloud.com):');if(!sample||!sample.trim())return;
  const u=safeUrl(sample,'other');if(!u){status('Địa chỉ nền tảng chưa hợp lệ');return}
  const v=read();v.customSources=v.customSources||[];v.customSources.push({name:name.trim().slice(0,35),url:u});v.source='custom:'+(v.customSources.length-1);save(v);renderSources();document.getElementById('pmUrl').value=u;status('Đã thêm nền tảng · Dán link nội dung để nhúng');
 }
 function ensure(){
  let root=document.getElementById('principiaMusicWindow');if(root)return root;
  root=document.createElement('div');root.id='principiaMusicWindow';root.hidden=true;
  root.innerHTML='<div class="pm-card" role="dialog" aria-modal="true" aria-label="Music and Focus"><div class="pm-head"><div><div class="pm-title">♫ Music & Focus</div><div class="pm-sub" id="pmNowPlaying">Chọn nguồn nhạc để bắt đầu</div></div><div class="pm-actions"><button class="pm-btn" type="button" id="pmMin" title="Thu nhỏ">—</button><button class="pm-btn" type="button" id="pmClose" title="Đóng">✕</button></div></div><div class="pm-settings"><div class="pm-platform-wrap"><div class="pm-platform"><span id="pmPlatformIcon" aria-hidden="true">🟢</span><select id="pmSource" aria-label="Chọn nền tảng"><option value="spotify">Spotify</option><option value="youtube">YouTube</option><option value="soundmusic">SoundMusic</option><option value="other">Website khác</option></select></div><button class="pm-add" id="pmAdd" type="button" title="Thêm nền tảng" aria-label="Thêm nền tảng">＋</button></div><div class="pm-url-row"><input id="pmUrl" type="url" inputmode="url" placeholder="Dán link bài hát, playlist hoặc website..." aria-label="Địa chỉ nguồn nhạc"><button class="pm-btn pm-load" id="pmLoad" type="button">▶ Nhúng vào PRINCIPIA</button></div><input class="pm-track" id="pmTrack" placeholder="✍️ Tên bài hát / playlist (tuỳ chọn)" aria-label="Tên bài hát hoặc playlist"><button class="pm-btn pm-focus" id="pmFocus" type="button">◉ Focus mode: Tắt</button></div><div class="pm-player" id="pmPlayer"><div class="pm-empty" id="pmEmpty"><strong>🎧 Không gian âm nhạc của bạn</strong><p>Dán link Spotify, SoundMusic hoặc website nhạc để phát ngay trong PRINCIPIA. Một số trang chặn nhúng sẽ cần mở bằng tab riêng.</p></div></div><div class="pm-foot"><span id="pmStatus">Sẵn sàng · Cài đặt được lưu trên thiết bị</span><button class="pm-btn" id="pmExternal" type="button">Mở ngoài ↗</button></div></div>';
  document.body.appendChild(root);
  root.addEventListener('click',e=>{if(e.target===root)hide()});
  root.querySelector('#pmMin').onclick=hide;root.querySelector('#pmClose').onclick=closePlayer;root.querySelector('#pmAdd').onclick=addPlatform;
  root.querySelector('#pmLoad').onclick=load;root.querySelector('#pmFocus').onclick=toggleFocus;
  root.querySelector('#pmExternal').onclick=()=>{const v=read(),u=safeUrl(v.url,v.source);if(u)window.open(u,'_blank','noopener,noreferrer');else status('Hãy nhập link nhạc trước')};
  root.querySelector('#pmSource').onchange=()=>{const v=read();v.source=root.querySelector('#pmSource').value;save(v);const icon=root.querySelector('#pmPlatformIcon');if(icon)icon.textContent=platformIcons[v.source]||(v.source.startsWith('custom:')?'🌐':'🌐')};
  root.querySelector('#pmUrl').onkeydown=e=>{if(e.key==='Enter')load()};
  root.querySelector('#pmTrack').oninput=()=>{const v=read();v.track=root.querySelector('#pmTrack').value;save(v);updateLabel(v)};
  return root;
 }
 function status(t){const n=document.getElementById('pmStatus');if(n)n.textContent=t}
 function updateLabel(v){const n=document.getElementById('pmNowPlaying');if(n)n.textContent=v.track?('Đang mở: '+v.track):({spotify:'Nguồn Spotify',soundmusic:'Nguồn SoundMusic',other:'Website nhạc'}[v.source]||'Music & Focus')}
 function open(){const r=ensure(),v=read();r.hidden=false;renderSources();document.getElementById('pmSource').value=v.source;document.getElementById('pmUrl').value=v.url;document.getElementById('pmTrack').value=v.track;updateLabel(v);syncFocus(v);if(v.url&&!document.querySelector('#pmPlayer iframe'))load();setTimeout(()=>document.getElementById('pmUrl')?.focus(),50)}
 function hide(){const r=document.getElementById('principiaMusicWindow');if(r)r.hidden=true}
 function closePlayer(){const p=document.getElementById('pmPlayer');if(p)p.innerHTML='<div class="pm-empty" id="pmEmpty"><strong>🎧 Không gian âm nhạc của bạn</strong><p>Nhấn Music để mở lại trình phát.</p></div>';hide()}
 function load(){
  const r=ensure(),v=read();v.source=document.getElementById('pmSource').value;v.url=document.getElementById('pmUrl').value.trim();v.track=document.getElementById('pmTrack').value.trim();save(v);
  const custom=v.source.startsWith('custom:');const actualSource=custom?'other':v.source;const u=safeUrl(v.url,actualSource);if(!u){status('Link chưa hợp lệ · Hãy nhập địa chỉ https://');return}
  const p=document.getElementById('pmPlayer');p.innerHTML='';
  const frame=document.createElement('iframe');frame.src=u;frame.title='Trình phát nhạc nhúng';frame.allow='autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture';frame.allowFullscreen=true;frame.referrerPolicy='strict-origin-when-cross-origin';p.appendChild(frame);
  updateLabel(v);status('Đang tải nguồn nhạc · Nếu bị chặn, chọn “Mở ngoài” ↗');
 }
 function syncFocus(v){const b=document.getElementById('pmFocus');if(b){b.textContent='◉ Focus mode: '+(v.focus?'Bật':'Tắt');b.classList.toggle('pm-focus-active',!!v.focus)}document.body.classList.toggle('principia-focus-mode',!!v.focus)}
 function toggleFocus(){const v=read();v.focus=!v.focus;save(v);syncFocus(v);status(v.focus?'Focus mode đã bật · Chúc bạn học tập tập trung!':'Đã tắt Focus mode')}
 window.principiaMusicOpen=open;
 const oldTitle=window.addEventListener;
 document.addEventListener('mouseover',e=>{if(e.target.closest?.('.principia-music-pill')){const v=read();e.target.closest('.principia-music-pill').title=v.track?('Đang phát: '+v.track):'Mở Music & Focus'}});
})();
