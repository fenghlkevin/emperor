import test from 'node:test';import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {executeKitCommand,quoteKitCommand,worldKitSummary,centralKitProductionAllowed,reserveWorldKits} from '../src/troop-kit-world.mjs';
import {planCentralTransfers} from '../src/central-military-transfers.mjs';
import {canOfficeNavigate} from '../src/court-office-access.mjs';
const run=(s,c)=>executeKitCommand(s,{id:s.domestic.troopKits.nextId,sourceId:'central',...c}).state;
const population=s=>s.domestic.provinces.reduce((n,p)=>n+p.population.total,0);
test('department permissions move procurement to revenue and dispatch to general',()=>{
 for(const [office,action]of [['revenue-minister','garrison-purchase'],['war-minister','garrison-recruit'],['war-minister','garrison-dismiss'],['central-general','garrison-distribute'],['central-general','garrison-collect']])assert.equal(canOfficeNavigate(office,action),true);
 for(const [office,action]of [['war-minister','garrison-purchase'],['war-minister','garrison-transfer'],['revenue-minister','garrison-recruit'],['central-general','garrison-purchase']])assert.equal(canOfficeNavigate(office,action),false);
});
test('local purchase recruitment and dismissal reject without mutating saves',()=>{
 const s=newGame('中央制'),before=structuredClone(s);
 for(const kind of ['purchase','recruit','dismiss'])assert.throws(()=>run(s,{kind,sourceId:'hebei',amount:10,quantities:{infantry:10}}),/中央/);
 assert.throws(()=>run(s,{kind:'transfer',sourceId:'hebei',targetId:'henan',soldiers:10,quantities:{}}),/中央/);assert.deepEqual(s,before);
});
test('special equipment unlocks nationally but is purchased only into central depot',()=>{
 const s=newGame('产地'),p=s.domestic.provinces.find(p=>p.id==='india-core');
 assert.equal(centralKitProductionAllowed(s.domestic,'elephant'),false);
 p.countryId=s.domestic.playerCountryId;p.status.situation='stable';if(p.occupation)p.occupation.settled=true;
 assert.equal(centralKitProductionAllowed(s.domestic,'elephant'),true);
 const next=run(s,{kind:'purchase',quantities:{elephant:3}});
 assert.equal(next.domestic.troopKits.depots.central.stock.elephant,s.domestic.troopKits.depots.central.stock.elephant+3);
 assert.deepEqual(next.domestic.troopKits.depots[p.id],s.domestic.troopKits.depots[p.id]);
 p.status.situation='unrest';assert.equal(centralKitProductionAllowed(s.domestic,'elephant'),false);
});
test('batch dispatch and collection conserve every soldier kit and population; failure is atomic',()=>{
 const s=newGame('调度'),before=structuredClone(s),rows=['hebei','henan'].map(provinceId=>({provinceId,soldiers:20,quantities:{infantry:10,spears:10}}));
 const sent=planCentralTransfers(s,{id:s.domestic.troopKits.nextId,direction:'out',rows});assert.deepEqual(s,before);validateSave(sent.state);
 const back=planCentralTransfers(sent.state,{id:sent.state.domestic.troopKits.nextId,direction:'in',rows}).state;
 assert.equal(population(back),population(s));assert.deepEqual(back.domestic.troopKits.depots,s.domestic.troopKits.depots);assert.deepEqual(worldKitSummary(back.domestic).map(({training,...r})=>r),worldKitSummary(s.domestic).map(({training,...r})=>r));
 assert.throws(()=>planCentralTransfers(s,{id:s.domestic.troopKits.nextId,direction:'out',rows:[rows[0],{...rows[1],soldiers:99999999}]}));assert.deepEqual(s,before);
 assert.throws(()=>planCentralTransfers(sent.state,{id:s.domestic.troopKits.nextId,direction:'in',rows}),/更新/);
});
test('central dismissal disperses untracked soldiers across provinces and leaves equipment untouched',()=>{
 const s=newGame('还民'),before=structuredClone(s),q=quoteKitCommand(s,{kind:'dismiss',sourceId:'central',amount:100});
 assert.ok(q.details.allocations.length>1);assert.equal(q.details.allocations.reduce((n,r)=>n+r.count,0),100);assert.deepEqual(s,before);
 const next=run(s,{kind:'dismiss',amount:100});assert.equal(population(next),population(s));assert.equal(next.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers-100);assert.deepEqual(next.domestic.troopKits.depots,s.domestic.troopKits.depots);validateSave(next);
});
test('dismissal returns tracked farmers to their home and retains people when all other cities are full',()=>{
 let s=newGame('返乡');
 // Request enough recruits to include real industry drafts after idle labor.
 const ps=s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId);
 for(const p of ps){const assigned=Object.values(p.population.professions).reduce((n,v)=>n+v,0);p.population.professions.farmers+=Math.max(0,Math.floor(p.population.total*.75)-assigned);}
 s=run(s,{kind:'recruit',amount:10,draftRates:{farmers:10}});assert.ok(s.domestic.manpower.drafts.length);
 const origin=s.domestic.manpower.drafts[0].originId,next=run(s,{kind:'dismiss',amount:10});assert.equal(next.domestic.manpower.drafts.length,0);assert.match(quoteKitCommand(s,{kind:'dismiss',sourceId:'central',amount:10}).lines.join('；'),new RegExp(s.domestic.provinces.find(p=>p.id===origin).name));assert.equal(population(next),population(s));validateSave(next);
 const full=newGame('满城');for(const p of full.domestic.provinces.filter(p=>p.countryId===full.domestic.playerCountryId))p.cityCapacity.population=Math.ceil(p.population.total/1.2);
 const q=quoteKitCommand(full,{kind:'dismiss',sourceId:'central',amount:100});assert.equal(q.details.allocations.reduce((n,r)=>n+r.count,0),100);assert.equal(population(run(full,{kind:'dismiss',amount:100})),population(full));
});
test('reserved central troops and equipment cannot be dismissed or batch dispatched',()=>{
 const s=newGame('占用'),row=worldKitSummary(s.domestic)[0];reserveWorldKits(s.domestic,'central','hold',[{kind:'infantry',count:row.kits.infantry.available}]);
 assert.throws(()=>run(s,{kind:'dismiss',amount:row.soldiers.available}),/不足/);
 assert.throws(()=>planCentralTransfers(s,{id:s.domestic.troopKits.nextId,direction:'out',rows:[{provinceId:'hebei',soldiers:0,quantities:{infantry:1}}]}),/不足|数量|占用/);
});
