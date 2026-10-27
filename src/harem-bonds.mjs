import {portraitHash,portraitRandom} from './beauty-portrait.mjs';
import {HIDDEN_TRAITS,ensureBeautyTraits,hasBeautyTrait,validateBeautyTraits} from './beauty-hidden-traits.mjs';

// Project additions, not recovered DOS rules. Conditions remain out of the UI.
export const BOND_RULES={visits:6,personCooldown:18,globalCooldown:6,personLifeCap:12,reignLifeCap:72,chance:.25};
export const BOND_TITLES=HIDDEN_TRAITS;
const living=s=>s.stats.life>0&&!s.dynasty?.endReason&&!s.reignResult;
const available=p=>p&&!p.inColdPalace;

export function initializeHaremBonds(s){
 for(const p of [...s.harem.members,...(s.harem.encounter?[s.harem.encounter]:[]),...(s.harem.hiddenEncounter?[s.harem.hiddenEncounter]:[])])ensureBeautyTraits(p,s.harem.portraitSeed);
 s.harem.bonds??={version:1,reignStartTurn:s.dynasty?.reignStartTurn??1,lastAttemptTurn:0,lastEventTurn:0,lifeGranted:0,harmony:null,history:[]};
 // An unused ledger can follow legacy dynasty initialization without transferring rewards.
 const b=s.harem.bonds;
 if(b.version===1&&b.lastAttemptTurn===0&&b.lastEventTurn===0&&b.lifeGranted===0&&b.harmony===null&&Array.isArray(b.history)&&b.history.length===0&&!s.harem.members.some(p=>p.bond?.visits))b.reignStartTurn=s.dynasty?.reignStartTurn??1;
 return s.harem.bonds;
}
function relationship(p){
 return p.bond??={visits:0,lastVisitTurn:0,lastEventTurn:0,lifeGranted:0};
}
function canAttempt(s,p){
 const b=initializeHaremBonds(s),r=relationship(p);
 return living(s)&&available(p)&&r.visits>=BOND_RULES.visits&&b.lastAttemptTurn!==s.turn&&
  (!b.lastEventTurn||s.turn-b.lastEventTurn>=BOND_RULES.globalCooldown)&&
  (!r.lastEventTurn||s.turn-r.lastEventTurn>=BOND_RULES.personCooldown);
}
function lifeRoom(s,p){
 const b=initializeHaremBonds(s);
 return Math.max(0,Math.min(BOND_RULES.personLifeCap-p.bond.lifeGranted,BOND_RULES.reignLifeCap-b.lifeGranted,s.stats.lifeLimit-s.stats.life));
}
function finish(s,p,kind,story,effect){
 const b=initializeHaremBonds(s),message=`${BOND_TITLES[kind]}：${story}（${effect}）`;
 p.bond.lastEventTurn=s.turn;b.lastEventTurn=s.turn;
 b.history.unshift({turn:s.turn,personId:p.id,personName:p.name,kind,message});b.history=b.history.slice(0,60);
 return message;
}
function eventRandom(s,p,context){
 const b=initializeHaremBonds(s);
 return portraitRandom(portraitHash(`${s.harem.portraitSeed}|bond|${b.reignStartTurn}|${s.turn}|${p.id}|${context}`));
}
function eventChance(p){
 const ability=p.baseAbility??Math.trunc(p.appearance**2/40);
 return BOND_RULES.chance+Math.min(.15,(ability+p.experience)/2000);
}
export function companyBond(s,p){
 if(!living(s)||!s.harem.members.some(m=>m===p)||!available(p))return '';
 const r=relationship(p);
 // One relationship step per distinct turn. Repeated company retains its life cost.
 if(r.lastVisitTurn===s.turn)return '';
 r.visits++;r.lastVisitTurn=s.turn;
 if(s.harem.streak!==1||!canAttempt(s,p))return '';
 const b=initializeHaremBonds(s),kinds=[];
 if(hasBeautyTrait(p,'longevity')&&lifeRoom(s,p)>0)kinds.push('longevity');
 if(hasBeautyTrait(p,'care')&&(s.stats.health<100||lifeRoom(s,p)>0))kinds.push('care');
 if(hasBeautyTrait(p,'harmony')&&!activeHarmony(s))kinds.push('harmony');
 if(hasBeautyTrait(p,'advice')&&(s.stats.health<70||s.stats.happiness<60))kinds.push('advice');
 if(!kinds.length)return '';
 b.lastAttemptTurn=s.turn;
 const random=eventRandom(s,p,'company');if(random()>=eventChance(p))return '';
 const kind=kinds[Math.floor(random()*kinds.length)],a=s.stats;
 if(kind==='longevity'||kind==='care'){
  const gain=Math.min(kind==='care'?4:3,lifeRoom(s,p));
  a.life+=gain;r.lifeGranted+=gain;b.lifeGranted+=gain;
  const health=kind==='care'?Math.min(8,100-a.health):0;a.health+=health;
  return finish(s,p,kind,kind==='care'?`${p.name}依所长照料饮食起居，太医奏称调养渐见成效。`:`与${p.name}相知日久，朝夕宽慰，近日身心安泰。`,[gain?`寿元增加${gain}`:'',health?`健康增加${health}`:''].filter(Boolean).join('，'));
 }
 if(kind==='harmony'){
  b.harmony={personId:p.id,startedTurn:s.turn,untilTurn:s.turn+6};
  return finish(s,p,kind,`${p.name}以闲谈雅趣宽解朝堂纷扰，心境渐归平和。`,'未来六旬，办公时快乐消耗减少1');
 }
 const health=Math.min(4,100-a.health),happy=Math.min(6,100-a.happiness);a.health+=health;a.happiness+=happy;
 return finish(s,p,kind,`${p.name}见陛下劳心，温言劝谏，陪同调适作息。`,`健康增加${health}，快乐增加${happy}`);
}
export function educationBond(s,child){
 const p=s.harem.members.find(p=>p.id===child.motherId);
 if(!available(p)||!hasBeautyTrait(p,'education')||child.learning>=100||!canAttempt(s,p))return '';
 const b=initializeHaremBonds(s);b.lastAttemptTurn=s.turn;
 if(eventRandom(s,p,`education:${child.id}`)()>=eventChance(p))return '';
 const gain=Math.min(100-child.learning,2+Math.floor(p.experience/40));child.learning+=gain;
 return finish(s,p,'education',`${p.name}陪同讲读，结合自身所学点拨${child.name}，令其有所领悟。`,`${child.name}学养额外增加${gain}`);
}
export function activeHarmony(s){
 const h=s.harem.bonds?.harmony;
 return !!(h&&living(s)&&s.turn>=h.startedTurn&&s.turn<h.untilTurn&&available(s.harem.members.find(p=>p.id===h.personId)));
}
export function validateHaremBonds(s){
 const b=initializeHaremBonds(s),int=n=>Number.isSafeInteger(n)&&n>=0,time=n=>int(n)&&n<=s.turn;
 if(!b||b.version!==1||!time(b.reignStartTurn)||b.reignStartTurn<1||b.reignStartTurn!==(s.dynasty?.reignStartTurn??1)||
  !time(b.lastAttemptTurn)||!time(b.lastEventTurn)||b.lastEventTurn>b.lastAttemptTurn||!int(b.lifeGranted)||b.lifeGranted>BOND_RULES.reignLifeCap||
  !Array.isArray(b.history)||b.history.length>60||b.history.some(e=>!e||!time(e.turn)||e.turn<b.reignStartTurn||!Object.hasOwn(BOND_TITLES,e.kind)||typeof e.personId!=='string'||typeof e.personName!=='string'||typeof e.message!=='string'||e.message.length>1000)||
  (b.harmony!==null&&(!b.harmony||typeof b.harmony.personId!=='string'||!time(b.harmony.startedTurn)||b.harmony.startedTurn<b.reignStartTurn||!int(b.harmony.untilTurn)||b.harmony.untilTurn!==b.harmony.startedTurn+6)))throw Error('后宫情缘纪事无效');
 let recordedLife=0;
 for(const p of [...s.harem.members,...(s.harem.encounter?[s.harem.encounter]:[])]){
  validateBeautyTraits(p);
  const r=p.bond;if(r===undefined)continue;
  if(!r||!int(r.visits)||r.visits>s.turn-b.reignStartTurn+1||!time(r.lastVisitTurn)||!time(r.lastEventTurn)||!int(r.lifeGranted)||r.lifeGranted>BOND_RULES.personLifeCap||r.lifeGranted>b.lifeGranted||
   (r.visits===0?r.lastVisitTurn!==0:r.lastVisitTurn<b.reignStartTurn)||
   (r.lastEventTurn!==0&&(r.lastEventTurn<b.reignStartTurn||r.lastEventTurn>b.lastEventTurn||r.visits<BOND_RULES.visits))||
   (r.lifeGranted>0&&r.lastEventTurn===0))throw Error('后宫相处记录无效');
  recordedLife+=r.lifeGranted;
 }
 if(recordedLife>b.lifeGranted)throw Error('后宫累计延寿记录无效');
}
