import {difficultyRules} from './difficulty.mjs';
import {normalizeLandmarkSelection,landmarkSelectionIds,planLandmarkAllocation} from './card-battle-landmarks.mjs';
import {normalizeSecretSelection,secretSelectionIds,planSecretAllocation} from './card-battle-secrets.mjs';
import {normalizeWeaponSelection,weaponSelectionIds,weaponKitCounts,expectedWeaponKits,weaponLossForSource} from './card-battle-weapons.mjs';
import {archiveCardHistory} from './card-battle-history-archive.mjs';
import {armyCardCount,normalizeTacticSelection} from './card-battle-tactics.mjs';
import {attachCards,ensureCardPeople,battlePerson,CARD_RULES} from './card-battle.mjs';
import {captureArmyRecovery,offerArmyRecovery} from './army-recovery.mjs';
import {gainOfficialExperience} from './official-growth.mjs';
import {MAX_SQUAD_SOLDIERS,squadSoldierLimit} from './formation-limits.mjs';
import {ENABLED_KITS,worldKitDepot,reserveWorldKits,settleWorldKits} from './troop-kit-world.mjs';
import {kitAvailability,reserveKitSquads,TROOP_KITS,kitSurface} from './troop-kits.mjs';
import {kitGarrison,planKitWeapons} from './kit-war.mjs';
import {generals} from './war.mjs';
import {createBattle,validateBattle,bonuses,actBattle,aiAction} from './battle.mjs';
import {conclude} from './foreign-strategy.mjs';
import {specialActive,specialDefenseBonus} from './special-buildings.mjs';
import {validateDomestic} from './domestic.mjs';
const acting={id:null,name:'署理将领',martial:30,intelligence:30,leadership:30,experience:0};
const label=id=>TROOP_KITS.find(k=>k.id===id)?.name??'乡勇';
const key=(d,c)=>`kit-defense:${c.id}:${d.war.nextId}`;
const officer=(d,id)=>{if(id==='')return {...acting};const g=generals(d).find(g=>g.id===id);if(!g)throw Error('请选择在职将军或署理领队');return {id:g.id,name:g.name,martial:g.martial??50,intelligence:g.intelligence??50,leadership:g.leadership??g.intelligence??50,experience:g.experience??0};};
export function kitDefenseSources(d){
 const c=d.strategy?.pending;if(!c)return [];
 return [{sourceId:c.provinceId,countryId:c.defender,allied:false},{sourceId:'central',countryId:d.playerCountryId,allied:false},...c.allies.map(f=>({...f,allied:true}))].map(f=>{
  const depot=worldKitDepot(d,f.sourceId),available=kitAvailability(depot),p=d.provinces.find(p=>p.id===f.sourceId);
  return {...f,name:f.sourceId==='central'?'中央增援':`${p.name}${f.allied?'援军':'守军'}`,soldiers:Math.min(f.soldiers??available.soldiers.available,available.soldiers.available),training:Math.min(100,depot.training+(f.allied?0:c.support??0)),kits:Object.fromEntries(Object.entries(available.kits).map(([id,r])=>[id,r.available]))};
 });
}
export function defaultKitDefensePlan(state,central=state.domestic.centralArmy.soldiers){
 const d=state.domestic;if(!Number.isSafeInteger(central)||central<0||central>d.centralArmy.soldiers)throw Error('中央增援人数无效');
 const sources=kitDefenseSources(d).map(f=>({...f,kits:{...f.kits},soldiers:f.sourceId==='central'?Math.min(f.soldiers,central):f.soldiers})),own=sources.filter(f=>!f.allied),source=own.find(f=>f.soldiers>0)??sources.find(f=>f.soldiers>0);
 if(!source)throw Error('没有可参战守军，请选择撤守');
 const leaders=generals(d),leader=leaders.find(g=>g.positionId==='central-general')??leaders[0],count=Math.min(100,source.soldiers),kind=ENABLED_KITS.find(k=>source.kits[k]>=count),used=new Set(leader?[leader.id]:[]);
 const plan={kitVersion:1,generalId:leader?.id??'',commander:{sourceId:source.sourceId,kind:kind??'infantry',count,equipped:!!kind},squads:[]};source.soldiers-=count;if(kind)source.kits[kind]-=count;
 for(const [i,f]of own.entries()){
  let remaining=f.soldiers,slots=6-plan.squads.length-(own.slice(i+1).some(s=>s.soldiers>0)?2:0);
  const add=(kind,n,equipped)=>{const g=leaders.find(g=>!used.has(g.id));if(g)used.add(g.id);plan.squads.push({sourceId:f.sourceId,kind,count:n,equipped,generalId:g?.id??''});remaining-=n;slots--;};
  for(const kind of (f.sourceId==='central'?['camel','elephant','horse-archers','cavalry','heavy-cavalry','archers','crossbows','infantry','spears']:['camel','elephant','horse-archers','infantry','archers','crossbows','spears','cavalry','heavy-cavalry']).filter(k=>ENABLED_KITS.includes(k))){if(slots<=0||!remaining)break;const n=Math.min(MAX_SQUAD_SOLDIERS,remaining,f.kits[kind]);if(n){add(kind,n,true);f.kits[kind]-=n;}}
  while(remaining&&slots>0)add('infantry',Math.min(MAX_SQUAD_SOLDIERS,remaining),false);
 }
 return plan;
}
export function quoteKitDefense(state,plan,{legacyReplay=false,cardRules=CARD_RULES,cardDefinitions}={}){
 const normalizedLandmarks=normalizeLandmarkSelection(plan?.cardLandmarks),selectedLandmarks=landmarkSelectionIds(normalizedLandmarks).length?normalizedLandmarks:undefined;
 const normalizedSecrets=normalizeSecretSelection(plan?.cardSecrets),selectedSecrets=secretSelectionIds(normalizedSecrets).length?normalizedSecrets:undefined;
 const normalizedWeapons=normalizeWeaponSelection(plan?.cardWeapons),selectedWeapons=weaponSelectionIds(normalizedWeapons).length?normalizedWeapons:undefined;

 const d=state.domestic,c=d.strategy?.pending;
 if(!c||c.defender!==d.playerCountryId||d.war.battle||d.collapse?.pending||d.collapse?.ended||state.stats?.life===0||state.reignResult)throw Error('当前没有可部署的守城战役');
 if(plan?.kitVersion!==1||!plan.commander||!Array.isArray(plan.squads)||plan.squads.length>6)throw Error('请配置亲卫及最多六个子队');
 const sources=kitDefenseSources(d),friendly=[],usedGenerals=new Set(),used=new Map();
 const general=id=>{const g=officer(d,id);if(id){if(usedGenerals.has(id))throw Error('各队将领不能重复');usedGenerals.add(id);}return g;};
 const leader=general(plan.generalId);
 function unit(row,commander=false){
  const f=sources.find(f=>f.sourceId===row.sourceId);if(!f||f.allied&&!commander)throw Error('请选择本州或中央兵源');
  if(!ENABLED_KITS.includes(row.kind)||typeof row.equipped!=='boolean'||!Number.isSafeInteger(row.count)||row.count<1||row.count>(legacyReplay?10000:squadSoldierLimit(d))||!row.equipped&&row.kind!=='infantry')throw Error('兵种、装备或人数无效');
  const g=commander?leader:general(row.generalId),u={kind:row.kind,count:row.count,sourceId:f.sourceId,training:f.training,general:g,name:commander?`${g.name}亲卫`:`${f.name}·${row.equipped?label(row.kind):'乡勇'}`,equipmentFactor:row.equipped?1:.5,...(row.equipped?{}:{equipped:false}),...(commander?{commander:true}:{})};
  friendly.push(u);used.set(f.sourceId,(used.get(f.sourceId)??0)+row.count);return u;
 }
 const guard=unit(plan.commander,true);plan.squads.forEach(row=>unit(row));
 for(const f of sources.filter(f=>f.allied)){
  let n=f.soldiers-(used.get(f.sourceId)??0);if(d.resourceRulesVersion===1&&!legacyReplay)n=Math.min(MAX_SQUAD_SOLDIERS,n);if(!n)continue;
  const guardCost=guard.sourceId===f.sourceId&&guard.equipped!==false?guard.count:0,kind=[...ENABLED_KITS].sort((a,b)=>(f.kits[b]-(b===guard.kind?guardCost:0))-(f.kits[a]-(a===guard.kind?guardCost:0))).find(id=>f.kits[id]-(id===guard.kind?guardCost:0)>0);if(kind)n=Math.min(n,f.kits[kind]-(kind===guard.kind?guardCost:0));
  friendly.push({kind:kind??'infantry',count:n,sourceId:f.sourceId,training:f.training,general:{...acting},name:f.name,equipmentFactor:kind?1:.5,...(kind?{}:{equipped:false})});used.set(f.sourceId,(used.get(f.sourceId)??0)+n);
 }
 normalizeTacticSelection(plan.cardTactics,cardRules.deckSize-landmarkSelectionIds(selectedLandmarks).length-weaponSelectionIds(selectedWeapons).length-secretSelectionIds(selectedSecrets).length-armyCardCount(friendly.filter(u=>!u.commander).reduce((n,u)=>n+u.count,0),cardRules),cardDefinitions);
 const forces=[];for(const f of sources){const n=used.get(f.sourceId)??0;if(n>f.soldiers)throw Error(`${f.name}士兵不足`);if(n){reserveKitSquads(worldKitDepot(d,f.sourceId),key(d,c),friendly.filter(u=>u.sourceId===f.sourceId),{extraKits:f.sourceId===guard.sourceId?weaponKitCounts(selectedWeapons):{}});forces.push({countryId:f.countryId,sourceId:f.sourceId,soldiers:n,training:f.training});}}
 const ordered=[...friendly.filter(u=>u!==guard),guard];for(const u of ordered)u.forceIndex=forces.findIndex(f=>f.sourceId===u.sourceId);
 const enemy=kitGarrison(legacyReplay?{...d,resourceRulesVersion:0}:d,c.attack.sourceId,c.attack.soldiers,{commander:true,prefix:'攻军',allowReserve:!legacyReplay&&d.resourceRulesVersion===1}).map(u=>({...u,forceIndex:0,training:c.attack.training}));
 const normalizedPlan=structuredClone(plan);if(selectedLandmarks)normalizedPlan.cardLandmarks=selectedLandmarks;else delete normalizedPlan.cardLandmarks;if(selectedSecrets)normalizedPlan.cardSecrets=selectedSecrets;else delete normalizedPlan.cardSecrets;if(selectedWeapons)normalizedPlan.cardWeapons=selectedWeapons;else delete normalizedPlan.cardWeapons;
 return {plan:normalizedPlan,selectedLandmarks,selectedSecrets,selectedWeapons,leader,friendly:ordered,enemy,forces,sources:sources.map(f=>({...f,deployed:used.get(f.sourceId)??0,reserve:f.soldiers-(used.get(f.sourceId)??0)}))};
}
export function beginKitDefense(state,plan){
 const q=quoteKitDefense(state,plan);if(q.selectedLandmarks&&plan.battleMode!=='cards')throw Error('地标仅用于卡牌战斗');if(q.selectedSecrets&&plan.battleMode!=='cards')throw Error('奥秘仅用于卡牌战斗');if(weaponSelectionIds(q.selectedWeapons).length&&plan.battleMode!=='cards')throw Error('武器仅用于卡牌战斗');
 const s=structuredClone(state),d=s.domestic,c=d.strategy.pending,id=key(d,c),p=d.provinces.find(p=>p.id===c.provinceId),allocation=planKitWeapons(d,q.friendly,q.enemy,q.selectedWeapons),secretAllocation=planSecretAllocation(q.friendly,q.enemy,q.selectedSecrets),landmarkAllocation=planLandmarkAllocation(q.friendly,q.enemy,q.selectedLandmarks);
 captureArmyRecovery(d,s.turn);
 for(const sourceId of new Set([...q.friendly,...q.enemy].map(u=>u.sourceId)))reserveWorldKits(d,sourceId,id,[...q.friendly,...q.enemy].filter(u=>u.sourceId===sourceId),{extraKits:expectedWeaponKits({command:{weaponAllocation:allocation}},sourceId)});
 d.war.battle=createBattle({command:{id:d.war.nextId,kind:'war',kitVersion:1,...(landmarkAllocation?{cardLandmarks:q.selectedLandmarks,landmarkAllocation}:{}),...(secretAllocation?{cardSecrets:q.selectedSecrets,secretAllocation}:{}),...(allocation?{cardWeapons:q.selectedWeapons,weaponAllocation:allocation}:{}),...(d.resourceRulesVersion===1?{squadLimitVersion:1}:{}),kitBattleId:id,defensive:true,campaignId:c.id,deploymentVersion:2,deployment:q.plan,generalId:q.plan.generalId,commanderSquad:q.plan.commander,squads:q.plan.squads,forces:q.forces,attack:structuredClone(c.attack)},friendly:q.friendly,enemy:q.enemy,training:0,enemyTraining:c.attack.training,targetName:`${p.name}保卫战`,field:{terrain:p.terrain,surface:kitSurface(p),defenderSide:'home',defense:Math.min(1.5,1+p.welfare.defense/500+specialDefenseBonus(d,s.turn))}});
 if(plan.battleMode==='cards'){d.war.battle.command.battleMode='cards';if(plan.cardTactics!==undefined)d.war.battle.command.cardTactics=structuredClone(plan.cardTactics);if(q.selectedWeapons!==undefined)d.war.battle.command.cardWeapons=structuredClone(q.selectedWeapons);ensureCardPeople(d,d.war.battle);d.war.battle.difficultyId=difficultyRules(d).id;attachCards(d.war.battle);}
 validateKitDefense(d,d.war.battle);validateDomestic(d);return s;
}
export function validateKitDefense(d,b){if(b.difficultyId!==undefined&&b.difficultyId!==difficultyRules(d).id)throw Error('战场难度不一致');
 if(b.command.kitVersion!==1||!b.command.defensive)return;validateBattle(b);const c=d.strategy?.pending,id=c&&key(d,c);
 if(!c||c.defender!==d.playerCountryId||b.command.campaignId!==c.id||b.command.kitBattleId!==id||b.command.deploymentVersion!==2)throw Error('套装守城来源无效');
 const draft=structuredClone(d);delete draft.war.battle;
 const reserved=Object.entries(draft.troopKits.depots).filter(([,record])=>record.reservations[id]?.status==='active');
 for(const [,record]of reserved)delete record.reservations[id];
 if(b.command.squadLimitVersion!==undefined&&(b.command.squadLimitVersion!==1||b.units.some(u=>u.initial>MAX_SQUAD_SOLDIERS)))throw Error('战场单队人数超过上限');
 const q=quoteKitDefense({domestic:draft},b.command.deployment,{legacyReplay:b.command.squadLimitVersion!==1,cardRules:b.cards?.rulesSnapshot??CARD_RULES,cardDefinitions:b.cards?.definitionCatalog}),same=(a,c)=>JSON.stringify(a)===JSON.stringify(c);
 if(!same(b.command.cardLandmarks,b.command.deployment.cardLandmarks)||!same(b.command.landmarkAllocation,planLandmarkAllocation(q.friendly,q.enemy,q.selectedLandmarks))||!same(b.command.cardSecrets,b.command.deployment.cardSecrets)||!same(b.command.secretAllocation,planSecretAllocation(q.friendly,q.enemy,q.selectedSecrets))||!same(b.command.cardWeapons,b.command.deployment.cardWeapons)||!same(b.command.weaponAllocation,planKitWeapons(draft,q.friendly,q.enemy,q.selectedWeapons))||!same(b.command.cardTactics,b.command.deployment.cardTactics)||!same(b.command.forces,q.forces)||!same(b.command.attack,c.attack)||!same(b.command.squads,q.plan.squads)||!same(b.command.commanderSquad,q.plan.commander)||b.command.generalId!==q.plan.generalId)throw Error('套装守城军令与兵籍不一致');
 for(const [side,expected]of [['home',q.friendly],['enemy',q.enemy]]){
  const actual=b.units.filter(u=>u.side===side);if(actual.length!==expected.length)throw Error('套装守城编队数量无效');
  actual.forEach((u,i)=>{const e=expected[i];for(const k of ['kind','name','sourceId','forceIndex','general','training','equipmentFactor','equipped','commander'])if(!same(u[k],e[k]))throw Error('套装守城编队快照无效');if(u.initial!==e.count||!same(u.bonus,bonuses(e.general)))throw Error('套装守城人数或加成无效');});
 }
 const sources=[...new Set(b.units.map(u=>u.sourceId))];if(reserved.length!==sources.length||reserved.some(([sourceId])=>!sources.includes(sourceId)))throw Error('守城占用来源遗漏');
 for(const sourceId of sources){const r=worldKitDepot(d,sourceId).reservations[id],units=b.units.filter(u=>u.sourceId===sourceId);if(r?.extraKits!==undefined&&!b.command.weaponAllocation)throw Error('当前战场版本不支持额外武器装备占用');const extra=expectedWeaponKits(b,sourceId);if(TROOP_KITS.some(k=>(r?.extraKits?.[k.id]??0)!==(extra[k.id]??0)))throw Error('武器与实际军备占用不一致');if(!r||r.status!=='active'||r.squads.length!==units.length||units.some((u,i)=>u.kind!==r.squads[i].kind||u.initial!==r.squads[i].count||(u.equipped!==false)!==(r.squads[i].equipped!==false)))throw Error('守城套装占用与战场不一致');}
}
export function finishKitDefense(state){
 const s=structuredClone(state),d=s.domestic,b=d.war.battle,c=d.strategy?.pending;if(!b?.result)throw Error('守城战役尚未结束');validateKitDefense(d,b);
 for(const sourceId of new Set(b.units.map(u=>u.sourceId)))settleWorldKits(d,sourceId,b.command.kitBattleId,b.units.filter(u=>u.sourceId===sourceId).map(u=>u.count),worldKitDepot(d,sourceId).reservations[b.command.kitBattleId]?.extraKits?{extraKitLoss:weaponLossForSource(b,sourceId)}:undefined);
 const losses=b.command.forces.map((f,i)=>b.units.filter(u=>u.side==='home'&&u.forceIndex===i).reduce((n,u)=>n+u.dead,0)),attackDead=b.units.filter(u=>u.side==='enemy').reduce((n,u)=>n+u.dead,0);
 const receipt=conclude(d,c,b.command.forces,losses,attackDead,b.result==='draw'?null:b.result==='victory',s.turn,true);
 const cardHistory=archiveCardHistory(b);if(cardHistory)receipt.cardHistory=cardHistory;
 const kits=side=>Object.fromEntries(TROOP_KITS.map(k=>[k.id,b.units.filter(u=>u.side===side&&u.kind===k.id&&u.equipped!==false).reduce((n,u)=>n+u.dead,0)+[...new Set(b.units.filter(u=>u.side===side).map(u=>u.sourceId))].reduce((n,id)=>n+(weaponLossForSource(b,id)[k.id]??0),0)]));
 receipt.defenseDetails={version:2,units:b.units.map(u=>({side:u.side,sourceId:u.sourceId,kind:u.kind,generalName:b.cards?.rulesVersion>=3?battlePerson(b,u).name:u.general.name,...(b.cards?.rulesVersion>=3?{generalId:u.cardPersonId}:{}),initial:u.initial,dead:u.dead,survived:u.count})),kitLoss:{home:kits('home'),enemy:kits('enemy')}};
 const ids=new Set([b.command.generalId,...b.command.squads.map(u=>u.generalId)].filter(Boolean));for(const o of d.justice.officials.filter(o=>ids.has(o.id))){gainOfficialExperience(o,3);}
 if(b.command.weaponAllocation)for(const sourceId of new Set(b.units.map(u=>u.sourceId))){const loss=weaponLossForSource(b,sourceId);if(Object.keys(loss).length)receipt.lines.push(`${sourceId==='central'?'中央':d.provinces.find(p=>p.id===sourceId).name}备用武器毁损：${Object.entries(loss).map(([kind,n])=>label(kind)+n+'人份完整套装').join('、')}；不额外扣兵员。`);}
 receipt.lines.push(...b.command.forces.map(f=>`${f.sourceId==='central'?'中央':d.provinces.find(p=>p.id===f.sourceId).name}：生还部队携装归营，按兵种套装核销损失。`));delete d.war.battle;offerArmyRecovery(d,s.turn);
 if(!d.centralArmy.soldiers){d.centralArmy.training=0;d.general.ongoing=false;d.general.trainingFloor=0;}
 s.stats.treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;s.stats.prestige=d.countries.find(c=>c.id===d.playerCountryId).prestige;validateDomestic(d);return {state:s,receipt};
}
export function autoKitDefense(state,plan=defaultKitDefensePlan(state)){
 const s=beginKitDefense(state,plan);let b=s.domestic.war.battle;for(let i=0;!b.result&&i<20000;i++)b=actBattle(b,aiAction(b));if(!b.result)throw Error('自动守城尚未分出胜负');s.domestic.war.battle=b;return finishKitDefense(s);
}
export function withdrawKitDefense(state,{central=0}={}){
 const s=structuredClone(state),d=s.domestic,c=d.strategy?.pending;
 if(!c||c.defender!==d.playerCountryId||d.war.battle||d.collapse?.pending||d.collapse?.ended||state.stats?.life===0||state.reignResult||!Number.isSafeInteger(central)||central<0||central>d.centralArmy.soldiers)throw Error('当前不能撤守');
 captureArmyRecovery(d,s.turn);
 const forces=kitDefenseSources(d).map(f=>({...f,soldiers:f.sourceId==='central'?Math.min(f.soldiers,central):f.soldiers})).filter(f=>f.soldiers>0).map(({countryId,sourceId,soldiers,training})=>({countryId,sourceId,soldiers,training}));
 const id=`kit-withdraw:${c.id}:${d.war.nextId}`;
 function retreatLoss(f,ratio){
  const units=kitGarrison(d,f.sourceId,f.soldiers,{maxStacks:Math.ceil(f.soldiers/MAX_SQUAD_SOLDIERS)+ENABLED_KITS.length}),dead=Math.ceil(f.soldiers*ratio),losses=units.map(u=>Math.floor(u.count*ratio));let left=dead-losses.reduce((n,v)=>n+v,0);
  for(let i=0;left&&i<units.length;i++){const n=Math.min(left,units[i].count-losses[i]);losses[i]+=n;left-=n;}
  reserveWorldKits(d,f.sourceId,id,units);settleWorldKits(d,f.sourceId,id,units.map((u,i)=>u.count-losses[i]));return dead;
 }
 const losses=forces.map(f=>retreatLoss(f,.04)),attackDead=retreatLoss(c.attack,.02),receipt=conclude(d,c,forces,losses,attackDead,false,s.turn,true);
 offerArmyRecovery(d,s.turn);
 receipt.lines.push('撤守按真实来源核销：守方损失4%，攻方损失2%；未阵亡兵员携装归营。');
 if(!d.centralArmy.soldiers){d.centralArmy.training=0;d.general.ongoing=false;d.general.trainingFloor=0;}
 s.stats.treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;s.stats.prestige=d.countries.find(c=>c.id===d.playerCountryId).prestige;validateDomestic(d);return {state:s,receipt};
}
export function resolveKitCampaign(d,turn,{central=0,withdraw=false}={}){
 const home=d.countries.find(c=>c.id===d.playerCountryId),state={domestic:d,turn,stats:{life:1,treasury:home.fiscal.treasury,prestige:home.prestige}};
 const empty=!kitDefenseSources(d).some(f=>f.sourceId==='central'?central>0&&f.soldiers>0:f.soldiers>0);
 const result=withdraw||empty?withdrawKitDefense(state,{central}):autoKitDefense(state,defaultKitDefensePlan(state,central));
 Object.assign(d,result.state.domestic);return result.receipt;
}
