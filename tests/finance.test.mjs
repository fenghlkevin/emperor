import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave,resolveExhaustion,SAVE_KEY} from '../src/game.mjs';

import {createDomestic,settleDomestic,countrySummary} from '../src/domestic.mjs';
import {initializeFinance,postTreasury,transferTreasury,validateFinance} from '../src/finance.mjs';
import {financeHistory} from '../src/finance-ui.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executeJustice,settleJustice} from '../src/justice.mjs';
import {executePersonnel,settlePersonnel} from '../src/personnel-actions.mjs';
import {startConstruction} from '../src/construction.mjs';
import {holdRitual} from '../src/disasters.mjs';
import {settleAuspices} from '../src/auspices.mjs';
import {settleDiplomacy,executeDiplomacy} from '../src/diplomacy.mjs';
import {executeKitCommand} from '../src/troop-kit-world.mjs';
import {spendEnergy} from '../src/emperor.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const home=s=>s.domestic.countries.find(c=>c.id==='sheng');
const saved=s=>validateSave(JSON.parse(JSON.stringify(s)));
const storage=()=>({value:null,setItem(key,value){assert.equal(key,SAVE_KEY);this.value=value;}});
const act=(s,c)=>executeRevenue(s,{id:s.domestic.fiscalActions.nextId,...c}).state;
function reconciles(s){validateFinance(s.domestic);for(const c of s.domestic.countries){for(const r of c.ledger.filter(r=>!r.legacy)){assert.equal(r.openingTreasury+r.income-r.expenditure,r.closingTreasury);assert.equal(r.openingDebt+r.debtAdded,r.closingDebt);}if(c.ledger[0]&&!c.ledger[0].legacy)assert.equal(c.ledger[0].closingTreasury,c.fiscal.treasury);}}

test('cash auspices are part of the current period, survive reload and never pay twice',()=>{
 for(const i of [0,1]){
 const s=newGame('账帝');s.turn=2;settleDomestic(s.domestic,2);const before=home(s).fiscal.treasury;
 const values=[0,(i+.1)/12];settleAuspices(s,()=>values.shift());const amount=[1800,1200][i];
 assert.equal(home(s).fiscal.treasury,before+amount);assert.equal(home(s).ledger[0].categories.oneOff.income,amount);reconciles(s);
 const copy=saved(s),snapshot=JSON.stringify(copy);settleAuspices(copy,()=>0);settleDomestic(copy.domestic,2);assert.equal(JSON.stringify(copy),snapshot);
 copy.auspices.history[0].notified=true;assert.equal(home(copy).fiscal.treasury,before+amount);reconciles(copy);
 }
});

test('all existing cash commands and automatic payments share the same ledger',()=>{
 let s=newGame('账帝');
 s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:{infantry:1}}).state;
 s=startConstruction(s,'hebei','markets').state;s=holdRitual(s).state;
 s=executePersonnel(s,{id:1,kind:'honor',officialId:s.domestic.justice.officials[0].id,honor:'rank'}).state;
 s=executePersonnel(s,{id:2,kind:'exam'}).state;
 s=executeJustice(s,{id:1,kind:'funding',amount:100}).state;
 s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'recruit',sourceId:'central',amount:10}).state;
 assert.deepEqual(home(s).ledger[0].entries.map(e=>e.expenditure),[12,500,1200,100,500,100,40]);
 assert.equal(home(s).fiscal.treasury,7548);reconciles(s);
 s.domestic.personnel.delegations=['henan'];s.turn=2;
 settleJustice(s.domestic,2,()=>1); // A row already exists before the regular budget: it must not suppress settlement.
 const cash=home(s).fiscal.treasury,summary=countrySummary(s.domestic);
 settleDomestic(s.domestic,2);assert.equal(home(s).fiscal.treasury,cash+summary.net);
 settlePersonnel(s.domestic,2,()=>.9,s.stats);
 assert.ok(home(s).ledger[0].entries.some(e=>e.reason.includes('委任营建')));
 assert.ok(home(s).ledger[0].entries.some(e=>e.reason==='每旬调查经费'));
 const snapshot=JSON.stringify(s);settleJustice(s.domestic,2);settleDomestic(s.domestic,2);settlePersonnel(s.domestic,2);assert.equal(JSON.stringify(s),snapshot);reconciles(s);saved(s);
});

test('subsidies and levies conserve domestic cash and replayed commands are rejected after reload',()=>{
 let s=newGame('账帝');const total=x=>home(x).fiscal.treasury+x.domestic.provinces.filter(p=>p.countryId==='sheng').reduce((n,p)=>n+p.status.cash,0),before=total(s);
 const command={id:1,kind:'subsidy',amounts:{hebei:300,henan:100}};s=executeRevenue(s,command).state;
 assert.equal(total(s),before);s=saved(s);assert.throws(()=>executeRevenue(s,command),/已执行/);
 s=act(s,{kind:'levy'});assert.equal(total(s),before);assert.ok(home(s).ledger[0].categories.transfer.income>0);reconciles(s);
});

test('regular deficits and unpaid tribute record actual cash separately from debt',()=>{
 const d=createDomestic(10),c=d.countries[0];for(const p of d.provinces.filter(p=>p.countryId==='sheng')){for(const e of Object.values(p.economy))e.productivity=0;p.budget.otherIncome=0;for(const k in p.budget.expenses)p.budget.expenses[k]=0;}
 for(const k in c.fiscal.centralExpenses)c.fiscal.centralExpenses[k]=0;c.fiscal.centralExpenses.other=30;
 c.fiscal.otherIncome=0;const expectedDebt=countrySummary(d).expenditure-10;settleDomestic(d,2);assert.equal(c.fiscal.treasury,0);assert.equal(c.fiscal.debt,expectedDebt);assert.equal(c.ledger[0].expenditure,10);assert.equal(c.ledger[0].debtAdded,expectedDebt);validateFinance(d);
 const before=d.countries.find(c=>c.id==='rome').fiscal.treasury;
 transferTreasury(d,'sheng','rome',100,{turn:2,key:'unpaid-tribute',reason:'贡银',allowDebt:true});
 assert.equal(c.fiscal.debt,expectedDebt+100);assert.equal(d.countries.find(c=>c.id==='rome').fiscal.treasury,before);validateFinance(d);
});

test('trade, annual tribute and war loot are bilateral transactions with matching cash',()=>{
 let s=newGame('账帝');s=executeDiplomacy(s,{kind:'trade',countryId:'rome',exports:100,imports:40}).state;
 s=executeDiplomacy(s,{kind:'tribute',countryId:'rome',amount:300}).state;s.turn=37;
 const sum=()=>s.domestic.countries.reduce((n,c)=>n+c.fiscal.treasury,0),before=sum();settleDiplomacy(s.domestic,37);assert.equal(sum(),before);reconciles(s);
 const snapshot=JSON.stringify(s);settleDiplomacy(s.domestic,37);assert.equal(JSON.stringify(s),snapshot);
 // Exercise the same transfer entry used by kit war settlement without changing combat outcomes.
 transferTreasury(s.domestic,'rome','sheng',123,{turn:37,key:'war:1:loot',reason:'战争战利银'});assert.equal(sum(),before);reconciles(s);
});

test('duplicate transaction IDs remain protected when old detail is rolled into totals',()=>{
 const d=createDomestic();for(let i=0;i<110;i++)postTreasury(d,'sheng',{turn:1,income:1,key:`test:${i}`,reason:'流水验证'});
 const c=d.countries[0],row=c.ledger[0];assert.equal(row.entries.length,100);assert.equal(row.carried.income,10);assert.equal(row.income,110);validateFinance(d);
 const before=JSON.stringify(d);assert.throws(()=>postTreasury(d,'sheng',{turn:1,income:1,key:'test:0',reason:'重复'}),/重复/);assert.equal(JSON.stringify(d),before);
 for(let turn=2;turn<=40;turn++)postTreasury(d,'sheng',{turn,income:1,key:`turn:${turn}`,reason:'新旬'});
 assert.equal(c.ledger.length,36);validateFinance(d);assert.equal(c.ledger.at(-1).openingTreasury,10113);
});

test('legacy accounting preserves actual balances and old records, including a same-turn action',()=>{
 const old=newGame('旧账');delete old.saveRevision;for(const c of old.domestic.countries)delete c.fiscal.accounting;
 old.turn=5;home(old).fiscal.treasury=1800;home(old).fiscal.debt=77;
 home(old).ledger=[{turn:5,income:50,expenditure:10,net:40,closingTreasury:1000,closingDebt:0}];
 let migrated=saved(old);assert.equal(home(migrated).fiscal.treasury,1800);assert.equal(home(migrated).ledger[0].legacy,true);
 assert.deepEqual(saved(migrated),migrated);
 migrated=act(migrated,{kind:'subsidy',amounts:{hebei:300}});const row=home(migrated).ledger[0];
 assert.equal(row.openingTreasury,1800);assert.equal(row.closingTreasury,1500);assert.equal(row.openingDebt,77);assert.equal(row.legacyBaseline.closingTreasury,1000);
 reconciles(migrated);assert.deepEqual(saved(migrated),migrated);
});

test('corrupt totals, balances, entries, IDs and accounting versions are rejected',()=>{
 const s=executeKitCommand(newGame('账帝'),{id:1,kind:'purchase',sourceId:'central',quantities:{infantry:1}}).state;
 for(const change of [x=>home(x).fiscal.treasury++,x=>home(x).ledger[0].income++,x=>home(x).ledger[0].entries[0].treasuryAfter++,x=>home(x).ledger[0].entries[0].id=999,x=>home(x).fiscal.accounting.version=99,x=>home(x).ledger[0].keys.push(home(x).ledger[0].keys[0])]){const bad=structuredClone(s);change(bad);assert.throws(()=>saved(bad));}
 const malformed=structuredClone(s);malformed.saveRevision=-1;assert.throws(()=>saved(malformed));
});

test('failed persistence leaves live state, candidate, energy, commands and storage unchanged; retry commits once',()=>{
 const initial=newGame('账帝'),mem=storage();mem.value=JSON.stringify(initial);
 const candidate=act(initial,{kind:'subsidy',amounts:{hebei:300}}),before=structuredClone(initial),draft=structuredClone(candidate),previous=mem.value;
 const broken={setItem(){throw Error('QuotaExceededError');}},prepare=s=>{spendEnergy(s,true);resolveExhaustion(s);};
 assert.throws(()=>persistCandidate(initial,candidate,broken,prepare),/保存失败/);
 assert.deepEqual(initial,before);assert.deepEqual(candidate,draft);assert.equal(mem.value,previous);
 const stale=structuredClone(candidate),next=persistCandidate(initial,candidate,mem,prepare);
 assert.equal(home(next).fiscal.treasury,9700);assert.equal(next.stats.energy,initial.stats.energy-1);assert.equal(next.saveRevision,1);
 assert.throws(()=>persistCandidate(next,candidate,mem,prepare),/已更新|已执行/);
 assert.throws(()=>persistCandidate(next,stale,mem,prepare),/已更新/);
 const restored=validateSave(JSON.parse(mem.value));assert.deepEqual(restored,next);assert.throws(()=>executeRevenue(restored,{id:1,kind:'subsidy',amounts:{hebei:300}}));
});

test('failed save during exhaustion does not publish a new turn or its random rewards',async()=>{
 const initial=newGame('账帝');initial.stats.energy=1;initial.createdAt='2026-10-16T00:00:00.002Z';
 const candidate=executeKitCommand(initial,{id:1,kind:'purchase',sourceId:'central',quantities:{infantry:1}}).state,before=JSON.stringify(initial),draft=JSON.stringify(candidate);
 const prepare=s=>{spendEnergy(s,true);resolveExhaustion(s);};
 assert.throws(()=>persistCandidate(initial,candidate,{setItem(){throw Error('full');}},prepare),/保存失败/);
 await Promise.resolve();assert.equal(JSON.stringify(initial),before);assert.equal(JSON.stringify(candidate),draft);
 const mem=storage(),next=persistCandidate(initial,candidate,mem,prepare);assert.equal(next.turn,2);assert.equal(next.stats.energy,200);assert.equal(home(next).ledger[0].closingTreasury,home(next).fiscal.treasury);reconciles(next);
});

test('failed save after advancing a period retains the old turn and supports a clean retry',()=>{
 const initial=newGame('账帝');initial.phase=5;
 const candidate=structuredClone(initial);advance(candidate);
 const before=JSON.stringify(initial);assert.throws(()=>persistCandidate(initial,candidate,{setItem(){throw Error('full');}}),/保存失败/);assert.equal(JSON.stringify(initial),before);
 const mem=storage(),next=persistCandidate(initial,candidate,mem);assert.equal(next.turn,2);assert.deepEqual(saved(next),next);reconciles(next);
});

test('report separates forecasts, actual money, debt and legacy totals and escapes event text',()=>{
 const s=newGame('账帝');postTreasury(s.domestic,'sheng',{turn:1,income:1800,key:'event',reason:'<祥瑞>'});
 const html=financeHistory(home(s),1);assert.match(html,/本旬实时/);assert.match(html,/10,000 \+ 1,800/);assert.match(html,/&lt;祥瑞&gt;/);assert.doesNotMatch(html,/<祥瑞>/);
});
