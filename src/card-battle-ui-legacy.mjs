import {commanderSkill,legalCardAttacks,cardAI,cardAttackStatus} from './card-battle-legacy.mjs';
import {officialAvatar} from './official-art.mjs';
import {advanceWar,finishWar} from './war.mjs';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ability={guard:'护卫',rush:'突袭',shot:'登场：敌方军心 −1'};
export function drawCardBattle(dialog,getState,commit,onFinish){

 let selection=null,swaps=new Set(),notice='',timer=null,disposed=false,auto=false,retreat=false;
 dialog.classList.add('card-battle-dialog');dialog.setAttribute('aria-label','军阵卡牌战场');
 const cleanup=()=>{disposed=true;clearTimeout(timer);dialog.classList.remove('card-battle-dialog');};dialog.addEventListener('close',cleanup,{once:true});
 const battle=()=>getState().domestic.war.battle;
 function feedback(message){notice=message;render();}
 function step(a){if(disposed)return;try{commit(advanceWar(getState(),a));notice='';selection=null;retreat=false;}catch(e){notice=e.message;auto=false;}render();}
 function portrait(u){return officialAvatar({...u.general,portraitRole:'military'})??'';}
 function card(c,id,zone){const x=c.catalog[id],u=battle().units.find(u=>u.id===x.unitId),selected=selection===id||swaps.has(id),ready=zone==='board'&&x.side==='home'&&x.ready&&c.turn==='home',status=zone==='board'&&x.side==='home'?cardAttackStatus(battle(),id):null,affordable=zone!=='hand'||c.phase==='mulligan'||x.cost<=c.players.home.mana;
 return `<button class="cb-card ${x.type} ${zone} ${x.side} ${selected?'selected':''} ${ready?'ready':''} ${!affordable?'unaffordable':''}" ${status?`data-attack-state="${status.code}"`:''} data-card="${esc(id)}" aria-label="${esc(x.name)}${x.attack?' 攻击'+x.attack+' 生命'+x.hp:''}" title="${esc(u?`${u.general.name} · 实际生还${Math.max(0,x.count-Math.min(x.count,Math.ceil(x.count*Math.min(x.maxHp,x.damage)/x.maxHp)))} / 初始${x.count}人 · 训练${u.training} · 攻击${x.attack} / 生命${Math.max(0,x.hp)} · ${ability[x.ability]??'普通部队'}`:x.text)}">${zone==='hand'?`<i class="cb-cost">${x.cost}</i>`:''}<strong>${esc(x.name)}</strong><div class="cb-art troop-${esc(x.kind)}">${x.type==='tactic'?`<span>${x.kind==='arrows'?'➶':x.kind==='supply'?'粮':'令'}</span>`:''}</div>${zone==='hand'?`<small>${esc(x.type==='troop'?ability[x.ability]??'部队':x.text)}</small>`:`<small>${esc(x.general)}</small>`}${x.type==='troop'?`<b class="cb-attack" title="攻击：每次造成的伤害">${x.attack}<em>攻</em></b><b class="cb-health ${x.hp<x.maxHp?'hurt':''}" title="生命：归零时部队离场">${x.hp}<em>命</em></b>`:''}${status?`<span class="cb-rest ${ready?'available':''}">${status.label}</span>`:''}</button>`;
 }
 function hero(s){const b=battle(),c=b.cards,u=b.units.find(u=>u.side===s&&u.commander),p=c.players[s],skill=commanderSkill(u.general);return `<div class="cb-command ${s}"><button class="cb-portrait" data-hero="${s}" title="主将：${esc(u.general.name)} · 亲卫${u.count}人" aria-label="${s==='home'?'我方':'敌方'}主将 ${esc(u.general.name)} 军心${p.hero}"><img src="${esc(portrait(u))}" alt="${esc(u.general.name)}"><span>${esc(u.general.name)}</span><b>${Math.max(0,p.hero)}<small>军心</small></b></button>${s==='home'?`<button class="cb-power" data-power ${c.turn!=='home'||c.phase!=='play'||p.mana<2||p.powerUsed?'disabled':''} title="${esc(skill.text)}"><span>令</span>${skill.name}<i>2</i></button>`:''}</div>`;}
 function render(){
 if(disposed)return;clearTimeout(timer);const b=battle();if(!b)return;const c=b.cards,p=c.players.home,e=c.players.enemy,manual=c.turn==='home'&&c.phase==='play'&&!auto,legal=selection&&p.board.includes(selection)?legalCardAttacks(b,selection):[],hasAction=p.hand.some(id=>c.catalog[id].cost<=p.mana&&(c.catalog[id].type!=='troop'||p.board.length<7))||(p.mana>=2&&!p.powerUsed)||p.board.some(id=>legalCardAttacks(b,id).length),idleHint=manual&&!hasAction?'本回合暂无可执行操作：部队可能刚上场或已攻击，请点击“结束回合”。':null;
 dialog.innerHTML=`<div class="cb-stage"><header class="cb-header"><div><small>御前军阵 · 卡牌交锋</small><h1>${esc(b.targetName)}之战</h1></div><div class="cb-backhand">${e.hand.map(()=>'<i></i>').join('')}<small>敌军手牌 ${e.hand.length} · 牌库 ${e.deck.length}</small></div><button data-close>保存离场 ×</button></header>${hero('enemy')}<aside class="cb-round"><small>当前战局</small><strong>第 ${b.round} 回合</strong><span>${c.turn==='home'?'我军行动':'敌军行动'}</span><button data-auto>${auto?'停止自动':'自动战斗'}</button></aside><main class="cb-field">${['enemy','home'].map(s=>`<section class="cb-row ${s}" aria-label="${s==='home'?'我军':'敌军'}部队">${c.players[s].board.map(id=>card(c,id,'board')).join('')}${Array.from({length:7-c.players[s].board.length},()=>'<div class="cb-slot">兵</div>').join('')}</section>`).join('')}</main><aside class="cb-actions"><button class="cb-end" data-end ${!manual?'disabled':''}>结束回合</button><button data-retreat ${!manual?'disabled':''}>${retreat?'确认撤军':'撤军'}</button>${retreat?'<button data-cancel>继续作战</button>':''}<small>敌军军令 ${e.mana}/${e.maxMana}</small></aside>${hero('home')}<div class="cb-hint" role="status">${esc(notice||(c.phase==='mulligan'?'选择要替换的起手牌，或直接开始交战':b.result?(b.result==='victory'?'敌军军心已溃，我军获胜':'我军战败，生还部队归营'):selection?'选择敌方部队或主将发动攻击':idleHint??b.log.at(-1)))}</div><footer class="cb-table"><div class="cb-hand">${p.hand.map(id=>card(c,id,'hand')).join('')}</div><div class="cb-mana"><strong>军令 ${p.mana}/${p.maxMana}</strong><div>${Array.from({length:10},(_,i)=>`<i class="${i<p.mana?'lit':i<p.maxMana?'spent':'locked'}"></i>`).join('')}</div><small>牌库 ${p.deck.length} · 手牌 ${p.hand.length}/10</small></div></footer><details class="cb-ledger"><summary>军情 · 兵粮与将领</summary><p>出征补给 ${b.command.supply?.grain??0}石，已在出征时结算；常规粮饷按旬结算。军令为战斗行动点。</p><p>卡面只显示攻击与生命，生命归零即离场；实际人数仅在军情中统计。亲卫保护主将，不生成部队手牌。</p><p>军阵牌库：${[...new Set(Object.values(c.catalog).filter(x=>x.side==='home'&&x.type==='troop').map(x=>x.name))].map(name=>{const cards=Object.values(c.catalog).filter(x=>x.side==='home'&&x.type==='troop'&&x.name===name);return `${esc(name)} ${cards.length}张（牌库剩${cards.filter(x=>p.deck.includes(x.id)).length}张）`;}).join('；')}</p>${b.units.filter(u=>u.side==='home').map(u=>`<p>${esc(u.general.name)} · ${esc(u.name)}：${u.count}/${u.initial}人 · 训练${u.training}</p>`).join('')}<p>部队攻击会同时受到反击；护卫必须优先攻击；突袭登场只能攻击部队。部队牌人数不重复占用兵籍。</p>${b.log.slice(-4).map(l=>`<p>${esc(l)}</p>`).join('')}</details>${c.phase==='mulligan'?`<div class="cb-overlay"><h2>部署先锋</h2><p>点击下方手牌可替换。先出部队，下个己方回合攻击；敌军期间可以攻击新部队。卡面左下是攻击，右下是生命。</p><button data-mulligan>开始交战${swaps.size?' · 替换'+swaps.size+'张':''}</button></div>`:''}${b.result?`<div class="cb-overlay"><h2>${b.result==='victory'?'大获全胜':'鸣金收兵'}</h2><p>我军阵亡 ${b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0)} 人，生还部队与装备按原账本归营。</p><button data-settle>结算战果</button></div>`:''}</div>`;
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('[data-auto]').onclick=()=>{auto=!auto;render();};
 dialog.querySelector('[data-end]').onclick=()=>step({type:'end'});dialog.querySelector('[data-power]')?.addEventListener('click',()=>step({type:'power'}));
 dialog.querySelector('[data-retreat]').onclick=()=>{if(retreat)step({type:'retreat'});else{retreat=true;render();}};dialog.querySelector('[data-cancel]')?.addEventListener('click',()=>{retreat=false;render();});
 dialog.querySelector('[data-mulligan]')?.addEventListener('click',()=>{const ids=[...swaps];swaps.clear();step({type:'mulligan',ids});});
 dialog.querySelector('[data-settle]')?.addEventListener('click',()=>{try{const result=finishWar(getState());commit(result.state);cleanup();onFinish(result.receipt);}catch(e){notice=e.message;render();}});
 function attackTarget(target){
  if(!manual){feedback(auto?'当前由电脑指挥，请先点击“停止自动”。':'现在是敌方回合，请等待敌军行动结束。');return;}
  if(!selection){feedback('请先点击中央下排一支可攻击的己方部队，再点击敌方目标。');return;}
  const status=cardAttackStatus(b,selection);if(status.code!=='ready'){feedback(status.reason);return;}
  if(!legal.includes(target)){
   const guards=e.board.some(id=>c.catalog[id].ability==='guard');
   feedback(guards?'敌方有护卫，必须先攻击带“护卫”的部队。':target==='hero'&&c.catalog[selection].rushing?'突袭部队刚上场，本回合只能攻击敌方部队，不能攻击主将。':'这个目标当前不能攻击，请选择高亮目标。');return;
  }
  step({type:'attack',id:selection,target});
 }
 for(const el of dialog.querySelectorAll('[data-card]')){const id=el.dataset.card;if(legal.includes(id))el.classList.add('target');el.onclick=()=>{
  if(c.phase==='mulligan'&&p.hand.includes(id)){swaps.has(id)?swaps.delete(id):swaps.add(id);notice='';render();return;}
  if(!manual){feedback(auto?'当前由电脑指挥，请先点击“停止自动”。':b.result?'战斗已结束，请结算战果。':'现在是敌方回合，请等待敌军行动结束。');return;}
  if(p.hand.includes(id)){
   const x=c.catalog[id];
   if(x.cost>p.mana){feedback(`军令不足：${x.name}需要${x.cost}点，当前剩${p.mana}点。攻击场上已就绪的部队不消耗军令。`);return;}
   if(x.type==='troop'&&p.board.length>=7){feedback('己方战场已有7支部队，暂时无法再出部队牌。');return;}
   step({type:'play',id});
  }else if(p.board.includes(id)){
   const status=cardAttackStatus(b,id);selection=status.code==='ready'?(selection===id?null:id):null;
   notice=status.code==='ready'?(selection?status.reason:'已取消选择，请选择一支部队。'):status.reason;render();
  }else attackTarget(id);
 };}
 const enemyHero=dialog.querySelector('[data-hero="enemy"]');if(legal.includes('hero'))enemyHero.classList.add('target');enemyHero.onclick=()=>attackTarget('hero');
 if(!b.result&&c.phase==='play'&&(c.turn==='enemy'||auto))timer=setTimeout(()=>step(cardAI(b)),auto?230:650);
 }
 render();
}
