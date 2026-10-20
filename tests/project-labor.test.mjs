import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {startConstruction,settleConstruction} from '../src/construction.mjs';
import {executeIndustry,settleIndustry} from '../src/industry.mjs';
import {quoteSpecial} from '../src/special-buildings.mjs';
import {projectLaborOverview,validateProjectLabor} from '../src/project-labor.mjs';
function game(){const s=newGame('工程');initializeResourceEconomy(s.domestic);s.domestic.provinces[0].population.professions.militia=150;return s;}
function develop(s,area=250){return executeIndustry(s,{id:s.domestic.industryActions.nextId,kind:'develop',provinceId:s.domestic.provinces[0].id,industry:'agriculture',area}).state;}
test('ordinary works, reclamation and special works reserve one shared militia pool',()=>{
 let s=game(),id=s.domestic.provinces[0].id;s=startConstruction(s,id,'markets').state;
 const before=JSON.stringify(s);assert.throws(()=>develop(s,500),/可用民夫不足/);assert.equal(JSON.stringify(s),before);
 s=develop(s);const p=s.domestic.provinces[0],q=projectLaborOverview(s.domestic,p);
 assert.equal(q.reserved,150);assert.equal(q.available,0);s.stats.talent=500;
 assert.throws(()=>quoteSpecial(s,{provinceId:id,building:'shigu'}),/可用民夫不足/);
});
test('shortage pauses work, completed projects cannot recycle the same people in the same turn',()=>{
 let s=game();s=startConstruction(s,s.domestic.provinces[0].id,'markets').state;s=develop(s);
 const d=s.domestic,p=d.provinces[0],farmers=p.population.professions.farmers,cash=d.countries[0].fiscal.treasury;
 p.population.professions.militia=100;p.construction.project.progress=2;
 settleConstruction(d,2);settleIndustry(d,2);s.turn=2;
 assert.equal(p.construction.project,null);assert.ok(p.development.project);assert.equal(p.development.project.progress,0);
 assert.equal(p.projectLabor.allocations.reduce((n,r)=>n+r.granted,0),100);
 assert.equal(p.population.professions.farmers,farmers);assert.equal(d.countries[0].fiscal.treasury,cash);
 validateSave(structuredClone(s));
 settleIndustry(d,3);s.turn=3;assert.equal(p.development.project,null);assert.equal(projectLaborOverview(d,p).reserved,0);validateSave(structuredClone(s));
});
test('labor records reject duplicated allocations, over-allocation and falsified capacity arithmetic',()=>{
 let s=game();s=startConstruction(s,s.domestic.provinces[0].id,'markets').state;settleConstruction(s.domestic,2);
 const p=s.domestic.provinces[0],original=structuredClone(p.projectLabor);
 p.projectLabor.capacity=0;assert.throws(()=>validateProjectLabor(s.domestic,2),/劳力/);
 p.projectLabor=structuredClone(original);p.projectLabor.allocations.push({...original.allocations[0]});assert.throws(()=>validateProjectLabor(s.domestic,2),/劳力/);
});
test('old-rule projects retain their existing workforce behavior',()=>{
 let s=newGame('旧工程');s.domestic.provinces[0].population.professions.militia=0;
 s=startConstruction(s,s.domestic.provinces[0].id,'markets').state;settleConstruction(s.domestic,2);
 assert.equal(s.domestic.provinces[0].construction.project.progress,1);assert.equal(s.domestic.provinces[0].projectLabor,undefined);
});
