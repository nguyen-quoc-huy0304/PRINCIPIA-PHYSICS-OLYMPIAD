/* PRINCIPIA Canva-style page editor: paste, position and resize content. */
(()=>{
 'use strict';
 const STORAGE_KEY='principia_canva_editor_v1';
 const MAX_OBJECTS=200;
 const MAX_IMAGE_CHARS=1400000;
 let state={objects:[],layout:{}};
 let enabled=false,layer=null,activeObjectDrag=null,activeElementDrag=null,lastPointer=null,suppressClickNode=null;
 let resizeObserver=null,resizeSaveTimer=null;
 const observed=new WeakSet();
 const observedSizes=new WeakMap();
 const originalResizeStyles=new WeakMap();
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
 const isAdmin=()=>!!window.PrincipiaAccess?.isOwner?.();
 const currentPage=()=>String(window.__principiaLastRoute||'home').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80)||'home';
 const number=(value,fallback,min,max)=>{
  const n=Number(value);
  return Number.isFinite(n)?clamp(n,min,max):fallback;
 };
 const validImage=value=>typeof value==='string'&&value.length<=MAX_IMAGE_CHARS&&/^data:image\/(?:png|jpeg|webp|gif);base64,/i.test(value);
 const normalizeObject=value=>{
  if(!value||typeof value!=='object'||!['text','image'].includes(value.type))return null;
  const id=String(value.id||'').slice(0,80);
  if(!id)return null;
  const page=String(value.page||'home').toLowerCase().replace(/[^a-z0-9_-]/g,'').slice(0,80)||'home';
  const result={
   id,type:value.type,page,
   x:number(value.x,80,-5000,50000),y:number(value.y,120,-5000,50000),
   width:number(value.width,value.type==='image'?300:280,60,2400),
   height:number(value.height,0,0,2400),
   fontSize:number(value.fontSize,22,8,160),
   color:/^(#[0-9a-f]{3,8}|[a-z]{3,20})$/i.test(String(value.color||''))?String(value.color):'#ffffff',
   text:typeof value.text==='string'?value.text.slice(0,10000):''
  };
  if(value.type==='image'){
   if(!validImage(value.src))return null;
   result.src=value.src;
  }
  return result;
 };
 function normalizeLayout(value){
  const output={};
  if(!value||typeof value!=='object'||Array.isArray(value))return output;
  Object.entries(value).slice(0,1500).forEach(([key,item])=>{
   if(!key||key.length>600||!item||typeof item!=='object')return;
   const entry={x:number(item.x,0,-5000,5000),y:number(item.y,0,-5000,5000)};
   if(Number.isFinite(Number(item.width)))entry.width=number(item.width,0,24,5000);
   if(Number.isFinite(Number(item.height)))entry.height=number(item.height,0,20,5000);
   output[key]=entry;
  });
  return output;
 }
 function load(){
  try{
   const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}');
   state={
    objects:Array.isArray(parsed.objects)?parsed.objects.map(normalizeObject).filter(Boolean).slice(0,MAX_OBJECTS):[],
    layout:normalizeLayout(parsed.layout)
   };
  }catch(_){state={objects:[],layout:{}}}
 }
 function persist(){
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));setStatus('Đã lưu bố cục và nội dung trên thiết bị này.');return true}
  catch(_){setStatus('Không đủ dung lượng lưu. Hãy giảm số lượng hoặc dung lượng ảnh.');return false}
 }
 function setStatus(message){
  const status=document.querySelector('#proSiteEditorPanel [data-status]');
  if(status)status.textContent=message;
 }
 function id(){
  if(window.crypto?.randomUUID)return window.crypto.randomUUID();
  return 'obj-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);
 }
 function elementKey(element){
  if(element.dataset.proEditPath)return element.dataset.proEditPath;
  const parts=[];let node=element;
  while(node&&node!==document.body&&node.parentElement){
   const siblings=[...node.parentElement.children].filter(item=>item.tagName===node.tagName);
   parts.unshift(node.tagName.toLowerCase()+':'+(siblings.indexOf(node)+1));
   node=node.parentElement;
  }
  return parts.join('/');
 }
 function isResizeTarget(element){
  return element.matches('img,[data-pro-edit-key],.tile,.stat,.panel,.hero,.sectionhead,.grid,.stats');
 }
 function setLayoutStyle(element,entry){
  if(!entry){
   element.style.removeProperty('translate');
   return;
  }
  element.style.setProperty('translate',(entry.x||0)+'px '+(entry.y||0)+'px');
  if(entry.width)element.style.setProperty('width',entry.width+'px');
  if(entry.height)element.style.setProperty('height',entry.height+'px');
 }
 function recordElementSize(element,key){
  if(!enabled||!element.isConnected)return false;
  const rect=element.getBoundingClientRect();
  if(rect.width<24||rect.height<20)return false;
  const current=state.layout[key]||{x:0,y:0};
  const width=Math.round(rect.width),height=Math.round(rect.height);
  if(current.width===width&&current.height===height)return false;
  current.width=width;current.height=height;state.layout[key]=current;
  return true;
 }
 function applyPageLayout(){
  const app=document.getElementById('app');
  if(!app)return;
  const candidates=[...app.querySelectorAll('*')];
  candidates.forEach(element=>{
   if(element.matches('script,style,svg,path,input,textarea,select,option,iframe,video,canvas')||element.closest('[data-pro-editor-toolbar],#principiaActionDockRoot,#chatBox'))return;
   const key=elementKey(element);
   element.dataset.proCanvasMoveKey=key;
   setLayoutStyle(element,state.layout[key]);
   if(isResizeTarget(element)){
    if(!originalResizeStyles.has(element))originalResizeStyles.set(element,{resize:element.style.resize,overflow:element.style.overflow,display:element.style.display,verticalAlign:element.style.verticalAlign,maxWidth:element.style.maxWidth});
    if(enabled){
     element.style.setProperty('resize','both','important');
     element.style.setProperty('overflow','auto','important');
     if(element.matches('[data-pro-edit-key]')){
      element.style.setProperty('display','inline-block','important');
      element.style.setProperty('vertical-align','baseline','important');
      element.style.setProperty('max-width','100%','important');
     }
     if(typeof ResizeObserver==='function'&&!observed.has(element)){
      if(!resizeObserver)resizeObserver=new ResizeObserver(entries=>{
       let changed=false;
       entries.forEach(entry=>{
        const target=entry.target,keyNow=target.dataset.proCanvasMoveKey,rect=target.getBoundingClientRect();
        const previous=observedSizes.get(target);
        observedSizes.set(target,{width:rect.width,height:rect.height});
        if(previous&&(Math.abs(previous.width-rect.width)>1||Math.abs(previous.height-rect.height)>1)&&keyNow)
         changed=recordElementSize(target,keyNow)||changed;
       });
       if(changed){clearTimeout(resizeSaveTimer);resizeSaveTimer=setTimeout(persist,250)}
      });
      const rect=element.getBoundingClientRect();
      observedSizes.set(element,{width:rect.width,height:rect.height});
      resizeObserver.observe(element);observed.add(element);
     }
    }else{
     const original=originalResizeStyles.get(element);
     if(original){
      element.style.resize=original.resize;
      element.style.overflow=original.overflow;
      element.style.display=original.display;
      element.style.verticalAlign=original.verticalAlign;
      element.style.maxWidth=original.maxWidth;
     }
    }
   }
  });
 }
 function ensureLayer(){
  if(layer?.isConnected)return layer;
  layer=document.getElementById('principiaCanvaLayer');
  if(!layer){
   layer=document.createElement('div');layer.id='principiaCanvaLayer';
   layer.setAttribute('aria-label','Các đối tượng được thêm bằng trình chỉnh sửa');
   layer.dataset.proEditorToolbar='1';
   Object.assign(layer.style,{position:'absolute',left:'0',top:'0',width:'100%',minHeight:'100%',overflow:'visible',pointerEvents:'none',zIndex:'2147482000'});
   document.body.appendChild(layer);
  }
  return layer;
 }
 function currentObjects(){return state.objects.filter(item=>item.page===currentPage())}
 function renderObjects(){
  if(!isAdmin())return;
  const root=ensureLayer();
  root.replaceChildren();
  currentObjects().forEach(item=>{
   const wrapper=document.createElement('div');
   wrapper.dataset.objectId=item.id;
   wrapper.style.cssText='position:absolute;left:'+item.x+'px;top:'+item.y+'px;width:'+item.width+'px;min-width:60px;box-sizing:border-box;z-index:1;pointer-events:'+(enabled?'auto':'none')+';';
   if(item.height)wrapper.style.height=item.height+'px';
   if(enabled)wrapper.style.cssText+='outline:1px dashed rgba(158,139,255,.9);outline-offset:2px;';
   const head=document.createElement('div');
   head.dataset.objectDragHandle='true';
   head.style.cssText='display:'+(enabled?'flex':'none')+';position:absolute;left:0;top:-27px;align-items:center;gap:5px;height:24px;padding:0 5px;border-radius:7px;background:#26213d;color:#fff;font:12px system-ui;cursor:move;user-select:none;white-space:nowrap;';
   const grip=document.createElement('span');grip.textContent='⋮⋮ Kéo';grip.style.cssText='padding:3px 5px;cursor:move';
   const remove=document.createElement('button');remove.type='button';remove.dataset.objectDelete='true';remove.textContent='×';
   remove.setAttribute('aria-label','Xóa đối tượng');
   remove.style.cssText='width:22px;height:22px;padding:0;border:0;border-radius:5px;background:#733b56;color:white;cursor:pointer;line-height:1';
   head.append(grip,remove);
   wrapper.appendChild(head);
   if(item.type==='text'){
    const text=document.createElement('div');
    text.dataset.objectText='true';
    text.textContent=item.text;
    text.contentEditable=enabled?'true':'false';
    text.spellcheck=enabled;
    text.style.cssText='display:block;box-sizing:border-box;min-height:38px;width:100%;padding:7px 9px;border-radius:4px;white-space:pre-wrap;overflow-wrap:anywhere;color:'+item.color+';font: '+item.fontSize+'px/1.45 system-ui,sans-serif;outline:none;background:transparent;cursor:'+(enabled?'text':'default')+';';
    text.addEventListener('input',()=>{item.text=text.textContent.slice(0,10000);persist()});
    wrapper.appendChild(text);
   }else{
    const image=document.createElement('img');
    image.src=item.src;image.alt='Ảnh đã dán vào trang';image.draggable=false;
    image.style.cssText='display:block;width:100%;height:'+(item.height?'100%':'auto')+';max-width:none;object-fit:contain;user-select:none;border-radius:4px;';
    wrapper.appendChild(image);
   }
   const resize=document.createElement('div');
   resize.dataset.objectResizeHandle='true';
   resize.style.cssText='display:'+(enabled?'block':'none')+';position:absolute;right:-6px;bottom:-6px;width:13px;height:13px;border:2px solid white;border-radius:3px;background:#8069eb;cursor:nwse-resize;touch-action:none;';
   wrapper.appendChild(resize);
   root.appendChild(wrapper);
  });
 }
 function addObject(type,value,point){
  if(!enabled||!isAdmin())return;
  if(state.objects.length>=MAX_OBJECTS){setStatus('Đã đạt giới hạn '+MAX_OBJECTS+' đối tượng.');return}
  const position=point||lastPointer||{x:window.scrollX+Math.max(12,(window.innerWidth-280)/2),y:window.scrollY+Math.max(80,(window.innerHeight-80)/2)};
  const object=normalizeObject({
   id:id(),type,page:currentPage(),x:position.x,y:position.y,
   width:type==='image'?300:280,height:0,fontSize:22,color:'#ffffff',
   text:type==='text'?String(value||'Nhập văn bản...'):'',src:type==='image'?value:''
  });
  if(!object){setStatus('Nội dung dán không hợp lệ.');return}
  state.objects.push(object);persist();renderObjects();
  setStatus(type==='image'?'Đã thêm ảnh. Kéo thanh trên để di chuyển, kéo góc để đổi kích thước.':'Đã thêm hộp chữ. Bấm vào chữ để sửa, kéo thanh trên để di chuyển.');
 }
 function addText(){
  addObject('text','Nhập văn bản...');
  const target=layer?.querySelector('[data-object-text]');
  target?.focus();
 }
 function isTypingTarget(target){
  return !!target?.closest?.('input,textarea,select,[contenteditable="true"],[data-pro-editor-toolbar],#principiaCanvaLayer');
 }
 function fileToDataUrl(file){
  return new Promise((resolve,reject)=>{
   if(!file||!/^image\//i.test(file.type))return reject(new Error('Chỉ hỗ trợ ảnh.'));
   const reader=new FileReader();
   reader.onerror=()=>reject(new Error('Không đọc được ảnh.'));
   reader.onload=()=>{
    const image=new Image();
    image.onerror=()=>reject(new Error('Ảnh không hợp lệ.'));
    image.onload=()=>{
     const scale=Math.min(1,1600/Math.max(image.width,image.height));
     const canvas=document.createElement('canvas');
     canvas.width=Math.max(1,Math.round(image.width*scale));
     canvas.height=Math.max(1,Math.round(image.height*scale));
     const context=canvas.getContext('2d');
     if(!context)return reject(new Error('Không thể xử lý ảnh trên trình duyệt này.'));
     context.drawImage(image,0,0,canvas.width,canvas.height);
     let data=canvas.toDataURL('image/webp',.8);
     if(data.length>900000)data=canvas.toDataURL('image/jpeg',.64);
     if(data.length>MAX_IMAGE_CHARS)return reject(new Error('Ảnh quá lớn sau khi nén. Hãy chọn ảnh nhỏ hơn.'));
     resolve(data);
    };
    image.src=String(reader.result||'');
   };
   reader.readAsDataURL(file);
  });
 }
 async function addImageFile(file,point){
  try{const src=await fileToDataUrl(file);addObject('image',src,point)}
  catch(error){setStatus(error.message||'Không thể thêm ảnh.')}
 }
 function pasteHandler(event){
  if(!enabled||!isAdmin()||isTypingTarget(event.target))return;
  const clipboard=event.clipboardData;
  if(!clipboard)return;
  const imageItem=[...clipboard.items].find(item=>item.kind==='file'&&/^image\//i.test(item.type));
  if(imageItem){
   const file=imageItem.getAsFile();if(!file)return;
   event.preventDefault();event.stopPropagation();
   addImageFile(file,lastPointer);return;
  }
  const text=clipboard.getData('text/plain');
  if(!text)return;
  event.preventDefault();event.stopPropagation();
  addObject('text',text.slice(0,10000),lastPointer);
 }
 function dropHandler(event){
  if(!enabled||!isAdmin()||isTypingTarget(event.target))return;
  const files=[...(event.dataTransfer?.files||[])];
  const image=files.find(file=>/^image\//i.test(file.type));
  const point={x:number(event.pageX,window.scrollX+event.clientX,0,50000),y:number(event.pageY,window.scrollY+event.clientY,0,50000)};
  if(image){event.preventDefault();addImageFile(image,point);return}
  const text=event.dataTransfer?.getData('text/plain');
  if(text){event.preventDefault();addObject('text',text.slice(0,10000),point)}
 }
 function installToolbarControls(){
  if(!isAdmin())return;
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.querySelector('[data-canva-controls]'))return;
  const section=document.createElement('div');
  section.dataset.canvaControls='true';
  section.style.cssText='display:flex;flex-direction:column;gap:6px;margin:9px 0 7px;';
  const add=document.createElement('button');
  add.type='button';add.dataset.addCanvasText='true';add.textContent='＋ Hộp chữ';
  add.style.cssText='width:100%;padding:8px 10px;border:1px solid rgba(255,255,255,.25);border-radius:9px;background:rgba(137,112,235,.2);color:white;font:inherit;cursor:pointer;';
  add.addEventListener('click',addText);
  const hint=document.createElement('small');
  hint.textContent='Ctrl+V để dán chữ/ảnh · Kéo nội dung để di chuyển · Kéo góc để đổi kích thước';
  hint.style.cssText='font:11px/1.45 system-ui;color:rgba(255,255,255,.72);';
  section.append(add,hint);
  const status=panel.querySelector('[data-status]');
  if(status)panel.insertBefore(section,status);else panel.appendChild(section);
 }
 function beginObjectDrag(event,wrapper,mode){
  const item=state.objects.find(value=>value.id===wrapper.dataset.objectId);
  if(!item)return;
  activeObjectDrag={
   item,wrapper,mode,x:event.clientX,y:event.clientY,
   startX:item.x,startY:item.y,startWidth:item.width,
   startHeight:item.height||wrapper.getBoundingClientRect().height,
   moved:false
  };
  try{event.target.setPointerCapture(event.pointerId)}catch(_){}
  event.preventDefault();event.stopPropagation();
 }
 function findMoveTarget(target){
  if(!target?.closest)return null;
  const app=document.getElementById('app');
  const preferred=target.closest('[data-pro-edit-key],img[data-pro-image-edit-key],button,a,[role="button"],.tile,.stat,.panel,.hero,.sectionhead,.top,.pill,.nav,.principia-time-pill,.principia-music-pill,h1,h2,h3,p,li');
  if(preferred&&app?.contains(preferred))return preferred;
  const fallback=target.closest('[data-pro-canvas-move-key]');
  return fallback&&app?.contains(fallback)?fallback:null;
 }
 function beginElementDrag(event,element){
  const key=element.dataset.proCanvasMoveKey||elementKey(element);
  const saved=state.layout[key]||{x:0,y:0};
  activeElementDrag={element,key,startX:event.clientX,startY:event.clientY,x:saved.x||0,y:saved.y||0,moved:false};
 }
 document.addEventListener('pointerdown',event=>{
  if(!enabled||!isAdmin()||event.button!==0)return;
  const handle=event.target.closest?.('[data-object-drag-handle]');
  const resize=event.target.closest?.('[data-object-resize-handle]');
  if(handle||resize){
   const wrapper=event.target.closest('[data-object-id]');
   if(wrapper)beginObjectDrag(event,wrapper,resize?'resize':'move');
   return;
  }
  if(event.target.closest?.('[data-pro-editor-toolbar],#principiaCanvaLayer,#principiaActionDockRoot'))return;
  const element=findMoveTarget(event.target);
  if(element)beginElementDrag(event,element);
 },true);
 document.addEventListener('pointermove',event=>{
  lastPointer={x:window.scrollX+event.clientX,y:window.scrollY+event.clientY};
  if(activeObjectDrag){
   const drag=activeObjectDrag,dx=event.clientX-drag.x,dy=event.clientY-drag.y;
   if(Math.hypot(dx,dy)>3)drag.moved=true;
   if(!drag.moved)return;
   if(drag.mode==='move'){
    drag.item.x=clamp(drag.startX+dx,0,Math.max(0,window.scrollX+window.innerWidth-60));
    drag.item.y=clamp(drag.startY+dy,0,50000);
    drag.wrapper.style.left=drag.item.x+'px';drag.wrapper.style.top=drag.item.y+'px';
   }else{
    drag.item.width=clamp(drag.startWidth+dx,60,2400);
    drag.item.height=clamp(drag.startHeight+dy,40,2400);
    drag.wrapper.style.width=drag.item.width+'px';drag.wrapper.style.height=drag.item.height+'px';
   }
   event.preventDefault();return;
  }
  if(activeElementDrag){
   const drag=activeElementDrag,dx=event.clientX-drag.startX,dy=event.clientY-drag.startY;
   if(Math.hypot(dx,dy)>4)drag.moved=true;
   if(!drag.moved)return;
   const x=clamp(drag.x+dx,-5000,5000),y=clamp(drag.y+dy,-5000,5000);
   drag.element.style.setProperty('translate',x+'px '+y+'px');
   drag.next={x,y};
   event.preventDefault();
  }
 },true);
 document.addEventListener('pointerup',()=>{
  if(activeObjectDrag){
   if(activeObjectDrag.moved){persist();renderObjects();setStatus('Đã di chuyển đối tượng.')}
   activeObjectDrag=null;
  }
  if(activeElementDrag){
   const drag=activeElementDrag;
   if(drag.moved){
    const entry=state.layout[drag.key]||{x:0,y:0};
    entry.x=drag.next?.x??entry.x;entry.y=drag.next?.y??entry.y;
    state.layout[drag.key]=entry;persist();
    suppressClickNode=drag.element;
    setTimeout(()=>{suppressClickNode=null},0);
   }
   activeElementDrag=null;
  }
 },true);
 document.addEventListener('pointercancel',()=>{activeObjectDrag=null;activeElementDrag=null},true);
 document.addEventListener('click',event=>{
  if(!suppressClickNode)return;
  if(event.target===suppressClickNode||suppressClickNode.contains(event.target)){
   event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();suppressClickNode=null;
  }
 },true);
 document.addEventListener('paste',pasteHandler,true);
 document.addEventListener('dragover',event=>{
  if(enabled&&isAdmin()&&[...(event.dataTransfer?.types||[])].includes('Files'))event.preventDefault();
 },true);
 document.addEventListener('drop',dropHandler,true);
 function importState(value){
  if(!value||typeof value!=='object')return;
  state={
   objects:Array.isArray(value.objects)?value.objects.map(normalizeObject).filter(Boolean).slice(0,MAX_OBJECTS):[],
   layout:normalizeLayout(value.layout)
  };
  persist();applyPageLayout();renderObjects();
 }
 function exportState(){return JSON.parse(JSON.stringify(state))}
 function setMode(next){
  enabled=!!next;
  installToolbarControls();applyPageLayout();renderObjects();
 }
 function connectSiteEditor(){
  const api=window.PrincipiaSiteEditor;
  if(!api||api.__canvaConnected)return;
  api.__canvaConnected=true;
  if(typeof api.setEnabled==='function'){
   const original=api.setEnabled.bind(api);
   api.setEnabled=function(next){const result=original(next);setMode(next);return result};
  }
  if(typeof api.export==='function'){
   const original=api.export.bind(api);
   api.export=function(){
    const output=JSON.parse(original());
    output.canvas=exportState();
    return JSON.stringify(output,null,2);
   };
  }
  const originalGet=typeof api.getState==='function'?api.getState.bind(api):null;
  if(originalGet)api.getState=function(){const output=originalGet();output.canvas=exportState();return output};
 }
 window.PrincipiaCanvaEditor={importState,exportState,addText,addImageFile,setMode};
 load();
 connectSiteEditor();
 document.addEventListener('principia:rendered',()=>{
  setTimeout(()=>{connectSiteEditor();installToolbarControls();applyPageLayout();renderObjects()},0);
 });
 const observer=new MutationObserver(()=>{connectSiteEditor();installToolbarControls()});
 observer.observe(document.body,{childList:true,subtree:true});
 if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',()=>{connectSiteEditor();installToolbarControls();applyPageLayout();renderObjects()},{once:true});
 }else{installToolbarControls();applyPageLayout();renderObjects()}
})();