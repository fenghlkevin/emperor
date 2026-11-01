import test from 'node:test';
import assert from 'node:assert/strict';
import {laborProfile,laborReserve,assignArrivalJobs} from '../src/labor.mjs';
import {fillIndustry} from '../src/industry-labor.mjs';
import {planManpower,applyManpower} from '../src/manpower.mjs';
const city=()=>({id:'test',resourceRulesVersion:1,population:{total:10000,professions:{farmers:5000,herders:0,merchants:0,workers:0,soldiers:100,militia:100}},economy:{agriculture:{developedArea:1000}},industryLabor:{base:{agriculture:{area:1000,workers:10000}}}});
test('automatic hiring leaves reserve, counts existing militia, and conserves population',()=>{
 const p=city(),total=p.population.total;
 assert.equal(fillIndustry(p,'agriculture'),2025);
 assert.equal(laborProfile(p).available,275);
 assert.equal(laborReserve(p).hiringAvailable,0);
 assert.equal(assignArrivalJobs(p,{farmers:1000}).farmers,0);
 assert.equal(p.population.total,total);
});
test('reserve remains draftable and becomes actual militia without inventing population',()=>{
 const p=city();fillIndustry(p,'agriculture');const d={provinces:[p]};
 applyManpower(d,planManpower(d,[p],275,{}),'militia',p.id);
 assert.equal(p.population.professions.militia,375);
 assert.equal(laborProfile(p).available,0);
 assert.equal(laborReserve(p).needed,0);
 assert.equal(p.population.total,10000);
});
test('existing full-employment saves retain jobs and can draft industry explicitly',()=>{
 const p=city();p.population.professions.farmers=7300;
 const before=structuredClone(p.population),d={provinces:[p]};
 assert.equal(fillIndustry(p,'agriculture'),0);
 assert.deepEqual(p.population,before);
 assert.equal(planManpower(d,[p],500,{farmers:10}).reduce((n,r)=>n+r.count,0),500);
 assert.throws(()=>planManpower(d,[p],500,{}));
});
