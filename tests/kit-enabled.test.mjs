import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {quoteRevenue} from '../src/revenue.mjs';
import {quoteGeneral} from '../src/general.mjs';
import {quoteWar} from '../src/war.mjs';
import {executeNational} from '../src/national-actions.mjs';
import {worldKitDepot,worldKitSummary} from '../src/troop-kit-world.mjs';
import {militaryReport} from '../src/military-ui.mjs';
import {settleAuspices,auspiceDefinition,AUSPICES} from '../src/auspices.mjs';
import {loseForceKits,buyForeignKits,kitForceStrength} from '../src/kit-strategy.mjs';
import {capitalFalls,resolveCapital} from '../src/capital-crisis.mjs';
import {createBattle,damageEstimate,movement,attackPreview,actBattle,chargeMultiplier} from '../src/battle.mjs';
test('new games default to kit rules, block loose procurement/transfer/war and show only kit inventory',()=>{
 const s=newGame('新军制');assert.ok(s.domestic.troopKits.depots.central);assert.equal(Object.keys(s.domestic.troopKits.depots.central.stock).length,9);
 assert.throws(()=>quoteRevenue(s,{kind:'purchase',targetId:'central',quantities:{horses:1}}),/政令无效|军令无效/);
 assert.throws(()=>quoteGeneral(s,{kind:'transfer',targetId:'hebei',quantities:{soldiers:1}}),/政令无效|军令无效/);
 assert.throws(()=>quoteWar(s,{kind:'recruit',amount:1}),/套装/);
 const html=militaryReport(s.domestic,'sheng',null,'summary');assert.ok(html.includes('重骑兵装备'));assert.ok(!html.includes('头盔'));validateSave(s);
});
test('national army recall uses kit occupancy and preserves world population',()=>{
 const s=newGame('回调'),p=s.domestic.provinces[1],before=s.domestic.centralArmy.soldiers,stock=s.domestic.troopKits.depots.central.stock.spears,total=s.domestic.provinces.reduce((n,p)=>n+p.population.total,0),r=executeNational(s,{id:s.domestic.stateDevelopment.nextId,kind:'return-garrison',provinceId:p.id,amount:17,quantities:{spears:13}}).state;
 assert.equal(r.domestic.centralArmy.soldiers,before+17);assert.equal(r.domestic.troopKits.depots.central.stock.spears,stock+13);assert.equal(r.domestic.provinces.reduce((n,p)=>n+p.population.total,0),total);validateSave(r);
});
test('military auspices grant complete kits with matching notification text, never loose parts',()=>{
 for(const id of ['arms','steeds']){const s=newGame('军备祥瑞');s.turn=2;const e=auspiceDefinition(s,id),before=s.domestic.troopKits.depots.central.stock[e.resource],values=[0,(AUSPICES.findIndex(e=>e.id===id)+.1)/AUSPICES.length];settleAuspices(s,()=>values.shift());assert.equal(s.domestic.troopKits.depots.central.stock[e.resource],before+e.amount);assert.ok(e.label.includes('装备'));assert.equal(e.unit,'人份');validateSave(s);}
});
test('foreign procurement uses same whole-kit prices and losses debit one real source once',()=>{
 const s=newGame('外国军备'),d=s.domestic,p=d.provinces.find(p=>p.countryId==='xi'),f={sourceId:p.id,countryId:p.countryId,soldiers:p.population.professions.soldiers,training:p.military.training},beforePopulation=p.population.total,beforeKits=Object.values(d.troopKits.depots[p.id].stock).reduce((n,v)=>n+v,0);
 const power=kitForceStrength(d,f);assert.ok(power>0);loseForceKits(d,f,137);assert.equal(p.population.total,beforePopulation-137);assert.equal(Object.values(d.troopKits.depots[p.id].stock).reduce((n,v)=>n+v,0),beforeKits-137);
 d.troopKits.depots[p.id].stock.spears=0;const treasury=d.countries.find(c=>c.id===p.countryId).fiscal.treasury,cost=buyForeignKits(d,p,800,s.turn);assert.ok(cost>0&&cost<=800);assert.equal(d.countries.find(c=>c.id===p.countryId).fiscal.treasury,treasury-cost);assert.ok(d.troopKits.depots[p.id].stock.spears>0);validateSave(s);
});
test('capital relocation preserves central kit stock and surrender transfers it into the captured garrison',()=>{
 const s=newGame('迁都军备'),stock=structuredClone(s.domestic.troopKits.depots.central.stock),old=s.domestic.centralArmy.sourceProvinceId;capitalFalls(s.domestic,'xi',s.turn);
 const r=resolveCapital(s,{kind:'relocate',provinceId:s.domestic.provinces.find(p=>p.countryId==='sheng'&&p.id!==old).id}).state;assert.deepEqual(r.domestic.troopKits.depots.central.stock,stock);validateSave(r);
 const before=structuredClone(s.domestic.troopKits.depots[old].stock),ended=resolveCapital(s,{kind:'surrender',confirm:true}).state;
 for(const id of Object.keys(stock)){assert.equal(ended.domestic.troopKits.depots.central.stock[id],0);assert.equal(ended.domestic.troopKits.depots[old].stock[id],before[id]+stock[id]);}validateSave(ended);
});
function battle(){const general={martial:50,intelligence:50},b=createBattle({command:{kind:'war',id:1,kitVersion:1,squads:[{}],commanderSquad:{}},friendly:[{kind:'heavy-cavalry',count:100,name:'重骑',general},{kind:'infantry',count:100,commander:true,name:'主将',general}],enemy:[{kind:'infantry',count:1000,name:'目标',general},{kind:'infantry',count:100,commander:true,name:'敌将',general}],training:60,enemyTraining:60,targetName:'演练'});b.units[0].x=2;b.units[0].y=4;b.units[2].x=5;b.units[2].y=4;b.order=[b.units[0].id,...b.order.filter(id=>id!==b.units[0].id)];b.cursor=0;return b;}
test('heavy cavalry is slower, harder to kill and only straight approach attacks gain charge',()=>{
 const b=battle(),a=b.units[0],t=b.units[2];assert.equal(movement(a),3);assert.equal(movement({...a,kind:'cavalry'}),4);
 assert.ok(damageEstimate(b,{...t,count:100},{...a,count:1000})<damageEstimate(b,{...t,count:100},{...a,kind:'cavalry',count:1000}));
 const p=attackPreview(b,a,t,{x:4,y:4});assert.equal(p.chargeMultiplier,1.3);const n=actBattle(b,{type:'attack',target:t.id,from:{x:4,y:4}});assert.equal(t.count-n.units[2].count,p.killed);assert.ok(n.log.some(l=>l.includes('冲锋 +30%')));
 const moved=actBattle(b,{type:'move',x:4,y:4});assert.equal(attackPreview(moved,moved.units[0],moved.units[2]).chargeMultiplier,1.3);
 const bent=structuredClone(a);bent.chargeRun=2;bent.chargeFacing=1;assert.equal(chargeMultiplier(b,bent,t),1);
});
