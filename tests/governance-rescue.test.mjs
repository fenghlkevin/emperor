import {national,famine as createFamine} from './helpers/national.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {settleDomestic} from '../src/domestic.mjs';
import {settlePersonnel} from '../src/personnel-actions.mjs';
import {projectScheduledEconomy} from '../src/economy-projection.mjs';
function famine(budget=2000){const s=newGame('救急');s.domestic.diplomacy.find(r=>r.countryIds.includes(s.domestic.playerCountryId)&&r.countryIds.includes('nanzhao')).agreement.imports=1000000;initializeResourceEconomy(s.domestic);const d=s.domestic,p=d.provinces[0];d.disasters.lastTurn=10000;createFamine(d);const need=nationalFoodForecast(d,2).need;national(d).fiscal.grain=need-100;d.personnel.delegations=[p.id];d.governance.budget=budget;return {s,d,p};}
test('new model delegated emergency purchase feeds current turn before recording shortage',()=>{
 const {s,d,p}=famine(),projection=projectScheduledEconomy(s);
 settleDomestic(d,2);s.turn=2;
 assert.equal(p.resourceSettlement.grain.shortfall,0);
 assert.equal(p.foodRelief.lastSettlement.shortfall,0);
 assert.ok(national(d).grainAccounting.periods[0].entries.some(e=>e.category==='purchase'));
 const spent=d.governance.spent,purchases=d.foodRelief.history.length;
 assert.ok(spent>0);settlePersonnel(d,2,()=>.5,s.stats);
 assert.equal(d.foodRelief.history.length,purchases);assert.ok(d.governance.spent>=spent);assert.ok(d.governance.spent<=d.governance.turnBudget);
 assert.equal(d.countries[0].fiscal.treasury,projection.cash.closing);
 assert.equal(national(d).fiscal.grain,projection.grain.closing);
 validateSave(structuredClone(s));
 const before=JSON.stringify(d);settleDomestic(d,2);settlePersonnel(d,2,()=>.5,s.stats);assert.equal(JSON.stringify(d),before);
});
test('insufficient rescue budget buys only affordable food and retains actual shortage',()=>{
 const {s,d,p}=famine(100);settleDomestic(d,2);s.turn=2;
 assert.ok(p.resourceSettlement.grain.shortfall>0);assert.ok(d.governance.spent>0&&d.governance.spent<=100);
 const spent=d.governance.spent;settlePersonnel(d,2,()=>.5,s.stats);assert.equal(d.governance.spent,spent);
 assert.equal(p.construction.project,null);validateSave(structuredClone(s));
});

test('delegated rescue without a mutual market records blockage without creating grain or spending',()=>{const {s,d}=famine();d.diplomacy.forEach(r=>{r.relation='none';r.agreement.exports=0;r.agreement.imports=0;});settleDomestic(d,2);s.turn=2;assert.equal(d.foodRelief.history.length,0);assert.equal(d.governance.spent,0);assert.ok(d.governance.records.some(r=>r.reason.includes('互市')));validateSave(structuredClone(s));});
