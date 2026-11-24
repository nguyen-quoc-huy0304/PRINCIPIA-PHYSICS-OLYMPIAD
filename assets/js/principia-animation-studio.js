/* PRINCIPIA Animation Studio — independent controls for motion layers and previews. */
(()=> {
 'use strict';
 const KEY='principia_animation_studio_v1';
 const DEFAULTS={entrance:true,hover:true,beam:true,spotlight:true,mascot:true,progress:true,stagger:true};
 const CLASS_MAP={
  entrance:'pr-animation-entrance-off',
  hover:'pr-animation-hover-off',
  beam:'pr-animation-beam-off',
  spotlight:'pr-animation-spotlight-off',
  mascot:'pr-animation-mascot-off',
  progress:'pr-animation-progress-off',
  stagger:'pr-animation-stagger-off'
 };
 const labels={
  entrance:'Xuất hiện theo cuộn / chuyển trang',
  hover:'Hover lift, magnetic và press',
  beam:'Viền sáng / border beam',
  spotlight:'Ánh sáng tương tác theo con trỏ',
  mascot:'Mascot nhìn theo con trỏ',
  progress:'Thanh tiến độ cuộn trang',
  stagger:'Hiệu ứng xuất hiện theo nhịp'
 };
 let settings=read();
 const make=(tag,attrs={},value='')=>{
  const node=document.createElement(tag);
  Object.entries(attrs).forEach(([key,val])=>node.setAttribute(key,val));
  if(value)node.textContent=value;
  return node;
 };
 function read(){
  try{
   const saved=JSON.parse(localStorage.getItem(KEY)||'{}');
   return Object.fromEntries(Object.keys(DEFAULTS).map(key=>[key,typeof saved[key]==='boolean'?saved[key]:DEFAULTS[key]]));
  }catch(_){return {...DEFAULTS}}
 }
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){}}
 function apply(){
  const root=document.documentElement;
  Object.entries(CLASS_MAP).forEach(([key,className])=>root.classList.toggle(className,!settings[key]));
  root.dataset.prAnimationStudio='ready';
 }
 function addPreview(body){
  const gallery=make('div',{class:'pr-animation-gallery'});
  const examples=[
   ['Spring entrance','pr-demo-entrance','Card xuất hiện với spring motion'],
   ['Border beam','pr-demo-beam','Viền sáng chạy quanh khung'],
   ['Pointer spotlight','pr-demo-spotlight','Ánh sáng phản hồi theo con trỏ'],
   ['Thinking orb','pr-demo-orb','Trạng thái AI đang suy luận'],
   ['Hairline figure','pr-demo-hairline','Đồ họa vector phản hồi pointer'],
   ['Liquid press','pr-demo-press','Nút có trạng thái nhấn vật lý']
  ];
  examples.forEach(([name,cls,description])=>{
   const card=make('article',{class:'pr-animation-demo '+cls});
   card.append(make('strong',{},name),make('span',{},description));
   gallery.append(card);
  });
  body.append(gallery);
 }
 function mount(){
  const panel=document.getElementById('proSiteEditorPanel');
  if(!panel||panel.querySelector('[data-pr-animation-studio]'))return;
  const section=make('section',{'data-pr-animation-studio':'','aria-label':'Quản lý thư viện animation'});
  section.className='pr-animation-studio';
  const header=make('button',{type:'button',class:'pr-animation-studio-toggle','aria-expanded':'false'},'✧ Animation Studio · Quản lý hiệu ứng');
  const body=make('div',{class:'pr-animation-studio-body'});
  const controls=make('div',{class:'pr-animation-controls'});
  Object.entries(labels).forEach(([key,labelText])=>{
   const label=make('label',{class:'pr-animation-control'});
   const input=make('input',{type:'checkbox','data-motion':key});
   input.checked=settings[key];
   label.append(input,make('span',{},labelText));
   input.addEventListener('change',()=>{settings[key]=input.checked;persist();apply()});
   controls.append(label);
  });
  const note=make('p',{class:'pr-animation-note'},'Các tuỳ chọn chỉ điều khiển lớp hiệu ứng tương ứng. Tôn trọng cài đặt prefers-reduced-motion của thiết bị.');
  body.append(controls,note);
  addPreview(body);
  section.append(header,body);
  const iconStudio=panel.querySelector('[data-pr-icon-studio]');
  const vault=panel.querySelector('#principia-component-vault');
  if(iconStudio)iconStudio.insertAdjacentElement('afterend',section);
  else if(vault)panel.insertBefore(section,vault);
  else panel.append(section);
  body.hidden=true;
  header.addEventListener('click',()=>{
   const open=body.hidden;body.hidden=!open;
   header.setAttribute('aria-expanded',String(open));
  });
 }
 function init(){
  apply();mount();
  const observer=new MutationObserver(mount);
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('principia:rendered',mount);
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  window.PrincipiaAnimationStudio=Object.freeze({getSettings:()=>({...settings}),refresh:mount});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();