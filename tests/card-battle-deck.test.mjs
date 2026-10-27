import {test} from 'node:test';
import assert from 'node:assert/strict';
import {battleDeckView,previewCampaignDeck,previewDefenseDeck} from '../src/card-battle-deck.mjs';
import {fixture} from '../scripts/card-battle-balance-fixture.mjs';
import {cardAI,actCardsMutable} from '../src/card-battle.mjs';
import {newGame} from '../src/game.mjs';
import {beginWar,generals,borderingCountries} from '../src/war.mjs';
import {initialCardFormation} from '../src/kit-formation.mjs';
import {worldKitSummary} from '../src/troop-kit-world.mjs';
import {startCampaign,beginDefense} from '../src/foreign-strategy.mjs';
import {defaultKitDefensePlan} from '../src/kit-defense.mjs';
test('full deck exposes all 30 home cards with exact printed stats, costs and real sources, excluding coin',()=>{
 for(const first of ['home','enemy']){const b=fixture({first}),before=structuredClone(b),view=battleDeckView(b);assert.equal(view.total,30);assert.equal(Object.values(view.types).reduce((a,b)=>a+b),30);assert.equal(Object.values(view.curve).reduce((a,b)=>a+b),30);
 for(const row of view.rows){const x=b.cards.catalog[row.id];assert.equal(x.side,'home');assert.notEqual(x.definitionId,'coin');assert.equal(row.cost,x.cost);assert.equal(row.attack,x.printedAttack??null);assert.equal(row.health,x.printedHp??null);if(x.unitId){const u=b.units.find(u=>u.id===x.unitId);assert.equal(row.sourceId,u.sourceId);assert.equal(row.count,x.count);assert.equal(row.training,u.training);}}
 assert.deepEqual(b,before);}
});
test('remaining deck is sorted independent of shuffle order and cannot expose enemy or RNG information',()=>{
 const b=fixture(),view=battleDeckView(b,{remaining:true});assert.equal(view.total,b.cards.players.home.deck.length);assert.deepEqual(new Set(view.rows.map(x=>x.id)),new Set(b.cards.players.home.deck));
 const reordered=structuredClone(b);reordered.cards.players.home.deck.reverse();reordered.cards.players.enemy.hand.reverse();reordered.cards.players.enemy.rng=123;assert.deepEqual(battleDeckView(reordered,{remaining:true}),view);
 assert.ok(!JSON.stringify(view).includes('enemy-'));assert.ok(!('rng'in view));
 const original=battleDeckView(b);actCardsMutable(b,cardAI(b));for(let i=0;i<30&&!b.result;i++)actCardsMutable(b,cardAI(b));assert.deepEqual(battleDeckView(b),original);
});
test('deck search and combined filters preserve unfiltered totals and allow empty results',()=>{
 const b=fixture(),all=battleDeckView(b),row=all.rows.find(x=>x.type==='general');assert.ok(row);const filtered=battleDeckView(b,{query:row.personId,type:row.type,kind:row.kind,cost:String(row.cost)});assert.equal(filtered.total,30);assert.ok(filtered.rows.length>0);assert.ok(filtered.rows.every(x=>x.personId===row.personId));assert.equal(battleDeckView(b,{query:'no such card'}).rows.length,0);
});
test('campaign preview matches actual launch card for card while preserving every real resource and fixed identity',()=>{
 const s=newGame('牌组核验'),formation={targetId:borderingCountries(s.domestic)[0].id,...initialCardFormation(worldKitSummary(s.domestic).find(x=>x.id==='central'),generals(s.domestic))},command={...formation,id:s.domestic.war.nextId,kind:'war',kitVersion:1,battleMode:'cards'},before=structuredClone(s),preview=previewCampaignDeck(s,command);
 assert.deepEqual(s,before);const launched=beginWar(s,command).domestic.war.battle;assert.deepEqual(preview.cards,launched.cards);assert.deepEqual(battleDeckView(preview),battleDeckView(launched));assert.deepEqual(previewCampaignDeck(s,command),preview);assert.deepEqual(s,before);
});
test('defense preview preserves central, local and allied stock and matches the actual battle snapshot',()=>{
 const s=newGame('守城牌组');s.turn=37;startCampaign(s.domestic,'xi','hebei',s.turn);const plan=defaultKitDefensePlan(s),before=structuredClone(s),preview=previewDefenseDeck(s,plan),actual=beginDefense(s,{deployment:{...plan,battleMode:'cards'}}).domestic.war.battle;
 assert.deepEqual(s,before);assert.deepEqual(preview.cards,actual.cards);assert.deepEqual(battleDeckView(preview),battleDeckView(actual));
});
