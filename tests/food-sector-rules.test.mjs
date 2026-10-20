import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy,quoteProvinceResources,validateResourceSettlement} from '../src/province-resources.mjs';
import {outputFor,foodProduction,industryTax} from '../src/economy.mjs';
import {nationalFoodForecast,settleNationalFood} from '../src/national-resources.mjs';
import {enableOfficialProduction} from '../src/official-production.mjs';
function fixture(){const s=newGame('农牧工商');initializeResourceEconomy(s.domestic);return s;}
test('equal worked land and productivity: farms produce three times pastoral food',()=>{
 const s=fixture(),p=s.domestic.provinces[0];delete p.terrainCapacity;delete p.industryLabor;delete p.officialProduction;
 for(const [key,job]of [['agriculture','farmers'],['pastoral','herders']]){p.economy[key]={capacityArea:1000,developedArea:1000,productivity:100};p.population.professions[job]=1000;}
 assert.equal(outputFor(p,'agriculture',2),36);assert.equal(outputFor(p,'pastoral',2),12);assert.equal(foodProduction(p,2).produced,48);
 for(const n of [0,500,1000,3000]){p.population.professions.farmers=p.population.professions.herders=n;assert.equal(outputFor(p,'agriculture',2),outputFor(p,'pastoral',2)*3);}
});
test('food production never becomes silver tax, commerce and industry never become food',()=>{
 const s=fixture(),p=s.domestic.provinces[0];const cash=industryTax(p,2),food=foodProduction(p,2).produced;
 const q=structuredClone(p);q.population.professions.farmers=q.population.professions.herders=0;assert.equal(foodProduction(q,2).produced,0);assert.equal(industryTax(q,2),cash);
 const r=structuredClone(p);r.population.professions.merchants=r.population.professions.workers=0;assert.equal(industryTax(r,2),0);assert.equal(foodProduction(r,2).produced,food);
});
test('pastoral-only province can feed people, is pooled nationally, and forecasts reconcile',()=>{
 const s=fixture(),d=s.domestic,p=d.provinces[0];p.population.professions.farmers=0;
 const q=quoteProvinceResources(p,{turn:2});assert(q.production.foodSources.pastoral.produced>0);assert.equal(q.production.produced,q.production.foodSources.pastoral.produced);
 const before=nationalFoodForecast(d,2),tax=before.produced;settleNationalFood(d,2);s.turn=2;assert.equal(d.countries.find(c=>c.id===d.playerCountryId).fiscal.grain,before.closing);assert.equal(d.countries.find(c=>c.id===d.playerCountryId).foodSettlement.produced,tax);validateSave(structuredClone(s));
 const saved=JSON.stringify(s);settleNationalFood(d,2);assert.equal(JSON.stringify(s),saved);
});
test('source totals survive official rounding; forged food source is rejected',()=>{
 const s=fixture(),d=s.domestic,p=d.provinces[0];enableOfficialProduction(d,1);
 p.resourceSettlement=quoteProvinceResources(p,{turn:2});validateResourceSettlement(p,2);
 const sources=p.resourceSettlement.production.foodSources;assert.equal(p.resourceSettlement.production.produced,sources.agriculture.produced+sources.pastoral.produced);
 p.resourceSettlement.production.foodSources.pastoral.produced++;assert.throws(()=>validateResourceSettlement(p,2),/快照/);
});
test('farm-only historical snapshots remain loadable without inventing pastoral history',()=>{
 const s=fixture(),p=s.domestic.provinces[0];p.population.professions.herders=0;p.resourceSettlement=quoteProvinceResources(p,{turn:2});delete p.resourceSettlement.production.foodSources;
 const history=JSON.stringify(p.resourceSettlement);validateResourceSettlement(p,2);assert.equal(JSON.stringify(p.resourceSettlement),history);
});
