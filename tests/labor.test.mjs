import test from 'node:test';
import assert from 'node:assert/strict';
import {laborProfile,productionLaborLimit} from '../src/labor.mjs';
import {newGame} from '../src/game.mjs';
import {executeKitCommand} from '../src/troop-kit-world.mjs';
import {quoteIndustry} from '../src/industry.mjs';
const province=(total,jobs)=>({population:{total,professions:{farmers:0,herders:0,merchants:0,workers:0,soldiers:0,militia:0,...jobs}}});
test('fixed labor ratio partitions population without age or sex fields',()=>{
 const p=province(101,{farmers:60,soldiers:10}),before=JSON.stringify(p),l=laborProfile(p);
 assert.equal(l.capacity,75);assert.equal(l.nonLabor,26);assert.equal(l.available,5);
 assert.equal(l.nonLabor+l.assigned+l.available,101);assert.equal(JSON.stringify(p),before);
});
test('legacy over-capacity jobs survive, but have no new recruitment room',()=>{
 const p=province(100,{farmers:70,soldiers:20});
 assert.equal(laborProfile(p).overCapacity,15);assert.equal(laborProfile(p).available,0);
 assert.equal(productionLaborLimit(p),70);assert.equal(p.population.professions.farmers,70);
});
test('recruitment cannot consume non-labor population',()=>{
 const s=newGame('劳动'),p=s.domestic.provinces.find(p=>p.id==='hebei');
 p.population.professions.farmers+=laborProfile(p).available;
 const before=JSON.stringify(s);
 assert.throws(()=>executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'recruit',sourceId:p.id,amount:1}),/可征平民不足/);
 assert.equal(JSON.stringify(s),before);
});
test('production allocation shares the same labor ceiling as recruiting',()=>{
 const s=newGame('劳动'),p=s.domestic.provinces.find(p=>p.id==='hebei');
 const targets=Object.fromEntries(['farmers','herders','merchants','workers'].map(k=>[k,p.population.professions[k]]));
 targets.farmers+=laborProfile(p).available+1;
 assert.throws(()=>quoteIndustry(s,{kind:'allocate',provinceId:p.id,targets}),/劳动力/);
});
test('population growth opens labor room, losses and migration never erase existing jobs',()=>{
 const p=province(100,{farmers:70,soldiers:5});
 p.population.total+=20;assert.equal(laborProfile(p).available,15);
 p.population.total-=40;assert.equal(laborProfile(p).overCapacity,15);assert.equal(laborProfile(p).available,0);
 assert.equal(p.population.professions.farmers,70);
});
test('new-rule auspice arrivals preserve total population without assigning non-labor as jobs',async()=>{
 const {settleAuspices,AUSPICES,auspiceDefinition}=await import('../src/auspices.mjs');
 const {initializeResourceEconomy}=await import('../src/province-resources.mjs');
 for(const kind of ['craftsmen','farmers','herders']){
  const s=newGame('迁户');initializeResourceEconomy(s.domestic);const p=s.domestic.provinces[0];
  p.population.professions.farmers+=laborProfile(p).available;
  const jobsBefore={...p.population.professions};const before=p.population.total,assigned=laborProfile(p).assigned,e=AUSPICES.find(x=>x.id===kind),values=[0,(AUSPICES.indexOf(e)+.1)/AUSPICES.length,0];
  s.turn++;settleAuspices(s,()=>values.shift());
  assert.equal(p.population.total,before+e.amount);assert.equal(laborProfile(p).overCapacity,0);
  assert.ok(laborProfile(p).assigned-assigned<=Math.floor((before+e.amount)*.75)-Math.floor(before*.75));
  const {industryStaffing,INDUSTRY_JOBS}=await import('../src/industry-labor.mjs');for(const [industry,job] of Object.entries(INDUSTRY_JOBS))assert.ok(p.population.professions[job]<=Math.max(jobsBefore[job],industryStaffing(p,industry,s.turn).required));
  assert.equal(auspiceDefinition(s,kind).label,'迁入总人口');
 }
});
