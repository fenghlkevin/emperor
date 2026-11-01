import {EXHAUSTION_LIFE_COST} from './balance-rules.mjs';
// Player-approved attribute balance, 2026-10-29. Ledgers are saved per reign.
export const INITIAL_LIFE=70*36;
export function initializeEmperorBalance(s,reset=true){
 s.emperorBalance??={version:1,turn:s.turn,courtHealth:0,courtHappiness:0,companyCount:0,restPhases:[],leisure:[],overworked:false,healthyTurns:0,annualTurn:s.turn,martialAwards:[],drugLife:0,exceptionalDoses:0};
 const b=s.emperorBalance;
 if(reset&&b.turn<s.turn){b.turn=s.turn;b.courtHealth=0;b.courtHappiness=0;b.companyCount=0;b.restPhases=[];b.leisure=[];}
 return b;
}
export function validateEmperorBalance(s){
 const b=s.emperorBalance,int=(n,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 if(!b||b.version!==1||!int(b.turn,s.turn)||b.turn<1||!int(b.courtHealth,10)||!int(b.courtHappiness,10)||!int(b.companyCount)||!Array.isArray(b.restPhases)||new Set(b.restPhases).size!==b.restPhases.length||b.restPhases.some(n=>!int(n,5))||!Array.isArray(b.leisure)||new Set(b.leisure).size!==b.leisure.length||b.leisure.some(k=>!['mother','view','garden'].includes(k))||typeof b.overworked!=='boolean'||!int(b.healthyTurns,36)||!int(b.annualTurn,s.turn)||b.annualTurn<1||!Array.isArray(b.martialAwards)||new Set(b.martialAwards).size!==b.martialAwards.length||b.martialAwards.some(n=>![300,400,500].includes(n))||!int(b.drugLife,180)||!int(b.exceptionalDoses,3))throw Error('皇帝调养记录无效');
}
export function recoverRest(s){
 const b=initializeEmperorBalance(s),a=s.stats;
 if(a.energy>0&&b.restPhases.includes(s.phase))return '本阶段已安寝调养；可安寝至明进入下一旬。';
 if(!b.restPhases.includes(s.phase))b.restPhases.push(s.phase);
 if(a.energy===0){a.energy=a.maxEnergy;applyOverwork(s);return '体力耗尽后安寝，体力回满，健康与快乐各减少10，额外损失15寿元。';}
 const energy=a.energy,health=a.health,happy=a.happiness;
 a.energy=Math.min(a.maxEnergy,a.energy+150);a.health=Math.min(100,a.health+10);a.happiness=Math.min(100,a.happiness+5);
 return `独寝安眠，体力增加${a.energy-energy}，健康增加${a.health-health}，快乐增加${a.happiness-happy}。`;
}
export function applyOverwork(s){
 const b=initializeEmperorBalance(s);b.overworked=true;
 s.stats.health=Math.max(0,s.stats.health-10);s.stats.happiness=Math.max(0,s.stats.happiness-10);s.stats.life=Math.max(0,s.stats.life-EXHAUSTION_LIFE_COST);
}
export function settleHealthyYear(s){
 const b=initializeEmperorBalance(s);if(b.annualTurn>=s.turn)return;
 b.healthyTurns++;b.annualTurn=s.turn;
 if(b.healthyTurns>=36){
  if(!b.overworked&&s.stats.health>=80&&s.stats.happiness>=70&&s.stats.life>0){const gain=Math.min(3,s.stats.lifeLimit-s.stats.life);s.stats.life+=gain;s.harem.history.unshift(`第${s.turn}旬：全年起居有节，养生延寿${gain}旬。`);s.harem.history=s.harem.history.slice(0,30);}
  b.healthyTurns=0;b.overworked=false;
 }
}
export function awardMartialLife(s,before){
 const b=initializeEmperorBalance(s);
 for(const [level,gain] of [[300,6],[400,12],[500,18]])if(before<level&&s.stats.martial>=level&&!b.martialAwards.includes(level)){
  b.martialAwards.push(level);const actual=Math.min(gain,s.stats.lifeLimit-s.stats.life);if(s.stats.life>0)s.stats.life+=actual;
 }
}
