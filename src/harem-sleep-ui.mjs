import {palaceAction} from './emperor.mjs';
import {portraitCanvas,paintPortraits} from './beauty-raster-portrait.mjs';

// Harem sleep advances only when the player chooses to leave the chamber.
export function openHaremSleep(initial,root,onCommit,onClose,options){
 const snapshot=structuredClone(initial),d=document.createElement('dialog');
 const person=options.kind==='company'?snapshot.harem.members.find(p=>p.id===options.payload?.id):null;
 d.className='dragon-dialog harem-sleep-dialog';d.setAttribute('aria-label','后宫寝阁');
 d.innerHTML=`<section class="harem-sleep-scene"><img class="harem-sleep-scenery" src="assets/scenes/harem/sketch-harem-bedchamber.png" alt="后宫寝室彩绘，轻纱围绕雕花卧榻，宫灯与月窗相映" draggable="false"><header><div><small>后宫安寝 · 帷暖灯柔</small><h1>后宫寝阁</h1><p>${person?'佳人相伴 · 共度良宵':'帷帐已备 · 静候佳人'}</p></div></header><div class="harem-sleep-company">${person?portraitCanvas(person).replace('<canvas','<canvas data-transparent="true"'):''}</div><div class="harem-sleep-copy"><small>一帘幽梦 · 满室灯香</small><h2>${person?'佳人相伴':'今宵待卿'}</h2><p>${person?'卸下朝堂纷扰，且在此安歇。':'内侍已奉旨安排，佳人将于晨起相见。'}</p><span>点击底部离殿，即刻完成安寝</span></div><button class="harem-sleep-status" data-exit aria-live="polite">离殿 · 晨起 ×</button></section>`;
 root.append(d);let settled=false,finishing=false,pendingResult;
 const status=document.createElement('p');status.className='harem-sleep-effects';status.setAttribute('role','status');
 d.querySelector('[data-exit]').before(status);
 const prepare=()=>pendingResult??=palaceAction(snapshot,options.kind,options.payload??{});
 try{
  const after=prepare().state.stats,before=snapshot.stats;
  status.textContent=`晨起结算：体力恢复 ${after.energy-before.energy}，快乐增加 ${after.happiness-before.happiness}，寿元减少 ${before.life-after.life}。`;
 }catch(error){status.textContent=error.message;}
 const finish=()=>{
  if(settled||finishing)return;finishing=true;
  try{
   const result=prepare();
   onCommit(result.state);settled=true;
   options.onSettled?.(result.state,d);
   if(d.open)d.close();
  }catch(error){status.textContent=error.message;}
  finally{finishing=false;}
 };
 d.querySelector('[data-exit]').onclick=finish;
 d.oncancel=e=>{e.preventDefault();finish();};
 d.onclose=()=>{d.remove();onClose?.();};
 d.showModal();if(person)paintPortraits(d,[person]);return d;
}
