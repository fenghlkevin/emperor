import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,validateSave} from '../src/game.mjs';
import {createHunt,updateHunt,shootHunt,settleHunt,huntingInterval,HUNT_TARGETS,HUNT_SPECIES} from '../src/hunting.mjs';
import {persistCandidate} from '../src/persistence.mjs';
const ready=()=>{const s=newGame('围猎测试');s.phase=1;return s;};
test('DOS seasonal codes use zero-based calendar month and 36 target locations',()=>{
 assert.deepEqual(Array.from({length:12},(_,i)=>huntingInterval(i*3+1)),[2000,2000,500,500,500,500,300,300,300,300,2000,2000]);
 assert.equal(HUNT_TARGETS.length,36);assert.equal(HUNT_TARGETS[32].score,3);assert.equal(HUNT_TARGETS[32].visible_ms,2000);
});
test('requested animal distribution favors boars and all five species award their own score',()=>{
 const counts=Array(5).fill(0),s=ready();s.turn=19;
 for(let i=0;i<36;i++){
  const h=createHunt(s,0,'species-'+i);updateHunt(h,300,()=>i/36+.001);
  const t=HUNT_TARGETS[i],species=HUNT_SPECIES[t.species];counts[t.species]++;
  assert.equal(h.targets[0].index,i);assert.equal(h.targets[0].expiresAt,300+species.visible_ms);
  assert.equal(shootHunt(h,i,301),species.score);assert.equal(h.hits,1);assert.equal(h.arrows,29);
 }
 assert.deepEqual(counts,[10,12,6,4,4]);assert.equal(HUNT_SPECIES[3].name,'老鹰');assert.equal(HUNT_SPECIES[4].name,'熊');
});
test('sixty seconds, thirty arrows; misses consume arrows, expiry and finish reject late shots',()=>{
 const h=createHunt(ready(),0,'clock');assert.equal(h.arrows,30);
 updateHunt(h,2000,()=>0);assert.equal(h.targets.length,1);
 assert.equal(shootHunt(h,null,2001),0);assert.equal(h.arrows,29);
 assert.equal(shootHunt(h,0,2002),2);assert.equal(h.hits,1);assert.equal(h.score,2);
 assert.equal(shootHunt(h,0,2003),0);
 updateHunt(h,60000,()=>0);assert.equal(h.ended,true);const arrows=h.arrows;assert.equal(shootHunt(h,0,60000),null);assert.equal(h.arrows,arrows);
 const all=createHunt(ready(),0,'arrows');for(let i=0;i<30;i++)shootHunt(all,null,i);assert.equal(all.ended,true);assert.equal(all.reason,'arrows');assert.equal(all.arrows,0);
});
test('at most five concurrent unique slots; occupied random location skips spawn, lifetimes expire',()=>{
 const s=ready();s.turn=19;const h=createHunt(s,0,'slots');
 updateHunt(h,600,()=>0);assert.equal(h.targets.length,1);
 let index=1;updateHunt(h,1800,()=>index++/36);assert.equal(h.targets.length,5);assert.equal(new Set(h.targets.map(t=>t.index)).size,5);
 updateHunt(h,2400,()=>35/36);assert.ok(!h.targets.some(t=>t.index===0));assert.ok(h.targets.length<=5);
});
test('DOS score boundaries and caps preserve current energy, happiness, martial and treasury',()=>{
 for(const score of [0,3,4,7,20,41,90]){
  const s=ready();s.stats.health=50;s.stats.energy=117;
  const h=createHunt(s,0,'score-'+score);Object.assign(h,{ended:true,arrows:0,hits:score===0?0:Math.ceil(score/3),score});
  const r=settleHunt(s,h);assert.equal(r.state.stats.maxEnergy,200+Math.floor(score/4));assert.equal(r.state.stats.health,70);assert.equal(r.state.stats.life,s.stats.life-8);
  for(const key of ['energy','happiness','martial','treasury'])assert.equal(r.state.stats[key],s.stats[key]);
  assert.equal(s.stats.maxEnergy,200);assert.doesNotThrow(()=>validateSave(JSON.parse(JSON.stringify(r.state))));assert.throws(()=>settleHunt(r.state,h),/已结算/);
 }
 const s=ready();s.stats.maxEnergy=498;s.stats.health=85;s.stats.life=5;const h=createHunt(s,0,'caps');Object.assign(h,{ended:true,arrows:20,hits:10,score:20});const r=settleHunt(s,h);assert.deepEqual(r.reward,{maxEnergy:2,health:15,life:5});assert.equal(r.state.stats.life,0);assert.ok(r.state.reignResult);validateSave(r.state);
});
test('failed storage leaves state unchanged and prepared settlement can retry exactly once',()=>{
 const s=ready(),h=createHunt(s,0,'storage');h.ended=true;
 const candidate=settleHunt(s,h).state;assert.throws(()=>persistCandidate(s,candidate,{setItem(){throw Error();}}),/保存失败/);assert.equal(s.stats.life,2160);
 const result=persistCandidate(s,candidate,{setItem(){}});assert.equal(result.stats.life,2152);assert.throws(()=>settleHunt(result,h),/已结算/);assert.throws(()=>persistCandidate(result,candidate,{setItem(){}}));
});
test('entry restrictions and invalid or unfinished rounds never award stats',()=>{
 const s=ready();for(const phase of [0,5]){s.phase=phase;assert.throws(()=>createHunt(s));}s.phase=1;
 const h=createHunt(s,0,'invalid');assert.throws(()=>settleHunt(s,h),/尚未结束/);h.ended=true;h.score=3;assert.throws(()=>settleHunt(s,h),/成绩无效/);h.score=0;s.phase=2;assert.throws(()=>settleHunt(s,h),/时辰已变/);
});
