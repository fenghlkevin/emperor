import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame} from '../src/game.mjs';
import {courtAgenda,courtOverview,courtSpeaker} from '../src/court-agenda.mjs';
test('court agenda is bounded, deterministic and read-only, including real officeholders',()=>{
 const s=newGame('御案'),before=JSON.stringify(s),a=courtAgenda(s);
 assert.equal(a.length,3);assert.deepEqual(courtAgenda(s),a);assert.equal(JSON.stringify(s),before);
 assert.ok(a.some(x=>x.action==='atlas-grain'));assert.equal(courtOverview(s).treasury,10000);assert.ok(courtSpeaker(s,'revenue-minister').name);
});
test('actual hunger and capital crisis take priority over optional court matters',()=>{
 const s=newGame('急奏'),p=s.domestic.provinces[0];p.welfare.grainReserve=0;p.population.professions.farmers=0;s.domestic.collapse.pending={provinceId:'guannei'};
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
test('muster memorial opens complete equipment and soldier scene',()=>{
 const s=newGame('军营'),item=courtAgenda(s).find(a=>a.id==='muster');
 assert.ok(item);assert.equal(item.action,'garrison');
});

test('diplomatic memorial reads actual settled receipts and expires without erasing records',async()=>{
 const {settleDiplomacy,relationBetween}=await import('../src/diplomacy.mjs');
 const {courtDiplomaticFeedback}=await import('../src/court-diplomatic-feedback.mjs');
 const s=newGame('履约'),d=s.domestic,r=relationBetween(d,d.playerCountryId,'rome');r.relation='none';r.agreement.exports=100;r.agreement.imports=40;
 const home=d.countries.find(c=>c.id===d.playerCountryId),rome=d.countries.find(c=>c.id==='rome');rome.fiscal.treasury=30;const cash=home.fiscal.treasury;s.turn=2;settleDiplomacy(d,2);
 assert.equal(home.fiscal.treasury,cash-10);const before=JSON.stringify(s),f=courtDiplomaticFeedback(s).find(f=>f.countryId==='rome');assert.ok(f.shortfall);assert.match(f.summary,/30\/100/);const a=courtAgenda(s).find(a=>a.id==='diplomatic-receipt');assert.equal(a.countryId,'rome');assert.equal(a.action,'diplomacy');assert.equal(JSON.stringify(s),before);
 s.turn=3;assert.ok(!courtAgenda(s).some(a=>a.id==='diplomatic-receipt'));assert.equal(courtDiplomaticFeedback(s)[0].turn,2);
});
