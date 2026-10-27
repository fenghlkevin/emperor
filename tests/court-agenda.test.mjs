import {national,famine} from './helpers/national.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {courtAgenda,courtOverview,courtSpeaker} from '../src/court-agenda.mjs';
test('court agenda is bounded, deterministic and read-only, including real officeholders',()=>{
 const s=newGame('御案'),before=JSON.stringify(s),a=courtAgenda(s);
 assert.ok(a.length<=3);assert.deepEqual(courtAgenda(s),a);assert.equal(JSON.stringify(s),before);
 assert.ok(a.every(x=>!['muster','building','stores'].includes(x.id)));assert.equal(courtOverview(s).treasury,10000);assert.ok(courtSpeaker(s,'revenue-minister').name);
});
test('actual hunger and capital crisis take priority over optional court matters',()=>{
 const s=newGame('急奏'),p=s.domestic.provinces[0];famine(s.domestic);s.domestic.collapse.pending={provinceId:'guannei'};
 const a=courtAgenda(s);assert.equal(a[0].id,'capital');assert.ok(a.some(x=>x.id==='food'&&x.urgent));assert.ok(a.every(x=>typeof x.summary==='string'));assert.equal(new Set(a.map(x=>x.id)).size,a.length);
});
test('construction petition reports real progress and disappears with the project',()=>{
 const s=newGame('营建'),p=s.domestic.provinces[0];p.construction.project={building:'granaries',progress:2,startedTurn:1};
 const a=courtAgenda(s);assert.match(a.find(x=>x.id==='works').summary,/2\/4/);p.construction.project=null;assert.ok(!courtAgenda(s).some(x=>x.id==='works'));
});

test('long work memorial uses real progress and keeps paused work urgent without mutating state',async()=>{
 const {executeSpecial}=await import('../src/special-buildings.mjs');
 const {courtSpecialPlan}=await import('../src/court-special.mjs');
 let s=newGame('工地');s=executeSpecial(s,courtSpecialPlan(s,{kind:'special',provinceId:'guannei',building:'shigu'}).command).state;
 const p=s.domestic.provinces.find(p=>p.id==='guannei');p.population.professions.militia=0;
 const before=JSON.stringify(s),item=courtAgenda(s).find(a=>a.id==='special');
 assert.ok(item.urgent);assert.equal(item.action,'special');assert.equal(item.provinceId,'guannei');assert.match(item.summary,/民伕不足/);assert.match(item.summary,/0\/108/);assert.equal(JSON.stringify(s),before);
 s.domestic.specialWorks.project=null;assert.ok(!courtAgenda(s).some(a=>a.id==='special'));
});
test('quiet court never invents muster, construction or grain petitions to fill the desk',()=>{
 const s=newGame('静朝');
 const before=JSON.stringify(s);assert.deepEqual(courtAgenda(s),[]);assert.equal(JSON.stringify(s),before);
});

test('diplomatic memorial reads actual settled receipts and expires without erasing records',async()=>{
 const {settleDiplomacy,relationBetween}=await import('../src/diplomacy.mjs');
 const {courtDiplomaticFeedback}=await import('../src/court-diplomatic-feedback.mjs');
 const s=newGame('履约'),d=s.domestic,r=relationBetween(d,d.playerCountryId,'rome');r.relation='none';r.agreement.exports=100;r.agreement.imports=40;
 const home=d.countries.find(c=>c.id===d.playerCountryId),rome=d.countries.find(c=>c.id==='rome');rome.fiscal.treasury=30;const cash=home.fiscal.treasury;s.turn=2;settleDiplomacy(d,2);
 assert.equal(home.fiscal.treasury,cash);assert.equal(r.agreement.lastPerformance,undefined);r.agreement.lastPerformance={turn:2,exportsDue:100,exportsPaid:30,importsDue:40,importsPaid:40};const before=JSON.stringify(s),f=courtDiplomaticFeedback(s).find(f=>f.countryId==='rome');assert.ok(f.shortfall);assert.match(f.summary,/30\/100/);const a=courtAgenda(s).find(a=>a.id==='diplomatic-receipt');assert.equal(a.countryId,'rome');assert.equal(a.action,'diplomacy');assert.equal(JSON.stringify(s),before);
 s.turn=3;assert.ok(!courtAgenda(s).some(a=>a.id==='diplomatic-receipt'));assert.equal(courtDiplomaticFeedback(s)[0].turn,2);
});

test('local feedback preserves actual spend and historical reasons without attributing to a replacement',async()=>{
 const {settleGovernance}=await import('../src/governance.mjs');const {courtGovernanceFeedback}=await import('../src/court-governance-feedback.mjs');
 const s=newGame('复奏'),d=s.domestic;d.personnel.delegations=['hebei'];s.turn=2;settleGovernance(d,2);
 const before=JSON.stringify(s),f=courtGovernanceFeedback(s,'hebei');assert.ok(f);assert.equal(f.cost,d.governance.spent);assert.ok(f.reasons.length);assert.equal(courtGovernanceFeedback(s,'henan'),null);assert.equal(JSON.stringify(s),before);
 const a=courtAgenda(s).find(a=>a.id==='governance');assert.equal(a.provinceId,'hebei');assert.equal(a.action,'personnel-delegate');
 s.turn=3;d.personnel.delegations=[];assert.ok(!courtAgenda(s).some(a=>a.id==='governance'));assert.equal(courtGovernanceFeedback(s,'hebei').turn,2);
 const zero=newGame('暂缓');zero.turn=2;zero.domestic.personnel.delegations=['hebei'];zero.domestic.governance.reserve=1000000;settleGovernance(zero.domestic,2);const paused=courtGovernanceFeedback(zero,'hebei');assert.equal(paused.cost,0);assert.ok(paused.reasons.some(r=>r.includes('暂缓')));
});
