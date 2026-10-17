import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {growForeignKitArmy} from '../src/kit-strategy.mjs';
import {newRecruitTraining} from '../src/building-effects.mjs';
test('foreign army growth pays full kit and recruitment prices and never recruits beyond kit coverage',()=>{
 for(const country of ['tubo','arabia','india','east-turk']){const s=newGame('军备成长'),d=s.domestic,p=d.provinces.find(p=>p.countryId===country),old=p.population.professions.soldiers,c=d.countries.find(c=>c.id===country),cash=c.fiscal.treasury;p.population.total+=10000;const stock=Object.values(d.troopKits.depots[p.id].stock).reduce((a,b)=>a+b,0),training=p.military.training,r=growForeignKitArmy(d,p,800,6),newStock=Object.values(d.troopKits.depots[p.id].stock).reduce((a,b)=>a+b,0);
 assert.ok(r.recruited<=Math.floor(800/14));assert.ok(r.gearCost>0);assert.equal(r.cost,r.gearCost+r.recruited*4);assert.equal(c.fiscal.treasury,cash-r.cost);assert.equal(p.population.professions.soldiers,old+r.recruited);assert.ok(newStock>=old+r.recruited);assert.equal(p.military.training,Math.floor((training*old+newRecruitTraining(p)*r.recruited)/(old+r.recruited)));assert.ok(newStock>=stock);validateSave(s);}
});
test('under-equipped foreign armies replace paid kits before adding soldiers',()=>{
 const s=newGame('先补装'),d=s.domestic,p=d.provinces.find(p=>p.countryId==='india'),old=p.population.professions.soldiers;for(const id of Object.keys(d.troopKits.depots[p.id].stock))d.troopKits.depots[p.id].stock[id]=0;p.population.total+=10000;const r=growForeignKitArmy(d,p,800,6);assert.equal(r.recruited,0);assert.equal(p.population.professions.soldiers,old);assert.ok(r.gearCost>0);assert.ok(r.cost<=800);validateSave(s);
});
test('automatic formation includes available special and ranged roles instead of truncating the first six catalogue entries',async()=>{
 const {automaticKitFormation}=await import('../src/kit-formation.mjs'),{worldKitSummary}=await import('../src/troop-kit-world.mjs'),{generals,quoteWar,borderingCountries}=await import('../src/war.mjs');const s=newGame('自动编队'),d=s.domestic;d.troopKits.depots.central.stock.elephant=20;
 const row=worldKitSummary(d).find(r=>r.id==='central'),before=structuredClone(row),plan=automaticKitFormation(row,generals(d));assert.ok(plan.squads.some(u=>u.kind==='elephant'));assert.ok(plan.squads.some(u=>['archers','crossbows'].includes(u.kind)));assert.deepEqual(row,before);assert.equal(plan.reserve+plan.commanderSquad.count+plan.squads.reduce((n,u)=>n+u.count,0),row.soldiers.available);quoteWar(s,{id:1,kind:'war',kitVersion:1,targetId:borderingCountries(d)[0].id,...plan});
});
