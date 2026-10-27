import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {captureArmyRecovery,offerArmyRecovery,executeArmyRecovery,quoteArmyRecovery,recoveryStatus,settleArmyRecovery,recoveryGovernanceBudget,recoveryFunding,recoveryCrisis,refreshArmyRecoveryStatus} from '../src/army-recovery.mjs';
import {beginWar,finishWar,generals,borderingCountries,borderingProvinces} from '../src/war.mjs';
import {startCampaign} from '../src/foreign-strategy.mjs';
import {actBattle,aiAction} from '../src/battle.mjs';
import {worldKitDepot,executeKitCommand} from '../src/troop-kit-world.mjs';
import {executeGeneral} from '../src/general.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {postTreasury} from '../src/finance.mjs';
const home=s=>s.domestic.countries.find(c=>c.id==='sheng');
function battle(s){const l=generals(s.domestic);s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:borderingCountries(s.domestic)[0].id,generalId:l[0].id,commanderSquad:{kind:'infantry',count:20},squads:[{kind:'infantry',count:100,generalId:l[1].id}]});let b=s.domestic.war.battle;for(let i=0;i<15000&&!b.result;i++)b=actBattle(b,aiAction(b));assert.ok(b.result);s.domestic.war.battle=b;return finishWar(s).state;}
const command=(s,kind,extra={})=>executeArmyRecovery(s,{id:s.domestic.armyRecovery.nextId,kind,...extra}).state;
const start=(s,extra={})=>command(s,'start',{cap:quoteArmyRecovery(s).suggestedCap,train:true,draft:true,...extra});
// Accounting fixture: mandatory shortfall creates debt, later cash is posted and remains fully auditable.
function fundedDebt(){let s=start(battle(createPlayableGame('偿债整军')),{debtRecovery:true});postTreasury(s.domestic,'sheng',{turn:1,expense:home(s).fiscal.treasury+1000,allowDebt:true,key:'fixture:mandatory',reason:'强制支出压力夹具'});s.turn=2;postTreasury(s.domestic,'sheng',{turn:2,income:15000,category:'regular',key:'fixture:income',reason:'后续实收夹具'});s.stats.treasury=home(s).fiscal.treasury;return s;}

test('three actual battles keep unapproved soldier, equipment and training goals',()=>{
 let s=createPlayableGame('连续战损');const original=structuredClone(s.domestic.centralArmy),stock=structuredClone(worldKitDepot(s.domestic,'central').stock);
 for(let i=0;i<3;i++)s=battle(s);
 assert.equal(s.domestic.centralArmy.soldiers,1240);const q=quoteArmyRecovery(s);assert.equal(q.target.soldiers,original.soldiers);assert.equal(q.target.training,original.training);assert.deepEqual(q.target.kits,stock);assert.equal(q.gaps.soldiers,360);validateSave(s);
});
test('stopping, reloading and a new battle preserve unfinished targets and cumulative payment',()=>{
 let s=start(battle(createPlayableGame('停止再战')));s.turn=2;settleArmyRecovery(s.domestic,2);const paid=s.domestic.armyRecovery.plan.spent;assert.ok(paid>0);s=command(s,'cancel');s=validateSave(JSON.parse(JSON.stringify(s)));s=battle(s);assert.equal(recoveryStatus(s.domestic).target.soldiers,1600);assert.equal(recoveryStatus(s.domestic).target.training,60);s=start(s,{cap:5000});assert.equal(s.domestic.armyRecovery.plan.spent,paid);assert.equal(s.domestic.armyRecovery.plan.cap,paid+5000);
});
test('active plans merge new paid equipment into later battle baseline without extending authorization',()=>{
 let s=start(battle(createPlayableGame('新增军备'))),cap=s.domestic.armyRecovery.plan.cap;const old=worldKitDepot(s.domestic,'central').stock.infantry;s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:{infantry:500}}).state;s=battle(s);assert.ok(s.domestic.armyRecovery.plan.target.kits.infantry>=old+500);assert.equal(s.domestic.armyRecovery.plan.cap,cap);
});
test('completed cycles do not force restoration to a historical peak after a deliberate demobilization',()=>{
 const s=createPlayableGame('新恢复周期');captureArmyRecovery(s.domestic,1);offerArmyRecovery(s.domestic,1);assert.equal(s.domestic.armyRecovery.offer,null);
 let n=start(battle(s));const t=n.domestic.armyRecovery.plan.target;const missing=Object.fromEntries(Object.entries(t.kits).map(([k,v])=>[k,Math.max(0,v-worldKitDepot(n.domestic,'central').stock[k])]).filter(([,v])=>v));n=executeKitCommand(n,{id:n.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:missing}).state;n=executeKitCommand(n,{id:n.domestic.troopKits.nextId,kind:'recruit',sourceId:'central',amount:120}).state;n=executeGeneral(n,{id:n.domestic.general.nextId,kind:'train'}).state;refreshArmyRecoveryStatus(n.domestic,1);assert.equal(n.domestic.armyRecovery.offer,null);n=executeKitCommand(n,{id:n.domestic.troopKits.nextId,kind:'dismiss',sourceId:'central',amount:200}).state;n=battle(n);assert.equal(recoveryStatus(n.domestic).target.soldiers,1400);
});
test('extension preserves targets, payments and cash; invalid or replayed commands cannot increase cap',()=>{
 let s=start(battle(createPlayableGame('一次续批')),{cap:1});s.turn=2;settleArmyRecovery(s.domestic,2);assert.equal(s.domestic.armyRecovery.plan.waitingCap,true);const before=JSON.stringify(s),id=s.domestic.armyRecovery.nextId;
 for(const amount of [0,-1,1.5,NaN,Infinity,1000000000]){assert.throws(()=>command(s,'extend',{amount}));assert.equal(JSON.stringify(s),before);}
 const cash=home(s).fiscal.treasury,target=structuredClone(s.domestic.armyRecovery.plan.target);s=command(s,'extend',{amount:5000});assert.equal(s.domestic.armyRecovery.plan.cap,5001);assert.equal(s.domestic.armyRecovery.plan.spent,0);assert.equal(home(s).fiscal.treasury,cash);assert.deepEqual(s.domestic.armyRecovery.plan.target,target);assert.equal(s.domestic.armyRecovery.plan.waitingCap,false);assert.throws(()=>executeArmyRecovery(s,{id,kind:'extend',amount:5000}),/更新/);validateSave(s);
});
test('explicit debt-time permission spends at most a quarter of surplus and 350 cash, never debt',()=>{
 const s=fundedDebt(),d=s.domestic,f=recoveryFunding(d,2),cash=home(s).fiscal.treasury,debt=home(s).fiscal.debt;assert.equal(f.debtAllowed,true);assert.ok(f.turnLimit<=350&&f.turnLimit<=f.net*.25);settleArmyRecovery(d,2);assert.ok(d.armyRecovery.plan.spent>0);assert.ok(d.armyRecovery.plan.spent<=f.turnLimit);assert.equal(cash-home(s).fiscal.treasury,d.armyRecovery.plan.spent);assert.equal(home(s).fiscal.debt,debt);assert.ok(home(s).fiscal.treasury>=f.reserve);validateSave(s);
});
test('old authorization, a worsening debt balance or a regular deficit cannot fund debt-time recovery',()=>{
 for(const mode of ['old','debt-increase','deficit']){let s=fundedDebt();if(mode==='old')delete s.domestic.armyRecovery.plan.debtRecovery;if(mode==='debt-increase'){postTreasury(s.domestic,'sheng',{turn:2,expense:home(s).fiscal.treasury+100,allowDebt:true,key:'fixture:new-debt',reason:'新增债务夹具'});postTreasury(s.domestic,'sheng',{turn:2,income:15000,key:'fixture:later-income',reason:'实收夹具'});}if(mode==='deficit')s=executeRevenue(s,{id:s.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home(s).provinceIds.map(id=>[id,0]))}).state;const cash=home(s).fiscal.treasury,debt=home(s).fiscal.debt;settleArmyRecovery(s.domestic,2);assert.equal(s.domestic.armyRecovery.plan.spent,0,mode);assert.equal(home(s).fiscal.treasury,cash);assert.equal(home(s).fiscal.debt,debt);}
});
test('manual paid completion closes even with debt and releases governance restriction',()=>{
 let s=fundedDebt();const t=s.domestic.armyRecovery.plan.target,stock=worldKitDepot(s.domestic,'central').stock;s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:Object.fromEntries(Object.entries(t.kits).map(([k,v])=>[k,Math.max(0,v-stock[k])]).filter(([,v])=>v))}).state;s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'recruit',sourceId:'central',amount:120}).state;s=executeGeneral(s,{id:s.domestic.general.nextId,kind:'train'}).state;const cash=home(s).fiscal.treasury,debt=home(s).fiscal.debt;settleArmyRecovery(s.domestic,2);assert.equal(s.domestic.armyRecovery.plan.active,false);assert.equal(s.domestic.armyRecovery.plan.completedTurn,2);assert.equal(recoveryGovernanceBudget(s.domestic,1400,2),1400);assert.equal(home(s).fiscal.treasury,cash);assert.equal(home(s).fiscal.debt,debt);
});
test('pure foreign war allows approval and procurement; real player aid pauses safely',()=>{
 let s=battle(createPlayableGame('外国交战'));let campaign;
 outer:for(const c of s.domestic.countries.filter(c=>c.id!=='sheng'))for(const t of borderingCountries(s.domestic,c.id).filter(t=>t.id!=='sheng')){const next=structuredClone(s);try{campaign=startCampaign(next.domestic,c.id,borderingProvinces(next.domestic,c.id,t.id)[0].id,1);s=next;break outer;}catch{}}
 assert.ok(campaign);assert.equal(recoveryCrisis(s.domestic),false);s=start(s);s.turn=2;settleArmyRecovery(s.domestic,2);assert.ok(s.domestic.armyRecovery.plan.spent>0);s.domestic.strategy.pending.playerAid=true;assert.equal(recoveryCrisis(s.domestic),true);const cash=home(s).fiscal.treasury;settleArmyRecovery(s.domestic,3);assert.equal(home(s).fiscal.treasury,cash);assert.match(s.domestic.armyRecovery.plan.status,/参援/);
});
test('quoted reserve equals locked protection plus live governance line and six-turn deficit buffer',()=>{
 let s=battle(createPlayableGame('资金门槛'));s.domestic.governance.reserve=20000;s=start(s);s.domestic.governance.reserve=7000;assert.equal(quoteArmyRecovery(s).reserve,20000);s.domestic.governance.reserve=30000;assert.equal(quoteArmyRecovery(s).reserve,30000);s=executeRevenue(s,{id:s.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home(s).provinceIds.map(id=>[id,0]))}).state;const q=quoteArmyRecovery(s);assert.ok(q.deficitBuffer>0);assert.equal(q.reserve,30000+q.deficitBuffer);assert.equal(q.deficitBuffer,Math.ceil(-q.net*6));const cash=home(s).fiscal.treasury;settleArmyRecovery(s.domestic,2);assert.equal(home(s).fiscal.treasury,cash);
});

test('stopped manual completion closes the old target before the next deliberately smaller army fights',()=>{
 let s=start(battle(createPlayableGame('停办手动补齐')));s=command(s,'cancel');const t=recoveryStatus(s.domestic).target,stock=worldKitDepot(s.domestic,'central').stock;s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:Object.fromEntries(Object.entries(t.kits).map(([k,v])=>[k,Math.max(0,v-stock[k])]).filter(([,v])=>v))}).state;s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'recruit',sourceId:'central',amount:120}).state;s=executeGeneral(s,{id:s.domestic.general.nextId,kind:'train'}).state;refreshArmyRecoveryStatus(s.domestic,1);assert.equal(s.domestic.armyRecovery.offer,null);s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'dismiss',sourceId:'central',amount:200}).state;s=battle(s);assert.equal(recoveryStatus(s.domestic).target.soldiers,1400);
});

test('resuming deferred training keeps paid equipment and recruitment in the same recovery account',()=>{
 let s=start(battle(createPlayableGame('后续训练核准')),{train:false});for(let i=2;i<10&&s.domestic.armyRecovery.plan.active;i++){s.turn=i;settleArmyRecovery(s.domestic,i);}const old=s.domestic.armyRecovery.plan;assert.equal(old.active,false);assert.ok(old.spent>0);assert.ok(recoveryStatus(s.domestic).gaps.training>0);const paid=old.spent;s=start(s,{train:true,cap:500});assert.equal(s.domestic.armyRecovery.plan.spent,paid);assert.equal(s.domestic.armyRecovery.plan.cap,paid+500);
});
