import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {courtCampaignPlan} from '../src/court-campaign.mjs';
import {beginWar,generals,borderingCountries,advanceWar} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {worldKitSummary} from '../src/troop-kit-world.mjs';
import {campaignMarch,isMarching,battleReady} from '../src/campaign-march.mjs';
import {courtAgenda} from '../src/court-agenda.mjs';
test('distance sets arrival; marching saves and advances until a court command is due',()=>{
 const s=newGame('行军'),formation={targetId:borderingCountries(s.domestic)[0].id,...automaticKitFormation(worldKitSummary(s.domestic)[0],generals(s.domestic))};
 const plan=courtCampaignPlan(s,formation),n=beginWar(s,plan.command),used=worldKitSummary(n.domestic)[0].soldiers.used;
 assert.ok(isMarching(n));assert.ok(courtAgenda(n,{limit:100}).some(r=>r.id==='march'));
 assert.throws(()=>advanceWar(n,{kind:'retreat'}),/行军/);
 while(n.turn<plan.march.arrivalTurn){assert.ok(isMarching(n));advance(n);validateSave(n);assert.equal(worldKitSummary(n.domestic)[0].soldiers.used,used);}
 assert.ok(battleReady(n));assert.ok(courtAgenda(n,{limit:100}).some(r=>r.id==='war'));assert.throws(()=>advance(n),/战事/);
});
test('farther destinations take more ten-day periods',()=>{
 const s=newGame('路程'),rows=s.domestic.provinces.filter(p=>p.id!==s.domestic.centralArmy.sourceProvinceId).map(p=>campaignMarch(s,p.id));
 rows.sort((a,b)=>a.distance-b.distance);assert.ok(rows.at(-1).turns>rows[0].turns);
});
