import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {RANDOM_BEAUTY_ART} from '../src/random-beauties-data.mjs';
import {BEAUTY_CITIES} from '../src/beauty-cities.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';

test('the requested list adds seven triple identities, new replacements and the frontal-kneeling Aoi variant',()=>{
 const additions=RANDOM_BEAUTY_ART.filter(row=>row.id.startsWith('japan-request-list-20261023-'));
 assert.equal(additions.length,38);
 const names=additions.map(row=>row.name.split('-')[1]);
 assert.equal(new Set(names).size,24);
 for(const name of ['麻生希','桃谷绘里香','水咲萝拉','雨宫琴音','濑亚美莉','双叶美佳','芽森滴'])assert.equal(names.filter(value=>value===name).length,3,name);
 for(const name of ['本庄铃','小岛南','羽田真里'])assert.ok(!names.includes(name),name);
 for(const name of ['纱仓真菜','美竹铃','成濑心美','向井蓝'])assert.equal(names.filter(value=>value===name).length,1,name);
 assert.equal(names.filter(value=>value==='葵司').length,1);
 const previous=RANDOM_BEAUTY_ART.filter(row=>!additions.includes(row));
 for(const name of new Set(names))if(name!=='葵司')assert.ok(!previous.some(row=>row.name.split('-')[1]===name),name);
 const city=BEAUTY_CITIES.find(row=>row.regionId==='japan'),found=new Map();
 for(let i=0;i<RANDOM_BEAUTY_ART.length;i++){
  const person=generateBeauty({id:`random-beauty-1-${i}`,cityId:city.id,random:()=>(i+.5)/RANDOM_BEAUTY_ART.length});
  found.set(person.randomPortraitAsset,person);
 }
 for(const row of additions){
  assert.ok(fs.existsSync(new URL('../'+row.asset,import.meta.url)),row.name);
  const person=found.get(row.asset);assert.ok(person,row.name);
  const state=newGame('指定名单立绘验收');state.harem.encounter=person;
  const saved=validateSave(JSON.parse(JSON.stringify(palaceAction(state,'admit',{rank:null}).state)));
  assert.equal(saved.harem.members.find(member=>member.id===person.id).randomPortraitAsset,row.asset);
 }
});

test('the random portrait directory contains no unused old PNG files',()=>{
 const files=fs.readdirSync(new URL('../assets/beauties/random/',import.meta.url),{recursive:true}).filter(file=>file.endsWith('.png')).map(file=>'assets/beauties/random/'+file);
 const registered=new Set(RANDOM_BEAUTY_ART.map(row=>row.asset));
 assert.deepEqual(files.filter(file=>!registered.has(file)),[]);
});
