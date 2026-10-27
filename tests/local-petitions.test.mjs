import {national,famine} from './helpers/national.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {requestLocalConstruction,decideLocalPetition,palacePetitionReady} from '../src/local-petitions.mjs';
function game(){let s=newGame('请旨');initializeResourceEconomy(s.domestic);s=executePersonnel(s,{id:s.domestic.personnel.nextId,kind:'localPolicy',provinceId:'hebei',civil:true,military:false,budget:100,priority:'food',locks:[]}).state;const p=s.domestic.provinces[0];p.status.situation='stable';national(s.domestic).fiscal.grain=10000;requestLocalConstruction(s.domestic,p,s.turn,'temples','超预算');return s;}
test('petition is deduplicated; approval executes exact special appropriation once and persists',()=>{
 const s=game(),d=s.domestic,p=d.provinces[0],before=JSON.stringify(s),cash=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;
 requestLocalConstruction(d,p,s.turn,'temples','重复');assert.equal(JSON.stringify(s),before);
 const r=decideLocalPetition(s,{id:1,approve:true});assert.equal(JSON.stringify(s),before);assert.equal(r.state.domestic.governance.petitions.items[0].status,'executed');assert.equal(r.state.domestic.provinces[0].construction.project.building,'temples');assert.equal(cash-r.state.stats.treasury,600);assert.equal(r.state.domestic.governance.spent,0);validateSave(structuredClone(r.state));assert.throws(()=>decideLocalPetition(r.state,{id:1,approve:true}),/已处理/);
});
test('approval rechecks food, reserve and revoked authority without charging',()=>{
 for(const scenario of ['food','reserve','revoked']){const s=game(),p=s.domestic.provinces[0];if(scenario==='food'){famine(s.domestic);}if(scenario==='reserve')s.domestic.governance.reserve=s.stats.treasury;if(scenario==='revoked')p.localPolicy.civil=false;
 const cash=s.stats.treasury,r=decideLocalPetition(s,{id:1,approve:true});assert.equal(r.state.stats.treasury,cash);assert.equal(r.state.domestic.provinces[0].construction.project,null);assert.equal(r.state.domestic.governance.petitions.items[0].status,scenario==='revoked'?'cancelled':'deferred');validateSave(structuredClone(r.state));}
});
test('rejection cools down repeated requests without spending',()=>{
 const s=game(),r=decideLocalPetition(s,{id:1,approve:false});requestLocalConstruction(r.state.domestic,r.state.domestic.provinces[0],s.turn+1,'temples','重复');assert.equal(r.state.domestic.governance.petitions.items.length,1);assert.equal(r.state.stats.treasury,s.stats.treasury);validateSave(structuredClone(r.state));
});
test('court presents pending and deferred requests for emperor decision and removes resolved requests',async()=>{
 const {courtAgenda}=await import('../src/court-agenda.mjs');const s=game(),before=JSON.stringify(s),a=courtAgenda(s,{limit:Infinity}).find(a=>a.requestId===1);assert.equal(a.action,'local-petition');assert.equal(a.office,'prime-minister');assert.match(a.summary,/600/);assert.equal(JSON.stringify(s),before);
 const rejected=decideLocalPetition(s,{id:1,approve:false}).state;assert.ok(!courtAgenda(rejected,{limit:Infinity}).some(a=>a.requestId===1));
 s.domestic.governance.reserve=s.stats.treasury;const deferred=decideLocalPetition(s,{id:1,approve:true}).state;assert.match(courtAgenda(deferred,{limit:Infinity}).find(a=>a.requestId===1).summary,/暂缓/);
});
test('full advance automatically requests low-welfare work, imperial approval persists and work progresses',async()=>{
 const {advance}=await import('../src/game.mjs');const {persistCandidate}=await import('../src/persistence.mjs');
 let s=game();s.domestic.disasters.seed=1;delete s.domestic.governance.petitions;const p=s.domestic.provinces[0];p.welfare.security=40;
 advance(s);validateSave(structuredClone(s));let row=s.domestic.governance.petitions.items.find(r=>r.building==='yamen');assert.ok(row);assert.equal(row.status,'pending');assert.equal(s.domestic.provinces[0].construction.project,null);
 const next=decideLocalPetition(s,{id:row.id,approve:true}).state;s=persistCandidate(s,next,{getItem:()=>null,setItem:()=>{}});assert.equal(s.domestic.provinces[0].construction.project.progress,0);
 advance(s);s=validateSave(structuredClone(s));assert.equal(s.domestic.provinces[0].construction.project.progress,1);assert.equal(s.domestic.governance.petitions.items.find(r=>r.id===row.id).status,'executed');
});
function developed(){
 const s=game();s.turn=12;const d=s.domestic,c=national(d);delete d.governance.petitions;
 c.fiscal.treasury=100000;c.fiscal.debt=0;c.fiscal.otherIncome=100000;c.fiscal.grain=1000000;s.stats.treasury=c.fiscal.treasury;
 for(const p of d.provinces.filter(p=>p.countryId===d.playerCountryId)){p.disaster=null;p.welfare.security=90;p.welfare.stability=90;p.status.livingStandard=70;}
 return s;
}
test('palace petitions require national development and never build autonomously',async()=>{
 const {settleGovernance}=await import('../src/governance.mjs');
 const s=developed(),d=s.domestic,p=d.provinces[0];p.localPolicy.budget=10000;d.governance.budget=10000;p.welfare.loyalty=40;
 assert.equal(palacePetitionReady(d,s.turn),true);
 settleGovernance(d,s.turn);assert.equal(p.construction.project,null);assert.ok(d.governance.petitions.items.some(r=>r.building==='palaces'&&r.status==='pending'));
});
test('early or troubled countries suppress palace requests but retain essential petitions',()=>{
 for(const scenario of ['early','cash','debt','deficit','grain','security','stability','living','disaster']){
  const s=developed(),d=s.domestic,p=d.provinces[0],c=national(d);
  if(scenario==='early')s.turn=2;
  if(scenario==='cash')c.fiscal.treasury=10000;
  if(scenario==='debt')c.fiscal.debt=1;
  if(scenario==='deficit')c.fiscal.otherIncome=-100000;
  if(scenario==='grain')c.fiscal.grain=0;
  if(scenario==='security')p.welfare.security=59;
  if(scenario==='stability')p.welfare.stability=59;
  if(scenario==='living')p.status.livingStandard=49;
  if(scenario==='disaster')p.disaster={kind:'drought',startTurn:12,endTurn:14};
  assert.equal(palacePetitionReady(d,s.turn),false,scenario);
  requestLocalConstruction(d,p,s.turn,'palaces','行宫');assert.equal(d.governance.petitions,undefined,scenario);
  requestLocalConstruction(d,p,s.turn,'yamen','治安');assert.equal(d.governance.petitions.items[0].building,'yamen',scenario);
 }
});
test('old pending palaces hide until ready, recheck approval and preserve read-only saves',async()=>{
 const {courtAgenda}=await import('../src/court-agenda.mjs');const s=developed(),d=s.domestic,p=d.provinces[0];
 requestLocalConstruction(d,p,s.turn,'palaces','行宫');const id=d.governance.petitions.items[0].id;
 assert.ok(courtAgenda(s,{limit:Infinity}).some(a=>a.requestId===id));
 national(d).fiscal.debt=1;const before=JSON.stringify(s);
 assert.ok(!courtAgenda(s,{limit:Infinity}).some(a=>a.requestId===id));assert.equal(JSON.stringify(s),before);
 const r=decideLocalPetition(s,{id,approve:true});assert.equal(r.state.domestic.governance.petitions.items[0].status,'deferred');assert.equal(r.state.stats.treasury,s.stats.treasury);assert.equal(r.state.domestic.provinces[0].construction.project,null);
 national(d).fiscal.debt=0;assert.ok(courtAgenda(s,{limit:Infinity}).some(a=>a.requestId===id));
 const approved=decideLocalPetition(s,{id,approve:true});assert.equal(approved.state.domestic.provinces[0].construction.project.building,'palaces');
});
test('early low loyalty does not generate palace petitions or block ordinary development',async()=>{
 const {settleGovernance}=await import('../src/governance.mjs');const s=developed();s.turn=2;
 const d=s.domestic,p=d.provinces[0];p.localPolicy.budget=10000;d.governance.budget=10000;p.welfare.loyalty=40;
 settleGovernance(d,s.turn);
 assert.ok(!(d.governance.petitions?.items??[]).some(r=>r.building==='palaces'));
 assert.ok(p.construction.project);assert.notEqual(p.construction.project.building,'palaces');
 assert.ok(!d.governance.records.some(r=>r.reason.includes('行宫')));
});
