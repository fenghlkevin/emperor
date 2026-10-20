import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {PROVINCES,REALMS,settleDomestic} from '../src/domestic.mjs';
import {PROVINCE_GEOGRAPHY,geographicTerrain,initializeProvinceGeography,validateProvinceGeography} from '../src/province-geography.mjs';
import {TERRAIN_SECTORS,TERRAIN_RULES,validateTerrainEconomy,industryLandAvailable} from '../src/terrain-economy.mjs';
import {terrainEconomyMarkup} from '../src/terrain-economy-ui.mjs';
import {executeIndustry,settleIndustry} from '../src/industry.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {enableOfficialProduction} from '../src/official-production.mjs';
import {laborProfile} from '../src/labor.mjs';
const load=s=>validateSave(JSON.parse(JSON.stringify(s)));
const previousHome={hebei:'河海型',henan:'平原型',huainan:'河海型',jiangnan:'平原型',lingnan:'丘陵型',hedong:'高山型',guannei:'平原型',shannan:'平原型',jiannan:'高山型',longyou:'丘陵型'};
function previousGame(){
 const s=newGame('旧地形');delete s.domestic.geographyVersion;
 for(const p of s.domestic.provinces){
  p.terrain=previousHome[p.id]??'平原型';const t=p.terrainCapacity;t.kind=p.terrain;t.legacyLand=0;t.landLimit=Math.floor(p.area*TERRAIN_RULES[p.terrain].land);
  for(const k of TERRAIN_SECTORS)t.legacySectors[k]=0;
 }
 validateTerrainEconomy(s.domestic);return s;
}
test('every scenario province and foreign core has explicit geography, matching map and runtime',()=>{
 const s=newGame('地形');assert.equal(s.domestic.provinces.length,PROVINCES.length+REALMS.length-1);assert.equal(Object.keys(PROVINCE_GEOGRAPHY).length,PROVINCES.length+REALMS.length-1);
 for(const p of s.domestic.provinces){assert.equal(p.terrain,geographicTerrain(p.id));assert.equal(p.terrainCapacity.kind,p.terrain);assert(terrainEconomyMarkup(p).includes('data-geography-description'));}
 for(const p of PROVINCES)assert.equal(p.terrain,geographicTerrain(p.id));
 for(const r of REALMS.filter(r=>r.id!=='sheng'))assert.equal(s.domestic.provinces.find(p=>p.id===r.id+'-core').terrain,geographicTerrain(r.id));
 validateProvinceGeography(s.domestic);load(s);
});
test('representative lowlands, mountains, river regions and approximate plateaus are distinguished',()=>{
 const expected={hebei:'平原型',jiangnan:'丘陵型',guannei:'丘陵型',shannan:'高山型',longyou:'高山型',tubo:'高山型',japan:'高山型',axum:'高山型',java:'高山型',pyu:'河海型',chenla:'河海型',srivijaya:'河海型',slavs:'平原型',franks:'平原型',arabia:'丘陵型',steppe:'丘陵型'};
 for(const [id,terrain]of Object.entries(expected))assert.equal(geographicTerrain(id),terrain);
 assert(PROVINCE_GEOGRAPHY.arabia.description.includes('尚无荒漠类别'));assert(PROVINCE_GEOGRAPHY.steppe.description.includes('近似'));
 assert.throws(()=>geographicTerrain('missing'),/缺少州县/);
});
test('old terrain migrates once without changing people, labor, treasury, grain, industry or hiring baseline',()=>{
 const s=previousGame(),before=structuredClone(s),r=load(s);
 for(const [i,p]of r.domestic.provinces.entries()){
  const old=before.domestic.provinces[i];assert.deepEqual(p.population,old.population);assert.deepEqual(p.cityCapacity,old.cityCapacity);assert.deepEqual(p.economy,old.economy);assert.deepEqual(p.industryLabor,old.industryLabor);assert.equal(laborProfile(p).ratio,.75);assert.equal(p.terrain,geographicTerrain(p.id));
 }
 assert.deepEqual(r.domestic.countries,before.domestic.countries);assert.deepEqual(load(r),r);
 const snapshot=JSON.stringify(r.domestic);initializeProvinceGeography(r.domestic);assert.equal(JSON.stringify(r.domestic),snapshot);
});
test('a terrain change preserves oversized paid land, pending development and future activation',()=>{
 const s=previousGame(),p=s.domestic.provinces.find(p=>p.id==='japan-core');
 p.countryId='sheng';s.domestic.countries.find(c=>c.id==='japan').provinceIds=[];s.domestic.countries[0].provinceIds.push(p.id);
 p.cityCapacity.land=2000000;p.economy.agriculture.developedArea=1000000;
 // This represents an already paid pre-update project in the old plain region.
 p.development.project={id:1,industry:'agriculture',area:500,cost:1000,progress:0,startedTurn:1,ownerId:'sheng'};s.domestic.industryActions.nextId=2;
 const migrated=load(s),city=migrated.domestic.provinces.find(p=>p.id==='japan-core');assert.equal(city.terrain,'高山型');assert.equal(city.cityCapacity.land,2000000);assert.equal(city.terrainCapacity.landLimit,2000000);assert.equal(industryLandAvailable(city,'agriculture'),0);
 assert.throws(()=>executeIndustry(migrated,{id:2,kind:'expand',provinceId:city.id}),/土地上限/);
 const old=structuredClone(city.development.project);assert.deepEqual(old,p.development.project);settleIndustry(migrated.domestic,2);migrated.turn=2;assert.equal(city.economy.agriculture.developedArea,1000500);load(migrated);
});
test('invalid old records cannot be repaired by geography migration; current geography is checked',()=>{
 const old=previousGame();old.domestic.provinces[0].terrainCapacity.kind='高山型';assert.throws(()=>load(old));
 const s=newGame('校验');for(const change of [x=>x.domestic.geographyVersion=2,x=>x.domestic.provinces[0].terrain='丘陵型']){const bad=structuredClone(s);change(bad);assert.throws(()=>load(bad));}
});


test('actual resource history is preserved when geographic terrain and its bonus change',()=>{
 const s=previousGame();initializeResourceEconomy(s.domestic);enableOfficialProduction(s.domestic,1);s.domestic.disasters.lastTurn=1000;
 settleDomestic(s.domestic,2);s.turn=2;const records=s.domestic.provinces.map(p=>structuredClone(p.resourceSettlement));
 const r=load(s);assert.deepEqual(r.domestic.provinces.map(p=>p.resourceSettlement),records);assert.deepEqual(load(r),r);
});
