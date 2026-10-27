import {legacyResources} from './helpers/national.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {settleDomestic} from '../src/domestic.mjs';
import {quoteProvinceResources,settleProvinceResources,validateResourceSettlement} from '../src/province-resources.mjs';
const city=s=>s.domestic.provinces.find(p=>p.id==='hebei');
function fixture(){const s=newGame('资源');legacyResources(s.domestic);s.domestic.disasters.lastTurn=100;
 const p=city(s);p.population.total=10000;
 Object.assign(p.population.professions,{farmers:3000,herders:0,merchants:500,workers:500,soldiers:200,militia:100});
 p.economy.agriculture={capacityArea:2000,developedArea:1000,productivity:100};
 p.welfare.grainReserve=1000;p.welfare.security=80;return s;
}
test('civilian production, subsistence, grain tax and official rations have separate accounts',()=>{
 const s=fixture(),p=city(s),before=JSON.stringify(s),q=quoteProvinceResources(p,{turn:1});
 assert.equal(q.production.cultivated,600);assert.equal(q.production.produced,119);
 assert.equal(q.civilian.need,48);assert.equal(q.grain.officialNeed,2);
 assert.equal(q.grain.tax,14);assert.equal(q.grain.closing,1012);
 assert.equal(q.civilian.available,105);assert.equal(q.civilian.surplus,57);
 assert.equal(JSON.stringify(s),before);
});
test('people or farmland can cap output, and incomplete acreage cannot produce',()=>{
 const p=city(fixture());const base=quoteProvinceResources(p,{turn:1});
 p.economy.agriculture.developedArea=1800;assert.equal(quoteProvinceResources(p,{turn:1}).production.produced,base.production.produced);
 p.population.professions.farmers=9000;assert.equal(quoteProvinceResources(p,{turn:1}).production.cultivated,1800);
 p.development.activation={industry:'agriculture',area:1000,effectiveTurn:3};
 assert.equal(quoteProvinceResources(p,{turn:2}).production.cultivated,800);
});
test('famine does not levy grain that must immediately be returned as relief',()=>{
 const s=fixture(),p=city(s);p.population.professions.farmers=100;
 const q=quoteProvinceResources(p,{turn:1});assert.equal(q.grain.tax,0);
 assert.ok(q.civilian.shortfall>0);assert.equal(q.grain.need,q.grain.officialNeed+q.civilian.shortfall);
 const r=settleProvinceResources(s,p.id);assert.equal(city(r.state).welfare.grainReserve,q.grain.closing);
 assert.equal(r.receipt.grain.shortfall,0);assert.equal(city(s).welfare.grainReserve,1000);
});
test('settlement posts only tax into public grain, balances cash, reloads and prevents replay',()=>{
 const s=fixture(),before=JSON.stringify(s),r=settleProvinceResources(s,'hebei',{cashExpense:50}),p=city(r.state);
 assert.equal(JSON.stringify(s),before);
 assert.equal(r.state.domestic.provinces.find(p=>p.id==='hebei').grainAccounting.periods[0].income,r.receipt.grain.tax);
 assert.equal(r.state.stats.treasury,10000+r.receipt.cash.net);
 assert.deepEqual(city(validateSave(JSON.parse(JSON.stringify(r.state)))).resourceSettlement,r.receipt);
 assert.throws(()=>settleProvinceResources(r.state,'hebei'),/已结算/);
 assert.throws(()=>settleDomestic(r.state.domestic,1),/混用/);
});
test('silver tax does not levy agriculture again, and failure cannot publish partial transactions',()=>{
 const s=fixture(),p=city(s),base=quoteProvinceResources(p,{turn:1}).cash.tax;
 p.population.professions.farmers=0;assert.equal(quoteProvinceResources(p,{turn:1}).cash.tax,base);
 const before=JSON.stringify(s);assert.throws(()=>settleProvinceResources(s,'hebei',{cashExpense:1e9}),/国库不足/);
 assert.equal(JSON.stringify(s),before);
 assert.throws(()=>quoteProvinceResources(p,{turn:1,grainTaxRate:Infinity}));
});
test('historical resource snapshots reject forged tax and supply arithmetic',()=>{
 const s=settleProvinceResources(fixture(),'hebei').state,p=city(s);validateResourceSettlement(p,1);
 p.resourceSettlement.grain.tax++;assert.throws(()=>validateResourceSettlement(p,1),/无效/);
});
