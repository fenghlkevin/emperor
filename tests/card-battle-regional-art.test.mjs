import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CARD_CULTURES,sourceArtCulture,regionalTroopArt} from '../src/card-battle-cultures.mjs';
import {ensureCardPeople,createFixedCardPerson} from '../src/card-battle.mjs';
test('all nine troop kinds across nine regional crops stay within their own atlases and unsupported kinds retain their own art',()=>{
 for(const supported of ['infantry','spears','archers','cavalry','heavy-cavalry','crossbows','camel','elephant','horse-archers']){
 const cells=new Set();for(const [culture,value] of Object.entries(CARD_CULTURES)){
  const art=regionalTroopArt(culture,supported);
  if(value.index==null){assert.equal(art,null);continue;}
  const png=readFileSync(art.src);assert.deepEqual([png.readUInt32BE(16),png.readUInt32BE(20)],[1254,1254]);
  assert.ok([0,50,100].includes(art.x)&&[0,50,100].includes(art.y));cells.add(`${art.x},${art.y}`);
  assert.equal(art.src,`assets/battle/card-regional-${supported}-v2.png`);
  for(const kind of ['heavy','horse_archers','unknown'])assert.equal(regionalTroopArt(culture,kind),null);
 }assert.equal(cells.size,9);assert.equal(regionalTroopArt('unknown','infantry'),null);
 }});
test('troop source is independent of the commander identity and fixed across later world changes',()=>{
 const world={playerCountryId:'tang',provinces:[{id:'foreign',countryId:'persia'},{id:'ally',countryId:'japan'}],cardPeople:{version:1,rng:42,worldSeed:42,people:{},garrisons:{}}};
 const general={id:'manual-1554',name:'张飞',martial:95,intelligence:60,leadership:80};
 const battle={units:[{id:'a',side:'enemy',sourceId:'foreign',general},{id:'b',side:'home',sourceId:'ally',general},{id:'c',side:'home',sourceId:'central',general}]};
 const original=JSON.stringify(general),fixed=createFixedCardPerson(general,42);
 assert.equal(sourceArtCulture(world,battle.units[0]),'persian');ensureCardPeople(world,battle);
 assert.deepEqual(battle.units.map(u=>u.artCulture),['persian','japan','central']);
 assert.equal(battle.cardPeople['manual-1554'].portraitId,'manual-1554');
 assert.deepEqual(battle.cardPeople['manual-1554'].abilities,fixed.abilities);assert.equal(JSON.stringify(general),original);
 world.provinces[0].countryId='rome';ensureCardPeople(world,battle);assert.equal(battle.units[0].artCulture,'persian');
 assert.equal(sourceArtCulture(world,{countryId:'arabia'}),'arab');assert.equal(sourceArtCulture(world,{}),'central');
});
