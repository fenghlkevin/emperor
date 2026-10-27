import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {captureArmyRecovery,offerArmyRecovery,quoteArmyRecovery,executeArmyRecovery,settleArmyRecovery,recoveryFunding} from '../src/army-recovery.mjs';
import {loseForceKits} from '../src/kit-strategy.mjs';
import {executeKitCommand,quoteKitCommand,worldKitDepot} from '../src/troop-kit-world.mjs';
import {executeGeneral} from '../src/general.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {settleGovernance} from '../src/governance.mjs';
import {industrialProcurement} from '../src/supply-economy.mjs';
import {postTreasury} from '../src/finance.mjs';
import {officialEffectSource} from '../src/official-effects.mjs';
const home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
// Domain-loss fixture isolates ordering; the audit separately repeats actual battles.
function damaged(options={}){
 let s=createPlayableGame('分批恢复边界');
 captureArmyRecovery(s.domestic,1);
 const a=s.domestic.centralArmy;
 loseForceKits(s.domestic,{countryId:s.domestic.playerCountryId,sourceId:'central',soldiers:a.soldiers,training:a.training},a.soldiers);
 offerArmyRecovery(s.domestic,1);
 return executeArmyRecovery(s,{id:s.domestic.armyRecovery.nextId,kind:'start',cap:quoteArmyRecovery(s).suggestedCap,train:true,draft:true,...options}).state;
}
const purchase=(s,n)=>executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:{infantry:n}}).state;
function batch(s){s.turn++;settleArmyRecovery(s.domestic,s.turn);return validateSave(JSON.parse(JSON.stringify(s)));}
test('available paid equipment recruits immediately while other equipment targets remain missing',()=>{
 let s=purchase(damaged({cap:400}),100),before=structuredClone(worldKitDepot(s.domestic,'central').stock),cash=home(s).fiscal.treasury,target=structuredClone(s.domestic.armyRecovery.plan.target);
 s=batch(s);assert.equal(s.domestic.centralArmy.soldiers,100);assert.deepEqual(worldKitDepot(s.domestic,'central').stock,before);assert.equal(cash-home(s).fiscal.treasury,400);assert.equal(s.domestic.armyRecovery.plan.spent,400);assert.deepEqual(s.domestic.armyRecovery.plan.target,target);assert.ok(before.cavalry<target.kits.cavalry);
 const saved=JSON.stringify(s);settleArmyRecovery(s.domestic,s.turn);assert.equal(JSON.stringify(s),saved);
});
test('basic formation is recruited and paid training begins before full reserves or specialist equipment',()=>{
 let s=purchase(damaged({cap:1260}),300),cash=home(s).fiscal.treasury;s=batch(s);assert.equal(s.domestic.centralArmy.soldiers,300);assert.ok(s.domestic.general.trainingEffect.delta>0);assert.equal(cash-home(s).fiscal.treasury,1220);assert.equal(s.domestic.armyRecovery.plan.spent,1220);assert.ok(worldKitDepot(s.domestic,'central').stock.cavalry<s.domestic.armyRecovery.plan.target.kits.cavalry);
 assert.throws(()=>executeGeneral(s,{id:s.domestic.general.nextId,kind:'train'}),/本旬已训练/);
 for(let i=0;i<2;i++)s=batch(s);assert.ok(s.domestic.centralArmy.training>=40);assert.equal(s.domestic.armyRecovery.plan.spent,1260);
});
test('empty depots alternate actual purchases and equipped recruitment instead of filling all reserves first',()=>{
 let s=damaged(),firstPurchase;for(let i=0;i<12&&s.domestic.centralArmy.soldiers<300;i++){
  const old=worldKitDepot(s.domestic,'central'),stock=Object.values(old.stock).reduce((n,v)=>n+v,0),cash=home(s).fiscal.treasury,paid=s.domestic.armyRecovery.plan.spent;
  s=batch(s);const delta=s.domestic.armyRecovery.plan.spent-paid;assert.equal(cash-home(s).fiscal.treasury,delta);assert.ok(delta<=1400);
  if(!firstPurchase)firstPurchase=structuredClone(worldKitDepot(s.domestic,'central').stock);
  assert.ok(s.domestic.centralArmy.soldiers<=Object.values(worldKitDepot(s.domestic,'central').stock).reduce((n,v)=>n+v,0));
 }
 assert.ok(s.domestic.centralArmy.soldiers>=300);assert.ok(firstPurchase.infantry<300);assert.equal(worldKitDepot(s.domestic,'central').stock.cavalry,0);
});
test('debt-time recruitment obeys the same cash, surplus, debt and authorization ceilings',()=>{
 let s=purchase(damaged({debtRecovery:true,cap:200}),300);
 postTreasury(s.domestic,s.domestic.playerCountryId,{turn:1,expense:home(s).fiscal.treasury+1000,allowDebt:true,key:'fixture:obligation',reason:'强制支出夹具'});
 s.turn=2;postTreasury(s.domestic,s.domestic.playerCountryId,{turn:2,income:15000,category:'regular',key:'fixture:income',reason:'实收夹具'});
 const f=recoveryFunding(s.domestic,2),cash=home(s).fiscal.treasury,debt=home(s).fiscal.debt;
 settleArmyRecovery(s.domestic,2);assert.equal(s.domestic.centralArmy.soldiers,50);assert.equal(s.domestic.armyRecovery.plan.spent,200);assert.equal(cash-home(s).fiscal.treasury,200);assert.equal(home(s).fiscal.debt,debt);assert.ok(200<=f.turnLimit&&200<=f.net*.25);assert.ok(home(s).fiscal.treasury>=f.reserve);
 s=validateSave(JSON.parse(JSON.stringify(s)));s=batch(s);assert.equal(s.domestic.armyRecovery.plan.spent,200);assert.ok(s.domestic.armyRecovery.plan.waitingCap);
});
test('training opt-out skips the basic training priority and never silently changes authorization',()=>{
 let s=purchase(damaged({train:false,cap:2400}),600);s=batch(s);const training=s.domestic.centralArmy.training;s=batch(s);assert.equal(s.domestic.centralArmy.soldiers,600);assert.equal(s.domestic.centralArmy.training,training);assert.equal(s.domestic.general.manualTrainingTurn,undefined);assert.equal(s.domestic.armyRecovery.plan.train,false);
});

function delegated(){
 let s=createPlayableGame('委任实支对账');
 for(const p of s.domestic.provinces.filter(p=>p.countryId===s.domestic.playerCountryId))s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:p.id,civil:false,military:p.id==='hebei',budget:1400,priority:'security',locks:[]}).state;
 return executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'recruit',sourceId:'hebei',amount:100}).state;
}
for(const discount of ['zero','partial','cap'])test(`delegated ${discount} discount reconciles procurement, losses and training to actual cash`,()=>{
 let s=delegated(),d=s.domestic;
 // Explicit industrial-capacity fixtures, never presented as naturally played policies.
 if(discount!=='partial')for(const p of d.provinces.filter(p=>p.countryId===d.playerCountryId)){if(discount==='zero')p.population.professions.workers=0;else p.economy.industry.productivity=10000;}
 const rate=industrialProcurement(d);assert.ok(discount==='zero'?rate===0:discount==='cap'?rate===.2:rate>0&&rate<.2);
 const expected=quoteKitCommand(s,{kind:'purchase',sourceId:'hebei',quantities:{infantry:100}}).cost;
 const actor=officialEffectSource(d,'hebei-general',{provinceId:'hebei',role:'general'}),cash=home(s).fiscal.treasury;
 settleGovernance(d,1);const record=d.governance.records.find(r=>r.reason.startsWith('补充现有驻军'));
 assert.equal(record.cost,expected+Math.ceil(expected*actor.lossRate));
 assert.equal(home(s).fiscal.treasury,cash-d.governance.spent);
 assert.equal(d.governance.spent,d.governance.records.reduce((n,r)=>n+r.cost,0));
 const entries=home(s).ledger.find(r=>r.turn===1).entries.filter(r=>r.key!=='troop-kit:1:recruit');
 assert.equal(entries.reduce((n,r)=>n+r.expenditure,0),d.governance.spent);
 if(discount!=='zero')assert.ok(d.governance.records.some(r=>r.cost>0&&r.reason.startsWith('驻军训练不足')));
 const saved=JSON.stringify(d);settleGovernance(d,1);assert.equal(JSON.stringify(d),saved);
 // The deliberately huge productivity fixture is outside normal save bounds.
 if(discount!=='cap')s=validateSave(JSON.parse(JSON.stringify(s)));
});
test('delegated procurement fits the discounted quote plus net-price loss at a tight cash boundary',()=>{
 const s=delegated(),d=s.domestic,actor=officialEffectSource(d,'hebei-general',{provinceId:'hebei',role:'general'}),q=quoteKitCommand(s,{kind:'purchase',sourceId:'hebei',quantities:{infantry:100}});
 const allowed=q.cost+Math.ceil(q.cost*actor.lossRate);
 postTreasury(d,d.playerCountryId,{turn:1,expense:home(s).fiscal.treasury-d.governance.reserve-allowed,key:'fixture:cash',reason:'保留线边界夹具'});
 const before=worldKitDepot(d,'hebei').stock.infantry;settleGovernance(d,1);
 assert.equal(worldKitDepot(d,'hebei').stock.infantry-before,100);assert.equal(d.governance.spent,allowed);assert.equal(home(s).fiscal.treasury,d.governance.reserve);assert.ok(d.governance.records.some(r=>r.cost===0&&r.reason.startsWith('驻军训练不足')));
 validateSave(s);
});
