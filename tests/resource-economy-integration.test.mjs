import {national,famine} from './helpers/national.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame as baseNewGame,advance,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy,quoteProvinceResources} from '../src/province-resources.mjs';
import {settleDomestic,countrySummary} from '../src/domestic.mjs';
import {foodForecast,executeRelief} from '../src/food-relief.mjs';
import {turnEconomyReport} from '../src/turn-economy-report.mjs';
function game(){const s=newGame('新资源');initializeResourceEconomy(s.domestic);s.domestic.disasters.lastTurn=10000;return s;}
test('new resource model integrates forecast, silver budget and actual national settlement',()=>{
 const s=game(),d=s.domestic,budget=countrySummary(d,undefined,2),cash=d.countries[0].fiscal.treasury;
 const quotes=d.provinces.filter(p=>p.countryId==='sheng').map(p=>quoteProvinceResources(p,{turn:2}));
 const full=nationalFoodForecast(d,2);
 const forecasts=d.provinces.filter(p=>p.countryId==='sheng').map(p=>foodForecast(p,1,2,s.domestic));
 assert.equal(budget.tax,quotes.reduce((n,q)=>n+q.cash.tax,0));
 settleDomestic(d,2);s.turn=2;
 assert.equal(d.countries[0].fiscal.treasury,cash+budget.net);
 for(const [i,q]of quotes.entries()){
  const p=d.provinces.find(p=>p.id===q.provinceId);
  assert.equal(p.foodRelief.lastSettlement.consumed,full.provinces[i].consumed);assert.equal(p.welfare.grainReserve,undefined);
 }
 const before=JSON.stringify(s);settleDomestic(d,2);assert.equal(JSON.stringify(s),before);
 validateSave(structuredClone(s));assert.ok(turnEconomyReport(s).grainPeriod);
});
test('famine relief uses public stores without charging civilian ration twice',()=>{
 let s=game(),p=s.domestic.provinces[0];p.population.professions.farmers=0;p.population.professions.herders=0;
 const f=foodForecast(p,1,2,s.domestic);assert.equal(f.produced,0);assert.equal(f.need,Math.round(p.population.total*.005));
 s=executeRelief(s,{id:1,kind:'purchase',targetId:p.id,amount:f.need}).state;
 settleDomestic(s.domestic,2);s.turn=2;p=s.domestic.provinces[0];
 assert.equal(p.resourceSettlement.grain.shortfall,0);assert.equal(p.welfare.grainReserve,undefined);
 validateSave(structuredClone(s));
});
test('old saves retain old rules; versioned new rules survive repeated initialization and loading',()=>{
 const old=newGame('旧资源');assert.equal(validateSave(structuredClone(old)).domestic.resourceRulesVersion,undefined);
 const s=game();s.domestic.provinces[0].budget.taxRate=.15;initializeResourceEconomy(s.domestic);
 assert.equal(s.domestic.provinces[0].budget.taxRate,.15);
 assert.equal(validateSave(structuredClone(s)).domestic.resourceRulesVersion,1);
 const corrupt=structuredClone(s);delete corrupt.domestic.provinces[0].resourceRulesVersion;
 assert.throws(()=>validateSave(corrupt),/不一致/);
});
test('twelve actual turns reconcile and reload without losing treasury or grain',()=>{
 let s=game();
 for(let i=0;i<12;i++){
  advance(s);s=validateSave(structuredClone(s));
  for(const c of s.domestic.countries){const row=c.grainAccounting?.periods[0];if(row)assert.equal(row.opening+row.income-row.expense,c.fiscal.grain);}
 }
 assert.equal(s.turn,13);
});

// Food purchases in these scenarios explicitly open a neighboring mutual market.
function newGame(...args){const s=baseNewGame(...args);s.domestic.diplomacy.find(r=>r.countryIds.includes('sheng')&&r.countryIds.includes('nanzhao')).agreement.imports=1000000;return s;}
