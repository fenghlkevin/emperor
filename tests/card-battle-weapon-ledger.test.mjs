import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createKitDepot,kitAvailability,reserveKitSquads,settleKitSquads,transferKitDepot,validateKitDepot,emptyKitStock} from '../src/troop-kits.mjs';
import {newGame,validateSave} from '../src/game.mjs';
import {worldKitDepot,reserveWorldKits,settleWorldKits,executeKitCommand} from '../src/troop-kit-world.mjs';
import {createCardBattlePreview} from '../scripts/card-battle-preview-state.mjs';
import {startCampaign,beginDefense} from '../src/foreign-strategy.mjs';
import {defaultKitDefensePlan} from '../src/kit-defense.mjs';
const depot=()=>createKitDepot('central',100,60,{infantry:100,spears:100,archers:100});
test('extra weapons reserve real whole kits without extra soldiers or a second equipment claim',()=>{
 const d=depot(),before=structuredClone(d),n=reserveKitSquads(d,'war:1',[{kind:'infantry',count:100}],{extraKits:{spears:2}}),a=kitAvailability(n);
 assert.deepEqual(d,before);assert.deepEqual(a.soldiers,{total:100,used:100,available:0});assert.equal(a.kits.infantry.used,100);assert.equal(a.kits.spears.used,2);assert.equal(a.kits.spears.available,98);assert.equal(n.training,60);
 assert.throws(()=>reserveKitSquads(d,'bad',[{kind:'infantry',count:100}],{extraKits:{infantry:1}}),/装备不足/);assert.deepEqual(d,before);
 const target=createKitDepot('other',0,0);assert.throws(()=>transferKitDepot(n,target,{kits:{spears:99}}),/装备不足/);assert.equal(transferKitDepot(n,target,{kits:{spears:98}}).source.stock.spears,2);
});
test('soldier casualty loss and weapon loss settle independently and only once',()=>{
 const d=reserveKitSquads(depot(),'war:1',[{kind:'infantry',count:100}],{extraKits:{infantry:0,spears:2,archers:1}}),before=structuredClone(d),n=settleKitSquads(d,'war:1',[93],{extraKitLoss:{spears:1}});
 assert.deepEqual(d,before);assert.equal(n.soldiers,93);assert.equal(n.stock.infantry,93);assert.equal(n.stock.spears,99);assert.equal(n.stock.archers,100);assert.equal(kitAvailability(n).soldiers.used,0);assert.equal(kitAvailability(n).kits.spears.used,0);assert.equal(n.reservations['war:1'].extraKitLoss.spears,1);assert.throws(()=>settleKitSquads(n,'war:1',[93],{extraKitLoss:{spears:1}}),/已经结算/);
});
test('unbroken extra kits return without shrinking population or fabricating stock',()=>{
 const d=reserveKitSquads(depot(),'war:1',[{kind:'infantry',count:1}],{extraKits:{spears:3}}),n=settleKitSquads(d,'war:1',[1]);assert.equal(n.soldiers,100);assert.deepEqual(n.stock,depot().stock);assert.deepEqual(n.reservations['war:1'].extraKitLoss,emptyKitStock());validateKitDepot(JSON.parse(JSON.stringify(n)));
});
test('over-loss, unknown kinds, non-integers and malformed saved extra occupancy fail atomically',()=>{
 const d=reserveKitSquads(depot(),'war:1',[{kind:'infantry',count:10}],{extraKits:{spears:2}}),before=structuredClone(d);
 for(const options of [null,[],{extraKit:{spears:1}}])assert.throws(()=>reserveKitSquads(depot(),'bad',[{kind:'infantry',count:1}],options));
 for(const options of [null,[],{extraLoss:{spears:1}}])assert.throws(()=>settleKitSquads(d,'war:1',[10],options));
 for(const loss of [{spears:3},{archers:1},{unknown:1},{spears:-1},{spears:.5},{spears:NaN},{spears:Infinity},null,[]])assert.throws(()=>settleKitSquads(d,'war:1',[10],{extraKitLoss:loss}));
 for(const value of [{spears:-1},{spears:.5},{spears:NaN},{spears:Infinity},{unknown:1},null,[]])assert.throws(()=>reserveKitSquads(depot(),'war:2',[{kind:'infantry',count:1}],{extraKits:value}));
 for(const change of [r=>r.extraKits={spears:101},r=>r.extraKits={},r=>r.extraKitLoss={spears:1},r=>{delete r.extraKits;r.extraKitLoss={spears:1};}]){const bad=structuredClone(d);change(bad.reservations['war:1']);assert.throws(()=>validateKitDepot(bad));}
 const sparse=structuredClone(d);sparse.reservations['war:1'].extraKits={spears:2};assert.throws(()=>settleKitSquads(sparse,'war:1',[10],{extraKitLoss:{archers:1}}));assert.deepEqual(d,before);
});
test('separate battles cannot transfer or consume other reserved equipment',()=>{
 let d=createKitDepot('a',100,55,{infantry:100,spears:3});d=reserveKitSquads(d,'one',[{kind:'infantry',count:10}],{extraKits:{spears:2}});assert.throws(()=>reserveKitSquads(d,'two',[{kind:'infantry',count:10}],{extraKits:{spears:2}}));d=reserveKitSquads(d,'two',[{kind:'infantry',count:10}],{extraKits:{spears:1}});const n=settleKitSquads(d,'one',[10],{extraKitLoss:{spears:2}});assert.equal(n.stock.spears,1);assert.equal(kitAvailability(n).kits.spears.available,0);assert.equal(kitAvailability(n).soldiers.used,10);validateKitDepot(n);
});
test('world adapter changes only the actual equipment register for weapon-only loss',()=>{
 const s=newGame('武器账本'),d=s.domestic,before=structuredClone(s),stock=worldKitDepot(d,'central').stock.spears;reserveWorldKits(d,'central','extra:1',[{kind:'infantry',count:1}],{extraKits:{spears:2}});validateSave(JSON.parse(JSON.stringify(s)));settleWorldKits(d,'central','extra:1',[1],{extraKitLoss:{spears:1}});assert.equal(worldKitDepot(d,'central').stock.spears,stock-1);assert.deepEqual(d.centralArmy,before.domestic.centralArmy);assert.deepEqual(d.provinces.map(p=>p.population),before.domestic.provinces.map(p=>p.population));assert.equal(s.stats.treasury,before.stats.treasury);validateSave(JSON.parse(JSON.stringify(s)));assert.throws(()=>settleWorldKits(d,'central','extra:1',[1],{extraKitLoss:{spears:1}}),/已经结算/);
});
test('unfinished weapon integration cannot bypass campaign and defense equipment validation',()=>{
 const s=createCardBattlePreview(),b=s.domestic.war.battle,source=b.units[0].sourceId;s.domestic.troopKits.depots[source].reservations[b.command.kitBattleId].extraKits={spears:1};assert.throws(()=>validateSave(s),/不支持额外武器|占用超过/);
 const defending=newGame('武器守城隔离');defending.turn=37;startCampaign(defending.domestic,'xi','hebei',37);const d=beginDefense(defending,{deployment:defaultKitDefensePlan(defending)}),battle=d.domestic.war.battle,key=battle.command.kitBattleId,sourceId=battle.units[0].sourceId;d.domestic.troopKits.depots[sourceId].reservations[key].extraKits={spears:1};assert.throws(()=>validateSave(d),/不支持额外武器|占用超过/);
});
test('two hundred deterministic ledger scenarios conserve nine kit kinds and sole manpower register',()=>{
 let seed=900031;const random=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<200;i++){const kinds=Object.keys(emptyKitStock()),stock=Object.fromEntries(kinds.map(k=>[k,1000])),n=1+random(100),dead=random(n+1),kind=kinds[random(kinds.length)],extra=Object.fromEntries(kinds.map(k=>[k,random(4)]));extra.spears++;const loss=Object.fromEntries(kinds.map(k=>[k,random(extra[k]+1)])),d=createKitDepot('case',1000,random(101),stock),active=reserveKitSquads(d,'test',[{kind,count:n}],{extraKits:extra}),done=settleKitSquads(active,'test',[n-dead],{extraKitLoss:loss});assert.equal(done.soldiers,1000-dead);for(const k of kinds)assert.equal(done.stock[k],1000-(k===kind?dead:0)-loss[k]);assert.equal(done.training,d.training);assert.deepEqual(kitAvailability(done).soldiers,{total:1000-dead,used:0,available:1000-dead});validateKitDepot(JSON.parse(JSON.stringify(done)));}
});
