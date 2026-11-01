import {dismissSceneOnClick} from './scene-dismiss.mjs';
import {commitOperation} from './operation-result.mjs';
import {PALACE_ATTENDANT_ART} from './palace-character-art.mjs';
import {openHaremSleep} from './harem-sleep-ui.mjs';
import {animateDragonBreath} from './dragon-breath.mjs';
import {palaceAction} from './emperor.mjs';

const artwork={hall:'assets/scenes/dragon/sketch-dragon-hall.png',attendants:PALACE_ATTENDANT_ART.dragon};
export function openDragon(initial,root,onCommit,onClose,options={}){
 if(['arrange','company'].includes(options.kind))return openHaremSleep(initial,root,onCommit,onClose,options);
 const snapshot=structuredClone(initial),d=document.createElement('dialog');
 d.className='dragon-dialog';d.setAttribute('aria-label','金龙殿');
 d.innerHTML=`<section class="royal-dragon palace-action-scene"><img class="dragon-scenery" src="${artwork.hall}" alt="彩绘金龙殿，帷帐御榻上的皇帝合目安寝，窗外月色与宫灯相映" draggable="false"><header><div><small>内廷安寝 · 天子寝殿</small><h1>金龙殿</h1></div></header><div class="dragon-rest" aria-label="皇帝自然呼吸，胸腹与锦衾缓缓起伏"><canvas class="dragon-breath" aria-hidden="true"></canvas></div>${['内侍，恭立候驾','成年侍女，粉色交领绣衣与象牙长裙，双手奉茶','成年侍女，浅碧花绣上衣与象牙长裙，正面持团扇','成年侍女，象牙淡紫交领宽袖绣衣与长裙，正面轻拢衣袖'].map((label,i)=>`<div class="dragon-person dragon-person-${i}" role="img" aria-label="${label}"><img src="${artwork.attendants}" alt="" aria-hidden="true" draggable="false"></div>`).join('')}<p class="dragon-result" role="status">寝殿备榻 · 静候安寝</p></section>`;
 root.append(d);let timer,stopBreath=()=>{},cancelled=false,settled=false;
 const status=d.querySelector('[role=status]');
 const settle=()=>{
  if(settled||cancelled)return;
  try{
   const result=palaceAction(snapshot,options.kind??'sleep',options.payload??{});
   const saved=commitOperation(onCommit,result.state);settled=true;
   status.textContent=result.message;status.classList.add('is-settled');
   d.dataset.settled='true';d.querySelector('.dragon-rest').setAttribute('aria-label','安寝已毕');
   options.onSettled?.(saved,d);
  }catch(error){
   status.textContent=error.message;
   if(!d.querySelector('[data-rest-retry]')){
    const retry=document.createElement('button');retry.dataset.restRetry='';retry.textContent='重试安寝';retry.className='dragon-rest-retry';
    retry.onclick=()=>{retry.remove();settle();};status.after(retry);
   }
  }
 };
 d.onclose=()=>{cancelled=true;clearTimeout(timer);stopBreath();d.remove();onClose?.();};
 dismissSceneOnClick(d);d.showModal();
 // Restoration is a saved action, independent of decorative image/animation timing.
 settle();
 Promise.all([...d.querySelectorAll('img')].map(img=>img.decode())).then(()=>{
  if(cancelled||!d.open)return;
  const sheet=d.querySelector('.dragon-person img');d.style.setProperty('--dragon-person-ratio',String(sheet.naturalWidth/4/sheet.naturalHeight));
  try{stopBreath=animateDragonBreath(d.querySelector('.dragon-breath'),d.querySelector('.dragon-scenery'));}catch{/* Art must never block recovery. */}
  d.classList.add('is-resting');
  timer=setTimeout(()=>{if(cancelled||!d.open)return;stopBreath();d.classList.replace('is-resting','is-finished');},3000);
 }).catch(()=>{if(!cancelled&&settled)status.textContent+=' 寝殿画卷暂未载入，调养已经保存。';});
 return d;
}
