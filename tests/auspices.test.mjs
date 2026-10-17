import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';

import {AUSPICES,settleAuspices,auspiceDefinition} from '../src/auspices.mjs';
test('all twelve auspices grant real resources, preserve population and survive saves',()=>{
 for(let i=0;i<AUSPICES.length;i++){
 const s=newGame('祥瑞帝'),e=auspiceDefinition(s,AUSPICES[i].id),before=structuredClone(s);s.turn++;
 const values=[0,(i+.1)/AUSPICES.length,0];const r=settleAuspices(s,()=>values.shift());
 assert.equal(r.kind,e.id);const p=s.domestic.provinces.find(p=>p.id===r.provinceId),old=p&&before.domestic.provinces.find(v=>v.id===p.id);
 if(e.resource==='treasury')assert.equal(s.stats.treasury-before.stats.treasury,e.amount);
 else if(e.scope==='central')assert.equal(s.domestic.troopKits.depots.central.stock[e.resource]-before.domestic.troopKits.depots.central.stock[e.resource],e.amount);
 else if(e.resource==='cash')assert.equal(p.status.cash-old.status.cash,e.amount);
 else if(e.resource==='grain')assert.equal(p.welfare.grainReserve-old.welfare.grainReserve,e.amount);
 else {assert.equal(p.population.total-old.population.total,e.amount);if(e.resource!=='people')assert.equal(p.population.professions[e.resource]-old.population.professions[e.resource],e.amount);}
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))),s);
 const saved=JSON.stringify(s);assert.equal(settleAuspices(s,()=>0),null);assert.equal(JSON.stringify(s),saved);
 }
});
test('quiet turns, legacy migration, invalid records and deterministic reload',()=>{
 const s=newGame('帝');s.turn++;assert.equal(settleAuspices(s,()=>.3),null);
 const legacy=structuredClone(s);delete legacy.auspices;assert.equal(validateSave(legacy).auspices.lastTurn,s.turn);
 const copy=structuredClone(s);for(let i=0;i<40;i++){advance(s);advance(copy);}assert.deepEqual(s,copy);assert.ok(s.auspices.history.length);
 s.auspices.history[0].amount=-1;assert.throws(()=>validateSave(s),/祥瑞/);
});
