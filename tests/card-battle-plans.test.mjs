import {test} from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {battlePlans,saveBattlePlan,deleteBattlePlan} from '../src/card-battle-plan-data.mjs';
import {inspectBattlePlan} from '../src/card-battle-plans.mjs';
import {initialCardFormation} from '../src/kit-formation.mjs';
import {worldKitSummary} from '../src/troop-kit-world.mjs';
import {generals,borderingCountries,beginWar} from '../src/war.mjs';
import {previewCampaignDeck} from '../src/card-battle-deck.mjs';
import {startCampaign,beginDefense} from '../src/foreign-strategy.mjs';
import {defaultKitDefensePlan} from '../src/kit-defense.mjs';
function fixture(){const s=newGame('方案'),f={targetId:borderingCountries(s.domestic)[0].id,...initialCardFormation(worldKitSummary(s.domestic).find(x=>x.id==='central'),generals(s.domestic))};return {s,f};}
function withoutLibrary(s){const copy=structuredClone(s);delete copy.domestic.cardBattlePlans;return copy;}
test('save, overwrite, rename and delete change only a bounded plan library and preserve every real resource',()=>{
 const {s,f}=fixture(),before=structuredClone(s);let n=saveBattlePlan(s,{kind:'campaign',name:' 主军 ',formation:{...f,heroDamage:99,mana:10,rng:123,deck:['fire'],cardPeople:{fake:1}}});assert.deepEqual(s,before);assert.deepEqual(withoutLibrary(n),s);const p=battlePlans(n,'campaign')[0];assert.equal(p.name,'主军');assert.ok(!JSON.stringify(p).includes('heroDamage'));assert.ok(!('targetId'in p.formation));const reordered=structuredClone(n);reordered.domestic.cardBattlePlans.plans[0].formation=Object.fromEntries(Object.entries(reordered.domestic.cardBattlePlans.plans[0].formation).reverse());validateSave(reordered);
 assert.throws(()=>saveBattlePlan(n,{kind:'campaign',name:'主军',formation:f}),/同名/);assert.throws(()=>saveBattlePlan(n,{kind:'campaign',name:'',formation:f}));
 n=saveBattlePlan(n,{id:p.id,kind:'campaign',name:'改名',formation:f});assert.equal(battlePlans(n,'campaign').length,1);assert.equal(battlePlans(n,'campaign')[0].name,'改名');n=deleteBattlePlan(n,p.id);assert.equal(battlePlans(n,'campaign').length,0);validateSave(n);assert.deepEqual(withoutLibrary(n),s);
});
test('restored campaign plan preserves target, fixed identities and exact preview while load commits no state',()=>{
 const {s,f}=fixture(),base=previewCampaignDeck(s,{...f,id:s.domestic.war.nextId,kind:'war',kitVersion:1}),counts={};for(const x of Object.values(base.cards.catalog))if(x.side==='home'&&x.type==='tactic'&&x.definitionId!=='coin')counts[x.definitionId]=(counts[x.definitionId]??0)+1;f.cardTactics={version:1,counts};
 const n=JSON.parse(JSON.stringify(saveBattlePlan(s,{kind:'campaign',name:'固定身份',formation:f})));validateSave(n);const before=structuredClone(n),id=battlePlans(n,'campaign')[0].id,loaded=inspectBattlePlan(n,'campaign',id,f);assert.deepEqual(loaded.errors,[]);assert.equal(loaded.formation.targetId,f.targetId);assert.deepEqual(inspectBattlePlan(n,'campaign',id).errors,[]);const command={...loaded.formation,id:n.domestic.war.nextId,kind:'war',kitVersion:1,battleMode:'cards'},preview=previewCampaignDeck(n,command),actual=beginWar(n,command);assert.deepEqual(n,before);assert.deepEqual(preview.cards,actual.domestic.war.battle.cards);assert.deepEqual(preview.cardPeople,base.cardPeople);validateSave(actual);const during=saveBattlePlan(actual,{kind:'campaign',name:'战中保存配置',formation:f});assert.deepEqual(during.domestic.war.battle,actual.domestic.war.battle);validateSave(during);
});
test('load reports missing soldiers, each equipment kind, and unavailable officers without partial substitution',()=>{
 const {s,f}=fixture(),n=saveBattlePlan(s,{kind:'campaign',name:'来源',formation:f}),p=n.domestic.cardBattlePlans.plans[0];p.formation.generalId='retired-person';n.domestic.centralArmy.soldiers=0;for(const k of Object.keys(n.domestic.troopKits.depots.central.stock))n.domestic.troopKits.depots.central.stock[k]=0;
 const before=structuredClone(n),report=inspectBattlePlan(n,'campaign',p.id,f);assert.ok(report.errors.some(x=>x.includes('将领不可用')));assert.ok(report.errors.some(x=>x.includes('缺少兵员')));assert.ok(report.errors.some(x=>x.includes('装备')));assert.deepEqual(n,before);assert.equal(report.formation.generalId,'retired-person');
});
test('defense templates use current source eligibility and keep deployment and resources unchanged until seal',()=>{
 let s=newGame('守城方案');s.turn=37;startCampaign(s.domestic,'xi','hebei',37);const f=defaultKitDefensePlan(s);s=saveBattlePlan(s,{kind:'defense',name:'守城',formation:f});validateSave(s);const before=structuredClone(s),id=battlePlans(s,'defense')[0].id,loaded=inspectBattlePlan(s,'defense',id);assert.deepEqual(loaded.errors,[]);const n=beginDefense(s,{deployment:{...loaded.formation,battleMode:'cards'}});assert.deepEqual(s,before);assert.equal(battlePlans(n,'defense').length,1);validateSave(n);
 const bad=structuredClone(s);bad.domestic.cardBattlePlans.plans[0].formation.commander.sourceId='missing-city';assert.ok(inspectBattlePlan(bad,'defense',id).errors.some(x=>x.includes('兵源不可用')));
});
test('save validation rejects hidden battle fields, duplicate IDs, stale counters and oversized libraries',()=>{
 const {s,f}=fixture(),n=saveBattlePlan(s,{kind:'campaign',name:'核验',formation:f});for(const mutate of [x=>x.domestic.cardBattlePlans.plans[0].formation.mana=10,x=>x.domestic.cardBattlePlans.nextId=1,x=>x.domestic.cardBattlePlans.plans.push(structuredClone(x.domestic.cardBattlePlans.plans[0])),x=>x.domestic.cardBattlePlans.plans[0].formation.cardTactics={version:1,counts:{coin:12}}]){const bad=structuredClone(n);mutate(bad);assert.throws(()=>validateSave(bad));}
 let full=s;for(let i=0;i<20;i++)full=saveBattlePlan(full,{kind:'campaign',name:'方案'+i,formation:f});assert.throws(()=>saveBattlePlan(full,{kind:'campaign',name:'超额',formation:f}),/20/);validateSave(full);
});
