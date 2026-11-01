import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeJustice} from '../src/justice.mjs';
import {officeTasks} from '../src/court-play-ui.mjs';
import {canOfficeNavigate} from '../src/court-office-access.mjs';
import {courtActorRecords} from '../src/court-actors.mjs';
import {imperialReportsMarkup} from '../src/rites-deputy-ui.mjs';
test('emperor intelligence posts have actors and separate command/read permissions',()=>{
 const s=newGame('皇城司');
 for(const id of ['imperial-spy-chief','imperial-spy-reader']){const r=courtActorRecords(s.domestic).find(r=>r.office.id===id);assert.ok(r.person);assert.ok(r.art.court);assert.ok(r.slot);}
 assert.deepEqual(officeTasks('imperial-spy-chief').map(t=>t.action),['espionage']);
 assert.deepEqual(officeTasks('imperial-spy-reader').map(t=>t.action),['office-report']);
 assert.equal(canOfficeNavigate('war-minister','espionage'),false);assert.equal(canOfficeNavigate('imperial-spy-chief','espionage'),true);assert.equal(canOfficeNavigate('imperial-spy-reader','espionage'),false);
 assert.ok(!officeTasks('war-minister').some(t=>t.action==='espionage'));
 const before=JSON.stringify(s);assert.doesNotMatch(imperialReportsMarkup(s),/<form|<button/);assert.equal(JSON.stringify(s),before);validateSave(s);
});
test('older saves gain both posts once and dismissal is preserved',()=>{
 const s=newGame('旧朝');delete s.domestic.justice.imperialSpyVersion;s.domestic.justice.officials=s.domestic.justice.officials.filter(p=>!p.id.startsWith('imperial-spy-'));
 initializeJustice(s.domestic);assert.equal(s.domestic.justice.officials.filter(p=>p.id.startsWith('imperial-spy-')).length,2);
 s.domestic.justice.officials.find(p=>p.id==='imperial-spy-chief').positionId=null;initializeJustice(s.domestic);
 assert.equal(s.domestic.justice.officials.filter(p=>p.id==='imperial-spy-chief').length,1);assert.equal(s.domestic.justice.officials.find(p=>p.id==='imperial-spy-chief').positionId,null);
});
