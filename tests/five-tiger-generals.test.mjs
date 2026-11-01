import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {ACTIVE_HISTORICAL_PEOPLE} from '../src/exam.mjs';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';
import {ensureOfficialGrowth,validateOfficialGrowth} from '../src/official-growth.mjs';
import {profilesTable} from '../src/historical-profile-ui.mjs';
import {officialArt} from '../src/official-art.mjs';
import {newGame,validateSave} from '../src/game.mjs';
const rows=[['关羽',88,95],['张飞',82,93],['赵云',83,94],['马超',78,92],['黄忠',80,92]];
test('all five tiger generals are recruitable with strengthened command and complete portraits',()=>{
 for(const [name,,leadership] of rows){
  const p=ACTIVE_HISTORICAL_PEOPLE.find(p=>p.name===name);
  assert.ok(p,name);assert.equal(p.leadership,leadership);
  assert.match(profilesTable({query:name}).html,new RegExp('data-profile="'+p.id+'"'));
  for(const asset of Object.values(officialArt(p)))assert.ok(fs.existsSync(asset),asset);
  const candidate=structuredClone(p);ensureOfficialGrowth(candidate);validateOfficialGrowth(candidate);
  assert.ok(candidate.potential.caps.leadership>=leadership);
 }
});
test('old tiger saves upgrade command baselines and caps once while retaining training and appointments',()=>{
 const state=newGame('五虎');
 for(const [name,old] of rows){
  const p=structuredClone(HISTORICAL_PEOPLE.find(p=>p.name===name));
  ensureOfficialGrowth(p);p.potential.base.leadership=old;p.potential.caps.leadership=old;p.leadership=name==='关羽'?97:old;
  Object.assign(p,{id:'recruit-'+p.id,positionId:null,office:'待命',provinceId:null,status:'serving',discovered:false,plotTurn:null,loyalty:97,experience:89,growthVersion:1});
  state.domestic.justice.officials.push(p);
 }
 const next=validateSave(state);
 for(const [name,,leadership] of rows){
  const p=next.domestic.justice.officials.find(p=>p.name===name);
  assert.equal(p.leadership,name==='关羽'?97:leadership);assert.equal(p.potential.base.leadership,leadership);
  assert.equal(p.loyalty,97);assert.equal(p.experience,89);assert.equal(p.office,'待命');
  const before=structuredClone(p);ensureOfficialGrowth(p);assert.deepEqual(p,before);
 }
 validateSave(next);
});
test('previously hidden Ma Chao returns without duplicate recruits',()=>{
 const state=newGame('马超');const p=structuredClone(HISTORICAL_PEOPLE.find(p=>p.name==='马超'));
 Object.assign(p,{id:'recruit-'+p.id,positionId:null,office:'待命',provinceId:null,status:'serving',discovered:false,plotTurn:null,loyalty:98});
 state.domestic.personnel.hiddenPeople=[p];
 const next=validateSave(state),again=validateSave(next);
 assert.equal(again.domestic.justice.officials.filter(p=>p.name==='马超').length,1);
 assert.equal(again.domestic.justice.officials.find(p=>p.name==='马超').loyalty,98);
 assert.ok(!again.domestic.personnel.hiddenPeople.some(p=>p.name==='马超'));
});
