import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SOURCE_ART_REGIONS,cardArtRegion,cardCulture,regionalTroopArt,cardRegionalArt} from '../src/card-battle-cultures.mjs';
import {createFixedCardPerson,ensureCardPeople} from '../src/card-battle.mjs';
import {battleDeckView} from '../src/card-battle-deck.mjs';
import {fixture} from '../scripts/card-battle-balance-fixture.mjs';
test('source-specific imagery distinguishes eleven sources without relabeling gameplay culture',()=>{
 const countries=['korea','axum','maghreb','slavs','franks','pyu','chenla','srivijaya','java','luzon','sinhala'];
 const before=['central','arab','arab','roman','roman','nanzhao','nanzhao','nanzhao','nanzhao','nanzhao','indian'];
 countries.forEach((country,i)=>assert.equal(cardCulture(country),before[i]));
 assert.equal(new Set(countries.map(cardArtRegion)).size,9);
 for(const [region,{index,parent,atlas}]of Object.entries(SOURCE_ART_REGIONS)){
  const infantry=regionalTroopArt(region,'infantry');assert.equal(infantry.src,`assets/battle/card-${atlas}-infantry-v1.png`);assert.deepEqual([infantry.x,infantry.y],[index%3*50,Math.floor(index/3)*50]);
  for(const kind of ['spears','archers','cavalry','heavy-cavalry','crossbows','camel','elephant','horse-archers']){const art=regionalTroopArt(region,kind),png=readFileSync(art.src);assert.equal(art.src,`assets/battle/card-${atlas}-${kind}-v1.png`);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);assert.deepEqual([art.x,art.y],[infantry.x,infantry.y]);}
  for(const role of ['文职','武将']){
   const person={id:'source-'+region+role,name:'测试',role,martial:75,intelligence:75,leadership:75};
   const old=createFixedCardPerson(person,41,parent),profile=createFixedCardPerson({...person,artRegion:region},41,parent);
   assert.deepEqual(profile.definition,old.definition);assert.deepEqual(profile.abilities,old.abilities);
   const art=cardRegionalArt(profile.portraitId);assert.equal(art.src,`assets/battle/card-${atlas}-${role==='文职'?'civil':'military'}-v1.png`);
   const png=readFileSync(art.src);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);
  }
 }
 assert.equal(cardArtRegion('unknown'),'central');
});
test('real source art snapshot persists across conquest and deck uses same source metadata',()=>{
 const world={playerCountryId:'sheng',provinces:[{id:'foreign',countryId:'axum'}],cardPeople:{version:1,rng:42,worldSeed:42,people:{},garrisons:{}}};
 const b=fixture();for(const u of b.units)u.sourceId='foreign';ensureCardPeople(world,b);
 assert.ok(b.units.every(u=>u.artCulture==='arab'&&u.artRegion==='source_aksumite'));
 assert.ok(battleDeckView(b).rows.filter(x=>x.type==='troop').every(x=>x.artRegion==='source_aksumite'));
 world.provinces[0].countryId='franks';ensureCardPeople(world,b);assert.ok(b.units.every(u=>u.artRegion==='source_aksumite'));
 const generated={units:[{id:'g',side:'home',sourceId:'foreign',kind:'infantry'}]};ensureCardPeople(world,generated);
 const p=generated.cardPeople[generated.units[0].cardPersonId];assert.match(p.portraitId,/regional-military-source_frankish-v2-[01]/);assert.equal(p.culture,'roman');
});
test('all 42 actual scenario source IDs have deliberate art coverage, including fictional frontiers',async()=>{
 const {REALMS,FRONTIER_IDS}=await import('../src/scenario-geography.mjs');
 assert.equal(REALMS.length,42);
 for(const realm of REALMS){
  const region=cardArtRegion(realm.id);
  if(realm.id==='sheng'){assert.equal(region,'central');continue;}
  assert.notEqual(region,'central',realm.id+' must not silently become a central army');
  if(FRONTIER_IDS.includes(realm.id))assert.equal(SOURCE_ART_REGIONS[region].atlas,'source-final');
  for(const kind of ['infantry','spears','archers','cavalry','heavy-cavalry','crossbows','camel','elephant','horse-archers']){
   const art=regionalTroopArt(region,kind);assert.ok(art,realm.id+' '+kind);const png=readFileSync(art.src);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);
  }
 }
});
