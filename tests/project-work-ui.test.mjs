import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {startConstruction,settleConstruction} from '../src/construction.mjs';
import {configureProjectWork,quoteProjectWork} from '../src/project-work-orders.mjs';
import {projectWorkControls} from '../src/project-work-ui.mjs';
test('work preview is read-only, exposes actual extra fees and bounded term',()=>{
 let s=newGame('施工预览');initializeResourceEconomy(s.domestic);s=startConstruction(s,s.domestic.provinces[0].id,'walls').state;
 const p=s.domestic.provinces[0],before=JSON.stringify(s),q=quoteProjectWork(s,p.id,'construction',{mode:2,duration:3});
 assert.equal(JSON.stringify(s),before);assert.equal(q.workers,200);assert.equal(q.perTurn,50);assert.equal(q.normalTurns,6);assert.equal(q.fastTurns,3);assert.equal(q.untilTurn,4);
 const markup=projectWorkControls(s,p,'construction');assert.match(markup,/施工投入期限/);assert.match(markup,/不在此刻预扣/);assert.match(markup,/尚无该类工程/);
 s=configureProjectWork(s,p.id,'construction',{mode:2,duration:1}).state;settleConstruction(s.domestic,2);
 assert.match(projectWorkControls(s,s.domestic.provinces[0],'construction'),/投入200人，2倍进度，额外支银50两/);
});
