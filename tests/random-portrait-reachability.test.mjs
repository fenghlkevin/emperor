import test from 'node:test';
import assert from 'node:assert/strict';
import {BEAUTY_CITIES} from '../src/beauty-cities.mjs';
import {RANDOM_BEAUTY_ART} from '../src/random-beauties-data.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';

test('every registered portrait is reachable through real generation within its regional pool',()=>{
 const seen=new Set();let serial=0;
 // Sweep uniform draw intervals, covering all candidates without a probabilistic timeout.
 for(const city of BEAUTY_CITIES)for(let i=0;i<RANDOM_BEAUTY_ART.length;i++){
  const p=generateBeauty({id:`random-beauty-1-${serial++}`,cityId:city.id,random:()=>(i+.5)/RANDOM_BEAUTY_ART.length});
  if(!p.randomPortraitAsset){assert.equal(p.regionalPortrait,true);continue;}
  const row=RANDOM_BEAUTY_ART.find(r=>r.asset===p.randomPortraitAsset);assert.ok(row);
  assert.equal(row.regionId??'sheng',city.regionId,`${city.id}: ${row.name}`);seen.add(row.id);
 }
 assert.deepEqual(RANDOM_BEAUTY_ART.filter(r=>!seen.has(r.id)).map(r=>r.name),[]);
});

test('city-specific and generic portraits coexist without re-rolling a saved identity',()=>{
 for(const cityId of ['hebei','henan']){
  const seen=new Map();for(let i=0;i<RANDOM_BEAUTY_ART.length;i++){
   const p=generateBeauty({id:`random-beauty-1-${i}`,cityId,random:()=>(i+.5)/RANDOM_BEAUTY_ART.length});seen.set(p.randomPortraitAsset,p);
  }
  const cityArt=RANDOM_BEAUTY_ART.filter(r=>r.id===cityId||r.cityId===cityId);
  for(const row of cityArt)assert.ok(seen.has(row.asset),row.name);
  assert.ok([...seen.keys()].some(asset=>!cityArt.some(r=>r.asset===asset)),'city-specific art must not hide generic art');
  const person=[...seen.values()][0],s=newGame('画像固定');s.harem.encounter=person;
  const admitted=palaceAction(s,'admit',{rank:null}).state,saved=validateSave(JSON.parse(JSON.stringify(admitted)));
  assert.equal(portraitDataUrl(saved.harem.members.find(r=>r.id===person.id)),portraitDataUrl(person));
 }
});
