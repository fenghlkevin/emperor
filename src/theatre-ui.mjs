import {palaceAction} from './emperor.mjs';

const artwork={garden:'assets/scenes/theatre/sketch-theatre-garden-v2.png',dan:'assets/scenes/theatre/sketch-theatre-dan-v2.png',sheng:'assets/scenes/theatre/sketch-theatre-sheng-v2.png',eunuchs:'assets/scenes/theatre/sketch-theatre-eunuchs-v1.png',maids:'assets/scenes/theatre/sketch-theatre-maids-v1.png'};

export function openTheatre(initial,root,onCommit,onClose){
 const d=document.createElement('dialog');
 d.className='theatre-dialog';d.setAttribute('aria-label','百戏园');
 d.innerHTML=`<section class="royal-theatre palace-action-scene"><img class="theatre-scenery" src="${artwork.garden}" alt="金瓦朱柱的皇家戏园，园林水榭环绕，乐师分坐戏台两侧" draggable="false"><header><div><small>御苑笙歌 · 皇家戏园</small><h1>百戏园</h1></div></header><div class="theatre-performance" aria-label="生旦对戏，水袖传情"><div class="opera-player opera-dan"><img src="${artwork.dan}" alt="身着绣花戏服、头戴珠翠凤冠的旦角，舒袖演戏" draggable="false"></div><div class="opera-player opera-sheng"><img src="${artwork.sheng}" alt="身着青色戏服、手持折扇的生角，与旦角对戏" draggable="false"></div></div><div class="theatre-attendants attendants-left"><img src="${artwork.eunuchs}" alt="左侧两名内侍恭立候驾" draggable="false"></div><div class="theatre-attendants attendants-right"><img src="${artwork.maids}" alt="右侧两名身穿桃粉、浅碧短上衣和裙装的成年侍女，持茶盘与团扇侍候" draggable="false"></div><p class="theatre-result" role="status">戏班候场</p><button class="palace-scene-exit" data-exit aria-label="离开百戏园">离园 ×</button></section>`;
 root.append(d);
 let cancelled=false;
 d.onclose=()=>{cancelled=true;d.remove();onClose?.();};
 d.querySelector('[data-exit]').onclick=()=>d.close();
 d.showModal();
 const status=d.querySelector('[role="status"]');
 Promise.all([...d.querySelectorAll('img')].map(img=>img.decode())).then(()=>{
  if(cancelled||!d.open)return;
  d.classList.add('is-finished');
   d.querySelector('.theatre-performance').setAttribute('aria-label','演出已毕，生旦在台上谢幕');
   try{
    const result=palaceAction(initial,'theatre');
    const message=`才艺增加了 ${result.state.stats.talent-initial.stats.talent}，体力减少了 ${initial.stats.energy-result.state.stats.energy}。`;
    result.state.harem.history[0]=`第${initial.turn}旬：观赏百戏，${message}`;
    onCommit(result.state);status.textContent=message;
   }catch(error){status.textContent=error.message;}
   status.classList.add('is-settled');
 }).catch(()=>{if(!cancelled){status.textContent='戏园画卷未能载入，请离园后重试。';}});
 return d;
}
