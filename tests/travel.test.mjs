import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance,SAVE_KEY,roomBlock} from '../src/game.mjs';
import {scheduleTravel,beginTravel,visitIncognito,cancelTravel,travelDestinations,travelReady,travelImperialPower,celebrateTravel} from '../src/travel.mjs';
import {finishTravel} from '../src/travel-session.mjs';
import {postTreasury} from '../src/finance.mjs';
import {persistCandidate} from '../src/persistence.mjs';
function seed(){const s=newGame('巡方');s.phase=3;s.stats.happiness=65;postTreasury(s.domestic,'sheng',{turn:s.turn,income:100000,reason:'测试储备',key:'travel-test'});s.stats.treasury=s.domestic.countries[0].fiscal.treasury;return s;}
function depart(kind='tour',turn=1){let s=seed();s.turn=turn;s=scheduleTravel(s,kind,kind==='tour'?'guannei':s.domestic.general.capitalProvinceId).state;advance(s);s=beginTravel(s).state;s.travel.pending.encounters=[];return s;}
test('legacy travel defaults and strict rejection of malformed pending records',()=>{
 let s=seed();delete s.travel;s=validateSave(s);assert.equal(s.travel.pending,null);
 const next=scheduleTravel(s,'tour','guannei').state;assert.doesNotThrow(()=>validateSave(structuredClone(next)));
 for(const change of [s=>s.travel.pending.dueTurn++,s=>s.travel.pending.kind='x',s=>s.travel.pending.events=null,s=>s.travel.nextId=1,s=>s.travel.pending.visitCounts=null]){const bad=structuredClone(next);change(bad);assert.throws(()=>validateSave(bad),/出巡/);}
});
test('arranging consumes twenty energy once, no money or rewards until departure',()=>{
 const s=seed(),before=structuredClone(s),r=scheduleTravel(s,'tour','guannei');
 assert.deepEqual(s,before);assert.equal(r.state.stats.energy,s.stats.energy-20);assert.equal(r.state.stats.treasury,s.stats.treasury);assert.equal(r.state.stats.happiness,65);assert.equal(travelReady(r.state),null);
 assert.throws(()=>scheduleTravel(r.state,'incognito','guannei'),/已有/);assert.throws(()=>beginTravel(r.state),/时辰/);
 assert.throws(()=>scheduleTravel(s,'tour','henan'),/行宫/);
 s.stats.energy=20;assert.throws(()=>scheduleTravel(s,'tour','guannei'),/保留体力/);
});
test('tour charges departure twenty thousand via ledger, caps happiness, finishes with ten lifespan',t=>{
 t.mock.method(Math,'random',()=>.99);let s=depart();assert.equal(s.stats.happiness,85);assert.equal(s.stats.life,2159);
 const country=s.domestic.countries[0],entry=country.ledger[0].entries.find(e=>e.key==='travel:1');assert.equal(entry.expenditure,20000);
 assert.throws(()=>beginTravel(s),/已经/);const start=s.turn,life=s.stats.life,health=s.stats.health,energy=s.stats.energy;const result=finishTravel(s);s=result.state;
 assert.equal(s.turn,4);assert.equal(s.phase,0);assert.equal(s.stats.life,life-10-(s.turn-start));assert.equal(s.stats.health,health);assert.equal(s.stats.energy,energy);assert.equal(s.travel.pending,null);assert.equal(s.travel.history[0].reward.life,10);
 assert.throws(()=>finishTravel(s),/已结算/);assert.doesNotThrow(()=>validateSave(s));
});
test('tour advances to month after actual departure, including year boundary',t=>{
 t.mock.method(Math,'random',()=>.99);
 for(const scheduled of [1,2,3,34,35,36]){const s=depart('tour',scheduled),expected=(Math.floor((s.turn-1)/3)+1)*3+1;assert.equal(finishTravel(s).state.turn,expected);}
});
test('cancel never charges treasury or grants rewards; revalidates lost destination and cash',t=>{
 t.mock.method(Math,'random',()=>.99);let s=seed();s=scheduleTravel(s,'tour','guannei').state;const energy=s.stats.energy,cash=s.stats.treasury;s=cancelTravel(s).state;
 assert.equal(s.stats.energy,energy);assert.equal(s.stats.treasury,cash);assert.equal(s.travel.pending,null);
 s=scheduleTravel(s,'tour','guannei').state;advance(s);s.domestic.provinces.find(p=>p.id==='guannei').buildings.palaces=0;assert.throws(()=>beginTravel(s),/条件/);s=cancelTravel(s).state;assert.equal(s.travel.pending,null);
 s=seed();s=scheduleTravel(s,'tour','guannei').state;advance(s);const c=s.domestic.countries[0];postTreasury(s.domestic,'sheng',{turn:s.turn,expense:c.fiscal.treasury,reason:'测试支出',key:'drain'});assert.throws(()=>beginTravel(s),/国库不足/);
});
test('incognito has fixed capital, free treasury, plus twenty happiness and minus eight lifespan',t=>{
 t.mock.method(Math,'random',()=>.99);let s=depart('incognito');assert.equal(s.travel.pending.provinceId,s.domestic.general.capitalProvinceId);assert.equal(travelDestinations(s,'incognito').length,1);assert.equal(s.travel.pending.reward.treasury,0);assert.equal(s.travel.pending.reward.happiness,20);assert.equal(s.travel.pending.reward.life,8);
 const turn=s.turn,life=s.stats.life;s=finishTravel(s).state;assert.equal(s.turn,turn);assert.equal(s.phase,1);assert.equal(s.stats.life,life);assert.doesNotThrow(()=>validateSave(s));
});
test('brothel first five visits cannot trigger; sixth at 49 succeeds, at 50 fails',t=>{
 t.mock.method(Math,'random',()=>.99);let s=depart('incognito');const life=s.stats.life;
 for(let i=0;i<5;i++){s=visitIncognito(s,'brothel',()=>0).state;assert.equal(s.stats.life,life);assert.equal(s.travel.pending.ended,false);}
 assert.equal(visitIncognito(s,'brothel',()=>.5).state.travel.pending.ended,false);
 s=visitIncognito(s,'brothel',()=>.49).state;assert.equal(s.travel.pending.ended,true);assert.equal(s.stats.life,life-10);assert.equal(s.stats.happiness,100);assert.equal(s.stats.health,80);assert.equal(s.harem.members.length,1);assert.throws(()=>visitIncognito(s,'brothel'),/无法/);assert.doesNotThrow(()=>validateSave(s));
});
test('reload and failed persistence do not reroll or leak visit state',t=>{
 t.mock.method(Math,'random',()=>.99);const s=depart('incognito'),before=structuredClone(s);let next=visitIncognito(s,'brothel').state;
 assert.throws(()=>persistCandidate(s,next,{setItem(){throw Error('quota');}}),/保存失败/);assert.deepEqual(s,before);
 const replay=visitIncognito(validateSave(structuredClone(s)),'brothel').state;assert.deepEqual(next.travel.pending.events,replay.travel.pending.events);
 const saved=persistCandidate(s,next,{setItem(k){assert.equal(k,SAVE_KEY);}});assert.equal(saved.travel.pending.visitCounts.brothel,1);assert.throws(()=>persistCandidate(s,next,{setItem(){}}),/状态已更新/);
});
test('celebration uses regional power, never prestige, and does not stack every turn',t=>{
 t.mock.method(Math,'random',()=>.99);let s=depart();s.domestic.countries[0].prestige=0;for(const p of s.domestic.provinces.filter(p=>p.countryId==='sheng'))p.status.livingStandard=100;
 assert.ok(travelImperialPower(s)>=200);s=finishTravel(s).state;assert.equal(s.travel.history[0].reward.loyalty,2);const before=s.domestic.provinces.find(p=>p.id==='guannei').welfare.loyalty;assert.equal(celebrateTravel(s),'');assert.equal(s.domestic.provinces.find(p=>p.id==='guannei').welfare.loyalty,before);
});
test('entry happiness clamps and forged started-return dates are rejected',t=>{
 t.mock.method(Math,'random',()=>.99);let s=seed();s.stats.happiness=95;s=scheduleTravel(s,'incognito',s.domestic.general.capitalProvinceId).state;advance(s);s=beginTravel(s).state;assert.equal(s.stats.happiness,100);assert.equal(s.travel.pending.reward.happiness,5);
 const bad=structuredClone(s);bad.travel.pending.returnTurn=Number.MAX_SAFE_INTEGER;assert.throws(()=>validateSave(bad),/出巡/);
});
test('royal journey death clears pending without advancing or reporting a safe return',t=>{
 t.mock.method(Math,'random',()=>.99);let s=depart();s.stats.life=5;s=finishTravel(s).state;assert.equal(s.stats.life,0);assert.equal(s.turn,2);assert.equal(s.travel.pending,null);assert.match(s.travel.history[0].message,/寿元已尽/);assert.doesNotThrow(()=>validateSave(s));
});
