import {CARD_SURFACE_EFFECTS as effects,drawCardSurface} from '../../../src/card-battle-surface-renderer.mjs';
(() => {
 const root=document.getElementById('surface-preview'),field=root.querySelector('#field');
 const byId=Object.fromEntries(effects.map(e=>[e.id,e])),positive=effects.filter(e=>!e.negative).map(e=>e.id),negative=effects.filter(e=>e.negative).map(e=>e.id),all=effects.map(e=>e.id);
 const presets={positive:['attack','temp','health','shield'],negative:[...negative],mixed:['attack','health','shield','freeze','silence','weak'],all,none:[]};
 const names=['前锋统领','长枪统领','弓骑统领','军阵护卫','重骑统领','刀盾统领','营阵统领'];
 const units=Array.from({length:14},(_,i)=>({id:'unit-'+i,name:names[i%7],art:'assets/person-'+(i%7)+'.jpg',keys:i===10?[...all]:i%3===0?[...presets.positive]:i%3===1?[...presets.negative]:[...presets.mixed],burst:0,burstKeys:[]}));
 const focusIds=['unit-0','unit-10','unit-1'];
 let selected='unit-10',scene='focus',paused=matchMedia('(prefers-reduced-motion: reduce)').matches,elapsed=0,last=performance.now(),gain=.55,observers=[],surfaces=[],raf=0,focused=null;
 const selectedUnit=()=>units.find(u=>u.id===selected),sign=n=>n>0?'+'+n:'−'+Math.abs(n);
 const stats=u=>({attack:3+(u.keys.includes('attack')?4:0)+(u.keys.includes('temp')?2:0)-(u.keys.includes('weak')?2:0),max:7+(u.keys.includes('health')?3:0)-(u.keys.includes('frail')?1:0)});
 function card(u,label){const s=stats(u),pos=u.keys.some(k=>!byId[k].negative),neg=u.keys.some(k=>byId[k].negative);return `<article class="focus-card ${u.id===selected?'selected':''}" data-unit="${u.id}"><div class="card-label">${label??u.name}</div><button class="portrait-card" data-card="${u.id}" aria-pressed="${u.id===selected}" aria-label="${u.name}，${u.keys.map(k=>byId[k].name).join('、')||'无附加状态'}"><span class="painting" style="background-image:url('${u.art}')"></span>${pos?'<i class="state-border positive"></i>':''}${neg?'<i class="state-border negative"></i>':''}<canvas aria-hidden="true"></canvas><strong class="name">${u.name}</strong><span class="stats"><span class="stat-attack"><em>攻</em>${s.attack}</span><span class="stat-health"><em>命</em>${s.max-3}<em> / </em>${s.max}</span></span></button><div class="card-caption">${u.keys.length?u.keys.length+' 种状态 · 持续运动':'无附加状态'}</div></article>`;}
 function render(){
  observers.forEach(o=>o.disconnect());observers=[];surfaces=[];
  field.classList.toggle('formation',scene==='formation');
  if(scene==='focus')field.innerHTML=focusIds.map((id,i)=>card(units.find(u=>u.id===id),['增益组合','增益 ＋ 负面 · 全技能','负面组合'][i])).join('');
  else field.innerHTML=['enemy','home'].map((s,j)=>`<div class="army-label ${s}">${j?'我军':'敌军'}阵列 / 7 张人物卡</div><div class="army">${units.slice(j*7,j*7+7).map(u=>card(u)).join('')}</div>`).join('');
  for(const el of field.querySelectorAll('[data-card]')){
   const u=units.find(u=>u.id===el.dataset.card),canvas=el.querySelector('canvas'),ctx=canvas.getContext('2d'),surface={el,u,canvas,ctx};surfaces.push(surface);
   const resize=()=>{const r=canvas.getBoundingClientRect(),ratio=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);draw(surface,elapsed);};
   const observer=new ResizeObserver(resize);observer.observe(el);observers.push(observer);resize();
   el.onclick=()=>{selected=u.id;focused=null;updateSelection();field.querySelectorAll('[data-unit]').forEach(e=>{e.classList.toggle('selected',e.dataset.unit===selected);e.querySelector('[data-card]').setAttribute('aria-pressed',String(e.dataset.unit===selected));});};
  }
  updateSelection();updateMotion();
 }
 function option(e){return `<button class="${e.negative?'negative':'positive'}" data-effect="${e.id}" aria-pressed="false"><svg viewBox="-8 -8 16 16" aria-hidden="true"><path d="${e.path}"/></svg><span>${e.name}</span></button>`;}
 root.querySelector('[data-positive]').innerHTML=effects.filter(e=>!e.negative).map(option).join('');root.querySelector('[data-negative]').innerHTML=effects.filter(e=>e.negative).map(option).join('');
 function updateSelection(){const u=selectedUnit(),list=u.keys.map(k=>byId[k]),p=list.filter(e=>!e.negative).length,n=list.length-p;
  root.querySelector('[data-selection]').textContent=u.name;root.querySelector('[data-status-count]').textContent=p+' 项增益 / '+n+' 项负面';root.querySelector('[data-card-caption]').textContent=u.keys.length?u.keys.length+' 种状态同时存在':'原始卡面';
  for(const b of root.querySelectorAll('[data-effect]'))b.setAttribute('aria-pressed',String(u.keys.includes(b.dataset.effect)));
  for(const b of root.querySelectorAll('[data-preset]')){const a=presets[b.dataset.preset];b.setAttribute('aria-pressed',String(a.length===u.keys.length&&a.every(k=>u.keys.includes(k))));}
  if(focused){const e=byId[focused];root.querySelector('[data-effect-name]').textContent=e.name;root.querySelector('[data-effect-description]').textContent=e.description;}
 }
 function targets(){return scene==='formation'&&root.querySelector('[data-sync]').checked?units:[selectedUnit()];}
 function apply(keys){for(const u of targets()){u.keys=[...keys];u.burst=elapsed;u.burstKeys=[...keys];}render();}
 for(const b of root.querySelectorAll('[data-effect]'))b.onclick=()=>{const k=b.dataset.effect,u=selectedUnit(),adding=!u.keys.includes(k);focused=k;for(const target of targets()){target.keys=adding?[...new Set([...target.keys,k])]:target.keys.filter(v=>v!==k);if(adding){target.burst=elapsed;target.burstKeys=[k];}}render();};
 for(const b of root.querySelectorAll('[data-preset]'))b.onclick=()=>{focused=null;apply(presets[b.dataset.preset]);};
 for(const b of root.querySelectorAll('[data-scene]'))b.onclick=()=>{scene=b.dataset.scene;if(scene==='focus'&&!focusIds.includes(selected))selected='unit-10';root.querySelectorAll('[data-scene]').forEach(e=>e.setAttribute('aria-pressed',String(e.dataset.scene===scene)));root.querySelector('[data-scene-label]').textContent=scene==='focus'?'三组对照 · 选择卡牌调整状态':'七卡满阵 · 点击任意卡牌查看组合';render();};
 function updateMotion(){root.querySelector('.stage').classList.toggle('paused',paused);root.querySelector('[data-motion-label]').textContent=paused?'当前已定格':'常驻动效运行中';const b=root.querySelector('[data-pause]');b.textContent=paused?'继续动画':'定格对照';b.setAttribute('aria-pressed',String(paused));}
 root.querySelector('[data-pause]').onclick=()=>{paused=!paused;last=performance.now();updateMotion();};
 root.querySelector('[data-replay]').onclick=()=>{paused=false;last=performance.now();for(const u of targets()){u.burst=elapsed;u.burstKeys=[...u.keys];}updateMotion();};
 root.querySelector('#intensity').oninput=e=>{gain=Number(e.target.value)/100;root.querySelector('output').textContent=gain<.4?'克制':gain>.7?'强烈':'标准';if(paused)surfaces.forEach(s=>draw(s,elapsed));};
 function draw(surface,ms){drawCardSurface(surface,ms,gain);}
 // The renderer is deliberately live: each active status is redrawn with its own elapsed time.
 function frame(now){const delta=Math.min(80,now-last);last=now;if(!paused&&!document.hidden){elapsed+=delta;for(const s of surfaces)draw(s,elapsed);}raf=requestAnimationFrame(frame);}
 document.addEventListener('visibilitychange',()=>last=performance.now());window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);observers.forEach(o=>o.disconnect());},{once:true});
 const media=matchMedia('(prefers-reduced-motion: reduce)');media.addEventListener('change',e=>{paused=e.matches;updateMotion();});
 render();raf=requestAnimationFrame(frame);
 // Read-only diagnostics for the preview's native interaction/animation acceptance.
 window.cardSurfacePreview={snapshot:()=>({scene,selected,paused,elapsed,states:units.map(u=>({id:u.id,keys:[...u.keys]})),frames:surfaces.map(s=>s.frames??0)})};
})();
