import {DIFFICULTIES} from './difficulty.mjs';
import {ATTRIBUTE_RULES,attributeStats,attributeExplanation} from './card-battle-attributes.mjs';
import {LANDMARK_DEFINITIONS,landmarkSelectionIds,fieldOccupancy,landmarkTargets,deployLandmark,activateLandmark,removeLandmark,refreshLandmarks,validateLandmarkState} from './card-battle-landmarks.mjs';
import {SECRET_DEFINITIONS,secretSelectionIds,canArmSecret,armSecret,resolveAttackSecrets,validateSecretState} from './card-battle-secrets.mjs';
import {WEAPON_DEFINITIONS,weaponSelectionIds,visibleEnemyTargets,legalHeroAttacks,heroAttackPreview,equipWeapon,performHeroAttack,breakWeapon,validateWeaponState} from './card-battle-weapons.mjs';
import {beginCardHistory,finishCardHistory,abortCardHistory,observeCardHistoryEvent,withCardHistoryCause,validateCardHistory} from './card-battle-history.mjs';
import {armyCardCount,normalizeTacticSelection,tacticSelectionIds} from './card-battle-tactics.mjs';
import {HISTORICAL_PEOPLE} from './historical-people.mjs';
import {ensureOfficialGrowth,validateOfficialGrowth} from './official-growth.mjs';
import {CARD_CULTURES,cardCulture,cardRegionalArt,sourceArtCulture,sourceArtRegion,cardArtRegion,regionalPersonPortrait} from './card-battle-cultures.mjs';
import {CARD_CATALOG} from './card-battle-data.mjs';
import * as legacy from './card-battle-legacy.mjs';
import {OFFICIAL_ART, officialPortraitKey, stablePersonId} from './official-art.mjs';

const historicalNames=new Set(HISTORICAL_PEOPLE.map(p=>p.name));
export const CARD_RULES = {"version": 3, "unitSize": 100, "compactArmy": true, "compactPenalty": true, "troopCap": 18, "boardLimit": 7, "handLimit": 10, "deckSize": 30, "spellPackages": {"martial": ["precision", "fire", "fortify", "assault", "supply", "pin", "precision", "fire", "fortify", "supply", "dispel", "heal"], "intelligence": ["precision", "fire", "arrows", "barrage", "pin", "supply", "precision", "execute", "arrows", "barrage", "pin", "dispel"], "command": ["precision", "fire", "fortify", "assault", "supply", "brace", "fire", "fortify", "assault", "supply", "heal", "dispel"]}, "penaltyTiersOnly": true, "reserveDeckGrowth": 2, "lowTrainingPenalty": "general", "scoutVariants": {"intelligence": {"cavalry": "cavalry_patrol_scout"}, "command": {"cavalry": "cavalry_patrol_scout"}}};
CARD_RULES.attributeRules=ATTRIBUTE_RULES;
export const CARD_DEFINITIONS = Object.fromEntries([...CARD_CATALOG.cards, CARD_CATALOG.coin].map(d=>[d.id,d]));
export const HISTORICAL_CARDS = CARD_CATALOG.cards.filter(d=>d.type==='general');
export const RANDOM_CARD_POOLS = CARD_CATALOG.random_pools;
export const TACTICS = Object.fromEntries(CARD_CATALOG.cards.filter(d=>d.type==='spell').map(d=>[d.id,d]));
export const troopNames={infantry:'刀盾兵',spears:'长枪兵',cavalry:'轻骑兵','heavy-cavalry':'重骑兵',archers:'弓兵',crossbows:'弩兵',camel:'骆驼骑兵',elephant:'象兵','horse-archers':'弓骑兵'};
const KINDS=Object.keys(troopNames), normalize=k=>({'heavy-cavalry':'heavy','horse-archers':'horse_archers'}[k]??k);
const masks={foot:['infantry','spears'],cavalry:['cavalry','heavy-cavalry','horse-archers','camel'],ranged:['archers','crossbows','horse-archers']};
export const keywordNames={taunt:'护卫',rush:'突袭',shield:'护甲盾',stealth:'潜行',anti:'反骑',anti_horse:'慑马',pierce:'破盾'};
const other=s=>s==='home'?'enemy':'home',clone=x=>structuredClone(x),isUnit=x=>x.type==='troop'||x.type==='general';
export const cardDeaths=x=>Math.min(x.count,Math.max(0,Math.ceil(x.count*x.lossPeak-1e-9)));
const integer=(n,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=min&&n<=max;
export function personSeed(value){let h=2166136261;for(const x of String(value))h=Math.imul(h^x.charCodeAt(0),16777619);return h>>>0;}
function random(p){p.rng=(p.rng+0x6d2b79f5)>>>0;let t=p.rng;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;}
function shuffle(a,p){for(let i=a.length-1;i>0;i--){const j=Math.floor(random(p)*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const leader=(b,s)=>b.units.find(u=>u.side===s&&u.commander);

export function commanderSkill(g={}){
 const scores={command:g.leadership??35,martial:g.martial??35,intelligence:g.intelligence??35};
 const kind=['command','martial','intelligence'].sort((a,b)=>scores[b]-scores[a])[0];
 return {kind,...{command:{name:'整军',text:'恢复一个友方角色2点生命'},martial:{name:'督战',text:'对一个敌方角色造成1点伤害'},intelligence:{name:'运筹',text:'抽1张牌，然后主将受到2点伤害'}}[kind]};
}

// A generated profile is stored on the person, never rolled by the renderer or an action.
export function createFixedCardPerson(person,seed=personSeed(person.id),culture='central'){
 const id=stablePersonId(person),historical=HISTORICAL_CARDS.find(d=>d.person_id===id);
 if(historical)return {version:1,personId:person.id,historicalDefinitionId:id,name:historical.name,portraitId:id,definitionId:historical.id,abilities:{martial:person.martial,intelligence:person.intelligence,leadership:person.leadership,...Object.fromEntries(['politics','integrity','experience'].filter(k=>Number.isFinite(person[k])).map(k=>[k,person[k]]))},culture};
 const saved=person.cardProfile;if(saved)return clone(saved);
 const ability={martial:person.martial??35,intelligence:person.intelligence??35,leadership:person.leadership??35,...Object.fromEntries(['politics','integrity','experience'].filter(k=>Number.isFinite(person[k])).map(k=>[k,person[k]]))};
 const scores={martial:ability.martial,intelligence:ability.intelligence,command:ability.leadership},top=Math.max(...Object.values(scores)),rng={rng:seed>>>0};
 let roles=Object.keys(scores).filter(k=>scores[k]>=top-10&&(k!=='martial'||scores[k]>=60));
 if(!roles.length)roles=[scores.command>=scores.intelligence?'command':'intelligence'];
 let roll=random(rng)*roles.reduce((n,k)=>n+1+Math.floor(scores[k]/20),0),role=roles.at(-1);
 for(const k of roles){roll-=1+Math.floor(scores[k]/20);if(roll<0){role=k;break;}}
 const value=scores[role],tier=value<60?0:value<75?1:value<90?2:3;
 const pool=RANDOM_CARD_POOLS.filter(d=>d.role===role&&d.tier===tier&&ability.martial>=d.requires_martial),d=clone(pool[Math.floor(random(rng)*pool.length)]);
 const cap=ability.martial<40?2:ability.martial<60?3:ability.martial<80?4:6;
 d.attack=Math.min(cap,Math.max(1,d.attack+(ability.martial<30?-1:ability.martial>=90?1:0)));
 d.health=Math.max(1,d.health+(ability.leadership<40?-1:ability.leadership>=80?1:0));
 d.name=person.name;d.person_id=person.id;d.historical_definition_id=null;
 return {version:1,personId:person.id,historicalDefinitionId:null,name:person.name,portraitId:regionalPersonPortrait(person.artRegion??culture,person.role,seed)??officialPortraitKey(person),abilities:ability,potential:clone(person.potential??null),role,tier,poolId:d.pool,templateId:d.id,generationSeed:seed>>>0,culture,definition:d};
}
export function registerCardPerson(d,person){
 const store=d.cardPeople??={version:1,rng:Math.floor(Math.random()*4294967296),people:{},garrisons:{}};
 store.worldSeed??=store.rng;const id=stablePersonId(person);if(!id)return null;
 store.people[id]??=createFixedCardPerson(person,personSeed(id+':'+store.worldSeed),person.culture??'central');return store.people[id];
}
// Only the turn settlement can advance a fixed profile; registration and viewing never reroll it.
export function upgradeCardPerson(d,person,turn){
 const p=registerCardPerson(d,person);if(d.war?.battle||!p||person.growthVersion!==1)return p;
 const abilities=Object.fromEntries(Object.keys(p.abilities).map(k=>[k,person[k]??p.abilities[k]]));
 if(JSON.stringify(abilities)===JSON.stringify(p.abilities))return p;
 if(!p.historicalDefinitionId){
  const old=RANDOM_CARD_POOLS.find(t=>t.id===p.templateId),value=p.role==='command'?abilities.leadership:abilities[p.role],tier=value<60?0:value<75?1:value<90?2:3;
  const template=RANDOM_CARD_POOLS.find(t=>t.role===p.role&&t.tier===tier&&t.variant===old.variant);
  const def=clone(template),cap=abilities.martial<40?2:abilities.martial<60?3:abilities.martial<80?4:6;
  def.attack=Math.min(cap,Math.max(1,def.attack+(abilities.martial<30?-1:abilities.martial>=90?1:0)));def.health=Math.max(1,def.health+(abilities.leadership<40?-1:abilities.leadership>=80?1:0));
  def.name=p.name;def.person_id=p.personId;def.historical_definition_id=null;
  Object.assign(p,{tier,poolId:template.pool,templateId:template.id,definition:def});
 }
 p.abilities=abilities;p.revision=(p.revision??0)+1;p.lastGrowthTurn=turn;return p;
}
export function validateCardPeople(d){
 const store=d.cardPeople;if(!store)return;
 const fail=()=>{throw Error('人物卡档案无效');};
 if(store.version!==1||!integer(store.rng,0,4294967295)||!store.people||!store.garrisons)fail();
 for(const [id,p]of Object.entries(store.people)){
  if(stablePersonId({id:p.personId})!==id||p.version!==1||typeof p.name!=='string'||(!OFFICIAL_ART[p.portraitId]&&!cardRegionalArt(p.portraitId)))fail();
  if(p.historicalDefinitionId){const definition=CARD_DEFINITIONS[p.definitionId];if(!definition||definition.person_id!==id||p.historicalDefinitionId!==id||p.name!==definition.name||p.portraitId!==id)fail();}
  else{const t=RANDOM_CARD_POOLS.find(t=>t.id===p.templateId);if(!t||p.poolId!==t.pool||!p.definition||p.definition.id!==t.id||p.definition.name!==p.name||p.definition.cost!==t.cost||!Object.values(p.abilities).every(n=>integer(n,0,100)))fail();const a=p.abilities,score=p.role==='command'?a.leadership:a[p.role];if(score<t.primary_min||score>t.primary_max||a.martial<t.requires_martial)fail();const limit=a.martial<40?2:a.martial<60?3:a.martial<80?4:6,attack=Math.min(limit,Math.max(1,t.attack+(a.martial<30?-1:a.martial>=90?1:0))),health=Math.max(1,t.health+(a.leadership<40?-1:a.leadership>=80?1:0));if(p.definition.attack!==attack||p.definition.health!==health||JSON.stringify(p.definition.tags)!==JSON.stringify(t.tags)||JSON.stringify(p.definition.enter)!==JSON.stringify(t.enter)||JSON.stringify(p.definition.death)!==JSON.stringify(t.death))fail();}
 }
 const ids=new Set();for(const p of Object.values(store.garrisons)){if(!p?.id||ids.has(p.id)||!store.people[p.id]||p.generated!==true)fail();ids.add(p.id);validateOfficialGrowth(p);}
 const b=d.war?.battle;if(b?.cards?.rulesVersion>=3){for(const u of b.units){const p=store.people[u.cardPersonId],snapshot=b.cardPeople?.[u.cardPersonId];if(!p||!snapshot||JSON.stringify(p)!==JSON.stringify(snapshot))fail();if(u.general?.id&&stablePersonId(u.general)!==u.cardPersonId)fail();}}
}
export function ensureCardPeople(d,b){
 const store=d.cardPeople??={version:1,rng:Math.floor(Math.random()*4294967296),people:{},garrisons:{}};
 store.worldSeed??=store.rng;const officials=[...(d.justice?.officials??[]),...(d.personnel?.candidates??[])];
 for(const u of b.units){
  u.artCulture??=sourceArtCulture(d,u);
  u.artRegion??=sourceArtRegion(d,u);
  let person=u.general;
  if(!person?.id){
   const source=u.sourceId??u.side,index=b.units.filter(v=>v.sourceId===u.sourceId&&v.commander===u.commander).indexOf(u);
   const key=source+':'+(u.commander?'commander':'officer')+':'+index;
   if(!store.garrisons[key]){
    const rng={rng:personSeed(key+':'+store.worldSeed)},country=d.provinces?.find(p=>p.id===source)?.countryId??d.playerCountryId,culture=cardCulture(country),pool=CARD_CULTURES[culture].names;
    // Missing names never grant free ability: both countries inherit the actual source leader's scores.
    const scores={martial:person?.martial??35,intelligence:person?.intelligence??35,leadership:person?.leadership??35};
    let name;do{name=pool[0][Math.floor(random(rng)*pool[0].length)]+pool[1][Math.floor(random(rng)*pool[1].length)];}while(historicalNames.has(name));
    store.garrisons[key]={id:'garrison-'+key+':'+store.worldSeed,name,...scores,politics:35+Math.floor(random(rng)*25),integrity:45+Math.floor(random(rng)*40),experience:10+Math.floor(random(rng)*20),role:'武将',generated:true,culture,artRegion:cardArtRegion(country)};
   }
   person=store.garrisons[key];ensureOfficialGrowth(person);
  }else person=officials.find(p=>p.id===person.id)??person;
  const identity=stablePersonId(person);if(!store.people[identity]){const profile=createFixedCardPerson(person,personSeed(identity+':'+store.worldSeed),person.culture??'central');store.people[identity]=profile;}const profile=store.people[identity];
  u.cardPersonId=identity;
  // Existing names and portraits are preserved, including the initial eleven officers.
  // The ID-keyed domestic registry persists the fixed profile without changing officer snapshots.
 }
 store.rng??=personSeed('legacy-registry');b.cardSeed=Math.floor(random(store)*4294967296);
 b.cardPeople=Object.fromEntries([...new Set(b.units.map(u=>u.cardPersonId))].map(id=>[id,clone(store.people[id])]));
 return b;
}
export function battlePerson(b,u){return b.cardPeople?.[u.cardPersonId]??{personId:u.general?.id,name:u.general?.name??'署理将领',portraitId:officialPortraitKey(u.general),abilities:u.general??{}};}
function definitionFor(b,u){if(b.cards?.personCatalog?.[u.cardPersonId])return b.cards.personCatalog[u.cardPersonId];const p=battlePerson(b,u);return p.historicalDefinitionId?CARD_DEFINITIONS[p.definitionId]:p.definition;}
function setStats(d,count,training,rules=CARD_RULES){
 const main=d.type==='general'||/_line$|_elite$/.test(d.id),elite=/_elite$/.test(d.id);
 const penalized=rules.penaltyTiersOnly?(elite||d.type==='general'):main;const lowPenalty=rules.lowTrainingPenalty==='general'?d.type==='general':rules.lowTrainingPenalty==='elite'?elite:rules.lowTrainingPenalty==='none'?false:penalized;const trainingDelta=training<40&&lowPenalty?-1:training>=90&&(elite||d.type==='general')||training>=70&&elite?1:0;const delta=trainingDelta-(rules.compactPenalty&&penalized&&count<75?1:0);
 const ratio=Math.min(1,count/(rules.compactArmy?25:rules.unitSize));
 return {attack:Math.max(1,Math.floor(d.attack*ratio)),hp:Math.max(1,Math.floor(Math.max(1,d.health+delta)*ratio))};
}
function unitStats(b,d,u,count){
 const rules=b.cards.rulesSnapshot;
 return rules.attributeRules?attributeStats(d,count,u.training,rules.attributeRules,battlePerson(b,u).abilities,battlePerson(b,leader(b,u.side)).abilities,u.kind):setStats(d,count,u.training,rules);
}
export function cardAttributeBreakdown(b,x){
 if(!isUnit(x))return null;
 const u=b.units.find(u=>u.id===x.unitId&&u.side===x.side);
 if(!u)return null;
 if(!b.cards.rulesSnapshot.attributeRules)return {title:'开战属性 · 旧版规则',lines:[`本场沿用旧版开战快照：${x.count}人，训练${x.training}，锁定${x.printedAttack}攻／${x.printedHp}命。新属性规则从下一场战斗生效。`]};
 return attributeExplanation(unitStats(b,x.definition,u,x.count),x.definition,x.count,x.training,battlePerson(b,u).name,battlePerson(b,leader(b,u.side)).name);
}
function makeCard(b,side,d,unit=null,count=0){
 const c=b.cards,id=side+'-'+c.nextId++,computed=count?unitStats(b,d,unit,count):{},stats=count?{attack:computed.attack,hp:computed.hp}:{};
 const x={id,definitionId:d.id,type:d.type==='spell'?'tactic':d.type,side,name:d.name,cost:d.cost,definition:clone(d),...(unit?{unitId:unit.id,kind:unit.kind,count,training:unit.training,general:unit.general?.name,...(d.type==='general'?{personId:unit.cardPersonId,personInstanceId:unit.general?.id??battlePerson(b,unit).personId,historicalDefinitionId:battlePerson(b,unit).historicalDefinitionId??null}:{}),...stats,maxHp:stats.hp,printedAttack:stats.attack,printedHp:stats.hp,ready:false,rushing:false,tags:[...d.tags],buffAttack:0,buffHealth:0,tempAttack:0,lossPeak:0,played:0,frozen:false,silenced:false}: {})};
 c.catalog[id]=x;return id;
}
function cardForUnit(b,u,suffix,count){const variant=suffix==='scout'?b.cards.rulesSnapshot.scoutVariants?.[b.cards.players[u.side].skill.kind]?.[u.kind]:null;return makeCard(b,u.side,b.cards.definitionCatalog[u.equipped===false?'levy':suffix==='vanguard'?'vanguard':variant??normalize(u.kind)+'_'+suffix],u,count);}
function allocate(units,k){
 const total=units.reduce((n,u)=>n+u.initial,0),rows=units.map((u,i)=>({u,i,q:Math.floor(k*u.initial/total),fraction:k*u.initial/total%1}));
 const order=[...rows].sort((a,b)=>b.fraction-a.fraction||KINDS.indexOf(a.u.kind)-KINDS.indexOf(b.u.kind)||a.i-b.i);
 const missing=k-rows.reduce((n,r)=>n+r.q,0);for(let i=0;i<missing;i++)order[i%order.length].q++;
 return rows;
}
export function attachCards(b,{rulesVersion=3,seed,first,seeds}={}){
 if(rulesVersion<3)return legacy.attachCards(b,{rulesVersion});
 const landmarkAllocation=b.command.landmarkAllocation,landmarkCount=side=>landmarkSelectionIds(landmarkAllocation?.[side]?.selection).length;
 const secretAllocation=b.command.secretAllocation,secretCount=side=>secretSelectionIds(secretAllocation?.[side]?.selection).length;
 const weaponAllocation=b.command.weaponAllocation,weaponCount=side=>weaponSelectionIds(weaponAllocation?.[side]?.selection).length;
 const homeTotal=b.units.filter(u=>u.side==='home'&&!u.commander).reduce((n,u)=>n+u.initial,0),configuredTactics=normalizeTacticSelection(b.command.cardTactics,CARD_RULES.deckSize-armyCardCount(homeTotal,CARD_RULES)-weaponCount('home')-secretCount('home')-landmarkCount('home'));
 const rngSeed=(seed??b.cardSeed??personSeed('battle:'+b.command.id))>>>0;first??=random({rng:rngSeed^0x5f3759df})<.5?'home':'enemy';
 const c=b.cards={version:2,rulesVersion:landmarkAllocation?6:secretAllocation?5:weaponAllocation?4:3,seed:rngSeed,first,turn:first,phase:'mulligan',ply:1,nextId:1,sequence:0,players:{},catalog:{},events:[]};
 if(configuredTactics){c.deckConfiguration={version:1,tactics:configuredTactics};c.deckConfigurationHash=personSeed(JSON.stringify(c.deckConfiguration));}
 // Callers prepare persistent people; fixtures can supply already fixed profile snapshots.
 for(const u of b.units)if(!u.cardPersonId&&u.general?.id){u.cardPersonId=u.general.id;b.cardPeople??={};b.cardPeople[u.cardPersonId]??=createFixedCardPerson(u.general);}
 c.rulesSnapshot=clone(CARD_RULES);c.rulesSnapshot.version=c.rulesVersion;if(weaponAllocation)c.weaponSupplies={};if(secretAllocation){c.secretSequence=0;c.secretAiVersion=1;}if(landmarkAllocation)c.landmarkAiVersion=1;c.catalogVersion=String(CARD_CATALOG.version)+(weaponAllocation?'+weapons.1':'')+(secretAllocation?'+secrets.1':'')+(landmarkAllocation?'+landmarks.1':'');if(weaponAllocation)c.weaponAiVersion=1;c.definitionCatalog=clone(Object.fromEntries(Object.entries(CARD_DEFINITIONS).filter(([,d])=>d.type!=='general')));if(weaponAllocation)Object.assign(c.definitionCatalog,clone(WEAPON_DEFINITIONS));if(secretAllocation)Object.assign(c.definitionCatalog,clone(SECRET_DEFINITIONS));if(landmarkAllocation)Object.assign(c.definitionCatalog,clone(LANDMARK_DEFINITIONS));c.personCatalog={};for(const u of b.units){const d=definitionFor(b,u);if(d)c.personCatalog[u.cardPersonId]=clone(d);}c.definitionHash=personSeed(JSON.stringify([c.rulesSnapshot,c.definitionCatalog,c.personCatalog]));
 for(const side of ['home','enemy']){
  const army=b.units.filter(u=>u.side===side&&!u.commander),total=army.reduce((n,u)=>n+u.initial,0),k=armyCardCount(total,CARD_RULES);
  const p=c.players[side]={hero:30,armor:side===(b.field?.defenderSide??'enemy')?Math.max(0,Math.min(4,Math.round(((b.field?.defense??1)-1)*8))):0,mana:0,maxMana:0,hand:[],deck:[],board:[],grave:[],reserve:Object.fromEntries(army.map(u=>[u.id,u.initial])),gaps:[],fatigue:0,ownTurn:0,powerUsed:false,heroDamage:0,discount:0,rng:(seeds?.[side]??personSeed(rngSeed+':'+side))>>>0,skill:commanderSkill(leader(b,side).general?.id?leader(b,side).general:battlePerson(b,leader(b,side)).abilities)};
  if(weaponAllocation){p.weapon=null;p.heroAttackUsed=false;}if(secretAllocation)p.secrets=[];if(landmarkAllocation)p.landmarks=[];
  const raw=[];
  for(const row of allocate(army,k))for(let j=0;j<row.q;j++){const count=Math.min(CARD_RULES.unitSize,CARD_RULES.compactArmy?Math.floor(row.u.initial/row.q)+(j<row.u.initial%row.q?1:0):p.reserve[row.u.id]);if(count){p.reserve[row.u.id]-=count;raw.push({u:row.u,count});}}
  raw.sort((a,b)=>CARD_DEFINITIONS[normalize(a.u.kind)+'_line'].cost-CARD_DEFINITIONS[normalize(b.u.kind)+'_line'].cost||KINDS.indexOf(a.u.kind)-KINDS.indexOf(b.u.kind));
  if(raw.length){const front=raw.shift(),id=cardForUnit(b,front.u,'vanguard',front.count);c.catalog[id].front=true;p.hand.push(id);}
  const scoutCount=Math.min(5,Math.max(0,Math.ceil(k/3)-1));
  for(let j=0;j<scoutCount&&raw.length;j++){
   const counts=Object.fromEntries(KINDS.map(kind=>[kind,raw.filter(x=>x.u.kind===kind).length]));
   raw.sort((a,b)=>counts[b.u.kind]-counts[a.u.kind]||KINDS.indexOf(a.u.kind)-KINDS.indexOf(b.u.kind));const row=raw.shift();p.deck.push(cardForUnit(b,row.u,'scout',row.count));
  }
  const usedPeople=new Set([leader(b,side).cardPersonId]);let generals=0;
  for(let i=0;i<raw.length&&generals<Math.min(3,Math.ceil(k/6));){
   const row=raw[i],d=definitionFor(b,row.u);
   if(d&&row.count>=(CARD_RULES.compactArmy?25:CARD_RULES.unitSize)&&row.u.cardPersonId&&!usedPeople.has(row.u.cardPersonId)){
    raw.splice(i,1);usedPeople.add(row.u.cardPersonId);generals++;p.deck.push(makeCard(b,side,d,row.u,row.count));
   }else i++;
  }
  raw.forEach((row,i)=>p.deck.push(cardForUnit(b,row.u,(i+1)%3===0?'elite':'line',row.count)));
  for(const definitionId of weaponSelectionIds(weaponAllocation?.[side]?.selection)){const d=c.definitionCatalog[definitionId],id=makeCard(b,side,d),x=c.catalog[id];x.attack=d.attack;x.durability=d.durability;c.weaponSupplies[id]={sourceId:weaponAllocation[side].sourceId,kind:d.kitKind,quantity:1,lost:false};p.deck.push(id);}
  for(const definitionId of secretSelectionIds(secretAllocation?.[side]?.selection)){const d=c.definitionCatalog[definitionId],id=makeCard(b,side,d),x=c.catalog[id],u=leader(b,side);x.secretSource={unitId:u.id,sourceId:u.sourceId,personId:u.cardPersonId};x.secretRevealed=false;p.deck.push(id);}
  for(const definitionId of landmarkSelectionIds(landmarkAllocation?.[side]?.selection)){const d=c.definitionCatalog[definitionId],id=makeCard(b,side,d),x=c.catalog[id],u=leader(b,side);x.landmarkSource={unitId:u.id,sourceId:u.sourceId,personId:u.cardPersonId};x.uses=d.uses;x.landmarkUsed=0;x.landmarkReadyTurn=0;p.deck.push(id);}
  if(side==='home'&&configuredTactics){for(const id of tacticSelectionIds(configuredTactics))p.deck.push(makeCard(b,side,c.definitionCatalog[id]));}
  else{
  const spells=CARD_RULES.spellPackages?.[p.skill.kind]?.map(id=>TACTICS[id])??Object.values(TACTICS);const picked=[];for(const d of [...spells,...Object.values(TACTICS).flatMap(d=>[d,d])]){if(picked.length>=30-k-weaponCount(side)-secretCount(side)-landmarkCount(side))break;if(picked.filter(id=>id===d.id).length<2){picked.push(d.id);p.deck.push(makeCard(b,side,d));}}for(let j=picked.length;j<30-k-weaponCount(side)-secretCount(side)-landmarkCount(side);j++)p.deck.push(makeCard(b,side,spells[j%spells.length]));
  }
  shuffle(p.deck,p);const n=3+(side!==first)-p.hand.length;
  for(let j=0;j<n;j++)draw(b,side);
  if(side!==first){const id=makeCard(b,side,CARD_CATALOG.coin);p.hand.push(id);}
 }
 // The opponent chooses its mulligan using only its own hand and public deck composition.
 mulligan(b,'enemy',c.players.enemy.hand.filter(id=>!c.catalog[id].front&&id!==c.players.enemy.hand.find(id=>c.catalog[id].definitionId==='coin')&&!keepOpening(c.catalog[id])));
 b.log=['军阵已成。前锋计入起手；确认后按先后手开始交锋。'];return b;
}
function keepOpening(x){return (isUnit(x)||x.type==='weapon')&&x.cost<=3||x.definitionId==='precision';}
function event(b,type,data={}){b.cards.events.push({type,...data});observeCardHistoryEvent(b,type,data);}
function heroHurt(b,side,n){const p=b.cards.players[side],armor=Math.min(p.armor,n);p.armor-=armor;p.hero-=n-armor;p.heroDamage+=n-armor;event(b,'damage',{target:side+'-hero',amount:n-armor,armor});}
function hurt(b,x,n){if(n<=0)return;if(x.tags.includes('shield')){x.tags=x.tags.filter(t=>t!=='shield');event(b,'shield',{target:x.id});return;}x.hp-=n;x.lossPeak=Math.max(x.lossPeak,Math.min(1,1-x.hp/x.maxHp));event(b,'damage',{target:x.id,amount:n});}
function draw(b,side,filter){
 const c=b.cards,p=c.players[side];let i=0;
 if(filter){i=p.deck.findIndex(id=>matchesFilter(c.catalog[id],filter));if(i<0)return;}
 else if(!p.deck.length){withCardHistoryCause(b,{kind:'fatigue',sourceId:side+'-hero'},()=>{heroHurt(b,side,++p.fatigue);event(b,'fatigue',{side,amount:p.fatigue});});return;}
 const [id]=p.deck.splice(i,1),burn=p.hand.length>=10;(burn?p.grave:p.hand).push(id);event(b,burn?'burn':'draw',{id,side});
}
function matchesFilter(x,filter){return filter==='tactic'?['tactic','secret'].includes(x.type):filter==='troop'?isUnit(x):filter==='general'?x.type==='general':filter==='low'?x.cost<=2:x.cost>=5;}
function mulligan(b,side,ids){
 const c=b.cards,p=c.players[side];if(!Array.isArray(ids)||new Set(ids).size!==ids.length||ids.some(id=>!p.hand.includes(id)||c.catalog[id].front||c.catalog[id].definitionId==='coin'))throw Error('请选择可替换的起手牌；前锋与调兵令保留。');
 p.hand=p.hand.filter(id=>!ids.includes(id));for(const _ of ids)draw(b,side);p.deck.push(...ids);shuffle(p.deck,p);
}
function startTurn(b,side){
 const c=b.cards,p=c.players[side];c.turn=side;p.ownTurn++;p.maxMana=Math.min(10,p.maxMana+1);p.mana=p.maxMana;p.powerUsed=false;p.discount=0;if(b.command.weaponAllocation)p.heroAttackUsed=false;
 refreshLandmarks(b,side,(type,data)=>event(b,type,data));
 for(const id of p.board){const x=c.catalog[id];x.ready=true;x.rushing=false;}
 if(!p.deck.length&&p.ownTurn>1&&p.gaps.length&&p.hand.length<10){
  const eligible=Object.keys(p.reserve).filter(id=>p.reserve[id]>=c.rulesSnapshot.unitSize),gap=p.gaps.find(id=>eligible.includes(id)),unitId=gap??eligible.sort((a,b)=>p.reserve[b]-p.reserve[a])[0];
  if(unitId){const u=b.units.find(u=>u.id===unitId);p.reserve[unitId]-=c.rulesSnapshot.unitSize;p.gaps.splice(gap?p.gaps.indexOf(gap):0,1);p.deck.push(cardForUnit(b,u,'line',c.rulesSnapshot.unitSize));event(b,'reserve',{unitId});}
 }
 draw(b,side);event(b,'turn',{side,round:b.round});cleanup(b);
}
function fxTargets(b,side,fx,actor=null){
 const c=b.cards;if(!fx?.target)return [];
 const p=c.players[fx.target==='friend'?side:other(side)];
 const out=p.board.filter(id=>{const x=c.catalog[id];return x!==actor&&(fx.target==='friend'||!x.tags.includes('stealth'))&&(!fx.mask||fx.mask==='all'||masks[fx.mask]?.includes(x.kind))&&(!fx.injured||x.hp<x.maxHp);});
 if(fx.target==='enemy_character')out.push('hero');return out;
}
function targeted(x){return x.definition.enter.find(fx=>fx.target);}
export function cardCost(b,id){const x=b.cards.catalog[id],p=b.cards.players[x.side];return Math.max(0,x.cost-(['tactic','secret'].includes(x.type)&&x.definitionId!=='coin'?p.discount:0));}
export function legalCardTargets(b,id){const x=b.cards.catalog[id];return x?fxTargets(b,x.side,targeted(x)):[];}
export function legalPowerTargets(b){const c=b.cards,p=c.players[c.turn],e=c.players[other(c.turn)];return p.skill.kind==='martial'?[...e.board.filter(id=>!c.catalog[id].tags.includes('stealth')),'hero']:p.skill.kind==='command'?[...p.board.filter(id=>c.catalog[id].hp<c.catalog[id].maxHp),...(p.hero<30?['hero']:[])]:[];}
function buff(b,x,fx){
 const a=fx.a??0,h=fx.h??0;x.attack=Math.max(0,x.attack+a);x.maxHp+=h;x.hp+=h;x.buffHealth+=h;
 if(fx.temp)x.tempAttack+=a;else x.buffAttack+=a;
 if(fx.give&&!x.tags.includes(fx.give))x.tags.push(fx.give);
 event(b,'buff',{target:x.id,attack:a,health:h});
}
function effect(b,side,fx,target,actor){
 const c=b.cards,p=c.players[side],e=c.players[other(side)],x=c.catalog[target],n=fx.n??0;
 switch(fx.op){
  case 'draw':for(let i=0;i<n;i++)draw(b,side,fx.filter);break;
  case 'armor':p.armor+=n;event(b,'armor',{target:side+'-hero',amount:n});break;
  case 'heal':{const amount=Math.min(n,30-p.hero);p.hero+=amount;event(b,'heal',{target:side+'-hero',amount});break;}
  case 'selfdamage':heroHurt(b,side,n);break;
  case 'refund':{const before=p.mana;p.mana=Math.min(10,p.mana+n);event(b,'mana',{side,amount:p.mana-before});break;}
  case 'discount':{const before=p.discount;p.discount=Math.min(10,p.discount+n);event(b,'discount',{side,amount:p.discount-before});break;}
  case 'aoe':for(const id of e.board)hurt(b,c.catalog[id],n);break;
  case 'damage':if(target==='hero')heroHurt(b,other(side),n);else if(x)hurt(b,x,n);break;
  case 'destroy':if(x){x.hp=0;x.lossPeak=1;event(b,'damage',{target:x.id,amount:x.maxHp});}break;
  case 'freeze':if(x){x.frozen=true;event(b,'freeze',{target:x.id});}break;
  case 'setattack':if(x){x.attack=n;x.buffAttack=n-x.printedAttack;x.tempAttack=0;event(b,'buff',{target:x.id});}break;
  case 'silence':if(x){x.silenced=true;x.tags=[];if(x.enteredPly===c.ply&&x.side===c.turn&&x.rushing)x.ready=false;x.rushing=false;x.attack=x.printedAttack;x.maxHp=x.printedHp;x.hp=Math.min(x.hp,x.maxHp);x.buffAttack=x.buffHealth=x.tempAttack=0;x.frozen=false;x.lossPeak=Math.max(x.lossPeak,Math.min(1,1-x.hp/x.maxHp));event(b,'silence',{target:x.id});}break;
  case 'buff':if(x)buff(b,x,fx);break;
  case 'group':{const ids=p.board.filter(id=>c.catalog[id]!==actor&&(!fx.mask||fx.mask==='all'||masks[fx.mask]?.includes(c.catalog[id].kind)));shuffle(ids,p);for(const id of ids.slice(0,fx.limit??ids.length))buff(b,c.catalog[id],fx);break;}
 }
}
function cleanup(b){
 const c=b.cards;
 for(let pass=0;pass<30;pass++){
  const dead=['home','enemy'].flatMap(side=>c.players[side].board.filter(id=>c.catalog[id].hp<=0)).sort((a,z)=>c.catalog[a].played-c.catalog[z].played);
  if(!dead.length)break;
  for(const id of dead){const x=c.catalog[id],p=c.players[x.side];p.board=p.board.filter(v=>v!==id);p.grave.push(id);x.lossPeak=1;p.gaps.push(x.unitId);event(b,'death',{id});}
  for(const id of dead){const x=c.catalog[id];if(!x.silenced)for(const fx of x.definition.death)withCardHistoryCause(b,{kind:'death',sourceId:x.id,effect:fx.op},()=>effect(b,x.side,fx,null,x));}
 }
 for(const u of b.units){
  const p=c.players[u.side];u.dead=u.commander?Math.ceil(u.initial*Math.min(30,p.heroDamage)/60):Object.values(c.catalog).filter(x=>x.unitId===u.id).reduce((n,x)=>n+cardDeaths(x),0);u.count=u.initial-u.dead;
 }
 const a=c.players.home.hero<=0,z=c.players.enemy.hero<=0;
 if(a||z){for(const side of ['home','enemy'])if(c.players[side].hero<=0&&c.players[side].weapon)breakWeapon(b,side,'leader-defeated',(type,data)=>event(b,type,data));b.result=a&&z?'draw':a?'defeat':'victory';c.phase='ended';for(const side of ['home','enemy'])if(c.players[side].hero<=0)leader(b,side).fled=true;event(b,'result',{result:b.result});}
 b.log=b.log.slice(-30);
}
export function cardAttackStatus(b,id){
 if((b.cards.rulesVersion??1)<3)return legacy.cardAttackStatus(b,id);
 const c=b.cards,x=c.catalog[id],p=x&&c.players[x.side];
 if(b.result)return {code:'ended',label:'战斗结束',reason:'战斗已结束，请结算战果。'};
 if(c.phase!=='play')return {code:'deployment',label:'未开战',reason:'确认起手后开始交战。'};
 if(!x||!p.board.includes(id))return {code:'hand',label:'未上场',reason:'先将手牌部署到战场。'};
 if(c.turn!==x.side)return {code:'opponent',label:'敌方回合',reason:'等待对方结束回合。'};
 if(x.frozen)return {code:'frozen',label:'被牵制',reason:'部队被冻结，将错过本次攻击机会。'};
 if(!x.attack)return {code:'zero',label:'无法攻击',reason:'当前攻击为0。'};
 if(!x.ready)return x.attackedPly===c.ply?{code:'spent',label:'已攻击',reason:'本回合已攻击，下个己方回合恢复。'}:{code:'summoned',label:'刚上场',reason:'普通部队登场后需等待下个己方回合；突袭可立即攻击部队。'};
 return {code:'ready',label:x.rushing?'突袭就绪':'可攻击',reason:x.rushing?'选择敌方部队，突袭登场回合不能攻击主将。':'选择敌方部队或主将，攻击不消耗军令。'};
}
export function legalCardAttacks(b,id){
 if((b.cards.rulesVersion??1)<3)return legacy.legalCardAttacks(b,id);
 const c=b.cards,x=c.catalog[id];if(!x||cardAttackStatus(b,id).code!=='ready')return [];
 const targets=visibleEnemyTargets(b,x.side);return x.rushing?targets.filter(id=>id!=='hero'):targets;
}
export function attackPreview(b,id,target){
 const x=b.cards.catalog[id],t=b.cards.catalog[target];if(!legalCardAttacks(b,id).includes(target))return null;
 const bonus=t&&((x.tags.includes('anti')&&masks.cavalry.includes(t.kind))||(x.tags.includes('anti_horse')&&['cavalry','heavy-cavalry','horse-archers'].includes(t.kind))||(x.tags.includes('pierce')&&t.tags.includes('taunt')))?2:0;
 return {damage:x.attack+bonus,retaliation:t?.attack??0,targetLife:target==='hero'?Math.max(0,b.cards.players[other(x.side)].hero-Math.max(0,x.attack-b.cards.players[other(x.side)].armor)):Math.max(0,t.hp-(t.tags.includes('shield')?0:x.attack+bonus)),attackerLife:Math.max(0,x.hp-(x.tags.includes('shield')?0:t?.attack??0))};
}
export function legalCardActions(b){
 const c=b.cards,p=c.players[c.turn],e=c.players[other(c.turn)],out=[];
 if(b.result)return out;
 if(c.phase==='mulligan')return [{type:'mulligan',ids:c.players.home.hand.filter(id=>!c.catalog[id].front&&c.catalog[id].definitionId!=='coin'&&!keepOpening(c.catalog[id]))}];
 for(const target of legalHeroAttacks(b))out.push({type:'hero-attack',target});
 for(const id of p.board)for(const target of legalCardAttacks(b,id))out.push({type:'attack',id,target});
 for(const id of p.landmarks??[]){for(const target of landmarkTargets(b,id))out.push({type:'landmark-use',id,target});out.push({type:'landmark-remove',id});}
 for(const id of p.hand){const x=c.catalog[id];if(cardCost(b,id)>p.mana||(isUnit(x)||x.type==='landmark')&&fieldOccupancy(p)>=7||x.type==='secret'&&!canArmSecret(b,x))continue;const fx=targeted(x),targets=fx?legalCardTargets(b,id):[];if(fx&&targets.length)for(const target of targets)out.push({type:'play',id,target});else if(!fx||isUnit(x))out.push({type:'play',id});}
 if(p.mana>=2&&!p.powerUsed){if(p.skill.kind==='intelligence')out.push({type:'power'});else for(const target of legalPowerTargets(b))out.push({type:'power',target});}
 out.push({type:'end'});return out;
}
export function actCards(original,action){
 if((original.cards.rulesVersion??1)<3)return legacy.actCards(original,action);
 const b=clone(original);return actCardsMutable(b,action);
}
// Shared by real actions and the headless balance harness. No alternative combat implementation.
export function actCardsMutable(b,action){
 beginCardHistory(b,action);try{applyCardsMutable(b,action);return finishCardHistory(b);}catch(e){abortCardHistory(b);throw e;}
}
function applyCardsMutable(b,action){
 const c=b.cards;if(b.result)throw Error('战斗已经结束。');c.events=[];
 if(action.type==='retreat'){if(action.side&&action.side!=='home')throw Error('只能命令我方撤军。');const side='home';for(const u of b.units.filter(u=>u.side===side))u.fled=true;b.result=side==='home'?'defeat':'victory';c.retreated=side;c.phase='ended';b.log.push('全军撤退，生还部队携装归营。');event(b,'result',{result:b.result});return b;}
 if(c.phase==='mulligan'){if(action.type!=='mulligan')throw Error('请先确认起手牌。');mulligan(b,'home',action.ids??[]);c.phase='play';withCardHistoryCause(b,{kind:'start-turn',sourceId:c.first+'-hero'},()=>startTurn(b,c.first));b.log.push(c.first==='home'?'我军先行。':'敌军先行，我方持调兵令。');return b;}
 const side=c.turn,p=c.players[side],e=c.players[other(side)],valid=legalCardActions(b).some(a=>a.type===action.type&&a.id===action.id&&a.target===action.target);
 if(!valid)throw Error(action.type==='attack'?'此目标不可攻击：检查护卫、突袭与部队状态。':action.type==='play'?'军令、场位或目标不符合出牌要求。':'当前不能使用此军令。');
 if(action.type==='play'){
  const x=c.catalog[action.id];p.mana-=cardCost(b,x.id);p.hand.splice(p.hand.indexOf(x.id),1);
  if(x.type==='landmark'){deployLandmark(b,x,(type,data)=>event(b,type,data));}
  else if(x.type==='secret'){armSecret(b,x,(type,data)=>event(b,type,data));p.discount=0;}
  else if(x.type==='weapon'){equipWeapon(b,x,(type,data)=>event(b,type,data));}
  else if(x.type==='tactic'){p.grave.push(x.id);if(x.definitionId!=='coin')p.discount=0;}
  else{p.board.push(x.id);x.played=++c.sequence;x.enteredPly=c.ply;x.ready=x.tags.includes('rush');x.rushing=x.ready;}
  event(b,'play',{id:x.id,side,target:action.target});for(const fx of x.definition.enter)withCardHistoryCause(b,{kind:'enter',sourceId:x.id,effect:fx.op},()=>effect(b,side,fx,action.target,x));
  b.log.push(`${side==='home'?'我军':'敌军'}部署${x.type==='secret'&&side==='enemy'?'未知奥秘':x.name}${action.target?'，目标'+(action.target==='hero'?'主将':c.catalog[action.target].name):''}。`);
 }else if(action.type==='landmark-use'){
  activateLandmark(b,action.id,action.target,{emit:(type,data)=>event(b,type,data),withCause:(cause,fn)=>withCardHistoryCause(b,cause,fn),heal:(id,n)=>{const x=c.catalog[id],amount=Math.min(n,x.maxHp-x.hp);x.hp+=amount;event(b,'heal',{target:id,amount});},buff:(id,n)=>buff(b,c.catalog[id],{a:n,temp:true})});b.log.push(`${c.catalog[action.id].name}发动军阵设施。`);
 }else if(action.type==='landmark-remove'){removeLandmark(b,action.id,'dismantled',(type,data)=>event(b,type,data));b.log.push('主动撤下军阵设施，剩余次数不返还。');
 }else if(action.type==='attack'){
  const x=c.catalog[action.id],t=c.catalog[action.target],forecast=attackPreview(b,x.id,action.target);let strikeCancelled=false;x.ready=false;x.attackedPly=c.ply;x.tags=x.tags.filter(k=>k!=='stealth');event(b,'attack',{id:x.id,target:action.target,side});
  if(action.target==='hero'){strikeCancelled=!resolveAttackSecrets(b,action,{emit:(type,data)=>event(b,type,data),withCause:(cause,fn)=>withCardHistoryCause(b,cause,fn),hurt:(x,n)=>hurt(b,x,n),cleanup:()=>cleanup(b)});if(!strikeCancelled)heroHurt(b,other(side),forecast.damage);if(b.result)return b;}else{hurt(b,t,forecast.damage);withCardHistoryCause(b,{kind:'counterattack',sourceId:t.id},()=>hurt(b,x,forecast.retaliation));}
  b.log.push(strikeCancelled?`${x.name}的主将攻击被已揭示奥秘中止。`:`${x.name}攻击${t?.name??'敌方主将'}，造成${forecast.damage}伤害${t?'，同时受到'+forecast.retaliation+'反击':''}。`);
 }else if(action.type==='hero-attack'){
  const forecast=heroAttackPreview(b,action.target);performHeroAttack(b,action.target,{emit:(type,data)=>event(b,type,data),beforeStrike:()=>resolveAttackSecrets(b,action,{emit:(type,data)=>event(b,type,data),withCause:(cause,fn)=>withCardHistoryCause(b,cause,fn),hurt:(x,n)=>hurt(b,x,n),cleanup:()=>cleanup(b)}),damageHero:(side,n)=>heroHurt(b,side,n),damageUnit:(x,n)=>hurt(b,x,n),withCause:(cause,fn)=>withCardHistoryCause(b,cause,fn)});b.log.push(`主将使用武器造成${forecast.damage}伤害，受到${forecast.retaliation}反击，消耗1耐久。`);
 }else if(action.type==='power'){
  p.mana-=2;p.powerUsed=true;event(b,'power',{side,target:action.target,kind:p.skill.kind});
  if(p.skill.kind==='intelligence'){draw(b,side);heroHurt(b,side,2);}
  else if(p.skill.kind==='martial'){if(action.target==='hero')heroHurt(b,other(side),1);else hurt(b,c.catalog[action.target],1);}
  else{const x=c.catalog[action.target],amount=Math.min(2,action.target==='hero'?30-p.hero:x.maxHp-x.hp);if(x)x.hp+=amount;else p.hero+=amount;event(b,'heal',{target:x?.id??side+'-hero',amount});}
  b.log.push(`${battlePerson(b,leader(b,side)).name}发动${p.skill.name}。`);
 }else if(action.type==='end'){
  for(const id of p.board){const x=c.catalog[id];const attack=-x.tempAttack,thaw=x.frozen;x.attack-=x.tempAttack;x.tempAttack=0;x.frozen=false;if(attack||thaw)withCardHistoryCause(b,{kind:'turn-end',sourceId:id},()=>event(b,'expire',{target:id,attack,thaw}));}p.discount=0;cleanup(b);if(b.result)return b;
  c.ply++;b.round=Math.ceil(c.ply/2);withCardHistoryCause(b,{kind:'start-turn',sourceId:other(side)+'-hero'},()=>startTurn(b,other(side)));
 }
 cleanup(b);return b;
}

function value(x){return x.attack*1.15+Math.max(0,x.hp)*.55+(x.tags.includes('taunt')?.7:0)+(x.tags.includes('shield')?1+x.attack*.3:0)+(x.tags.includes('stealth')?.6:0);}
function hurtValue(x,n){return x.tags.includes('shield')?1+x.attack*.3:n>=x.hp?value(x)+1.2:n*.55;}
function fxValue(b,side,fx,target,actor){
 const c=b.cards,p=c.players[side],e=c.players[other(side)],x=c.catalog[target],n=fx.n??0,danger=Math.max(0,e.board.reduce((s,id)=>s+c.catalog[id].attack,0)-p.hero-p.armor+4);
 switch(fx.op){
  case 'draw':{const available=fx.filter?p.deck.filter(id=>matchesFilter(c.catalog[id],fx.filter)).length:p.deck.length;return Math.min(n,available,Math.max(0,11-p.hand.length))*2.8-(fx.filter?0:Math.max(0,n-available)*2);}
  case 'armor':return n*(.4+Math.min(4,danger)*.1);
  case 'heal':return Math.min(n,30-p.hero)*(.65+Math.min(4,danger)*.15);
  case 'selfdamage':return -n*(.5+Math.min(4,danger)*.2);
  case 'discount':case 'refund':return n*.7;
  case 'aoe':return e.board.reduce((s,id)=>s+hurtValue(c.catalog[id],n),0);
  case 'group':return Math.min(p.board.filter(id=>c.catalog[id]!==actor&&(!fx.mask||fx.mask==='all'||masks[fx.mask]?.includes(c.catalog[id].kind))).length,fx.limit??99)*((fx.a??0)*(fx.temp?.65:.9)+(fx.h??0)*.55);
  case 'damage':if(target==='hero')return n>=e.hero+e.armor?100000:n*(1+(e.hero+e.armor<=12?.4:0));return x?hurtValue(x,n)+(n>=x.hp&&!x.tags.includes('shield')?Math.min(danger,x.attack):0):0;
  case 'destroy':return x?value(x)+1.2+Math.min(danger,x.attack):0;
  case 'freeze':return x&&!x.frozen?x.attack*.65+(x.tags.includes('taunt')?.3:0):0;
  case 'setattack':return x?Math.max(0,x.attack-n)*1.2:0;
  case 'silence':return x?Math.max(0,x.attack-x.printedAttack)*1.15+Math.max(0,x.maxHp-x.printedHp)*.55+(x.tags.includes('shield')?2:0)+(x.tags.includes('taunt')?1.2:0)+x.definition.death.length*1.2:0;
  case 'buff':{
   if(!x||fx.temp&&(!x.ready||x.frozen))return 0;let v=(fx.a??0)*(x.ready&&!x.frozen?1.25:.8)+(fx.h??0)*.55;
   if(fx.give==='shield'&&!x.tags.includes('shield'))v+=1+x.attack*.3;
   if(x.ready&&!x.frozen&&legalCardAttacks(b,x.id).includes('hero')&&p.board.filter(id=>legalCardAttacks(b,id).includes('hero')).reduce((n,id)=>n+c.catalog[id].attack,0)+(fx.a??0)>=e.hero+e.armor)v+=10000;return v;
  }
  default:return 0;
 }
}
function playValue(b,x,target){if(x.type==='landmark')return Math.max(0,x.definition.uses*1.6-cardCost(b,x.id)*.5-(fieldOccupancy(b.cards.players[x.side])>=6?2:0));if(x.type==='secret'){const e=b.cards.players[other(x.side)],threat=e.board.reduce((n,id)=>n+b.cards.catalog[id].attack,0);return (x.definition.effect==='armor'?1.5+Math.min(4,threat)*.4:1.8+Math.min(3,e.board.length)*.45)-cardCost(b,x.id)*.3;}if(x.type==='weapon'){const p=b.cards.players[x.side],old=b.cards.catalog[p.weapon];return x.attack*x.durability*.8-cardCost(b,x.id)*.6-(old?old.attack*old.durability*.7:0);}
 const v=isUnit(x)?value(x)+(x.tags.includes('rush')?.8:0)+x.definition.death.reduce((n,fx)=>n+fxValue(b,x.side,fx,null,x)*.4,0):0;return v+x.definition.enter.reduce((n,fx)=>n+fxValue(b,x.side,fx,target,x),0)-cardCost(b,x.id)*.6;}
function followupCost(b,target,remaining,mana,{excludeCard,excludeAttacker,powerAvailable=true,discount}={}){
 const c=b.cards,p=c.players[c.turn];let best=Infinity;
 for(const id of p.board){if(id===excludeAttacker||!legalCardAttacks(b,id).includes(target.id))continue;const a=c.catalog[id],f=attackPreview(b,id,target.id);if(f.damage>=remaining)best=Math.min(best,hurtValue(a,target.attack));}
 if(powerAvailable&&p.skill.kind==='martial'&&!p.powerUsed&&mana>=2&&remaining<=1)best=Math.min(best,1.2);
 for(const id of p.hand){if(id===excludeCard)continue;const x=c.catalog[id],cost=Math.max(0,x.cost-(x.type==='tactic'?(discount??p.discount):0));if(cost>mana||unitFull(b,x))continue;for(const fx of x.definition.enter){if((fx.op==='damage'||fx.op==='aoe')&&fx.n>=remaining||fx.op==='destroy'&&(!fx.injured||remaining<target.maxHp))best=Math.min(best,cost*.6+(x.type==='tactic'?1.8:0));}}
 return best;
}
function unitFull(b,x){return (isUnit(x)||x.type==='landmark')&&fieldOccupancy(b.cards.players[x.side])>=7;}
function selfLethal(b,x){
 const p=b.cards.players[x.side];let hp=p.hero,armor=p.armor,deck=p.deck.length,fatigue=p.fatigue;
 const damage=n=>{const absorbed=Math.min(n,armor);armor-=absorbed;hp-=n-absorbed;};
 for(const fx of x.definition.enter){if(fx.op==='armor')armor+=fx.n;else if(fx.op==='heal')hp=Math.min(30,hp+fx.n);else if(fx.op==='selfdamage')damage(fx.n);else if(fx.op==='draw'&&!fx.filter)for(let i=0;i<fx.n;i++){if(deck)deck--;else damage(++fatigue);}}
 return hp<=0;
}
function balancedCardAI(b,{policy='balanced'}={}){
 if((b.cards.rulesVersion??1)<3)return legacy.cardAI(b);
 const c=b.cards,p=c.players[c.turn],e=c.players[other(c.turn)],actions=legalCardActions(b);if(c.phase==='mulligan')return actions[0];
 const face=policy==='aggressive'?1.25:policy==='control'?.8:1,total=p.board.filter(id=>legalCardAttacks(b,id).includes('hero')).reduce((n,id)=>n+c.catalog[id].attack,0),danger=Math.max(0,e.board.reduce((n,id)=>n+c.catalog[id].attack,0)-p.hero-p.armor+4);
 let best={type:'end'},bestScore=0;
 for(const a of actions){let score=0;
  if(a.type==='landmark-use'){const x=c.catalog[a.id],t=c.catalog[a.target];score=x.definition.ability.op==='unit-heal'?Math.min(x.definition.ability.amount,t.maxHp-t.hp)*.7:t.ready&&!t.frozen?x.definition.ability.amount*.8:0;
  }else if(a.type==='landmark-remove'){score=fieldOccupancy(p)>=7&&p.hand.some(id=>isUnit(c.catalog[id])&&cardCost(b,id)<=p.mana)?1:0;
  }else if(a.type==='attack'){
   const x=c.catalog[a.id];if(a.target==='hero')score=total>=e.hero+e.armor?100000:x.attack*(face+(e.hero+e.armor<=10?.3:0));
   else{const t=c.catalog[a.target],f=attackPreview(b,a.id,a.target);score=hurtValue(t,f.damage)-hurtValue(x,f.retaliation)+(f.damage>=t.hp&&!t.tags.includes('shield')?1.5+Math.min(danger,t.attack):0)-(x.tags.includes('stealth')?.2:0);const remaining=t.hp-(t.tags.includes('shield')?0:f.damage);if(remaining>0){const cost=followupCost(b,t,remaining,p.mana,{excludeAttacker:x.id});if(Number.isFinite(cost))score=Math.max(score,value(t)+1.5+Math.min(danger,t.attack)-hurtValue(x,f.retaliation)-cost);}}
  }else if(a.type==='hero-attack'){
   const f=heroAttackPreview(b,a.target),t=c.catalog[a.target];score=a.target==='hero'?(f.damage>=e.hero+e.armor?100000:f.damage*face):f.attackerLife<=0?-100000:hurtValue(t,f.damage)-f.retaliation*.8+(f.damage>=t.hp&&!t.tags.includes('shield')?1.5+Math.min(danger,t.attack):0);
  }else if(a.type==='play'){
   const x=c.catalog[a.id];if(x.definitionId!=='coin'){score=selfLethal(b,x)?-100000:playValue(b,x,a.target);const fx=x.definition.enter.find(fx=>fx.op==='damage'),t=c.catalog[a.target];if(fx&&t&&!selfLethal(b,x)){const remaining=t.hp-(t.tags.includes('shield')?0:fx.n),cost=followupCost(b,t,remaining,p.mana-cardCost(b,x.id),{excludeCard:x.id,discount:x.type==='tactic'?0:p.discount});if(remaining>0&&Number.isFinite(cost))score=Math.max(score,playValue(b,x,a.target)-hurtValue(t,fx.n)+value(t)+1.5-cost);}}
   else{
    const candidates=p.hand.filter(id=>c.catalog[id].definitionId!=='coin'&&(!isUnit(c.catalog[id])&&c.catalog[id].type!=='landmark'||fieldOccupancy(p)<7)).map(id=>({x:c.catalog[id],cost:cardCost(b,id)})).filter(v=>!targeted(v.x)||legalCardTargets(b,v.x.id).length||isUnit(v.x));
    const maxValue=mana=>{const dp=Array(mana+1).fill(0);for(const v of candidates){const targets=targeted(v.x)?legalCardTargets(b,v.x.id):[undefined],val=Math.max(0,...targets.map(t=>playValue(b,v.x,t)));for(let j=mana;j>=v.cost;j--)dp[j]=Math.max(dp[j],dp[j-v.cost]+val);}return Math.max(...dp);};
    const now=maxValue(p.mana),after=maxValue(Math.min(10,p.mana+1));score=after>now+.6&&p.mana<10?after+.2:-1;
   }
  }else if(a.type==='power'){
   if(p.skill.kind==='martial'){score=a.target==='hero'?(e.hero+e.armor<=1?100000:face):hurtValue(c.catalog[a.target],1);const t=c.catalog[a.target];if(t){const remaining=t.hp-(t.tags.includes('shield')?0:1),cost=followupCost(b,t,remaining,p.mana-2,{powerAvailable:false});if(remaining>0&&Number.isFinite(cost))score=Math.max(score,value(t)+1.5+Math.min(danger,t.attack)-cost-1.2);}}
   else if(p.skill.kind==='intelligence')score=p.deck.length&&p.hand.length<9&&p.hero+p.armor>2+danger?1.8:-1;
   else score=a.target==='hero'?Math.min(2,30-p.hero)*(.75+Math.min(4,danger)*.2):Math.min(2,c.catalog[a.target].maxHp-c.catalog[a.target].hp)*(c.catalog[a.target].ready?.9:.7);
  }
  if(score>bestScore){best=a;bestScore=score;}
 }
 return best;
}

// Difficulty choices never alter damage, hidden cards or the real combat RNG.
function publicSearchState(b){const next=clone(b),c=next.cards,p=c.players[c.turn],e=c.players[other(c.turn)];
 e.hand=[];e.deck=[];e.secrets=[];e.gaps=[];p.deck=[...p.deck].sort();for(const side of ['home','enemy'])c.players[side].rng=123456;
 const visible=new Set([...p.hand,...p.deck,...p.board,...p.grave,...(p.secrets??[]),...(p.landmarks??[]),...e.board,...e.grave,...(e.landmarks??[]),p.weapon?.id,e.weapon?.id]);
 for(const [id,x] of Object.entries(c.catalog))if(x.side!==c.turn&&!visible.has(id))delete c.catalog[id];
 return next;
}
function boardScore(b,side){const c=b.cards,p=c.players[side],e=c.players[other(side)];if(p.hero<=0)return -100000;if(e.hero<=0)return 100000;const material=q=>q.board.reduce((n,id)=>n+value(c.catalog[id]),0);return (p.hero-e.hero)*1.4+(p.armor-e.armor)*.8+(material(p)-material(e))*2+p.hand.length*.6;}
function searchActions(b){const actions=legalCardActions(b).filter(a=>a.type!=='end'),preferred=balancedCardAI(b);return [preferred,...actions.filter(a=>JSON.stringify(a)!==JSON.stringify(preferred))].slice(0,12);}
export function cardAI(b,{policy='balanced',difficulty=b.difficultyId}={}){
 if(!difficulty||b.cards.turn!=='enemy'||b.cards.phase!=='play'||(b.cards.rulesVersion??1)<3)return balancedCardAI(b,{policy});
 const t=DIFFICULTIES.find(t=>t.id===difficulty);if(!t||t.id==='standard')return balancedCardAI(b,{policy});
 if(t.id==='novice'){const choices=legalCardActions(b).filter(a=>a.type!=='end'),roll=personSeed(`${b.cards.seed}:${b.cards.ply}:${b.cards.sequence}:${b.cards.players.enemy.mana}:${choices.length}`)/4294967296;return choices.length&&roll<t.battleMistakeChance?choices[Math.floor(roll/t.battleMistakeChance*choices.length)]:balancedCardAI(b,{policy});}
 const publicState=publicSearchState(b),side=b.cards.turn,baseline=balancedCardAI(publicState,{policy});
 // Preserve the proven deployment policy; look ahead when ordering public attacks.
 if(!['attack','hero-attack','landmark-use'].includes(baseline.type))return baseline;
 let best=baseline,score=-Infinity;
 for(const action of searchActions(publicState)){try{const next=clone(publicState);actCardsMutable(next,action);let candidate=boardScore(next,side);if(!next.result&&next.cards.turn===side&&action.type!=='end'){for(const second of searchActions(next).slice(0,6)){const last=clone(next);actCardsMutable(last,second);candidate=Math.max(candidate,boardScore(last,side));}}if(candidate>score){best=action;score=candidate;}}catch{/* Unknown hidden effects are excluded from planning. */}}
 return best;
}

export function validateCards(b){
 const c=b.cards;if((c?.rulesVersion??1)<3)return legacy.validateCards(b);
 const fail=message=>{throw Error('卡牌存档无效：'+message);};
 if(!c||c.version!==2||![3,4,5,6].includes(c.rulesVersion)||!['home','enemy'].includes(c.turn)||!['home','enemy'].includes(c.first)||!['mulligan','play','ended'].includes(c.phase)||!integer(c.ply,1)||!integer(c.nextId,1)||!integer(c.sequence)||!integer(c.seed,0,4294967295))fail('规则或阶段');
 validateCardHistory(b);validateWeaponState(b);validateSecretState(b);validateLandmarkState(b);
 if(c.definitionHash!==personSeed(JSON.stringify([c.rulesSnapshot,c.definitionCatalog,c.personCatalog])))fail('开战卡表快照');
 if(c.deckConfiguration!==undefined||b.command.cardTactics!==undefined){
  const cfg=c.deckConfiguration;if(!cfg||cfg.version!==1||!cfg.tactics||Object.keys(cfg).some(k=>!['version','tactics'].includes(k))||c.deckConfigurationHash!==personSeed(JSON.stringify(cfg)))fail('配牌快照');
  const total=b.units.filter(u=>u.side==='home'&&!u.commander).reduce((n,u)=>n+u.initial,0),slots=c.rulesSnapshot.deckSize-armyCardCount(total,c.rulesSnapshot)-weaponSelectionIds(b.command.weaponAllocation?.home?.selection).length-secretSelectionIds(b.command.secretAllocation?.home?.selection).length-landmarkSelectionIds(b.command.landmarkAllocation?.home?.selection).length;
  const selected=normalizeTacticSelection(cfg.tactics,slots,c.definitionCatalog),command=normalizeTacticSelection(b.command.cardTactics,slots,c.definitionCatalog);
  if(JSON.stringify(selected)!==JSON.stringify(command)||JSON.stringify(cfg.tactics)!==JSON.stringify(selected))fail('配牌军令与快照');
  const actual=Object.values(c.catalog).filter(x=>x.side==='home'&&x.type==='tactic'&&x.definitionId!=='coin').map(x=>x.definitionId).sort();
  if(JSON.stringify(actual)!==JSON.stringify(tacticSelectionIds(selected).sort()))fail('计策数量与快照');
 }else if(c.deckConfigurationHash!==undefined)fail('配牌版本');
 const seen=new Set();
 for(const side of ['home','enemy']){
  const p=c.players[side];if(!p||!integer(p.hero,-10000,30)||!integer(p.armor,0,1000)||!integer(p.mana,0,10)||!integer(p.maxMana,0,10)||!integer(p.fatigue)||!integer(p.heroDamage)||!integer(p.ownTurn)||!integer(p.rng,0,4294967295)||typeof p.powerUsed!=='boolean'||!integer(p.discount,0,10)||!Array.isArray(p.gaps))fail('行动资源');
  for(const zone of ['hand','deck','board','grave']){if(!Array.isArray(p[zone])||zone==='hand'&&p[zone].length>10||zone==='board'&&p[zone].length>7)fail('区域容量');for(const id of p[zone]){const x=c.catalog[id];if(!x||seen.has(id)||x.side!==side||zone==='board'&&!isUnit(x))fail('区域来源');seen.add(id);}}
  for(const id of p.secrets??[]){const x=c.catalog[id];if(!x||x.side!==side||x.type!=='secret'||seen.has(id))fail('奥秘区域');seen.add(id);}
  for(const id of p.landmarks??[]){const x=c.catalog[id];if(!x||x.side!==side||x.type!=='landmark'||seen.has(id))fail('地标区域');seen.add(id);}
  if(p.weapon){const x=c.catalog[p.weapon];if(!x||x.side!==side||x.type!=='weapon'||seen.has(x.id))fail('武器区域');seen.add(x.id);}
  for(const id of p.gaps)if(!b.units.some(u=>u.id===id&&u.side===side&&!u.commander))fail('预备兵缺额');
  for(const [id,count]of Object.entries(p.reserve))if(!integer(count)||!b.units.some(u=>u.id===id&&u.side===side&&!u.commander))fail('预备兵来源');
 }
 if(seen.size!==Object.keys(c.catalog).length)fail('卡牌丢失');
 const persons=new Set();
 for(const [id,x]of Object.entries(c.catalog)){
  if(x.id!==id||!['troop','general','tactic','weapon','secret','landmark'].includes(x.type)||!integer(x.cost,0,10)||x.cost!==x.definition.cost||x.name!==x.definition.name)fail('定义');
  if(x.type==='weapon'||x.type==='secret'||x.type==='landmark')continue;
  if(x.type==='tactic'){if(JSON.stringify(x.definition)!==JSON.stringify(c.definitionCatalog[x.definitionId]))fail('计策定义');continue;}
  const u=b.units.find(u=>u.id===x.unitId&&u.side===x.side&&!u.commander);if(!u||!integer(x.count,1)||!integer(x.training,0,100)||x.training!==u.training||x.kind!==u.kind)fail('兵员来源');
  const expected=x.type==='general'?definitionFor(b,u):c.definitionCatalog[x.definitionId];
  if(!expected||JSON.stringify(x.definition)!==JSON.stringify(expected))fail('人物或部队定义');
  const stats=unitStats(b,expected,u,x.count);if(x.printedAttack!==stats.attack||x.printedHp!==stats.hp||!integer(x.attack,0,200)||!integer(x.maxHp,1,200)||!integer(x.hp,-10000,x.maxHp)||x.attack!==x.printedAttack+x.buffAttack+x.tempAttack||x.maxHp!==x.printedHp+x.buffHealth||!Number.isFinite(x.lossPeak)||x.lossPeak<0||x.lossPeak>1||!Array.isArray(x.tags)||x.tags.some(t=>!Object.hasOwn(keywordNames,t))||new Set(x.tags).size!==x.tags.length||['ready','rushing','frozen','silenced'].some(k=>typeof x[k]!=='boolean'))fail('部队状态');
  if(x.type==='general'){if(x.personInstanceId!==(u.general?.id??battlePerson(b,u).personId)||x.historicalDefinitionId!==(battlePerson(b,u).historicalDefinitionId??null)||!x.personId||x.personId!==u.cardPersonId||persons.has(x.personId)||x.personId===leader(b,x.side).cardPersonId)fail('人物重复或主将互斥');persons.add(x.personId);}
 }
 for(const u of b.units){const p=c.players[u.side],cards=Object.values(c.catalog).filter(x=>x.unitId===u.id);if(!u.commander&&(cards.reduce((n,x)=>n+x.count,0)+(p.reserve[u.id]??0)!==u.initial))fail('兵员不守恒');const dead=u.commander?Math.ceil(u.initial*Math.min(30,p.heroDamage)/60):cards.reduce((n,x)=>n+cardDeaths(x),0);if(u.dead!==dead||u.count!==u.initial-dead)fail('真实战损');}
 const a=c.players.home.hero<=0,z=c.players.enemy.hero<=0,expected=a&&z?'draw':a?'defeat':z?'victory':null;
 if(!c.retreated&&b.result!==expected||!!b.result!==(c.phase==='ended'))fail('胜负');
}

export function cardText(d){
 if(d.type==='secret'||d.type==='landmark')return d.text;
 if(d.type==='weapon')return `主将装备 · ${d.attack}攻击／${d.durability}耐久；每回合攻击一次，每次消耗1耐久。真实备用套装1人份。`;
 const tags=(d.tags??[]).map(t=>t==='anti'?'反骑：主动攻击骑兵+2攻':t==='anti_horse'?'慑马：主动攻击战马部队+2攻':t==='pierce'?'破盾：主动攻击护卫+2攻':keywordNames[t]).filter(Boolean),fxText=fx=>{
  const n=fx.n??0,kind={foot:'步兵',cavalry:'骑兵',ranged:'远程部队'}[fx.mask]??'部队',who=fx.target==='friend'?(d.type==='spell'?'一个友方':'一个其他友方')+kind:fx.target==='enemy_character'?'一个敌方角色':fx.injured?'一个受伤敌方部队':'一个敌方部队';
  switch(fx.op){case'draw':return '抽'+n+'张'+({tactic:'计策',general:'人物牌',troop:'部队牌',low:'费用≤2的牌',high:'费用≥5的牌'}[fx.filter]??'牌');case'damage':return '对'+who+'造成'+n+'伤害';case'aoe':return '对所有敌方部队造成'+n+'伤害';case'heal':return '主将恢复'+n+'生命';case'armor':return '主将获得'+n+'护甲';case'selfdamage':return '己方主将受到'+n+'伤害';case'discount':return '本回合下一张计策减'+n+'费';case'refund':return '本回合军令+'+n;case'freeze':return '冻结'+who;case'silence':return '沉默'+who;case'destroy':return '消灭一个受伤的敌方部队';case'setattack':return '将'+who+'攻击变为'+n;case'buff':case'group':return (fx.op==='group'?'至多'+(fx.limit??'所有')+'个其他友军':who)+((fx.a??0)?'攻击+'+fx.a:'')+((fx.h??0)?'生命+'+fx.h:'')+(fx.give==='shield'?'获得护甲盾':'')+(fx.temp?'（本回合）':'');default:return'';}
 };
 return [...tags,...(d.enter??[]).map(f=>((d.type==='spell')?'':'登场：')+fxText(f)),...(d.death??[]).map(f=>'遗计：'+fxText(f))].join('；')||'普通部队';
}
