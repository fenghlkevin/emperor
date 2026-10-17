import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {occupyProvince} from '../src/occupation.mjs';
import {executeKitCommand} from '../src/troop-kit-world.mjs';
import {buyForeignKits} from '../src/kit-strategy.mjs';
import {kitGarrison} from '../src/kit-war.mjs';
const cases=[['camel','arabia',30],['elephant','india',60],['horse-archers','east-turk',32]];
const command=(s,sourceId,kind,extra)=>({id:s.domestic.troopKits.nextId,kind,sourceId,...extra});
test('original realms seed their own special kits and field them with actual equipped soldiers',()=>{
 const d=newGame('产地军').domestic;
 for(const [kind,origin]of cases){const p=d.provinces.find(p=>p.id===origin+'-core'),stock=d.troopKits.depots[p.id].stock;assert.ok(stock[kind]>0);const units=kitGarrison(d,p.id,p.population.professions.soldiers,{commander:true});assert.ok(units.some(u=>u.kind===kind));assert.ok(units.every(u=>u.equipped!==false));assert.equal(units.reduce((n,u)=>n+u.count,0),p.population.professions.soldiers);}
});
test('stable occupation permits local purchase and transport; losing origin stops buying but retains transported gear',()=>{
 for(const [kind,origin,price]of cases){let s=newGame('地域采购');const id=origin+'-core';assert.throws(()=>executeKitCommand(s,command(s,'central','purchase',{quantities:{[kind]:1},originId:origin,stable:true})),/产地/);
 occupyProvince(s.domestic,origin,s.turn,'sheng',id);assert.throws(()=>executeKitCommand(s,command(s,id,'purchase',{quantities:{[kind]:1}})),/产地/);let p=s.domestic.provinces.find(p=>p.id===id);p.status.situation='stable';p.occupation.settled=true;
 const before=s.domestic.troopKits.depots[id].stock[kind],r=executeKitCommand(s,command(s,id,'purchase',{quantities:{[kind]:7}}));assert.equal(r.receipt.cost,price*7);s=r.state;assert.equal(s.domestic.troopKits.depots[id].stock[kind],before+7);
 s=executeKitCommand(s,command(s,id,'transfer',{targetId:'central',amount:0,quantities:{[kind]:7}})).state;assert.equal(s.domestic.troopKits.depots.central.stock[kind],7);occupyProvince(s.domestic,'sheng',s.turn,origin,id);assert.throws(()=>executeKitCommand(s,command(s,id,'purchase',{quantities:{[kind]:1}})));assert.equal(s.domestic.troopKits.depots.central.stock[kind],7);validateSave(s);}
});
test('foreign procurement obeys identical stable origin limits and whole-kit prices',()=>{
 for(const [kind,origin,price]of cases){const s=newGame('敌军采购'),d=s.domestic,p=d.provinces.find(p=>p.id===origin+'-core');d.troopKits.depots[p.id].stock[kind]=0;p.status.situation='unrest';buyForeignKits(d,p,1000,s.turn);assert.equal(d.troopKits.depots[p.id].stock[kind],0);p.status.situation='stable';const spent=buyForeignKits(d,p,1000,s.turn+1);assert.equal(spent,d.troopKits.depots[p.id].stock[kind]*price);assert.ok(spent>0);validateSave(s);}
});
test('all nine equipped kinds fit a mixed depot without fake militia, while limited allied slots retain reserves',()=>{
 const d=newGame('九兵混编').domestic,stock=d.troopKits.depots.central.stock;for(const id of Object.keys(stock))stock[id]=100;stock.infantry=200;
 const all=kitGarrison(d,'central',1000,{commander:true});assert.equal(all.length,10);assert.equal(all.reduce((n,u)=>n+u.count,0),1000);assert.equal(new Set(all.map(u=>u.kind)).size,9);assert.ok(all.every(u=>u.equipped!==false));
 const limited=kitGarrison(d,'central',1000,{maxStacks:2,allowReserve:true});assert.equal(limited.length,2);assert.ok(limited.reduce((n,u)=>n+u.count,0)<1000);assert.ok(limited.every(u=>u.equipped!==false));assert.equal(Object.keys(d.troopKits.depots.central.reservations).length,0);
});
test('maximum mixed defenders and two allied contingents stay inside the board without overlapping',async()=>{
 const {createBattle,validateBattle}=await import('../src/battle.mjs');const d=newGame('最大编队').domestic,stock=d.troopKits.depots.central.stock;for(const id of Object.keys(stock))stock[id]=100;stock.infantry=200;
 const main=kitGarrison(d,'central',1000,{commander:true}),allies=[...kitGarrison(d,'central',1000,{maxStacks:2,allowReserve:true}),...kitGarrison(d,'central',1000,{maxStacks:2,allowReserve:true})],home=[{kind:'infantry',count:100,name:'本队'},{kind:'infantry',count:100,name:'亲卫',commander:true}];
 const b=createBattle({command:{kind:'war',kitVersion:1,squads:[{}]},friendly:home,enemy:[...main,...allies],training:60,enemyTraining:60,targetName:'满编'});validateBattle(b);assert.ok(b.units.every(u=>u.y>=0&&u.y<9));assert.equal(new Set(b.units.map(u=>`${u.x},${u.y}`)).size,b.units.length);
});
