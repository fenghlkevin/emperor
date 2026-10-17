import test from 'node:test';
import assert from 'node:assert/strict';
import {createBattle,attackPreview,actBattle,movement,validateBattle} from '../src/battle.mjs';
import {newGame} from '../src/game.mjs';
import {kitOrigin,kitSurface,kitProductionAllowed,quoteKitPurchase} from '../src/troop-kits.mjs';
import {battlefieldFor} from '../src/war.mjs';
const unit=(kind,commander=false)=>({kind,name:kind,count:1000,general:{martial:40,intelligence:40},commander});
function fixture(kind,target='infantry',surface='normal'){
 const b=createBattle({command:{kind:'war',kitVersion:1,squads:[{}]},friendly:[unit(kind),unit('infantry',true)],enemy:[unit(target),unit('infantry',true)],training:70,enemyTraining:70,targetName:'特色测试',field:{terrain:'平原型',surface,defense:1}});
 Object.assign(b.units[0],{x:3,y:4});Object.assign(b.units[2],{x:4,y:4});b.order=b.units.map(u=>u.id);b.cursor=0;return b;
}
test('camel has measured desert and ordinary horse bonuses with identical preview and action',()=>{
 const plain=fixture('camel','cavalry'),desert=fixture('camel','cavalry','desert'),spear=fixture('camel','spears'),ordinary=fixture('infantry','cavalry');
 const preview=b=>attackPreview(b,b.units[0],b.units[2],{x:3,y:4});assert.ok(preview(desert).killed>preview(plain).killed);assert.ok(preview(plain).killed>preview(ordinary).killed);assert.ok(preview(spear).killed<preview(plain).killed);assert.ok(preview(desert).desertBonus);const n=actBattle(desert,{type:'attack',target:'u2',from:{x:3,y:4}});assert.equal(n.units[2].dead,preview(desert).killed);validateBattle(n);
});
test('elephant is slow, hits harder and suppresses only this target retaliation by half',()=>{
 const b=fixture('elephant'),control=fixture('infantry'),p=attackPreview(b,b.units[0],b.units[2],{x:3,y:4});assert.equal(movement(b.units[0]),2);assert.equal(p.retaliationSuppression,.5);assert.ok(p.killed>attackPreview(control,control.units[0],control.units[2],{x:3,y:4}).killed);
 const n=actBattle(b,{type:'attack',target:'u2',from:{x:3,y:4}});assert.equal(n.units[0].dead,p.retaliation);assert.ok(p.retaliation<attackPreview(control,control.units[0],control.units[2],{x:3,y:4}).retaliation);assert.equal(n.units[2].retaliationFactor,undefined);validateBattle(n);
});
test('horse archer can move and shoot without penalty but has shorter weaker fire than dedicated archers',()=>{
 const b=fixture('horse-archers');b.units[2].x=6;const bow=fixture('archers');bow.units[2].x=6;
 const p=attackPreview(b,b.units[0],b.units[2]);assert.ok(p.killed<attackPreview(bow,bow.units[0],bow.units[2]).killed);assert.equal(movement(b.units[0]),4);const moved=actBattle(b,{type:'move',x:3,y:5}),q=attackPreview(moved,moved.units[0],moved.units[2]);assert.equal(q.killed,p.killed);assert.equal(q.mobileShot,true);assert.equal(q.movedShot,false);assert.equal(q.retaliation,0);
});
test('production and desert surface follow immutable province identity and stable occupation',()=>{
 const d=newGame('产地').domestic;assert.equal(battlefieldFor(d,'maghreb',1).surface,'desert');
 for(const [kind,origins]of [['camel',['arabia','maghreb']],['elephant',['india','chenla','pyu']],['horse-archers',['east-turk','west-turk','uyghur','steppe']]])for(const id of origins){const p=d.provinces.find(p=>p.id===id+'-core');assert.ok(p,id);p.status.situation='stable';delete p.occupation;assert.equal(kitOrigin(p),id);assert.ok(kitProductionAllowed(p,kind));assert.ok(quoteKitPurchase({[kind]:1},kitOrigin(p)).cost>0);p.countryId='sheng';p.occupation={settled:false};assert.equal(kitProductionAllowed(p,kind),false);p.occupation.settled=true;assert.equal(kitProductionAllowed(p,kind),true);assert.equal(kitProductionAllowed(d.provinces[0],kind),false);}
 const arabia=d.provinces.find(p=>p.id==='arabia-core');assert.equal(kitSurface(arabia),'desert');
});
test('ranged AI breaks contact to shoot and horse archers exploit mobile fire without a melee retaliation',async()=>{
 const {aiAction}=await import('../src/battle.mjs');for(const kind of ['archers','crossbows','horse-archers']){const b=fixture(kind),a=b.units[0],target=b.units[2],action=aiAction(b);assert.equal(action.type,'attack');const p=attackPreview(b,a,b.units.find(u=>u.id===action.target),action.from);assert.equal(p.mode,'ranged');assert.equal(p.retaliation,0);assert.ok(p.path.length>0);const n=actBattle(b,action);assert.equal(n.units.find(u=>u.id===action.target).dead,p.killed);assert.equal(n.units[0].dead,0);}
});
test('kit commander stays behind living squads and escapes instead of taking a fatal counterattack',async()=>{
 const {aiAction}=await import('../src/battle.mjs'),b=fixture('infantry'),guard=b.units[1];b.order=[guard.id,...b.order.filter(id=>id!==guard.id)];b.units[2].x=10;assert.equal(aiAction(b).type,'defend');Object.assign(b.units[0],{x:2,y:0});Object.assign(guard,{x:3,y:4,count:40,initial:40});Object.assign(b.units[2],{x:4,y:4});const action=aiAction(b);assert.equal(action.type,'move');assert.ok(action.x<guard.x||action.y!==guard.y);validateBattle(actBattle(b,action));
});
