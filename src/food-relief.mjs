import {quoteShortage,resourceShortage} from './action-feedback.mjs';
import {grainMarketAccess,quoteMarketPrice,recordMarketTrade} from './grain-market.mjs';
import {procurementEffect,purchaseCost,validatePurchaseEffect} from './central-office-effects.mjs';
import {rewardGovernorExperience} from './official-effects.mjs';
import {nationalFoodForecast,postNationalGrain,nationalGrain} from './national-resources.mjs';
import {quoteProvinceResources} from './province-resources.mjs';
import {postGrain} from './grain-finance.mjs';
import {grainStorage} from './grain-storage.mjs';
import {outputFor,legacyFoodOutput} from './economy.mjs';
import {activeDisaster} from './disasters.mjs';
import {postTreasury,transferTreasury} from './finance.mjs';
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
export function foodForecast(p,turn,settlementTurn=turn+1,d){
 if(d?.nationalResourcesVersion===1){const national=nationalFoodForecast(d,settlementTurn,p.countryId),row=national.provinces.find(r=>r.id===p.id),purchase=d.foodRelief.purchase?.turn===turn?d.foodRelief.purchase:null;
 const ration=d.provinces.filter(x=>x.countryId===p.countryId).reduce((n,x)=>n+Math.round(x.population.total*.005),0),limit=purchase?.limit??ration*PURCHASE_RATION_TURNS;
 return {...national,...row,grain:national.opening,closing:national.closing,storageLoss:0,national,retain:0,transferable:0,stockTurns:national.need?national.opening/national.need:null,purchaseLimit:limit,purchased:purchase?.bought??0,purchaseRemaining:Math.max(0,limit-(purchase?.bought??0)),quotaLocked:Boolean(purchase),protectedTurns:0,disaster:activeDisaster(p,turn)};
 }
 const resource=p.resourceRulesVersion===1?quoteProvinceResources(p,{turn:settlementTurn}):null;
 const need=resource?resource.grain.need:Math.round(p.population.total*.005),produced=resource?resource.grain.tax:legacyFoodOutput(p,settlementTurn),grain=p.welfare.grainReserve;
 const storage=grainStorage(p,settlementTurn,grain),retain=Math.max(0,need-produced+(resource?storage.storageLoss:0)),quota=p.foodRelief?.purchase?.turn===turn?p.foodRelief.purchase:null;
 const ration=resource?Math.max(need,Math.round(p.population.total*.005)):need;
 return {grain,need,produced,...storage,...(resource?{resource}:{}),shortfall:Math.max(0,need-grain+storage.storageLoss-produced),closing:Math.max(0,grain-storage.storageLoss+produced-need),
  stockTurns:need?grain/need:null,retain,transferable:Math.max(0,grain-retain),
  purchaseLimit:quota?.limit??ration*PURCHASE_RATION_TURNS,purchased:quota?.bought??0,
  purchaseRemaining:(quota?.limit??ration*PURCHASE_RATION_TURNS)-(quota?.bought??0),quotaLocked:Boolean(quota),disaster:activeDisaster(p,turn)};
}
function owned(state,id){const d=state.domestic,p=d.provinces.find(p=>p.id===id&&p.countryId===d.playerCountryId);if(!p)throw Error('只能为当前本国州郡办理救济');return p;}
export const grainTradeAllowed=(d,id)=>grainMarketAccess(d,d.playerCountryId,id,1).allowed;
export function grainSellers(state){
 const d=state.domestic;
 return d.countries.filter(c=>c.id!==d.playerCountryId&&grainTradeAllowed(d,c.id)&&d.provinces.some(p=>p.countryId===c.id)).map(c=>({id:c.id,name:c.name,grain:nationalGrain(d,c.id),treasury:c.fiscal.treasury,market:grainMarketAccess(d,d.playerCountryId,c.id,state.turn)})).sort((a,b)=>b.grain-a.grain||a.id.localeCompare(b.id));
}
export function quoteRelief(state,c,{settlementTurn=state.turn+1}={}){
 if(c.kind!=='purchase')throw Error('全国统一供粮，已取消州际调粮');
 if(!integer(c.amount)||c.amount<1||c.amount>MAX_GRAIN)throw Error('粮食数量须为有效的正整数石');
 const d=state.domestic,home=d.countries.find(c=>c.id===d.playerCountryId),target=owned(state,c.targetId??home.provinceIds[0]),tf=foodForecast(target,state.turn,settlementTurn,d),q=tf.national;
 if(q.opening+c.amount>MAX_GRAIN)throw Error('全国粮食库存超出范围');

 const seller=grainSellers(state).find(x=>x.id===(c.sellerCountryId??grainSellers(state)[0]?.id));
 if(!seller)throw Error('粮食购买须双方接壤并已开放互市，且售粮国仍有疆域');
 if(c.amount>seller.grain)throw Error(resourceShortage('购粮',seller.name+'存粮',c.amount,seller.grain,'石'));
 const officer=procurementEffect(d),pricing=purchaseCost(c.amount,GRAIN_PRICE,officer),market=quoteMarketPrice(d,d.playerCountryId,seller.id,state.turn,pricing.cost),cost=market.cost;
 return {title:'粮食购买',sellerCountryId:seller.id,sellerName:seller.name,sellerGrainBefore:seller.grain,sellerGrainAfter:seller.grain-c.amount,sellerTreasuryBefore:seller.treasury,sellerTreasuryAfter:seller.treasury+cost,officer,...pricing,market,cost,canAfford:home.fiscal.treasury>=cost,treasuryBefore:home.fiscal.treasury,treasuryAfter:home.fiscal.treasury-cost,
 sourceId:null,targetId:target.id,targetBefore:q.opening,targetAfter:q.opening+c.amount,sourceBefore:null,sourceAfter:null,
 shortfallBefore:q.shortfall,shortfallAfter:Math.max(0,q.shortfall-c.amount),targetForecast:tf};
}
export function executeRelief(state,c,options){
 const next=structuredClone(state),d=initializeRelief(next.domestic),r=d.foodRelief;
 if(!integer(c.id)||c.id<1||c.id!==r.nextId)throw Error('救济政令已执行或数据已更新，请重新拟令');
 const q=quoteRelief(next,c,options);if(!q.canAfford)throw Error(quoteShortage(q,`购粮${c.amount.toLocaleString('zh-CN')}石`));
 transferTreasury(d,d.playerCountryId,q.sellerCountryId,q.cost,{turn:state.turn,reason:`向${q.sellerName}购买粮食${c.amount}石`,key:`food-trade:${c.id}`});
 postNationalGrain(d,q.sellerCountryId,{turn:state.turn,expense:c.amount,category:'transfer',reason:'向本国售粮',key:`relief:${c.id}:out`});
 if(r.purchase?.turn!==state.turn)r.purchase={turn:state.turn,ration:q.targetForecast.purchaseLimit/PURCHASE_RATION_TURNS,limit:q.targetForecast.purchaseLimit,bought:0};
 r.purchase.bought+=c.amount;
 postNationalGrain(d,d.playerCountryId,{turn:state.turn,income:c.amount,category:'purchase',reason:'全国购粮入库',key:`relief:${c.id}:in`});
 const receipt={sellerCountryId:q.sellerCountryId,sellerGrainBefore:q.sellerGrainBefore,sellerGrainAfter:q.sellerGrainAfter,sellerTreasuryBefore:q.sellerTreasuryBefore,sellerTreasuryAfter:q.sellerTreasuryAfter,id:r.nextId++,turn:state.turn,kind:'purchase',national:true,sourceId:null,targetId:q.targetId,amount:c.amount,cost:q.cost,procurement:q.officer,market:q.market,
 sourceBefore:null,sourceAfter:null,targetBefore:q.targetBefore,targetAfter:q.targetAfter,treasuryBefore:q.treasuryBefore,treasuryAfter:q.treasuryAfter};
 // National relief is credited once per turn, so splitting purchases cannot farm experience.
 if(q.shortfallBefore>0&&!r.history.some(e=>e.turn===state.turn&&e.kind==='purchase'))rewardGovernorExperience(d,d.provinces.find(p=>p.id===q.targetId));
 recordMarketTrade(d,{buyer:d.playerCountryId,seller:q.sellerCountryId,turn:state.turn,amount:c.amount,...q.market,key:`food-trade:${c.id}`});
 r.history.unshift(receipt);r.history=r.history.slice(0,100);next.stats.treasury=q.treasuryAfter;validateRelief(d,state.turn);
 return {state:next,receipt,message:`向${q.sellerName}购粮已保存：入库${c.amount}石，支银${q.cost}两，货款已入对方国库。`};
}
export function beginReliefTurn(d,turn){initializeRelief(d);if(d.foodRelief.purchase?.turn<turn)d.foodRelief.purchase=null;for(const p of d.provinces)if(p.foodRelief.purchase&&p.foodRelief.purchase.turn<turn)p.foodRelief.purchase=null;}
export function recordFoodSettlement(p,turn,opening,produced,need){
 const {storageLoss}=grainStorage(p,turn,opening),available=opening-storageLoss+produced;
 p.foodRelief.lastSettlement={turn,opening,produced,need,...(storageLoss?{storageLoss}:{}),consumed:Math.min(available,need),shortfall:Math.max(0,need-available),closing:Math.max(0,available-need)};
 return p.foodRelief.lastSettlement;
}
export function validateRelief(d,currentTurn=Infinity){
 const r=d.foodRelief;if(!r||r.version!==1||!integer(r.nextId)||r.nextId<1||!Array.isArray(r.history)||r.history.length>100)invalid();
 if(r.purchase!=null){const q=r.purchase;if(!q||!integer(q.turn)||q.turn<1||q.turn>currentTurn||!integer(q.ration)||q.ration<1||q.limit!==q.ration*PURCHASE_RATION_TURNS||!integer(q.bought)||q.bought<1)invalid();}
 if(r.purchase&&(r.history.length<100||r.history.at(-1)?.turn<r.purchase.turn)){const recorded=r.history.filter(e=>e.kind==='purchase'&&e.turn===r.purchase.turn&&e.national).reduce((n,e)=>n+e.amount,0);if(recorded!==r.purchase.bought)invalid();}
 let prior=r.nextId,previousTurn=Infinity;
 for(const e of r.history){
  if(!e||!integer(e.id)||e.id<1||e.id>=prior||!integer(e.turn)||e.turn<1||e.turn>currentTurn||e.turn>previousTurn||!['purchase','transfer'].includes(e.kind)||
   !d.provinces.some(p=>p.id===e.targetId)||!integer(e.amount)||e.amount<1||e.amount>MAX_GRAIN||
   !['cost','targetBefore','targetAfter','treasuryBefore','treasuryAfter'].every(k=>integer(e[k]))||e.targetAfter!==e.targetBefore+e.amount||e.targetAfter>MAX_GRAIN||e.treasuryAfter!==e.treasuryBefore-e.cost)invalid();
  if(e.kind==='purchase'){if(e.sourceId!==null||e.sourceBefore!==null||e.sourceAfter!==null||(e.procurement?false:e.cost!==e.amount*GRAIN_PRICE))invalid();}
  else if(!d.provinces.some(p=>p.id===e.sourceId)||e.sourceId===e.targetId||e.cost!==0||!integer(e.sourceBefore)||!integer(e.sourceAfter)||e.sourceAfter!==e.sourceBefore-e.amount)invalid();
  if(e.sellerCountryId!==undefined){if(e.kind!=='purchase'||e.sellerCountryId===d.playerCountryId||!d.countries.some(c=>c.id===e.sellerCountryId)||!['sellerGrainBefore','sellerGrainAfter','sellerTreasuryBefore','sellerTreasuryAfter'].every(k=>integer(e[k]))||e.sellerGrainBefore-e.amount!==e.sellerGrainAfter||e.sellerTreasuryBefore+e.cost!==e.sellerTreasuryAfter)invalid();}
  if(e.market){const m=e.market;if(!['quota','spent','remaining','baseCost','excess','surcharge','cost'].every(k=>integer(m[k]))||m.remaining!==Math.max(0,m.quota-m.spent)||m.excess!==Math.max(0,m.baseCost-m.remaining)||m.surcharge!==Math.ceil(m.excess*.5)||m.cost!==m.baseCost+m.surcharge||m.cost!==e.cost)invalid();}
  if(e.procurement)validatePurchaseEffect(e.procurement,e.amount,GRAIN_PRICE,e.market?.baseCost??e.cost);
  prior=e.id;previousTurn=e.turn;
 }
 for(const p of d.provinces){const f=p.foodRelief;if(!f)invalid();
  if(f.purchase!==null){const q=f.purchase;if(!q||!integer(q.turn)||q.turn<1||q.turn>currentTurn||!integer(q.ration)||q.ration<1||q.limit!==q.ration*PURCHASE_RATION_TURNS||!integer(q.bought)||q.bought<1||q.bought>q.limit)invalid();}
  if(f.lastSettlement!==null){const s=f.lastSettlement;if(!s||!['turn','opening','produced','need','consumed','shortfall','closing'].every(k=>integer(s[k]))||s.turn<1||s.turn>currentTurn||
   (s.storageLoss!==undefined&&(!integer(s.storageLoss)||s.storageLoss>s.opening))||s.consumed!==Math.min(s.opening-(s.storageLoss??0)+s.produced,s.need)||s.shortfall!==Math.max(0,s.need-s.opening+(s.storageLoss??0)-s.produced)||s.closing!==Math.max(0,s.opening-(s.storageLoss??0)+s.produced-s.need))invalid();}
 }
}
