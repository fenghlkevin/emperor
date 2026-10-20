import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeTerrainEconomy,TERRAIN_RULES,TERRAIN_SECTORS,terrainRule,industryLandLimit,industryLandAvailable,terrainLandLimit,validateTerrainEconomy} from '../src/terrain-economy.mjs';
import {cityLand} from '../src/city-capacity.mjs';
import {quoteIndustry,executeIndustry,settleIndustry} from '../src/industry.mjs';
import {initializeResourceEconomy,quoteProvinceResources,validateResourceSettlement} from '../src/province-resources.mjs';
import {outputFor,agriculturalProduction} from '../src/economy.mjs';
import {laborProfile} from '../src/labor.mjs';
import {settleStateDevelopment} from '../src/state-development.mjs';
import {settleStrategy} from '../src/foreign-strategy.mjs';
import {enableOfficialProduction} from '../src/official-production.mjs';
import {terrainEconomyMarkup} from '../src/terrain-economy-ui.mjs';
const act=(s,c)=>executeIndustry(s,{id:s.domestic.industryActions.nextId,provinceId:s.domestic.provinces[0].id,...c});
const load=s=>validateSave(JSON.parse(JSON.stringify(s)));
function fixture(terrain){
 const p=structuredClone(newGame('地形').domestic.provinces[0]);p.terrain=terrain;p.area=1000000;p.cityCapacity.land=100000;
 delete p.terrainCapacity;for(const k of TERRAIN_SECTORS)p.economy[k].developedArea=10000;
 const d={provinces:[p]};initializeTerrainEconomy(d,{fresh:true});return {p,d};
}
test('existing four terrain values alone determine land, fixed sector limits and bonuses',()=>{
 assert.deepEqual(Object.keys(TERRAIN_RULES),['平原型','河海型','丘陵型','高山型']);
 for(const terrain of Object.keys(TERRAIN_RULES)){
  const {p,d}=fixture(terrain),r=terrainRule(p);assert.equal(terrainLandLimit(p),Math.floor(p.area*r.land));
  assert.equal(p.cityCapacity.land,Math.floor(100000*r.opening));assert(cityLand(p).used<=p.cityCapacity.land);
  for(const [i,k]of TERRAIN_SECTORS.entries()){assert.equal(industryLandLimit(p,k),Math.floor(p.cityCapacity.land*r.shares[i]));assert(p.economy[k].developedArea<=industryLandLimit(p,k));}
  const before=JSON.stringify(d);initializeTerrainEconomy(d,{fresh:true});assert.equal(JSON.stringify(d),before);validateTerrainEconomy(d);
  p.id='arabia-core';assert.equal(terrainRule(p),r);assert(terrainEconomyMarkup(p).includes(terrain));
 }
 const a=fixture('平原型').p,b=fixture('高山型').p;assert(terrainLandLimit(b)<terrainLandLimit(a));assert(industryLandLimit(b,'agriculture')<industryLandLimit(a,'agriculture'));
});
test('new games preserve every initialized occupation and the 75% workforce ratio',()=>{
 const s=newGame('人口');for(const [i,p]of s.domestic.provinces.entries()){
  const n=i<10?i:i-8,total=160000+n*31000;
  assert.equal(p.population.total,total);assert.deepEqual(p.population.professions,{farmers:Math.round(total*.38),herders:Math.round(total*.065),merchants:Math.round(total*.09),workers:Math.round(total*.13),soldiers:2600+n*340,militia:1500+n*130});
  assert.equal(laborProfile(p).ratio,.75);
 }load(s);
});
test('development AND conversion reject a full sector even with shared empty land, without deductions',()=>{
 for(const kind of ['develop','convert']){
  const s=newGame('用地'),p=s.domestic.provinces[0];p.economy.agriculture.developedArea=industryLandLimit(p,'agriculture');
  for(const k of ['pastoral','commerce','industry'])p.economy[k].developedArea=1000;
  assert(cityLand(p).available>0);const before=structuredClone(s);
  assert.throws(()=>act(s,{kind,industry:'agriculture',fromIndustry:'pastoral',area:1}),/地形用地上限/);assert.deepEqual(s,before);
 }
});
test('expansion raises sector allowances at fixed ratios, stops at terrain cap and charges 5000 once',()=>{
 const s=newGame('扩城'),p=s.domestic.provinces[0],old=industryLandLimit(p,'agriculture');
 const r=act(s,{kind:'expand'}).state,q=r.domestic.provinces[0];assert.equal(r.stats.treasury,s.stats.treasury-5000);
 assert.equal(industryLandLimit(q,'agriculture')-old,Math.floor(q.cityCapacity.land*terrainRule(p).shares[0])-Math.floor(p.cityCapacity.land*terrainRule(p).shares[0]));
 p.cityCapacity.land=terrainLandLimit(p)-123;const end=act(s,{kind:'expand'}).state;assert.equal(end.domestic.provinces[0].cityCapacity.land,terrainLandLimit(p));
 assert.throws(()=>act(end,{kind:'expand'}),/地形土地上限/);load(end);
});
test('legacy migration retains paid land and pending projects; reload cannot silently enlarge limits',()=>{
 const s=newGame('旧档'),p=s.domestic.provinces[0];p.cityCapacity.land=2000000;p.economy.agriculture.developedArea=1500000;
 delete s.domestic.terrainEconomyVersion;for(const p of s.domestic.provinces)delete p.terrainCapacity;
 const before=structuredClone(p.population),r=load(s),city=r.domestic.provinces[0];assert.deepEqual(city.population,before);assert.equal(city.cityCapacity.land,2000000);assert.equal(city.economy.agriculture.developedArea,1500000);
 assert.equal(industryLandAvailable(city,'agriculture'),0);assert.throws(()=>act(r,{kind:'expand'}),/土地上限/);
 assert.deepEqual(load(r).domestic.terrainEconomyVersion,1);assert.deepEqual(load(r).domestic.provinces[0].terrainCapacity,city.terrainCapacity);
 const pending=act(newGame('旧工程'),{kind:'develop',industry:'agriculture',area:500}).state;
 delete pending.domestic.terrainEconomyVersion;for(const p of pending.domestic.provinces)delete p.terrainCapacity;
 const migrated=load(pending),project=structuredClone(migrated.domestic.provinces[0].development.project);assert.deepEqual(project,pending.domestic.provinces[0].development.project);
 settleIndustry(migrated.domestic,2);migrated.turn=2;load(migrated);
});
test('automatic domestic and foreign farming cannot bypass industry terrain ceilings',()=>{
 const s=newGame('自动兴农');for(const p of s.domestic.provinces){p.economy.agriculture.developedArea=industryLandLimit(p,'agriculture');p.welfare.stability=p.welfare.security=100;}
 const before=s.domestic.provinces.map(p=>p.economy.agriculture.developedArea);settleStateDevelopment(s.domestic,37);settleStrategy(s.domestic,42);
 assert.deepEqual(s.domestic.provinces.map(p=>p.economy.agriculture.developedArea),before);validateTerrainEconomy(s.domestic);
});
test('terrain bonus enters production once; zero staff stays zero and official bonus remains independently valid',()=>{
 for(const terrain of Object.keys(TERRAIN_RULES)){
  const {p}=fixture(terrain),r=terrainRule(p),[key,bonus]=Object.entries(r.bonus)[0],plain=structuredClone(p);delete plain.terrainCapacity;
  if(key==='agriculture'){p.resourceRulesVersion=plain.resourceRulesVersion=1;assert.equal(agriculturalProduction(p).base,Math.round(agriculturalProduction(plain).base*(1+bonus)));}
  else assert(Math.abs(outputFor(p,key)-outputFor(plain,key)*(1+bonus))<=1);
  const job={agriculture:'farmers',pastoral:'herders',commerce:'merchants',industry:'workers'}[key];p.population.professions[job]=0;assert.equal(outputFor(p,key),0);
 }
 const s=newGame('官员');initializeResourceEconomy(s.domestic);enableOfficialProduction(s.domestic,1);
 for(const p of s.domestic.provinces){const q=quoteProvinceResources(p,{turn:2});validateResourceSettlement({...p,resourceSettlement:q},2);}
});
test('partial or tampered terrain records are rejected without resetting limits',()=>{
 const s=newGame('校验');for(const change of [x=>delete x.domestic.terrainEconomyVersion,x=>delete x.domestic.provinces[0].terrainCapacity,x=>x.domestic.provinces[0].terrainCapacity.landLimit++,x=>x.domestic.provinces[0].terrainCapacity.kind='高山型',x=>x.domestic.provinces[0].terrainCapacity.legacySectors.agriculture=-1]){
  const bad=structuredClone(s);change(bad);assert.throws(()=>load(bad));
 }
});
