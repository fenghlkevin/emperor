import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,advance,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {startConstruction} from '../src/construction.mjs';
import {courtAgenda,captureCourtReports} from '../src/court-agenda.mjs';
import {acknowledgeCourtReport,projectSnapshot,recordCourtTransitions} from '../src/court-report-events.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {requestLocalMilitary,decideLocalMilitaryPetition} from '../src/local-military-petitions.mjs';
const all=s=>courtAgenda(s,{limit:Infinity});
function game(){const s=newGame('奏章生命周期');initializeResourceEconomy(s.domestic);s.domestic.personnel.delegations=[];s.domestic.countries[0].fiscal.grain=1000000;s.domestic.disasters.seed=1;return s;}
test('real labor stop and resume report only transitions; completion is emitted once and survives loading',()=>{
 let s=game();s=startConstruction(s,'hebei','granaries').state;
 const p=s.domestic.provinces[0];p.population.professions.militia=0;advance(s);
 let events=s.domestic.courtReports.events.filter(e=>e.title==='河北粮仓停工');assert.equal(events.length,1);
 s=acknowledgeCourtReport(s,all(s).find(a=>a.title==='河北粮仓停工'));advance(s);
 assert.ok(!all(s).some(a=>a.title==='河北粮仓停工'));assert.equal(s.domestic.courtReports.events.filter(e=>e.title==='河北粮仓停工').length,1);
 s.domestic.provinces[0].population.professions.militia=200;advance(s);assert.ok(all(s).some(a=>a.title==='河北粮仓复工'));
 for(let i=0;i<8&&s.domestic.provinces[0].construction.project;i++)advance(s);
 assert.equal(s.domestic.provinces[0].construction.project,null);
 const done=all(s).filter(a=>a.title==='河北粮仓完成');assert.equal(done.length,1);assert.equal(done[0].kind,'notice');
 s=acknowledgeCourtReport(s,done[0]);s=validateSave(JSON.parse(JSON.stringify(s)));assert.ok(!all(s).some(a=>a.title==='河北粮仓完成'));
});
test('a second stop of the same project is a new event after its previous stop was read',()=>{
 const s=game(),p=s.domestic.provinces[0];p.construction.project={building:'granaries',progress:1,startedTurn:1};
 const before=projectSnapshot(s.domestic,1);p.disaster={kind:'fire',startTurn:2,endTurn:4};recordCourtTransitions(s.domestic,2,before);
 const stopped=projectSnapshot(s.domestic,2);p.disaster=null;recordCourtTransitions(s.domestic,4,stopped);
 const running=projectSnapshot(s.domestic,4);p.disaster={kind:'flood',startTurn:5,endTurn:11};recordCourtTransitions(s.domestic,5,running);
 assert.equal(s.domestic.courtReports.events.filter(e=>e.title==='河北粮仓停工').length,2);
});
test('disaster end generates a factual notice; a new disaster does not invent a recovery',()=>{
 const s=game(),d=s.domestic,p=d.provinces[0];d.disasters.history=[{turn:1,endTurn:3,provinceId:p.id,kind:'fire',grainLoss:0,cashLoss:0}];
 s.turn=3;recordCourtTransitions(d,3,[]);assert.ok(all(s).some(a=>a.title==='河北失火结束'));
 recordCourtTransitions(d,3,[]);assert.equal(d.courtReports.events.length,1);
 assert.ok(!all(s).some(a=>a.id.startsWith('disaster:')));
});
test('routine governance details never fill the court; imperial results are concise and survive the next turn',()=>{
 const s=game(),d=s.domestic;d.governance.records=[{turn:1,provinceId:'hebei',cost:900,reason:'发展商业；张某能力45、清廉30，实支900两'},{turn:1,provinceId:'hebei',cost:0,reason:'练兵暂缓：国库保留线不足'},{turn:1,provinceId:'hebei',cost:600,reason:'奉旨营建寺庙，专项拨银600两；不占日常委任额度'}];
 const reports=all(s).filter(a=>a.kind==='report');assert.equal(reports.length,1);assert.doesNotMatch(reports[0].summary,/能力|清廉|练兵|发展商业/);assert.match(reports[0].summary,/600两/);
 captureCourtReports(s);s.turn=2;assert.ok(all(s).some(a=>a.archiveKey===reports[0].archiveKey));
});
test('central reinforcements use existing soldiers first and only pay to recruit the shortfall',()=>{
 let s=game();s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:'hebei',civil:false,military:true,budget:100,priority:'security',locks:['farmers']}).state;
 const available=s.domestic.centralArmy.soldiers,amount=available+10,cash=s.stats.treasury;
 s=requestLocalMilitary(s,{kind:'recruit',sourceId:'hebei',amount}).state;
 assert.equal(s.domestic.governance.militaryPetitions.items[0].cost,40);
 const before=s.domestic.provinces[0].population.professions.farmers;s=decideLocalMilitaryPetition(s,{id:1,approve:true}).state;
 assert.equal(s.domestic.governance.militaryPetitions.items[0].status,'executed');assert.equal(cash-s.stats.treasury,40);assert.equal(s.domestic.centralArmy.soldiers,0);assert.equal(s.domestic.provinces[0].population.professions.farmers,before);validateSave(s);
});
test('all nonurgent ordinary notices belong to completion or stop/resume events',()=>{
 const s=game(),p=s.domestic.provinces[0];p.disaster={kind:'flood',startTurn:1,endTurn:7};p.construction.project={building:'granaries',progress:0,startedTurn:1};
 assert.ok(!all(s).some(a=>a.kind==='notice'));assert.ok(!all(s).some(a=>a.id==='special'||a.id==='works'));
});
test('deferred requests stay hidden through small money changes and reopen when the blocker clears',async()=>{
 const {requestLocalConstruction,decideLocalPetition}=await import('../src/local-petitions.mjs');
 let s=game();s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:'hebei',civil:true,military:false,budget:100,priority:'food',locks:[]}).state;
 requestLocalConstruction(s.domestic,s.domestic.provinces[0],1,'temples','必要民生工程连续受阻');s.domestic.governance.reserve=s.stats.treasury;
 s=decideLocalPetition(s,{id:1,approve:true}).state;assert.ok(!all(s).some(a=>a.id==='local-request:1'));
 s.domestic.countries[0].fiscal.treasury+=1;s.stats.treasury+=1;assert.ok(!all(s).some(a=>a.id==='local-request:1'));
 s.domestic.governance.reserve=0;assert.ok(all(s).some(a=>a.id==='local-request:1'));validateSave(s);
});
test('revoked authority and a manually started equivalent project cancel stale requests at settlement',async()=>{
 const {requestLocalConstruction}=await import('../src/local-petitions.mjs');const {reconcileCourtRequests}=await import('../src/court-request-rules.mjs');
 for(const scenario of ['revoked','already-started']){
  let s=game();s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:'hebei',civil:true,military:false,budget:100,priority:'food',locks:[]}).state;
  requestLocalConstruction(s.domestic,s.domestic.provinces[0],1,'temples','必要民生');
  if(scenario==='revoked')s.domestic.provinces[0].localPolicy.civil=false;else s=startConstruction(s,'hebei','temples').state;
  reconcileCourtRequests(s.domestic,1);assert.equal(s.domestic.governance.petitions.items[0].status,'cancelled');assert.ok(!all(s).some(a=>a.id==='local-request:1'));validateSave(s);
 }
});
test('persistent trade shortfalls report once per incident and recovery permits a new incident',()=>{
 let s=game(),r=s.domestic.diplomacy.find(r=>r.countryIds.includes(s.domestic.playerCountryId));
 r.agreement.settledTurns=2;r.agreement.lastPerformance={turn:1,exportsDue:100,exportsPaid:20,importsDue:40,importsPaid:40};
 captureCourtReports(s);const first=all(s).find(a=>a.action==='diplomacy');s=acknowledgeCourtReport(s,first);
 r=s.domestic.diplomacy.find(r=>r.countryIds.includes(s.domestic.playerCountryId));s.turn=2;r.agreement.lastPerformance.turn=2;
 assert.ok(!all(s).some(a=>a.action==='diplomacy'));r.agreement.lastPerformance.exportsPaid=100;captureCourtReports(s);
 assert.ok(all(s).some(a=>a.action==='diplomacy'&&a.title.endsWith('履约复奏')));
 s.turn=3;r.agreement.lastPerformance.turn=3;r.agreement.lastPerformance.exportsPaid=20;assert.ok(all(s).some(a=>a.action==='diplomacy'&&a.title.endsWith('履约不足')));
});
test('completion notices merge across projects and turns and acknowledge every original event',()=>{
 let s=game();s.turn=4;
 const d=s.domestic;
 d.courtReports={version:1,read:[],events:[
  {key:'project:hebei:development:1:1:complete:3',turn:3,provinceId:'hebei',kind:'notice',title:'河北农业开发完成',summary:'农业开发已完工，第4旬启用。',action:'works-records',office:'works-minister'},
  {key:'project:hebei:construction:1:granaries:complete:4',turn:4,provinceId:'hebei',kind:'notice',title:'河北粮仓完成',summary:'粮仓已完工，第5旬启用。',action:'atlas-build',office:'works-minister'},
  {key:'project:hebei:construction:2:temples:paused:4',turn:4,provinceId:'hebei',kind:'notice',title:'河北寺庙停工',summary:'受灾停工。',action:'atlas-build',office:'works-minister'}]};
 const before=JSON.stringify(s),batch=all(s).find(a=>a.completionItems);
 assert.equal(batch.completionItems.length,2);assert.match(batch.summary,/河北农业开发完成/);assert.match(batch.summary,/第5旬启用/);
 assert.equal(JSON.stringify(s),before);assert.ok(all(s).some(a=>a.title==='河北寺庙停工'));
 captureCourtReports(s);assert.equal(d.courtReports.events.length,3);
 s=acknowledgeCourtReport(s,batch);s=validateSave(JSON.parse(JSON.stringify(s)));
 assert.ok(!all(s).some(a=>a.completionItems||a.title.endsWith('完成')));
 const history=courtAgenda(s,{limit:Infinity,includeRead:true});assert.equal(history.find(a=>a.completionItems).completionItems.length,2);
 s.domestic.courtReports.events.push({key:'project:hebei:expansion:4:2:complete:4',turn:4,provinceId:'hebei',kind:'notice',title:'河北扩城完成',summary:'容量已生效。',action:'works-records',office:'works-minister'});
 assert.ok(all(s).some(a=>a.title==='河北扩城完成'));
});
test('stop, resume and disaster end reports merge by type across turns with independent acknowledgement',()=>{
 let s=game();s.turn=5;
 const event=(key,turn,title,office='works-minister')=>({key,turn,provinceId:'hebei',kind:'notice',title,summary:`${title}详情。`,action:office==='works-minister'?'atlas-build':'atlas-grain',office});
 s.domestic.courtReports={version:1,read:[],events:[
  event('project:hebei:construction:1:granaries:paused:2',2,'河北粮仓停工'),
  event('project:hebei:construction:1:temples:paused:3',3,'河北寺庙停工'),
  event('project:hebei:construction:1:granaries:resumed:4',4,'河北粮仓复工'),
  event('project:hebei:construction:1:temples:resumed:5',5,'河北寺庙复工'),
  event('disaster-ended:hebei:fire:1',3,'河北失火结束','revenue-minister'),
  event('disaster-ended:hebei:flood:2',4,'河北洪灾结束','revenue-minister')]};
 const original=JSON.stringify(s),batches=all(s).filter(a=>a.completionItems);
 assert.equal(batches.length,3);assert.ok(batches.every(a=>a.completionItems.length===2));assert.equal(JSON.stringify(s),original);
 const stopped=batches.find(a=>a.title==='各地工程停工汇奏');assert.match(stopped.summary,/第2旬报/);assert.match(stopped.summary,/河北寺庙停工详情/);
 s=acknowledgeCourtReport(s,stopped);s=validateSave(JSON.parse(JSON.stringify(s)));
 assert.equal(all(s).filter(a=>a.completionItems).length,2);assert.equal(s.domestic.courtReports.read.length,2);
 assert.equal(courtAgenda(s,{limit:Infinity,includeRead:true}).filter(a=>a.completionItems).length,3);
 s.domestic.courtReports.events.push(event('project:hebei:construction:1:granaries:paused:5',5,'河北粮仓再次停工'));
 assert.ok(all(s).some(a=>a.title==='河北粮仓再次停工'));
});
