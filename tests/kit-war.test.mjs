import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {aiAction,actBattle,check} from '../src/battle.mjs';
import {worldKitDepot} from '../src/troop-kit-world.mjs';
import {kitAvailability} from '../src/troop-kits.mjs';
const setup=()=>{const s=newGame('套装出征'),g=generals(s.domestic);return {s,c:{id:s.domestic.war.nextId,kitVersion:1,kind:'war',targetId:borderingCountries(s.domestic)[0].id,generalId:g[0].id,commanderSquad:{kind:'cavalry',count:37},squads:[{kind:'spears',count:137,generalId:g[1].id},{kind:'heavy-cavalry',count:40,generalId:g[2].id}]}};};
test('kit war reserves actual troops and exact kits, including paid commander and remnants',()=>{
 const {s,c}=setup(),before=structuredClone(s),n=beginWar(s,c),b=n.domestic.war.battle;
 assert.equal(b.command.kitVersion,1);assert.equal(kitAvailability(worldKitDepot(n.domestic,'central')).soldiers.used,214);
 assert.equal(kitAvailability(worldKitDepot(n.domestic,'central')).kits.cavalry.used,37);
 assert.equal(b.units.find(u=>u.commander&&u.side==='home').kind,'cavalry');
 assert.deepEqual(s,before);validateSave(n);
});
test('missing kits and repeated leaders fail atomically',()=>{
 const {s,c}=setup(),before=structuredClone(s);c.squads[1].count=81;assert.throws(()=>beginWar(s,c),/装备不足/);assert.deepEqual(s,before);
 c.squads[1].count=40;c.squads[1].generalId=c.generalId;assert.throws(()=>beginWar(s,c),/不重复/);
});
test('retreat returns all survivors and kits without duplicate settlement',()=>{
 const {s,c}=setup(),n=beginWar(s,c),b=n.domestic.war.battle;
 n.domestic.war.battle=actBattle(b,{type:'retreat'});const r=finishWar(n);
 assert.equal(r.state.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers);
 assert.deepEqual(r.state.domestic.troopKits.depots.central.stock,s.domestic.troopKits.depots.central.stock);
 assert.equal(r.receipt.report.home.initial,214);
 assert.equal(kitAvailability(worldKitDepot(r.state.domestic,'central')).soldiers.used,0);
 assert.throws(()=>finishWar(r.state));validateSave(r.state);
});
test('combat casualties settle exact source population and kit type, with reload-safe reservation',()=>{
 const {s,c}=setup(),n=beginWar(s,c);let b=n.domestic.war.battle;
 for(let i=0;i<12000&&!b.result;i++)b=actBattle(b,aiAction(b));assert.ok(b.result);
 n.domestic.war.battle=b;validateSave(JSON.parse(JSON.stringify(n)));const dead=b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0),r=finishWar(n),stock=r.state.domestic.troopKits.depots.central.stock;
 assert.equal(r.state.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers-dead);
 for(const kind of ['spears','cavalry','heavy-cavalry'])assert.equal(stock[kind],s.domestic.troopKits.depots.central.stock[kind]-b.units.filter(u=>u.side==='home'&&u.kind===kind).reduce((n,u)=>n+u.dead,0));
 assert.equal(r.receipt.report.home.dead,dead);assert.equal(r.state.domestic.war.career.total,1);validateSave(r.state);
});
test('tampered deployment, commander, provenance, bonus and occupation omission fail save validation',()=>{
 const {s,c}=setup(),n=beginWar(s,c);
 for(const mutate of [b=>b.units[0].initial++,b=>b.units[0].kind='infantry',b=>b.units[0].sourceId='guannei',b=>b.units[0].bonus.attack=1,b=>b.units[0].general.martial=99]){const bad=structuredClone(n);mutate(bad.domestic.war.battle);assert.throws(()=>validateSave(bad));}
 const bad=structuredClone(n);bad.domestic.war.battle.command.squads[0].count++;assert.throws(()=>validateSave(bad));
});
test('empty-gear enemy uses actual under-equipped militia, not free complete kits',()=>{
 const {s,c}=setup();for(const d of Object.values(s.domestic.troopKits.depots))for(const k of Object.keys(d.stock))d.stock[k]=0;
 Object.assign(s.domestic.troopKits.depots.central.stock,{spears:137,cavalry:37,'heavy-cavalry':40});
 const n=beginWar(s,c),enemy=n.domestic.war.battle.units.filter(u=>u.side==='enemy');assert.ok(enemy.every(u=>u.equipped===false&&u.equipmentFactor===.5));validateSave(n);
 n.domestic.war.battle=actBattle(n.domestic.war.battle,{type:'retreat'});validateSave(finishWar(n).state);
});
