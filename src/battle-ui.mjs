import {attackMotion,hitMotion,deathMotion} from './battle-motion.mjs';
import {startBattleIdle} from './battle-idle.mjs';
import {piece,playSprite,attackDuration,spriteKind} from './battle-sprites.mjs';
import {active,alive,reachable,movementPath,attackOptions,attackPreview,isRanged,shootingRange,movement,facingOf,battleResultText,aiAction,troopNames,COLS,ROWS} from './battle.mjs';
import {advanceWar,finishWar} from './war.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const point=(x,y)=>[58+x*76+(y%2)*38,116+y*54];
function hex(x,y){const [a,b]=point(x,y);return [[0,-36],[38,-18],[38,18],[0,36],[-38,18],[-38,-18]].map(([c,d])=>`${a+c},${b+d}`).join(' ');}
export function drawBattle(dialog,getState,commit,onFinish){
 let auto=false,timer=null,disposed=false,busy=false,notice='',retreat=false,rate=1,grid=true,settling=false,settlementError=false;
 let stopIdle=()=>{};
 const animations=new Set(),spriteStops=new Set();
 const stop=()=>{disposed=true;stopIdle();clearTimeout(timer);for(const stopSprite of spriteStops)stopSprite();spriteStops.clear();for(const a of animations)a.cancel();animations.clear();dialog.removeEventListener('keydown',onKey);};
 dialog.addEventListener('close',stop,{once:true});dialog.addEventListener('keydown',onKey);
 const paidCommander=()=>!!getState().domestic.war.battle?.command.commanderSquad;
 const resource=u=>u.commander&&!paidCommander()?'气血':'兵力';
 const unitElement=id=>dialog.querySelector(`[data-unit="${id}"]`);
 const duration=ms=>matchMedia('(prefers-reduced-motion: reduce)').matches?0:ms/(rate*(auto?2.5:1));
 async function animate(el,frames,ms,extra={}){if(!el||disposed)return;const a=el.animate(frames,{duration:duration(ms),easing:'ease-in-out',...extra});animations.add(a);try{await a.finished;}catch{}finally{animations.delete(a);a.cancel();}}
 function setBusy(value){busy=value;dialog.dataset.busy=String(value);dialog.querySelectorAll('[data-action],[data-retreat]').forEach(e=>{if(value)e.disabled=true;});}
 async function walk(u,path){
  if(!path?.length)return;const el=unitElement(u.id);if(!el)return;el.classList.add('walking');
  const coordinates=[point(u.x,u.y),...path.map(p=>point(p.x,p.y))];
  const art=el.querySelector('.painted-unit');if(art&&path.at(-1).x!==u.x)art.setAttribute('transform',`scale(${path.at(-1).x<u.x?-1:1},1)`);const stopSprite=playSprite(el.querySelector('.unit-sprite'),'walk',rate*(auto?2.5:1));spriteStops.add(stopSprite);
  await animate(el,coordinates.map(([x,y])=>({transform:`translate(${x}px,${y}px)`})),Math.max(1,path.length)*190,{easing:'linear',fill:'forwards'});
  const [x,y]=coordinates.at(-1);el.setAttribute('transform',`translate(${x},${y})`);el.classList.remove('walking');stopSprite();spriteStops.delete(stopSprite);
 }
 async function strike(a,t,killed,retaliation=false,ranged=false){
  if(disposed)return;const el=unitElement(a.id),target=unitElement(t.id),[x,y]=point(a.x,a.y),[tx,ty]=point(t.x,t.y),dx=tx-x,dy=ty-y;
  const kind=spriteKind(a),ms=attackDuration(a),stopSprite=playSprite(el?.querySelector('.unit-sprite'),isRanged(a)&&!ranged?'melee':'attack',rate*(auto?2.5:1));spriteStops.add(stopSprite);
  el?.querySelector('.painted-unit')?.setAttribute('transform',`scale(${tx<x?-1:1},1)`);
  const lunge=animate(el,(ranged?[{transform:'translateY(0px)'},{transform:'translateY(-2px)',offset:.42},{transform:'translateY(0px)'}]:attackMotion(kind,dx,dy)).map(frame=>({...frame,transform:`translate(${x}px,${y}px) ${frame.transform}`})),ms,{easing:'linear'});
  await animate(target,[{opacity:1},{opacity:1}],ms*(ranged?.625:.42));
  if(ranged&&!disposed){
   const arrow=document.createElementNS('http://www.w3.org/2000/svg','g');arrow.dataset.projectile=kind;
   arrow.innerHTML='<path d="M-22,0 L12,0 M6,-4 L12,0 L6,4 M-20,-3 L-16,0 L-20,3" fill="none" stroke="#d7c9a3" stroke-width="2"/>';
   dialog.querySelector('.battle-field>svg').append(arrow);
   try{const angle=Math.atan2(dy,dx)*180/Math.PI;await animate(arrow,[{transform:`translate(${x}px,${y-45}px) rotate(${angle}deg)`},{transform:`translate(${tx}px,${ty-28}px) rotate(${angle}deg)`}],180,{easing:'linear'});}finally{arrow.remove();}
  }
  if(disposed)return;const remaining=Math.max(0,t.count-killed),dead=remaining===0,direction=tx<x?-1:1,body=target?.querySelector('.unit-art'),mounted=target?.querySelector('.unit-idle')?.dataset.idleKind==='mounted';
  if(target){target.dataset.reaction=dead?'death':'hit';target.querySelector('.unit-idle')?.removeAttribute('transform');target.querySelector('text').textContent=`${t.commander?'将 ':''}${remaining}`;target.querySelector('.unit-health')?.setAttribute('width',54*remaining/t.initial);}
  const svg=dialog.querySelector('.battle-field>svg'),ns='http://www.w3.org/2000/svg',text=document.createElementNS(ns,'text'),fx=document.createElementNS(ns,'g');
  text.setAttribute('x',tx);text.setAttribute('y',ty-75);text.setAttribute('class','battle-damage');text.textContent=`${retaliation?'反击 ':''}−${killed}${dead?' · 溃灭':''}`;svg.append(text);
  fx.setAttribute('transform',`translate(${tx},${ty-28}) scale(${direction},1)`);fx.setAttribute('class',`battle-impact ${kind}`);fx.dataset.effect=kind;
  fx.innerHTML=ranged?'<path d="M-16,0 L12,0 M-4,-10 L2,-3 M-4,10 L2,3 M8,-9 L4,-3 M8,9 L4,3"/>':kind==='spears'?'<path d="M-70,8 L40,-8 M-12,-14 L14,14 M-12,14 L14,-14"/>':kind==='infantry'?'<path d="M-36,28 Q45,12 28,-44 M-28,33 Q55,8 32,-48"/>':'<path d="M-65,18 L35,-12 M-60,28 L22,2"/><ellipse rx="40" ry="12" cy="34"/><circle cx="-30" cy="28" r="8"/><circle cx="-12" cy="36" r="6"/>';
  svg.append(fx);
  const reaction=async()=>{
   await animate(body,hitMotion(direction,mounted),dead?140:280);
   if(dead&&!disposed){await animate(body,deathMotion(direction,mounted),mounted?620:540,{easing:'ease-in',fill:'forwards'});if(!disposed)target?.remove();}
  };
  try{await Promise.all([lunge,reaction(),animate(fx,[{opacity:0,scale:.7},{opacity:1,scale:1,offset:.16},{opacity:0,scale:1.15}],280),animate(text,[{transform:'translateY(0px)',opacity:1},{transform:'translateY(-8px)',opacity:1,offset:.2},{transform:'translateY(-34px)',opacity:0}],480)]);}
  finally{text.remove();fx.remove();stopSprite();spriteStops.delete(stopSprite);if(target)delete target.dataset.reaction;}
 }
 async function step(action){
  if(disposed||busy)return;clearTimeout(timer);const before=getState().domestic.war.battle,u=active(before);
  try{
   const next=advanceWar(getState(),action),after=next.domestic.war.battle,v=after.units.find(t=>t.id===u.id);
   // Save the complete legal action before playback; closing mid-animation resumes safely.
   commit(next);setBusy(true);notice='';retreat=false;
   if(action.type==='move'||action.type==='attack'){
    const path=movementPath(before,u,v.x,v.y);await walk(u,path);
    if(action.type==='attack'&&!disposed){const t=before.units.find(t=>t.id===action.target),afterTarget=after.units.find(s=>s.id===t.id);await strike(v,t,t.count-afterTarget.count,false,attackPreview(before,u,t,action.from)?.mode==='ranged');if(v.count<u.count)await strike({...afterTarget,count:t.count},{...v,count:u.count},u.count-v.count,true);}
   }else if(action.type==='defend')await animate(unitElement(u.id),[{filter:'drop-shadow(0 0 0px #bcd9dc)'},{filter:'drop-shadow(0 0 16px #bcd9dc)'},{filter:'drop-shadow(0 0 0px #bcd9dc)'}],350);
   if(disposed)return;setBusy(false);draw();
  }catch(e){if(disposed)return;auto=false;setBusy(false);notice=e.message;draw();}
 }
 function inspect(b,u,t){
  const p=u&&t.side!==u.side?attackPreview(b,u,t):null;
  return `<strong>${esc(t.name)} · ${t.side==='home'?'我军':'敌军'}</strong><span>${resource(t)} ${t.count} / ${t.initial}　移动 ${movement(t)}${shootingRange(t)?`　射程 ${shootingRange(t)}`:''}　训练 ${t.training}</span><span>${t.defending?'防御 +20%　':''}${t.retaliated?'本回合反击已用':'可反击一次'}${t.waited?'　已等待':''}</span>${t.side!==u?.side?`<b>${p?`预计${resource(t)==='气血'?'损失气血':'杀伤'} ${p.killed} · ${p.aspect}${p.directionMultiplier>1?' +'+Math.round((p.directionMultiplier-1)*100)+'%':''}${p.movedShot?' · 移动射击衰减':''}${p.mobileShot?' · 骑射无移动减伤':''}${p.desertBonus?' · 沙地 +20%':''}${p.retaliationSuppression<1?' · 本次反击减半':''}${p.armorPiercing?' · 穿甲':''}${p.commanderMultiplier>1?' · 主将 +20%':''}${p.chargeMultiplier>1?' · 冲锋 +30%':''} · ${p.canRetaliate?`反击损失 ${p.retaliation}`:'无反击'}${p.counter>1?' · 兵种克制':p.counter<1?' · 兵种被克':''}`:'超出攻击范围'}</b>`:''}`;
 }
 function onKey(e){if(disposed||busy||e.ctrlKey||e.metaKey||e.altKey||/INPUT|SELECT|TEXTAREA/.test(e.target.tagName))return;const key=e.key.toLowerCase(),selector={w:'[data-action="wait"]',d:'[data-action="defend"]',e:'[data-action="end"]'}[key];if(selector){const button=dialog.querySelector(selector);if(button&&!button.disabled){e.preventDefault();button.click();}}}
 function settle(){if(settling||disposed)return;settling=true;try{const result=finishWar(getState());commit(result.state);stop();dialog.classList.remove('battle-dialog');onFinish(result.receipt);}catch(e){settling=false;settlementError=true;notice=e.message;draw();}}
 function draw(){
  if(disposed)return;stopIdle();clearTimeout(timer);const b=getState().domestic.war.battle;if(b.result&&!settlementError){settle();return;}const u=active(b),isHome=u?.side==='home',manual=!b.result&&isHome&&!auto,cells=manual?reachable(b,u):[],targets=manual?attackOptions(b,u):[],attackable=new Set(targets.map(o=>o.targetId));
  dialog.classList.add('battle-dialog');dialog.setAttribute('aria-label','六角格战场');dialog.dataset.busy='false';
  const hint=b.result?battleResultText(b):auto?'全军自动作战中，可随时停止。':!isHome?'敌军正在行动…':u.moved?`已移动 · ${targets.length?'点击红色敌军攻击，或结束行动':'无可攻击敌军，请结束行动或防御'}`:`点击绿色格移动 · 红色敌军可攻击或射击（${targets.length}队）`;
  const counts=side=>b.units.filter(t=>alive(t)&&t.side===side&&(!t.commander||paidCommander())).reduce((n,t)=>n+t.count,0);
  dialog.innerHTML=`<header class="battle-header"><div><h1>沙场交锋</h1><span>出征 ${esc(b.targetName)}${b.field?` · ${esc(b.field.terrain)}${b.field.surface==='desert'?' · 沙地':''} · 城防+${Math.round((b.field.defense-1)*100)}%`:''}</span></div><div class="battle-round"><b>第 ${b.round} 回合</b><small>我军 ${counts('home')} · 敌军 ${counts('enemy')}</small></div><div class="battle-settings"><label>动画<select data-battle-speed aria-label="战斗动画速度"><option value="1" ${rate===1?'selected':''}>正常</option><option value="2" ${rate===2?'selected':''}>快速</option><option value="4" ${rate===4?'selected':''}>极速</option></select></label><button data-grid aria-pressed="${grid}">网格</button><button data-save-close>保存离开</button></div></header><div class="battle-field ${grid?'':'hide-grid'}"><svg viewBox="0 0 1090 640" role="group" aria-label="六角格战场，我军在左，敌军在右"><defs><filter id="piece-shadow"><feDropShadow dx="0" dy="3" stdDeviation="2" flood-opacity=".3"/></filter><marker id="battle-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 Z" fill="#f6dfa0"/></marker></defs>${Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>`<polygon class="battle-hex ${cells.some(p=>p.x===x&&p.y===y)?'reachable':''} ${u?.x===x&&u?.y===y&&!b.result?'current':''} ${b.units.some(t=>t.x===x&&t.y===y&&attackable.has(t.id))?'attack-range':''}" points="${hex(x,y)}" data-cell="${x},${y}"/>`).join('')).join('')}<g class="battle-path" data-path></g>${b.units.filter(alive).sort((a,c)=>a.y-c.y).map(t=>{
   const [x,y]=point(t.x,t.y),canAttack=attackable.has(t.id);
   return `<g class="battle-piece ${t.side} ${u?.id===t.id&&!b.result?'selected':''} ${canAttack?'attackable':''}" transform="translate(${x},${y})" data-unit="${t.id}" role="button" tabindex="0" aria-label="${esc(t.name)}，${resource(t)}${t.count}${canAttack?'，可攻击':''}"><title>${esc(t.name)} · ${esc(t.general?.name??'敌将')} · ${t.count}${resource(t)==='气血'?'气血':'人'}${canAttack?' · 点击攻击':''}</title><ellipse class="unit-ring" cy="24" rx="33" ry="13"/><g class="unit-art" filter="url(#piece-shadow)">${piece(t)}</g><path class="unit-facing" d="M34,-5 L44,0 L34,5" transform="rotate(${-facingOf(t)*60})"><title>朝向：${['右','右上','左上','左','左下','右下'][facingOf(t)]}</title></path><rect x="-29" y="29" width="58" height="22" rx="3" fill="${t.side==='home'?'#d8e5df':'#ead6c4'}" stroke="${t.side==='home'?'#3d736d':'#95564b'}"/><text y="45" text-anchor="middle">${t.commander?'将 ':''}${t.count}</text><rect class="unit-health-track" x="-27" y="53" width="54" height="4"/><rect class="unit-health ${t.side}" x="-27" y="53" width="${54*t.count/t.initial}" height="4"/>${canAttack?'<text class="attack-icon" x="29" y="-37">⚔</text>':''}${t.defending?'<text class="unit-badge" x="-35" y="-38">盾</text>':t.waited?'<text class="unit-badge" x="-35" y="-38">待</text>':''}</g>`;
  }).join('')}</svg><div class="battle-legend"><span>● 可移动</span><span>⚔ 可攻击</span><span>◎ 当前部队 · 金箭头为朝向</span></div><div class="battle-inspector" data-inspector hidden></div><div class="battle-message" role="status">${esc(notice||(b.result?battleResultText(b):b.log.at(-1)))}</div></div><footer class="battle-controls"><div class="battle-selection"><strong>${b.result?(b.result==='victory'?'我军获胜':'我军战败'):esc(u?.name)}</strong><span>${b.result?'战果待结算':`${esc(u?.general?.name??'敌将')} · ${u?resource(u):'兵力'} ${u?.count??0} · ${u?.moved?'移动已用':`移动 ${movement(u)}格`}`}</span></div><div class="battle-center"><p data-battle-hint>${esc(hint)}</p><div class="battle-order"><small>行动顺序</small>${(b.result?[]:b.order.slice(b.cursor)).filter(id=>b.units.some(t=>t.id===id&&alive(t))).map(id=>{const t=b.units.find(t=>t.id===id);return `<span class="${t.side} ${id===u?.id?'now':''}" data-order-unit="${id}" title="${esc(t.name)} · ${t.count} · 速度${movement(t)}${t.waited?' · 等待阶段':''}">${t.commander?'将':troopNames[t.kind][0]}<small>${t.count}</small>${t.waited?'<i>待</i>':''}</span>`;}).join('')}</div></div><div class="battle-buttons">${b.result?'<button class="primary" data-settle>结算战果</button>':retreat?'<span>确认全军撤退？</span><button data-retreat-confirm>确认撤退</button><button data-cancel-retreat>取消</button>':`<button data-action="end" ${!manual?'disabled':''} title="结束本队行动（E）">结束行动</button><button data-action="wait" ${!manual||u?.waited||u?.moved?'disabled':''} title="本回合稍后行动（W）">等待</button><button data-action="defend" ${!manual?'disabled':''} title="防御提高20%，结束行动（D）">防御</button><button data-auto>${auto?'停止自动':'自动战斗'}</button><button data-retreat ${!manual?'disabled':''}>撤退</button>`}</div></footer><details class="battle-log"><summary>战场军报 · 规则</summary><p>任一方全军主将部队被击溃或撤退，该方立即战败，剩余部队停止交战。侧击伤害+20%，背击+40%；主将亲卫攻击+20%。金色箭头表示朝向，移动后沿末段朝向，攻击后面向目标，受击后转向来敌。每队先移动一次，再攻击相邻敌军；也可直接点击红色敌军自动接近攻击。移动后可结束行动或防御，不能再次移动或等待。按移动速度由快至慢行动；等待阶段由慢至快。防御使本回合防御提高20%。每队每回合仅相邻反击一次，消灭目标可免反击。弓射程4、弩射程3；移动射击伤害分别70%、60%，贴身敌军压制射击，近战分别40%、35%。远程无侧背击加成；弩可穿透部分重骑护甲。${b.command.kitVersion===1?'长枪克轻重骑，刀盾克长枪；重骑移动3格，攻防较强，连续直行至少2格并沿冲锋方向攻击可获伤害+30%。':'马兵克步兵、步兵克枪兵、枪兵克马兵。'}W 等待 · D 防御 · E 结束行动。</p>${b.log.slice(-8).map(l=>`<p>${esc(l)}</p>`).join('')}</details>`;
  if(!b.result)stopIdle=startBattleIdle(dialog);
  const overlay=dialog.querySelector('[data-path]'),inspector=dialog.querySelector('[data-inspector]');
  function showPath(path,attack=false){if(busy)return;overlay.innerHTML=path?.length?`<polyline class="${attack?'attack':''}" points="${[{x:u.x,y:u.y},...path].map(p=>point(p.x,p.y).join(',')).join(' ')}" marker-end="url(#battle-arrow)"/>${path.map((p,i)=>{const [x,y]=point(p.x,p.y);return `<circle cx="${x}" cy="${y}" r="9"/><text x="${x}" y="${y+4}">${i+1}</text>`;}).join('')}`:'';}
  function showUnit(t){if(busy)return;inspector.innerHTML=inspect(b,u,t);inspector.hidden=false;dialog.querySelectorAll('[data-unit]').forEach(e=>e.classList.toggle('inspected',e.dataset.unit===t.id));if(manual){const forecast=t.side!==u.side?attackPreview(b,u,t):null;showPath(forecast?.path,true);}}
  function clearHover(){if(busy)return;overlay.innerHTML='';inspector.hidden=true;dialog.querySelectorAll('.inspected').forEach(e=>e.classList.remove('inspected'));}
  dialog.querySelector('[data-save-close]').onclick=()=>dialog.close();
  dialog.querySelector('[data-battle-speed]').onchange=e=>{rate=Number(e.target.value);};
  dialog.querySelector('[data-grid]').onclick=()=>{grid=!grid;dialog.querySelector('.battle-field').classList.toggle('hide-grid',!grid);dialog.querySelector('[data-grid]').setAttribute('aria-pressed',String(grid));};
  dialog.querySelectorAll('[data-cell]').forEach(e=>{
   const [x,y]=e.dataset.cell.split(',').map(Number),cell=cells.find(p=>p.x===x&&p.y===y);
   e.onmouseenter=()=>{if(manual&&cell&&!busy){inspector.hidden=true;showPath(cell.path);dialog.querySelector('[data-battle-hint]').textContent=`移动 ${cell.d} / ${movement(u)} 格 · 到达后可攻击范围内敌军`;}};
   e.onmouseleave=()=>{if(!busy){clearHover();dialog.querySelector('[data-battle-hint]').textContent=hint;}};
   e.onclick=()=>{if(manual&&!busy){const target=b.units.find(t=>alive(t)&&t.x===x&&t.y===y&&attackable.has(t.id));if(target)step({type:'attack',target:target.id});else if(cell)step({type:'move',x,y});}};
  });
  dialog.querySelectorAll('[data-unit]').forEach(e=>{
   const t=b.units.find(t=>t.id===e.dataset.unit),attack=()=>{if(busy)return;if(manual&&attackable.has(t.id))step({type:'attack',target:t.id});else showUnit(t);};
   e.onclick=attack;e.onmouseenter=()=>showUnit(t);e.onmouseleave=clearHover;e.onfocus=()=>showUnit(t);e.onblur=clearHover;e.onkeydown=event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();attack();}};
  });
  dialog.querySelectorAll('[data-order-unit]').forEach(e=>{e.onmouseenter=()=>showUnit(b.units.find(t=>t.id===e.dataset.orderUnit));e.onmouseleave=clearHover;});
  dialog.querySelectorAll('[data-action]').forEach(e=>e.onclick=()=>{if(manual&&!busy)step({type:e.dataset.action});});
  dialog.querySelector('[data-auto]')?.addEventListener('click',()=>{auto=!auto;if(!busy)draw();else dialog.querySelector('[data-auto]').textContent=auto?'停止自动':'自动战斗';});
  dialog.querySelector('[data-retreat]')?.addEventListener('click',()=>{if(busy)return;retreat=true;auto=false;draw();});
  dialog.querySelector('[data-cancel-retreat]')?.addEventListener('click',()=>{retreat=false;draw();});
  dialog.querySelector('[data-retreat-confirm]')?.addEventListener('click',()=>step({type:'retreat'}));
  dialog.querySelector('[data-settle]')?.addEventListener('click',settle);
  if(!b.result&&(!isHome||auto)&&!retreat)timer=setTimeout(()=>step(aiAction(getState().domestic.war.battle)),auto?90:500);
 }
 draw();return stop;
}
