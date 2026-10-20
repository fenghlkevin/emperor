import test from 'node:test';
import assert from 'node:assert/strict';
import {ACTIVE_HISTORICAL_PEOPLE,RANDOM_ABILITY_CAPS,historicalChance} from '../src/exam.mjs';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {executePersonnel,settlePersonnel} from '../src/personnel-actions.mjs';
import {profilesTable} from '../src/historical-profile-ui.mjs';
test('only the 100 original special templates appear in profiles',()=>{
 assert.equal(ACTIVE_HISTORICAL_PEOPLE.length,100);
 assert.equal(new Set(ACTIVE_HISTORICAL_PEOPLE.map(p=>p.id)).size,100);
 assert.match(profilesTable().html,/共 100 人/);
 assert.match(profilesTable({query:'朱熹'}).html,/共 0 人/);
});
test('charm and wisdom independently raise historical probability',()=>{
 assert.equal(historicalChance({charm:0,wisdom:0}),.05);
 assert.ok(historicalChance({charm:100,wisdom:0})>historicalChance({charm:0,wisdom:0}));
 assert.ok(historicalChance({charm:0,wisdom:100})>historicalChance({charm:0,wisdom:0}));
});
test('mixed and all-random exams survive hiring and save reload with bounded abilities',()=>{
 for(const roll of [0,.15,.999999]){
 let s=executePersonnel(newGame('帝'),{kind:'exam',id:1}).state;
 settlePersonnel(s.domestic,2,()=>roll,s.stats);
 const candidates=s.domestic.personnel.candidates;
 assert.ok(candidates.some(p=>p.generated));assert.equal(new Set(candidates.map(p=>p.name)).size,candidates.length);
 for(const p of candidates)if(p.generated){for(const [k,cap] of Object.entries(RANDOM_ABILITY_CAPS))assert.ok(p[k]>=0&&p[k]<=cap);}else assert.ok(ACTIVE_HISTORICAL_PEOPLE.some(x=>x.id===p.id));
 const p=candidates.find(p=>p.generated);s=executePersonnel(s,{id:2,kind:'hire',candidateId:p.id}).state;
 assert.ok(validateSave(s).domestic.justice.officials.some(o=>o.id==='recruit-'+p.id));
 }
});
test('hidden historical recruits are preserved outside the active roster on migration',()=>{
 const s=newGame('帝'),p=HISTORICAL_PEOPLE.find(p=>p.name==='朱熹');
 s.domestic.justice.officials.push({...p,id:'recruit-'+p.id,office:'待命',provinceId:null,status:'serving',discovered:false,plotTurn:null,loyalty:65});
 const d=validateSave(s).domestic;
 assert.ok(!d.justice.officials.some(o=>o.name===p.name));assert.ok(d.personnel.hiddenPeople.some(o=>o.name===p.name));
 assert.equal(HISTORICAL_PEOPLE.length,2481);
});

test('ordinary random abilities stay modest and rare recruits specialize instead of gaining two elite abilities',async()=>{const {randomExamAbilities}=await import('../src/exam.mjs');for(const role of ['文职','武将']){const ordinary=randomExamAbilities(()=>.999999,role,0);for(const key of ['intelligence','martial','leadership','politics'])assert.equal(ordinary[key],65);let i=0;const rolls=[...Array(9).fill(.5),0,.999999,.999999],rare=randomExamAbilities(()=>rolls[i++]??.5,role,.03);const primary=role==='武将'?'martial':'intelligence',secondary=role==='武将'?'leadership':'politics';assert.equal(rare[primary],85);assert.equal(rare[secondary],70);assert.equal(['intelligence','martial','leadership','politics'].filter(k=>rare[k]>70).length,1);}});

test('seeded recruit samples concentrate ordinary skills around 25-50 and keep high specialists rare even with the best minister',async()=>{const {randomExamAbilities}=await import('../src/exam.mjs'),{selectionEffect}=await import('../src/central-office-effects.mjs');const s=newGame('低调选才');initializeResourceEconomyForTest(s);function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}let roll=rng(83),count=0,strong=0,veryStrong=0,middle=0,total=0;for(let i=0;i<20000;i++){const p=randomExamAbilities(roll,i%2?'武将':'文职',.03),skills=['intelligence','martial','leadership','politics'].map(k=>p[k]);strong+=Math.max(...skills)>=70;veryStrong+=Math.max(...skills)>=80;for(const value of skills){assert.ok(value>=10&&value<=85);total+=value;middle+=value>=25&&value<=50;count++;}}assert.ok(strong/20000<.035);assert.ok(veryStrong/20000<.015);assert.ok(middle/count>.65);assert.ok(total/count<40);
 function initializeResourceEconomyForTest(s){s.domestic.officialEffectsVersion=1;const o=s.domestic.justice.officials.find(o=>(o.positionId??o.id)==='personnel-minister');o.positionId=null;assert.equal(selectionEffect(s.domestic).highChance,.005);Object.assign(o,{positionId:'personnel-minister',intelligence:100,politics:100,experience:100});assert.equal(selectionEffect(s.domestic).highChance,.03);}
});
