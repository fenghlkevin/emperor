import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {RANDOM_BEAUTY_ART} from '../src/random-beauties-data.mjs';
import {BEAUTY_CITIES} from '../src/beauty-cities.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';

test('all fifty screenshot identities are covered without remodelling the twenty-one existing identities',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../docs/art/japan-screenshot-complete-2026-10-23.json',import.meta.url),'utf8'));
 const additions=RANDOM_BEAUTY_ART.filter(row=>row.id.startsWith('japan-screenshot-20261023-'));
 assert.equal(manifest.roster.length,50);
 assert.equal(new Set(manifest.roster.map(row=>`${row.row}:${row.column}`)).size,50);
 assert.equal(manifest.roster.filter(row=>row.status==='new').length,29);
 assert.equal(manifest.roster.filter(row=>row.status==='already-in-pool').length,21);
 assert.equal(additions.length,32);
 assert.equal(additions.filter(row=>row.name.split('-')[1]==='新有菜').length,3);
 const previous=RANDOM_BEAUTY_ART.filter(row=>!additions.includes(row));
 for(const entry of manifest.roster){
  const candidates=entry.status==='new'?additions:previous;
  assert.ok(candidates.some(row=>row.name.split('-')[1]===entry.identity),entry.label);
  if(entry.status==='new')assert.ok(!previous.some(row=>row.name.split('-')[1]===entry.identity),entry.label);
 }
 const city=BEAUTY_CITIES.find(row=>row.regionId==='japan'),found=new Map();
 for(let i=0;i<RANDOM_BEAUTY_ART.length;i++){
  const person=generateBeauty({id:`random-beauty-1-${i}`,cityId:city.id,random:()=>(i+.5)/RANDOM_BEAUTY_ART.length});
  found.set(person.randomPortraitAsset,person);
 }
 for(const row of additions){
  assert.ok(fs.existsSync(new URL('../'+row.asset,import.meta.url)),row.name);
  const person=found.get(row.asset);assert.ok(person,row.name);
  const state=newGame('截图全部人物验收');state.harem.encounter=person;
  const saved=validateSave(JSON.parse(JSON.stringify(palaceAction(state,'admit',{rank:null}).state)));
  assert.equal(saved.harem.members.find(member=>member.id===person.id).randomPortraitAsset,row.asset);
 }
});

test('the thirteen body revisions also update portraits referenced by existing saves',()=>{
 const manifest=JSON.parse(fs.readFileSync(new URL('../docs/art/japan-thirteen-body-rework-2026-10-23.json',import.meta.url),'utf8'));
 assert.equal(manifest.items.length,13);
 for(const item of manifest.items){
  const row=RANDOM_BEAUTY_ART.find(row=>row.id===item.id);
  assert.equal(row.asset,item.asset);assert.ok(row.legacyAssets.includes(item.previousAsset));
  const oldPerson={id:'random-beauty-1-1',regionId:'japan',randomBeauty:true,randomPortraitAsset:item.previousAsset};
  const currentPerson={...oldPerson,randomPortraitAsset:item.asset};
  assert.equal(portraitDataUrl(oldPerson),portraitDataUrl(currentPerson));
 }
});
