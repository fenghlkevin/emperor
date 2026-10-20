import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,actBattle,attackPreview,reachable,attackOptions,initiative,movementLeft,validateBattle,chargeMultiplier} from '../src/battle.mjs';
import {terrainCost,counterFactor,rangedShield,troopSkill} from '../src/battle-tactics.mjs';
const unit=(kind,commander=false)=>({kind,name:kind,count:1000,general:{martial:40,intelligence:40},commander});
function fixture(kind='infantry',target='infantry'){
 const b=createBattle({command:{kind:'war',kitVersion:1,squads:[{}]},friendly:[unit(kind),unit('infantry',true)],enemy:[unit(target),unit('infantry',true)],training:70,enemyTraining:70,targetName:'战术测试'});
 b.tiles.fill('plain');Object.assign(b.units[0],{x:3,y:4});Object.assign(b.units[2],{x:8,y:4});b.order=b.units.map(u=>u.id);return b;
}
test('movement uses weighted terrain and enemy contact stops further traversal',()=>{
 const b=fixture('heavy-cavalry'),u=b.units[0];b.tiles[4*13+4]='hill';
 assert.equal(terrainCost(b,u,4,4),3);assert.equal(reachable(b,u).find(p=>p.x===4&&p.y===4).d,3);
 b.units[2].x=5;assert.ok(reachable(b,u).some(p=>p.x===4&&p.y===4));
 assert.ok(!reachable(b,u).some(p=>p.path.length>1&&p.path[0].x===4&&p.path[0].y===4));
});
test('frontal shield, spear guard and flank counters depend on facing',()=>{
 const b=fixture('heavy-cavalry','spears'),a=b.units[0],t=b.units[2];t.x=4;a.chargeRun=2;a.chargeFacing=0;
 assert.equal(chargeMultiplier(b,a,t),1);assert.equal(counterFactor(t,a),1.35);
 t.facing=0;assert.ok(chargeMultiplier(b,a,t)>1);assert.equal(counterFactor(t,a),1);
 t.kind='infantry';t.facing=3;assert.equal(rangedShield({...a,kind:'archers'},t,true),.6);t.facing=0;assert.equal(rangedShield(a,t,true),1);
 assert.equal(troopSkill(b,a,t,false),1.5);
});
test('camel suppresses only adjacent horse charge and terrain breaks straight charge',()=>{
 const b=fixture('heavy-cavalry'),a=b.units[0],t=b.units[2];a.chargeRun=2;a.chargeFacing=0;
 const full=chargeMultiplier(b,a,t);const camel=b.units[3];Object.assign(camel,{kind:'camel',x:3,y:3});assert.equal(chargeMultiplier(b,a,t),1+(full-1)/2);
 Object.assign(camel,{x:4,y:3});assert.equal(chargeMultiplier(b,a,t),full);
 b.tiles[4*13+4]='hill';const moved=actBattle(b,{type:'move',x:4,y:4});assert.equal(moved.units[0].chargeRun,0);
});
test('light cavalry withdrawal attack preview includes opportunity loss',()=>{
 const b=fixture('cavalry'),a=b.units[0],t=b.units[2];t.x=4;
 const from=attackOptions(b,a).find(o=>o.targetId===t.id).approaches.find(p=>p.path.length>0);assert.ok(from);
 const p=attackPreview(b,a,t,from),n=actBattle(b,{type:'attack',target:t.id,from});
 assert.equal(n.units[0].dead,p.retaliation);assert.equal(n.units[2].dead,p.killed);assert.ok(n.units[2].retaliated);validateBattle(n);
});
test('horse archers reserve shot cost, shoot once, continue moving and survive save validation',()=>{
 let b=fixture('horse-archers');b.units[2].x=6;
 b=actBattle(b,{type:'move',x:3,y:3});const a=b.units[0],p=attackPreview(b,a,b.units[2]);
 b=actBattle(b,{type:'attack',target:'u2',from:p.from});assert.equal(b.cursor,0);assert.equal(movementLeft(b.units[0]),2);assert.deepEqual(attackOptions(b,b.units[0]),[]);
 const cell=reachable(b,b.units[0])[0];b=actBattle(b,{type:'move',x:cell.x,y:cell.y});validateBattle(b);
 assert.equal(b.units[2].dead,p.killed);assert.ok(b.units[0].attacked);
 const bad=structuredClone(b);bad.units[0].moveSpent=999;assert.throws(()=>validateBattle(bad));
 const old=fixture();delete old.tiles;validateBattle(old);
});
test('initiative is independent of mobility and equal speeds alternate side priority each round',()=>{
 let b=fixture('infantry');assert.equal(initiative({...b.units[0],kind:'heavy-cavalry'}),5);
 for(let i=0;i<4;i++)b=actBattle(b,{type:'end'});assert.equal(b.round,2);assert.equal(b.units.find(u=>u.id===b.order[0]).side,'enemy');
 const bad=structuredClone(b);bad.tiles[0]='lava';assert.throws(()=>validateBattle(bad));
});
