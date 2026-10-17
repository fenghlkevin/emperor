import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TROOP_KITS,emptyKitStock,createKitDepot,validateKitDepot,kitAvailability,reserveKitSquads,settleKitSquads,transferKitDepot,quoteKitPurchase} from '../src/troop-kits.mjs';
const depot=()=>createKitDepot('central',1000,60,{infantry:500,spears:400,cavalry:200});
test('nine complete kit types have separate stocks, with no independent mounts or armor',()=>{
 assert.equal(TROOP_KITS.length,9);assert.equal(new Set(TROOP_KITS.map(k=>k.id)).size,9);assert.equal(Object.keys(emptyKitStock()).length,9);
 assert.throws(()=>createKitDepot('central',1,0,{horses:1}));assert.throws(()=>{TROOP_KITS[0].price=0;});
});
test('reserve whole kits by exact soldier count without mutating depot',()=>{
 const d=depot(),before=structuredClone(d),next=reserveKitSquads(d,'war:1',[{kind:'spears',count:137},{kind:'cavalry',count:63}]);
 assert.deepEqual(d,before);assert.deepEqual(kitAvailability(next).soldiers,{total:1000,used:200,available:800});
 assert.deepEqual(kitAvailability(next).kits.spears,{total:400,used:137,available:263});
});
test('combined squads and concurrent armies cannot double spend equipment or soldiers',()=>{
 const d=reserveKitSquads(depot(),'war:1',[{kind:'spears',count:300}]);
 assert.throws(()=>reserveKitSquads(d,'defense:1',[{kind:'spears',count:60},{kind:'spears',count:41}]),/装备不足/);
 assert.throws(()=>reserveKitSquads(d,'defense:1',[{kind:'infantry',count:500},{kind:'cavalry',count:200},{kind:'spears',count:1}]),/士兵不足/);
 assert.throws(()=>reserveKitSquads(d,'war:1',[{kind:'infantry',count:1}]),/已经使用/);
});
test('casualties consume exact matching kit quantities and release survivors once',()=>{
 const d=reserveKitSquads(depot(),'war:1',[{kind:'spears',count:300},{kind:'cavalry',count:100}]),before=structuredClone(d);
 const n=settleKitSquads(d,'war:1',[220,73]);assert.deepEqual(d,before);
 assert.equal(n.soldiers,893);assert.equal(n.stock.spears,320);assert.equal(n.stock.cavalry,173);
 assert.equal(kitAvailability(n).soldiers.used,0);assert.equal(kitAvailability(n).soldiers.available,893);
 assert.throws(()=>settleKitSquads(n,'war:1',[220,73]),/已经结算/);
 assert.throws(()=>reserveKitSquads(n,'war:1',[{kind:'spears',count:1}]),/已经使用/);
});
test('retreat returns all kits, annihilation loses all deployed kits and leaves reserves',()=>{
 const d=reserveKitSquads(depot(),'war:1',[{kind:'spears',count:300}]);
 const retreat=settleKitSquads(d,'war:1',[300]);assert.equal(retreat.soldiers,1000);assert.equal(retreat.stock.spears,400);
 const dead=settleKitSquads(d,'war:1',[0]);assert.equal(dead.soldiers,700);assert.equal(dead.stock.spears,100);assert.equal(dead.stock.infantry,500);
});
test('invalid survivors cannot create soldiers or consume resources',()=>{
 const d=reserveKitSquads(depot(),'war:1',[{kind:'spears',count:100}]),before=structuredClone(d);
 for(const s of [[101],[-1],[.5],[NaN],[],[100,1]])assert.throws(()=>settleKitSquads(d,'war:1',s));
 assert.deepEqual(d,before);
});
test('transfers respect active reservations and conserve soldiers and every kit',()=>{
 const source=reserveKitSquads(depot(),'war:1',[{kind:'spears',count:300}]),target=createKitDepot('province',200,20);
 assert.throws(()=>transferKitDepot(source,target,{kits:{spears:101}}));
 assert.throws(()=>transferKitDepot(source,target,{soldiers:701}));
 const moved=transferKitDepot(source,target,{soldiers:100,kits:{spears:100,cavalry:20}});
 assert.equal(moved.target.training,33);assert.equal(moved.source.soldiers+moved.target.soldiers,1200);
 for(const id of Object.keys(emptyKitStock()))assert.equal(moved.source.stock[id]+moved.target.stock[id],source.stock[id]+target.stock[id]);
 assert.equal(kitAvailability(moved.source).soldiers.used,300);assert.equal(source.soldiers,1000);assert.equal(target.soldiers,200);
});
test('special kits require original region and stable control, not an arbitrary country label',()=>{
 assert.equal(quoteKitPurchase({camel:100},'arabia').cost,3000);
 assert.equal(quoteKitPurchase({elephant:100},'india').cost,6000);
 assert.equal(quoteKitPurchase({'horse-archers':100},'steppe').cost,3200);
 assert.throws(()=>quoteKitPurchase({camel:1},'india'),/产地/);
 assert.throws(()=>quoteKitPurchase({elephant:1},'india',{stable:false}),/产地/);
 assert.ok(quoteKitPurchase({infantry:100},'india',{stable:false}).cost>0);
 assert.throws(()=>quoteKitPurchase({},'arabia'));assert.throws(()=>quoteKitPurchase({camel:Number.MAX_SAFE_INTEGER},'arabia'));
});
test('malformed and forged reservations are rejected',()=>{
 for(const id of ['','__proto__','constructor','prototype'])assert.throws(()=>reserveKitSquads(depot(),id,[{kind:'infantry',count:1}]));
 for(const count of [0,-1,.5,NaN,Infinity])assert.throws(()=>reserveKitSquads(depot(),'war:1',[{kind:'infantry',count}]));
 const d=depot();d.reservations.bad={status:'active',squads:[{kind:'cavalry',count:201}]};assert.throws(()=>validateKitDepot(d));
 const n=depot();n.reservations.bad={status:'settled',squads:[{kind:'infantry',count:100}],survivors:[101]};assert.throws(()=>validateKitDepot(n));
});
