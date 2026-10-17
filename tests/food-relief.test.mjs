import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave,resolveExhaustion,SAVE_KEY} from '../src/game.mjs';
import {foodForecast,quoteRelief,executeRelief} from '../src/food-relief.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {settleDomestic} from '../src/domestic.mjs';
import {executeIndustry} from '../src/industry.mjs';
import {startConstruction} from '../src/construction.mjs';
import {welfareValue} from '../src/building-effects.mjs';
import {validateFinance} from '../src/finance.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {spendEnergy} from '../src/emperor.mjs';
const p=s=>s.domestic.provinces[0],home=s=>s.domestic.countries[0];
const act=(s,c)=>executeRelief(s,{id:s.domestic.foodRelief.nextId,kind:'purchase',targetId:'hebei',...c});
const save=s=>validateSave(JSON.parse(JSON.stringify(s)));
function fixture(){const s=newGame('赈济帝'),a=p(s);a.population.total=100000;for(const k in a.population.professions)a.population.professions[k]=0;a.population.professions.farmers=5000;a.economy.agriculture={productivity:80,developedArea:20000,capacityArea:30000}; // 5000*.075*(2/3)*.8 = 200
 a.welfare.grainReserve=100;for(const key in a.buildings)a.buildings[key]=0;s.domestic.disasters.lastTurn=100;s.createdAt='2026-10-16T00:00:00.000Z';return s;}
const totalGrain=s=>s.domestic.provinces.reduce((n,p)=>n+p.welfare.grainReserve,0);

test('G01 purchase fills the next supply gap and records cash, grain, consumption and no famine penalty',()=>{
 const initial=fixture(),f=foodForecast(p(initial),1);assert.equal(f.need,500);assert.equal(f.produced,200);assert.equal(f.shortfall,200);assert.equal(f.stockTurns,.2);
 const before=structuredClone(initial),result=act(initial,{amount:200}),s=result.state;assert.deepEqual(initial,before);assert.equal(home(s).fiscal.treasury,9600);assert.equal(p(s).welfare.grainReserve,300);assert.equal(foodForecast(p(s),1).shortfall,0);
 const loyalty=welfareValue(p(s),'loyalty');advance(s);assert.equal(p(s).welfare.grainReserve,0);assert.equal(welfareValue(p(s),'loyalty'),loyalty);assert.deepEqual(p(s).foodRelief.lastSettlement,{turn:2,opening:300,produced:200,need:500,consumed:500,shortfall:0,closing:0});validateFinance(s.domestic);save(s);
});

test('G02 cumulative quota locks on first success, survives reload and population changes, and resets next turn',()=>{
 let s=fixture();s=act(s,{amount:1000}).state;s=save(s);assert.equal(foodForecast(p(s),1).purchaseRemaining,500);assert.throws(()=>act(s,{amount:501}),/额度/);
 s=executeRevenue(s,{id:1,kind:'census'}).state;assert.equal(p(s).population.total,101000);assert.equal(foodForecast(p(s),1).purchaseLimit,1500);s=act(s,{amount:500}).state;assert.equal(foodForecast(p(s),1).purchaseRemaining,0);
 assert.throws(()=>act(s,{amount:1}),/额度/);advance(s);assert.equal(p(s).foodRelief.purchase,null);assert.equal(foodForecast(p(s),2).purchaseLimit,1515);save(s);
});

test('G03 transfer retains next net ration, conserves all grain and silver, and revalidates source funds',()=>{
 const s=fixture();p(s).welfare.grainReserve=1000;const before=totalGrain(s),q=quoteRelief(s,{kind:'transfer',sourceId:'hebei',targetId:'henan',amount:700});
 assert.equal(q.sourceForecast.retain,300);assert.equal(q.sourceForecast.transferable,700);assert.equal(q.sourceAfter,300);assert.equal(q.cost,0);
 assert.throws(()=>act(s,{kind:'transfer',sourceId:'hebei',targetId:'henan',amount:701}),/留足/);
 const n=act(s,{kind:'transfer',sourceId:'hebei',targetId:'henan',amount:700}).state;assert.equal(totalGrain(n),before);assert.equal(home(n).fiscal.treasury,10000);assert.equal(p(n).welfare.grainReserve,300);assert.equal(n.domestic.countries[0].ledger[0].entries[0].category,'transfer');
 assert.throws(()=>act(n,{kind:'transfer',sourceId:'hebei',targetId:'henan',amount:1}));save(n);validateFinance(n.domestic);
});

test('G04 cash subsidies remain cash only, grain purchases do not directly recover welfare or end disasters',()=>{
 const s=fixture(),g=p(s).welfare.grainReserve,c=p(s).status.cash,welfare=structuredClone(p(s).welfare);
 let n=executeRevenue(s,{id:1,kind:'subsidy',amounts:{hebei:500}}).state;assert.equal(p(n).welfare.grainReserve,g);assert.equal(p(n).status.cash,c+500);
 n=act(n,{amount:250}).state;assert.equal(home(n).fiscal.treasury,9000);assert.equal(p(n).welfare.grainReserve,g+250);assert.equal(p(n).status.cash,c+500);
 for(const key of ['stability','loyalty','security','fitness'])assert.equal(p(n).welfare[key],welfare[key]);
});

test('G05 disaster areas can buy or transfer grain, while development and new construction stay blocked',()=>{
 const s=fixture();p(s).disaster={kind:'fire',startTurn:1,endTurn:3};p(s).welfare.grainReserve=1000;
 const n=act(s,{amount:200}).state;assert.deepEqual(p(n).disaster,p(s).disaster);
 const m=act(n,{kind:'transfer',sourceId:'hebei',targetId:'henan',amount:100}).state;assert.equal(totalGrain(m),totalGrain(n));
 assert.throws(()=>startConstruction(n,'hebei','temples'),/受灾/);assert.throws(()=>executeIndustry(n,{id:1,kind:'develop',provinceId:'hebei',industry:'agriculture',area:1}),/受灾/);
});

test('invalid amounts, foreign or same-state transfers, insufficient cash and no source grain are atomic',()=>{
 const s=fixture(),before=structuredClone(s);
 for(const c of [{amount:0},{amount:-1},{amount:1.2},{amount:NaN},{amount:Infinity},{amount:1000000000001},{amount:1,targetId:'rome-core'},{amount:1,kind:'unknown'},{amount:1,kind:'transfer',sourceId:'hebei'},{amount:1,kind:'transfer',sourceId:'rome-core',targetId:'henan'},{amount:1,kind:'transfer',sourceId:'hebei',targetId:'henan'},{id:2,amount:1}])assert.throws(()=>act(s,c));
 assert.deepEqual(s,before);home(s).fiscal.treasury=1;const poor=structuredClone(s);assert.throws(()=>act(s,{amount:1}),/国库不足/);assert.deepEqual(s,poor);
});

test('quotes are pure and distinguish inventory coverage, net deficit, zero demand and first-success quota',()=>{
 const s=fixture(),before=structuredClone(s);quoteRelief(s,{kind:'purchase',targetId:'hebei',amount:200});assert.deepEqual(s,before);assert.equal(p(s).foodRelief.purchase,null);
 p(s).population.total=1;for(const k in p(s).population.professions)p(s).population.professions[k]=0;p(s).welfare.grainReserve=0;
 const f=foodForecast(p(s),1);assert.equal(f.need,0);assert.equal(f.stockTurns,null);assert.equal(f.shortfall,0);assert.equal(f.purchaseLimit,0);assert.throws(()=>act(s,{amount:1}),/额度/);
});

test('forecasts include completed acreage only at its effective turn, and transfers do not use unfinished capacity',()=>{
 let s=fixture();p(s).economy.agriculture.developedArea=19500;
 const before=foodForecast(p(s),1).produced;s=executeIndustry(s,{id:1,kind:'develop',provinceId:'hebei',industry:'agriculture',area:500}).state;
 assert.equal(foodForecast(p(s),1).produced,before);advance(s);assert.equal(foodForecast(p(s),2).produced,200);
});

test('G07 repeat submission and repeat settlement stay inert after reload; later famine resumes penalties',()=>{
 let s=act(fixture(),{amount:200}).state;s=save(s);assert.throws(()=>executeRelief(s,{id:1,kind:'purchase',targetId:'hebei',amount:200}),/已执行/);
 advance(s);const first=JSON.stringify(s);settleDomestic(s.domestic,2);assert.equal(JSON.stringify(s),first);const loyalty=welfareValue(p(s),'loyalty');advance(s);assert.equal(welfareValue(p(s),'loyalty'),loyalty-1);assert.equal(p(s).foodRelief.lastSettlement.shortfall,300);
});

test('save failure rolls back funds, inventory, action cost, quota and command ID, then retries once',()=>{
 const current=fixture(),candidate=act(current,{amount:200}).state,before=JSON.stringify(current),draft=JSON.stringify(candidate),prepare=s=>{spendEnergy(s,true);resolveExhaustion(s);};
 assert.throws(()=>persistCandidate(current,candidate,{setItem(){throw Error('quota');}},prepare),/保存失败/);assert.equal(JSON.stringify(current),before);assert.equal(JSON.stringify(candidate),draft);assert.equal(p(current).foodRelief.purchase,null);
 const mem={setItem(key,value){assert.equal(key,SAVE_KEY);this.value=value;}},next=persistCandidate(current,candidate,mem,prepare);assert.equal(next.stats.energy,199);assert.equal(home(next).fiscal.treasury,9600);assert.equal(p(next).foodRelief.purchase.bought,200);assert.deepEqual(validateSave(JSON.parse(mem.value)),next);assert.throws(()=>persistCandidate(next,candidate,mem,prepare));
});

test('failed transfer save leaves both stores untouched, including exhaustion-triggered settlement',()=>{
 const current=fixture();current.stats.energy=1;p(current).welfare.grainReserve=1000;
 const candidate=act(current,{kind:'transfer',sourceId:'hebei',targetId:'henan',amount:700}).state,before=JSON.stringify(current),draft=JSON.stringify(candidate),prepare=s=>{spendEnergy(s,true);resolveExhaustion(s);};
 assert.throws(()=>persistCandidate(current,candidate,{setItem(){throw Error('quota');}},prepare));assert.equal(JSON.stringify(current),before);assert.equal(JSON.stringify(candidate),draft);
 const next=persistCandidate(current,candidate,{setItem(){}},prepare);assert.equal(next.turn,2);assert.equal(p(next).foodRelief.lastSettlement.shortfall,0);assert.equal(next.domestic.foodRelief.history.length,1);validateFinance(next.domestic);
});

test('legacy migration preserves resources and existing progress without replaying relief or food consumption',()=>{
 const old=fixture();old.turn=20;delete old.domestic.foodRelief;for(const p of old.domestic.provinces)delete p.foodRelief;
 const before=structuredClone(old),loaded=save(old);assert.deepEqual(p(loaded).welfare,p(before).welfare);assert.deepEqual(p(loaded).population,p(before).population);assert.equal(home(loaded).fiscal.treasury,home(before).fiscal.treasury);assert.equal(loaded.domestic.foodRelief.nextId,1);assert.equal(p(loaded).foodRelief.lastSettlement,null);assert.deepEqual(save(loaded),loaded);
});

test('quota, supply math, history and partial new-format corruption are rejected',()=>{
 const s=act(fixture(),{amount:200}).state;
 for(const change of [x=>x.domestic.foodRelief.version=2,x=>x.domestic.foodRelief.nextId=1,x=>p(x).foodRelief.purchase.bought=1501,x=>p(x).foodRelief.purchase.limit=1501,x=>p(x).foodRelief.purchase.turn=2,x=>delete p(x).foodRelief,x=>delete x.domestic.foodRelief,x=>x.domestic.foodRelief.history[0].targetAfter++,x=>x.domestic.foodRelief.history[0].cost=1]){const bad=structuredClone(s);change(bad);assert.throws(()=>save(bad));}
 const n=structuredClone(s);advance(n);p(n).foodRelief.lastSettlement.consumed++;assert.throws(()=>save(n));
});

test('loss of ownership invalidates a prepared transfer; historic records remain compatible',()=>{
 let s=fixture();p(s).welfare.grainReserve=1000;const command={kind:'transfer',sourceId:'hebei',targetId:'henan',amount:100};quoteRelief(s,command);
 s=act(s,command).state;const target=s.domestic.provinces[1],foreign=s.domestic.countries.find(c=>c.id==='tubo');home(s).provinceIds=home(s).provinceIds.filter(id=>id!==target.id);target.countryId=foreign.id;foreign.provinceIds.push(target.id);
 const before=JSON.stringify(s);assert.throws(()=>act(s,command),/本国/);assert.equal(JSON.stringify(s),before);save(s);
});

test('manual relief may spend below the delegation reserve, but cannot overflow target grain',()=>{
 const s=fixture();home(s).fiscal.treasury=500;s.stats.treasury=500;
 const n=act(s,{amount:200}).state;assert.equal(home(n).fiscal.treasury,100);save(n);
 const full=fixture();p(full).welfare.grainReserve=1_000_000_000_000;const before=JSON.stringify(full);assert.throws(()=>act(full,{amount:1}),/库存/);assert.equal(JSON.stringify(full),before);
});
