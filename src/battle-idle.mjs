// Standing poses stay on their original hex. Only the artwork breathes and
// occasionally shifts its weight; walking frames must never march in place.
export function idleSeed(id){let n=2166136261;for(const c of String(id))n=Math.imul(n^c.charCodeAt(0),16777619);n=Math.imul(n^(n>>>16),0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return((n^(n>>>16))>>>0)/4294967296;}
export function idlePose(kind,seed,seconds){
 const mounted=kind==='mounted',period=mounted?2.8:3.6;
 const breath=(1-Math.cos((seconds/period+seed)*Math.PI*2))/2;
 // A brief readiness gesture, separated by long quiet stretches.
 const cycle=(seconds+seed*19)%11,gesture=cycle<2?Math.sin(cycle*Math.PI/2)**2:0;
 const direction=seed<.5?-1:1;
 const x=direction*gesture*(mounted?1.1:.7),y=-breath*(mounted?.55:.25);
 const scale=1+breath*(mounted?.018:.012),tilt=direction*gesture*(kind==='spears'?.65:.4);
 return `translate(${x.toFixed(3)},${(24+y).toFixed(3)}) skewX(${tilt.toFixed(3)}) scale(1,${scale.toFixed(4)}) translate(0,-24)`;
}

export function startBattleIdle(container){
 const units=[...container.querySelectorAll('.unit-idle')].map(art=>({art,sprite:art.querySelector('.unit-sprite'),seed:idleSeed(art.closest('[data-unit]').dataset.unit)}));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let raf=0,stopped=false,last=-Infinity;
 const reset=()=>units.forEach(({art})=>art.removeAttribute('transform'));
 function tick(now){
  if(stopped)return;
  if(now-last>=1000/24){
   last=now;
   for(const {art,sprite,seed} of units){
    if(sprite.dataset.animation||art.closest('[data-unit]').dataset.reaction)art.removeAttribute('transform');
    else art.setAttribute('transform',idlePose(art.dataset.idleKind,seed,now/1000));
   }
  }
  raf=requestAnimationFrame(tick);
 }
 function sync(){cancelAnimationFrame(raf);reset();if(!stopped&&!document.hidden&&!reduced.matches){last=-Infinity;raf=requestAnimationFrame(tick);}}
 document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
 return()=>{stopped=true;cancelAnimationFrame(raf);reset();document.removeEventListener('visibilitychange',sync);reduced.removeEventListener('change',sync);};
}
