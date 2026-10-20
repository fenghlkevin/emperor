import {industryLandLimit} from '../src/terrain-economy.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {cityLand,cityPopulation,initializeCityCapacity,validateCityCapacity,CITY_EXPANSION_PEOPLE,CITY_EXPANSION_COST} from '../src/city-capacity.mjs';
import {executeIndustry,settleIndustry,quoteIndustry,validateIndustry} from '../src/industry.mjs';
import {outputFor} from '../src/economy.mjs';
import {settleStateDevelopment} from '../src/state-development.mjs';
import {executeRevenue,quoteRevenue} from '../src/revenue.mjs';
import {executeJustice} from '../src/justice.mjs';
import {executeNational} from '../src/national-actions.mjs';
import {quoteKitCommand} from '../src/troop-kit-world.mjs';
import {settleAuspices,validateAuspices,AUSPICES} from '../src/auspices.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const city=s=>s.domestic.provinces[0];
const action=(s,c)=>executeIndustry(s,{id:s.domestic.industryActions.nextId,provinceId:city(s).id,...c});
const full=p=>{let left=cityLand(p).available;for(const k of ['pastoral','industry','commerce','agriculture']){const n=Math.min(left,industryLandLimit(p,k)-p.economy[k].developedArea);p.economy[k].developedArea+=n;left-=n;}assert.equal(left,0);};
const packed=p=>{p.population.total=cityPopulation(p).limit;};

test('four industries spend one shared land budget, reserve construction land and never exceed geographic area',()=>{
 const s=newGame('土地帝'),p=city(s);p.cityCapacity.land=cityLand(p).used+123;
 for(const industry of Object.keys(p.economy)){
  const q=quoteIndustry(s,{kind:'develop',provinceId:p.id,industry,area:123});assert.equal(q.cost,246);
  assert.throws(()=>action(s,{kind:'develop',industry,area:124}),/剩余土地/);
  const r=action(s,{kind:'develop',industry,area:123}).state;assert.equal(cityLand(city(r)).available,0);assert.equal(cityLand(city(r)).reserved,123);
  settleIndustry(r.domestic,2);assert.equal(cityLand(city(r)).used,p.cityCapacity.land);assert.equal(cityLand(city(r)).reserved,0);validateCityCapacity(r.domestic);
 }
 const bad=structuredClone(s);city(bad).cityCapacity.land=city(bad).area+1;assert.throws(()=>validateSave(bad),/容量/);
});

test('full city can convert land; donor and recipient output switch together on the next turn without new land or people',()=>{
 const s=newGame('转用帝'),p=city(s);full(p);const before=structuredClone(s),area=137,oldDonor=outputFor(p,'commerce',2),oldTarget=outputFor(p,'agriculture',2);
 const q=quoteIndustry(s,{kind:'convert',provinceId:p.id,fromIndustry:'commerce',industry:'agriculture',area});
 assert(q.outputs.find(x=>x.key==='commerce').after<oldDonor);assert.deepEqual(s,before);
 const r=action(s,{kind:'convert',fromIndustry:'commerce',industry:'agriculture',area}).state;
 assert.deepEqual(city(r).economy,p.economy);assert.equal(cityLand(city(r)).reserved,0);
 settleIndustry(r.domestic,2);const c=city(r);
 assert.equal(c.economy.commerce.developedArea,p.economy.commerce.developedArea-area);assert.equal(c.economy.agriculture.developedArea,p.economy.agriculture.developedArea+area);
 assert.equal(cityLand(c).used,cityLand(p).used);assert.deepEqual(c.population,p.population);
 assert.equal(outputFor(c,'commerce',2),oldDonor);assert.equal(outputFor(c,'agriculture',2),oldTarget);
 assert(outputFor(c,'commerce',3)<oldDonor);assert.equal(outputFor(c,'agriculture',3),q.outputs.find(x=>x.key==='agriculture').after);
 r.turn=2;assert.deepEqual(validateSave(structuredClone(r)).domestic.provinces[0].development.activation,c.development.activation);
 const saved=JSON.stringify(r);settleIndustry(r.domestic,2);assert.equal(JSON.stringify(r),saved);
});

test('conversion rejects missing, equal, unknown, insufficient and not-yet-active donor land atomically',()=>{
 const s=newGame('边界帝'),p=city(s),before=structuredClone(s);
 for(const fromIndustry of [undefined,'agriculture','toString'])assert.throws(()=>action(s,{kind:'convert',fromIndustry,industry:'agriculture',area:100}));
 p.economy.commerce.developedArea=50;assert.throws(()=>action(s,{kind:'convert',fromIndustry:'commerce',industry:'agriculture',area:51}),/不足/);
 p.development.activation={industry:'commerce',area:50,completedTurn:1,effectiveTurn:2};assert.throws(()=>action(s,{kind:'convert',fromIndustry:'commerce',industry:'agriculture',area:1}),/不足/);
 assert.deepEqual(s.domestic.countries,before.domestic.countries);
});

test('local annual investment respects shared full land and performs no payment',()=>{
 const s=newGame('兴农帝'),p=city(s);full(p);s.domestic.countries[0].fiscal.treasury=10000;p.budget.taxRate=.2;p.welfare.security=p.welfare.stability=100;
 const land=cityLand(p).used;settleStateDevelopment(s.domestic,37);
 assert.equal(cityLand(p).used,land);assert.equal(p.civic.localInvestment,undefined);assert.ok(!s.domestic.countries[0].ledger.flatMap(r=>r.entries).some(e=>e.reason===p.name+'年度兴农'));
});

test('normal capacity stops positive annual growth, overload adds bounded pressure and no existing residents are deleted',()=>{
 for(const mode of ['below','normal','over']){
  const s=newGame('人丁帝'),p=city(s),normal=p.cityCapacity.population;
  p.population.total=normal+(mode==='over'?Math.floor(normal*.1):mode==='below'?-1:0);p.welfare.stability=100;
  const before=p.population.total,stability=p.welfare.stability,pressure=cityPopulation(p).pressure;
  settleStateDevelopment(s.domestic,37);
  assert.equal(p.population.total,mode==='below'?normal:before);assert.equal(p.welfare.stability,stability-pressure);
 }
});

test('census admits only available room and rejects a paid no-op when all owned cities are full',()=>{
 const s=newGame('户籍帝');for(const p of s.domestic.provinces.filter(p=>p.countryId==='sheng'))packed(p);
 const p=city(s);p.population.total-=7;
 const q=quoteRevenue(s,{kind:'census'});assert.equal(q.changes.reduce((n,c)=>n+c.added,0),7);
 const r=executeRevenue(s,{id:s.domestic.fiscalActions.nextId,kind:'census'}).state;assert.equal(city(r).population.total,cityPopulation(city(r)).limit);validateSave(r);
 assert.throws(()=>executeRevenue(r,{id:r.domestic.fiscalActions.nextId,kind:'census'}),/超载上限/);
});

test('amnesty and auspices respect the hard limit and record actual arrivals',()=>{
 const s=newGame('归籍帝');for(const p of s.domestic.provinces.filter(p=>p.countryId==='sheng'))packed(p);
 const p=city(s);p.population.total-=3;
 const r=executeJustice(s,{id:s.domestic.justice.nextId,kind:'amnesty'}).state;assert.equal(city(r).population.total,cityPopulation(city(r)).limit);
 const e=newGame('祥瑞帝');packed(city(e));city(e).population.total-=2;e.turn=2;
 const i=AUSPICES.findIndex(x=>x.id==='people');let calls=0;const record=settleAuspices(e,()=>[0,(i+.1)/AUSPICES.length,0][calls++]);
 assert.equal(record.amount,2);assert.equal(city(e).population.total,cityPopulation(city(e)).limit);validateAuspices(e);validateSave(e);
});

test('migration and military moves reject over-capacity targets without losing source residents',()=>{
 const s=newGame('迁民帝'),source=city(s),target=s.domestic.provinces[1];packed(target);target.welfare.stability=100;
 const before=structuredClone(s);assert.throws(()=>executeNational(s,{id:s.domestic.stateDevelopment.nextId,kind:'migration',sourceId:source.id,targetId:target.id,amount:1}),/超载上限/);
 assert.throws(()=>quoteKitCommand(s,{kind:'transfer',sourceId:source.id,targetId:target.id,soldiers:1}),/超载上限/);assert.deepEqual(s,before);
 packed(s.domestic.provinces.find(p=>p.id===s.domestic.centralArmy.sourceProvinceId));
 assert.throws(()=>quoteKitCommand(s,{kind:'recruit',sourceId:'central',amount:1}),/超载上限/);
});

test('expansion raises both population limits, preserves land and population, charges once and rolls back failed saves',()=>{
 const s=newGame('扩城帝'),p=city(s),before=structuredClone(s),r=action(s,{kind:'expand'});
 assert.equal(city(r.state).cityCapacity.population,p.cityCapacity.population+CITY_EXPANSION_PEOPLE);assert.deepEqual(city(r.state).population,p.population);assert.deepEqual(city(r.state).economy,p.economy);
 assert.equal(r.state.stats.treasury,s.stats.treasury-CITY_EXPANSION_COST);
 assert.throws(()=>persistCandidate(s,r.state,{setItem(){throw Error('quota');}}),/保存失败/);assert.deepEqual(s,before);
 persistCandidate(s,r.state,{setItem(){}});assert.throws(()=>executeIndustry(r.state,{id:1,kind:'expand',provinceId:p.id}),/已执行/);
 assert.equal(validateSave(structuredClone(r.state)).domestic.provinces[0].cityCapacity.population,p.cityCapacity.population+CITY_EXPANSION_PEOPLE);
});

test('old saves receive capacities once, preserve resources and pending reservations; partial or invalid records cannot reset limits',()=>{
 const s=action(newGame('旧档帝'),{kind:'develop',industry:'agriculture',area:50}).state;
 const original=structuredClone(s);delete s.domestic.capacityRulesVersion;for(const p of s.domestic.provinces)delete p.cityCapacity;
 const r=validateSave(s);assert.deepEqual(city(r).population,city(original).population);assert.deepEqual(city(r).economy,city(original).economy);assert.equal(r.stats.treasury,original.stats.treasury);assert.equal(cityLand(city(r)).reserved,50);
 const capacity=structuredClone(city(r).cityCapacity);city(r).population.total+=1;initializeCityCapacity(r.domestic);assert.deepEqual(city(r).cityCapacity,capacity);
 assert.deepEqual(validateSave(structuredClone(r)).domestic.provinces[0].cityCapacity,capacity);
 for(const mutation of [d=>delete d.provinces[0].cityCapacity,d=>d.provinces[0].cityCapacity.population=0,d=>d.provinces[0].cityCapacity.land=1,d=>d.capacityRulesVersion=2]){const bad=structuredClone(r);mutation(bad.domestic);assert.throws(()=>validateSave(bad));}
});

test('an entirely assigned population at the hard cap cannot gain a fabricated resident at annual settlement',()=>{
 const s=newGame('军户帝'),p=city(s);packed(p);for(const k of Object.keys(p.population.professions))p.population.professions[k]=0;p.population.professions.farmers=p.population.total;
 const population=p.population.total;settleStateDevelopment(s.domestic,37);assert.equal(p.population.total,population);validateCityCapacity(s.domestic);
});

test('foreign automatic agricultural investment cannot bypass a full shared land budget',async()=>{
 const {settleStrategy}=await import('../src/foreign-strategy.mjs');
 const s=newGame('邻邦帝'),foreign=s.domestic.provinces.filter(p=>p.countryId!=='sheng');for(const p of foreign)full(p);
 const before=foreign.map(p=>structuredClone(p.economy));settleStrategy(s.domestic,6);
 foreign.forEach((p,i)=>assert.deepEqual(p.economy,before[i]));validateCityCapacity(s.domestic);
});


test('expansion now costs 5000, preserves historical 2000 receipts and rejects insufficient funds atomically',()=>{
 assert.equal(CITY_EXPANSION_COST,5000);
 const s=newGame('扩城价格'),r=action(s,{kind:'expand'}).state;
 assert.equal(r.domestic.industryActions.history[0].cost,5000);
 const history=structuredClone(r.domestic);history.industryActions.history[0].cost=2000;
 assert.doesNotThrow(()=>validateIndustry(history));
 history.industryActions.history[0].cost=3000;assert.throws(()=>validateIndustry(history));
 s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury=4999;s.stats.treasury=4999;
 const before=structuredClone(s);assert.throws(()=>action(s,{kind:'expand'}),/不足/);assert.deepEqual(s,before);
});
