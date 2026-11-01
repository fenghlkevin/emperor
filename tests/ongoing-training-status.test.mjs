import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {ongoingTrainingStatus,settleGeneral,executeGeneral} from '../src/general.mjs';

test('ongoing training budget status matches settlement at the reserve boundary and recovers automatically',()=>{
 const s=newGame('训练状态'),d=s.domestic;
 d.developmentBalanceVersion=2;d.governance={...d.governance,reserve:7000};d.general.ongoing=true;
 const fiscal=d.countries.find(c=>c.id===d.playerCountryId).fiscal,cost=ongoingTrainingStatus(d).cost,before=d.centralArmy.training;
 fiscal.treasury=7000+cost-1;
 const paused=ongoingTrainingStatus(d);
 assert.equal(paused.code,'reserve');assert.match(paused.reason,/尚缺1两/);assert.match(paused.budget,/国库保留线7000两/);
 settleGeneral(d,2);assert.equal(d.centralArmy.training,before);assert.equal(fiscal.treasury,7000+cost-1);assert.equal(d.general.ongoing,true);
 fiscal.treasury=7000+cost;assert.equal(ongoingTrainingStatus(d).code,'ready');
 settleGeneral(d,3);assert.ok(d.centralArmy.training>before);assert.equal(fiscal.treasury,7000);
 const after=d.centralArmy.training;settleGeneral(d,3);assert.equal(d.centralArmy.training,after);
 d.centralArmy.training=100;assert.equal(ongoingTrainingStatus(d).code,'full');
 settleGeneral(d,4);assert.equal(fiscal.treasury,7000);
 d.centralArmy.soldiers=0;assert.equal(ongoingTrainingStatus(d).code,'no-soldiers');
 d.general.ongoing=false;assert.equal(ongoingTrainingStatus(d).code,'stopped');
});

test('enable and disable persist explicitly; unchanged plans cannot be submitted',()=>{
 let s=newGame('开关');
 for(const enabled of [true,false]){
 s=executeGeneral(s,{kind:'ongoing',enabled,id:s.domestic.general.nextId}).state;
 assert.equal(s.domestic.general.ongoing,enabled);
 assert.throws(()=>executeGeneral(s,{kind:'ongoing',enabled,id:s.domestic.general.nextId}),/训练计划未改变/);
 }
});
