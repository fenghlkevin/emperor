import {kitOrder,settledVictory,settledRetreat} from './helpers/kit-war-fixture.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave,resolveExhaustion} from '../src/game.mjs';

import {settlePersonnel,executePersonnel} from '../src/personnel-actions.mjs';
import {governorProfile,settleGovernance} from '../src/governance.mjs';
import {foodForecast} from '../src/food-relief.mjs';
import {postTreasury} from '../src/finance.mjs';
import {borderingCountries,generals,quoteWar} from '../src/war.mjs';
import {settleOccupation} from '../src/occupation.mjs';
import {executeDiplomacy,settleDiplomacy,relationBetween} from '../src/diplomacy.mjs';
import {settleJustice} from '../src/justice.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const home=s=>s.domestic.countries[0],province=s=>s.domestic.provinces[0];
const reload=s=>validateSave(JSON.parse(JSON.stringify(s)));
function peaceful(s){for(const p of s.domestic.provinces)for(const k of ['stability','loyalty','security'])p.welfare[k]=80;for(const o of s.domestic.justice.officials)o.loyalty=100;return s;}
test('P0 emergency priority, shared budget, reserve, disaster relief and settlement replay',()=>{
 const s=peaceful(newGame('治理')),d=s.domestic,p=province(s),q=d.provinces[1];
 for(const c of [p,q]){c.welfare.grainReserve=0;c.economy.agriculture.productivity=0;}
 p.disaster={kind:'fire',startTurn:1,endTurn:3};d.personnel.delegations=[q.id,p.id];d.governance.budget=1000;d.governance.reserve=9500;s.turn=2;
 settlePersonnel(d,2);assert.ok(d.governance.spent<=500);assert.ok(home(s).fiscal.treasury>=9500);assert.ok(d.foodRelief.history.length);assert.equal(d.foodRelief.history[0].targetId,q.id);assert.equal(p.construction.project,null);
 const before=JSON.stringify(s);settlePersonnel(d,2);settleGovernance(d,2);assert.equal(JSON.stringify(s),before);reload(s);
});
test('P0 no money never incurs debt or starts partial work, failed persistence leaves original unchanged',()=>{
 const s=newGame('节流');s.domestic.personnel.delegations=['hebei'];s.domestic.governance.reserve=1000000;const next=structuredClone(s);advance(next);assert.equal(next.domestic.governance.spent,0);assert.ok(next.domestic.governance.records.some(r=>r.reason.includes('暂缓')));
 const snapshot=JSON.stringify(s);assert.throws(()=>persistCandidate(s,next,{setItem(){throw Error('quota');}}),/保存失败/);assert.equal(JSON.stringify(s),snapshot);reload(s);
});
test('P1 serving governor ability and integrity affect training and audited spending; vacant office fallback',()=>{
 const base=peaceful(newGame('选官'));base.domestic.personnel.delegations=['hebei'];const p=province(base),o=base.domestic.justice.officials.find(o=>o.id==='hebei-governor');assert.ok(o);p.military.training=30;p.construction.project={building:'markets',progress:0,startedTurn:1};
 // Disable construction while preserving the same healthy conditions.
 const strong=structuredClone(base),weak=structuredClone(base);for(const [s,n]of [[strong,100],[weak,0]]){const g=s.domestic.justice.officials.find(o=>o.id===oId(base));Object.assign(g,{politics:n,intelligence:n,experience:n,integrity:n});s.turn=2;settlePersonnel(s.domestic,2);}
 assert.ok(province(strong).military.training>province(weak).military.training);assert.ok(strong.domestic.governance.spent<weak.domestic.governance.spent);assert.ok(home(weak).ledger[0].entries.some(e=>e.reason.includes('治理损耗')));reload(strong);reload(weak);
 o.status='imprisoned';assert.equal(governorProfile(base.domestic,p).id,null);
 function oId(){return 'hebei-governor';}
});
test('P1 victory transfers ownership, stops eliminated fiscal government, opens offices and restores order with governor and garrison',()=>{
 const s=peaceful(newGame('开疆')),targetId=borderingCountries(s.domestic)[0].id,c=kitOrder(s,targetId),n=settledVictory(s,targetId).state;
 const p=n.domestic.provinces.find(p=>p.occupation);assert.equal(p.countryId,'sheng');assert.equal(n.domestic.countries.find(c=>c.id===targetId).provinceIds.length,0);assert.equal(countrySummary(n.domestic,targetId).net,0);assert.equal(countrySummary(n.domestic,targetId).welfare.stability,0);reload(n);assert.equal(s.domestic.provinces.find(p=>p.id===pId(n)).countryId,targetId);
 const person=n.domestic.justice.officials.find(o=>o.id==='hebei-governor');let a=executePersonnel(n,{id:n.domestic.personnel.nextId,kind:'assign',officeId:p.id+'-governor',officialId:person.id}).state;const city=a.domestic.provinces.find(x=>x.id===p.id);for(let t=2;t<=20;t++)settleOccupation(a.domestic,t);assert.equal(city.occupation.settled,true);a.turn=20;reload(a);
 function pId(s){return s.domestic.provinces.find(p=>p.occupation).id;}
});
test('P1 defeat does not transfer territory; active treaties prohibit attack until cancelled',()=>{
 let s=newGame('守约');const id=borderingCountries(s.domestic)[0].id,r=relationBetween(s.domestic,'sheng',id);r.friendship=90;s=executeDiplomacy(s,{kind:'treaty',treaty:'nonaggression',countryId:id}).state;
 const c=kitOrder(s,id);assert.throws(()=>quoteWar(s,c),/条约/);s=executeDiplomacy(s,{kind:'cancel',countryId:id}).state;assert.ok(quoteWar(s,c));const n=settledRetreat(s,id).state;assert.ok(!n.domestic.provinces.some(p=>p.occupation));reload(n);
});
test('P1 negotiations reject unreasonable demand without replacing agreement; cash-only nonperformance is recorded once',()=>{
 let s=newGame('邦交');const before=JSON.stringify(s),refused=executeDiplomacy(s,{kind:'demand',countryId:'rome',amount:1000000});assert.equal(refused.accepted,false);assert.equal(JSON.stringify(refused.state),before);
 relationBetween(s.domestic,'sheng','rome').friendship=100;s=executeDiplomacy(s,{kind:'trade',countryId:'rome',exports:100,imports:0}).state;const foreign=s.domestic.countries.find(c=>c.id==='rome');postTreasury(s.domestic,'rome',{turn:1,expense:foreign.fiscal.treasury,reason:'测试现金不足',key:'test:drain'});settleDiplomacy(s.domestic,2);s.turn=2;const r=relationBetween(s.domestic,'sheng','rome');assert.equal(r.agreement.lastPerformance.exportsPaid,0);assert.equal(r.friendship,95);assert.equal(foreign.fiscal.debt,0);const snapshot=JSON.stringify(s);settleDiplomacy(s.domestic,2);assert.equal(JSON.stringify(s),snapshot);reload(s);
});
test('P1 life exhaustion and normal end archive a stable result with save rollback and reload',()=>{
 const s=newGame('终评');s.stats.life=1;advance(s);assert.equal(s.reignResult.turn,s.turn);assert.equal(s.reignResult.reason,'寿元已尽');const result=JSON.stringify(s.reignResult);assert.throws(()=>advance(s),/终结/);assert.equal(JSON.stringify(reload(s).reignResult),result);
 const q=newGame('晕厥');q.stats.life=3;q.stats.energy=0;resolveExhaustion(q);assert.ok(q.reignResult);reload(q);const old=structuredClone(s);delete old.reignResult;assert.ok(reload(old).reignResult);
});
test('P0 36/72/108-turn economics preserve valid saves, finite balances and budget caps under several policies',()=>{
 for(const delegated of [false,true])for(const seed of [1,7,41]){let s=peaceful(newGame('长治'));s.domestic.disasters.seed=seed;if(delegated)s.domestic.personnel.delegations=s.domestic.provinces.filter(p=>p.countryId==='sheng').map(p=>p.id);
 for(let t=1;t<=108;t++){advance(s);assert.ok(s.domestic.governance.spent<=s.domestic.governance.budget);assert.ok(Number.isSafeInteger(home(s).fiscal.treasury));assert.ok(home(s).fiscal.treasury>=0);if(t%36===0)s=reload(s);}
 }
});

test('governance policy can be revised after settlement without changing the settled budget or charging again',()=>{let s=peaceful(newGame('改策'));s.domestic.personnel.delegations=['hebei'];advance(s);const before=s.domestic.governance.spent;s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'governanceBudget',budget:0,reserve:3000}).state;assert.equal(s.domestic.governance.spent,before);assert.equal(s.domestic.governance.turnBudget,2000);reload(s);advance(s);assert.equal(s.domestic.governance.spent,0);assert.equal(s.domestic.governance.turnBudget,0);reload(s);});

test('legacy governance migration preserves treasury and malformed new domain records are rejected',()=>{
 const s=newGame('旧档');delete s.domestic.governance;const n=reload(s);assert.equal(n.domestic.governance.reserve,2000);assert.equal(n.stats.treasury,10000);
 for(const mutate of [s=>s.domestic.governance.budget=-1,s=>s.domestic.governance.spent=2001,s=>province(s).occupation={version:1,turn:999,previousOwner:'tubo',lastTurn:999,settled:false},s=>{s.stats.life=0;s.reignResult={version:1};}]){const q=structuredClone(n);mutate(q);assert.throws(()=>reload(q));}
});

test('P1 rebel province can be reconquered with the same ownership and occupation rules',()=>{
 const s=newGame('平叛'),d=s.domestic,o=d.justice.officials.find(o=>o.id==='hebei-governor');o.loyalty=1;o.plotTurn=1;settleJustice(d,2,()=>1);s.turn=2;assert.equal(province(s).countryId,'rebel-hebei');
 const n=settledVictory(s,'rebel-hebei').state;
 assert.equal(province(n).countryId,'sheng');assert.equal(province(n).occupation.previousOwner,'rebel-hebei');assert.equal(n.domestic.countries.find(c=>c.id==='rebel-hebei').provinceIds.length,0);reload(n);
});
