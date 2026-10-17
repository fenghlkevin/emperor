import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {observationReport,observe} from '../src/observation.mjs';
test('prosperity increases attendance, deterministic and bounded',()=>{
 const s=newGame('朝仪');const low=observationReport(s);
 for(const p of s.domestic.provinces){p.welfare.loyalty=100;p.welfare.stability=100;p.welfare.security=100;p.welfare.grainReserve=1e9;p.status.livingStandard=100;p.military.training=100;}
 s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury=1e9;
 const high=observationReport(s);assert.ok(high.score>low.score);assert.ok(high.count>low.count);assert.ok(high.count<=6000);assert.deepEqual(high,observationReport(s));
});
test('one reward per turn and attendance survives save round trip',()=>{
 const s=newGame('朝仪');s.phase=1;s.stats.happiness=40;
 const first=observe(s),second=observe(first.state);
 assert.equal(first.state.stats.happiness,45);assert.equal(second.state.stats.happiness,45);assert.equal(second.state.stats.energy,first.state.stats.energy);
 assert.deepEqual(observationReport(validateSave(JSON.parse(JSON.stringify(first.state)))),first.report);
 const next=structuredClone(first.state);next.turn++;assert.equal(observationReport(next).turn,next.turn);
});
