import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave,advance,leaveRoom,sleepUntilNextTurn,roomBlock,resolveExhaustion} from '../src/game.mjs';
import {palaceAction} from '../src/emperor.mjs';
import {trainingGain,companionRecovery,companyLifeCost} from '../src/emperor-rules.mjs';
import {historicalChance} from '../src/exam.mjs';
const load=s=>validateSave(JSON.parse(JSON.stringify(s)));
test('ordinary training thresholds, age penalty and specialty order match recovered instructions',()=>{
 for(const [roll,base] of [[0,1],[.19,1],[.20,2],[.54,2],[.55,3],[.89,3],[.90,4],[.99,4]]){
  for(const kind of ['study','music','martial','theatre']){
   const rollWith=ageRoll=>{const rolls=[roll,ageRoll];return ()=>rolls.shift();};
   assert.equal(trainingGain(20,null,kind,rollWith(.10)),base);
   assert.equal(trainingGain(20,null,kind,rollWith(.09)),Math.max(1,base-1));
   const specialty={music:0,study:1,martial:2}[kind]??null;
   assert.equal(trainingGain(60,specialty,kind,rollWith(.49)),Math.max(1,base-1)+(kind==='theatre'?0:1));
   assert.equal(trainingGain(10,null,kind,rollWith(0)),base);
   assert.equal(trainingGain(110,null,kind,rollWith(.99)),Math.max(1,base-1));
  }
 }
});
test('training costs forty even at cap, clamps low stamina and has no health/mood bonus',t=>{
 t.mock.method(Math,'random',()=>.99);
 for(const [kind,key] of [['study','wisdom'],['music','charm'],['martial','martial'],['theatre','talent']]){
  const s=newGame('修习');s.phase=1;Object.assign(s.stats,{[key]:499,energy:41,health:54,happiness:63});
  const result=palaceAction(s,kind);assert.equal(result.state.stats[key],500);assert.equal(result.state.stats.energy,1);assert.equal(result.state.stats.health,54);assert.equal(result.state.stats.happiness,63);assert.match(result.message,/增加1/);assert.equal(s.stats[key],499);
  result.state.stats.energy=40;const capped=palaceAction(result.state,kind);assert.equal(capped.state.stats[key],500);assert.equal(capped.state.stats.energy,0);assert.match(capped.message,/增加0/);assert.ok(resolveExhaustion(capped.state));assert.equal(capped.state.stats.energy,200);
  s.stats.energy=9;assert.equal(palaceAction(s,kind).state.stats.energy,0);
 }
});
test('legacy energy ratios and ability progress migrate exactly once and reject damaged inputs',()=>{
 const s=newGame('旧档');delete s.emperorRulesVersion;Object.assign(s.stats,{maxEnergy:10,energy:8,charm:50,talent:100,wisdom:55,martial:0});
 const n=load(s);assert.deepEqual([n.stats.energy,n.stats.maxEnergy,n.stats.charm,n.stats.talent,n.stats.wisdom,n.stats.martial],[160,200,250,500,275,0]);assert.deepEqual(load(n),n);assert.equal(s.stats.energy,8);
 for(const [maxEnergy,energy,wantMax,wantEnergy] of [[15,9,300,180],[30,15,500,250],[10,0,200,0]]){const q=structuredClone(s);Object.assign(q.stats,{maxEnergy,energy});const r=load(q);assert.equal(r.stats.maxEnergy,wantMax);assert.equal(r.stats.energy,wantEnergy);}
 for(const patch of [{energy:11},{energy:-1},{maxEnergy:0},{wisdom:101},{energy:Infinity}]){const bad=structuredClone(s);Object.assign(bad.stats,patch);assert.throws(()=>validateSave(bad));}
 const fresh=newGame('新制');fresh.stats.wisdom=500;assert.equal(load(fresh).stats.wisdom,500);fresh.stats.wisdom=501;assert.throws(()=>load(fresh));fresh.stats.wisdom=500;fresh.emperorRulesVersion=99;assert.throws(()=>load(fresh));
});
test('sleep restores a bounded amount and turn transitions never refill stamina or health',()=>{
 let s=newGame('独寝');Object.assign(s.stats,{maxEnergy:500,energy:10,health:54});s.phase=1;
 s=palaceAction(s,'sleep').state;assert.equal(s.stats.energy,160);assert.equal(s.stats.health,59);const life=s.stats.life;
 advance(s);assert.equal(s.stats.energy,160);assert.equal(s.stats.health,59);assert.equal(s.stats.life,life-1);
 s.stats.energy=490;s.stats.health=99;const capped=palaceAction(s,'sleep').state;assert.equal(capped.stats.energy,500);assert.equal(capped.stats.health,100);
 s.phase=5;const night=palaceAction(s,'sleep').state;assert.equal(night.stats.life,s.stats.life);leaveRoom(night);assert.equal(night.stats.energy,500);
 s.stats.energy=0;assert.equal(roomBlock(s,'dragon'),'');const exhausted=palaceAction(s,'sleep').state;assert.equal(exhausted.stats.energy,500);assert.equal(exhausted.stats.life,s.stats.life-30);
 s.phase=1;s.stats.energy=10;sleepUntilNextTurn(s);assert.equal(s.stats.energy,160);assert.equal(s.phase,0);
});
test('company restores actual capped energy, raises happiness five, and charges only repeated companionship life',t=>{
 t.mock.method(Math,'random',()=>.99);let s=newGame('后宫');s.stats.maxEnergy=500;s.stats.energy=1;s.stats.happiness=98;s.stats.health=54;
 const p=s.harem.members[0];Object.assign(p,{appearance:80,experience:0,rank:0});assert.equal(companionRecovery(p),210);const id=p.id;
 s=palaceAction(s,'company',{id}).state;assert.equal(s.stats.energy,211);assert.equal(s.stats.happiness,100);assert.equal(s.stats.health,54);assert.equal(s.stats.life,2160);assert.equal(s.harem.members[0].ability,210);assert.equal(s.harem.members[0].experience,1);assert.deepEqual(load(s),s);
 for(const [rank,bonus] of [[0,50],[4,50],[5,20],[13,20],[14,5],[99,5],[null,5]])assert.equal(companionRecovery({appearance:40,experience:10,rank}),50+bonus);
 assert.equal(companionRecovery({appearance:40,experience:99,rank:0},false),40);
 assert.deepEqual(Array.from({length:9},(_,i)=>companyLifeCost(i+1)),[0,2,4,8,16,24,32,32,32]);
 s.stats.energy=499;s.phase=5;const night=palaceAction(s,'company',{id});assert.equal(night.state.stats.energy,500);assert.match(night.message,/体力增加1/);assert.equal(night.state.stats.life,s.stats.life-2);
});
test('existing recruitment probability keeps its range on the new five-hundred scale',()=>{assert.equal(historicalChance({wisdom:0,charm:0}),.05);assert.ok(Math.abs(historicalChance({wisdom:500,charm:500})-.4)<1e-12);assert.ok(Math.abs(historicalChance({wisdom:250,charm:250})-.225)<1e-12);});
