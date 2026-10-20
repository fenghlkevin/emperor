import {palaceAction} from './emperor.mjs';

export function openStudy(initial,root,onCommit,onClose){
 const d=document.createElement('dialog');
 d.className='study-dialog';d.setAttribute('aria-label','御书房');
 d.innerHTML=`<section class="royal-study palace-action-scene"><img class="study-scenery" src="assets/scenes/study/sketch-study-v3.png" alt="御书房内书架环列、御座背靠山水屏风，侧窗采光，皇帝坐于御案后研读典籍，两名短衣成年侍女与内侍在御案两侧候驾" draggable="false"><header><div><small>翰墨凝香 · 静心修学</small><h1>御书房</h1></div></header><div class="study-page" aria-hidden="true"></div><div class="study-sunbeam" aria-hidden="true"></div><p class="study-result" role="status">正在展开书卷…</p><button class="palace-scene-exit" data-exit aria-label="离开御书房">离室 ×</button></section>`;
 root.append(d);
 let cancelled=false;
 d.onclose=()=>{cancelled=true;d.remove();onClose?.();};
 d.querySelector('[data-exit]').onclick=()=>d.close();
 d.showModal();
 const status=d.querySelector('[role=status]');
 Promise.all([...d.querySelectorAll('img')].map(img=>img.decode())).then(()=>{
  if(cancelled||!d.open)return;
  let result;
  try{result=palaceAction(initial,'study');}
  catch(error){status.textContent=error.message;return;}
  d.classList.add('is-finished');
   const gain=result.state.stats.wisdom-initial.stats.wisdom;
   const message=`智慧增加了 ${gain}，体力减少了 ${initial.stats.energy-result.state.stats.energy}。${result.state.stats.wisdom===500?'（智慧最高 500）':''}`;
   result.state.harem.history[0]=`第${initial.turn}旬：御书房研读典籍，${message}`;
   try{onCommit(result.state);status.textContent=message;}
   catch(error){status.textContent=error.message;}
 }).catch(()=>{if(!cancelled)status.textContent='书房画卷未能载入，请离室后重试。';});
 return d;
}
