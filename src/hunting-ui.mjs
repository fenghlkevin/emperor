import {createHunt,updateHunt,shootHunt,settleHunt,huntingReward,huntingBlock,HUNT_TARGETS,HUNT_SPECIES} from './hunting.mjs';
// Independent transparent sprite regions; the atlas has generous uneven padding.
const REGIONS=[[0,.29],[.29,.68],[.68,1],[0,.555],[.555,1]];
export function openHunting(initial,root,onCommit,onClose){
 const d=document.createElement('dialog');d.className='hunting-dialog';d.setAttribute('aria-label','巡游狩猎');
 d.innerHTML=`<section class="royal-hunt"><img class="hunt-landscape" src="assets/sketch-hunting-landscape-v1.png" alt="皇家猎苑，秋林溪涧与远山"><canvas class="hunt-targets" width="1600" height="1000" aria-label="猎场，移动瞄准，点击放箭"></canvas><img class="hunt-bow" src="assets/sketch-hunting-bow-v1.png" alt="" draggable="false"><div class="hunt-reticle" aria-hidden="true"></div><header class="hunt-header"><div class="hunt-heading"><h1>巡游狩猎</h1><small>皇家猎苑 · 秋林围猎</small></div><div class="hunt-hud"><span>剩余时间<b data-time>01:00</b></span><span>余箭<b data-arrows>30 / 30</b></span><span>猎获积分<b data-score>0</b></span></div><button data-exit>返回紫宸殿 ×</button></header><footer class="hunt-footer"><span>移动瞄准 · 点击放箭</span><span class="hunt-legend">野兔 1分 <i>／</i> 野猪 2分 <i>／</i> 麋鹿・老鹰・熊 3分</span><span>体力上限收益 <b data-gain>+0</b></span></footer><p class="hunt-feedback" role="status" aria-live="polite"></p><section class="hunt-panel" aria-label="围猎准备"><small>御驾亲临 · 皇家猎苑</small><h2>秋林试弓</h2><p>六十秒围猎，三十支羽箭。<br>猎物短暂现身，瞄准后点击放箭；空射也会消耗箭矢。</p><div class="hunt-rules"><span>体力上限<br><b>每 4 积分 +1</b></span><span>健康<br><b>+20 · 最高100</b></span><span>寿元<br><b>−8</b></span></div><p class="hunt-note">体力上限最高500，当前体力不变。<br>时辰影响猎物出现频率；开始后结束围猎同样结算。</p><button data-start disabled>正在准备弓马…</button><p class="hunt-error" role="alert"></p></section></section>`;
 root.append(d);d.showModal();
 const stage=d.querySelector('.royal-hunt'),canvas=d.querySelector('canvas'),ctx=canvas.getContext('2d'),panel=d.querySelector('.hunt-panel'),feedback=d.querySelector('.hunt-feedback'),reticle=d.querySelector('.hunt-reticle'),start=d.querySelector('[data-start]'),exit=d.querySelector('[data-exit]');
 let hunt=null,frame=0,closed=false,saved=false,pending=null,sprites=[],drawn=[],lastFeedback=0;
 const atlas=new Image();atlas.src='assets/sketch-hunting-animals-v1.png';
 const extraAtlas=new Image();extraAtlas.src='assets/sketch-hunting-eagle-bear-v1.png';
 const set=(key,value)=>d.querySelector(`[data-${key}]`).textContent=value;
 const notice=message=>{feedback.textContent=message;lastFeedback=performance.now();};
 function refresh(){if(!hunt)return;const seconds=Math.max(0,Math.ceil((hunt.deadline-performance.now())/1000));set('time',`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`);set('arrows',`${hunt.arrows} / 30`);set('score',hunt.score);set('gain','+'+huntingReward(initial.stats,hunt.score).maxEnergy);}
 function finish(){
  cancelAnimationFrame(frame);stage.classList.remove('is-hunting');reticle.style.opacity='0';
  if(!hunt||saved)return;
  hunt.ended=true;hunt.reason??='manual';
  try{
   pending??=settleHunt(initial,hunt);onCommit(pending.state);saved=true;
   const r=pending.reward;
   panel.hidden=false;panel.setAttribute('aria-label','围猎结算');
   panel.innerHTML=`<small>围猎已毕 · ${hunt.reason==='time'?'时辰已到':hunt.reason==='arrows'?'箭囊已空':'鸣金收猎'}</small><h2>御猎归来</h2><p>命中 <strong>${hunt.hits}</strong> 只 · 猎获积分 <strong>${hunt.score}</strong></p><div class="hunt-rules"><span>体力上限<b>+${r.maxEnergy}</b><small>${initial.stats.maxEnergy} → ${pending.state.stats.maxEnergy}</small></span><span>健康<b>+${r.health}</b><small>${initial.stats.health} → ${pending.state.stats.health}</small></span><span>寿元<b>−${r.life}</b><small>当前体力不变</small></span></div><p class="hunt-note">${pending.state.stats.life===0?'寿元已尽，本朝终结。':'狩猎成果已记入起居录，并已自动存档。'}</p><button data-return>返回宫城</button>`;
   panel.querySelector('[data-return]').onclick=()=>d.close();exit.textContent='返回宫城 ×';notice('围猎结算已保存');
  }catch(error){panel.hidden=false;panel.innerHTML='<small>围猎已结束</small><h2>结算尚未保存</h2><p role="alert"></p><button data-retry>重试保存</button>';panel.querySelector('p').textContent=error.message;panel.querySelector('button').onclick=finish;exit.textContent='重试保存';}
 }
 function renderTargets(){
  ctx.clearRect(0,0,1600,1000);drawn=[];
  for(const t of hunt.targets){
   const data=HUNT_TARGETS[t.index],kind=data.species,sprite=sprites[kind];
   // Keep the original 36 location distribution, adapted to the woodland floor.
   const [left,top,right,bottom]=data.rectangle;
   const h=HUNT_SPECIES[kind].height*(.75+(top+bottom)/2/336*.45),w=h*sprite.width/sprite.height;
   const x=Math.min(1600-w,Math.max(0,((left+right)/2/640)*1500+50-w/2));
   const y=kind===3?180+(top+bottom)/2/336*140:Math.min(870-h,Math.max(500-h,560+(top+bottom)/2/336*300-h));
   ctx.save();ctx.filter='brightness(1.28) contrast(1.16) saturate(.82)';ctx.shadowColor='#eaf7ff';ctx.shadowBlur=4;ctx.drawImage(sprite,x,y,w,h);ctx.restore();drawn.push({index:t.index,kind,x,y,w,h});
   ctx.font='bold 20px "Songti SC",serif';ctx.textAlign='center';
   const label=`${HUNT_SPECIES[kind].name} · ${data.score}分`,labelW=ctx.measureText(label).width+24,labelX=Math.min(1600-labelW/2-4,Math.max(labelW/2+4,x+w/2));
   ctx.fillStyle='#102b32e8';ctx.fillRect(labelX-labelW/2,y-38,labelW,30);ctx.strokeStyle='#d8edf4';ctx.lineWidth=1;ctx.strokeRect(labelX-labelW/2,y-38,labelW,30);ctx.fillStyle='#ffffff';ctx.fillText(label,labelX,y-16);
  }
 }
 function tick(now){if(closed||hunt.ended)return;updateHunt(hunt,now);refresh();renderTargets();if(now-lastFeedback>1200)feedback.textContent='';if(hunt.ended){finish();return;}frame=requestAnimationFrame(tick);}
 function leave(){if(!hunt||saved)d.close();else finish();}
 exit.onclick=leave;d.oncancel=e=>{e.preventDefault();leave();};
 d.onclose=()=>{closed=true;cancelAnimationFrame(frame);d.remove();onClose?.(Boolean(hunt));};
 canvas.onpointermove=e=>{const r=stage.getBoundingClientRect();reticle.style.left=`${e.clientX-r.left}px`;reticle.style.top=`${e.clientY-r.top}px`;reticle.style.opacity=hunt&&!hunt.ended?'1':'0';};
 canvas.onpointerleave=()=>reticle.style.opacity='0';
 canvas.onpointerdown=e=>{
  if(e.button!==0||!hunt||hunt.ended)return;
  const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*1600,y=(e.clientY-r.top)/r.height*1000;
  let index=null;
  // Check alpha at the exact displayed sprite pixel; transparent padding is a miss.
  for(const t of [...drawn].reverse())if(x>=t.x&&y>=t.y&&x<t.x+t.w&&y<t.y+t.h){const s=sprites[t.kind],sx=Math.floor((x-t.x)/t.w*s.width),sy=Math.floor((y-t.y)/t.h*s.height);if(s.getContext('2d').getImageData(sx,sy,1,1).data[3]!==0){index=t.index;break;}}
  const score=shootHunt(hunt,index,performance.now());if(score===null){finish();return;}
  notice(score?`命中！猎获积分 +${score}`:'此箭落空');stage.classList.remove('is-shooting');void stage.offsetWidth;stage.classList.add('is-shooting');refresh();renderTargets();if(hunt.ended)finish();
 };
 start.onclick=()=>{try{hunt=createHunt(initial,performance.now());panel.hidden=true;exit.textContent='结束狩猎 ×';stage.classList.add('is-hunting');notice('围猎开始，静候猎物现身');frame=requestAnimationFrame(tick);}catch(error){panel.querySelector('.hunt-error').textContent=error.message;}};
 Promise.all([atlas.decode(),extraAtlas.decode(),...Array.from(d.querySelectorAll('img'),img=>img.decode())]).then(()=>{
  if(closed)return;
  sprites=REGIONS.map(([from,to],kind)=>{
   const source=kind<3?atlas:extraAtlas;
   const cell=document.createElement('canvas');cell.width=Math.round((to-from)*source.width);cell.height=source.height;
   const c=cell.getContext('2d',{willReadFrequently:true});c.drawImage(source,Math.round(from*source.width),0,cell.width,source.height,0,0,cell.width,cell.height);
   const pixels=c.getImageData(0,0,cell.width,cell.height).data;let x0=cell.width,y0=cell.height,x1=0,y1=0;
   for(let y=0;y<cell.height;y++)for(let x=0;x<cell.width;x++)if(pixels[(y*cell.width+x)*4+3]>0){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
   if(x1<x0||y1<y0)throw Error('猎物画卷为空');const sprite=document.createElement('canvas');sprite.width=x1-x0+1;sprite.height=y1-y0+1;sprite.getContext('2d',{willReadFrequently:true}).drawImage(cell,x0,y0,sprite.width,sprite.height,0,0,sprite.width,sprite.height);return sprite;
  });
  const blocked=huntingBlock(initial);start.disabled=Boolean(blocked);start.textContent=blocked||'开始围猎';
 }).catch(()=>{if(!closed){start.textContent='猎苑画卷载入失败';panel.querySelector('.hunt-error').textContent='请返回紫宸殿后重试，尚未消耗任何属性。';}});
 return d;
}
