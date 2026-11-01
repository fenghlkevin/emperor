import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {baseProjectWorkers,projectWorkers,projectLaborOverview,validateProjectLabor,beginProjectLabor} from '../src/project-labor.mjs';
import {planMilitia,applyManpower,validateManpower,activeDrafts} from '../src/manpower.mjs';
import {startConstruction} from '../src/construction.mjs';
import {quoteIndustry,executeIndustry} from '../src/industry.mjs';
import {SPECIAL_PROJECT_WORKERS} from '../src/project-work-rules.mjs';
const setup=()=>{const s=createPlayableGame('营建规模');const p=s.domestic.provinces.find(p=>p.id==='jiangnan');p.disaster=null;const c=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);s.stats.treasury=c.fiscal.treasury=1e7;return {s,p};};
test('new projects have distinct scale and existing projects retain old staffing',()=>{
 for(const [building,workers] of Object.entries({markets:500,trainingGrounds:500,granaries:800,temples:1000,yamen:1200,walls:3000,palaces:5000})){
 assert.equal(baseProjectWorkers('construction',{building,laborScale:2}),workers);
 assert.equal(baseProjectWorkers('construction',{building}),100);
 }
 assert.equal(baseProjectWorkers('expansion',{laborScale:2}),5000);
 assert.equal(baseProjectWorkers('expansion',{}),250);
 assert.equal(baseProjectWorkers('special',{building:'canal'}),1000);
 assert.equal(baseProjectWorkers('special',{building:'canal',laborScale:2}),20000);
 assert.ok(Object.values(SPECIAL_PROJECT_WORKERS).every(n=>n>5000));
});
test('direct local draft uses idle first, spreads industry sources, preserves population and returns a valid save',()=>{
 const {s,p}=setup(),before=p.population.total;
 const q=quoteIndustry(s,{kind:'levy-militia',provinceId:p.id,amount:10000});
 assert.equal(q.manpowerPlan.reduce((n,r)=>n+r.count,0),10000);
 assert.ok(q.manpowerPlan.filter(r=>r.job).length>=3);
 const r=executeIndustry(s,{id:s.domestic.industryActions.nextId,kind:'levy-militia',provinceId:p.id,amount:10000}).state;
 const city=r.domestic.provinces.find(x=>x.id===p.id);
 assert.equal(city.population.total,before);
 assert.equal(city.population.professions.militia,p.population.professions.militia+10000);
 validateManpower(r.domestic);validateSave(JSON.parse(JSON.stringify(r)));
 assert.ok(q.impact.after.militiaSalaries>q.impact.before.militiaSalaries);
});
test('scaled palace staffing survives settlement and save validation above old 1000-person ceiling',()=>{
 const {s,p}=setup();applyManpower(s.domestic,planMilitia(s.domestic,[p],10000),'militia',p.id);
 const r=startConstruction(s,p.id,'palaces').state,city=r.domestic.provinces.find(x=>x.id===p.id);
 assert.equal(city.construction.project.laborScale,2);
 const workers=projectWorkers('construction',city.construction.project,r.domestic);
 assert.ok(workers>=4500&&workers<=5000);
 assert.equal(projectLaborOverview(r.domestic,city).reserved,workers);
 r.turn++;beginProjectLabor(r.domestic,r.turn);validateProjectLabor(r.domestic,r.turn);
 validateSave(JSON.parse(JSON.stringify(r)));
});
test('draft respects explicit opt-out and cumulative military plus labor cap',()=>{
 const {s,p}=setup(),d=s.domestic;
 assert.throws(()=>planMilitia(d,[p],1000000));
 const rates={farmers:0,herders:50,merchants:50,workers:50};
 const rows=planMilitia(d,[p],1000,rates);assert.ok(rows.every(r=>r.job!=='farmers'));
 applyManpower(d,rows,'militia',p.id);validateManpower(d);
 for(const job of ['herders','merchants','workers'])assert.ok(activeDrafts(d,p,job)<=p.population.professions[job]);
});
