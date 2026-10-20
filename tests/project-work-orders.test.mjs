import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {startConstruction,settleConstruction} from '../src/construction.mjs';
import {configureProjectWork} from '../src/project-work-orders.mjs';
function game(){let s=newGame('赶工');initializeResourceEconomy(s.domestic);s.domestic.provinces[0].welfare.loyalty=80;s=startConstruction(s,s.domestic.provinces[0].id,'walls').state;return s;}
function rush(s,mode=2,duration=3){return configureProjectWork(s,s.domestic.provinces[0].id,'construction',{mode,duration}).state;}
test('rush spends extra money and people, caps speed at two and leaves farmers intact',()=>{
 let s=rush(game());const d=s.domestic,p=d.provinces[0],cash=d.countries[0].fiscal.treasury,farmers=p.population.professions.farmers;
 settleConstruction(d,2);s.turn=2;assert.equal(p.construction.project.progress,2);assert.equal(d.countries[0].fiscal.treasury,cash-50);
 assert.equal(p.projectLabor.allocations[0].granted,200);assert.equal(p.population.professions.farmers,farmers);assert.equal(p.projectLaborPressure.loss,2);
 const before=JSON.stringify(d);settleConstruction(d,2);assert.equal(JSON.stringify(d),before);validateSave(structuredClone(s));
});
test('money shortage falls back without partial charges; food and low morale block acceleration',()=>{
 let s=rush(game()),d=s.domestic,p=d.provinces[0];d.countries[0].fiscal.treasury=30;
 settleConstruction(d,2);assert.equal(p.construction.project.progress,1.5);assert.equal(d.countries[0].fiscal.treasury,10);
 for(const blocked of ['food','morale']){s=rush(game());d=s.domestic;p=d.provinces[0];if(blocked==='food')p.foodRelief.lastSettlement={shortfall:1};else p.welfare.loyalty=39;
 const cash=d.countries[0].fiscal.treasury;settleConstruction(d,2);assert.equal(p.construction.project.progress,1);assert.equal(d.countries[0].fiscal.treasury,cash);}
});
test('authorization expires, pressure eases without instant morale refund, absent staff cannot progress',()=>{
 let s=rush(game(),2,1),d=s.domestic,p=d.provinces[0];settleConstruction(d,2);const morale=p.welfare.loyalty;
 settleConstruction(d,3);assert.equal(p.construction.project.progress,3);assert.equal(p.projectLaborPressure.streak,0);assert.equal(p.welfare.loyalty,morale);
 p.population.professions.militia=0;settleConstruction(d,4);assert.equal(p.construction.project.progress,3);
});
test('paid comfort mitigates without removing pressure, and is charged only with actual acceleration',()=>{
 let plain=rush(game()),paid=configureProjectWork(game(),plain.domestic.provinces[0].id,'construction',{mode:2,duration:3,comfort:true}).state;
 settleConstruction(plain.domestic,2);settleConstruction(paid.domestic,2);
 assert.equal(plain.domestic.provinces[0].projectLaborPressure.loss,2);assert.equal(paid.domestic.provinces[0].projectLaborPressure.loss,1);
 assert.equal(paid.domestic.provinces[0].projectLabor.allocations[0].expense,60);
 paid=configureProjectWork(game(),paid.domestic.provinces[0].id,'construction',{mode:2,duration:3,comfort:true}).state;
 paid.domestic.provinces[0].welfare.loyalty=39;const before=paid.domestic.countries[0].fiscal.treasury;settleConstruction(paid.domestic,2);
 assert.equal(paid.domestic.countries[0].fiscal.treasury,before);assert.equal(paid.domestic.provinces[0].projectLaborPressure.loss,0);
});
test('same-province projects aggregate pressure and sustained acceleration increases the loss',async()=>{
 const {executeSpecial,settleSpecialWorks}=await import('../src/special-buildings.mjs');
 let s=game();s.stats.talent=500;
 // Starter cash can fund this small academy as well as the existing wall.
 s=executeSpecial(s,{id:s.domestic.specialWorks.nextId,provinceId:s.domestic.provinces[0].id,building:'shigu'}).state;
 s=rush(s);s=configureProjectWork(s,s.domestic.provinces[0].id,'special',{mode:2,duration:3}).state;
 const p=s.domestic.provinces[0];
 settleConstruction(s.domestic,2);settleSpecialWorks(s.domestic,2);assert.equal(p.projectLaborPressure.loss,3);
 settleConstruction(s.domestic,3);settleSpecialWorks(s.domestic,3);assert.equal(p.projectLaborPressure.loss,3);
 settleConstruction(s.domestic,4);settleSpecialWorks(s.domestic,4);assert.equal(p.projectLaborPressure.loss,4);
 assert.equal(p.projectLabor.allocations.reduce((n,r)=>n+r.granted,0),800);
 s.turn=4;validateSave(structuredClone(s));
});
test('cancellation releases future commitments without refund and rejects replay',async()=>{
 const {cancelProjectWork}=await import('../src/project-work-orders.mjs');
 const {projectLaborOverview}=await import('../src/project-labor.mjs');
 let s=game(),id=s.domestic.industryActions.nextId,p=s.domestic.provinces[0],cash=s.domestic.countries[0].fiscal.treasury;
 const before=JSON.stringify(s),result=cancelProjectWork(s,p.id,'construction',id);assert.equal(JSON.stringify(s),before);s=result.state;
 assert.equal(projectLaborOverview(s.domestic,s.domestic.provinces[0]).reserved,0);assert.equal(s.domestic.countries[0].fiscal.treasury,cash);
 assert.throws(()=>cancelProjectWork(s,p.id,'construction',id),/已执行/);validateSave(structuredClone(s));
});
test('tampered rush speed, workforce or fee cannot load',()=>{
 let s=rush(game());settleConstruction(s.domestic,2);s.turn=2;
 for(const patch of [{granted:100},{expense:0},{mode:0}]){const broken=structuredClone(s);Object.assign(broken.domestic.provinces[0].projectLabor.allocations[0],patch);assert.throws(()=>validateSave(broken),/赶工/);}
});
test('rush completes remaining two units through full advance and persistence without losing actual report',async()=>{
 const {advance}=await import('../src/game.mjs');const {persistCandidate}=await import('../src/persistence.mjs');const {projectWorkControls}=await import('../src/project-work-ui.mjs');
 let s=game();s.turn=5;s.domestic.disasters.lastTurn=10000;const p=s.domestic.provinces[0];p.construction.project.progress=4;
 s=configureProjectWork(s,p.id,'construction',{mode:2,duration:1,comfort:true}).state;
 const next=structuredClone(s);advance(next);const storage={getItem:()=>null,setItem:()=>{}};
 const committed=persistCandidate(s,next,storage),city=committed.domestic.provinces[0];assert.equal(city.construction.project,null);
 assert.equal(city.projectLabor.allocations[0].speed,2);assert.equal(city.projectLabor.allocations[0].expense,60);
 assert.match(projectWorkControls(committed,city,'construction'),/后续民夫占用已释放/);
 assert.match(projectWorkControls(committed,city,'construction'),/2倍进度，额外支银60两/);
});
