import {palaceAction} from './emperor.mjs';

export function openMusic(initial,root,onCommit,onClose){
 const d=document.createElement('dialog');
 d.className='music-dialog';d.setAttribute('aria-label','琴棋阁');
 d.innerHTML=`<section class="royal-music"><img class="music-scenery" src="assets/sketch-music-pavilion-v1.png" alt="临水皇家雅阁中，皇帝与青衣棋待诏对弈，左侧乐师抚琴，右侧侍从奉茶，窗外荷池垂柳相映" draggable="false"><header><div><small>一局清欢 · 琴韵入怀</small><h1>琴棋阁</h1></div><button data-exit aria-label="离开琴棋阁">离阁 ×</button></header><div class="music-notes" aria-hidden="true"><i>♪</i><i>♩</i><i>♫</i></div><div class="music-ripples" aria-hidden="true"><i></i><i></i></div><p class="music-result" role="status">正在展开雅阁画卷…</p></section>`;
 root.append(d);
 let cancelled=false;
 d.onclose=()=>{cancelled=true;d.remove();onClose?.();};
 d.querySelector('[data-exit]').onclick=()=>d.close();d.showModal();
 const status=d.querySelector('[role=status]');
 d.querySelector('img').decode().then(()=>{
  if(cancelled||!d.open)return;
  let result;
  try{result=palaceAction(initial,'music');}catch(error){status.textContent=error.message;return;}
  d.classList.add('is-finished');
   const gain=result.state.stats.charm-initial.stats.charm;
   const message=`魅力增加了 ${gain}，体力减少了 ${initial.stats.energy-result.state.stats.energy}。${result.state.stats.charm===500?'（魅力最高 500）':''}`;
   result.state.harem.history[0]=`第${initial.turn}旬：琴棋阁弈棋抚琴，${message}`;
   try{onCommit(result.state);status.textContent=message;}catch(error){status.textContent=error.message;}
 }).catch(()=>{if(!cancelled)status.textContent='雅阁画卷未能载入，请离阁后重试。';});
 return d;
}
