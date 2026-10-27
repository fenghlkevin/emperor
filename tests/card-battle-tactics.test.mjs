import {test} from 'node:test';
import assert from 'node:assert/strict';
import {armyCardCount,tacticCopyLimit,normalizeTacticSelection,tacticSelectionIds,tacticDefinitions} from '../src/card-battle-tactics.mjs';
import {attachCards,CARD_RULES,cardAI,actCardsMutable,validateCards,personSeed} from '../src/card-battle.mjs';
import {fixture,ROSTERS} from '../scripts/card-battle-balance-fixture.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {courtCampaignPlan} from '../src/court-campaign.mjs';
import {beginWar,generals,borderingCountries} from '../src/war.mjs';
import {initialCardFormation} from '../src/kit-formation.mjs';
import {worldKitSummary} from '../src/troop-kit-world.mjs';
import {startCampaign,beginDefense} from '../src/foreign-strategy.mjs';
import {defaultKitDefensePlan} from '../src/kit-defense.mjs';
import {previewCampaignDeck,previewDefenseDeck} from '../src/card-battle-deck.mjs';
const fromBattle=b=>({version:1,counts:Object.values(b.cards.catalog).filter(x=>x.side==='home'&&x.type==='tactic'&&x.definitionId!=='coin').reduce((counts,x)=>(counts[x.definitionId]=(counts[x.definitionId]??0)+1,counts),{})});
function different(b){const selection=fromBattle(b),slots=tacticSelectionIds(selection).length,limit=tacticCopyLimit(slots),from=Object.keys(selection.counts).find(id=>selection.counts[id]>0),to=Object.keys(tacticDefinitions).find(id=>id!==from&&(selection.counts[id]??0)<limit);selection.counts[from]--;selection.counts[to]=(selection.counts[to]??0)+1;return normalizeTacticSelection(selection,slots);}
function campaign(){const s=newGame('配牌'),formation={targetId:borderingCountries(s.domestic)[0].id,...initialCardFormation(worldKitSummary(s.domestic).find(x=>x.id==='central'),generals(s.domestic))};return {s,formation,command:{...formation,id:s.domestic.war.nextId,kind:'war',kitVersion:1,battleMode:'cards'}};}

test('configuration validates exact capacity, types, versions, allowed tactics and per-card bounds',()=>{
 const valid={version:1,counts:Object.fromEntries(Object.keys(tacticDefinitions).map(id=>[id,1]))};assert.equal(tacticSelectionIds(normalizeTacticSelection(valid,12)).length,12);
 for(const invalid of [null,[],{...valid,version:2},{...valid,order:[]},{version:1,counts:[]},{version:1,counts:{coin:12}},{version:1,counts:{vanguard:12}},{version:1,counts:{unknown:12}},{version:1,counts:{precision:'1'}},{version:1,counts:{precision:-1}},{version:1,counts:{precision:1.5}},{version:1,counts:{precision:NaN}},{version:1,counts:{precision:3}},{version:1,counts:{precision:1}}])assert.throws(()=>normalizeTacticSelection(invalid,12),/配牌无效/);
 assert.equal(normalizeTacticSelection(undefined,12),undefined);assert.equal(tacticCopyLimit(24),2);assert.equal(tacticCopyLimit(26),3);
 const a=normalizeTacticSelection(valid,12),b=normalizeTacticSelection({version:1,counts:Object.fromEntries(Object.entries(valid.counts).reverse())},12);assert.deepEqual(a,b);
});

test('capacity comes from the engine troop allocation including tiny armies and reserves; auto path stays unchanged',()=>{
 for(const roster of [ROSTERS.mixed_600,ROSTERS.reserve_3600,{infantry:100},{infantry:25}]){
  const b=fixture({roster}),before=structuredClone(b.cards),count=Object.values(b.cards.catalog).filter(x=>x.side==='home'&&x.type!=='tactic').length;
  assert.equal(count,armyCardCount(Object.values(roster).reduce((a,b)=>a+b),CARD_RULES));assert.equal(tacticSelectionIds(fromBattle(b)).length,30-count);
  attachCards(b,{first:'home',seeds:{home:17,enemy:19}});assert.deepEqual(b.cards,before);assert.equal(b.cards.deckConfiguration,undefined);
  b.command.cardTactics=fromBattle(b);attachCards(b,{first:'home',seeds:{home:17,enemy:19}});validateCards(b);assert.equal(tacticSelectionIds(fromBattle(b)).length,30-count);
 }
});

test('custom tactics preserve every troop, officer, enemy deck and RNG stream, and invalid edits are atomic',()=>{
 const b=fixture(),base=structuredClone(b),selection=different(b);b.command.cardTactics=selection;attachCards(b,{first:'home',seeds:{home:17,enemy:19}});validateCards(b);
 assert.deepEqual(b.units,base.units);assert.deepEqual(b.cardPeople,base.cardPeople);assert.deepEqual(b.cards.players.enemy,base.cards.players.enemy);assert.equal(b.cards.players.home.rng,base.cards.players.home.rng);
 assert.deepEqual(Object.values(b.cards.catalog).filter(x=>x.type!=='tactic'||x.side==='enemy'),Object.values(base.cards.catalog).filter(x=>x.type!=='tactic'||x.side==='enemy'));
 assert.deepEqual(fromBattle(b).counts,selection.counts);assert.deepEqual(b.cards.deckConfiguration,{version:1,tactics:selection});
 b.command.cardTactics={version:1,counts:{coin:12}};const before=structuredClone(b);assert.throws(()=>attachCards(b),/配牌无效/);assert.deepEqual(b,before);
});

test('configured campaign preview and actual seal match exactly without spending or changing fixed people early',()=>{
 const {s,formation,command}=campaign(),base=previewCampaignDeck(s,command);formation.cardTactics=different(base);const before=structuredClone(s),draft=courtCampaignPlan(s,formation),preview=previewCampaignDeck(s,draft.command),actual=beginWar(s,{...draft.command,battleMode:'cards'});
 assert.deepEqual(s,before);assert.deepEqual(preview.cards,actual.domestic.war.battle.cards);assert.deepEqual(preview.cardPeople,base.cardPeople);validateSave(actual);
 formation.squads[0].count=25;assert.throws(()=>courtCampaignPlan(s,formation),/重新配牌/);assert.deepEqual(s,before);
});

test('defense configuration preserves real sources and survives serialization and subsequent legal actions',()=>{
 const s=newGame('守城配牌');s.turn=37;startCampaign(s.domestic,'xi','hebei',37);const plan=defaultKitDefensePlan(s),base=previewDefenseDeck(s,plan);plan.cardTactics=different(base);const before=structuredClone(s),preview=previewDefenseDeck(s,plan),n=beginDefense(s,{deployment:{...plan,battleMode:'cards'}});
 assert.deepEqual(s,before);assert.deepEqual(n.domestic.war.battle.cards,preview.cards);validateSave(n);
 const restored=JSON.parse(JSON.stringify(n)),b=restored.domestic.war.battle;for(let i=0;i<60&&!b.result;i++){actCardsMutable(b,cardAI(b));validateCards(b);}validateSave(restored);assert.deepEqual(b.cards.deckConfiguration,preview.cards.deckConfiguration);
 const cap=CARD_RULES.troopCap;try{CARD_RULES.troopCap=1;validateSave(restored);}finally{CARD_RULES.troopCap=cap;}
});

test('snapshot validation rejects altered counts, missing selection, stale hashes and mismatched commands',()=>{
 const b=fixture();b.command.cardTactics=different(b);attachCards(b,{first:'home',seeds:{home:17,enemy:19}});validateCards(b);
 for(const mutate of [x=>delete x.cards.deckConfiguration,x=>delete x.command.cardTactics,x=>x.cards.deckConfigurationHash++,x=>{x.cards.deckConfiguration.tactics.counts.precision=99;x.cards.deckConfigurationHash=personSeed(JSON.stringify(x.cards.deckConfiguration));},x=>{const card=Object.values(x.cards.catalog).find(c=>c.side==='home'&&c.type==='tactic'&&c.definitionId!=='coin');card.definitionId='coin';}]){const x=structuredClone(b);mutate(x);assert.throws(()=>validateCards(x));}
});
