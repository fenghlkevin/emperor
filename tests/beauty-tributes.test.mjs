import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {settleBeautyTributes} from '../src/beauty-tributes.mjs';
import {relationBetween} from '../src/diplomacy.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {RANDOM_BEAUTY_ART} from '../src/random-beauties-data.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';
import {BEAUTY_CITIES} from '../src/beauty-cities.mjs';
function foreign(prestige=200,friendship=80,hostile=false){const s=newGame('进献验收'),d=s.domestic;d.countries.find(c=>c.id===d.playerCountryId).prestige=prestige;for(const r of d.diplomacy)if(r.countryIds.includes(d.playerCountryId)){r.friendship=0;r.relation='none';}const province=d.provinces.find(p=>p.id==='japan-core'),r=relationBetween(d,d.playerCountryId,province.countryId);r.friendship=friendship;r.relation=hostile?'hostile':'none';s.turn=2;return s;}
test('foreign offerings require prestige AND friendship and never come from enemies',()=>{
 for(const args of [[199,100,false],[500,79,false],[500,100,true]]){const s=foreign(...args),n=s.harem.members.length;settleBeautyTributes(s,()=>0);assert.equal(s.harem.members.length,n);}
 const s=foreign();settleBeautyTributes(s,()=>0);const p=s.harem.members.at(-1);assert.equal(p.cityId,'japan-core');assert.equal(p.regionId,'japan');assert.equal(p.tributeOrigin.kind,'foreign');assert.equal(p.rank,null);assert.ok(p.baseAbility>=20);if(p.randomPortraitAsset){assert.equal(RANDOM_BEAUTY_ART.find(a=>a.asset===p.randomPortraitAsset)?.regionId,'japan');}else{assert.equal(p.regionalPortrait,true);assert.match(portraitDataUrl(p),/assets\/beauties\/random\/.+\.png$/);}validateSave(structuredClone(s));const n=s.harem.members.length;settleBeautyTributes(s,()=>0);assert.equal(s.harem.members.length,n);
 const miss=foreign();settleBeautyTributes(miss,()=>.05);assert.equal(miss.harem.members.length,1);
});
test('first annual period gives exactly one per owned province including occupied Japan; reload is idempotent',()=>{
 const s=foreign(0,0);s.turn=37;const japan=s.domestic.provinces.find(p=>p.id==='japan-core');japan.countryId=s.domestic.playerCountryId;
 // Synchronize the standard country ownership index for save validation.
 for(const c of s.domestic.countries)c.provinceIds=s.domestic.provinces.filter(p=>p.countryId===c.id).map(p=>p.id);
 const owned=s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId),n=s.harem.members.length;settleBeautyTributes(s,()=>.5);
 const people=s.harem.members.slice(n);assert.equal(people.length,owned.length);assert.equal(new Set(people.map(p=>p.cityId)).size,owned.length);assert.equal(people.find(p=>p.cityId==='japan-core').regionId,'japan');assert.ok(people.every(p=>p.tributeOrigin.kind==='annual'&&p.rank===null));
 const saved=validateSave(JSON.parse(JSON.stringify(s)));settleBeautyTributes(saved,()=>0);assert.equal(saved.harem.members.length,s.harem.members.length);
 saved.turn=38;settleBeautyTributes(saved,()=>0);assert.equal(saved.harem.members.length,s.harem.members.length);
});
test('all regions generate local names, styles and independent five-tier stats, never an unrelated fixed portrait',()=>{
 for(const city of BEAUTY_CITIES){const p=generateBeauty({id:'random-beauty-1-2',cityId:city.id,random:portraitRandom(city.style+20)});assert.equal(p.regionId,city.regionId);assert.ok(p.appearance>=30&&p.appearance<=100&&p.baseAbility>=20&&p.baseAbility<=200);if(p.randomPortraitAsset){const row=RANDOM_BEAUTY_ART.find(a=>a.asset===p.randomPortraitAsset);assert.equal(row.regionId??'sheng',city.regionId);}else assert.equal(p.regionalPortrait,true);}
});
test('advance calls annual settlement at year boundary and corrupted last turn is rejected',()=>{
 const s=newGame('岁首');s.turn=36;advance(s);assert.equal(s.turn,37);assert.equal(s.harem.members.filter(p=>p.tributeOrigin?.kind==='annual').length,s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId).length);validateSave(structuredClone(s));s.harem.beautyTributeLastTurn=38;assert.throws(()=>validateSave(s),/进献/);
});
