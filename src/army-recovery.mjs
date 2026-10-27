import {recruitRate,difficultyFactor} from './difficulty.mjs';
import {balanced} from './development-balance.mjs';
import {countrySummary,validateDomestic} from './domestic.mjs';
import {nationalFoodForecast} from './national-resources.mjs';
import {ENABLED_KITS,worldKitDepot,quoteKitCommand,executeKitCommand} from './troop-kit-world.mjs';
import {centralTrainingEffect,centralTrainingCost,executeGeneral} from './general.mjs';
import {playerMilitaryCrisis} from './military-crisis.mjs';

export const RECOVERY_RULES=Object.freeze({governanceBudget:350,turnBudget:1400,reserve:7000,debtTurnBudget:350,debtSurplusShare:.25,basicSoldiers:300,basicTraining:40});
const home=d=>d.countries.find(c=>c.id===d.playerCountryId);
const init=d=>d.armyRecovery??={version:1,nextId:1,lastTurn:0,battleTarget:null,offer:null,plan:null,history:[]};
const snapshot=(d,turn)=>({turn,soldiers:d.centralArmy.soldiers,training:d.centralArmy.training,kits:{...worldKitDepot(d,'central').stock},ongoing:d.general.ongoing});
const record=(a,turn,message)=>{a.history.unshift({turn,message});a.history=a.history.slice(0,30);};
const mergeTargets=(a,b)=>({...a,soldiers:Math.max(a.soldiers,b.soldiers),training:Math.max(a.training,b.training),kits:Object.fromEntries(ENABLED_KITS.map(k=>[k,Math.max(a.kits[k],b.kits[k])]))});
export function captureArmyRecovery(d,turn){if(balanced(d)){completeRecovery(d,turn);init(d).battleTarget=snapshot(d,turn);}}
export function offerArmyRecovery(d,turn){
 const a=d.armyRecovery,t=a?.battleTarget;if(!t)return;a.battleTarget=null;
 if(d.centralArmy.soldiers<t.soldiers||ENABLED_KITS.some(k=>worldKitDepot(d,'central').stock[k]<t.kits[k])){
  // Unfinished losses survive stopping and later battles. Only a completed cycle can reset its baseline.
  const prior=a.plan&&!a.plan.completedTurn?a.plan.target:null,old=a.offer?(prior?mergeTargets(prior,a.offer):a.offer):prior;
  a.offer=old?mergeTargets(old,t):t;
  if(a.plan?.active)a.plan.target=structuredClone(a.offer);
  record(a,turn,d.centralArmy.soldiers<=t.soldiers*.5?'中央军重创，可优先恢复军备并重排治理支出':'中央军有战损，可核阅兵装与训练恢复');
 }
}
function gaps(d,t){const stock=worldKitDepot(d,'central').stock;return {soldiers:Math.max(0,t.soldiers-d.centralArmy.soldiers),training:Math.max(0,t.training-d.centralArmy.training),kits:Object.fromEntries(ENABLED_KITS.map(k=>[k,Math.max(0,t.kits[k]-stock[k])]))};}
const equipped=g=>Object.values(g.kits).every(n=>!n);
const carriedPayment=(plan,target)=>plan&&(!plan.completedTurn||!plan.train&&target.turn===plan.target.turn)?plan.spent:0;
export function recoveryStatus(d){
 const a=d.armyRecovery,p=a?.plan,t=p?.active?p.target:a?.offer??p?.target;
 return t?{target:t,plan:p??null,gaps:gaps(d,t),severe:d.centralArmy.soldiers<=t.soldiers*.5}:null;
}
// Pure quotation: a maximum-loss estimate never buys equipment or changes a save.
export function replacementQuote(state,{soldiers,kits,training=0}){
 const d=state.domestic,quantities=Object.fromEntries(ENABLED_KITS.filter(k=>kits[k]>0).map(k=>[k,kits[k]]));
 const gear=Object.keys(quantities).length?quoteKitCommand(state,{kind:'purchase',sourceId:'central',quantities},{recovery:true}).cost:0;
 const recruit=Math.ceil(soldiers*recruitRate(d)*difficultyFactor(d,'recoveryCostFactor')),gain=centralTrainingEffect(d,10).gain;
 const trainingTurns=Math.ceil(training/gain),trainingCost=trainingTurns*Math.ceil(Math.max(20,Math.ceil((d.centralArmy.soldiers+soldiers)*.04))*difficultyFactor(d,'recoveryCostFactor'));
 return {gear,recruit,trainingCost,trainingTurns,total:gear+recruit+trainingCost};
}
export function quoteArmyRecovery(state,{train=true}={}){
 const status=recoveryStatus(state.domestic);if(!status)throw Error('尚无中央军战损基线；可在兵部招募、购买兵装和训练');
 const q=replacementQuote(state,{...status.gaps,training:train?(status.gaps.soldiers?status.target.training:status.gaps.training):0});
 return {...q,...status,carriedSpent:carriedPayment(status.plan,status.target),suggestedCap:Math.max(1,Math.ceil(q.total*1.2)),...recoveryFunding(state.domestic,state.turn,status.plan?.active?status.plan:null)};
}
export const recoveryCrisis=playerMilitaryCrisis;
// Shared by quotation, UI and settlement; no money is created or debt forgiven here.
export function recoveryFunding(d,turn,plan=d.armyRecovery?.plan){
 const c=home(d),regular=countrySummary(d,undefined,turn),lockedReserve=plan?.active?plan.reserve:RECOVERY_RULES.reserve;
 const governanceReserve=d.governance.reserve,deficitBuffer=Math.ceil(Math.max(0,-regular.net)*6),reserve=Math.max(RECOVERY_RULES.reserve,lockedReserve,governanceReserve)+deficitBuffer;
 const ledger=c.ledger.find(r=>r.turn===turn&&!r.legacy),openingDebt=ledger?.openingDebt??c.fiscal.debt;
 const debt=c.fiscal.debt,debtStable=debt<=openingDebt,net=regular.net;
 const debtAllowed=!debt||Boolean(plan?.debtRecovery&&debtStable&&net>0);
 const turnLimit=debt?Math.min(RECOVERY_RULES.debtTurnBudget,Math.floor(Math.max(0,net)*RECOVERY_RULES.debtSurplusShare)):RECOVERY_RULES.turnBudget;
 return {reserve,lockedReserve,governanceReserve,deficitBuffer,debt,net,debtStable,debtAllowed,turnLimit,available:Math.floor(Math.max(0,c.fiscal.treasury-reserve))};
}
export function executeArmyRecovery(state,c){
 const d=state.domestic;if(state.stats.life===0||state.reignResult||recoveryCrisis(d))throw Error('请先处理本国战斗、参援或朝廷危机');
 if(!balanced(d))throw Error('此恢复计划适用于当前发展规则');
 if(c.id!==(d.armyRecovery?.nextId??1))throw Error('恢复军令已更新，请重新核阅');
 const next=structuredClone(state),a=init(next.domestic);let message;
 if(c.kind==='start'){
  if(a.plan?.active)throw Error('已有恢复计划，请先停止原计划');
  if(!a.offer)throw Error('没有待恢复的中央军战损');
  if(typeof c.train!=='boolean'||typeof c.draft!=='boolean'||c.debtRecovery!==undefined&&typeof c.debtRecovery!=='boolean'||!Number.isSafeInteger(c.cap)||c.cap<1||c.cap>1000000000)throw Error('请核定恢复额度、训练与劳力授权');
  const g=gaps(d,a.offer);if(!g.soldiers&&equipped(g)&&(!c.train||!g.training))throw Error('兵员、装备与所选训练目标已恢复');
  const spent=carriedPayment(a.plan,a.offer);
  if(spent+c.cap>1000000000)throw Error('累计恢复额度超出范围');
  a.plan={active:true,target:structuredClone(a.offer),startTurn:state.turn,cap:spent+c.cap,spent,train:c.train,draft:c.draft,debtRecovery:c.debtRecovery??false,reserve:Math.max(RECOVERY_RULES.reserve,d.governance.reserve),status:'下旬起按实价分批恢复；优先保障口粮、偿债与常规开支'};
  message='已核准恢复：每旬最多1400两，可选治理暂限350两；达到目标或停止后自动解除限制';
 }else if(c.kind==='extend'){
  const p=a.plan;if(!p?.active)throw Error('没有进行中的恢复计划');
  if(!Number.isSafeInteger(c.amount)||c.amount<1||p.cap+c.amount>1000000000)throw Error('请填写范围内的追加额度');
  p.cap+=c.amount;p.waitingCap=false;p.status=`已续批${c.amount}两，累计实付${p.spent}/${p.cap}两；下旬按实价续办`;message=p.status;
 }else if(c.kind==='cancel'){
  if(!a.plan?.active)throw Error('没有进行中的恢复计划');a.plan.active=false;a.plan.status='已停止；已付费用不退，治理限额已解除';message=a.plan.status;
 }else throw Error('恢复军令无效');
 a.nextId++;record(a,state.turn,message);validateDomestic(next.domestic,state.turn);return {state:next,message};
}
function foodSafe(d,turn){return !(home(d).foodSettlement?.shortfall>0)&&nationalFoodForecast(d,turn+1).shortfall===0;}
export function recoveryGovernanceBudget(d,budget,turn){return d.armyRecovery?.plan?.active&&!recoveryPauseReason(d,turn)?Math.min(budget,RECOVERY_RULES.governanceBudget):budget;}
// An executable plan may be saving toward a higher locked reserve than the live
// civil setting. Releasing its spending cap must not let civil orders consume that saving.
export function recoveryGovernanceReserve(d,reserve,turn){
 const p=d.armyRecovery?.plan;
 if(!p?.active||p.waitingCap||p.spent>=p.cap||recoveryCrisis(d)||!foodSafe(d,turn))return reserve;
 const funding=recoveryFunding(d,turn,p);
 return funding.debtAllowed&&funding.turnLimit>0?Math.max(reserve,funding.reserve):reserve;
}
function completeRecovery(d,turn){
 const a=d.armyRecovery,p=a?.plan;if(!p?.active){
  if(!a?.offer)return false;const gap=gaps(d,a.offer);
  if(gap.soldiers||!equipped(gap)||gap.training)return false;
  a.offer=null;
  if(p&&!p.completedTurn){p.completedTurn=turn;p.status='兵员、兵装与训练均已恢复';p.waitingCap=false;record(a,turn,p.status);}
  return true;
 }
 const gap=gaps(d,p.target);
 if(!gap.soldiers&&equipped(gap)&&(!p.train||!gap.training)){
  p.active=false;p.waitingCap=false;p.status=p.train?'兵员、兵装与训练均已恢复':'兵员、兵装已恢复；训练未纳入本次授权';p.completedTurn=turn;a.offer=p.train?null:p.target;record(a,turn,p.status);return true;
 }
 return false;
}
export function recoveryPauseReason(d,turn){
 const p=d.armyRecovery?.plan;if(!p?.active)return '';
 if(recoveryCrisis(d))return '本国战役、参援或京城危机期间暂停，授权与余额保留';
 if(!foodSafe(d,turn))return '先保口粮，供粮恢复后再整军';
 const f=recoveryFunding(d,turn,p);
 if(!f.debtAllowed)return p.debtRecovery?'债务增加或常规亏损，先稳定财政；不举债整军':'先偿还国债；未授权偿债期间最低战备，可在户部还本';
 if(p.waitingCap||p.spent>=p.cap)return '核准剩余额度不足下一批，请续批恢复额度；不追加扣款';
 if(f.available<1)return `保留应急金与常规开支${f.reserve}两，等待财政结余`;
 if(f.turnLimit<1)return '偿债后安全结余不足，等待财政好转';
 return '';
}
export function refreshArmyRecoveryStatus(d,turn){
 if(completeRecovery(d,turn))return;
 const p=d.armyRecovery?.plan;if(!p?.active)return;
 const reason=recoveryPauseReason(d,turn);
 if(reason)p.status=reason;
 else if(/暂停|先保口粮|先偿还|债务增加|等待财政|安全结余不足/.test(p.status))p.status='暂停条件已解除，下旬按授权余额续办';
}
export function settleArmyRecovery(d,turn){
 const a=d.armyRecovery,p=a?.plan;if(!p?.active)return;
 if(completeRecovery(d,turn)||a.lastTurn>=turn)return;a.lastTurn=turn;
 const pause=message=>{d.armyRecovery.plan.status=message;};
 const reason=recoveryPauseReason(d,turn);if(reason)return pause(reason);
 const turnLimit=recoveryFunding(d,turn,p).turnLimit;
 const state=()=>({domestic:d,turn,stats:{life:1,treasury:home(d).fiscal.treasury}});
 let paid=0,blocked='',waitingCap=false;const actions=[];
 // Several paid operations may share a turn, but never receive separate spending
 // allowances. Recompute cash, wages and authorization after every committed order.
 for(let batch=0;batch<32;batch++){
  const current=d.armyRecovery.plan,gap=gaps(d,current.target),funding=recoveryFunding(d,turn,current);
  const budget=Math.floor(Math.min(Math.min(turnLimit,funding.turnLimit)-paid,current.cap-current.spent,funding.available));
  if(budget<1){waitingCap=current.spent>=current.cap;break;}
  let result,cost=0,action='';blocked='';
  const stock=Object.values(worldKitDepot(d,'central').stock).reduce((n,v)=>n+v,0);
  const basic=Math.min(RECOVERY_RULES.basicSoldiers,current.target.soldiers,Object.values(current.target.kits).reduce((n,v)=>n+v,0));
  // One kit equips one soldier. Existing gear is usable before reserve and
  // specialist targets are full. Original unarmed formations remain valid.
  const recruit=limit=>{
   const gearRoom=equipped(gap)?gap.soldiers:Math.max(0,stock-d.centralArmy.soldiers);
   const count=Math.min(300,gap.soldiers,limit,gearRoom,Math.floor(budget/(recruitRate(d)*difficultyFactor(d,'recoveryCostFactor'))));
   if(count>0)try{const c={id:d.troopKits.nextId,kind:'recruit',sourceId:'central',amount:count,...(current.draft?{draftRates:{farmers:10,herders:10,merchants:10,workers:10}}:{})};cost=quoteKitCommand(state(),c,{recovery:true}).cost;const next=executeKitCommand(state(),c,{recovery:true});if(!foodSafe(next.state.domestic,turn))throw Error('补员后口粮不足，先保粮源');result=next;action=`补员${count}人`;}catch(e){blocked=e.message;}
  };
  const purchase=limit=>{
   for(const kind of ENABLED_KITS.filter(k=>gap.kits[k])){
    try{
     let lo=0,hi=Math.min(gap.kits[kind],limit);while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(quoteKitCommand(state(),{kind:'purchase',sourceId:'central',quantities:{[kind]:mid}},{recovery:true}).cost<=budget)lo=mid;else hi=mid-1;}
     if(!lo)continue;const c={id:d.troopKits.nextId,kind:'purchase',sourceId:'central',quantities:{[kind]:lo}};cost=quoteKitCommand(state(),c,{recovery:true}).cost;result=executeKitCommand(state(),c,{recovery:true});action=`补装${lo}人份`;break;
    }catch(e){blocked=e.message;}
   }
  };
  const train=()=>{
   cost=centralTrainingCost(d,true,true);
   if(d.centralArmy.soldiers&&cost<=budget&&d.general.manualTrainingTurn!==turn){result=executeGeneral(state(),{id:d.general.nextId,kind:'train'},{recovery:true});action='付费训练';}
  };
  if(d.centralArmy.soldiers<basic){
   recruit(basic-d.centralArmy.soldiers);
   if(!result&&stock<basic)purchase(basic-stock);
  }
  if(!result&&d.centralArmy.soldiers>=basic&&current.train&&d.centralArmy.training<Math.min(RECOVERY_RULES.basicTraining,current.target.training)){
   train();
   // Preserve the first formation's training priority and the once-per-turn rule.
   if(!result){waitingCap=d.general.manualTrainingTurn!==turn&&current.cap-current.spent<centralTrainingCost(d,true,true);if(d.general.manualTrainingTurn===turn)blocked='本旬训练已办理，下旬继续基本队伍训练';break;}
  }
  if(!result&&gap.soldiers)recruit(gap.soldiers);
  if(!result)purchase(Infinity);
  if(!result&&!gap.soldiers&&current.train&&gap.training)train();
  if(!result){waitingCap=!blocked&&current.cap-current.spent<=budget;break;}
  Object.assign(d,result.state.domestic);const updated=d.armyRecovery.plan;updated.spent+=cost;paid+=cost;actions.push(action);
  if(completeRecovery(d,turn))return;
 }
 const updated=d.armyRecovery.plan;updated.waitingCap=waitingCap;
 if(!paid)return pause(blocked||(waitingCap?'核准剩余额度不足下一批，请续批恢复额度；不追加扣款':'本旬结余不足以办理下一批，等待资金或劳力'));
 updated.status=`本旬${actions.join('、')}，实付${paid}两；累计${updated.spent}/${updated.cap}两，${waitingCap?'请续批恢复额度':'未完成部分逐旬办理'}`;
}
export function validateArmyRecovery(d,turn=Infinity){
 const a=d.armyRecovery;if(a===undefined)return;
 const int=(n,max=1000000000)=>Number.isSafeInteger(n)&&n>=0&&n<=max;
 const target=t=>t&&int(t.turn)&&t.turn>=1&&t.turn<=turn&&int(t.soldiers)&&int(t.training,100)&&typeof t.ongoing==='boolean'&&t.kits&&Object.keys(t.kits).length===ENABLED_KITS.length&&ENABLED_KITS.every(k=>int(t.kits[k]));
 const p=a.plan;
 if(a.version!==1||!int(a.nextId)||a.nextId<1||!int(a.lastTurn)||a.lastTurn>turn||a.battleTarget!==null&&!target(a.battleTarget)||a.offer!==null&&!target(a.offer)||!Array.isArray(a.history)||a.history.length>30||a.history.some(r=>!int(r.turn)||r.turn<1||r.turn>turn||typeof r.message!=='string'||r.message.length>500)||p&&(!target(p.target)||typeof p.active!=='boolean'||typeof p.train!=='boolean'||typeof p.draft!=='boolean'||p.debtRecovery!==undefined&&typeof p.debtRecovery!=='boolean'||!int(p.startTurn)||p.startTurn<1||p.startTurn>turn||!int(p.cap)||p.cap<1||!int(p.spent)||p.spent>p.cap||!int(p.reserve)||p.reserve<RECOVERY_RULES.reserve||p.waitingCap!==undefined&&typeof p.waitingCap!=='boolean'||typeof p.status!=='string'||p.status.length>1000||p.completedTurn!==undefined&&(!int(p.completedTurn)||p.completedTurn<p.startTurn||p.completedTurn>turn)))throw Error('军备恢复存档无效');
}
