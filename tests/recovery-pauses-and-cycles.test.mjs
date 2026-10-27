import {executePersonnel} from '../src/personnel-actions.mjs';
import {settleGovernance} from '../src/governance.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {quoteArmyRecovery,executeArmyRecovery,settleArmyRecovery,recoveryGovernanceBudget,recoveryPauseReason,recoveryGovernanceReserve} from '../src/army-recovery.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {actBattle,aiAction} from '../src/battle.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {postTreasury} from '../src/finance.mjs';
const home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
function battle(s){const l=generals(s.domestic);s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:borderingCountries(s.domestic)[0].id,generalId:l[0].id,commanderSquad:{kind:'infantry',count:20},squads:[{kind:'infantry',count:100,generalId:l[1].id}]});let b=s.domestic.war.battle;for(let i=0;i<15000&&!b.result;i++)b=actBattle(b,aiAction(b));assert.ok(b.result);s.domestic.war.battle=b;return finishWar(s).state;}
const command=(s,kind,extra={})=>executeArmyRecovery(s,{id:s.domestic.armyRecovery.nextId,kind,...extra}).state;
const start=(s,extra={})=>command(s,'start',{cap:5000,train:true,draft:true,debtRecovery:false,...extra});
function finish(s){for(let i=0;i<30&&s.domestic.armyRecovery.plan.active;i++){s.turn++;settleArmyRecovery(s.domestic,s.turn);s=validateSave(JSON.parse(JSON.stringify(s)));}assert.equal(s.domestic.armyRecovery.plan.active,false);return s;}
function debtFixture(){let s=start(battle(createPlayableGame('暂停治理预算')));postTreasury(s.domestic,s.domestic.playerCountryId,{turn:1,expense:home(s).fiscal.treasury+1000,allowDebt:true,key:'fixture:mandatory',reason:'强制付款夹具'});s.turn=2;postTreasury(s.domestic,s.domestic.playerCountryId,{turn:2,income:15000,category:'regular',key:'fixture:income',reason:'后续实收夹具'});return s;}

test('a debt-withheld plan releases civil budget without cancelling permission or forgiving debt',()=>{
 const s=debtFixture(),before=JSON.stringify(s),debt=home(s).fiscal.debt;assert.match(recoveryPauseReason(s.domestic,2),/未授权/);assert.equal(recoveryGovernanceBudget(s.domestic,1400,2),1400);assert.equal(JSON.stringify(s),before);settleArmyRecovery(s.domestic,2);assert.equal(home(s).fiscal.debt,debt);assert.equal(s.domestic.armyRecovery.plan.spent,0);assert.equal(s.domestic.armyRecovery.plan.active,true);validateSave(s);
});
test('authorized but worsening or deficit debt releases civil recovery budget and never buys military goods',()=>{
 for(const mode of ['worsening','deficit']){
  let s=debtFixture();s=command(s,'cancel');s=start(s,{debtRecovery:true});
  if(mode==='worsening'){postTreasury(s.domestic,s.domestic.playerCountryId,{turn:2,expense:home(s).fiscal.treasury+100,allowDebt:true,key:'fixture:new-debt',reason:'新增强制债务夹具'});postTreasury(s.domestic,s.domestic.playerCountryId,{turn:2,income:15000,key:'fixture:later-cash',reason:'后续现金夹具'});}else s=executeRevenue(s,{id:s.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home(s).provinceIds.map(id=>[id,0]))}).state;
  assert.ok(recoveryPauseReason(s.domestic,2));assert.equal(recoveryGovernanceBudget(s.domestic,1400,2),1400);const cash=home(s).fiscal.treasury;settleArmyRecovery(s.domestic,2);assert.equal(home(s).fiscal.treasury,cash);assert.equal(s.domestic.armyRecovery.plan.spent,0);
 }
});
test('eligible debt-time recovery still reserves military priority and respects the player lower budget',()=>{
 let s=debtFixture();s=command(s,'cancel');s=start(s,{debtRecovery:true});assert.equal(recoveryPauseReason(s.domestic,2),'');assert.equal(recoveryGovernanceBudget(s.domestic,1400,2),350);assert.equal(recoveryGovernanceBudget(s.domestic,200,2),200);
});
test('cash protection and active player crisis release the temporary cap, never alter configured reserves',()=>{
 for(const mode of ['cash','crisis']){
  const s=start(battle(createPlayableGame('暂停条件')));if(mode==='cash')s.domestic.governance.reserve=50000;else s.domestic.war.battle={fixture:true};
  const before=JSON.stringify(s);assert.ok(recoveryPauseReason(s.domestic,1));assert.equal(recoveryGovernanceBudget(s.domestic,1400,1),1400);assert.equal(JSON.stringify(s),before);
 }
});
test('a completed previous cycle contributes zero payment to a new battle quotation and authorization',()=>{
 let s=finish(start(battle(createPlayableGame('两轮恢复'))));const old=structuredClone(s.domestic.armyRecovery.plan);assert.ok(old.spent>0);s.turn++;s=battle(s);const before=JSON.stringify(s),q=quoteArmyRecovery(s);assert.equal(q.carriedSpent,0);assert.equal(JSON.stringify(s),before);assert.equal(s.domestic.armyRecovery.plan.spent,old.spent);const cash=home(s).fiscal.treasury;
 s=command(s,'start',{cap:q.suggestedCap,train:true,draft:true,debtRecovery:false});assert.equal(s.domestic.armyRecovery.plan.spent,0);assert.equal(s.domestic.armyRecovery.plan.cap,q.suggestedCap);assert.equal(home(s).fiscal.treasury,cash);assert.ok(home(s).ledger.some(r=>r.entries.some(e=>e.reason==='兵部招募士兵')));validateSave(s);
});
test('stopped and deferred-training authorizations quote the exact cumulative paid amount on reload',()=>{
 for(const deferred of [false,true]){
  let s=start(battle(createPlayableGame('同轮续办')),{train:!deferred});if(deferred)s=finish(s);else{s.turn++;settleArmyRecovery(s.domestic,s.turn);s=command(s,'cancel');}s=validateSave(JSON.parse(JSON.stringify(s)));const spent=s.domestic.armyRecovery.plan.spent,q=quoteArmyRecovery(s,{train:true});assert.ok(spent>0);assert.equal(q.carriedSpent,spent);s=command(s,'start',{cap:1000,train:true,draft:true,debtRecovery:false});assert.equal(s.domestic.armyRecovery.plan.spent,spent);assert.equal(s.domestic.armyRecovery.plan.cap,spent+1000);
 }
});

test('civil spending preserves the active military locked reserve while cash accumulates, without reserving money for withheld debt permission',()=>{
 let s=createPlayableGame('两条保留线');
 const budget=(s,reserve)=>executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'governanceBudget',reserve,budget:1400}).state;
 s=budget(s,20000);s=start(battle(s));s=budget(s,7000);
 postTreasury(s.domestic,s.domestic.playerCountryId,{turn:1,expense:home(s).fiscal.treasury-15000,key:'fixture:available-cash',reason:'保留线边界夹具'});
 assert.equal(recoveryGovernanceBudget(s.domestic,1400,1),1400);assert.equal(recoveryGovernanceReserve(s.domestic,7000,1),20000);
 const cash=home(s).fiscal.treasury;settleGovernance(s.domestic,1);assert.equal(home(s).fiscal.treasury,cash);assert.equal(s.domestic.governance.spent,0);assert.equal(s.domestic.governance.reserve,7000);validateSave(s);
 s=debtFixture();assert.equal(recoveryGovernanceReserve(s.domestic,7000,2),7000);assert.equal(recoveryGovernanceReserve(s.domestic,1000,2),1000);
});
