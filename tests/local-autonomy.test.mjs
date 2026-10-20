import {national,famine} from './helpers/national.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {settleGovernance} from '../src/governance.mjs';
function game(){const s=newGame('授权');initializeResourceEconomy(s.domestic);return s;}
function policy(s,extra={}){return executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:'hebei',civil:true,military:true,budget:100,priority:'food',locks:['farmers'],...extra}).state;}
test('local policy can recover civil and military authority separately and survives reload',()=>{
 const s=game(),before=JSON.stringify(s),next=policy(s,{military:false});assert.equal(JSON.stringify(s),before);
 assert.equal(next.domestic.provinces[0].localPolicy.military,false);assert.deepEqual(next.domestic.provinces[0].localPolicy.locks,['farmers']);validateSave(structuredClone(next));
 const revoked=policy(next,{civil:false,military:false});assert.equal(revoked.domestic.personnel.delegations.includes('hebei'),false);
});
test('new local appointment automatically enables only its corresponding authority',()=>{
 let s=game();const person=s.domestic.justice.officials.find(o=>!o.provinceId&&o.status==='serving');
 s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'assign',officialId:person.id,officeId:'hebei-general'}).state;
 assert.equal(s.domestic.provinces[0].localPolicy.military,true);assert.equal(s.domestic.provinces[0].localPolicy.civil,false);assert.ok(s.domestic.personnel.delegations.includes('hebei'));validateSave(structuredClone(s));
});
test('local cap constrains actual expenditure; new autonomous government never recruits troops',()=>{
 const s=policy(game()),d=s.domestic,p=d.provinces[0],soldiers=p.population.professions.soldiers;p.military.training=100;
 settleGovernance(d,2);assert.ok(d.governance.records.filter(r=>r.provinceId===p.id&&r.turn===2).reduce((n,r)=>n+r.cost,0)<=100);
 assert.equal(p.population.professions.soldiers,soldiers);
});
test('invalid local lock or budget is rejected without changing source',()=>{
 const s=game(),before=JSON.stringify(s);assert.throws(()=>policy(s,{locks:['soldiers']}),/无效/);assert.throws(()=>policy(s,{budget:-1}),/无效/);assert.equal(JSON.stringify(s),before);
});
test('industry staffing preserves existing jobs without silently drawing other workers',async()=>{
 const {planLocalLabor,prepareLocalLabor}=await import('../src/local-labor.mjs');
 let s=policy(game(),{locks:['workers']}),p=s.domestic.provinces[0];p.population.professions.farmers=0;const old=structuredClone(p.population.professions),before=JSON.stringify(p);
 const q=planLocalLabor(p,2);assert.equal(JSON.stringify(p),before);assert.equal(q.targets.farmers,0);assert.equal(q.moved,0);assert.match(q.reason,/不自动抽走/);assert.equal(q.targets.workers,old.workers);
 for(const k of ['herders','merchants'])assert.ok(q.targets[k]>=Math.ceil(old[k]*.8));
 prepareLocalLabor(s.domestic,2);assert.equal(p.population.professions.soldiers,old.soldiers);assert.equal(p.population.professions.militia,old.militia);
 const after=JSON.stringify(s.domestic);prepareLocalLabor(s.domestic,2);assert.equal(JSON.stringify(s.domestic),after);s.turn=2;validateSave(structuredClone(s));
});
test('locked farmer shortage is reported without overriding emperor choice',async()=>{
 const {planLocalLabor}=await import('../src/local-labor.mjs');const s=policy(game()),p=s.domestic.provinces[0];p.population.professions.farmers=0;
 const q=planLocalLabor(p,2);assert.equal(q.targets.farmers,0);assert.match(q.reason,/不自动抽走|锁定/);assert.ok(q.produced<q.goal);
});
test('pending civil recovery does not block general; kit purchase respects cap and never recruits',()=>{
 const s=policy(game(),{budget:100}),d=s.domestic,p=d.provinces[0];
 p.status.situation='stable';p.military.training=100;p.welfare.security=40;
 for(const k of Object.keys(d.troopKits.depots[p.id].stock))d.troopKits.depots[p.id].stock[k]=0;
 const before=p.population.professions.soldiers,treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;
 settleGovernance(d,2);
 const stock=Object.values(d.troopKits.depots[p.id].stock).reduce((n,v)=>n+v,0);
 assert.ok(stock>0);assert.ok(stock<=before);assert.equal(p.population.professions.soldiers,before);
 const records=d.governance.records.filter(r=>r.turn===2&&r.provinceId===p.id),spent=records.reduce((n,r)=>n+r.cost,0);
 assert.ok(spent<=100);assert.equal(treasury-d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury,spent);
 const after=JSON.stringify(d);settleGovernance(d,2);assert.equal(JSON.stringify(d),after);
});
test('daily kit replenishment requires military authority and safe grain; full stocks stay unchanged',()=>{
 for(const scenario of ['revoked','food','full']){
  const s=policy(game(),{civil:false,military:scenario!=='revoked',budget:500}),d=s.domestic,p=d.provinces[0];p.military.training=100;
  if(scenario!=='full')for(const k of Object.keys(d.troopKits.depots[p.id].stock))d.troopKits.depots[p.id].stock[k]=0;
  if(scenario==='food'){famine(s.domestic);}
  const before=JSON.stringify(d.troopKits);settleGovernance(d,2);assert.equal(JSON.stringify(d.troopKits),before,scenario);
 }
});
test('only newly created dynasty initializes existing officeholders as delegated; loading never grants authority',async()=>{
 const {initializeNewLocalAutonomy,localAuthority}=await import('../src/local-autonomy.mjs');const s=game(),d=s.domestic,p=d.provinces[0];assert.equal(localAuthority(d,p).military,false);initializeNewLocalAutonomy(d);assert.equal(localAuthority(d,p).military,true);assert.equal(localAuthority(d,p).civil,true);validateSave(structuredClone(s));const revoked=policy(s,{civil:false,military:false});initializeNewLocalAutonomy(revoked.domestic);assert.equal(localAuthority(revoked.domestic,revoked.domestic.provinces[0]).military,false);validateSave(structuredClone(revoked));
});
