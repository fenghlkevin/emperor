import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {startCampaign,beginDefense,finishDefense,autoDefense} from '../src/foreign-strategy.mjs';
import {defaultKitDefensePlan,quoteKitDefense,kitDefenseSources,withdrawKitDefense} from '../src/kit-defense.mjs';
import {finishWar,generals} from '../src/war.mjs';
import {actBattle,aiAction} from '../src/battle.mjs';
import {relationBetween} from '../src/diplomacy.mjs';
import {worldKitDepot} from '../src/troop-kit-world.mjs';
import {kitAvailability} from '../src/troop-kits.mjs';
const fixture=(allies=0)=>{const s=newGame('套装守城');s.turn=37;for(const id of ['tubo','rome','japan'].slice(0,allies))relationBetween(s.domestic,'sheng',id).relation='defense';startCampaign(s.domestic,'xi','hebei',s.turn);return s;};
const population=d=>d.provinces.reduce((n,p)=>n+p.population.total,0);
const totalKits=d=>Object.values(d.troopKits.depots).reduce((n,r)=>n+Object.values(r.stock).reduce((a,b)=>a+b,0),0);
const play=s=>{let b=s.domestic.war.battle;for(let i=0;!b.result&&i<20000;i++)b=actBattle(b,aiAction(b));assert.ok(b.result);s.domestic.war.battle=b;return s;};
test('default kit defense preserves source accounting, officers and exact equipment occupancy',()=>{
 const s=fixture(),before=structuredClone(s),plan=defaultKitDefensePlan(s),q=quoteKitDefense(s,plan),n=beginDefense(s,{deployment:plan});
 assert.deepEqual(s,before);assert.ok(plan.squads.length<=6);assert.equal(q.forces.reduce((n,f)=>n+f.soldiers,0),q.friendly.reduce((n,u)=>n+u.count,0));
 assert.equal(n.domestic.war.battle.command.deploymentVersion,2);assert.equal(n.domestic.war.battle.command.kitVersion,1);
 for(const f of q.forces)assert.equal(kitAvailability(worldKitDepot(n.domestic,f.sourceId)).soldiers.used,f.soldiers);
 validateSave(n);
});
test('manual defense supports remnants and independent central/local equipment, rejecting missing kits',()=>{
 const s=fixture(),g=generals(s.domestic),plan={kitVersion:1,generalId:g[0].id,commander:{sourceId:'hebei',kind:'infantry',count:37,equipped:true},squads:[{sourceId:'hebei',kind:'heavy-cavalry',count:73,equipped:true,generalId:g[1].id},{sourceId:'central',kind:'spears',count:137,equipped:true,generalId:g[2].id}]};
 const q=quoteKitDefense(s,plan);assert.equal(q.forces.find(f=>f.sourceId==='hebei').soldiers,110);assert.equal(q.forces.find(f=>f.sourceId==='central').soldiers,137);validateSave(beginDefense(s,{deployment:plan}));
 s.domestic.troopKits.depots.hebei.stock['heavy-cavalry']=72;assert.throws(()=>quoteKitDefense(s,plan),/装备不足/);
});
test('acting officers and zero kits permit honest militia defense without inventing equipment',()=>{
 const s=fixture();for(const o of generals(s.domestic)){o.positionId=null;o.office='待命';o.provinceId=null;}for(const record of Object.values(s.domestic.troopKits.depots))for(const k of Object.keys(record.stock))record.stock[k]=0;
 const plan=defaultKitDefensePlan(s),n=beginDefense(s,{deployment:plan});assert.equal(plan.generalId,'');assert.ok(n.domestic.war.battle.units.every(u=>u.equipped===false));validateSave(n);
 const result=finishDefense(play(n));assert.equal(totalKits(result.state.domestic),0);validateSave(result.state);
});
test('allied contingents use real foreign sources and stay within nine home stacks',()=>{
 const s=fixture(3),plan=defaultKitDefensePlan(s),q=quoteKitDefense(s,plan),n=beginDefense(s,{deployment:plan}),b=n.domestic.war.battle;
 assert.equal(q.forces.filter(f=>f.countryId!=='sheng').length,3);assert.ok(b.units.filter(u=>u.side==='home'&&!u.commander).length<=9);
 for(const ally of s.domestic.strategy.pending.allies)assert.equal(b.units.filter(u=>u.sourceId===ally.sourceId).reduce((n,u)=>n+u.initial,0),ally.soldiers);
 validateSave(n);
});
test('finished defense settles population and matching kits exactly once and releases all sources',()=>{
 const s=fixture(2),n=play(beginDefense(s,{deployment:defaultKitDefensePlan(s)})),b=n.domestic.war.battle,dead=b.units.reduce((n,u)=>n+u.dead,0),kitDead=b.units.filter(u=>u.equipped!==false).reduce((n,u)=>n+u.dead,0);
 validateSave(JSON.parse(JSON.stringify(n)));const r=finishWar(n);
 assert.equal(population(r.state.domestic),population(s.domestic)-dead);assert.equal(totalKits(r.state.domestic),totalKits(s.domestic)-kitDead);

 for(const id of new Set(b.units.map(u=>u.sourceId)))assert.equal(kitAvailability(worldKitDepot(r.state.domestic,id)).soldiers.used,0);
 assert.equal(r.receipt.defenseDetails.version,2);assert.throws(()=>finishDefense(r.state));validateSave(r.state);
});
test('tampered source, kit, training, officer or occupation snapshot is rejected',()=>{
 const s=fixture(),n=beginDefense(s,{deployment:defaultKitDefensePlan(s)});
 for(const mutate of [b=>b.units[0].training++,b=>b.units[0].sourceId='central',b=>b.units[0].equipmentFactor=.5,b=>b.units[0].general.martial++,b=>b.command.commanderSquad.count++]){const bad=structuredClone(n);mutate(bad.domestic.war.battle);assert.throws(()=>validateSave(bad));}
});
test('automatic kit defense and manual all-AI playback resolve the same legal result',()=>{
 const s=fixture(),plan=defaultKitDefensePlan(s),manual=finishDefense(play(beginDefense(s,{deployment:plan}))),auto=autoDefense(s,plan);
 assert.deepEqual(auto.state.domestic.troopKits,manual.state.domestic.troopKits);assert.equal(population(auto.state.domestic),population(manual.state.domestic));validateSave(auto.state);
});
test('withdrawing resolves exact casualties and kit loss without duplicating source deductions',()=>{
 const s=fixture(1),before=structuredClone(s),r=withdrawKitDefense(s),c=s.domestic.strategy.pending;
 const expected=Math.ceil(s.domestic.provinces.find(p=>p.id==='hebei').population.professions.soldiers*.04)+Math.ceil(c.allies[0].soldiers*.04)+Math.ceil(c.attack.soldiers*.02);
 assert.equal(population(r.state.domestic),population(s.domestic)-expected);assert.equal(r.state.domestic.strategy.pending,null);assert.deepEqual(s,before);
 for(const record of Object.values(r.state.domestic.troopKits.depots))assert.ok(Object.values(record.reservations).every(r=>r.status!=='active'));validateSave(r.state);
});
test('default six-type defense deploys local ranged stacks with central mounted support and no occupied-cell overlap',()=>{
 const s=fixture(3),plan=defaultKitDefensePlan(s),n=beginDefense(s,{deployment:plan}),units=n.domestic.war.battle.units;
 assert.ok(plan.squads.some(u=>u.kind==='archers'));assert.ok(plan.squads.some(u=>u.kind==='crossbows'));assert.ok(plan.squads.some(u=>u.sourceId==='central'&&u.kind==='cavalry'));
 const positions=units.map(u=>`${u.x},${u.y}`);assert.equal(new Set(positions).size,positions.length);for(const f of n.domestic.war.battle.command.forces)assert.equal(units.filter(u=>u.side==='home'&&u.sourceId===f.sourceId).reduce((n,u)=>n+u.count,0),f.soldiers);validateSave(n);
});
