/* PRINCIPIA icon pack — inline SVG, no remote runtime; icons can be mounted with data-pr-icon. */
(()=>{'use strict';
const paths={
home:'M3 10.5 12 3l9 7.5M5.5 9v11h13V9M9 20v-6h6v6',
book:'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v18H6.5A2.5 2.5 0 0 1 4 17.5zM4 17.5A2.5 2.5 0 0 1 6.5 15H20',
brain:'M9 4a3 3 0 0 0-5 2.3A3.4 3.4 0 0 0 3 9a3 3 0 0 0 1 5.2A3.2 3.2 0 0 0 7 19h2m0-15v18m6-18a3 3 0 0 1 5 2.3A3.4 3.4 0 0 1 21 9a3 3 0 0 1-1 5.2A3.2 3.2 0 0 1 17 19h-2m0-15v18M9 8h2m-2 8h2m4-8h-2m2 8h-2',
sparkles:'M12 3 14 9l6 3-6 2-2 6-2-6-6-2 6-3zM19 2v4m-2-2h4M4 19v3m-2-1h4',
chart:'M4 19V5m0 14h17M7 15l4-5 3 3 5-7',
check:'M5 12l4 4L19 6',
search:'M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15zM16 16l5 5',
settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4 12h2m12 0h2M12 4v2m0 12v2M6.3 6.3l1.4 1.4m8.6 8.6 1.4 1.4M17.7 6.3l-1.4 1.4m-8.6 8.6-1.4 1.4',
play:'M7 4 20 12 7 20z',
pause:'M7 4h4v16H7zM15 4h4v16h-4z',
clock:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
trophy:'M8 4h8v5a4 4 0 0 1-8 0zM8 6H4v3a4 4 0 0 0 4 4m8-7h4v3a4 4 0 0 1-4 4m-4 3v4m-4 3h8m-7-3h6',
flame:'M12 22a7 7 0 0 0 7-7c0-4-3-6-4-9-1 3-3 4-3 6-2-1-3-3-3-5-2 3-4 5-4 8a7 7 0 0 0 7 7z',
arrow:'M5 12h14m-6-6 6 6-6 6',
close:'M6 6l12 12M18 6 6 18',
menu:'M4 6h16M4 12h16M4 18h16',
plus:'M12 5v14M5 12h14',
bulb:'M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0c-1 1-1.5 2-1.5 3h-5c0-1-.5-2-1.5-3',
user:'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
bolt:'M13 2 4 13h7l-1 9 10-12h-7z',
target:'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 12h.01',
};
function render(name,{size=20,stroke='currentColor',className=''}={}){const d=paths[name];if(!d)return '';const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('width',String(size));svg.setAttribute('height',String(size));svg.setAttribute('fill','none');svg.setAttribute('stroke',stroke);svg.setAttribute('stroke-width','1.8');svg.setAttribute('stroke-linecap','round');svg.setAttribute('stroke-linejoin','round');svg.setAttribute('aria-hidden','true');svg.setAttribute('class',className);svg.innerHTML='<path d="'+d+'"/>';return svg}
function mount(root=document){root.querySelectorAll('[data-pr-icon]').forEach(node=>{const name=node.getAttribute('data-pr-icon');if(!paths[name]||node.dataset.prIconMounted)return;const icon=render(name,{size:node.dataset.prIconSize||20,stroke:node.dataset.prIconColor||'currentColor'});if(icon){node.replaceChildren(icon);node.dataset.prIconMounted='1'}})}
window.PrincipiaIcons=Object.freeze({names:Object.freeze(Object.keys(paths)),render,mount});
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>mount(),{once:true});else mount();
})();