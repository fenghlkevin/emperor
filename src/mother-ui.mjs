import {palaceAction} from './emperor.mjs';
import {motherGreeting} from './mother.mjs';

export function openMother(initial,root,onCommit,onClose){
 const d=document.createElement('dialog');d.className='mother-dialog';d.setAttribute('aria-label','慈宁宫');
 d.innerHTML=`<section class="royal-mother"><img class="mother-scenery" src="assets/sketch-mother-v1.png" alt="慈宁宫内，年长太后端坐寿鹤屏风前，皇帝恭敬奉茶，内侍与成年侍女在两侧侍候" draggable="false"><header><div><small>晨昏定省 · 承欢膝下</small><h1>慈宁宫</h1></div><button data-exit aria-label="离开慈宁宫">离宫 ×</button></header><div class="mother-incense" aria-hidden="true"><i></i><i></i><i></i></div><p class="mother-greeting"></p><p class="mother-result" role="status">正在入殿…</p></section>`;
 root.append(d);let cancelled=false;
 d.onclose=()=>{cancelled=true;d.remove();onClose?.();};
 d.querySelector('[data-exit]').onclick=()=>d.close();d.showModal();
 const status=d.querySelector('[role=status]');
 d.querySelector('.mother-greeting').textContent=`${initial.mother?.alive===false?'内侍奏曰':'太后'}：“${motherGreeting(structuredClone(initial))}”`;
 d.querySelector('img').decode().then(()=>{
  if(cancelled||!d.open)return;
  let result;try{result=palaceAction(initial,'mother');}catch(error){status.textContent=error.message;return;}
  d.classList.add('is-finished');
   const message=`快乐增加了 ${result.state.stats.happiness-initial.stats.happiness}，体力减少了 ${initial.stats.energy-result.state.stats.energy}。`;
   result.state.harem.history[0]=`第${initial.turn}旬：慈宁宫奉茶问安，${message}`;
   try{onCommit(result.state);status.textContent=message;}catch(error){status.textContent=error.message;}
 }).catch(()=>{if(!cancelled)status.textContent='慈宁宫画卷未能载入，请离宫后重试。';});
 return d;
}
