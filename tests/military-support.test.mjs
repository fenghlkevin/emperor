import test from 'node:test';import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';import {initializeResourceEconomy} from '../src/province-resources.mjs';import {militarySupport} from '../src/military-support.mjs';
const make=()=>{const s=newGame('养兵');initializeResourceEconomy(s.domestic);return s;};
test('support is read-only, excludes reserves as income, and central is a subset of province soldiers',()=>{
 const s=make(),before=structuredClone(s),a=militarySupport(s);assert.deepEqual(s,before);assert.equal(a.current,1600);assert.ok(a.recommended>=0);
 s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury+=1000000;assert.equal(militarySupport(s).recommended,a.recommended);
 const local=militarySupport(s,s.domestic.centralArmy.sourceProvinceId);assert.equal(local.current+a.current,s.domestic.provinces.find(p=>p.id===s.domestic.centralArmy.sourceProvinceId).population.professions.soldiers);
});
test('large recurring deficit cannot be disguised by grain stock or produce phantom capacity',()=>{const s=make();s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.centralExpenses.other=1000000;const q=militarySupport(s);assert.equal(q.recommended,0);assert.ok(q.reasons.some(r=>r.includes('财政')));assert.equal(militarySupport(s,'foreign').available,false);});
