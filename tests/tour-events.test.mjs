import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {scheduleTravel,beginTravel} from '../src/travel.mjs';
import {TOUR_EVENTS,createTourEncounters,nextTourEvent,resolveTourEvent,eventCompanion,tourRiskChance,tourChoiceBlock} from '../src/tour-events.mjs';
import {BEAUTIES,isActiveBeauty} from '../src/beauties.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {finishTravel} from '../src/travel-session.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {changeWelfare} from '../src/building-effects.mjs';
function starting(){let s=newGame('巡游事件');s.phase=2;s.createdAt='event-fixture';s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;s=scheduleTravel(s,'tour','guannei').state;advance(s);return beginTravel(s).state;}
function fixture(type,seed=0){const s=starting(),person=BEAUTIES.find(p=>p.origin==='原创'&&p.regionId==='sheng'&&!s.harem.members.some(m=>m.id===p.id));s.travel.pending.encounters=[{id:'tour-1-1',type,seed,status:'pending',choiceId:null,result:null,...(['bereaved','xia-yuhe'].includes(type)?{personId:person.id}:{})}];if(type==='xia-yuhe')s.travel.easterEggs.xiaYuheSeen=true;return s;}
test('all nineteen events and fifty-seven options settle into valid saves',t=>{
 t.mock.method(Math,'random',()=>.99);assert.equal(TOUR_EVENTS.length,19);
 for(const def of TOUR_EVENTS)for(const choice of def.choices){const s=fixture(def.id),before=structuredClone(s),e=nextTourEvent(s),r=resolveTourEvent(s,e.id,choice.id);assert.deepEqual(s,before);assert.equal(r.state.travel.pending.encounters[0].status,'resolved');assert.ok(r.message.includes(def.title));assert.doesNotThrow(()=>validateSave(r.state),`${def.id}/${choice.id}`);assert.throws(()=>resolveTourEvent(r.state,e.id,choice.id),/已处理/);}
});
test('three weighted events are unique, stable on reload, and recent events are downweighted',()=>{
 const s=starting(),first=structuredClone(s.travel.pending.encounters);assert.equal(first.length,3);assert.equal(new Set(first.map(e=>e.type)).size,3);assert.deepEqual(validateSave(structuredClone(s)).travel.pending.encounters,first);
 const a=createTourEncounters(s,s.travel.pending),b=createTourEncounters(s,s.travel.pending);assert.deepEqual(a,b);
 s.travel.history=[{encounters:a}];assert.notDeepEqual(createTourEncounters(s,s.travel.pending).map(e=>e.type),a.map(e=>e.type));
});
test('unhandled events prevent returning; all choices have a no-cash alternative',()=>{
 const s=starting();assert.throws(()=>finishTravel(s),/事件待处理/);
 for(const def of TOUR_EVENTS){const s=fixture(def.id);s.domestic.countries[0].fiscal.treasury=0;s.stats.treasury=0;assert.ok(def.choices.some(c=>!tourChoiceBlock(s,nextTourEvent(s),c)),def.id);}
});
test('petition applies finance, local welfare and judicial record without inventing an official conviction',()=>{
 const s=fixture('petition'),p=s.domestic.provinces.find(p=>p.id==='guannei'),cash=s.stats.treasury,loyalty=p.welfare.loyalty;
 const r=resolveTourEvent(s,'tour-1-1','review').state;assert.equal(r.stats.treasury,cash-1200);assert.equal(r.domestic.provinces.find(p=>p.id==='guannei').welfare.loyalty,Math.min(100,loyalty+8));assert.equal(r.domestic.justice.officials.length,s.domestic.justice.officials.length);assert.match(r.domestic.justice.history[0],/告御状/);
});
test('event-funded defenses persist through return-trip monthly settlement',t=>{
 t.mock.method(Math,'random',()=>.99);const s=fixture('flood'),before=s.domestic.provinces.find(p=>p.id==='guannei').welfare.defense;
 const next=resolveTourEvent(s,'tour-1-1','repair').state;assert.equal(next.domestic.provinces.find(p=>p.id==='guannei').welfare.defense,Math.min(100,before+5));
 const returned=finishTravel(next).state;assert.equal(returned.domestic.provinces.find(p=>p.id==='guannei').welfare.defense,Math.min(100,before+5));assert.doesNotThrow(()=>validateSave(returned));
});
test('risk depends on martial skill and guard preparation; failure clamps health/life',()=>{
 const s=fixture('assassin'),def=TOUR_EVENTS.find(e=>e.id==='assassin'),e=nextTourEvent(s),fight=def.choices.find(c=>c.id==='fight'),guards=def.choices[0];
 const weak=tourRiskChance(s,e,fight);s.stats.martial=500;assert.ok(tourRiskChance(s,e,fight)>weak);
 const unprepared=tourRiskChance(s,e,guards);s.domestic.centralArmy.training=100;changeWelfare(s.domestic.provinces.find(p=>p.id==='guannei'),'security',100);assert.ok(tourRiskChance(s,e,guards)>unprepared);
 let seed=0;while(portraitRandom(seed)()<.96)seed++;s.travel.pending.encounters[0].seed=seed;s.stats.martial=0;s.stats.health=2;s.stats.life=3;
 const result=resolveTourEvent(s,e.id,'fight').state;assert.equal(result.stats.life,0);assert.equal(result.stats.health,0);assert.ok(result.reignResult);assert.doesNotThrow(()=>validateSave(finishTravel(result).state));
});
test('bereaved adult can be aided without admission, or admitted once with usable harem identity',()=>{
 const s=fixture('bereaved'),candidate=eventCompanion(s,nextTourEvent(s));assert.ok(candidate.age>=18);const aid=resolveTourEvent(s,'tour-1-1','aid').state;assert.equal(aid.harem.members.length,s.harem.members.length);
 let admitted=resolveTourEvent(s,'tour-1-1','admit').state;const p=admitted.harem.members.find(p=>p.id===candidate.id);assert.ok(p);assert.ok(isActiveBeauty(p));assert.equal(p.travelOrigin.consented,true);assert.doesNotThrow(()=>validateSave(admitted));
 admitted=finishTravel(admitted).state;admitted.phase=1;assert.doesNotThrow(()=>validateSave(palaceAction(admitted,'company',{id:p.id}).state));
});
test('Xia Yuhe is a one-percent original-province cameo that survives history trimming and refusal',()=>{
 const s=starting(),trip=s.travel.pending;let hits=0;
 for(let i=0;i<2000;i++){s.createdAt='rare-distribution-'+i;s.travel.easterEggs.xiaYuheSeen=false;if(createTourEncounters(s,trip).some(e=>e.type==='xia-yuhe'))hits++;}
 assert.ok(hits>=5&&hits<=45,`expected about 1%, got ${hits}/2000`);
 s.travel.easterEggs.xiaYuheSeen=true;s.travel.history=[];for(let i=0;i<500;i++){s.createdAt='after-cameo-'+i;assert.ok(!createTourEncounters(s,trip).some(e=>e.type==='xia-yuhe'));}
 const refused=resolveTourEvent(fixture('xia-yuhe'),'tour-1-1','poetry').state;assert.equal(refused.travel.easterEggs.xiaYuheSeen,true);assert.equal(refused.harem.members.length,1);assert.doesNotThrow(()=>validateSave(refused));
});
test('Xia Yuhe has independent photo-referenced portrait and higher attributes through admission/reload',()=>{
 const s=fixture('xia-yuhe'),person=eventCompanion(s,nextTourEvent(s));assert.equal(person.name,'夏雨荷');assert.equal(person.appearance,98);assert.equal(person.experience,25);assert.equal(person.ability,110);assert.match(portraitDataUrl(person),/sketch-beauty-xia-yuhe-v3.png/);
 const r=validateSave(resolveTourEvent(s,'tour-1-1','admit').state),p=r.harem.members.find(p=>p.name==='夏雨荷');assert.equal(p.travelOrigin.easterEgg,'xia-yuhe');assert.equal(p.appearance,98);assert.match(portraitDataUrl(p),/v3.png/);assert.equal(r.travel.easterEggs.xiaYuheSeen,true);
 const bad=structuredClone(r);bad.travel.easterEggs.xiaYuheSeen=false;assert.throws(()=>validateSave(bad),/巡游事件/);
});
test('failed storage cannot publish event rewards and retry commits only once',()=>{
 const s=fixture('bereaved'),original=structuredClone(s),r=resolveTourEvent(s,'tour-1-1','admit');assert.throws(()=>persistCandidate(s,r.state,{setItem(){throw Error('full');}}),/保存失败/);assert.deepEqual(s,original);
 const saved=persistCandidate(s,r.state,{setItem(){}});assert.equal(saved.harem.members.length,2);assert.throws(()=>resolveTourEvent(saved,'tour-1-1','admit'),/已处理/);
});
test('corrupt event identifiers, ordering and duplicate rare appearances are rejected',()=>{
 const s=starting();for(const alter of [s=>s.travel.pending.encounters[0].id='wrong',s=>s.travel.pending.encounters[0].type='unknown',s=>s.travel.pending.encounters[0].seed=-1,s=>s.travel.pending.encounters[0].status='resolved',s=>s.travel.pending.encounters[1].type=s.travel.pending.encounters[0].type]){const bad=structuredClone(s);alter(bad);assert.throws(()=>validateSave(bad),/巡游事件/);}
});

test('prestige retains values above 100, caps at 500, and survives save reload',()=>{
 assert.equal(newGame('初始威望').stats.prestige,50);
 for(const [before,expected] of [[100,101],[499,500],[500,500]]){
  const s=fixture('craftsmen');s.domestic.countries[0].prestige=before;s.stats.prestige=before;
  const result=resolveTourEvent(s,nextTourEvent(s).id,'praise').state;
  assert.equal(result.stats.prestige,expected);
  assert.equal(validateSave(JSON.parse(JSON.stringify(result))).stats.prestige,expected);
 }
 const bad=newGame('无效威望');bad.domestic.countries[0].prestige=501;
 assert.throws(()=>validateSave(bad));
});
