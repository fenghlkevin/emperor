import {nationalFoodForecast} from '../src/national-resources.mjs';
import {national,famine} from './helpers/national.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave,SAVE_KEY,resolveExhaustion} from '../src/game.mjs';
import {countrySummary,settleDomestic,outputFor,validateDomestic,INDUSTRIES} from '../src/domestic.mjs';
import {industryTax,unallocatedPopulation} from '../src/economy.mjs';
import {executeIndustry,quoteIndustry,settleIndustry,validateIndustry} from '../src/industry.mjs';
import {startConstruction,settleConstruction} from '../src/construction.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {settleAuspices} from '../src/auspices.mjs';
import {settleDisasters} from '../src/disasters.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {spendEnergy} from '../src/emperor.mjs';
import {validateFinance} from '../src/finance.mjs';
const province=s=>s.domestic.provinces.find(p=>p.id==='hebei');
const home=s=>s.domestic.countries[0];
const targets=p=>Object.fromEntries(INDUSTRIES.map(([, ,job])=>[job,p.population.professions[job]]));
const act=(s,c)=>executeIndustry(s,{id:s.domestic.industryActions.nextId,provinceId:'hebei',...c});
const roundtrip=s=>validateSave(JSON.parse(JSON.stringify(s)));
const memory=()=>({value:null,setItem(key,value){assert.equal(key,SAVE_KEY);this.value=value;}});
function isolatedProduction(){
 const s=newGame('四业帝'),p=province(s);p.population.total=100000;
 for(const k in p.population.professions)p.population.professions[k]=0;
 p.population.professions.farmers=1000;p.economy.agriculture={capacityArea:10000,developedArea:2000,productivity:80};p.budget.taxRate=.5;national(s.domestic).fiscal.grain=10000;
 // This unit fixture explicitly suppresses event draws; separate tests exercise actual disaster cycles.
 s.domestic.disasters.lastTurn=100;for(const city of s.domestic.provinces)city.buildings.markets=0;
 return s;
}

test('D01 development pays once, produces only after the completion turn and reconciles tax and grain',()=>{
 let s=isolatedProduction(),p=province(s);const before=structuredClone(s),q=quoteIndustry(s,{kind:'develop',provinceId:'hebei',industry:'agriculture',area:500});
 assert.equal(outputFor(p,'agriculture'),13);assert.equal(q.outputs[0].after,17);assert.equal(q.cost,1000);assert.equal(q.taxBefore,0);assert.equal(q.taxAfter,0);assert.deepEqual(s,before);
 s=act(s,{kind:'develop',industry:'agriculture',area:500}).state;p=province(s);
 assert.equal(p.economy.agriculture.developedArea,2000);assert.equal(home(s).fiscal.treasury,9000);assert.equal(home(s).ledger[0].expenditure,1000);assert.equal(unallocatedPopulation(p),74000);
 const grainForecast=nationalFoodForecast(s.domestic,2),expected=countrySummary(s.domestic),grain=national(s.domestic).fiscal.grain;s.turn=2;settleDomestic(s.domestic,2);
 assert.equal(p.economy.agriculture.developedArea,2500);assert.equal(p.development.project,null);assert.equal(p.development.activation.effectiveTurn,3);
 assert.equal(outputFor(p,'agriculture',2),13);assert.equal(outputFor(p,'agriculture'),17);assert.equal(national(s.domestic).fiscal.grain,grainForecast.closing);
 assert.equal(home(s).ledger[0].categories.regular.income,expected.income);assert.equal(home(s).ledger[0].categories.regular.expenditure,expected.expenditure);
 const completed=JSON.stringify(s);settleDomestic(s.domestic,2);assert.equal(JSON.stringify(s),completed);
 s=roundtrip(s);p=province(s);s.turn=3;const nextGrain=nationalFoodForecast(s.domestic,3),prior=national(s.domestic).fiscal.grain;settleDomestic(s.domestic,3);
 assert.equal(national(s.domestic).fiscal.grain,nextGrain.closing);assert.equal(home(s).ledger[0].categories.regular.income,expected.income);assert.equal(p.development.activation,null);validateFinance(s.domestic);
});

test('all four industries use the shared formula and preserve their units without adding equipment',()=>{
 for(const [industry]of INDUSTRIES){const s=newGame('四业帝'),before=structuredClone(s),q=quoteIndustry(s,{kind:'develop',provinceId:'hebei',industry,area:123});const next=act(s,{kind:'develop',industry,area:123}).state;settleIndustry(next.domestic,2);const p=province(next);
 assert.equal(p.economy[industry].developedArea,province(s).economy[industry].developedArea+123);
 assert.equal(q.outputs.find(x=>x.key===industry).after,outputFor(p,industry,3));
 for(const [other]of INDUSTRIES)if(other!==industry)assert.deepEqual(p.economy[other],province(s).economy[other]);
 assert.deepEqual(p.population,before.domestic.provinces[0].population);assert.deepEqual(next.domestic.centralArmy,before.domestic.centralArmy);validateDomestic(next.domestic);
 }
});

test('D02 remaining capacity, integer input, ownership, pending work, cash and stale commands are atomic',()=>{
 const s=newGame('边界帝'),p=province(s);p.cityCapacity.land=Object.values(p.economy).reduce((n,e)=>n+e.developedArea,0)+123;
 const before=structuredClone(s);
 for(const c of [{area:124},{area:0},{area:-1},{area:501},{area:1.5},{area:NaN},{area:Infinity},{industry:'toString',area:1},{provinceId:'rome-core',area:1},{id:2,area:1}])assert.throws(()=>act(s,{kind:'develop',industry:'agriculture',area:123,...c}));
 assert.deepEqual(s,before);const next=act(s,{kind:'develop',industry:'agriculture',area:123}).state;
 assert.equal(home(next).fiscal.treasury,9754);assert.equal(home(next).ledger[0].entries[0].expenditure,246);
 assert.throws(()=>executeIndustry(next,{id:1,kind:'develop',provinceId:'hebei',industry:'commerce',area:1}),/已执行/);
 assert.throws(()=>act(next,{kind:'develop',industry:'commerce',area:1}),/已有/);
 const poor=newGame('贫帝');home(poor).fiscal.treasury=1;const poorBefore=structuredClone(poor);assert.throws(()=>act(poor,{kind:'develop',industry:'commerce',area:1}),/国库不足/);assert.deepEqual(poor,poorBefore);
});

test('D03 disaster stops development until the exact end, without a second charge',()=>{
 let s=act(newGame('灾帝'),{kind:'develop',industry:'industry',area:500}).state,p=province(s),area=p.economy.industry.developedArea;
 p.disaster={kind:'fire',startTurn:1,endTurn:3};s.domestic.disasters.lastTurn=1;s.domestic.disasters.seed=1;
 assert.throws(()=>act(s,{kind:'develop',provinceId:'hebei',industry:'commerce',area:1}),/受灾/);
 settleDisasters(s.domestic,2);settleIndustry(s.domestic,2);assert.equal(p.development.project.progress,0);assert.equal(p.economy.industry.developedArea,area);
 s.turn=2;s=roundtrip(s);p=province(s);settleDisasters(s.domestic,3);settleIndustry(s.domestic,3);
 assert.equal(p.disaster,null);assert.equal(p.development.project,null);assert.equal(p.economy.industry.developedArea,area+500);assert.equal(p.development.activation.effectiveTurn,4);
 assert.equal(home(s).ledger.flatMap(r=>r.entries).filter(e=>e.reason.includes('开发')).reduce((n,e)=>n+e.expenditure,0),1000);validateFinance(s.domestic);
});

test('ordinary buildings and development have independent queues and unchanged building effects',()=>{
 let s=startConstruction(newGame('双队列帝'),'hebei','markets').state;
 s=act(s,{kind:'develop',industry:'commerce',area:100}).state;const p=province(s),welfare=structuredClone(p.welfare),buildings=structuredClone(p.buildings);
 assert.ok(p.construction.project);assert.ok(p.development.project);assert.equal(home(s).fiscal.treasury,9300);
 settleConstruction(s.domestic,2);settleIndustry(s.domestic,2);assert.equal(p.construction.project.progress,1);assert.equal(p.development.project,null);
 assert.deepEqual(p.welfare,welfare);assert.deepEqual(p.buildings,buildings);validateFinance(s.domestic);
});

test('D04 allocation updates four jobs simultaneously, preserves soldiers, militia, population, grain and cash',()=>{
 const s=newGame('调配帝'),p=province(s),t=targets(p);t.farmers-=200;t.merchants+=200;
 const q=quoteIndustry(s,{kind:'allocate',provinceId:p.id,targets:t}),next=act(s,{kind:'allocate',targets:t}).state,np=province(next);
 assert.equal(np.population.total,p.population.total);assert.equal(np.population.professions.soldiers,p.population.professions.soldiers);assert.equal(np.population.professions.militia,p.population.professions.militia);
 assert.deepEqual(next.domestic.centralArmy,s.domestic.centralArmy);assert.equal(unallocatedPopulation(np),unallocatedPopulation(p));assert.equal(national(next.domestic).fiscal.grain,national(s.domestic).fiscal.grain);
 assert.equal(home(next).fiscal.treasury,10000);assert.equal(home(next).ledger[0].entries[0].expenditure,0);assert.equal(np.development.lastAllocationTurn,1);
 for(const row of q.outputs)assert.equal(row.after,outputFor(np,row.key));assert.equal(q.taxAfter,industryTax(np));validateDomestic(next.domestic);
});

test('D05 full target validation blocks missing fields, military edits, fractional values and over-allocation',()=>{
 const s=newGame('调配帝'),p=province(s),base=targets(p),before=structuredClone(s);
 for(const t of [{...base,farmers:-1},{...base,farmers:1.5},{...base,farmers:NaN},{...base,farmers:Infinity},{...base,soldiers:0},{...base,militia:0},{farmers:1,herders:1,merchants:1},[],{...base,farmers:p.population.total},base])assert.throws(()=>act(s,{kind:'allocate',targets:t}));
 assert.deepEqual(s,before);
 const t={...base,farmers:base.farmers+unallocatedPopulation(p)};const next=act(s,{kind:'allocate',targets:t}).state;assert.equal(unallocatedPopulation(province(next)),0);
});

test('D06 allocation uses the unused pool, survives reload and unlocks once on the next turn',()=>{
 const s=newGame('调配帝'),p=province(s),base=targets(p);const first={...base,workers:base.workers+100};
 let next=act(s,{kind:'allocate',targets:first}).state;assert.equal(unallocatedPopulation(province(next)),unallocatedPopulation(p)-100);
 next=roundtrip(next);assert.throws(()=>act(next,{kind:'allocate',targets:base}),/本旬已完成/);
 assert.throws(()=>act(next,{kind:'allocate',provinceId:'rome-core',targets:base}),/本国/);
 advance(next);const cash=home(next).fiscal.treasury;next=act(next,{kind:'allocate',targets:base}).state;assert.equal(home(next).fiscal.treasury,cash);assert.equal(province(next).development.lastAllocationTurn,2);roundtrip(next);
});

test('D07 census and auspices feed the same workforce and output forecasts without resetting pending development',()=>{
 let s=act(newGame('户籍帝'),{kind:'develop',industry:'agriculture',area:50}).state;
 s=executeRevenue(s,{id:1,kind:'census'}).state;const p=province(s),before=p.population.professions.farmers;
 s.turn=2;const rolls=[0,(10.1)/12,0];settleAuspices(s,()=>rolls.shift());assert.equal(p.population.professions.farmers,before+1600);
 const t=targets(p);t.workers+=1;const q=quoteIndustry(s,{kind:'allocate',provinceId:'hebei',targets:t});assert.equal(q.outputs[0].before,outputFor(p,'agriculture'));
 const next=roundtrip(s);assert.deepEqual(province(next).development.project,p.development.project);assert.equal(next.domestic.industryActions.nextId,2);assert.equal(next.domestic.industryActions.history.length,1);
});

test('lost territory retains work and its prepaid cost but rejects player orders',()=>{
 const s=act(newGame('失地帝'),{kind:'develop',industry:'pastoral',area:50}).state,p=province(s),target=s.domestic.countries.find(c=>c.id==='tubo');
 home(s).provinceIds=home(s).provinceIds.filter(id=>id!==p.id);p.countryId=target.id;target.provinceIds.push(p.id);
 const cash=home(s).fiscal.treasury,area=p.economy.pastoral.developedArea;
 assert.throws(()=>act(s,{kind:'allocate',targets:targets(p)}),/本国/);assert.throws(()=>act(s,{kind:'develop',industry:'commerce',area:1}),/本国/);
 settleIndustry(s.domestic,2);assert.equal(p.economy.pastoral.developedArea,area+50);assert.equal(home(s).fiscal.treasury,cash);s.turn=2;roundtrip(s);
});

test('legacy migration adds empty queues at the save turn, preserves resources and existing construction, and is repeatable',()=>{
 let s=startConstruction(newGame('旧档帝'),'hebei','markets').state;s.turn=50;
 delete s.domestic.industryActions;for(const p of s.domestic.provinces)delete p.development;
 const before=structuredClone(s),loaded=roundtrip(s);assert.equal(loaded.domestic.industryActions.nextId,1);assert.equal(province(loaded).development.lastTurn,50);assert.equal(province(loaded).development.lastAllocationTurn,null);
 assert.deepEqual(province(loaded).economy,province(before).economy);assert.deepEqual(province(loaded).population,province(before).population);assert.deepEqual(province(loaded).construction,province(before).construction);
 assert.equal(home(loaded).fiscal.treasury,home(before).fiscal.treasury);assert.deepEqual(roundtrip(loaded),loaded);
});

test('corrupt queues, capacity, activations, counters and partial new-format saves are rejected',()=>{
 const s=act(newGame('校验帝'),{kind:'develop',industry:'agriculture',area:50}).state;
 for(const corrupt of [x=>province(x).development.project.area=501,x=>province(x).development.project.cost=99,x=>province(x).development.project.industry='bogus',x=>province(x).development.project.progress=1,x=>province(x).development.project.startedTurn=-1,x=>province(x).development.project.ownerId='missing',x=>province(x).development.project.area=province(x).economy.agriculture.capacityArea,x=>delete province(x).development,x=>x.domestic.industryActions.nextId=1,x=>x.domestic.industryActions.version=2,x=>delete x.domestic.industryActions,x=>province(x).development.lastTurn=2,x=>province(x).development.lastAllocationTurn=2]){
 const bad=structuredClone(s);corrupt(bad);assert.throws(()=>roundtrip(bad));
 }
 const complete=structuredClone(s);settleIndustry(complete.domestic,2);complete.turn=2;province(complete).development.activation.effectiveTurn=2;assert.throws(()=>roundtrip(complete));
});

test('failed persistence rolls back development cash, project, action cost and command IDs; retry commits once',()=>{
 const current=newGame('保存帝'),candidate=act(current,{kind:'develop',industry:'agriculture',area:500}).state,before=structuredClone(current),draft=structuredClone(candidate);
 const prepare=s=>{spendEnergy(s,true);resolveExhaustion(s);};
 assert.throws(()=>persistCandidate(current,candidate,{setItem(){throw Error('quota');}},prepare),/保存失败/);assert.deepEqual(current,before);assert.deepEqual(candidate,draft);
 const mem=memory(),next=persistCandidate(current,candidate,mem,prepare);assert.equal(home(next).fiscal.treasury,9000);assert.equal(next.stats.energy,199);assert.equal(next.domestic.industryActions.nextId,2);
 const loaded=validateSave(JSON.parse(mem.value));assert.deepEqual(loaded,next);assert.throws(()=>executeIndustry(loaded,{id:1,kind:'develop',provinceId:'hebei',industry:'commerce',area:1}),/已执行/);assert.throws(()=>persistCandidate(next,candidate,mem,prepare));validateFinance(next.domestic);
});

test('failed allocation save does not consume the per-turn quota or mutate jobs, including exhaustion',()=>{
 const current=newGame('调配保存帝');current.stats.energy=1;const p=province(current),t=targets(p);t.farmers-=200;t.merchants+=200;
 const candidate=act(current,{kind:'allocate',targets:t}).state,before=JSON.stringify(current),draft=JSON.stringify(candidate),prepare=s=>{spendEnergy(s,true);resolveExhaustion(s);};
 assert.throws(()=>persistCandidate(current,candidate,{setItem(){throw Error('quota');}},prepare));assert.equal(JSON.stringify(current),before);assert.equal(JSON.stringify(candidate),draft);assert.equal(p.development.lastAllocationTurn,null);
 const next=persistCandidate(current,candidate,memory(),prepare);assert.equal(next.turn,2);assert.equal(province(next).development.lastAllocationTurn,1);assert.equal(province(next).population.professions.merchants,t.merchants);roundtrip(next);
});

test('legacy staffing retains its production basis while converting pastoral to food and industry to silver',()=>{
 const p=province(newGame('公式帝'));delete p.terrainCapacity;
 for(const [key,,job]of INDUSTRIES)for(const people of [0,1,1000,60800])for(const area of [1,12345,p.economy[key].capacityArea])for(const productivity of [0,58,100]){
  p.population.professions[job]=people;p.economy[key].developedArea=area;p.economy[key].productivity=productivity;
  const development=area/p.economy[key].capacityArea,scale={agriculture:.075,pastoral:.012,commerce:.16,industry:.09}[key];
  const raw=Math.round(people*scale*development*productivity/100);assert.equal(outputFor(p,key),key==='pastoral'?raw*2:key==='industry'?Math.round(raw*.8):raw);
 }
});
