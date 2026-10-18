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
