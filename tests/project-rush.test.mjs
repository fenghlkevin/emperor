import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {startConstruction,settleConstruction} from '../src/construction.mjs';
import {configureProjectRush,quoteProjectRush,cancelProjectWork} from '../src/project-work-orders.mjs';
import {planMilitia,applyManpower} from '../src/manpower.mjs';
import {projectWorkControls} from '../src/project-work-ui.mjs';
function fixture(){let s=newGame('加急');initializeResourceEconomy(s.domestic);const p=s.domestic.provinces[0];applyManpower(s.domestic,planMilitia(s.domestic,[p],3000),'militia',p.id);return startConstruction(s,s.domestic.provinces[0].id,'walls').state;}
test('rush persists beyond three turns, charges money and keeps base staffing',()=>{
 let s=fixture(),p=s.domestic.provinces[0];const before=JSON.stringify(s),q=quoteProjectRush(s,p.id,'construction',true);
 assert.equal(JSON.stringify(s),before);assert.equal(q.fastTurns,36);assert.equal(q.workers,3000);assert.equal(q.perTurn,1500);
 s=configureProjectRush(s,p.id,'construction',true).state;p=s.domestic.provinces[0];
 for(let t=2;t<=6;t++)settleConstruction(s.domestic,t);
 assert.equal(p.construction.project.progress,10);assert.equal(p.projectLabor.allocations[0].granted,3000);assert.equal(p.projectLaborPressure.loss,0);
 s.turn=6;assert.doesNotThrow(()=>validateSave(structuredClone(s)));
 const markup=projectWorkControls(s,p,'construction');assert.match(markup,/加急修建/);assert.doesNotMatch(markup,/执行时长|补贴|增派/);
 s=configureProjectRush(s,p.id,'construction',false).state;settleConstruction(s.domestic,7);assert.equal(s.domestic.provinces[0].construction.project.progress,11);
 s=cancelProjectWork(s,p.id,'construction',s.domestic.industryActions.nextId).state;assert.equal(s.domestic.provinces[0].construction.project,null);
});
test('rush falls back when treasury is empty and resumes automatically',()=>{
 let s=fixture();s=configureProjectRush(s,s.domestic.provinces[0].id,'construction',true).state;const d=s.domestic,p=d.provinces[0],home=d.countries.find(c=>c.id===p.countryId);
 home.fiscal.treasury=0;settleConstruction(d,2);assert.equal(p.construction.project.progress,1);
 home.fiscal.treasury=10000;settleConstruction(d,3);assert.equal(p.construction.project.progress,3);
});
