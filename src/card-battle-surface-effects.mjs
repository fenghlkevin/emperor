import {drawCardSurface} from './card-battle-surface-renderer.mjs';

// One clock per battle, with no save fields, input handlers, or per-particle DOM.
export function createCardSurfaceEffects(root,{isPaused=()=>false}={}){
 const doc=root.ownerDocument,win=doc.defaultView,media=win.matchMedia('(prefers-reduced-motion: reduce)'),surfaces=new Map(),records=new Map();
 let disposed=false,raf=0,time=1,last=0,lastPaint=0;
 const hash=id=>{let n=0;for(const c of id)n=(Math.imul(n,31)+c.charCodeAt(0))|0;return (n>>>0)%1000/100;};
 function resize(s){const r=s.canvas.getBoundingClientRect(),ratio=Math.min(2,win.devicePixelRatio||1),width=Math.round(r.width*ratio),height=Math.round(r.height*ratio);s.pixelRatio=ratio;if(s.canvas.width!==width)s.canvas.width=width;if(s.canvas.height!==height)s.canvas.height=height;}
 function paint(s){if(s.canvas.width&&s.canvas.height&&s.el.style.visibility!=='hidden')drawCardSurface(s,time);}
 const observer=new win.ResizeObserver(entries=>{for(const e of entries){const s=surfaces.get(e.target);if(s){resize(s);paint(s);}}});
 function wake(){if(disposed||raf||!root.isConnected||!surfaces.size||media.matches||doc.hidden||isPaused())return;last=win.performance.now();raf=win.requestAnimationFrame(frame);}
 function frame(now){raf=0;if(disposed||!root.isConnected||doc.hidden||media.matches||isPaused())return;time+=Math.min(80,now-last);last=now;
  if(now-lastPaint>=30){lastPaint=now;for(const s of surfaces.values())if(s.canvas.isConnected)paint(s);}
  wake();
 }
 function sync({impact=false}={}){
  if(disposed)return;
  const found=new Set(),ids=new Set();
  for(const canvas of root.querySelectorAll('[data-card] .cb-state-canvas')){
   const el=canvas.closest('[data-card]'),id=el.dataset.card,ghost=!!el.closest('.cb-fx-ghost'),keys=canvas.dataset.stateEffects.split(' ').filter(Boolean),values=canvas.dataset.stateValues;
   let record=records.get(id);if(!record){record={id,seed:hash(id),keys:[],values:'',burst:0,burstKeys:[]};records.set(id,record);}
   if(!ghost){ids.add(id);if(impact&&values!==record.values){const previous=new Set(record.values.split(' '));record.burstKeys=values.split(' ').filter(k=>!previous.has(k)).map(k=>k.split(':')[0]);record.burst=time;}record.keys=keys;record.values=values;}
   let s=surfaces.get(canvas);if(!s){s={canvas,ctx:canvas.getContext('2d'),el,u:record,game:true};if(!s.ctx)continue;surfaces.set(canvas,s);observer.observe(canvas);}s.u=ghost?{...record,keys}:record;found.add(canvas);resize(s);paint(s);
  }
  for(const [canvas]of surfaces)if(!found.has(canvas)){observer.unobserve(canvas);surfaces.delete(canvas);}
  // Remember empty states through the contact/final-render boundary; reapplying still gets a new burst.
  for(const [id,record]of records)if(!ids.has(id)){record.keys=[];record.values='';record.burstKeys=[];if(!root.querySelector('[data-card="'+CSS.escape(id)+'"]'))records.delete(id);}
  if(!surfaces.size||media.matches||isPaused()){win.cancelAnimationFrame(raf);raf=0;}else wake();
 }
 function visibility(){if(doc.hidden){win.cancelAnimationFrame(raf);raf=0;}else wake();}
 function motion(){if(media.matches){win.cancelAnimationFrame(raf);raf=0;for(const s of surfaces.values())paint(s);}else wake();}
 const mutations=new win.MutationObserver(rows=>{if(rows.some(row=>[...row.addedNodes,...row.removedNodes].some(n=>n.nodeType===1&&(n.matches('.cb-state-canvas')||n.querySelector('.cb-state-canvas')))))sync();});
 mutations.observe(root,{childList:true,subtree:true});
 doc.addEventListener('visibilitychange',visibility);media.addEventListener('change',motion);
 return {sync,dispose(){if(disposed)return;disposed=true;win.cancelAnimationFrame(raf);raf=0;observer.disconnect();mutations.disconnect();doc.removeEventListener('visibilitychange',visibility);media.removeEventListener('change',motion);surfaces.clear();records.clear();}};
}
