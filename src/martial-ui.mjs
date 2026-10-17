import {palaceAction} from './emperor.mjs';

export function openMartial(initial,root,onCommit,onClose){
 const d=document.createElement('dialog');
 d.className='martial-dialog';d.setAttribute('aria-label','武道场');
 d.innerHTML=`<section class="royal-martial"><img class="martial-scenery" src="assets/sketch-martial-court-v3.png" alt="开阔石板演武场，两侧陈列兵器与木桩，左侧内侍恭候，右侧侍女持茶盘与巾帕侍候" draggable="false"><header><div><small>御苑演武 · 习武强身</small><h1>武道场</h1></div><button data-exit aria-label="离开武道场">离场 ×</button></header><div class="martial-actor"><img src="assets/sketch-martial-sparring-v2.png" alt="皇帝身穿深青色金边练功服，与年轻无须的红衣侍卫面对面徒手对打，抬臂格挡来拳；两人弓步落地，脚下有柔和阴影" draggable="false"></div><p class="martial-result" role="status">正在展开演武画卷…</p></section>`;
 root.append(d);let cancelled=false;
 d.onclose=()=>{cancelled=true;d.remove();onClose?.();};
 d.querySelector('[data-exit]').onclick=()=>d.close();d.showModal();
 const status=d.querySelector('[role=status]');
 Promise.all([...d.querySelectorAll('img')].map(img=>img.decode())).then(()=>{
  if(cancelled||!d.open)return;
  let result;try{result=palaceAction(initial,'martial');}catch(error){status.textContent=error.message;return;}
  d.classList.add('is-finished');
   const martial=result.state.stats.martial-initial.stats.martial;
   const message=`武术增加了 ${martial}，体力减少了 ${initial.stats.energy-result.state.stats.energy}。${result.state.stats.martial===500?'（武术最高 500）':''}`;
   result.state.harem.history[0]=`第${initial.turn}旬：武道场习武，${message}`;
   try{onCommit(result.state);status.textContent=message;}catch(error){status.textContent=error.message;}
 }).catch(()=>{if(!cancelled)status.textContent='演武画卷未能载入，请离场后重试。';});
 return d;
}
