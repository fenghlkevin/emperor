import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {validateDomestic} from '../src/domestic.mjs';
import {persistCandidate} from '../src/persistence.mjs';
import {worldKitDepot,worldKitSummary,quoteKitCommand,executeKitCommand,reserveWorldKits,settleWorldKits} from '../src/troop-kit-world.mjs';
const fresh=()=>newGame('军备验收');
const command=(s,fields)=>({id:s.domestic.troopKits.nextId,sourceId:'central',...fields});
const totals=d=>d.provinces.reduce((n,p)=>n+p.population.total,0);
const soldiers=d=>d.provinces.reduce((n,p)=>n+p.population.professions.soldiers,0);
test('new games seed all depots; soldier totals are derived without duplicating central register',()=>{
 const s=fresh(),d=s.domestic,rows=worldKitSummary(d);
 assert.equal(Object.keys(d.troopKits.depots).length,d.provinces.length+1);
 assert.equal(rows.reduce((n,r)=>n+r.soldiers.total,0),d.provinces.filter(p=>p.countryId===d.playerCountryId).reduce((n,p)=>n+p.population.professions.soldiers,0));
 assert.equal(worldKitDepot(d,'central').soldiers,d.centralArmy.soldiers);
 assert.ok(!Object.hasOwn(d.troopKits.depots.central,'soldiers'));
 validateSave(structuredClone(s));
});
test('purchase updates exact depot, treasury, finance and receipt atomically; replay is rejected',()=>{
 const s=fresh(),before=structuredClone(s),c=command(s,{kind:'purchase',quantities:{spears:13}}),q=quoteKitCommand(s,c),r=executeKitCommand(s,c);
 assert.equal(q.cost,130);assert.equal(r.state.domestic.troopKits.depots.central.stock.spears,s.domestic.troopKits.depots.central.stock.spears+13);
 assert.equal(r.state.stats.treasury,s.stats.treasury-q.cost);assert.equal(r.state.domestic.countries[0].ledger[0].entries[0].expenditure,q.cost);
 assert.deepEqual(s,before);assert.throws(()=>executeKitCommand(r.state,c),/已执行/);validateSave(r.state);
});
test('invalid ownership, future types, foreign caller claims and unaffordable quotes cannot publish',()=>{
 const s=fresh(),before=structuredClone(s);
 assert.throws(()=>executeKitCommand(s,command(s,{kind:'purchase',sourceId:'india-core',quantities:{infantry:1}})),/本国/);
 assert.throws(()=>executeKitCommand(s,command(s,{kind:'purchase',quantities:{elephant:1},originId:'india',stable:true})),/产地|采购/);
 assert.throws(()=>executeKitCommand(s,command(s,{kind:'purchase',quantities:{infantry:100000}})),/国库不足/);
 assert.throws(()=>executeKitCommand(s,command(s,{kind:'purchase',quantities:{horses:1}})));
 assert.deepEqual(s,before);
});
test('local procurement does not redirect kits into central depot',()=>{
 const s=fresh(),p=s.domestic.provinces[1],r=executeKitCommand(s,command(s,{kind:'purchase',sourceId:p.id,quantities:{cavalry:5}})).state;
 assert.equal(r.domestic.troopKits.depots[p.id].stock.cavalry,s.domestic.troopKits.depots[p.id].stock.cavalry+5);
 assert.deepEqual(r.domestic.troopKits.depots.central,s.domestic.troopKits.depots.central);validateDomestic(r.domestic,r.turn);
});
test('recruit and dismiss change profession once, preserve population and leave equipment alone',()=>{
 const s=fresh(),r=executeKitCommand(s,command(s,{kind:'recruit',amount:101})).state;
 assert.equal(totals(r.domestic),totals(s.domestic));assert.equal(soldiers(r.domestic),soldiers(s.domestic)+101);
 assert.equal(r.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers+101);
 assert.deepEqual(r.domestic.troopKits.depots,s.domestic.troopKits.depots);
 const n=executeKitCommand(r,command(r,{kind:'dismiss',amount:101})).state;
 assert.equal(soldiers(n.domestic),soldiers(s.domestic));assert.equal(totals(n.domestic),totals(s.domestic));validateSave(n);
});
test('local recruitment only uses local civilians and does not add central soldiers',()=>{
 const s=fresh(),p=s.domestic.provinces[1],r=executeKitCommand(s,command(s,{kind:'recruit',sourceId:p.id,amount:50})).state;
 assert.equal(r.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers);
 assert.equal(worldKitDepot(r.domestic,p.id).soldiers,worldKitDepot(s.domestic,p.id).soldiers+50);validateSave(r);
});
test('central-local and local-central transfer preserve population, military totals and kits',()=>{
 const s=fresh(),id=s.domestic.provinces[1].id,c=command(s,{kind:'transfer',targetId:id,soldiers:103,quantities:{spears:77}}),r=executeKitCommand(s,c).state;
 assert.equal(totals(r.domestic),totals(s.domestic));assert.equal(soldiers(r.domestic),soldiers(s.domestic));
 assert.equal(r.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers-103);validateSave(r);
 const n=executeKitCommand(r,command(r,{kind:'transfer',sourceId:id,targetId:'central',soldiers:103,quantities:{spears:77}})).state;
 assert.equal(n.domestic.centralArmy.soldiers,s.domestic.centralArmy.soldiers);assert.deepEqual(n.domestic.troopKits.depots,s.domestic.troopKits.depots);validateSave(n);
});
test('same-province central/local transfer does not manufacture population',()=>{
 const s=fresh(),id=s.domestic.centralArmy.sourceProvinceId,r=executeKitCommand(s,command(s,{kind:'transfer',targetId:id,soldiers:10,quantities:{}})).state;
 assert.equal(totals(r.domestic),totals(s.domestic));assert.equal(soldiers(r.domestic),soldiers(s.domestic));
 assert.equal(worldKitDepot(r.domestic,id).soldiers,worldKitDepot(s.domestic,id).soldiers+10);validateSave(r);
});
test('world casualty settlement adjusts the sole population register and prevents repeat settlement',()=>{
 const s=fresh(),d=s.domestic,beforePop=totals(d),beforeSoldiers=soldiers(d),beforeCentral=d.centralArmy.soldiers;
 reserveWorldKits(d,'central','war:1',[{kind:'spears',count:100}]);const result=settleWorldKits(d,'central','war:1',[73]);
 assert.equal(result.dead,27);assert.equal(totals(d),beforePop-27);assert.equal(soldiers(d),beforeSoldiers-27);assert.equal(d.centralArmy.soldiers,beforeCentral-27);
 assert.throws(()=>settleWorldKits(d,'central','war:1',[73]),/已经结算/);validateSave(s);
});
test('active reservations prevent transfer and dismiss; malformed save occupancy is rejected',()=>{
 const s=fresh(),reserved=Math.floor(s.domestic.troopKits.depots.central.stock.infantry*.8);reserveWorldKits(s.domestic,'central','war:1',[{kind:'infantry',count:reserved}]);
 assert.throws(()=>executeKitCommand(s,command(s,{kind:'dismiss',amount:s.domestic.centralArmy.soldiers-reserved+1})),/空闲士兵不足/);
 assert.throws(()=>executeKitCommand(s,command(s,{kind:'transfer',targetId:s.domestic.provinces[1].id,quantities:{infantry:300}})));
 const bad=structuredClone(s);bad.domestic.troopKits.depots.central.reservations['war:1'].squads[0].count=999999;
 assert.throws(()=>validateSave(bad),/占用超过/);validateSave(s);
});
test('emergency or ended reign blocks purchases without touching original state',()=>{
 const s=fresh();s.stats.life=0;assert.throws(()=>executeKitCommand(s,command(s,{kind:'purchase',quantities:{infantry:1}})),/不能办理/);
});
test('failed persistence does not publish kits, cash, receipt or command IDs; retry succeeds once',()=>{
 const current=fresh(),before=structuredClone(current),c=command(current,{kind:'purchase',quantities:{infantry:7}}),candidate=executeKitCommand(current,c).state;
 const storage={setItem(){throw Error('quota');}};
 assert.throws(()=>persistCandidate(current,candidate,storage),/保存失败/);assert.deepEqual(current,before);
 let saved;storage.setItem=(key,value)=>{saved=JSON.parse(value);};
 const published=persistCandidate(current,candidate,storage);
 assert.equal(published.domestic.troopKits.nextId,2);assert.equal(saved.domestic.troopKits.history.length,1);
 assert.equal(saved.domestic.troopKits.depots.central.stock.infantry,before.domestic.troopKits.depots.central.stock.infantry+7);
 assert.throws(()=>persistCandidate(current,candidate,storage),/已更新/);assert.throws(()=>executeKitCommand(published,c),/已执行/);
});
