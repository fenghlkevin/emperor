import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {captureArmyRecovery,offerArmyRecovery,quoteArmyRecovery,executeArmyRecovery,recoveryStatus,recoveryGovernanceBudget,settleArmyRecovery} from '../src/army-recovery.mjs';
import {loseForceKits} from '../src/kit-strategy.mjs';
import {worldKitDepot} from '../src/troop-kit-world.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {actBattle,aiAction} from '../src/battle.mjs';
import {courtCampaignPlan} from '../src/court-campaign.mjs';
import {postTreasury} from '../src/finance.mjs';
import {palaceAction} from '../src/emperor.mjs';
const home=s=>s.domestic.countries.find(c=>c.id==='sheng');
function damaged(){const s=createPlayableGame('战后恢复验收');captureArmyRecovery(s.domestic,s.turn);const a=s.domestic.centralArmy;loseForceKits(s.domestic,{countryId:'sheng',sourceId:'central',soldiers:a.soldiers,training:a.training},a.soldiers);offerArmyRecovery(s.domestic,s.turn);return s;}
function authorize(s,options={}){return executeArmyRecovery(s,{id:s.domestic.armyRecovery.nextId,kind:'start',cap:quoteArmyRecovery(s).suggestedCap,train:true,draft:true,...options}).state;}
function step(s){for(const [phase,kind]of [[1,'view'],[2,'sleep']]){s.phase=phase;const d=s.domestic;s=palaceAction({...s,domestic:undefined},kind).state;s.domestic=d;}s.domestic.strategy.lastTurn=s.turn+1;advance(s);return validateSave(JSON.parse(JSON.stringify(s)));}

test('new-game actual defeat records central recovery target without refunding population, kits or silver',()=>{
 let s=createPlayableGame('真实战败'),d=s.domestic;const before=structuredClone(d.centralArmy),plan=automaticKitFormation({...worldKitDepot(d,'central'),soldiers:{available:d.centralArmy.soldiers},kits:Object.fromEntries(Object.entries(worldKitDepot(d,'central').stock).map(([k,n])=>[k,{available:n}]))},generals(d));
 s=beginWar(s,{id:d.war.nextId,kind:'war',kitVersion:1,targetId:borderingCountries(d)[0].id,...plan});let b=s.domestic.war.battle,ticks=0;while(!b.result&&ticks++<15000)b=actBattle(b,aiAction(b));s.domestic.war.battle=b;s=finishWar(s).state;
 assert.equal(s.domestic.armyRecovery.offer.soldiers,before.soldiers);assert.equal(s.domestic.armyRecovery.offer.training,before.training);assert.equal(s.domestic.armyRecovery.battleTarget,null);assert.ok(s.domestic.centralArmy.soldiers<before.soldiers);assert.ok(home(s).fiscal.treasury<30000);validateSave(s);
});
test('plan authorization is pure spending permission; does not reseed cash, soldiers, gear or population',()=>{
 const s=damaged(),before=JSON.stringify(s),q=quoteArmyRecovery(s);assert.equal(JSON.stringify(s),before);
 const n=authorize(s);assert.equal(home(n).fiscal.treasury,home(s).fiscal.treasury);assert.equal(n.domestic.centralArmy.soldiers,0);assert.deepEqual(worldKitDepot(n.domestic,'central').stock,worldKitDepot(s.domestic,'central').stock);assert.deepEqual(n.domestic.provinces.map(p=>p.population),s.domestic.provinces.map(p=>p.population));assert.ok(q.total>25000);assert.throws(()=>executeArmyRecovery(n,{id:1,kind:'start',cap:50000,train:true,draft:true}),/更新/);
});
test('funded batches debit exact cash, obey per-turn and total ceilings, and cannot replay after reload',()=>{
 let s=authorize(damaged(),{cap:1000}),cash=home(s).fiscal.treasury;settleArmyRecovery(s.domestic,2);s.turn=2;let p=s.domestic.armyRecovery.plan;assert.ok(p.spent>0&&p.spent<=1000);assert.equal(cash-home(s).fiscal.treasury,p.spent);s=validateSave(s);const before=JSON.stringify(s);settleArmyRecovery(s.domestic,2);assert.equal(JSON.stringify(s),before);settleArmyRecovery(s.domestic,3);assert.ok(s.domestic.armyRecovery.plan.spent<=1000);
});
test('food shortfall, debt and active war pause procurement rather than borrowing or minting relief',()=>{
 for(const mode of ['food','debt','battle']){const s=authorize(damaged()),d=s.domestic;if(mode==='food'){home(s).fiscal.grain=0;for(const p of d.provinces.filter(p=>p.countryId==='sheng')){p.population.professions.farmers=0;p.population.professions.herders=0;}}if(mode==='debt')postTreasury(d,'sheng',{turn:1,expense:home(s).fiscal.treasury+1000,allowDebt:true,key:'fixture:debt',reason:'债务压力夹具'});if(mode==='battle')d.war.battle={fixture:true};const cash=home(s).fiscal.treasury,debt=home(s).fiscal.debt,grain=home(s).fiscal.grain;settleArmyRecovery(d,2);assert.equal(d.armyRecovery.plan.spent,0);assert.equal(home(s).fiscal.treasury,cash);assert.equal(home(s).fiscal.debt,debt);assert.equal(home(s).fiscal.grain,grain);}
});
test('stopping releases governance cap without a refund or overwriting a newer user budget',()=>{
 let s=authorize(damaged());s.domestic.governance.budget=500;assert.equal(recoveryGovernanceBudget(s.domestic,500,1),350);settleArmyRecovery(s.domestic,2);s.turn=2;const cash=home(s).fiscal.treasury,paid=s.domestic.armyRecovery.plan.spent;s=executeArmyRecovery(s,{id:2,kind:'cancel'}).state;assert.equal(home(s).fiscal.treasury,cash);assert.equal(s.domestic.armyRecovery.plan.spent,paid);assert.equal(s.domestic.governance.budget,500);assert.equal(recoveryGovernanceBudget(s.domestic,500,2),500);assert.throws(()=>executeArmyRecovery(s,{id:2,kind:'cancel'}),/更新/);
});
test('new-game full wipe recovers within one year with actual payment, recruits and paid training',()=>{
 let s=authorize(damaged()),completed;
 for(let i=0;i<36;i++){s=step(s);if(!s.domestic.armyRecovery.plan.active){completed=s.turn;break;}}
 assert.ok(completed,JSON.stringify(s.domestic.armyRecovery.plan));assert.equal(s.domestic.centralArmy.soldiers,1600);assert.ok(s.domestic.centralArmy.training>=60);assert.ok(s.domestic.armyRecovery.plan.spent>25000);assert.equal(home(s).fiscal.debt,0);assert.equal(s.domestic.governance.budget,1400);assert.equal(recoveryGovernanceBudget(s.domestic,1400,s.turn),1400);
});
test('choosing equipment and manpower only never reports recovered training',()=>{
 let s=authorize(damaged(),{train:false});for(let i=0;i<36&&s.domestic.armyRecovery.plan.active;i++)s=step(s);assert.equal(s.domestic.armyRecovery.plan.active,false);assert.ok(s.domestic.centralArmy.training<60);assert.match(s.domestic.armyRecovery.plan.status,/训练未纳入/);assert.ok(recoveryStatus(s.domestic).gaps.training>0);
});
test('old saves do not acquire free recovery state; malformed authorization cannot bypass a spending cap',()=>{
 const s=createPlayableGame('旧档兼容'),before=JSON.stringify(s.domestic.countries);assert.equal(s.domestic.armyRecovery,undefined);validateSave(s);assert.equal(JSON.stringify(s.domestic.countries),before);
 for(const mutate of [p=>p.spent=p.cap+1,p=>p.target.kits.infantry=-1,p=>p.train='yes',p=>p.completedTurn=0]){const n=authorize(damaged());mutate(n.domestic.armyRecovery.plan);assert.throws(()=>validateSave(n),/恢复/);}
});
test('campaign review exposes force imbalance, actual prices and labor gaps without mutating state',()=>{
 const s=createPlayableGame('出征核价'),d=s.domestic,available={soldiers:{available:1600},kits:Object.fromEntries(Object.entries(worldKitDepot(d,'central').stock).map(([k,n])=>[k,{available:n}]))},f={targetId:borderingCountries(d)[0].id,...automaticKitFormation(available,generals(d))},before=JSON.stringify(s),q=courtCampaignPlan(s,f);
 assert.equal(q.count,1600);assert.equal(q.enemy,4480);assert.equal(q.ratio,35.7);assert.match(q.riskLabel,/很高/);assert.ok(q.replacement.total>25000);assert.ok(q.supply.silver<500);assert.ok(q.idle>=0);assert.equal(JSON.stringify(s),before);
});

test('an exhausted authorization releases optional spending rather than silently extending its cap',()=>{
 const s=authorize(damaged(),{cap:1});settleArmyRecovery(s.domestic,2);assert.equal(s.domestic.armyRecovery.plan.spent,0);assert.equal(s.domestic.armyRecovery.plan.waitingCap,true);assert.equal(recoveryGovernanceBudget(s.domestic,1400,2),1400);assert.match(s.domestic.armyRecovery.plan.status,/核准剩余额度不足/);
});

test('recovery appropriation remains a war-minister responsibility; training and deputy roles cannot authorize it',async()=>{
 const {canOfficeNavigate}=await import('../src/court-office-access.mjs');assert.equal(canOfficeNavigate('war-minister','army-recovery'),true);assert.equal(canOfficeNavigate('central-general','army-recovery'),false);assert.equal(canOfficeNavigate('war-deputy','army-recovery'),false);
});
