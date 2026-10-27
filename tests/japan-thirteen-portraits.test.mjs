import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {RANDOM_BEAUTY_ART} from '../src/random-beauties-data.mjs';
import {BEAUTY_CITIES} from '../src/beauty-cities.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';

test('thirteen Japanese additions have ten new identities and three Saika variants, all reachable and saved',()=>{
 const additions=RANDOM_BEAUTY_ART.filter(row=>row.id.startsWith('japan-photo-thirteen-20261023-'));
 assert.equal(additions.length,13);
 const previous=RANDOM_BEAUTY_ART.filter(row=>!additions.includes(row));
 const identities=additions.map(row=>row.name.split('-')[1]);
 assert.equal(new Set(identities).size,11);
 assert.equal(identities.filter(name=>name==='河北彩花').length,3);
 for(const row of additions){
  assert.equal(row.regionId,'japan');
  assert.equal(row.category,'番邦女子');
  assert.ok(fs.existsSync(new URL('../'+row.asset,import.meta.url)),row.asset);
  const identity=row.name.split('-')[1];
  if(identity!=='河北彩花')assert.ok(!previous.some(old=>old.name.includes(identity)),identity);
 }
 const city=BEAUTY_CITIES.find(row=>row.regionId==='japan');
 const random=portraitRandom(2026102313),found=new Map();
 for(let i=0;i<3000;i++){
  const person=generateBeauty({id:`random-beauty-1-${i}`,cityId:city.id,random});
  if(additions.some(row=>row.asset===person.randomPortraitAsset))found.set(person.randomPortraitAsset,person);
 }
 for(const row of additions){
  const person=found.get(row.asset);assert.ok(person,row.name);
  const state=newGame('日本新立绘验收');state.harem.encounter=person;
  const admitted=palaceAction(state,'admit',{rank:null}).state;
  const saved=validateSave(JSON.parse(JSON.stringify(admitted)));
  assert.equal(saved.harem.members.find(member=>member.id===person.id).randomPortraitAsset,row.asset);
 }
});
