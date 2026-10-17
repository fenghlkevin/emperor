import test from 'node:test';
import {aiAction} from '../src/battle.mjs';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {beginWar,generals,borderingCountries,advanceWar,finishWar} from '../src/war.mjs';
import {kitGarrison} from '../src/kit-war.mjs';
import {executeKitCommand,ENABLED_KITS} from '../src/troop-kit-world.mjs';
test('new games seed six types and ranged procurement follows the same ledger',()=>{
 const s=newGame('弓弩军备'),stock=s.domestic.troopKits.depots.central.stock;
 assert.equal(ENABLED_KITS.length,9);assert.ok(stock.archers>0&&stock.crossbows>0);
 const r=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:{archers:2,crossbows:3}});
 assert.equal(r.receipt.cost,68);assert.equal(r.state.domestic.troopKits.depots.central.stock.archers,stock.archers+2);validateSave(r.state);
});
test('full-stock enemy garrison includes bow and crossbow without inventing militia',()=>{
 const d=newGame('远程守军').domestic,p=d.provinces.find(p=>p.countryId!==d.playerCountryId),n=p.population.professions.soldiers,units=kitGarrison(d,p.id,n,{commander:true});
 assert.ok(units.some(u=>u.kind==='archers'));assert.ok(units.some(u=>u.kind==='crossbows'));assert.equal(units.reduce((n,u)=>n+u.count,0),n);assert.ok(units.every(u=>u.equipped!==false));
});
test('ranged expedition reserves real kits and retreat returns them without loss',()=>{
 const s=newGame('远程出征'),g=generals(s.domestic),stock=structuredClone(s.domestic.troopKits.depots.central.stock);
 let n=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'infantry',count:10},squads:[{kind:'archers',count:31,generalId:g[1].id},{kind:'crossbows',count:29,generalId:g[2].id}]});validateSave(n);
 n=advanceWar(n,{type:'retreat'});const r=finishWar(n);assert.deepEqual(r.state.domestic.troopKits.depots.central.stock,stock);assert.equal(r.receipt.report.home.dead,0);validateSave(r.state);
});
test('six-type automatic war settles each actual ranged loss and source population once',()=>{
 const s=newGame('远程自动验收'),g=generals(s.domestic),initialPopulation=s.domestic.provinces.reduce((n,p)=>n+p.population.total,0),initialStock=structuredClone(s.domestic.troopKits.depots.central.stock);
 let n=beginWar(s,{id:1,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'infantry',count:100},squads:[{kind:'archers',count:180,generalId:g[1].id},{kind:'crossbows',count:120,generalId:g[2].id}]});
 for(let i=0;!n.domestic.war.battle.result&&i<3000;i++)n=advanceWar(n,aiAction(n.domestic.war.battle));
 assert.ok(n.domestic.war.battle.result);const b=n.domestic.war.battle,allDead=b.units.reduce((n,u)=>n+u.dead,0),ownDead=kind=>b.units.filter(u=>u.side==='home'&&u.kind===kind).reduce((n,u)=>n+u.dead,0),r=finishWar(n);
 assert.equal(r.state.domestic.provinces.reduce((n,p)=>n+p.population.total,0),initialPopulation-allDead);
 for(const kind of ['infantry','archers','crossbows'])assert.equal(r.state.domestic.troopKits.depots.central.stock[kind],initialStock[kind]-ownDead(kind));
 assert.equal(r.state.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers-r.receipt.report.home.dead);validateSave(r.state);assert.throws(()=>finishWar(r.state));
});
