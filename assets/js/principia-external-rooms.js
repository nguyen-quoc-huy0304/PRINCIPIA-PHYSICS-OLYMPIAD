/* PRINCIPIA External Rooms — user-created embedded lab/game tabs. */
(function(){
 'use strict';
 const KEYS={lab:'principia_external_lab_rooms_v1',games:'principia_external_game_rooms_v1'};
 const MAX_ROOMS=12,MAX_URL=2048;
 const esc=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function read(kind){
  try{const value=JSON.parse(localStorage.getItem(KEYS[kind])||'[]');return Array.isArray(value)?value.filter(x=>x&&typeof x.id==='string'&&typeof x.url==='string').slice(0,MAX_ROOMS):[]}
  catch(_){return[]}
 }
 function write(kind,rooms){
  try{localStorage.setItem(KEYS[kind],JSON.stringify(rooms.slice(0,MAX_ROOMS)));return true}
  catch(_){return false}
 }
 function normalizeUrl(raw){
  const value=String(raw||'').trim();if(!value||value.length>MAX_URL)return null;
  try{const url=new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(value)?value:'https://'+value);return ['http:','https:'].includes(url.protocol)?url.href:null}catch(_){return null}
 }
 function createPanel(root){
  if(root.dataset.ready==='1')return;
  root.dataset.ready='1';
  const kind=root.dataset.principiaRoomKind==='games'?'games':'lab';
  const isGame=kind==='games';
  const rooms=read(kind);
  root.className='principia-external-rooms';
  root.innerHTML='<section class="per-card"><div class="per-head"><div><b>'+(isGame?'🎮 Trò chơi từ website bên ngoài':'🧪 Phòng thí nghiệm mở rộng')+'</b><p>'+(isGame?'Tạo phòng trò chơi bằng link; nội dung chỉ tải khi bạn tạo phòng.':'Tự tạo phòng hoặc tab mô phỏng từ website khác; nội dung chỉ tải khi bạn chọn.')+'</p></div><div class="per-head-actions"><span class="per-count"></span><button type="button" class="per-toggle">'+(isGame?'＋ Tạo trò chơi':'＋ Tạo phòng / tab')+'</button></div></div>'+
   '<form class="per-form" hidden><input name="title" maxlength="80" placeholder="'+(isGame?'Tên trò chơi':'Tên phòng / mô phỏng')+'" aria-label="Tên phòng" required><input name="url" type="url" maxlength="2048" placeholder="Dán link website (https://...)" aria-label="Đường dẫn website" required><button type="submit">'+(isGame?'＋ Tạo trò chơi':'＋ Tạo phòng / tab')+'</button></form>'+
   '<div class="per-body"><nav class="per-tabs" aria-label="Phòng đã tạo"></nav><div class="per-view"><div class="per-empty">Chưa có phòng nào. Nhấn nút tạo phòng để thêm website.</div></div></div>'+
   '<p class="per-foot">Website cho phép iframe sẽ hiển thị ngay tại đây. Nếu website chặn nhúng, dùng “Mở ngoài”. PRINCIPIA không thể vượt chính sách bảo mật của website đó.</p></section>';
  const form=root.querySelector('.per-form'),toggle=root.querySelector('.per-toggle'),tabs=root.querySelector('.per-tabs'),view=root.querySelector('.per-view'),count=root.querySelector('.per-count');
  toggle.addEventListener('click',()=>{form.hidden=!form.hidden;toggle.textContent=form.hidden?(isGame?'＋ Tạo trò chơi':'＋ Tạo phòng / tab'):'Đóng biểu mẫu';if(!form.hidden)form.querySelector('[name=title]').focus()});
  let activeId=rooms[0]?.id||null;
  function render(){
   count.textContent=rooms.length+'/'+MAX_ROOMS+' phòng';
   tabs.replaceChildren();
   rooms.forEach(room=>{
    const wrap=document.createElement('div');wrap.className='per-tab'+(room.id===activeId?' active':'');
    const select=document.createElement('button');select.type='button';select.textContent=room.title;select.title=room.title;select.addEventListener('click',()=>{activeId=room.id;render()});
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.setAttribute('aria-label','Xóa '+room.title);remove.addEventListener('click',()=>{const index=rooms.findIndex(x=>x.id===room.id);if(index>=0)rooms.splice(index,1);if(!write(kind,rooms))return;activeId=rooms[0]?.id||null;render()});
    wrap.append(select,remove);tabs.appendChild(wrap);
   });
   view.replaceChildren();
   const room=rooms.find(x=>x.id===activeId);
   if(!room){const empty=document.createElement('div');empty.className='per-empty';empty.textContent='Chưa có phòng nào. Nhập tên và link để tạo phòng đầu tiên.';view.appendChild(empty);return}
   const toolbar=document.createElement('div');toolbar.className='per-toolbar';
   const name=document.createElement('b');name.textContent=room.title;
   const external=document.createElement('a');external.href=room.url;external.target='_blank';external.rel='noopener noreferrer';external.textContent='Mở ngoài ↗';
   toolbar.append(name,external);
   const frame=document.createElement('iframe');frame.src=room.url;frame.title=room.title;frame.loading='lazy';frame.referrerPolicy='strict-origin-when-cross-origin';frame.allow='fullscreen; autoplay; clipboard-read; clipboard-write';frame.setAttribute('sandbox','allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-presentation');
   const note=document.createElement('p');note.className='per-frame-note';note.textContent='Nếu khung trống hoặc website báo không cho hiển thị, hãy chọn “Mở ngoài”.';
   view.append(toolbar,frame,note);
  }
  form.addEventListener('submit',event=>{
   event.preventDefault();
   if(rooms.length>=MAX_ROOMS){count.textContent='Đã đạt giới hạn 12 phòng';return}
   const data=new FormData(form),title=String(data.get('title')||'').trim(),url=normalizeUrl(data.get('url'));
   if(!title||!url){count.textContent='Tên hoặc đường dẫn không hợp lệ';return}
   const id=window.crypto&&typeof window.crypto.randomUUID==='function'?window.crypto.randomUUID():'room-'+Date.now()+'-'+Math.random().toString(36).slice(2);
   const room={id,title:title.slice(0,80),url,createdAt:Date.now()};
   rooms.unshift(room);
   if(!write(kind,rooms)){rooms.shift();count.textContent='Không lưu được. Bộ nhớ trình duyệt có thể đã đầy.';return}
   activeId=room.id;form.reset();form.hidden=true;toggle.textContent=isGame?'＋ Tạo trò chơi':'＋ Tạo phòng / tab';render();
  });
  render();
 }
 function style(){
  if(document.getElementById('principia-external-rooms-style'))return;
  const style=document.createElement('style');style.id='principia-external-rooms-style';
  style.textContent='.principia-external-rooms{margin:16px 0}.per-card{padding:14px;border:1px solid var(--line,#475569);border-radius:15px;background:var(--card,rgba(100,116,139,.07));color:var(--txt,inherit)}.per-head{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}.per-head p,.per-foot,.per-frame-note{margin:5px 0;color:var(--muted,#94a3b8);font-size:12px;line-height:1.5}.per-count{font-size:11px;color:var(--muted);white-space:nowrap}.per-head-actions{display:flex;align-items:center;gap:8px}.per-toggle{padding:8px 11px;border:1px solid var(--line);border-radius:9px;background:var(--card2,#263449);color:inherit;font-weight:700}.per-form{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.5fr) auto;gap:8px;margin:12px 0}.per-form[hidden]{display:none!important}.per-form input{min-width:0;width:100%;box-sizing:border-box;padding:10px;border:1px solid var(--line,#475569);border-radius:9px;background:var(--bg,#0f172a);color:inherit}.per-form button{padding:9px 12px;border:1px solid var(--line);border-radius:9px;background:var(--card2,#263449);color:inherit;font-weight:700}.per-body{display:grid;grid-template-columns:minmax(125px,.25fr) minmax(0,1fr);gap:10px;min-height:250px}.per-tabs{display:flex;flex-direction:column;gap:6px;max-height:440px;overflow:auto}.per-tab{display:flex;min-width:0;border:1px solid var(--line);border-radius:9px;overflow:hidden}.per-tab.active{border-color:var(--accent,#7c83ff)}.per-tab button{min-width:0;padding:8px;background:transparent;border:0;color:inherit}.per-tab button:first-child{flex:1;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.per-tab button:last-child{flex:none}.per-view{min-width:0;overflow:hidden;border:1px solid var(--line);border-radius:10px;background:var(--bg,#0b1020)}.per-toolbar{display:flex;justify-content:space-between;gap:10px;padding:8px 10px;border-bottom:1px solid var(--line);font-size:12px}.per-toolbar a{color:var(--accent,#8ab4ff)}.per-view iframe{display:block;width:100%;height:clamp(300px,58vh,680px);border:0;background:#fff}.per-empty{display:grid;place-items:center;min-height:230px;padding:18px;text-align:center;color:var(--muted)}.per-frame-note{padding:0 10px}.per-foot{margin-top:10px}@media(max-width:680px){.per-form{grid-template-columns:1fr}.per-body{grid-template-columns:1fr}.per-tabs{flex-direction:row;max-height:none;overflow-x:auto}.per-tab{flex:none;max-width:190px}.per-view iframe{height:58vh}}';
  document.head.appendChild(style);
 }
 function mountLab(){
  const host=document.getElementById('clTab-phet');if(!host||host.querySelector('[data-principia-room-kind="lab"]'))return;
  const root=document.createElement('div');root.dataset.principiaRoomKind='lab';
  const anchor=document.getElementById('principiaPhetAttribution')||document.getElementById('phetFrame')||host.lastElementChild;
  if(anchor)anchor.insertAdjacentElement('afterend',root);else host.appendChild(root);
  createPanel(root);
 }
 function mountGames(){
  const root=document.getElementById('principiaExternalGameRooms');if(root)createPanel(root);
 }
 function wrapGames(){
  if(typeof window.entertainmentPage!=='function'||window.entertainmentPage.__principiaRooms)return;
  const original=window.entertainmentPage;
  const wrapped=function(){const html=original.apply(this,arguments);return html+'<div id="principiaExternalGameRooms" data-principia-room-kind="games"></div>'};
  wrapped.__principiaRooms=true;window.entertainmentPage=wrapped;
 }
 function mount(){style();mountLab();mountGames();wrapGames();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
 document.addEventListener('principia:rendered',mount);
 document.addEventListener('principia:page-changed',mount);
 new MutationObserver(records=>{
  const hasHost=records.some(record=>Array.from(record.addedNodes||[]).some(node=>node.nodeType===1&&(node.matches?.('#clTab-phet,#principiaExternalGameRooms')||node.querySelector?.('#clTab-phet,#principiaExternalGameRooms'))));
  if(hasHost)mount();
 }).observe(document.documentElement,{childList:true,subtree:true});
})();
