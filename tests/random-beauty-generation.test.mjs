import test from 'node:test';
import assert from 'node:assert/strict';
import {generateBeauty,rollBeautyStat,RANDOM_BEAUTY_TIERS} from '../src/random-beauty-generation.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {encounter,palaceAction} from '../src/emperor.mjs';
import {companionRecovery} from '../src/emperor-rules.mjs';
test('both independent stat distributions have exact tier weights and inclusive ranges',()=>{
 for(const key of ['appearance','ability']){
 const counts=RANDOM_BEAUTY_TIERS.map(()=>0);
 for(let i=0;i<1000;i++)for(const edge of [0,.999999]){let n=0;const value=rollBeautyStat(key,()=>n++===0?(i+.5)/1000:edge);const tier=RANDOM_BEAUTY_TIERS.findIndex(t=>value>=t[key][0]&&value<=t[key][1]);assert.ok(tier>=0);counts[tier]++;}
 assert.deepEqual(counts,RANDOM_BEAUTY_TIERS.map(t=>t.weight*2));
 }
 const random=portraitRandom(15),pairs=Array.from({length:1000},(_,i)=>generateBeauty({id:`random-beauty-1-${i}`,random}));
 assert.ok(pairs.some(p=>p.appearance<65&&p.baseAbility>=110));assert.ok(pairs.some(p=>p.appearance>=80&&p.baseAbility<70));
});
test('summoning exceeds the former roster, preserves stats after rest and survives reload',()=>{
 let s=newGame('实时生成');s.harem.portraitSeed=345;
 const ids=new Set();
 for(let i=0;i<1200;i++){s.harem.encounter=null;const p=encounter(s);assert.ok(!ids.has(p.id));ids.add(p.id);if(i%300===0)validateSave(JSON.parse(JSON.stringify(s)));}
 while(!s.harem.encounter.randomBeauty){s.harem.encounter=null;encounter(s);}
 const before=structuredClone(s.harem.encounter);assert.equal(encounter(s),s.harem.encounter);
 s=palaceAction(s,'arrange').state;assert.equal(s.harem.encounter.ability,before.baseAbility);assert.equal(s.harem.encounter.appearance,before.appearance);
 s=palaceAction(s,'admit',{rank:null}).state;
 const saved=validateSave(JSON.parse(JSON.stringify(s))),p=saved.harem.members.find(p=>p.id===before.id);
 assert.equal(p.baseAbility,before.baseAbility);assert.equal(companionRecovery(p),p.baseAbility+p.experience+5);
 s.harem.encounter=null;encounter(s);s=palaceAction(s,'dismiss').state;validateSave(JSON.parse(JSON.stringify(s)));
 assert.ok(s.harem.seen.length<100);
});
test('all ten mainland expansion portraits are reachable across homeland cities',async()=>{
 const {BEAUTY_CITIES}=await import('../src/beauty-cities.mjs');
 const {RANDOM_BEAUTY_ART}=await import('../src/random-beauties-data.mjs');
 const additions=RANDOM_BEAUTY_ART.filter(row=>row.id.startsWith('mainland-expansion-20261022-'));
 assert.equal(additions.length,10);
 const seen=new Set(),random=portraitRandom(20261022);
 for(const city of BEAUTY_CITIES.filter(city=>city.regionId==='sheng')){
  for(let i=0;i<300;i++)seen.add(generateBeauty({id:`random-beauty-1-${i}`,cityId:city.id,random}).randomPortraitAsset);
 }
 for(const row of additions)assert.ok(seen.has(row.asset),row.name);
});
test('five photo-referenced mainland actresses are unique, reachable and stable after reload',async()=>{
 const {BEAUTY_CITIES}=await import('../src/beauty-cities.mjs');
 const {RANDOM_BEAUTY_ART}=await import('../src/random-beauties-data.mjs');
 const {portraitDataUrl}=await import('../src/beauty-raster-portrait.mjs');
 const additions=RANDOM_BEAUTY_ART.filter(row=>row.id.startsWith('mainland-photo-five-20261022-'));
 assert.equal(additions.length,5);
 for(const name of ['曾黎','陈好','俞飞鸿','舒畅','张馨予'])assert.equal(RANDOM_BEAUTY_ART.filter(row=>row.name.startsWith(name)).length,1,name);
 const found=new Map(),random=portraitRandom(202610225);
 for(const city of BEAUTY_CITIES.filter(city=>city.regionId==='sheng'))for(let i=0;i<300;i++){
  const person=generateBeauty({id:`random-beauty-1-${i}`,cityId:city.id,random});
  if(additions.some(row=>row.asset===person.randomPortraitAsset))found.set(person.randomPortraitAsset,person);
 }
 for(const row of additions){
  const person=found.get(row.asset);assert.ok(person,row.name);
  const s=newGame('照片立绘验收');s.harem.encounter=person;
  const admitted=palaceAction(s,'admit',{rank:null}).state;
  const saved=validateSave(JSON.parse(JSON.stringify(admitted)));
  const member=saved.harem.members.find(p=>p.id===person.id);
  assert.equal(member.randomPortraitAsset,row.asset);
  assert.equal(portraitDataUrl(member),portraitDataUrl(person));
 }
});
