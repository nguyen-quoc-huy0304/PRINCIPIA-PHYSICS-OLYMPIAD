/* PRINCIPIA Icon Studio — dedicated icon library and live appearance controls. */
(()=> {
 'use strict';
 const KEY='principia_icon_studio_v1';
 const DEFAULTS={enabled:true,size:19,color:'#a995ff',weight:'normal'};
 const safeColor=value=>/^#[0-9a-f]{6}$/i.test(value)?value:DEFAULTS.color;
 const clamp=(value,min,max)=>Math.max(min,Math.min(max,Number(value)||min));
 let settings=read();
 const byId=id=>document.getElementById(id);
 function read(){
  try{
   const value=JSON.parse(localStorage.getItem(KEY)||'{}');
   return {enabled:typeof value.enabled==='boolean'?value.enabled:DEFAULTS.enabled,size:typeof value.size==='number'?clamp(value.size,14,28):DEFAULTS.size,color:safeColor(value.color),weight:['normal','bold'].includes(value.weight)?value.weight:DEFAULTS.weight};
  }catch(_){return {...DEFAULTS}}
 }
 function persist(){try{localStorage.setItem(KEY,JSON.stringify(settings))}catch(_){}}
 function apply(){
  const root=document.documentElement;
  root.dataset.prIconsOff=String(!settings.enabled);
  root.style.setProperty('--pr-icon-size',settings.size+'px');
  root.style.setProperty('--pr-icon-custom-color',settings.color);
  root.style.setProperty('--pr-icon-stroke',settings.weight==='bold'?'2.35':'1.8');
  if(settings.enabled)window.PrincipiaLiveIcons?.refresh?.();
 }
 function make(tag,attrs={},label=''){
  const node=document.createElement(tag);
  Object.entries(attrs).forEach(([key,value])=>node.setAttribute(key,value));
  if(label)node.textContent=label;
  return node;
 }
 async function copySvg(name,button){
  const svg=window.PrincipiaLiveIcons?.getSvg?.(name)||'';
  if(!svg)return;
  try{await navigator.clipboard.writeText(svg);button.textContent='Đã copy'}
  catch(_){button.textContent='Không copy được'}
  window.setTimeout(()=>{button.textContent='Copy SVG'},1100);
 }
 function buildGallery(){
  const registry=window.PrincipiaLiveIcons;
  const grid=byId('prIconStudioGrid');
  if(!registry||!grid||grid.dataset.ready)return;
  grid.dataset.ready='1';
  registry.names.forEach(name=>{
   const card=make('article',{class:'pr-icon-studio-item'});
   const preview=make('span',{class:'pr-icon-studio-preview'});
   preview.innerHTML=registry.getSvg(name);
   const title=make('strong',{},name);
   const button=make('button',{type:'button'},'Copy SVG');
   button.addEventListener('click',()=>copySvg(name,button));
   card.append(preview,title,button);
   grid.append(card);
  });
 }
 function mount(){
  const panel=byId('proSiteEditorPanel');
  if(!panel||panel.querySelector('[data-pr-icon-studio]'))return;
  const section=make('section',{'data-pr-icon-studio':'','aria-label':'Quản lý thư viện icon'});
  section.className='pr-icon-studio';
  const header=make('button',{type:'button',class:'pr-icon-studio-toggle','aria-expanded':'false'},'✦ Thư viện Icon · '+(window.PrincipiaLiveIcons?.icons||0)+' icon');
  const body=make('div',{class:'pr-icon-studio-body'});
  const enabledLabel=make('label',{class:'pr-icon-studio-control'});
  const enabled=make('input',{type:'checkbox'});
  const enabledText=make('span',{},'Hiển thị icon trên giao diện');
  enabledLabel.append(enabled,enabledText);
  const sizeLabel=make('label',{class:'pr-icon-studio-control'});
  const sizeText=make('span',{},'Kích thước icon');
  const size=make('input',{type:'range',min:'14',max:'28',step:'1'});
  const sizeValue=make('output',{},settings.size+' px');
  sizeLabel.append(sizeText,size,sizeValue);
  const colorLabel=make('label',{class:'pr-icon-studio-control'});
  const colorText=make('span',{},'Màu icon');
  const color=make('input',{type:'color'});
  colorLabel.append(colorText,color);
  const weightLabel=make('label',{class:'pr-icon-studio-control'});
  const weightText=make('span',{},'Độ đậm nét');
  const weight=make('select');
  weight.append(make('option',{value:'normal'},'Tiêu chuẩn'),make('option',{value:'bold'},'Đậm'));
  weightLabel.append(weightText,weight);
  const note=make('p',{class:'pr-icon-studio-note'},'Chọn icon để sao chép SVG. Các icon điều hướng mặc định được thay bằng icon vector; logo, ảnh thương hiệu và icon tùy chỉnh được giữ nguyên.');
  const grid=make('div',{id:'prIconStudioGrid',class:'pr-icon-studio-grid'});
  body.append(enabledLabel,sizeLabel,colorLabel,weightLabel,note,grid);
  section.append(header,body);
  const vault=panel.querySelector('#principiaComponentVault');
  if(vault)panel.insertBefore(section,vault);else panel.append(section);
  const sync=()=>{enabled.checked=settings.enabled;size.value=String(settings.size);sizeValue.value=settings.size+' px';color.value=settings.color;weight.value=settings.weight};
  const update=()=>{persist();apply();sync()};
  enabled.addEventListener('change',()=>{settings.enabled=enabled.checked;update()});
  size.addEventListener('input',()=>{settings.size=clamp(size.value,14,28);update()});
  color.addEventListener('input',()=>{settings.color=safeColor(color.value);update()});
  weight.addEventListener('change',()=>{settings.weight=weight.value;update()});
  header.addEventListener('click',()=>{const open=body.hidden;body.hidden=!open;header.setAttribute('aria-expanded',String(open));if(open)buildGallery()});
  body.hidden=true;
  sync();
 }
 function init(){
  apply();
  mount();
  const observer=new MutationObserver(()=>mount());
  observer.observe(document.body,{childList:true,subtree:true});
  document.addEventListener('principia:rendered',mount);
  document.addEventListener('principia:page-changed',mount);
  window.addEventListener('pagehide',()=>observer.disconnect(),{once:true});
  window.PrincipiaIconStudio=Object.freeze({getSettings:()=>({...settings}),refresh:mount});
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();