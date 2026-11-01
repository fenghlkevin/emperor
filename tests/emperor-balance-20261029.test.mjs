import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance,sleepUntilNextTurn,resolveExhaustion} from '../src/game.mjs';
import {palaceAction,spendEnergy} from '../src/emperor.mjs';
import {alchemyAction,drugEffect} from '../src/alchemy.mjs';
import {settleHealthyYear,awardMartialLife} from '../src/emperor-balance.mjs';
const reload=s=>validateSave(JSON.parse(JSON.stringify(s)));
test('new emperor reaches ninety naturally and old life is preserved without resurrection',()=>{
 const s=newGame('九十');assert.equal(s.stats.age+s.stats.life/36,90);
 s.stats.life=777;delete s.emperorBalance;const n=reload(s);assert.equal(n.stats.life,777);assert.deepEqual(reload(n),n);
 n.stats.life=0;assert.equal(reload(n).stats.life,0);
});
test('court pays two stamina per action but caps health and happiness losses at ten per turn across reloads',()=>{
 let s=newGame('政务');for(let i=0;i<15;i++){spendEnergy(s,true);s=reload(s);}
 assert.deepEqual([s.stats.energy,s.stats.health,s.stats.happiness],[170,90,65]);
 advance(s);spendEnergy(s,true);assert.deepEqual([s.stats.health,s.stats.happiness],[89,64]);
});
test('company tiers count the whole turn despite sleep, training and reload, then reset next turn',t=>{
 t.mock.method(Math,'random',()=>.99);let s=newGame('相伴');s.stats.happiness=0;s.phase=1;const id=s.harem.members[0].id;
 for(const [i,happy,health,life] of [[1,15,0,0],[2,10,0,2],[3,5,2,3],[4,2,2,4],[5,2,2,4]]){
  const a={...s.stats};s=palaceAction(s,'company',{id}).state;
  assert.equal(s.stats.happiness-a.happiness,happy);assert.equal(a.health-s.stats.health,health);assert.equal(a.life-s.stats.life,life);
  if(i===1)s=palaceAction(s,'study').state;
  if(i===2)s=palaceAction(s,'sleep').state;
  s=reload(s);
 }
 advance(s);const life=s.stats.life;s=palaceAction(s,'company',{id}).state;assert.equal(s.stats.life,life);assert.equal(s.emperorBalance.companyCount,1);
});
test('sleep is once per phase, skip never double recovers, and exhaustion is charged once',()=>{
 let s=newGame('休息');Object.assign(s.stats,{maxEnergy:500,energy:20,health:40,happiness:40});s.phase=1;
 s=palaceAction(s,'sleep').state;assert.deepEqual([s.stats.energy,s.stats.health,s.stats.happiness],[170,50,45]);
 s=reload(s);const a={...s.stats};s=palaceAction(s,'sleep').state;assert.deepEqual(s.stats,a);
 sleepUntilNextTurn(s);assert.equal(s.stats.energy,170);assert.equal(s.stats.health,50);assert.equal(s.stats.life,a.life-1);
 s.stats.energy=0;const life=s.stats.life;resolveExhaustion(s);assert.equal(s.stats.health,40);assert.equal(s.stats.happiness,35);assert.equal(s.stats.life,life-16);assert.equal(resolveExhaustion(s),false);
});
test('leisure has saved per-turn limits and distinct costs',()=>{
 let s=newGame('散心');s.phase=1;s.stats.health=40;s.stats.happiness=10;
 for(const [kind,cost,happy] of [['mother',10,10],['view',10,10],['garden',20,20]]){
  const a={...s.stats};s=palaceAction(s,kind).state;assert.equal(a.energy-s.stats.energy,cost);assert.equal(s.stats.happiness-a.happiness,happy);s=reload(s);assert.throws(()=>palaceAction(s,kind),/本旬/);
 }
 assert.equal(s.stats.health,45);
});
test('yearly care and martial milestones award once, honor caps and never revive the dead',()=>{
 const s=newGame('养生'),life=s.stats.life;for(let i=0;i<36;i++){s.turn++;settleHealthyYear(s);}assert.equal(s.stats.life,life+3);settleHealthyYear(s);assert.equal(s.stats.life,life+3);
 s.stats.martial=500;awardMartialLife(s,250);assert.equal(s.stats.life,life+39);awardMartialLife(s,250);assert.equal(s.stats.life,life+39);
 s.emperorBalance.overworked=true;for(let i=0;i<36;i++){s.turn++;settleHealthyYear(s);}assert.equal(s.stats.life,life+39);reload(s);
});
test('longevity pills enforce actual credited lifetime cap and three exceptional doses across reload',()=>{
 let s=newGame('丹药');s.phase=2;s.turn=4;
 const dose=(effect,key)=>{const id=++s.alchemy.sequence;s.alchemy.batches.push({id,key,effect,quantity:1,identified:true,startedTurn:1,readyTurn:4});s=alchemyAction(s,{kind:'take',id}).state;s=reload(s);};
 for(let i=0;i<5;i++)dose('life7','ABCDEFH');assert.equal(s.emperorBalance.drugLife,180);assert.equal(drugEffect(s,'life6').life,0);
 for(let i=0;i<3;i++)dose('life8','ABCDEFGH');assert.equal(s.emperorBalance.exceptionalDoses,3);assert.equal(drugEffect(s,'life8').life,0);
 assert.equal(s.stats.life,2520+180+216);
 const bad=structuredClone(s);bad.emperorBalance.companyCount=-1;assert.throws(()=>reload(bad),/调养/);
});
