import test from 'node:test';import assert from 'node:assert/strict';import {newGame} from '../src/game.mjs';import {courtAgenda} from '../src/court-agenda.mjs';import {countrySummary} from '../src/domestic.mjs';
const all=s=>courtAgenda(s,{limit:Infinity});
test('opening and routine construction never create progress reports; completion is a notice',()=>{
 const s=newGame('工程'),p=s.domestic.provinces[0];p.construction.project={building:'granaries',startedTurn:1,progress:0};assert.ok(!all(s).some(a=>a.id==='works'));
 s.turn=3;p.construction.project=null;p.buildingEffects.pending={building:'granaries',completedTurn:3,effectiveTurn:4};
 const report=all(s).find(a=>a.id.startsWith('works-complete'));assert.equal(report.kind,'notice');assert.match(report.summary,/第4旬启用/);
});
test('a budget deficit only interrupts when treasury covers at most three deficit turns or real debt is posted',()=>{const s=newGame('国用');for(const p of s.domestic.provinces)p.budget.taxRate=0;const home=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId),net=countrySummary(s.domestic,undefined,s.turn).net;assert.ok(net<0);home.fiscal.treasury=Math.abs(net)*10;assert.ok(!all(s).some(a=>a.id==='deficit'));home.fiscal.treasury=Math.abs(net)*3;const warning=all(s).find(a=>a.id==='deficit');assert.ok(warning);const hidden=[warning.archiveKey];home.fiscal.treasury=Math.abs(net)*2;assert.ok(!courtAgenda(s,{archived:hidden}).some(a=>a.id==='deficit'));home.fiscal.treasury=0;assert.ok(courtAgenda(s,{archived:hidden}).some(a=>a.id==='deficit'));});
test('routine trade success and routine training stay in their scenes, exceptions and first trade report',()=>{const s=newGame('复奏'),r=s.domestic.diplomacy.find(r=>r.countryIds.includes(s.domestic.playerCountryId));r.agreement.lastPerformance={turn:1,exportsDue:100,exportsPaid:100,importsDue:40,importsPaid:40};r.agreement.settledTurns=1;assert.ok(all(s).some(a=>a.id==='diplomatic-receipt'));r.agreement.settledTurns=2;assert.ok(!all(s).some(a=>a.id==='diplomatic-receipt'));r.agreement.lastPerformance.exportsPaid=20;assert.ok(all(s).some(a=>a.id==='diplomatic-receipt'));const p=s.domestic.provinces[0];s.domestic.governance.records=[{turn:1,provinceId:p.id,cost:100,reason:'驻军训练不足，练兵；实支100两'}];assert.ok(!all(s).some(a=>a.id==='governance'));s.domestic.governance.records[0].reason='民生不足，兴建衙门暂缓：预算不足';assert.ok(!all(s).some(a=>a.id.startsWith('governance')));});
test('read one completion never masks another province',async()=>{
 const {acknowledgeCourtReport}=await import('../src/court-report-events.mjs');let s=newGame('多折');
 for(const p of s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId).slice(0,2))p.buildingEffects.pending={building:'granaries',completedTurn:1,effectiveTurn:2};
 const batch=all(s).find(a=>a.completionItems);assert.equal(batch.completionItems.length,2);
 const reports=courtAgenda(s,{limit:Infinity,groupCompletions:false}).filter(a=>a.id.startsWith('works-complete'));assert.equal(reports.length,2);
 s=acknowledgeCourtReport(s,reports[0]);const next=all(s);assert.ok(next.some(a=>a.archiveKey===reports[1].archiveKey));assert.ok(!next.some(a=>a.archiveKey===reports[0].archiveKey));
});
