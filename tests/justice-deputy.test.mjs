import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeJustice} from '../src/justice.mjs';
import {courtOccupant,courtActorRecords} from '../src/court-actors.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {canOfficeNavigate} from '../src/court-office-access.mjs';
import {officeTasks} from '../src/court-play-ui.mjs';
test('justice deputy is a real central office and legacy saves gain one incumbent exactly once',()=>{
 const s=newGame('刑部侍郎'),d=s.domestic;
 const deputy=courtOccupant(d,'justice-deputy');assert.equal(deputy.office,'刑部侍郎');assert.equal(deputy.provinceId,null);
 assert.equal(courtActorRecords(d).length,14);
 d.justice.officials=d.justice.officials.filter(o=>o.id!=='justice-deputy');delete d.justice.justiceDeputyVersion;
 const before=structuredClone(d.justice.officials);initializeJustice(d);initializeJustice(d);
 assert.equal(d.justice.officials.filter(o=>o.id==='justice-deputy').length,1);
 assert.deepEqual(d.justice.officials.filter(o=>o.id!=='justice-deputy'),before);
 const next=executePersonnel(s,{kind:'dismiss',officialId:'justice-deputy',id:d.personnel.nextId}).state;
 assert.equal(courtOccupant(next.domestic,'justice-deputy'),null);
 const loaded=validateSave(JSON.parse(JSON.stringify(next)));
 assert.equal(courtOccupant(loaded.domestic,'justice-deputy'),null);
});
test('prison lookup belongs to deputy while adjudication remains with minister',()=>{
 assert.deepEqual(officeTasks('justice-deputy').map(t=>t.action),['justice-prison','office-report']);
 assert.equal(canOfficeNavigate('justice-deputy','justice-prison'),true);
 for(const action of ['justice','justice-sentence','justice-amnesty','justice-funding'])assert.equal(canOfficeNavigate('justice-deputy',action),false);
 assert.equal(canOfficeNavigate('justice-minister','justice-prison'),false);
 assert.equal(canOfficeNavigate('justice-minister','justice-sentence'),true);
 assert.equal(officeTasks('justice-minister').some(t=>t.action==='justice-prison'),false);
});
