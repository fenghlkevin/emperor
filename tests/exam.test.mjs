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
