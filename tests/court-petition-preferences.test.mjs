import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {courtAgenda} from '../src/court-agenda.mjs';
import {acknowledgeCourtReport} from '../src/court-report-events.mjs';
import {visibleCourtAgenda,archivePetition,readArchived} from '../src/court-petition-preferences.mjs';
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
function completed(){const s=newGame('已阅');s.domestic.provinces[0].buildingEffects.pending={building:'granaries',completedTurn:1,effectiveTurn:2};return s;}
test('read receipts survive save export and do not consume resources or resurrect completion notices',()=>{
 const s=completed(),item=courtAgenda(s).find(a=>a.id.startsWith('works-complete')),before=JSON.stringify(s);
 const next=acknowledgeCourtReport(s,item);assert.equal(JSON.stringify(s),before);assert.deepEqual(next.stats,s.stats);
 const loaded=validateSave(JSON.parse(JSON.stringify(next)));assert.ok(!courtAgenda(loaded,{limit:Infinity}).some(a=>a.archiveKey===item.archiveKey));
 assert.ok(courtAgenda(loaded,{limit:Infinity,includeRead:true}).some(a=>a.archiveKey===item.archiveKey));
});
test('legacy local receipts still filter notifications and remain isolated by dynasty',()=>{
 const s=completed(),store=storage(),item=courtAgenda(s)[0];archivePetition(s,item,store);assert.ok(!visibleCourtAgenda(s,store).length);
 const other=structuredClone(s);other.createdAt+='other';assert.ok(visibleCourtAgenda(other,store).length);assert.equal(readArchived(s,store).length,1);
});
test('emergencies and pending decisions cannot be marked as read; invalid journal saves are rejected',()=>{
 const s=completed();assert.throws(()=>acknowledgeCourtReport(s,{urgent:true}),/须先办理/);assert.throws(()=>acknowledgeCourtReport(s,{kind:'request'}),/须先办理/);
 s.domestic.courtReports={version:1,read:[null],events:[]};assert.throws(()=>validateSave(s),/奏章记录无效/);
});
