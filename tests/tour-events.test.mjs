import {TOUR_CAMEOS,tourCameo,markCameoSeen} from '../src/tour-cameos.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {scheduleTravel,beginTravel} from '../src/travel.mjs';
import {TOUR_EVENTS,createTourEncounters,nextTourEvent,resolveTourEvent,eventCompanion,tourRiskChance,tourChoiceBlock} from '../src/tour-events.mjs';
import {BEAUTIES,isActiveBeauty} from '../src/beauties.mjs';
import {portraitDataUrl} from '../src/beauty-raster-portrait.mjs';
import {portraitRandom} from '../src/beauty-portrait.mjs';
import {palaceAction,settleRoyalFamily} from '../src/emperor.mjs';
import {finishTravel} from '../src/travel-session.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {changeWelfare} from '../src/building-effects.mjs';
function starting(){let s=newGame('巡游事件');s.phase=2;s.createdAt='event-fixture';s.domestic.countries[0].fiscal.treasury=100000;s.stats.treasury=100000;s=scheduleTravel(s,'tour','guannei').state;advance(s);return beginTravel(s).state;}
function fixture(type,seed=0){const s=starting();if(tourCameo(type)?.eligibleProvinces)s.travel.pending.provinceId=tourCameo(type).eligibleProvinces[0];const person=BEAUTIES.find(p=>p.origin==='原创'&&p.regionId==='sheng'&&!s.harem.members.some(m=>m.id===p.id));s.travel.pending.encounters=[{id:'tour-1-1',type,seed,status:'pending',choiceId:null,result:null,...(type==='bereaved'||tourCameo(type)?{personId:tourCameo(type)?.featuredId??(tourCameo(type)&&type!=='xia-yuhe'?'random-beauty-tour-1-1':person.id)}:{})}];if(tourCameo(type))markCameoSeen(s,type);return s;}
test('all configured events and choices settle into valid saves',t=>{
 t.mock.method(Math,'random',()=>.99);assert.equal(TOUR_EVENTS.length,42);
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
 const s=fixture('xia-yuhe'),person=eventCompanion(s,nextTourEvent(s));assert.equal(person.name,'夏雨荷');assert.equal(person.appearance,98);assert.equal(person.experience,25);assert.equal(person.ability,110);assert.match(portraitDataUrl(person),/assets\/beauties\/special\/sketch-beauty-xia-yuhe-transparent-v6.png/);
 const r=validateSave(resolveTourEvent(s,'tour-1-1','admit').state),p=r.harem.members.find(p=>p.name==='夏雨荷');assert.equal(p.travelOrigin.easterEgg,'xia-yuhe');assert.equal(p.appearance,98);assert.match(portraitDataUrl(p),/xia-yuhe-transparent-v6.png/);assert.equal(r.travel.easterEggs.xiaYuheSeen,true);
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

test('ordinary tour companions generate beyond the archived pool and preserve independent abilities',()=>{
 const s=starting();s.harem.seen=BEAUTIES.map(p=>p.id);
 let found;
 for(let i=0;i<100;i++){s.createdAt=`generated-tour-${i}`;const a=createTourEncounters(structuredClone(s),s.travel.pending),b=createTourEncounters(structuredClone(s),s.travel.pending);assert.deepEqual(a,b);found=a.find(e=>e.type==='bereaved');if(found)break;}
 assert.ok(found);assert.match(found.personId,/^random-beauty-tour-/);
 // Put the chosen encounter first while preserving the event ID contract.
 found.id='tour-1-1';s.travel.pending.encounters=[found];
 const p=eventCompanion(s,found);assert.ok(p.baseAbility>=20&&p.baseAbility<=200);assert.ok(p.appearance>=30&&p.appearance<=100);
 assert.deepEqual(eventCompanion(validateSave(structuredClone(s)),found),p);
 let admitted=resolveTourEvent(s,found.id,'admit').state;admitted=validateSave(JSON.parse(JSON.stringify(admitted)));
 assert.equal(admitted.harem.members.find(m=>m.id===p.id).baseAbility,p.baseAbility);
});

test('every unseen cameo retains its own one-percent interval, without redistributing seen chances',()=>{
 const s=starting(),trip=s.travel.pending;trip.provinceId='hebei';const counts=Object.fromEntries(TOUR_CAMEOS.map(c=>[c.id,0]));
 for(let i=0;i<10000;i++){
  s.createdAt=`cameo-distribution-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};
  const first=createTourEncounters(s,trip),rare=first.filter(e=>tourCameo(e.type));
  assert.ok(rare.length<=1);
  if(rare.length){const id=rare[0].type;counts[id]++;assert.equal(first[2].type,id);
   // Only the chosen interval is suppressed; it is not rerolled into another character.
   assert.ok(!createTourEncounters(s,trip).some(e=>tourCameo(e.type)));
  }
 }
 for(const [id,n]of Object.entries(counts)){const c=tourCameo(id);if(c.eligibleProvinces&&!c.eligibleProvinces.includes(trip.provinceId))assert.equal(n,0);else assert.ok(n>=65&&n<=135,`${id}: ${n}/10000`);}
 s.travel.easterEggs={xiaYuheSeen:true,cameosSeen:TOUR_CAMEOS.slice(1).map(c=>c.id)};
 for(let i=0;i<100;i++){s.createdAt=`all-seen-${i}`;assert.ok(!createTourEncounters(s,trip).some(e=>tourCameo(e.type)));}
 s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};trip.provinceId='japan-core';
 for(let i=0;i<200;i++){s.createdAt=`foreign-cameo-${i}`;assert.ok(!createTourEncounters(s,trip).some(e=>tourCameo(e.type)));}
});

test('new cameos retain identities, dedicated portraits, consent and seen markers after admission/reload or refusal',()=>{
 for(const c of TOUR_CAMEOS.slice(1)){
  const s=fixture(c.id),candidate=eventCompanion(s,nextTourEvent(s));
  assert.equal(candidate.name,c.name);assert.ok(candidate.age>=18);assert.equal(candidate.travelOrigin.easterEgg,c.id);
  assert.ok(portraitDataUrl(candidate).endsWith(c.portraitAsset));
  let admitted=resolveTourEvent(s,'tour-1-1','admit').state;
  admitted=validateSave(JSON.parse(JSON.stringify(admitted)));
  const person=admitted.harem.members.find(p=>p.id===candidate.id);
  assert.ok(isActiveBeauty(person));assert.equal(person.travelOrigin.consented,!c.forceAdmission);
  assert.equal(portraitDataUrl(person),c.arrivalPregnancy?new URL('../'+c.pregnantPortraitAsset,import.meta.url).href:portraitDataUrl(candidate));
  admitted=finishTravel(admitted).state;admitted.travel.history=[];
  assert.ok(validateSave(admitted).travel.easterEggs.cameosSeen.includes(c.id));
  const refused=resolveTourEvent(s,'tour-1-1','part').state;
  assert.equal(refused.harem.members.length,s.harem.members.length);
  assert.ok(validateSave(refused).travel.easterEggs.cameosSeen.includes(c.id));
  const bad=structuredClone(refused);bad.travel.easterEggs.cameosSeen=[];
  assert.throws(()=>validateSave(bad),/巡游事件/);
  const duplicate=structuredClone(admitted);duplicate.harem.members.push({...person,id:'random-beauty-tour-999-3'});
  assert.throws(()=>validateSave(duplicate));
 }
});

test('older saves migrate cameo markers without changing Xia Yuhe and reject corrupted marker lists',()=>{
 const s=fixture('xia-yuhe');delete s.travel.easterEggs.cameosSeen;
 const migrated=validateSave(JSON.parse(JSON.stringify(s)));
 assert.equal(migrated.travel.easterEggs.xiaYuheSeen,true);assert.deepEqual(migrated.travel.easterEggs.cameosSeen,[]);
 for(const markers of [['unknown'],['shen-fang','shen-fang'],'shen-fang']){
  const bad=structuredClone(migrated);bad.travel.easterEggs.cameosSeen=markers;
  assert.throws(()=>validateSave(bad),/巡游事件/);
 }
});

test('Huang Rong reveals her true identity only through admission and retains her formal portrait after reload',()=>{
 const c=tourCameo('huang-rong');assert.equal(c.actor,'翁美玲');assert.equal(c.encounterName,'小乞丐');
 assert.notEqual(c.encounterPortraitAsset,c.portraitAsset);
 const s=fixture(c.id),person=eventCompanion(s,nextTourEvent(s));
 assert.equal(person.name,'黄蓉');assert.ok(person.age>=18);
 const admitted=resolveTourEvent(s,'tour-1-1','admit');
 assert.match(admitted.message,/恢复了本来容貌/);
 const loaded=validateSave(JSON.parse(JSON.stringify(admitted.state)));
 assert.ok(portraitDataUrl(loaded.harem.members.find(p=>p.name==='黄蓉')).endsWith(c.portraitAsset));
 for(const choice of ['part','patron']){
  const refused=resolveTourEvent(s,'tour-1-1',choice);
  assert.ok(!refused.message.includes('恢复了本来容貌'));
  assert.ok(!refused.state.harem.members.some(p=>p.name==='黄蓉'));
  assert.ok(validateSave(refused.state).travel.easterEggs.cameosSeen.includes(c.id));
 }
});


test('Huang Rong can only be generated in Hebei, where the Zhangjiakou first meeting is set',()=>{
 const c=tourCameo('huang-rong');assert.deepEqual(c.eligibleProvinces,['hebei']);assert.equal(c.encounterCity,'张家口');
 const s=starting(),trip=s.travel.pending;
 for(const provinceId of ['hebei','henan','huainan','jiangnan','lingnan','hedong','guannei','shannan','jiannan','longyou']){
  let hits=0;trip.provinceId=provinceId;
  for(let i=0;i<5000;i++){
   s.createdAt=`huang-rong-place-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};
   if(createTourEncounters(s,trip).some(e=>e.type===c.id))hits++;
  }
  if(provinceId==='hebei')assert.ok(hits>=20&&hits<=85,`Hebei should be about 1%, got ${hits}/5000`);
  else assert.equal(hits,0,provinceId+' must not generate Huang Rong');
 }
 const local=fixture('huang-rong'),person=eventCompanion(local,nextTourEvent(local));
 assert.equal(person.travelOrigin.provinceId,'hebei');assert.equal(person.cityId,'jiangnan');
});

test('two imperial encounters occur only in their source locations at an independent one percent',()=>{
 const places={'gouyi-furen':['hebei','河间'],'zhu-yunqiao':['jiangnan','苏州']};
 const s=starting(),trip=s.travel.pending;
 for(const [id,[province,city]]of Object.entries(places)){
  const c=tourCameo(id);assert.deepEqual(c.eligibleProvinces,[province]);assert.equal(c.encounterCity,city);
  for(const provinceId of ['hebei','henan','huainan','jiangnan','lingnan','hedong','guannei','shannan','jiannan','longyou']){
   trip.provinceId=provinceId;let hits=0;
   for(let i=0;i<5000;i++){
    s.createdAt=`new-cameo-place-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};
    if(createTourEncounters(s,trip).some(e=>e.type===id))hits++;
   }
   if(provinceId===province)assert.ok(hits>=20&&hits<=85,`${id}: ${hits}/5000`);else assert.equal(hits,0,`${id} in ${provinceId}`);
  }
 }
 assert.equal(tourCameo('zhu-yunqiao').actor,'蒋勤勤');
});

test('Li Fengjie returns to the ordinary roster and retired tour saves remain readable',()=>{
 assert.equal(tourCameo('li-fengjie'),undefined);assert.ok(!TOUR_EVENTS.some(e=>e.id==='li-fengjie'));
 const base=BEAUTIES.find(p=>p.id==='featured-li-fengjie');assert.ok(base.portraitAsset.endsWith('li-fengjie-v4.png'));
 const s=starting();s.travel.easterEggs.cameosSeen=['li-fengjie'];
 s.travel.pending.encounters=['petition','li-fengjie','school'].map((type,i)=>({id:`tour-${s.travel.pending.id}-${i+1}`,type,seed:1,status:'pending',choiceId:null,result:null,...(type==='li-fengjie'?{personId:base.id}:{})}));
 s.harem.members.push({...structuredClone(base),rank:null,randomBeauty:true,travelOrigin:{easterEgg:'li-fengjie'}});
 const loaded=validateSave(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(loaded.travel.pending.encounters.map(e=>e.type),['petition','school']);
 assert.deepEqual(loaded.travel.pending.encounters.map(e=>e.id),[`tour-${s.travel.pending.id}-1`,`tour-${s.travel.pending.id}-2`]);
 assert.ok(!loaded.travel.easterEggs.cameosSeen.includes('li-fengjie'));
 const person=loaded.harem.members.find(p=>p.id===base.id);assert.equal(person.travelOrigin.easterEgg,undefined);assert.ok(portraitDataUrl(person).endsWith('li-fengjie-v4.png'));
 assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(loaded))));
});


test('commoner abduction immediately admits once, applies actual penalties and survives reload and history trimming',()=>{
 for(const id of ['fanfan','shao-yuqi','chen-lijun','yeye','song-xin','xuan-ai','xiao-xuan','xiaoxuan','qiuqiu','duoduo']){
  const s=fixture(id),p=s.domestic.provinces.find(p=>p.id===s.travel.pending.provinceId),before=p.welfare.loyalty,prestige=s.stats.prestige;
  const result=resolveTourEvent(s,'tour-1-1','admit');
  const person=result.state.harem.members.find(p=>p.travelOrigin?.easterEgg===id);
  assert.ok(person);assert.equal(person.travelOrigin.consented,false);
  assert.equal(result.state.harem.encounter,null);
  assert.equal(result.state.domestic.provinces.find(x=>x.id===p.id).welfare.loyalty,Math.max(0,before-8));
  assert.equal(result.state.stats.prestige,Math.max(0,prestige-3));
  assert.ok(!result.message.includes('自愿'));
  assert.throws(()=>resolveTourEvent(result.state,'tour-1-1','admit'),/已处理/);
  let loaded=validateSave(JSON.parse(JSON.stringify(result.state)));
  assert.ok(portraitDataUrl(loaded.harem.members.find(p=>p.id===person.id)).endsWith(tourCameo(id).portraitAsset));
  loaded=finishTravel(loaded).state;loaded.travel.history=[];
  for(let i=0;i<1000;i++){
   loaded.createdAt=`commoner-once-${i}`;
   assert.ok(!createTourEncounters(loaded,{id:i+2,provinceId:'guannei'}).some(e=>e.type===id));
  }
  for(const choice of ['part']){
   const declined=resolveTourEvent(s,'tour-1-1',choice).state;
   assert.equal(declined.harem.members.length,s.harem.members.length);
   assert.ok(validateSave(JSON.parse(JSON.stringify(declined))).travel.easterEggs.cameosSeen.includes(id));
  }
 }
});


test('commoner encounters have separate serious portraits while palace rendering retains the happy full-face portrait',()=>{
 for(const id of ['fanfan','shao-yuqi','chen-lijun','yeye','song-xin']){
  const c=tourCameo(id);assert.ok(c.encounterPortraitAsset);assert.notEqual(c.encounterPortraitAsset,c.portraitAsset);
  const s=fixture(id),admitted=validateSave(resolveTourEvent(s,'tour-1-1','admit').state);
  const person=admitted.harem.members.find(p=>p.travelOrigin?.easterEgg===id);
  assert.ok(portraitDataUrl(person).endsWith(c.portraitAsset));
  assert.ok(!portraitDataUrl(person).endsWith(c.encounterPortraitAsset));
 }
});


test('all commoner events offer exactly abduction or abandonment, with no third action',()=>{
 for(const id of ['fanfan','shao-yuqi','chen-lijun','yeye','song-xin','xuan-ai','xiao-xuan','xiaoxuan','qiuqiu','duoduo']){
  const def=TOUR_EVENTS.find(e=>e.id===id);assert.deepEqual(def.choices.map(c=>c.id),['admit','part']);assert.equal(def.choices[1].label,'放弃');
  const s=fixture(id),before=structuredClone(s);assert.throws(()=>resolveTourEvent(s,'tour-1-1','patron'),/处置无效/);assert.deepEqual(s,before);
  const abandoned=resolveTourEvent(s,'tour-1-1','part').state;
  assert.equal(abandoned.stats.treasury,s.stats.treasury);assert.equal(abandoned.harem.members.length,s.harem.members.length);
 }
});
test('retired reward-and-release results remain readable in old saves but cannot be chosen again',()=>{
 for(const id of ['fanfan','shao-yuqi']){
  const s=fixture(id);Object.assign(s.travel.pending.encounters[0],{status:'resolved',choiceId:'patron',result:'旧版赏银放行：国库-100两，当地民心+2。'});
  assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(s))));
  assert.throws(()=>resolveTourEvent(s,'tour-1-1','patron'),/已处理/);
 }
 const invalid=fixture('chen-lijun');Object.assign(invalid.travel.pending.encounters[0],{status:'resolved',choiceId:'patron',result:'无效第三选项'});assert.throws(()=>validateSave(invalid),/巡游事件/);
});

test('renamed commoners migrate existing palace members and travel logs without resetting seen markers',()=>{
 for(const [id,oldName,newName] of [['shao-yuqi','邵雨琪','邵琪琪'],['chen-lijun','陈丽君','阿育娅']]){
  assert.equal(tourCameo(id).name,newName);
  const admitted=resolveTourEvent(fixture(id),'tour-1-1','admit').state;
  const person=admitted.harem.members.find(p=>p.travelOrigin?.easterEgg===id);
  person.name=oldName;person.biography=`${oldName}在路上相逢。美术参考陈丽君年轻成年时期的容貌。`;
  admitted.travel.pending.encounters[0].result=`入宫安置·${oldName}：已经录入后宫名册。`;
  admitted.harem.history=[`第2旬：${oldName}入宫。`];
  const markers=structuredClone(admitted.travel.easterEggs);
  let loaded=validateSave(JSON.parse(JSON.stringify(admitted)));
  assert.equal(loaded.harem.members.find(p=>p.id===person.id).name,newName);
  assert.ok(!loaded.harem.members.find(p=>p.id===person.id).biography.includes(oldName));
  assert.ok(loaded.travel.pending.encounters[0].result.includes(newName));
  assert.ok(loaded.harem.history[0].includes(newName));
  assert.deepEqual(loaded.travel.easterEggs,markers);
  loaded=validateSave(JSON.parse(JSON.stringify(loaded)));
  assert.equal(loaded.harem.members.find(p=>p.id===person.id).name,newName);
  loaded=finishTravel(loaded).state;
  loaded.travel.history[0].message=`起驾回宫，${oldName}入宫。`;
  assert.ok(validateSave(JSON.parse(JSON.stringify(loaded))).travel.history[0].message.includes(newName));
 }
});


test('the eight new characters belong to distinct cities and appear only in their own tour region',()=>{
 const locations=[['fanfan','huainan','扬州'],['shao-yuqi','shannan','襄阳'],['chen-lijun','longyou','凉州'],['yeye','jiannan','成都'],['song-xin','jiangnan','杭州'],['youyou','lingnan','广州'],['susu','henan','洛阳'],['ruoxi','hedong','太原']];
 const provinces=['hebei','henan','huainan','jiangnan','lingnan','hedong','guannei','shannan','jiannan','longyou'];
 const s=starting(),trip=s.travel.pending;
 assert.equal(new Set(locations.map(([,province])=>province)).size,8);
 for(const [id,region,city]of locations){
  const c=tourCameo(id);assert.deepEqual(c.eligibleProvinces,[region]);assert.equal(c.homeCityId,region);assert.equal(c.encounterCity,city);
  assert.ok(c.title.includes(city));assert.ok(c.story.includes(city));
  for(const provinceId of provinces){
   trip.provinceId=provinceId;let hits=0;
   for(let i=0;i<5000;i++){
    s.createdAt=`commoner-location-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};
    if(createTourEncounters(s,trip).some(e=>e.type===id))hits++;
   }
   if(provinceId===region)assert.ok(hits>=20&&hits<=85,`${id}: ${hits}/5000`);else assert.equal(hits,0,`${id} must not occur in ${provinceId}`);
  }
  const local=fixture(id),person=eventCompanion(local,nextTourEvent(local));assert.equal(person.cityId,region);assert.equal(person.travelOrigin.provinceId,region);
  s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[id]};trip.provinceId=region;
  for(let i=0;i<500;i++){s.createdAt=`commoner-location-seen-${i}`;assert.ok(!createTourEncounters(s,trip).some(e=>e.type===id));}
 }
});

test('original invitations have two choices, voluntary immediate admission and no coercion penalties',()=>{
 for(const id of ['youyou','susu','ruoxi']){
  const s=fixture(id),event=nextTourEvent(s),def=TOUR_EVENTS.find(d=>d.id===id),before=s.domestic.provinces.find(p=>p.id===s.travel.pending.provinceId).welfare.loyalty,prestige=s.stats.prestige;
  assert.deepEqual(def.choices.map(c=>c.label),['邀请入宫','放弃']);
  assert.equal(eventCompanion(s,event).travelOrigin.consented,true);
  const r=resolveTourEvent(s,event.id,'admit').state;
  assert.ok(r.harem.members.some(p=>p.travelOrigin?.easterEgg===id&&p.travelOrigin.consented));
  assert.equal(r.domestic.provinces.find(p=>p.id===s.travel.pending.provinceId).welfare.loyalty,before);assert.equal(r.stats.prestige,prestige);
  assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(r))));
  const refused=resolveTourEvent(s,event.id,'part').state;assert.ok(refused.travel.easterEggs.cameosSeen.includes(id));assert.ok(!refused.harem.members.some(p=>p.travelOrigin?.easterEgg===id));
 }
});

test('Susu arrives pregnant and delivers exactly once next turn, with either gender and persisted portraits',()=>{
 for(const [draw,gender]of [[0,'男'],[.999,'女']]){
  const s=fixture('susu'),event=nextTourEvent(s);
  let r=resolveTourEvent(s,event.id,'admit').state;
  const mother=r.harem.members.find(p=>p.travelOrigin?.easterEgg==='susu');
  assert.deepEqual(mother.pregnancy,{conceivedTurn:r.turn,arrivalDueTurn:r.turn+1});
  assert.ok(portraitDataUrl(mother).endsWith('susu-pregnant-v1.png'));
  assert.throws(()=>palaceAction(r,'company',{id:mother.id}),/怀胎/);
  r=validateSave(JSON.parse(JSON.stringify(r)));
  settleRoyalFamily(r,()=>draw);assert.equal(r.harem.children.length,0);
  r.turn++;settleRoyalFamily(r,()=>draw);
  const p=r.harem.members.find(p=>p.id===mother.id),child=r.harem.children.find(c=>c.motherId===p.id);
  assert.equal(child.gender,gender);assert.equal(child.age,0);assert.equal(child.birthTurn,r.turn);assert.equal(child.status,'palace');assert.equal(p.pregnancy,undefined);
  assert.ok(portraitDataUrl(p).endsWith('susu-v1.png'));assert.ok(r.harem.royalNotices.some(n=>n.kind==='birth'&&n.message.includes('苏苏')));
  r=validateSave(JSON.parse(JSON.stringify(r)));settleRoyalFamily(r,()=>draw);assert.equal(r.harem.children.length,1);
  r.turn++;settleRoyalFamily(r,()=>.999);assert.equal(r.harem.children.length,1);
  const refused=resolveTourEvent(s,event.id,'part').state;refused.turn++;settleRoyalFamily(refused,()=>draw);assert.equal(refused.harem.children.length,0);
 }
});
test('Susu arrival due date is validated, other pregnancies retain ordinary rules',()=>{
 const s=fixture('susu'),r=resolveTourEvent(s,nextTourEvent(s).id,'admit').state,p=r.harem.members.at(-1);
 p.pregnancy.arrivalDueTurn+=2;assert.throws(()=>validateSave(r),/孕期存档/);
 const normal=fixture('youyou'),n=resolveTourEvent(normal,nextTourEvent(normal).id,'admit').state,m=n.harem.members.at(-1);
 m.pregnancy={conceivedTurn:n.turn};n.turn++;settleRoyalFamily(n,()=>.999);assert.ok(m.pregnancy);assert.equal(n.harem.children.length,0);
 m.pregnancy.arrivalDueTurn=m.pregnancy.conceivedTurn+1;assert.throws(()=>validateSave(n),/孕期存档/);
});

 test('Xuan Ai is exclusive to Changan in Guannei, a city without another forced encounter',()=>{
 const c=tourCameo('xuan-ai');assert.equal(c.name,'旋爱');assert.equal(c.encounterCity,'长安');assert.equal(c.age,25);
 assert.deepEqual(c.eligibleProvinces,['guannei']);
 assert.ok(!TOUR_CAMEOS.some(other=>other.id!==c.id&&other.forceAdmission&&other.encounterCity===c.encounterCity));
 const s=starting(),trip=s.travel.pending;
 for(const provinceId of ['guannei','henan','hedong','huainan','jiangnan','lingnan','shannan','jiannan','longyou','hebei']){
 trip.provinceId=provinceId;let hits=0;
 for(let i=0;i<2000;i++){s.createdAt=`xuan-ai-location-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};if(createTourEncounters(s,trip).some(e=>e.type===c.id))hits++;}
 if(provinceId==='guannei')assert.ok(hits>0);else assert.equal(hits,0);
 }
 });

test('Xiao Xuan is exclusive to Taiyuan, with independent identity and her approved transparent gown portrait',()=>{
 const c=tourCameo('xiao-xuan');assert.equal(c.name,'小璇');assert.equal(c.age,25);assert.equal(c.encounterCity,'太原');assert.equal(c.homeCityId,'hedong');assert.deepEqual(c.eligibleProvinces,['hedong']);
 assert.ok(!TOUR_CAMEOS.some(other=>other.id!==c.id&&other.forceAdmission&&other.encounterCity===c.encounterCity));
 assert.notEqual(c.portraitAsset,tourCameo('xuan-ai').portraitAsset);
 const s=starting(),trip=s.travel.pending;
 for(const provinceId of ['guannei','henan','hedong','huainan','jiangnan','lingnan','shannan','jiannan','longyou','hebei']){
 trip.provinceId=provinceId;let hits=0;
 for(let i=0;i<2000;i++){s.createdAt=`xiao-xuan-location-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};if(createTourEncounters(s,trip).some(e=>e.type===c.id))hits++;}
 if(provinceId==='hedong')assert.ok(hits>0);else assert.equal(hits,0);
 }
 const admitted=validateSave(resolveTourEvent(fixture(c.id),'tour-1-1','admit').state);
 const p=admitted.harem.members.find(p=>p.travelOrigin?.easterEgg===c.id);assert.equal(p.name,'小璇');assert.ok(portraitDataUrl(p).endsWith(c.portraitAsset));
});

test('Xiaoxuan is exclusive to Luoyang without a prior forced encounter and remains distinct from Xiao Xuan',()=>{
 const c=tourCameo('xiaoxuan');assert.equal(c.name,'晓璇');assert.equal(c.age,25);assert.equal(c.encounterCity,'洛阳');assert.equal(c.homeCityId,'henan');assert.deepEqual(c.eligibleProvinces,['henan']);
 assert.ok(!TOUR_CAMEOS.some(other=>other.id!==c.id&&other.forceAdmission&&other.encounterCity===c.encounterCity));
 assert.notEqual(c.portraitAsset,tourCameo('xiao-xuan').portraitAsset);assert.notEqual(c.name,tourCameo('xiao-xuan').name);
 const s=starting(),trip=s.travel.pending;
 for(const provinceId of ['guannei','henan','hedong','huainan','jiangnan','lingnan','shannan','jiannan','longyou','hebei']){
 trip.provinceId=provinceId;let hits=0;
 for(let i=0;i<2000;i++){s.createdAt=`xiaoxuan-location-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};if(createTourEncounters(s,trip).some(e=>e.type===c.id))hits++;}
 if(provinceId==='henan')assert.ok(hits>0);else assert.equal(hits,0);
 }
 const admitted=validateSave(resolveTourEvent(fixture(c.id),'tour-1-1','admit').state);
 const p=admitted.harem.members.find(p=>p.travelOrigin?.easterEgg===c.id);assert.equal(p.name,'晓璇');assert.ok(portraitDataUrl(p).endsWith(c.portraitAsset));
});

test('Qiuqiu and Duoduo use independent art and cities without other forced encounters',()=>{
 for(const [id,name,province,city] of [['qiuqiu','邱邱','hebei','河间'],['duoduo','朵朵','lingnan','广州']]){
 const c=tourCameo(id);assert.equal(c.name,name);assert.equal(c.age,25);assert.equal(c.encounterCity,city);assert.equal(c.homeCityId,province);assert.deepEqual(c.eligibleProvinces,[province]);
 assert.ok(!TOUR_CAMEOS.some(other=>other.id!==id&&other.forceAdmission&&other.encounterCity===city));
 const s=starting(),trip=s.travel.pending;
 for(const provinceId of ['guannei','henan','hedong','huainan','jiangnan','lingnan','shannan','jiannan','longyou','hebei']){
 trip.provinceId=provinceId;let hits=0;
 for(let i=0;i<2000;i++){s.createdAt=`${id}-location-${i}`;s.travel.easterEggs={xiaYuheSeen:false,cameosSeen:[]};if(createTourEncounters(s,trip).some(e=>e.type===id))hits++;}
 if(provinceId===province)assert.ok(hits>0);else assert.equal(hits,0);
 }
 const admitted=validateSave(resolveTourEvent(fixture(id),'tour-1-1','admit').state);
 const p=admitted.harem.members.find(p=>p.travelOrigin?.easterEgg===id);assert.equal(p.name,name);assert.ok(portraitDataUrl(p).endsWith(c.portraitAsset));
 }
 assert.notEqual(tourCameo('qiuqiu').portraitAsset,tourCameo('duoduo').portraitAsset);
});
