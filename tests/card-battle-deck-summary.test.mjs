import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {worldKitSummary} from '../src/troop-kit-world.mjs';
import {initialCardFormation} from '../src/kit-formation.mjs';
import {formationCardSummary} from '../src/card-battle-deck-summary.mjs';
import {beginWar,generals,borderingCountries} from '../src/war.mjs';
const count=(b,type)=>Object.values(b.cards.catalog).filter(x=>x.side==='home'&&x.type===type&&x.definitionId!=='coin').length;
test('default card formation uses real available stock, includes mounted troops and yields 18 unit/person cards',()=>{
 const s=newGame('编牌预览'),stock=worldKitSummary(s.domestic).find(x=>x.id==='central'),before=JSON.stringify(s),f=initialCardFormation(stock,generals(s.domestic));
 assert.equal(JSON.stringify(s),before);assert.equal(f.commanderSquad.count+f.squads.reduce((n,x)=>n+x.count,0),550);
 assert.ok(f.squads.some(x=>x.kind==='cavalry'));assert.ok(new Set([f.generalId,...f.squads.map(x=>x.generalId)]).size===f.squads.length+1);
 const next=beginWar(s,{...f,id:1,kitVersion:1,battleMode:'cards',kind:'war',targetId:borderingCountries(s.domestic)[0].id}),b=next.domestic.war.battle;validateSave(next);
 assert.equal(count(b,'troop')+count(b,'general'),18);assert.equal(count(b,'tactic'),12);assert.ok(count(b,'general')>0);assert.match(formationCardSummary(f),/18 张.*12 张/);
});
test('small army estimate exposes tactic-heavy decks and does not create soldiers or people',()=>{
 const s=newGame('小军'),stock=worldKitSummary(s.domestic).find(x=>x.id==='central');stock.soldiers.available=60;for(const k of Object.values(stock.kits))k.available=0;stock.kits.infantry.available=60;
 const snapshot=JSON.stringify(stock),f=initialCardFormation(stock,generals(s.domestic));assert.equal(JSON.stringify(stock),snapshot);assert.ok(f.commanderSquad.count+f.squads.reduce((n,x)=>n+x.count,0)<=60);assert.ok(f.squads.every(x=>x.kind==='infantry'));
 assert.match(formationCardSummary({squads:[{count:100}]}),/4 张.*26 张.*部队牌较少/);assert.match(formationCardSummary({squads:[]}),/0 张.*30 张/);
});
