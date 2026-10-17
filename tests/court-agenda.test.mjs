import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {courtAgenda,courtOverview,courtSpeaker} from '../src/court-agenda.mjs';
test('court agenda is bounded, deterministic and read-only, including real officeholders',()=>{
 const s=newGame('御案'),before=JSON.stringify(s),a=courtAgenda(s);
 assert.equal(a.length,3);assert.deepEqual(courtAgenda(s),a);assert.equal(JSON.stringify(s),before);
 assert.ok(a.some(x=>x.action==='atlas-grain'));assert.equal(courtOverview(s).treasury,10000);assert.ok(courtSpeaker(s,'revenue-minister').name);
});
test('actual hunger and capital crisis take priority over optional court matters',()=>{
 const s=newGame('急奏'),p=s.domestic.provinces[0];p.welfare.grainReserve=0;p.population.professions.farmers=0;s.domestic.collapse.pending={provinceId:'guannei'};
 const a=courtAgenda(s);assert.equal(a[0].id,'capital');assert.ok(a.some(x=>x.id==='food'&&x.urgent));assert.ok(a.every(x=>typeof x.summary==='string'));assert.equal(new Set(a.map(x=>x.id)).size,a.length);
});
test('construction petition reports real progress and disappears with the project',()=>{
 const s=newGame('营建'),p=s.domestic.provinces[0];p.construction.project={building:'granaries',progress:2,startedTurn:1};
 const a=courtAgenda(s);assert.match(a.find(x=>x.id==='works').summary,/2\/4/);p.construction.project=null;assert.ok(!courtAgenda(s).some(x=>x.id==='works'));
});
