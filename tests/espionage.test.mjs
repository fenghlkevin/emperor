import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {spyEligible,spyCost,executeSpy,settleEspionage} from '../src/espionage.mjs';
import {servingOfficials} from '../src/personnel-actions.mjs';
import {hanlinEligible} from '../src/hanlin.mjs';
import {ritesDeputyMarkup} from '../src/rites-deputy-ui.mjs';
function fixture(){const s=newGame('秘谍');const o=s.domestic.justice.officials[0];Object.assign(o,{positionId:null,provinceId:null,office:'待命'});return {s,o};}
test('dispatch charges by distance, reserves official and persists; recall discards progress',()=>{const {s,o}=fixture(),cost=spyCost(s.domestic,'japan'),n=executeSpy(s,{countryId:'japan',officialId:o.id});assert.equal(n.stats.treasury,s.stats.treasury-cost);assert.ok(spyCost(s.domestic,'rome')>1000);assert.equal(n.domestic.espionage.missions[0].due,s.turn+9);assert.ok(!spyEligible(n.domestic).some(p=>p.id===o.id));assert.ok(!servingOfficials(n.domestic).some(p=>p.id===o.id));assert.ok(!hanlinEligible(n.domestic).some(p=>p.id===o.id));validateSave(JSON.parse(JSON.stringify(n)));const recalled=executeSpy(n,{kind:'recall',id:1});assert.equal(recalled.domestic.espionage.missions.length,0);assert.equal(recalled.stats.treasury,n.stats.treasury);assert.ok(spyEligible(recalled.domestic).some(p=>p.id===o.id));assert.deepEqual(recalled.domestic.espionage.reports,{});});
test('nine turns then frozen snapshot; failed later attempt preserves previous report and returns person',()=>{const {s,o}=fixture(),n=executeSpy(s,{countryId:'japan',officialId:o.id}),d=n.domestic;settleEspionage(d,9,()=>0);assert.equal(d.espionage.reports.japan,undefined);n.turn=10;settleEspionage(d,10,()=>0);const before=structuredClone(d.espionage.reports.japan);d.countries.find(c=>c.id==='japan').fiscal.treasury+=50;assert.deepEqual(d.espionage.reports.japan,before);let m=executeSpy(n,{countryId:'japan',officialId:o.id});const rel=m.domestic.diplomacy.find(r=>r.countryIds.includes('japan')&&r.countryIds.includes('sheng')),friendship=rel.friendship;m.turn=19;settleEspionage(m.domestic,19,()=>1);assert.equal(rel.friendship,friendship-10);assert.deepEqual(m.domestic.espionage.reports.japan,before);assert.equal(m.domestic.espionage.missions.length,0);assert.ok(ritesDeputyMarkup(m).includes('第 10 旬情报快照'));validateSave(JSON.parse(JSON.stringify(m)));});
test('unknown foreign values masked and invalid or unaffordable missions rejected',()=>{const {s,o}=fixture();assert.ok(ritesDeputyMarkup(s).includes('***'));assert.throws(()=>executeSpy(s,{countryId:'sheng',officialId:o.id}));s.domestic.countries[0].fiscal.treasury=0;assert.throws(()=>executeSpy(s,{countryId:'japan',officialId:o.id}),/国库不足/);});
test('domestic counterintelligence charges once, reserves personnel, finds suspects and persists results',()=>{
 const {s,o}=fixture(),suspect=s.domestic.justice.officials.find(p=>p.id!==o.id);suspect.loyalty=20;suspect.discovered=false;
 const n=executeSpy(s,{kind:'counterspy',officialId:o.id}),e=n.domestic.espionage;
 assert.equal(n.stats.treasury,s.stats.treasury-1000);assert.equal(e.missions[0].due,s.turn+3);
 assert.throws(()=>executeSpy(n,{kind:'counterspy',officialId:o.id}));validateSave(JSON.parse(JSON.stringify(n)));
 settleEspionage(n.domestic,3,()=>0);assert.equal(e.history.length,0);
 n.turn=4;settleEspionage(n.domestic,4,()=>0);
 assert.equal(e.missions.length,0);assert.equal(n.domestic.justice.officials.find(p=>p.id===suspect.id).discovered,true);
 assert.match(e.history[0],/国内反谍查奸.*已移交刑部/);assert.deepEqual(e.reports,{});validateSave(JSON.parse(JSON.stringify(n)));
});
test('domestic failure does not affect foreign friendship or invent suspects; legacy foreign missions remain valid',()=>{
 const {s,o}=fixture(),n=executeSpy(s,{kind:'counterspy',officialId:o.id}),before=JSON.stringify(n.domestic.diplomacy);
 n.turn=4;settleEspionage(n.domestic,4,()=>1);assert.equal(JSON.stringify(n.domestic.diplomacy),before);assert.match(n.domestic.espionage.history[0],/查察未果/);
 const legacy=executeSpy(s,{countryId:'japan',officialId:o.id});delete legacy.domestic.espionage.missions[0].kind;validateSave(JSON.parse(JSON.stringify(legacy)));
});
