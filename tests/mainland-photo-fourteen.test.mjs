import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {RANDOM_BEAUTY_ART,resolveRandomPortraitAsset} from '../src/random-beauties-data.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {BEAUTY_CITIES} from '../src/beauty-cities.mjs';

test('fourteen barefoot summer variants join the mainland pool while existing variants remain usable',()=>{
 const additions=RANDOM_BEAUTY_ART.filter(row=>/^mainland-photo-(six|eight)-20261022-/.test(row.id));
 assert.equal(additions.length,14);
 for(const name of ['张子枫','陈都灵','章若楠','关晓彤','张婧仪','刘浩存','王子文','刘璇','张雨霏','惠若琪','夏思凝','潘晓婷','赵丽娜','宋雨琦']){
  const added=additions.find(row=>row.name.startsWith(name+'-'));
  assert.ok(added,name);assert.equal(added.regionId,'sheng');assert.equal(added.category,'女明星');
  assert.ok(existsSync(new URL('../'+added.asset,import.meta.url)),added.asset);
  if(['陈都灵','章若楠','关晓彤','张婧仪','刘浩存'].includes(name)){
   const original=RANDOM_BEAUTY_ART.find(row=>row.name===name);
   assert.ok(original,`retain ${name}`);assert.notEqual(original.asset,added.asset);
   for(const asset of [original.asset,...original.legacyAssets])assert.equal(resolveRandomPortraitAsset(asset),original.asset);
  }
 }
 const random=portraitRandom(202610226),found=new Map();
 for(const city of BEAUTY_CITIES.filter(city=>city.regionId==='sheng')){
  const citySeen=new Set();
  for(let i=0;i<1000;i++){
   const person=generateBeauty({id:`random-beauty-1-${i}`,cityId:city.id,random});
   if(additions.some(row=>row.asset===person.randomPortraitAsset)){
    found.set(person.randomPortraitAsset,person);citySeen.add(person.randomPortraitAsset);
   }
  }
  assert.equal(citySeen.size,14,`${city.id}: all shared variants reachable`);
 }
 assert.equal(found.size,14,'all fourteen variants reachable through real random generation');
 for(const [asset,person] of found){
  const state=newGame('夏装立绘验收');state.harem.encounter=person;
  const admitted=palaceAction(state,'admit',{rank:null}).state;
  const saved=validateSave(JSON.parse(JSON.stringify(admitted)));
  const member=saved.harem.members.find(row=>row.id===person.id);
  assert.equal(member.randomPortraitAsset,asset);assert.equal(portraitDataUrl(member),portraitDataUrl(person));
 }
});
