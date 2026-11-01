import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {executePersonnel,servingOfficials,officeId} from '../src/personnel-actions.mjs';
import {courtPersonnelPlan,personnelSeat} from '../src/court-personnel.mjs';
const fixture=()=>{const state=newGame('批量任命');const people=servingOfficials(state.domestic).filter(p=>officeId(p)).slice(0,3);return {state,people,assignments:people.map((p,i)=>({officialId:p.id,officeId:officeId(people[(i+1)%people.length])}))};};
test('多人循环调任使用最终岗位预览，保持原状态且可存档',()=>{
 const {state,people,assignments}=fixture(),before=structuredClone(state);
 const plan=courtPersonnelPlan(state,{kind:'assign-batch',assignments});
 assert.equal(plan.assignments.length,3);assert.deepEqual(plan.vacancies,[]);assert.deepEqual(state,before);
 const next=executePersonnel(state,plan.command).state;
 for(const row of assignments)assert.equal(personnelSeat(next.domestic,row.officeId).incumbent.id,row.officialId);
 assert.equal(next.phase,state.phase);assert.equal(next.stats.energy,state.stats.energy);
 assert.equal(next.domestic.personnel.nextId,state.domestic.personnel.nextId+3);
 validateSave(next);assert.deepEqual(state,before);
});
test('批量任命拒绝重复人选、重复官职、无效人选与原职，不留下部分结果',()=>{
 const {state,assignments}=fixture(),before=structuredClone(state);
 for(const rows of [[],[assignments[0],assignments[0]],[assignments[0],{...assignments[1],officeId:assignments[0].officeId}],[assignments[0],{...assignments[1],officialId:'missing'}],[{officialId:assignments[0].officialId,officeId:officeId(servingOfficials(state.domestic).find(p=>p.id===assignments[0].officialId))}]]){
 assert.throws(()=>executePersonnel(state,{kind:'assign-batch',assignments:rows,id:state.domestic.personnel.nextId}));assert.deepEqual(state,before);
 }
});
test('未获新任的原任待命，原岗位空缺列入预览，旧政令不能重放',()=>{
 const {state,assignments}=fixture(),rows=[assignments[0]],plan=courtPersonnelPlan(state,{kind:'assign-batch',assignments:rows});
 assert.equal(plan.vacancies.length,1);
 const next=executePersonnel(state,plan.command).state;
 assert.equal(officeId(servingOfficials(next.domestic).find(p=>p.id===personnelSeat(state.domestic,rows[0].officeId).incumbent.id)),null);
 assert.throws(()=>executePersonnel(next,plan.command));
});
