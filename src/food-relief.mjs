import {grainStorage} from './grain-storage.mjs';
import {outputFor} from './economy.mjs';
import {activeDisaster} from './disasters.mjs';
import {postTreasury} from './finance.mjs';
export const GRAIN_PRICE=2,PURCHASE_RATION_TURNS=3,MAX_GRAIN=1_000_000_000_000;
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const invalid=()=>{throw Error('粮食救济存档无效');};
export function initializeRelief(d){
 if(d.foodRelief!==undefined)return d;
 if(d.provinces.some(p=>p.foodRelief&&(p.foodRelief.purchase||p.foodRelief.lastSettlement)))invalid();
 d.foodRelief={version:1,nextId:1,history:[]};
 for(const p of d.provinces)p.foodRelief={purchase:null,lastSettlement:null};
 return d;
}
export function foodForecast(p,turn){
 const need=Math.round(p.population.total*.005),produced=outputFor(p,'agriculture',turn+1),grain=p.welfare.grainReserve;
 const storage=grainStorage(p,turn+1,grain),retain=Math.max(0,need-produced),quota=p.foodRelief?.purchase?.turn===turn?p.foodRelief.purchase:null;
 return {grain,need,produced,...storage,shortfall:Math.max(0,need-grain+storage.storageLoss-produced),closing:Math.max(0,grain-storage.storageLoss+produced-need),
  stockTurns:need?grain/need:null,retain,transferable:Math.max(0,grain-retain),
  purchaseLimit:quota?.limit??need*PURCHASE_RATION_TURNS,purchased:quota?.bought??0,
  purchaseRemaining:(quota?.limit??need*PURCHASE_RATION_TURNS)-(quota?.bought??0),quotaLocked:Boolean(quota),disaster:activeDisaster(p,turn)};
}
function owned(state,id){const d=state.domestic,p=d.provinces.find(p=>p.id===id&&p.countryId===d.playerCountryId);if(!p)throw Error('只能为当前本国州郡办理救济');return p;}
export function quoteRelief(state,c){
 if(!integer(c.amount)||c.amount<1||c.amount>MAX_GRAIN)throw Error('粮食数量须为有效的正整数石');
 const target=owned(state,c.targetId),tf=foodForecast(target,state.turn),home=state.domestic.countries.find(c=>c.id===state.domestic.playerCountryId);
 if(target.welfare.grainReserve+c.amount>MAX_GRAIN)throw Error('目标州粮食库存超出范围');
 let cost=0,source=null,sf=null,title;
 if(c.kind==='purchase'){
  if(c.amount>tf.purchaseRemaining)throw Error(`超过本州本旬剩余购粮额度${tf.purchaseRemaining}石`);
  cost=c.amount*GRAIN_PRICE;title='购粮拨入';
 }else if(c.kind==='transfer'){
  source=owned(state,c.sourceId);if(source.id===target.id)throw Error('调出州和调入州必须不同');
  sf=foodForecast(source,state.turn);if(c.amount>sf.transferable)throw Error(`调出州须留足下旬净口粮，最多可调${sf.transferable}石`);
  title='州际调粮';
 }else throw Error('粮食救济政令无效');
 return {title,cost,canAfford:home.fiscal.treasury>=cost,treasuryBefore:home.fiscal.treasury,treasuryAfter:home.fiscal.treasury-cost,
  sourceId:source?.id??null,targetId:target.id,targetBefore:target.welfare.grainReserve,targetAfter:target.welfare.grainReserve+c.amount,
  sourceBefore:source?.welfare.grainReserve??null,sourceAfter:source?source.welfare.grainReserve-c.amount:null,
  shortfallBefore:tf.shortfall,shortfallAfter:Math.max(0,tf.need-target.welfare.grainReserve-c.amount-tf.produced),sourceForecast:sf,targetForecast:tf};
}
export function executeRelief(state,c){
 const next=structuredClone(state),d=initializeRelief(next.domestic),r=d.foodRelief;
 if(!integer(c.id)||c.id<1||c.id!==r.nextId)throw Error('救济政令已执行或数据已更新，请重新拟令');
 const q=quoteRelief(next,c);if(!q.canAfford)throw Error('国库不足，购粮须足额支付');
 const target=owned(next,c.targetId),source=q.sourceId?owned(next,q.sourceId):null;
 postTreasury(d,d.playerCountryId,{turn:state.turn,expense:q.cost,category:source?'transfer':'oneOff',reason:source?`${source.name}调粮至${target.name}`:`${target.name}外部购粮拨入`,key:`food-relief:${c.id}`});
 if(source)source.welfare.grainReserve-=c.amount;
 else{
  if(target.foodRelief.purchase?.turn!==state.turn)target.foodRelief.purchase={turn:state.turn,ration:q.targetForecast.need,limit:q.targetForecast.purchaseLimit,bought:0};
  target.foodRelief.purchase.bought+=c.amount;
 }
 target.welfare.grainReserve+=c.amount;
 const receipt={id:r.nextId++,turn:state.turn,kind:c.kind,sourceId:q.sourceId,targetId:target.id,amount:c.amount,cost:q.cost,
  sourceBefore:q.sourceBefore,sourceAfter:q.sourceAfter,targetBefore:q.targetBefore,targetAfter:q.targetAfter,
  treasuryBefore:q.treasuryBefore,treasuryAfter:q.treasuryAfter};
 r.history.unshift(receipt);r.history=r.history.slice(0,100);next.stats.treasury=q.treasuryAfter;validateRelief(d,state.turn);
 return {state:next,receipt,message:`${q.title}已保存：${target.name}入粮${c.amount}石，支银${q.cost}两；下一旬预计缺口${q.shortfallAfter}石。`};
}
export function beginReliefTurn(d,turn){initializeRelief(d);for(const p of d.provinces)if(p.foodRelief.purchase&&p.foodRelief.purchase.turn<turn)p.foodRelief.purchase=null;}
export function recordFoodSettlement(p,turn,opening,produced,need){
 const {storageLoss}=grainStorage(p,turn,opening),available=opening-storageLoss+produced;
 p.foodRelief.lastSettlement={turn,opening,produced,need,...(storageLoss?{storageLoss}:{}),consumed:Math.min(available,need),shortfall:Math.max(0,need-available),closing:Math.max(0,available-need)};
 return p.foodRelief.lastSettlement;
}
export function validateRelief(d,currentTurn=Infinity){
 const r=d.foodRelief;if(!r||r.version!==1||!integer(r.nextId)||r.nextId<1||!Array.isArray(r.history)||r.history.length>100)invalid();
 let prior=r.nextId,previousTurn=Infinity;
 for(const e of r.history){
  if(!e||!integer(e.id)||e.id<1||e.id>=prior||!integer(e.turn)||e.turn<1||e.turn>currentTurn||e.turn>previousTurn||!['purchase','transfer'].includes(e.kind)||
   !d.provinces.some(p=>p.id===e.targetId)||!integer(e.amount)||e.amount<1||e.amount>MAX_GRAIN||
   !['cost','targetBefore','targetAfter','treasuryBefore','treasuryAfter'].every(k=>integer(e[k]))||e.targetAfter!==e.targetBefore+e.amount||e.targetAfter>MAX_GRAIN||e.treasuryAfter!==e.treasuryBefore-e.cost)invalid();
  if(e.kind==='purchase'){if(e.sourceId!==null||e.sourceBefore!==null||e.sourceAfter!==null||e.cost!==e.amount*GRAIN_PRICE)invalid();}
  else if(!d.provinces.some(p=>p.id===e.sourceId)||e.sourceId===e.targetId||e.cost!==0||!integer(e.sourceBefore)||!integer(e.sourceAfter)||e.sourceAfter!==e.sourceBefore-e.amount)invalid();
  prior=e.id;previousTurn=e.turn;
 }
 for(const p of d.provinces){const f=p.foodRelief;if(!f)invalid();
  if(f.purchase!==null){const q=f.purchase;if(!q||!integer(q.turn)||q.turn<1||q.turn>currentTurn||!integer(q.ration)||q.ration<1||q.limit!==q.ration*PURCHASE_RATION_TURNS||!integer(q.bought)||q.bought<1||q.bought>q.limit)invalid();}
  if(f.lastSettlement!==null){const s=f.lastSettlement;if(!s||!['turn','opening','produced','need','consumed','shortfall','closing'].every(k=>integer(s[k]))||s.turn<1||s.turn>currentTurn||
   (s.storageLoss!==undefined&&(!integer(s.storageLoss)||s.storageLoss>s.opening))||s.consumed!==Math.min(s.opening-(s.storageLoss??0)+s.produced,s.need)||s.shortfall!==Math.max(0,s.need-s.opening+(s.storageLoss??0)-s.produced)||s.closing!==Math.max(0,s.opening-(s.storageLoss??0)+s.produced-s.need))invalid();}
 }
}
