import test from 'node:test';
import assert from 'node:assert/strict';
import {BEAUTIES,ACTIVE_BEAUTIES} from '../src/beauties.mjs';
import {newGame,validateSave,advance} from '../src/game.mjs';
import {encounter} from '../src/emperor.mjs';
import {companyBond,educationBond} from '../src/harem-bonds.mjs';
import {ensureBeautyTraits,validateBeautyTraits,HIDDEN_TRAITS} from '../src/beauty-hidden-traits.mjs';
import {generateBeauty} from '../src/random-beauty-generation.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {eventCompanion,resolveTourEvent} from '../src/tour-events.mjs';
import {admitForeignRoyal} from '../src/dynasty.mjs';
import {scheduleTravel,beginTravel} from '../src/travel.mjs';

test('every historical and named beauty gets one or two unique hidden traits without modifying templates',()=>{
 const people=[...BEAUTIES.filter(p=>/历史|传说|原作/.test(p.origin)),...ACTIVE_BEAUTIES];
 for(const salt of [1,80,20261026])for(const template of people){
  const before=JSON.stringify(template),p=ensureBeautyTraits(structuredClone(template),salt);
  assert.equal(p.hiddenTraits.source,'historical');assert.ok([1,2].includes(p.hiddenTraits.kinds.length));
  assert.equal(new Set(p.hiddenTraits.kinds).size,p.hiddenTraits.kinds.length);validateBeautyTraits(p);assert.equal(JSON.stringify(template),before);
 }
});
test('ordinary and event people usually have no traits, with occasional one or two, covering all five effects',()=>{
 for(const source of ['random','event']){
  const counts=[0,0,0],seen=new Set();
  for(let i=0;i<2000;i++){
   const p={id:`sample-${i}`,origin:'原创',randomBeauty:true,...(source==='event'?{travelOrigin:{eventId:`event-${i}`}}:{})};
   ensureBeautyTraits(p,20261026);validateBeautyTraits(p);counts[p.hiddenTraits.kinds.length]++;p.hiddenTraits.kinds.forEach(k=>seen.add(k));
  }
  assert.ok(counts[0]>1100&&counts[0]<1300,JSON.stringify(counts));assert.ok(counts[1]>0&&counts[2]>0);assert.equal(seen.size,Object.keys(HIDDEN_TRAITS).length);
 }
});
test('random generation, summoning and old-save migration persist even empty trait rolls',()=>{
 const p=generateBeauty({id:'random-beauty-1234-1',random:portraitRandom(55)});validateBeautyTraits(p);assert.equal(p.hiddenTraits.source,'random');
 let s=newGame('固定特性');const h=structuredClone(s.harem.members[0].hiddenTraits);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))).harem.members[0].hiddenTraits,h);
 s.harem.members[0].hiddenTraits=undefined;s=validateSave(JSON.parse(JSON.stringify(s)));const migrated=structuredClone(s.harem.members[0].hiddenTraits);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))).harem.members[0].hiddenTraits,migrated);
 const next=encounter(s);validateBeautyTraits(next);const fixed=structuredClone(next.hiddenTraits);
 assert.deepEqual(encounter(s).hiddenTraits,fixed);assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))).harem.encounter.hiddenTraits,fixed);
 const original=ensureBeautyTraits({id:'empty-roll',origin:'原创',randomBeauty:true,hiddenTraits:{version:1,source:'random',kinds:[]}},1);
 ensureBeautyTraits(original,999);assert.deepEqual(original.hiddenTraits.kinds,[]);
});
test('tour cameos including historical names follow occasional event rolls, stable through preview, admission and reload',()=>{
 const s=newGame('巡游特性');s.harem.portraitSeed=20261026;
 s.travel.pending={id:1,kind:'tour',provinceId:'guannei',startedTurn:1,encounters:[]};
 for(const type of ['bereaved','xia-yuhe','xia-yingying','huang-rong']){
  const counts=[0,0,0];
  for(let i=0;i<300;i++){
   const e={id:`tour-1-${i}`,type,seed:i*731,personId:type==='xia-yuhe'?'beauty-33':`random-beauty-tour-1-${i}`,status:'pending'};
   const p=eventCompanion(s,e);assert.ok(p,type);validateBeautyTraits(p);assert.equal(p.hiddenTraits.source,'event');counts[p.hiddenTraits.kinds.length]++;
   assert.deepEqual(eventCompanion(s,e).hiddenTraits,p.hiddenTraits);
  }
  assert.ok(counts[0]>140&&counts[0]<220&&counts[1]>0&&counts[2]>0,`${type}: ${counts}`);
 }
});
test('foreign princesses do not inherit the historical template trait guarantee',()=>{
 for(let seed=0;seed<30;seed++){
  const s=newGame('外邦特性');s.harem.portraitSeed=seed;const p=admitForeignRoyal(s,'japan');validateBeautyTraits(p);assert.equal(p.hiddenTraits.source,'random');
  assert.deepEqual(validateSave(JSON.parse(JSON.stringify(s))).harem.members.at(-1).hiddenTraits,p.hiddenTraits);
 }
});
test('a tour event character retains the same rare traits from preview to admission and saved palace roster',()=>{
 let s=newGame('巡游入宫固定');s.phase=2;s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury=100000;s.stats.treasury=100000;s=scheduleTravel(s,'tour','guannei').state;advance(s);s=beginTravel(s).state;
 const event={id:'tour-1-1',type:'bereaved',seed:0,status:'pending',choiceId:null,result:null,personId:'random-beauty-tour-1-1'};
 let preview;for(let seed=0;seed<200;seed++){event.seed=seed;preview=eventCompanion(s,event);if(preview.hiddenTraits.kinds.length)break;}
 assert.ok(preview.hiddenTraits.kinds.length);s.travel.pending.encounters=[event];s=validateSave(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(eventCompanion(s,s.travel.pending.encounters[0]).hiddenTraits,preview.hiddenTraits);
 const next=resolveTourEvent(s,event.id,'admit').state;
 assert.deepEqual(next.harem.members.at(-1).hiddenTraits,preview.hiddenTraits);
 assert.deepEqual(validateSave(JSON.parse(JSON.stringify(next))).harem.members.at(-1).hiddenTraits,preview.hiddenTraits);
});
test('hidden traits gate actual benefits instead of visible specialty or personality',()=>{
 const s=newGame('隐藏生效');s.turn=40;s.harem.streak=1;s.stats.health=50;s.stats.happiness=30;
 const p=s.harem.members[0];Object.assign(p,{randomBeauty:true,specialty:'医理、诗书、琴艺',personality:'温和机敏',hiddenTraits:{version:1,source:'random',kinds:[]},bond:{visits:6,lastVisitTurn:39,lastEventTurn:0,lifeGranted:0}});
 assert.equal(companyBond(s,p),'');assert.equal(educationBond(s,{id:'child',name:'皇嗣',motherId:p.id,learning:0}),'');assert.equal(s.harem.bonds.history.length,0);
 // A hidden education trait works even without a visible academic specialty.
 p.specialty='园艺';p.hiddenTraits.kinds=['education'];let earned=false;
 for(let seed=0;seed<100;seed++){
  const n=structuredClone(s);n.harem.portraitSeed=seed;const child={id:'child',name:'皇嗣',motherId:p.id,learning:0};
  if(educationBond(n,child)){assert.ok(child.learning>0);earned=true;break;}
 }
 assert.ok(earned);
});
test('trait corruption is rejected without silently rerolling the record',()=>{
 for(const change of [p=>p.hiddenTraits.version=2,p=>p.hiddenTraits.source='event',p=>p.hiddenTraits.kinds=['unknown'],p=>p.hiddenTraits.kinds=[],p=>p.hiddenTraits.kinds=['care','care'],p=>p.hiddenTraits.kinds=['care','advice','education'],p=>p.hiddenTraits=null]){
  const s=newGame('特性校验');change(s.harem.members[0]);assert.throws(()=>validateSave(s),/隐藏特性/);
 }
});
