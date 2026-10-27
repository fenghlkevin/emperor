import {observationReport,observe} from './observation.mjs';
export function paintCrowd(canvas,sprite,report){
 const ctx=canvas.getContext('2d');canvas.width=1536;canvas.height=1024;
 ctx.clearRect(0,0,1536,1024);
 // Each painted figure represents a fixed-size group. Rows widen toward the balcony.
 const visible=report.count?Math.min(720,Math.max(8,Math.round(report.count/8))):0;
 const rows=30,cols=24;
 let drawn=0;
 for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
  // Evenly distributed occupancy gives sparse assemblies gaps, rather than a solid block.
  if(Math.floor(((row*cols+col)+1)*visible/(rows*cols))===Math.floor((row*cols+col)*visible/(rows*cols)))continue;
  const depth=row/(rows-1),y=320+depth*390,spread=135+depth*385;
  const x=768+((col+.5)/cols-.5)*spread;
  const size=10+depth*23;
  ctx.save();ctx.filter=`hue-rotate(${(col*47+row*23)%65-25}deg)`;
  ctx.drawImage(sprite,x-size/2,y-size*.65,size,size);ctx.restore();drawn++;
 }
 canvas.dataset.figures=drawn;canvas.setAttribute('aria-label',`御街朝拜 ${report.count} 人，人群按比例绘制`);
}
export function openObservation(initial,root,onCommit,onClose){
 const report=observationReport(initial),d=document.createElement('dialog');
 d.className='martial-dialog observation-dialog';d.setAttribute('aria-label','观景台');
 d.innerHTML=`<section class="royal-martial royal-observation palace-action-scene"><img class="martial-scenery" src="assets/scenes/observation/sketch-observation-v1.png" alt="皇帝登临南门城台，御街沿城楼向远方延伸" draggable="false"><canvas class="observation-crowd" role="img"></canvas><header><div><small>南门登临 · 万民瞻仰</small><h1>观景台</h1></div></header><aside class="observation-report"><small>御街朝仪</small><h2>${report.tier}</h2><p><b>${report.count.toLocaleString('zh-CN')}</b> 人朝拜</p><span>国势 ${report.score} / 100</span><details><summary>国势详情</summary>${report.factors.map(f=>`<div>${f.name}<b>${f.value}</b><small>占 ${Math.round(f.weight*100)}%</small></div>`).join('')}<p>本旬人数固定，人群按比例呈现。</p></details></aside><p class="martial-result" role="status">正在展开御街画卷…</p><button class="palace-scene-exit" data-exit>离台 ×</button></section>`;
 root.append(d);let cancelled=false;
 d.onclose=()=>{cancelled=true;d.remove();onClose?.();};d.querySelector('[data-exit]').onclick=()=>d.close();d.showModal();
 const sprite=new Image();sprite.src='assets/scenes/observation/sketch-observation-commoner-v1.png';
 Promise.all([d.querySelector('img').decode(),sprite.decode()]).then(()=>{
  if(cancelled||!d.open)return;
  paintCrowd(d.querySelector('canvas'),sprite,report);
  try{const result=observe(initial);onCommit(result.state);d.querySelector('[role=status]').textContent=result.message;}catch(error){d.querySelector('[role=status]').textContent=error.message;}
 }).catch(()=>{if(!cancelled)d.querySelector('[role=status]').textContent='御街画卷载入失败，请离台后重试。';});
 return d;
}
