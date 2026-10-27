import {createHash} from 'node:crypto';
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {WUXIA_CAMEOS} from '../src/wuxia-cameos.mjs';
import {tourCameo,cameoSeen} from '../src/tour-cameos.mjs';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {scheduleTravel,beginTravel} from '../src/travel.mjs';
import {createTourEncounters,nextTourEvent,eventCompanion,resolveTourEvent,tourEventDefinition} from '../src/tour-events.mjs';
import {RANDOM_BEAUTY_ART,RANDOM_PORTRAITS,EVENT_BEAUTY_ART,resolveRandomPortraitAsset} from '../src/random-beauties-data.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';
import {palaceAction} from '../src/emperor.mjs';

function tripTo(province){
 let s=newGame('独立江湖奇遇');s.phase=2;
 s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;
 s.domestic.provinces.find(p=>p.id===province).buildings.palaces=1;
 s=scheduleTravel(s,'tour',province).state;advance(s);s=beginTravel(s).state;
 s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};
 return s;
}
function naturalEncounter(c){
 const s=tripTo(c.homeCityId);
 for(let i=0;i<3000;i++){
  s.createdAt='wuxia-natural-'+i;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};
  const encounters=createTourEncounters(s,s.travel.pending);
  if(encounters.some(e=>e.type===c.id)){s.travel.pending.encounters=encounters;return validateSave(s);}
 }
 throw Error('Unreachable '+c.name);
}
function reachCameo(s){
 while(!tourCameo(nextTourEvent(s).type)){
  const event=nextTourEvent(s),choice=tourEventDefinition(event).choices.find(c=>!c.risk&&!c.effects.admit);
  s=resolveTourEvent(s,event.id,choice.id).state;
 }
 return s;
}

test('both cameos arise naturally only in their own regions and cannot reroll after being seen',()=>{
 for(const c of WUXIA_CAMEOS){
  const s=naturalEncounter(c),pending=structuredClone(s.travel.pending.encounters);
  assert.ok(cameoSeen(s,c.id));
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))).travel.pending.encounters,pending);
  for(let i=0;i<1000;i++){
   s.createdAt='wuxia-wrong-region-'+i;
   s.travel.pending.provinceId=c.homeCityId==='guannei'?'jiangnan':'guannei';
   const fresh=structuredClone(s);fresh.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};
   assert.ok(!createTourEncounters(fresh,fresh.travel.pending).some(e=>e.type===c.id));
   s.travel.pending.provinceId=c.homeCityId;
   assert.ok(!createTourEncounters(s,s.travel.pending).some(e=>e.type===c.id));
  }
 }
});

test('distinct choices pay once, admit the correct named heroine and preserve her new art across save reload',()=>{
 for(const c of WUXIA_CAMEOS){
  const base=reachCameo(naturalEncounter(c)),event=nextTourEvent(base);
  const candidate=eventCompanion(base,event);assert.equal(candidate.name,c.name);
  assert.ok(portraitDataUrl(candidate).endsWith(c.portraitAsset));
  assert.equal(createHash('sha256').update(readFileSync(new URL('../'+c.portraitAsset,import.meta.url))).digest('hex'),JSON.parse(readFileSync(new URL('../docs/model-portrait-source-checksums.json',import.meta.url))).eventPortraits[c.name]);
  for(const choice of tourEventDefinition(event).choices){
   const result=resolveTourEvent(base,event.id,choice.id);
   const saved=validateSave(JSON.parse(JSON.stringify(result.state)));
   assert.equal(saved.stats.treasury,base.stats.treasury+(choice.effects.money??0));
   for(const [key,n]of Object.entries(choice.effects.stats))assert.equal(saved.stats[key],Math.min(['health','happiness'].includes(key)?100:500,base.stats[key]+n));
   const admitted=saved.harem.members.find(p=>p.travelOrigin?.easterEgg===c.id);
   assert.equal(Boolean(admitted),Boolean(choice.effects.admit));
   if(admitted){assert.equal(admitted.name,c.name);assert.equal(admitted.travelOrigin.consented,true);assert.equal(portraitDataUrl(admitted),portraitDataUrl(candidate));}
   assert.throws(()=>resolveTourEvent(saved,event.id,choice.id),/已处理/);
   assert.ok(cameoSeen(saved,c.id));
  }
 }
 assert.ok(WUXIA_CAMEOS[0].choices.find(c=>c.id==='part').effects.stats.martial);
 assert.ok(WUXIA_CAMEOS[1].choices.find(c=>c.id==='part').effects.stats.wisdom);
});

test('event-exclusive art leaves the random pool while old random-member saves retain their portraits',()=>{
 for(const row of EVENT_BEAUTY_ART){
  assert.ok(!RANDOM_BEAUTY_ART.some(r=>r.id===row.id));assert.ok(!RANDOM_PORTRAITS.includes(row.asset));
  const old=row.legacyAssets[0];assert.equal(resolveRandomPortraitAsset(old),row.asset);
  const s=newGame('旧立绘存档');
  s.harem.encounter={...generateBeauty({id:'random-beauty-1-88',random:()=>.3}),randomPortraitAsset:old};
  const saved=validateSave(JSON.parse(JSON.stringify(palaceAction(s,'admit',{rank:null}).state)));
  const person=saved.harem.members.find(p=>p.id==='random-beauty-1-88');
  assert.ok(portraitDataUrl(person).endsWith(row.asset));
 }
});
