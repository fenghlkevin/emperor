import {HUNT_SEASONS,HUNT_TARGETS as ORIGINAL_TARGETS} from './hunting-data.mjs';
import {settleProgress} from './imperial-progress.mjs';
import {settleReignResult} from './reign-result.mjs';
export const HUNT_SPECIES=[
 {id:'rabbit',name:'野兔',score:1,visible_ms:3000,height:135},
 {id:'boar',name:'野猪',score:2,visible_ms:2000,height:165},
 {id:'deer',name:'麋鹿',score:3,visible_ms:1000,height:240},
 {id:'eagle',name:'老鹰',score:3,visible_ms:1000,height:145},
 {id:'bear',name:'熊',score:3,visible_ms:2000,height:230}
];
// Requested distribution: boar 12/36, rabbit 10/36, deer 6/36,
// eagle 4/36 and bear 4/36. Keep one uniform draw and unique locations.
const SPECIES_SLOTS=[1,1,3,3,3,1,1,3,0,0,2,1,1,1,1,1,1,0,2,2,1,2,2,0,0,0,0,4,4,4,0,0,4,2,0,1];
export const HUNT_TARGETS=ORIGINAL_TARGETS.map((t,index)=>({...t,species:SPECIES_SLOTS[index],score:HUNT_SPECIES[SPECIES_SLOTS[index]].score,visible_ms:HUNT_SPECIES[SPECIES_SLOTS[index]].visible_ms}));
export const HUNT_SECONDS=60, HUNT_ARROWS=30;
export function huntingInterval(turn){return [2000,500,300][HUNT_SEASONS[Math.floor((turn-1)%36/3)]];}
export function huntingBlock(s){return s.stats.life===0?'寿元已尽，本朝终结':s.stats.energy<=0?'体力耗尽，请先独寝恢复':s.phase===0?'卯时请先上朝':s.phase===5?'亥时只能独寝或相伴休息':'';}
export function createHunt(s,now=0,id=globalThis.crypto.randomUUID()){
 const reason=huntingBlock(s);if(reason)throw Error(reason);
 return {id,turn:s.turn,phase:s.phase,startedAt:now,deadline:now+60000,interval:huntingInterval(s.turn),nextSpawn:now+huntingInterval(s.turn),arrows:30,hits:0,score:0,targets:[],ended:false};
}
export function updateHunt(h,now,random=Math.random){
 if(h.ended)return h;
 // Process actual elapsed time, including background-tab throttling.
 while(h.nextSpawn<=now&&h.nextSpawn<h.deadline){
  h.targets=h.targets.filter(t=>t.expiresAt>h.nextSpawn);
  if(h.targets.length<5){
   const index=Math.floor(random()*36),target=HUNT_TARGETS[index];
   // The original skips an occupied random location instead of rerolling.
   if(target&&!h.targets.some(t=>t.index===index))h.targets.push({index,expiresAt:h.nextSpawn+target.visible_ms});
  }
  h.nextSpawn+=h.interval;
 }
 h.targets=h.targets.filter(t=>t.expiresAt>now);
 if(now>=h.deadline){h.ended=true;h.reason='time';}
 return h;
}
export function shootHunt(h,index,now,random=Math.random){
 updateHunt(h,now,random);if(h.ended)return null;
 const target=h.targets.find(t=>t.index===index);
 h.arrows--;
 if(target){h.hits++;h.score+=HUNT_TARGETS[index].score;h.targets=h.targets.filter(t=>t!==target);}
 if(h.arrows===0){h.ended=true;h.reason='arrows';}
 return target?HUNT_TARGETS[index].score:0;
}
export function huntingReward(stats,score){return {maxEnergy:Math.min(500-stats.maxEnergy,Math.floor(score/4)),health:Math.min(100-stats.health,20),life:Math.min(stats.life,8)};}
export function settleHunt(state,h){
 if(!h.ended)throw Error('狩猎尚未结束');
 if(state.hunting?.lastRoundId===h.id)throw Error('本场狩猎已结算');
 if(h.turn!==state.turn||h.phase!==state.phase)throw Error('时辰已变，请重新进入猎苑');
 if(!Number.isInteger(h.arrows)||h.arrows<0||h.arrows>30||!Number.isInteger(h.hits)||h.hits<0||h.hits>30-h.arrows||!Number.isInteger(h.score)||h.score<h.hits||h.score>h.hits*3)throw Error('狩猎成绩无效');
 const s=structuredClone(state),reward=huntingReward(s.stats,h.score);
 s.stats.maxEnergy+=reward.maxEnergy;s.stats.health+=reward.health;s.stats.life-=reward.life;s.harem.streak=0;
 s.hunting={lastRoundId:h.id};
 s.harem.history.unshift(`第${s.turn}旬：巡游狩猎，命中${h.hits}只，积分${h.score}，体力上限增加${reward.maxEnergy}，健康增加${reward.health}，寿元减少${reward.life}。`);
 s.harem.history=s.harem.history.slice(0,30);settleProgress(s);settleReignResult(s);
 return {state:s,reward};
}
export function validateHunting(s){if(s.hunting&&(!s.hunting.lastRoundId||typeof s.hunting.lastRoundId!=='string'||s.hunting.lastRoundId.length>100))throw Error('狩猎记录无效');}
