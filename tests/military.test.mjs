import test from 'node:test';import assert from 'node:assert/strict';
import {createDomestic,migrateDomestic,validateDomestic,countrySummary} from '../src/domestic.mjs';
import {militarySummary} from '../src/military.mjs';
import {newGame,validateSave,advance} from '../src/game.mjs';

test('central deployment is counted once and national military reconciles to population register',()=>{
 const d=createDomestic(),s=militarySummary(d);
 assert.equal(s.rows.length,11);assert.equal(s.soldiers,41300);assert.equal(s.rows[0].soldiers,1600);assert.equal(s.rows.find(r=>r.id==='guannei').soldiers,3040);assert.equal(s.soldiers,countrySummary(d).military);
 for(const key of Object.keys(s.stock))assert.equal(s.stock[key],s.rows.reduce((n,r)=>n+r.stock[key],0));
});
test('training is weighted by soldiers; empty armies have zero average',()=>{
 const d=createDomestic();for(const p of d.provinces.filter(p=>p.countryId==='sheng'))p.population.professions.soldiers=0;
 d.centralArmy.soldiers=0;assert.equal(militarySummary(d).training,0);
 const a=d.provinces.find(p=>p.id==='guannei'),b=d.provinces.find(p=>p.id==='hebei');a.population.professions.soldiers=300;a.military.training=80;b.population.professions.soldiers=100;b.military.training=20;d.centralArmy.soldiers=100;d.centralArmy.training=50;
 const s=militarySummary(d);assert.equal(s.soldiers,400);assert.equal(s.training,58);
});
test('invalid military stocks, overdrawn central deployment and foreign source are rejected',()=>{
 for(const mutate of [d=>d.centralArmy.soldiers=99999,d=>d.centralArmy.sourceProvinceId='rome-core',d=>d.troopKits.depots.central.stock.cavalry=-1,d=>d.troopKits.depots.hebei.stock.infantry=1.5,d=>delete d.troopKits.depots.hebei.stock.spears,d=>d.centralArmy.training=101]){const d=createDomestic();mutate(d);assert.throws(()=>validateDomestic(d));}
});
test('military reports are read only and stocks survive settlement and save reload',()=>{
 const state=newGame('军务帝');state.domestic.troopKits.depots.hebei.stock.infantry=1234;const before=JSON.stringify(state);militarySummary(state.domestic);militarySummary(state.domestic,'rome');assert.equal(JSON.stringify(state),before);advance(state);
 const copy=validateSave(JSON.parse(JSON.stringify(state)));assert.equal(copy.domestic.troopKits.depots.hebei.stock.infantry,1234);assert.deepEqual(copy.domestic.centralArmy,state.domestic.centralArmy);
 const foreign=militarySummary(copy.domestic,'rome');assert.equal(foreign.rows.length,1);assert.equal(foreign.rows[0].id,'rome-core');
});
