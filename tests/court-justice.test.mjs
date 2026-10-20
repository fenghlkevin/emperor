import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {executeJustice,settleJustice,prisonLoyaltyDelta} from '../src/justice.mjs';
import {courtJusticeCases,courtJusticePlan} from '../src/court-justice.mjs';
const fund=s=>executeJustice(s,courtJusticePlan(s,{kind:'funding',amount:100}).command).state;
test('case preview is read-only and exposes only actual discovered records',()=>{
 const s=newGame('听案'),before=JSON.stringify(s),q=courtJusticePlan(s,{kind:'funding',amount:100});assert.equal(JSON.stringify(s),before);assert.equal(courtJusticeCases(s).length,0);assert.equal(q.cost,100);const n=fund(s);assert.deepEqual(courtJusticeCases(n).map(c=>c.official.id),q.newCases);assert.ok(q.newCases.length);assert.ok(courtJusticeCases(n).every(c=>c.evidence.includes('不包含贪污')));validateSave(n);
});
test('imprisonment, per-turn character reaction and release keep actual facts',()=>{
 let s=fund(newGame('囚臣'));const id=courtJusticeCases(s)[0].official.id;s=executeJustice(s,courtJusticePlan(s,{kind:'imprison',officialId:id}).command).state;const o=s.domestic.justice.officials.find(o=>o.id===id),delta=prisonLoyaltyDelta(o),loyalty=o.loyalty;assert.equal(courtJusticeCases(s,'prison')[0].delta,delta);settleJustice(s.domestic,2,()=>1);assert.equal(o.loyalty,loyalty+delta);assert.equal(o.prison.servedTurns,1);settleJustice(s.domestic,2,()=>1);assert.equal(o.prison.servedTurns,1);s.stats.treasury=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury;s=executeJustice(s,courtJusticePlan(s,{kind:'release',officialId:id}).command).state;assert.equal(courtJusticeCases(s,'prison').length,0);assert.equal(courtJusticeCases(s,'history')[0].official.status,'released');validateSave(s);
});
test('execution is irreversible and undiscovered officials cannot be sentenced',()=>{
 let s=newGame('裁决'),id=s.domestic.justice.officials[0].id;assert.throws(()=>courtJusticePlan(s,{kind:'execute',officialId:id}),/查实/);s=fund(s);id=courtJusticeCases(s)[0].official.id;const q=courtJusticePlan(s,{kind:'execute',officialId:id});assert.match(q.warning,/不可撤销/);s=executeJustice(s,q.command).state;assert.throws(()=>executeJustice(s,q.command),/已执行/);assert.throws(()=>courtJusticePlan(s,{kind:'release',officialId:id}),/不在天牢/);validateSave(s);
});
test('amnesty adds real population once without releasing imprisoned officials; funding validates boundaries',()=>{
 let s=fund(newGame('赦令'));const id=courtJusticeCases(s)[0].official.id;s=executeJustice(s,courtJusticePlan(s,{kind:'imprison',officialId:id}).command).state;const q=courtJusticePlan(s,{kind:'amnesty'}),n=executeJustice(s,q.command).state;assert.match(q.warning,/不释放/);assert.equal(courtJusticeCases(n,'prison').length,1);for(const p of s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId))assert.equal(n.domestic.provinces.find(x=>x.id===p.id).population.total,p.population.total+Math.max(1,Math.floor(p.population.total*.005)));assert.throws(()=>courtJusticePlan(n,{kind:'amnesty'}),/本旬/);for(const amount of [NaN,-1,.5,10001])assert.throws(()=>courtJusticePlan(s,{kind:'funding',amount}));validateSave(n);
});

test('pending justice cases remain on the court desk until all are resolved',async()=>{
 const {courtAgenda}=await import('../src/court-agenda.mjs');
 let s=fund(newGame('奏章'));const agenda=()=>courtAgenda(s,{limit:Infinity});
 const petition=agenda().find(a=>a.id==='justice');assert.ok(petition);assert.equal(petition.office,'justice-minister');
 assert.ok(courtAgenda(s,{archived:[petition.archiveKey],limit:Infinity}).some(a=>a.id==='justice'));
 for(const c of courtJusticeCases(s))s=executeJustice(s,courtJusticePlan(s,{kind:'imprison',officialId:c.official.id}).command).state;
 assert.equal(agenda().some(a=>a.id==='justice'),false);
});

test('no action dismisses a report durably without changing the official or clearing a plot',()=>{
 let s=fund(newGame('不予处理'));const row=courtJusticeCases(s)[0],id=row.official.id;
 row.official.plotTurn=s.turn;const before=structuredClone(row.official),treasury=s.stats.treasury;
 const plan=courtJusticePlan(s,{kind:'dismiss',officialId:id});assert.equal(row.official.caseDismissed,undefined);
 s=executeJustice(s,plan.command).state;const o=s.domestic.justice.officials.find(o=>o.id===id);
 assert.equal(o.status,'serving');assert.equal(o.loyalty,before.loyalty);assert.equal(o.plotTurn,before.plotTurn);assert.equal(s.stats.treasury,treasury);assert.ok(!courtJusticeCases(s).some(c=>c.official.id===id));
 s=validateSave(JSON.parse(JSON.stringify(s)));s=fund(s);assert.ok(!courtJusticeCases(s).some(c=>c.official.id===id));
 assert.throws(()=>courtJusticePlan(s,{kind:'dismiss',officialId:id}));
});

test('reinstate returns a prisoner to the appointable roster without displacing the incumbent',async()=>{
 const {servingOfficials,officeId}=await import('../src/personnel-actions.mjs');
 let s=fund(newGame('启用'));const id=courtJusticeCases(s)[0].official.id;
 s=executeJustice(s,courtJusticePlan(s,{kind:'imprison',officialId:id}).command).state;
 const before=structuredClone(s.domestic.justice.officials.find(o=>o.id===id));
 s=executeJustice(s,courtJusticePlan(s,{kind:'reinstate',officialId:id}).command).state;
 const o=s.domestic.justice.officials.find(o=>o.id===id);assert.equal(o.status,'serving');assert.equal(officeId(o),null);assert.equal(o.office,'待命');assert.equal(o.provinceId,null);assert.equal(o.loyalty,before.loyalty);assert.equal(o.plotTurn,null);
 assert.ok(servingOfficials(s.domestic).some(o=>o.id===id));assert.ok(!courtJusticeCases(s,'prison').some(c=>c.official.id===id));assert.ok(!courtJusticeCases(s).some(c=>c.official.id===id));
 const prison=structuredClone(o.prison);settleJustice(s.domestic,s.turn+1,()=>1);assert.deepEqual(o.prison,prison);validateSave(JSON.parse(JSON.stringify(s)));
 assert.throws(()=>courtJusticePlan(s,{kind:'reinstate',officialId:id}));
});
