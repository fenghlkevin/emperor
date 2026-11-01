import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {medicalQuote,treatEmperor} from '../src/medical.mjs';
import {endingAction} from '../src/endings.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const reload=s=>validateSave(JSON.parse(JSON.stringify(s)));
const fixture=()=>{const s=newGame('太医院');Object.assign(s.stats,{health:18,energy:80,happiness:50});s.endings.criticalTurns=2;return s;};
test('outpatient care is available above emergency threshold and persists actual gains and side effects',()=>{
 const s=fixture();s.stats.health=60;const before=structuredClone(s),q=medicalQuote(s),r=treatEmperor(s);
 assert.deepEqual([q.cost,q.healthGain,q.energyLoss,q.happinessLoss,q.block],[1000,25,10,5,'']);
 assert.deepEqual([r.state.stats.health,r.state.stats.energy,r.state.stats.happiness],[85,70,45]);
 assert.equal(r.state.stats.life,s.stats.life);assert.equal(r.state.stats.treasury,s.stats.treasury-1000);assert.equal(r.state.endings.criticalTurns,0);
 assert.equal(r.state.endings.lastTreatmentTurn,s.turn);assert.deepEqual(s,before);assert.deepEqual(reload(r.state),r.state);
 assert.throws(()=>treatEmperor(reload(r.state)),/本旬已诊治/);assert.match(r.message,/60→85/);
});
test('emergency and hospital share one quota and preserve emergency threshold',()=>{
 const s=fixture();const hospital=treatEmperor(s).state;assert.throws(()=>endingAction(hospital,{kind:'treat'}),/本旬/);
 const emergency=endingAction(s,{kind:'treat'});assert.equal(emergency.stats.health,43);assert.throws(()=>treatEmperor(emergency),/本旬/);
 s.stats.health=40;assert.throws(()=>endingAction(s,{kind:'treat'}),/无须紧急/);assert.doesNotThrow(()=>treatEmperor(s));
});
test('treatment never exhausts the patient or underflows mood and all recovery is capped',()=>{
 for(const energy of [0,1,5,10,11,200]){
  const s=fixture();Object.assign(s.stats,{health:95,energy,happiness:3});s.phase=5;
  const r=treatEmperor(s).state;assert.equal(r.stats.health,100);assert.equal(r.stats.happiness,0);assert.equal(r.stats.energy,energy===0?0:Math.max(1,energy-10));
  assert.equal(r.stats.life,s.stats.life);assert.equal(r.turn,s.turn);assert.equal(r.phase,5);reload(r);
 }
 const s=fixture();s.stats.health=100;assert.throws(()=>treatEmperor(s),/安康/);
});
test('failed payment or persistence leaves health, quotas, funds and input unchanged',()=>{
 const s=fixture(),before=structuredClone(s),candidate=treatEmperor(s).state;
 assert.throws(()=>persistCandidate(s,candidate,{setItem(){throw Error('full');}}),/保存失败/);assert.deepEqual(s,before);
 const committed=persistCandidate(s,candidate,{setItem(){}});assert.equal(committed.stats.health,43);assert.equal(committed.endings.lastTreatmentTurn,1);
 const poor=fixture(),home=poor.domestic.countries.find(c=>c.id===poor.domestic.playerCountryId);home.fiscal.treasury=0;
 const snapshot=structuredClone(poor);assert.throws(()=>treatEmperor(poor),/诊金/);assert.deepEqual(poor,snapshot);
});
test('battle, collapse and ended reigns cannot receive treatment',()=>{
 for(const modify of [s=>s.stats.life=0,s=>s.domestic.war.battle={},s=>s.domestic.collapse.pending={},s=>s.domestic.strategy.pending={defender:s.domestic.playerCountryId}]){
  const s=fixture();modify(s);const before=structuredClone(s);assert.throws(()=>treatEmperor(s));assert.deepEqual(s,before);
 }
});
