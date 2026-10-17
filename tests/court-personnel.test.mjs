import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,leaveRoom,validateSave} from '../src/game.mjs';
import {servingOfficials,officeId,executePersonnel} from '../src/personnel-actions.mjs';
import {courtPersonnelPlan,personnelSeat} from '../src/court-personnel.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {finishExam} from '../src/exam-session.mjs';
const candidate=s=>servingOfficials(s.domestic).find(p=>officeId(p)!=='prime-minister');
test('court appointments compare actual incumbents without mutation and release the former seat',()=>{
 const s=newGame('铨选'),before=JSON.stringify(s),p=candidate(s),old=personnelSeat(s.domestic,'prime-minister').incumbent,q=courtPersonnelPlan(s,{kind:'assign',officialId:p.id,officeId:'prime-minister'});
 assert.equal(JSON.stringify(s),before);assert.equal(q.incumbent.id,old.id);assert.equal(q.cost,0);assert.equal(q.personAfter.loyalty,Math.min(100,p.loyalty+5));
 const n=executePersonnel(s,q.command).state;assert.equal(personnelSeat(n.domestic,'prime-minister').incumbent.id,p.id);assert.equal(officeId(n.domestic.justice.officials.find(x=>x.id===old.id)),null);assert.equal(n.domestic.justice.officials.length,s.domestic.justice.officials.length);assert.equal(q.netAfter,countrySummary(n.domestic,undefined,n.turn).net);validateSave(n);
});
test('honor preview uses actual cash and recurring salary with loyalty capped',()=>{
 const s=newGame('封赏'),p=candidate(s),q=courtPersonnelPlan(s,{kind:'honor',officialId:p.id,honor:'rank'}),n=executePersonnel(s,q.command).state;
 assert.equal(q.cost,((p.rank??0)+1)*100);assert.equal(q.netAfter,q.netBefore-2);assert.equal(n.stats.treasury,s.stats.treasury-q.cost);assert.equal(q.personAfter.loyalty,Math.min(100,p.loyalty+10));
 p.nobilityLevel=6;assert.throws(()=>courtPersonnelPlan(s,{kind:'honor',officialId:p.id,honor:'nobility'}),/最高/);
});
test('delegation and budget preview do not spend governance funds or invent resources',()=>{
 const s=newGame('委任'),before=JSON.stringify(s),q=courtPersonnelPlan(s,{kind:'delegate',provinceId:'hebei',enabled:true});assert.equal(JSON.stringify(s),before);assert.equal(q.cost,0);
 const n=executePersonnel(s,q.command).state;assert.deepEqual(n.domestic.personnel.delegations,['hebei']);assert.equal(n.stats.treasury,s.stats.treasury);assert.throws(()=>courtPersonnelPlan(n,{kind:'delegate',provinceId:'hebei',enabled:true}),/已经委任/);
 const b=courtPersonnelPlan(n,{kind:'governanceBudget',budget:300,reserve:4000});assert.equal(b.cost,0);assert.throws(()=>courtPersonnelPlan(n,{kind:'governanceBudget',budget:2000,reserve:2000}),/未改变/);assert.throws(()=>courtPersonnelPlan(n,{kind:'governanceBudget',budget:-1,reserve:2000}));
});
test('dismissal previews explicit permanent loss and removes only the chosen person',()=>{
 const s=newGame('去留'),p=candidate(s),q=courtPersonnelPlan(s,{kind:'dismiss',officialId:p.id});assert.match(q.warning,/永久/);assert.equal(q.personAfter,null);
 const n=executePersonnel(s,q.command).state;assert.equal(n.domestic.justice.officials.length,s.domestic.justice.officials.length-1);assert.ok(!n.domestic.justice.officials.some(x=>x.id===p.id));assert.ok(n.domestic.personnel.retired.includes(p.name));
});
test('court exam keeps the real turn and post-court hiring boundaries',()=>{
 const s=newGame('开科'),q=courtPersonnelPlan(s,{kind:'exam'});assert.equal(q.cost,500);const n=executePersonnel(s,q.command).state;assert.equal(n.domestic.personnel.examTurn,2);assert.equal(n.domestic.personnel.candidates.length,0);
 advance(n);assert.ok(n.domestic.personnel.candidates.length>=5);const ids=n.domestic.personnel.candidates.slice(0,2).map(p=>p.id);n.scene='court';assert.throws(()=>finishExam(n,ids),/退朝/);leaveRoom(n);const result=finishExam(n,ids);assert.equal(result.phase,2);assert.equal(result.domestic.personnel.candidates.length,0);for(const id of ids)assert.ok(servingOfficials(result.domestic).some(p=>p.id==='recruit-'+id));validateSave(result);
});
test('invalid seats and failed save cannot change persons, cash or serial numbers',()=>{
 const s=newGame('原子'),p=candidate(s),before=JSON.stringify(s);assert.throws(()=>courtPersonnelPlan(s,{kind:'assign',officialId:p.id,officeId:'foreign-governor'}));assert.throws(()=>courtPersonnelPlan(s,{kind:'hire',candidateId:'anything'}));
 const q=courtPersonnelPlan(s,{kind:'honor',officialId:p.id,honor:'rank'}),n=executePersonnel(s,q.command).state;assert.throws(()=>persistCandidate(s,n,{setItem(){throw Error('quota');}}),/保存失败/);assert.equal(JSON.stringify(s),before);assert.throws(()=>executePersonnel(n,q.command),/政令已执行/);
});
