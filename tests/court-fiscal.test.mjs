import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {courtFiscalCommand,courtFiscalPlan} from '../src/court-fiscal.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {persistCandidate} from '../src/persistence.mjs';

test('map tax draft changes several selected provinces, preserves others, and does not publish a preview',()=>{
 const s=newGame('赋税'),before=JSON.stringify(s),edits={hebei:14,henan:13},q=courtFiscalPlan(s,'tax',edits);
 assert.equal(JSON.stringify(s),before);assert.equal(q.command.rates.hebei,14);assert.equal(q.command.rates.henan,13);assert.equal(q.command.rates.guannei,12);
 const n=executeRevenue(s,q.command).state;assert.equal(q.after.net,countrySummary(n.domestic,undefined,n.turn).net);assert.equal(n.stats.treasury,s.stats.treasury);assert.equal(n.domestic.provinces.find(p=>p.id==='hebei').budget.taxRate,.14);
 const current=q.before.net;assert.ok(q.after.net>current);assert.deepEqual(validateSave(n),n);
 s.domestic.disasters.lastTurn=2;n.domestic.disasters.lastTurn=2;advance(s);advance(n);assert.equal(n.stats.treasury-s.stats.treasury,q.after.net-current);
});
test('map multi-state subsidies preserve cash, are not grain or welfare, and reject unaffordable plans',()=>{
 const s=newGame('拨银'),before=structuredClone(s),q=courtFiscalPlan(s,'subsidy',{hebei:200,henan:300});
 assert.equal(q.cost,500);assert.equal(q.treasuryAfter,9500);assert.deepEqual(s,before);
 const n=executeRevenue(s,q.command).state;assert.equal(n.stats.treasury,9500);
 for(const [id,amount]of Object.entries({hebei:200,henan:300})){const old=s.domestic.provinces.find(p=>p.id===id),p=n.domestic.provinces.find(p=>p.id===id);assert.equal(p.status.cash,old.status.cash+amount);assert.deepEqual(p.welfare,old.welfare);}
 const huge=courtFiscalPlan(s,'subsidy',{hebei:10001});assert.equal(huge.canAfford,false);assert.equal(huge.after,null);assert.throws(()=>executeRevenue(s,huge.command),/国库不足/);
});
test('map census forecasts the same productive registration and budget as its real command',()=>{
 const s=newGame('户籍'),before=JSON.stringify(s),q=courtFiscalPlan(s,'census');assert.equal(JSON.stringify(s),before);assert.equal(q.cost,5000);
 const n=executeRevenue(s,q.command).state;assert.equal(q.after.net,countrySummary(n.domestic,undefined,n.turn).net);assert.equal(countrySummary(n.domestic).total-countrySummary(s.domestic).total,q.addedPopulation);
 for(const p of countrySummary(n.domestic).provinces){const old=s.domestic.provinces.find(x=>x.id===p.id);assert.equal(p.population.professions.soldiers,old.population.professions.soldiers);assert.equal(p.population.professions.militia,old.population.professions.militia);}
});
test('map special levy uses existing cash and exact welfare losses without changing tax rates',()=>{
 const s=newGame('加征'),q=courtFiscalPlan(s,'levy'),n=executeRevenue(s,q.command).state;assert.match(q.warning,/民忠−5/);assert.match(courtFiscalPlan(s,'tax',{hebei:26}).warning,/高于25%/);assert.ok(q.income>0);assert.equal(n.stats.treasury-s.stats.treasury,q.income);
 for(const r of q.changes){const p=n.domestic.provinces.find(p=>p.id===r.provinceId),old=s.domestic.provinces.find(p=>p.id===r.provinceId);assert.equal(old.status.cash-p.status.cash,r.amount);assert.equal(p.welfare.loyalty,old.welfare.loyalty-5);assert.equal(p.welfare.stability,old.welfare.stability-3);assert.equal(p.budget.taxRate,old.budget.taxRate);}
});
test('map fiscal drafts reject foreign states, unchanged and invalid values; failed persistence leaves all originals intact',()=>{
 const s=newGame('校验'),before=JSON.stringify(s);
 for(const [kind,edits]of [['tax',{foreign:15}],['tax',{hebei:12}],['tax',{hebei:51}],['tax',{hebei:NaN}],['tax',{hebei:12.5}],['subsidy',{}],['subsidy',{hebei:-1}],['subsidy',{foreign:20}]])assert.throws(()=>courtFiscalPlan(s,kind,edits));
 assert.throws(()=>courtFiscalCommand(s,'purchase'));assert.equal(JSON.stringify(s),before);
 const q=courtFiscalPlan(s,'tax',{hebei:14}),n=executeRevenue(s,q.command).state;assert.throws(()=>persistCandidate(s,n,{setItem(){throw Error('quota');}}),/保存失败/);assert.equal(JSON.stringify(s),before);
 assert.throws(()=>executeRevenue(n,q.command),/政令已执行/);
});
