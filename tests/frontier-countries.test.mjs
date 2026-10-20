import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance} from '../src/game.mjs';
import {REALMS,FRONTIER_IDS} from '../src/scenario-geography.mjs';
import {realmGeometry} from '../src/campaign-map.mjs';
import {atlasIsPlayableLand} from '../src/atlas-geography.mjs';
import {insideRing} from '../src/world-atlas.mjs';
import {relationBetween} from '../src/diplomacy.mjs';
import {borderingCountries,borderingProvinces,beginWar,generals} from '../src/war.mjs';
import {occupyProvince} from '../src/occupation.mjs';
import {territoryView,localMapRegions} from '../src/territory-atlas.mjs';

function legacySave(){
 const s=newGame('旧疆域'),ids=new Set(FRONTIER_IDS),d=s.domestic;
 d.countries=d.countries.filter(c=>!ids.has(c.id));d.provinces=d.provinces.filter(p=>!ids.has(p.countryId));
 d.diplomacy=d.diplomacy.filter(r=>!r.countryIds.some(id=>ids.has(id)));
 for(const id of ids){delete d.troopKits.depots[id+'-core'];delete d.strategy.nations[id];}
 delete d.worldExpansionVersion;return s;
}

test('new peripheral countries have land, unique ownership, complete diplomacy and armies',()=>{
 const s=newGame('外围势力'),d=s.domestic;
 assert.equal(d.countries.length,42);assert.equal(d.provinces.length,51);
 for(const id of FRONTIER_IDS){
  const g=realmGeometry.find(r=>r.id===id),p=d.provinces.find(p=>p.id===id+'-core');
  assert.ok(atlasIsPlayableLand(g.center),id);
  assert.equal(realmGeometry.filter(r=>r.polygons.some(poly=>insideRing(g.center,poly))).length,1,id);
  assert.equal(p.countryId,id);assert.ok(p.population.professions.soldiers>0);assert.ok(d.troopKits.depots[p.id]);
  assert.ok(relationBetween(d,'sheng',id));assert.ok(borderingCountries(d,id).length,id);
 }
 assert.doesNotThrow(()=>validateSave(structuredClone(s)));
 advance(s);assert.doesNotThrow(()=>validateSave(structuredClone(s)));
});

test('complete old saves gain the expansion once, preserving resources, diplomacy and existing occupations',()=>{
 const old=legacySave();occupyProvince(old.domestic,'korea',1);
 old.domestic.countries[0].fiscal.treasury=23456;
 const countries=structuredClone(old.domestic.countries),provinces=structuredClone(old.domestic.provinces),diplomacy=structuredClone(old.domestic.diplomacy),depots=structuredClone(old.domestic.troopKits.depots);
 const s=validateSave(structuredClone(old)),d=s.domestic;
 for(const c of countries)assert.deepEqual(d.countries.find(x=>x.id===c.id),c);
 for(const p of provinces)assert.deepEqual(d.provinces.find(x=>x.id===p.id),p);
 for(const r of diplomacy)assert.deepEqual(d.diplomacy.find(x=>x.countryIds.join('/')===r.countryIds.join('/')),r);
 for(const [id,depot]of Object.entries(depots))assert.deepEqual(d.troopKits.depots[id],depot);
 assert.equal(d.worldExpansionVersion,1);assert.equal(d.countries.length,REALMS.length);
 assert.deepEqual(validateSave(structuredClone(s)),s);
 const partial=structuredClone(s);partial.domestic.countries=partial.domestic.countries.filter(c=>c.id!=='cape');assert.throws(()=>validateSave(partial));
 const broken=legacySave();delete broken.domestic.troopKits.depots['guannei'];assert.throws(()=>validateSave(broken));
});

test('new countries become war targets after adjoining conquest and join domestic territory on occupation',()=>{
 const s=newGame('北征');occupyProvince(s.domestic,'siberia',1);
 const target='forestland',before=territoryView(localMapRegions(s.domestic));
 assert.ok(borderingCountries(s.domestic).some(c=>c.id===target));
 assert.ok(borderingProvinces(s.domestic,'sheng',target).some(p=>p.id===target+'-core'));
 const leaders=generals(s.domestic),command={id:s.domestic.war.nextId,kitVersion:1,kind:'war',targetId:target,generalId:leaders[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'spears',count:100,generalId:leaders[1].id}]};
 const battle=beginWar(s,command);assert.equal(battle.domestic.war.battle.command.targetId,target);assert.doesNotThrow(()=>validateSave(structuredClone(battle)));
 const result=occupyProvince(s.domestic,target,1);assert.ok(result.annexed);
 const after=territoryView(localMapRegions(s.domestic));assert.ok(after[1]<before[1]);
 assert.equal(localMapRegions(s.domestic).find(p=>p.id===target+'-core').owner,'sheng');
 assert.doesNotThrow(()=>validateSave(structuredClone(s)));
});

test('new countries can send an envoy and preserve the visit across saves',async()=>{
 const {inviteEnvoy}=await import('../src/envoy-visits.mjs');
 const {portraitAsset}=await import('../src/envoy-portraits.mjs');
 const {existsSync}=await import('node:fs');
 for(const id of FRONTIER_IDS){
  const s=newGame('新增外交');s.scene='court';
  const next=inviteEnvoy(s,id);assert.equal(next.envoyVisit.countryId,id);
  assert.ok(existsSync(portraitAsset(next.envoyVisit.appearance)),id);
  assert.equal(validateSave(structuredClone(next)).envoyVisit.countryId,id);
 }
});

test('pre-expansion local-grain saves can expand without mixing inventory formats',()=>{
 const s=legacySave(),d=s.domestic,treasury=d.countries[0].fiscal.treasury;
 delete d.nationalResourcesVersion;
 for(const c of d.countries)delete c.fiscal.grain;
 for(const p of d.provinces){p.welfare.grainReserve=11;p.status.cash=7;}
 const loaded=validateSave(s);assert.equal(loaded.domestic.countries[0].fiscal.treasury,treasury+70);
 assert.equal(loaded.domestic.countries[0].fiscal.grain,110);
 assert.equal(loaded.domestic.countries.length,42);assert.deepEqual(validateSave(structuredClone(loaded)),loaded);
});
