/* PRINCIPIA Motion Library — per-area animation presets, isolated from layout and navigation. */
(()=> {
 'use strict';
 const KEY='principia_motion_library_v1';
 const DEFAULTS={cards:'lift',buttons:'press',navigation:'glow',mascot:'breathe',forms:'focus',tabs:'underline',progress:'glow',ai:'breathe'};
 const GROUPS={
  cards:{label:'Thẻ nội dung',selector:'#app .panel,#app .tile,#app .stat,#app .feature-card,#app .learning-card,#app .dashboard-card,#app .module-card',effects:['none','lift','glow','float','tilt']},
  buttons:{label:'Nút thao tác',selector:'#app button,#app [role="button"]',effects:['none','press','lift','glow','magnetic']},
  navigation:{label:'Điều hướng',selector:'#app .nav a,#app .nav button,#app nav a,#app nav button',effects:['none','glow','lift','underline','pulse']},
  mascot:{label:'Mascot PRINCIPIA',selector:'#app .principia-bundled-pose',effects:['none','breathe','float','glow']},
  forms:{label:'Ô nhập liệu',selector:'#app input,#app textarea,#app select',effects:['none','focus','glow']},
  tabs:{label:'Tab và bộ lọc',selector:'#app [role="tab"],#app .tabs button,#app .tab-button',effects:['none','underline','pulse','lift']},
  progress:{label:'Thanh tiến độ / XP',selector:'#app .progress,#app [role="progressbar"],#app .xpbar',effects:['none','glow','shimmer']},
  ai:{label:'Trạng thái AI',selector:'#app .ai-thinking,#app .ai-loading,#app .thinking,#app .typing-indicator,#app [data-ai-state="thinking"]',effects:['none','breathe','pulse','glow']}
 };
 const EXCLUDED='#proSiteEditorPanel,.modal,.modalbg,[role="dialog"],.chat-box,.principia-mobile-nav,#principiaM3ECanvasWorkspace';
 const EFFECT_LABELS={none:'Mặc định',lift:'Lift nhẹ',glow:'Glow',float:'Float',tilt:'3D tilt',press:'Physical press',magnetic:'Magnetic hover',underline:'Underline',pulse:'Pulse',breathe:'Breathe',focus:'Focus ring',shimmer:'Shimmer'};
 let settings=read();
 let observer=null;
 const make=(tag,attrs={},value='')=>{
  const node=document.createElement(tag);
  Object.entries(attrs).forEach(([key,val])=>node.setAttribute(key,val));
  if(value)node.textContent=value;
  return node;
 };
 function read(){
  try{
   const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
   return Object.fromEntries(Object.entries(DEFAULTS).map(([key,fallback])=>[
    key,GROUPS[key].effects.includes(saved[key])?saved[key]:fallback
   ]));
  }catch(_){return {...DEFAULTS}}
 }
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){}}
 function nodesFor(group,root=document){
  const selector=GROUPS[group].selector;
  const nodes=[];
  if(root instanceof Element&&root.matches(selector))nodes.push(root);
  root.querySelectorAll?.(selector).forEach(node=>nodes.push(node));
  return nodes.filter(node=>!node.closest(EXCLUDED));
 }
 function applyGroup(group,root=document){
  nodesFor(group,root).forEach(node=>{
   const effect=settings[group];
   if(effect==='none'){node.removeAttribute('data-pr-motion-kind');node.removeAttribute('data-pr-motion-effect');return}
   node.dataset.prMotionKind=group;
   node.dataset.prMotionEffect=effect;
  });
 }
 function apply(root=document){
  Object.keys(GROUPS).forEach(group=>applyGroup(group,root));
  document.documentElement.dataset.prMotionLibrary='ready';
 }
 function mount(){
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.querySelector('[data-pr-motion-library]'))return;
  const section=make('section',{'data-pr-motion-library':'','aria-label':'Thư viện animation theo khu vực'});
  section.className='pr-motion-library';
  const header=make('button',{type:'button',class:'pr-motion-library-toggle','aria-expanded':'false'},'✧ Motion Library · Chọn hiệu ứng theo khu vực');
  const body=make('div',{class:'pr-motion-library-body'});
  const description=make('p',{class:'pr-motion-library-note'},'Các preset chỉ tác động đến hiệu ứng chuyển động của nhóm đã chọn. Không thay đổi cấu trúc, nội dung, điều hướng hoặc chức năng.');
  const controls=make('div',{class:'pr-motion-library-controls'});
  Object.entries(GROUPS).forEach(([key,group])=>{
   const label=make('label',{class:'pr-motion-library-row'});
   const title=make('span',{},group.label);
   const select=make('select',{'data-motion-group':key,'aria-label':'Animation cho '+group.label});
   group.effects.forEach(effect=>select.append(make('option',{value:effect},EFFECT_LABELS[effect])));
   select.value=settings[key];
   select.addEventListener('change',()=>{
    settings[key]=group.effects.includes(select.value)?select.value:'none';
    persist();applyGroup(key);
   });
   label.append(title,select);controls.append(label);
  });
  const reset=make('button',{type:'button',class:'pr-motion-library-reset'},'Khôi phục hiệu ứng mặc định');
  reset.addEventListener('click',()=>{
   settings={...DEFAULTS};persist();apply();
   controls.querySelectorAll('select').forEach(select=>{select.value=settings[select.dataset.motionGroup]});
  });
  body.append(description,controls,reset);
  section.append(header,body);
  const animationStudio=panel.querySelector('[data-pr-animation-studio]');
  if(animationStudio)animationStudio.insertAdjacentElement('afterend',section);
  else panel.append(section);
  body.hidden=true;
  header.addEventListener('click',()=>{
   const open=body.hidden;body.hidden=!open;header.setAttribute('aria-expanded',String(open));
  });
 }
 function init(){
  apply();mount();
  observer=new MutationObserver(records=>{
   records.forEach(record=>record.addedNodes.forEach(node=>{
    if(node.nodeType===Node.ELEMENT_NODE)apply(node);
   }));
   mount();
  });
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('principia:rendered',()=>{apply();mount()});
  document.addEventListener('principia:page-changed',()=>{apply();mount()});
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  window.PrincipiaMotionLibrary=Object.freeze({getSettings:()=>({...settings}),set(group,effect){
   if(!GROUPS[group]||!GROUPS[group].effects.includes(effect))return false;
   settings[group]=effect;persist();applyGroup(group);return true;
  }});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();