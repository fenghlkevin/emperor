import test from 'node:test';import assert from 'node:assert/strict';import {newGame,advance,validateSave} from '../src/game.mjs';import {initializeResourceEconomy} from '../src/province-resources.mjs';import {enableOfficialProduction} from '../src/official-production.mjs';import {startConstruction} from '../src/construction.mjs';import {beginProjectLabor} from '../src/project-labor.mjs';import {configureProjectWork,quoteProjectWork} from '../src/project-work-orders.mjs';import {persistCandidate} from '../src/persistence.mjs';import {projectWorkControls} from '../src/project-work-ui.mjs';
function game(){let s=newGame('工效');initializeResourceEconomy(s.domestic);enableOfficialProduction(s.domestic,1);s.domestic.disasters.seed=1;const deputy=s.domestic.justice.officials.find(o=>(o.positionId??o.id)==='works-deputy');deputy.positionId=null;const o=s.domestic.justice.officials.find(o=>(o.positionId??o.id)==='works-minister');Object.assign(o,{politics:100,intelligence:100,experience:100});s=startConstruction(s,'hebei','temples').state;return s;}
test('high works ability and rush share cap; redundant 2x investment is normalized to cheaper 1.5x staffing',()=>{let s=game();const q=quoteProjectWork(s,'hebei','construction',{mode:2,duration:1});assert.equal(q.speed,2);assert.equal(q.workers,150);assert.equal(q.perTurn,20);assert.equal(q.mode,1);s=configureProjectWork(s,'hebei','construction',{mode:2,duration:1}).state;assert.equal(s.domestic.provinces[0].construction.project.workOrder.mode,1);const before=s.stats.treasury,next=structuredClone(s);advance(next);s=persistCandidate(s,next,{getItem:()=>null,setItem:()=>{}});const p=s.domestic.provinces[0],r=p.projectLabor.allocations[0];assert.equal(p.construction.project.progress,2);assert.equal(r.granted,150);assert.equal(r.expense,20);assert.equal(r.officerEffect.baseSpeed,1.5);assert.equal(r.officerEffect.applied,.5);assert.equal(r.speed,2);assert.match(projectWorkControls(s,p,'construction'),/当旬工部/);validateSave(structuredClone(s));});
test('normal work gets bounded organization gain without rush fee or morale charge; attribution survives reassignment',()=>{const s=game(),d=s.domestic,p=d.provinces[0];beginProjectLabor(d,2);s.turn=2;const r=p.projectLabor.allocations[0];assert.equal(r.speed,1.5);assert.equal(r.granted,100);assert.equal(r.expense,0);assert.equal(p.projectLaborPressure.loss,0);const record=structuredClone(r.officerEffect),o=d.justice.officials.find(o=>(o.positionId??o.id)==='works-minister');o.positionId=null;assert.deepEqual(r.officerEffect,record);validateSave(structuredClone(s));const bad=structuredClone(s);bad.domestic.provinces[0].projectLabor.allocations[0].officerEffect.applied=1;assert.throws(()=>validateSave(bad),/官效/);});
test('no extra labor or money cannot bypass rush cost even with good officer; disaster still pauses all work',()=>{let s=game();s=configureProjectWork(s,'hebei','construction',{mode:1,duration:1}).state;const d=s.domestic,p=d.provinces[0];d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury=0;beginProjectLabor(d,2);let r=p.projectLabor.allocations[0];assert.equal(r.mode,0);assert.equal(r.expense,0);assert.equal(r.speed,1.5);s=game();const p2=s.domestic.provinces[0];p2.disaster={kind:'fire',startTurn:1,endTurn:3};beginProjectLabor(s.domestic,2);r=p2.projectLabor.allocations[0];assert.equal(r.speed,0);assert.equal(r.officerEffect.applied,0);assert.equal(r.expense,0);});
test('land development uses only the serving local governor; vacancy has no bonus',async()=>{
 const {workOfficerEffect}=await import('../src/official-effects.mjs');
 const s=game(),d=s.domestic,p=d.provinces[0];
 const governor={id:'development-governor',positionId:`${p.id}-governor`,provinceId:p.id,status:'serving',name:'开垦刺史',politics:100,intelligence:100,experience:100,integrity:100};
 d.justice.officials=d.justice.officials.filter(o=>(o.positionId??o.id)!==`${p.id}-governor`);
 assert.equal(workOfficerEffect(d,p,'development').bonus,0);
 d.justice.officials.push(governor);
 assert.equal(workOfficerEffect(d,p,'development').bonus,.5);
 const minister=d.justice.officials.find(o=>(o.positionId??o.id)==='works-minister');minister.politics=0;
 assert.equal(workOfficerEffect(d,p,'development').bonus,.5);
 assert.equal(workOfficerEffect(d,p,'construction').bonus,0);
 p.development.project={id:999,industry:'agriculture',area:100,progress:0,startedTurn:1,ownerId:p.countryId};
 beginProjectLabor(d,2);
 const row=p.projectLabor.allocations.find(r=>r.kind==='development');
 assert.equal(row.officerEffect.id,governor.id);
 assert.equal(row.speed,1); // A one-turn project cannot complete before the next settlement.
 assert.match(projectWorkControls(s,p,'development'),/刺史开垦刺史/);
 governor.status='imprisoned';assert.equal(workOfficerEffect(d,p,'development').bonus,0);
 governor.status='serving';governor.provinceId='henan';assert.equal(workOfficerEffect(d,p,'development').bonus,0);
});
