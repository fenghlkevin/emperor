import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,attackPreview,actBattle,canShoot,shootingRange,movement,aiAction,validateBattle} from '../src/battle.mjs';
function fixture(kind='archers'){
 const unit=(kind,commander=false)=>({kind,name:kind,count:1000,general:{martial:40,intelligence:40},commander});
 const b=createBattle({command:{kind:'war',kitVersion:1,squads:[{}]},friendly:[unit(kind),unit('infantry',true)],enemy:[unit('heavy-cavalry'),unit('infantry',true)],training:70,enemyTraining:70,targetName:'测试'});
 Object.assign(b.units[0],{x:3,y:4});Object.assign(b.units[2],{x:6,y:4});b.order=b.units.map(u=>u.id);b.cursor=0;return b;
}
test('stationary ranged preview equals actual casualties without distant melee retaliation',()=>{
 for(const kind of ['archers','crossbows']){const b=fixture(kind),[a,,t]=b.units,p=attackPreview(b,a,t),next=actBattle(b,{type:'attack',target:t.id});assert.equal(p.mode,'ranged');assert.equal(p.movedShot,false);assert.equal(p.retaliation,0);assert.equal(p.canRetaliate,false);assert.equal(next.units[2].dead,p.killed);assert.equal(next.units[0].count,a.count);assert.equal(next.units[2].retaliated,false);validateBattle(next);}
});
test('manual movement and combined approach incur the same shooting penalty',()=>{
 const b=fixture(),[a,,t]=b.units;const stationary=attackPreview(b,a,t);const moved=actBattle(b,{type:'move',x:3,y:3}),p=attackPreview(moved,moved.units[0],moved.units[2]);assert.ok(p.movedShot);assert.ok(p.killed<stationary.killed);const next=actBattle(moved,{type:'attack',target:t.id});assert.equal(next.units[2].dead,p.killed);
 const combined=attackPreview(b,a,t,{x:3,y:3}),direct=actBattle(b,{type:'attack',target:t.id,from:{x:3,y:3}});assert.equal(combined.killed,p.killed);assert.equal(direct.units[2].dead,p.killed);
});
test('adjacent enemies suppress shooting and force weak melee with adjacent retaliation',()=>{
 const b=fixture();Object.assign(b.units[3],{x:4,y:4});b.units[0].moved=true;assert.equal(canShoot(b,b.units[0],b.units[2]),false);assert.equal(attackPreview(b,b.units[0],b.units[2]),null);const p=attackPreview(b,b.units[0],b.units[3]);assert.equal(p.mode,'melee');assert.ok(p.canRetaliate);assert.ok(p.retaliation>0);assert.ok(p.killed<150);
});
test('bow range, crossbow mobility and armor penetration have distinct effects',()=>{
 const bow=fixture(),cross=fixture('crossbows');assert.equal(shootingRange(bow.units[0]),4);assert.equal(shootingRange(cross.units[0]),3);assert.equal(movement(cross.units[0]),2);assert.ok(attackPreview(cross,cross.units[0],cross.units[2]).killed>attackPreview(bow,bow.units[0],bow.units[2]).killed);Object.assign(bow.units[2],{x:7,y:4});Object.assign(cross.units[2],{x:7,y:4});bow.units[0].moved=true;cross.units[0].moved=true;assert.ok(attackPreview(bow,bow.units[0],bow.units[2]));assert.equal(attackPreview(cross,cross.units[0],cross.units[2]),null);
});
test('ranged AI fires from its current position when already in range',()=>{
 const b=fixture(),action=aiAction(b);assert.equal(action.type,'attack');assert.deepEqual(action.from,{x:3,y:4});assert.equal(attackPreview(b,b.units[0],b.units.find(u=>u.id===action.target),action.from).mode,'ranged');
});
