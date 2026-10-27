import {famine} from './helpers/national.mjs';
import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';import {initializeResourceEconomy} from '../src/province-resources.mjs';import {initializeNewLocalAutonomy,localAuthority} from '../src/local-autonomy.mjs';import {executePersonnel} from '../src/personnel-actions.mjs';
function game(){const s=newGame('委任连续验收');initializeResourceEconomy(s.domestic);initializeNewLocalAutonomy(s.domestic);s.domestic.disasters.seed=1;return s;}
test('twelve actual turns retain resource accounting, never auto expand and honor revoked military authority',()=>{
 let s=game();const initial=Object.fromEntries(s.domestic.provinces.map(p=>[p.id,p.population.professions.soldiers]));
 for(let i=0;i<12;i++){
  if(i===3)s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:'hebei',civil:true,military:false,budget:500,priority:'food',locks:['farmers']}).state;
  advance(s);s=validateSave(structuredClone(s));
  for(const c of s.domestic.countries){const a=c.grainAccounting?.periods[0];if(a)assert.equal(a.opening+a.income-a.expense,c.fiscal.grain);}
  for(const p of s.domestic.provinces){if(p.countryId===s.domestic.playerCountryId)assert.equal(p.population.professions.soldiers,initial[p.id]);assert.equal(p.welfare.grainReserve,undefined);}
  assert.ok(s.domestic.governance.spent<=s.domestic.governance.turnBudget);
  if(i>=3){const p=s.domestic.provinces[0];assert.equal(localAuthority(s.domestic,p).military,false);assert.ok(!s.domestic.governance.records.some(r=>r.turn===s.turn&&r.provinceId===p.id&&/补充现有驻军|驻军训练不足，练兵/.test(r.reason)&&r.cost>0));}
 }
 assert.equal(s.turn,13);
});
test('locked food shortage is reported across turns; removing governor stops civil labor allocation',()=>{
 let s=game(),p=s.domestic.provinces[0];famine(s.domestic);s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:p.id,civil:true,military:false,budget:0,priority:'food',locks:['farmers']}).state;
 advance(s);p=s.domestic.provinces[0];assert.equal(p.population.professions.farmers,0);assert.ok(s.domestic.governance.records.some(r=>r.turn===s.turn&&r.provinceId===p.id&&/锁定|粮/.test(r.reason)));
 const governor=s.domestic.justice.officials.find(o=>(o.positionId??o.id)==='hebei-governor');s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'assign',officialId:governor.id,officeId:'henan-governor'}).state;
 assert.equal(localAuthority(s.domestic,s.domestic.provinces[0]).civil,false);const laborTurn=s.domestic.provinces[0].localPolicy.lastLaborTurn;advance(s);s=validateSave(structuredClone(s));assert.equal(s.domestic.provinces[0].localPolicy.lastLaborTurn,laborTurn);assert.equal(s.domestic.provinces[0].population.professions.farmers,0);
});
test('vacant delegated office is presented without granting authority or inventing expenses',async()=>{const {courtAgenda}=await import('../src/court-agenda.mjs');const s=game(),d=s.domestic,o=d.justice.officials.find(o=>(o.positionId??o.id)==='hebei-governor');o.positionId=null;o.provinceId=null;const before=JSON.stringify(s),a=courtAgenda(s,{limit:Infinity}).find(a=>a.id==='local-vacancy:hebei');assert.ok(a);assert.equal(a.action,'personnel-delegate');assert.match(a.summary,/州牧/);assert.equal(JSON.stringify(s),before);d.provinces[0].localPolicy.civil=false;assert.ok(!courtAgenda(s,{limit:Infinity}).some(a=>a.id==='local-vacancy:hebei'));});
