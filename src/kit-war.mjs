import {worldKitDepot,reserveWorldKits,settleWorldKits,ENABLED_KITS} from './troop-kit-world.mjs';
import {TROOP_KITS,kitAvailability,reserveKitSquads} from './troop-kits.mjs';
import {generals,borderingCountries,borderingProvinces,battlefieldFor,initializeWar} from './war.mjs';
import {createBattle,validateBattle,bonuses,battleResultText} from './battle.mjs';
import {relationBetween} from './diplomacy.mjs';
import {requestTreatyAid} from './treaty-obligations.mjs';
import {alliedExpedition} from './foreign-strategy.mjs';
import {occupyProvince} from './occupation.mjs';
import {transferTreasury} from './finance.mjs';
import {recordWar} from './war-records.mjs';
import {validateDomestic} from './domestic.mjs';
const label=id=>TROOP_KITS.find(k=>k.id===id)?.name??'乡勇';
const fallback={name:'署理将领',martial:35,intelligence:35,experience:0};
const battleId=id=>`kit-war:${id}`;
export function quoteKitWar(state,c){
 const d=state.domestic;if(c.kitVersion!==1||c.kind!=='war'||!d.troopKits)throw Error('套装出征军令无效');
 if(d.war.battle||d.strategy?.pending||d.collapse?.pending||d.collapse?.ended||state.stats.life===0)throw Error('当前不能出征');
 const target=borderingCountries(d).find(t=>t.id===c.targetId);if(!target)throw Error('只能攻击接壤国家');
 if(['nonaggression','defense','ally','protector','protected'].includes(relationBetween(d,d.playerCountryId,target.id)?.relation))throw Error('现有条约禁止进攻');
 if(!Array.isArray(c.squads)||!c.squads.length||c.squads.length>6||!c.commanderSquad)throw Error('请配置亲卫和一至六个子队');
 const leaders=generals(d),used=new Set(),officer=id=>{const g=leaders.find(g=>g.id===id);if(!g||used.has(id))throw Error('请选择在职且不重复的将领');used.add(id);return structuredClone(g);};
 const commander=officer(c.generalId);
 const rows=[...c.squads,c.commanderSquad],friendly=rows.map((row,i)=>{
  if(!ENABLED_KITS.includes(row.kind)||!Number.isSafeInteger(row.count)||row.count<1||row.count>10000||row.equipped===false||row.equipment!==undefined)throw Error('请选择有效兵种与1至10000人的齐装部队');
  const leader=i===rows.length-1?commander:officer(row.generalId);
  return {kind:row.kind,count:row.count,sourceId:'central',name:i===rows.length-1?`${leader.name}亲卫`:`${label(row.kind)}${i+1}队`,general:leader,...(i===rows.length-1?{commander:true}:{}),equipmentFactor:1};
 });
 reserveKitSquads(worldKitDepot(d,'central'),battleId(c.id),friendly);
 return {title:'发动战争',lines:[`向${target.name}出征，由${commander.name}率领 ${friendly.reduce((n,u)=>n+u.count,0)} 人；按兵种自动配装。`,...friendly.map(u=>`${u.name} ${u.count} 人，${label(u.kind)}装备 ${u.count} 人份`)],details:{friendly,targetId:target.id,provinceId:borderingProvinces(d,d.playerCountryId,target.id)[0]?.id??target.provinceIds[0]}};
}
// Shared formation builder: all troop counts and kit coverage come from one depot.
export function kitGarrison(d,sourceId,count,{commander=false,support=0,prefix='守军',maxStacks=10,allowReserve=false}={}){
 const depot=worldKitDepot(d,sourceId),available=kitAvailability(depot),gear=Object.fromEntries(Object.entries(available.kits).map(([id,k])=>[id,k.available]));
 if(!Number.isSafeInteger(count)||count<1||count>available.soldiers.available)throw Error('驻地可用兵力不足');
 let left=count;const units=[],training=Math.min(100,depot.training+support);
 const add=(kind,n,leader=false,equipped=true)=>{gear[kind]-=equipped?n:0;left-=n;units.push({kind,count:n,sourceId,training,general:{...fallback},name:`${prefix}${leader?'主将亲卫':equipped?label(kind):'乡勇'}`,equipmentFactor:equipped?1:.5,...(equipped?{}:{equipped:false}),...(leader?{commander:true}:{})});};
 if(commander){const n=Math.min(100,left),kind=ENABLED_KITS.find(id=>gear[id]>=n);add(kind??'infantry',n,true,!!kind);}
 const kinds=allowReserve?[...ENABLED_KITS].sort((a,b)=>Number(!!TROOP_KITS.find(k=>k.id===b)?.origins)-Number(!!TROOP_KITS.find(k=>k.id===a)?.origins)||gear[b]-gear[a]):ENABLED_KITS;
 for(const id of kinds){if(allowReserve?units.length>=maxStacks:units.length>=maxStacks-1&&gear[id]<left)break;const n=Math.min(left,gear[id]);if(n)add(id,n);}
 if(left&&(!allowReserve||units.length<maxStacks))add('infantry',left,false,false);
 return [...units.filter(u=>!u.commander),...units.filter(u=>u.commander)];
}
function reserveArmy(d,id,units){for(const sourceId of new Set(units.map(u=>u.sourceId)))reserveWorldKits(d,sourceId,id,units.filter(u=>u.sourceId===sourceId));}
export function beginKitWar(state,c){
 const q=quoteKitWar(state,c),next=structuredClone(state),d=next.domestic;initializeWar(d);
 if(!Number.isSafeInteger(c.id)||c.id!==d.war.nextId)throw Error('军令已执行');
 const support=requestTreatyAid(d,d.playerCountryId,c.targetId,state.turn,`kit-war:${c.id}`),p=d.provinces.find(p=>p.id===q.details.provinceId),enemyCount=kitAvailability(worldKitDepot(d,p.id)).soldiers.available;
 if(enemyCount<1)throw Error('目标守军为空，请先处理领土状态');
 const enemies=kitGarrison(d,p.id,enemyCount,{commander:true,support,prefix:'敌'}),allied=alliedExpedition(d,d.playerCountryId,c.targetId,state.turn,`kit:${c.id}`);
 for(const [allyIndex,f]of allied.entries()){const units=kitGarrison(d,f.sourceId,f.soldiers,{prefix:'盟军',maxStacks:2,allowReserve:true});f.reserve=f.soldiers-units.reduce((n,u)=>n+u.count,0);f.soldiers-=f.reserve;for(const u of units)enemies.push({...u,allyIndex});}
 // Keep a bounded number of real stacks. Allies retain their composition; merge
 // only matching source and kind, never silently drop soldiers or equipment.
 if(enemies.filter(u=>!u.commander).length>13)throw Error('援军编队超过战场容量，请减少盟军来源');
 const id=battleId(c.id);reserveArmy(d,id,q.details.friendly);reserveArmy(d,id,enemies);
 d.war.battle=createBattle({command:{...structuredClone(c),kitVersion:1,kitSupport:support,kitBattleId:id,provinceId:p.id,alliedForces:allied},friendly:q.details.friendly,enemy:enemies,training:d.centralArmy.training,enemyTraining:p.military.training,targetName:d.countries.find(t=>t.id===c.targetId).name,field:battlefieldFor({...d,provinces:[p,...d.provinces.filter(row=>row!==p)]},c.targetId,state.turn)});
 validateKitBattle(d,d.war.battle);validateDomestic(d);return next;
}
export function validateKitBattle(d,b){
 if(b.command.kitVersion!==1)return;validateBattle(b);
 if(!Number.isInteger(b.command.kitSupport)||b.command.kitSupport<0||b.command.kitSupport>20||b.command.kitBattleId!==battleId(b.command.id)||b.command.defensive)throw Error('套装战场编号无效');
 const sources=new Set(b.units.map(u=>u.sourceId));
 const reservedSources=Object.entries(d.troopKits.depots).filter(([,record])=>record.reservations[b.command.kitBattleId]?.status==='active').map(([id])=>id);
 if(reservedSources.length!==sources.size||reservedSources.some(id=>!sources.has(id)))throw Error('战场遗漏已占用的部队来源');
 for(const sourceId of sources){
  const record=worldKitDepot(d,sourceId).reservations[b.command.kitBattleId],units=b.units.filter(u=>u.sourceId===sourceId);
  if(!record||record.status!=='active'||record.squads.length!==units.length)throw Error('战场没有对应套装占用');
  units.forEach((u,i)=>{const r=record.squads[i];if(u.kind!==r.kind||u.initial!==r.count||(u.equipped!==false)!==(r.equipped!==false)||u.equipmentFactor!==(r.equipped===false?.5:1))throw Error('战场兵种或套装来源不一致');});
 }
 const home=b.units.filter(u=>u.side==='home'),rows=[...b.command.squads,b.command.commanderSquad];
 if(home.length!==rows.length||home.some((u,i)=>u.sourceId!=='central'||u.kind!==rows[i].kind||u.initial!==rows[i].count||!!u.commander!==(i===rows.length-1)))throw Error('出征编队与军令不一致');
 for(const [i,u]of home.entries()){
  const id=u.commander?b.command.generalId:rows[i].generalId,leader=generals(d).find(g=>g.id===id);
  if(!leader||u.training!==d.centralArmy.training||JSON.stringify(u.general)!==JSON.stringify(leader))throw Error('出征将领与实际任职不一致');
 }
 for(const u of b.units.filter(u=>u.side==='enemy')){
  const ally=u.allyIndex===undefined?null:b.command.alliedForces?.[u.allyIndex],p=d.provinces.find(p=>p.id===u.sourceId);
  if(JSON.stringify(u.general)!==JSON.stringify(fallback)||u.training!==Math.min(100,worldKitDepot(d,u.sourceId).training+(ally?0:b.command.kitSupport)))throw Error('敌军训练或将领快照无效');
  if(!p||p.countryId!==(ally?.countryId??b.command.targetId)||u.sourceId!==(ally?.sourceId??b.command.provinceId))throw Error('敌军或盟军来源无效');
 }
 for(const u of b.units){const expected=bonuses(u.general);if(JSON.stringify(u.bonus)!==JSON.stringify(expected))throw Error('套装战场将领加成无效');}
}
export function finishKitWar(state){
 const next=structuredClone(state),d=next.domestic,b=d.war.battle;if(!b?.result)throw Error('战斗尚未结束');validateKitBattle(d,b);
 for(const sourceId of new Set(b.units.map(u=>u.sourceId)))settleWorldKits(d,sourceId,b.command.kitBattleId,b.units.filter(u=>u.sourceId===sourceId).map(u=>u.count));
 const home=d.countries.find(c=>c.id===d.playerCountryId),target=d.countries.find(c=>c.id===b.command.targetId),win=b.result==='victory',relation=relationBetween(d,home.id,target.id);
 relation.relation='hostile';relation.friendship=0;relation.trade.quota=0;Object.assign(relation.agreement,{exports:0,imports:0,tribute:0,payerId:null});
 const occupation=win?occupyProvince(d,target.id,state.turn,home.id,b.command.provinceId):null,loot=win?Math.min(target.fiscal.treasury,Math.round(b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.initial,0)/5)):0;
 transferTreasury(d,target.id,home.id,loot,{turn:state.turn,reason:'战争战利银',key:`kit-war:${b.command.id}:loot`});home.prestige=Math.max(0,Math.min(500,home.prestige+(win?5:-5)));
 for(const g of generals(d).filter(g=>[b.command.generalId,...b.command.squads.map(u=>u.generalId)].includes(g.id)))g.experience=Math.min(100,(g.experience??0)+3);
 const army=side=>{const units=b.units.filter(u=>u.side===side),commander=units.find(u=>u.commander);return {initial:units.reduce((n,u)=>n+u.initial,0),dead:units.reduce((n,u)=>n+u.dead,0),survived:units.reduce((n,u)=>n+u.count,0),commander:{name:commander.name,count:commander.count,initial:commander.initial,status:commander.fled?'撤离':commander.count?'安然归营':'负伤退场'},units:units.map(u=>({name:u.name,kind:u.kind,commander:!!u.commander,initial:u.initial,dead:u.dead,survived:u.count,generalName:u.general.name,sourceId:u.sourceId}))};};
 const kitLoss=Object.fromEntries(TROOP_KITS.map(k=>[k.id,b.units.filter(u=>u.side==='home'&&u.kind===k.id&&u.equipped!==false).reduce((n,u)=>n+u.dead,0)])),report={kitVersion:1,occupation,result:b.result,targetName:b.targetName,rounds:b.round,reason:battleResultText(b),home:army('home'),enemy:army('enemy'),loot,prestige:home.prestige-state.stats.prestige,kitLoss};
 const receipt={id:d.war.nextId++,turn:state.turn,kind:'war',title:'套装军备战报',report,...(occupation?{occupation}:{}),lines:[report.reason,`我军出征 ${report.home.initial} 人，阵亡 ${report.home.dead} 人，生还 ${report.home.survived} 人归营。`,`军备损失：${TROOP_KITS.filter(k=>kitLoss[k.id]).map(k=>`${k.name}${kitLoss[k.id]}人份`).join('、')||'无'}。`,`获得战利银 ${loot} 两。`]};
 for(const f of b.command.alliedForces??[])if(f.reserve)receipt.lines.push(`盟军${d.countries.find(c=>c.id===f.countryId)?.name??''}：实际出战${f.soldiers}人，受编队名额限制的${f.reserve}人携装留在原驻地。`);
 recordWar(d,receipt.id,{win,homeDead:report.home.dead,enemyDead:report.enemy.dead});d.war.history.unshift(receipt);d.war.history=d.war.history.slice(0,100);delete d.war.battle;
 if(!d.centralArmy.soldiers){d.centralArmy.training=0;d.general.ongoing=false;d.general.trainingFloor=0;}
 next.stats.treasury=home.fiscal.treasury;next.stats.prestige=home.prestige;validateDomestic(d);return {state:next,receipt};
}
