import {balanced} from './development-balance.mjs';
import {initializeIndustryLabor} from './industry-labor.mjs';
import {officialCollection,validateOfficialProductionSnapshot} from './official-production.mjs';
import {foodProduction,nonAgriculturalTaxDetail} from './economy.mjs';
import {grainStorage} from './grain-storage.mjs';
import {postGrain} from './grain-finance.mjs';
import {postTreasury} from './finance.mjs';
import {changeWelfare} from './building-effects.mjs';

// Phase-1 single-province kernel. Not yet the global settlement default.
// One farmer works at most .2 mu; farms produce .18 shi/mu at productivity 100.
import {RESOURCE_RULES} from './resource-rules.mjs';
export {RESOURCE_RULES} from './resource-rules.mjs';
export function initializeResourceEconomy(d){
 if(d.resourceRulesVersion!==undefined&&d.resourceRulesVersion!==1)throw Error('资源规则版本不支持');
 if(d.resourceRulesVersion===1){initializeIndustryLabor(d);validateResourceEconomy(d);return d;}
 d.resourceRulesVersion=1;
 for(const c of d.countries)c.fiscal.taxRate=.2;
 for(const p of d.provinces){p.resourceRulesVersion=1;p.budget.taxRate=.2;
  // Procurement and new construction are actual orders, not recurring seed
  // allowances. Recurring military supplies and building maintenance remain.
  p.budget.expenses.construction=0;p.budget.expenses.weapons=0;}
 initializeIndustryLabor(d);return d;
}
export function validateResourceEconomy(d){
 if(d.resourceRulesVersion!==undefined&&d.resourceRulesVersion!==1)throw Error('资源规则版本不支持');
 for(const p of d.provinces)if(p.resourceRulesVersion!==d.resourceRulesVersion)throw Error('州郡资源规则不一致');
}
const nonnegative=n=>Number.isSafeInteger(n)&&n>=0;
export const assessedFoodTax=(p,produced,rate,civilianNeed)=>Math.floor((balanced(p)?Math.max(0,produced-civilianNeed)*.1:produced)*rate);
export function quoteProvinceResources(p,{turn,grainTaxRate=p.budget.taxRate,
 cashTaxRate=p.budget.taxRate,cashExpense=0}={}) {
 if(!Number.isSafeInteger(turn)||turn<1||!nonnegative(cashExpense)||
  ![grainTaxRate,cashTaxRate].every(n=>Number.isFinite(n)&&n>=0&&n<=.5))throw Error('州郡资源结算参数无效');
 const {developed,cultivated,base,produced,foodSources}=foodProduction(p,turn);
 const publicPeople=p.population.professions.soldiers+p.population.professions.militia;
 const totalNeed=Math.round(p.population.total*RESOURCE_RULES.ration);
 const officialNeed=Math.min(totalNeed,Math.round(publicPeople*RESOURCE_RULES.ration));
 const civilianNeed=totalNeed-officialNeed;
 // Preserve civilian subsistence before collecting grain. A bad harvest cannot
 // create both compulsory tax and relief for the same grain in one settlement.
 const levy=officialCollection(p,assessedFoodTax(p,produced,grainTaxRate,civilianNeed),Math.max(0,produced-civilianNeed));
 const grainTax=levy.net;
 const civilianAvailable=produced-levy.gross;
 const civilianShortfall=Math.max(0,civilianNeed-civilianAvailable);
 const {storageLoss}=grainStorage(p,turn),opening=p.welfare.grainReserve??0;
 const publicAvailable=opening-storageLoss+grainTax,need=officialNeed+civilianShortfall;
 const consumed=Math.min(publicAvailable,need),shortfall=need-consumed;
 // Agriculture and pastoral pay food tax; commerce and industry pay silver only.
 const cashLevy=nonAgriculturalTaxDetail(p,cashTaxRate,turn),cashTax=cashLevy.net;
 return {version:1,...(balanced(p)?{developmentBalanceVersion:2}:{}),turn,provinceId:p.id,production:{developed,cultivated,produced,foodSources},...(p.officialProduction?{officers:structuredClone(p.officialProduction),officialImpact:{baseProduction:base,productionDelta:produced-base,grainAssessed:levy.gross,grainLoss:levy.loss,cashBase:cashLevy.base,cashAssessed:cashLevy.gross,cashLoss:cashLevy.loss}}:{}),
  civilian:{need:civilianNeed,available:civilianAvailable,shortfall:civilianShortfall,
   surplus:Math.max(0,civilianAvailable-civilianNeed)},
  grain:{opening,tax:grainTax,officialNeed,reliefNeed:civilianShortfall,need,consumed,storageLoss,shortfall,
   closing:publicAvailable-consumed},
  cash:{tax:cashTax,expense:cashExpense,net:cashTax-cashExpense},rates:{grain:grainTaxRate,cash:cashTaxRate}};
}

export function settleProvinceResources(state,provinceId,options={}) {
 if(state.domestic.nationalResourcesVersion===1)throw Error('全国统一结算，不能单独结算州库存');
 const p=state.domestic.provinces.find(p=>p.id===provinceId&&p.countryId===state.domestic.playerCountryId);
 if(!p)throw Error('只能结算本国州郡');
 if(p.resourceSettlement?.turn>=state.turn||p.foodRelief?.lastSettlement?.turn>=state.turn)throw Error('该州本旬资源已结算');
 const quote=quoteProvinceResources(p,{...options,turn:state.turn});
 const next=structuredClone(state),d=next.domestic,target=d.provinces.find(p=>p.id===provinceId);
 postTreasury(d,d.playerCountryId,{turn:state.turn,income:quote.cash.tax,expense:quote.cash.expense,
  category:'regular',reason:`${p.name}资源试行收支`,key:`province-resources:${state.turn}:${p.id}`});
 postGrain(target,{turn:state.turn,expense:quote.grain.storageLoss,category:'storage',reason:'官仓损耗',key:`resources:${state.turn}:storage`});
 postGrain(target,{turn:state.turn,income:quote.grain.tax,category:'tax',reason:'田赋入官仓',key:`resources:${state.turn}:tax`});
 postGrain(target,{turn:state.turn,expense:quote.grain.consumed,category:'consumption',reason:'官府供粮与救济',key:`resources:${state.turn}:consumption`});
 if(quote.grain.shortfall){changeWelfare(target,'stability',-2);changeWelfare(target,'loyalty',-1);}
 target.resourceSettlement=quote;
 next.stats.treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;
 return {state:next,receipt:structuredClone(quote)};
}

export function settleProvinceGrain(p,turn){
 const q=quoteProvinceResources(p,{turn}),g=q.grain;
 postGrain(p,{turn,expense:g.storageLoss,category:'storage',reason:'官仓损耗',key:`resources:${turn}:storage`});
 postGrain(p,{turn,income:g.tax,category:'tax',reason:'田赋入官仓',key:`resources:${turn}:tax`});
 postGrain(p,{turn,expense:g.consumed,category:'consumption',reason:'官府供粮与救济',key:`resources:${turn}:consumption`});
 p.resourceSettlement=q;
 p.foodRelief.lastSettlement={turn,opening:g.opening,produced:g.tax,need:g.need,consumed:g.consumed,
  ...(g.storageLoss?{storageLoss:g.storageLoss}:{}),shortfall:g.shortfall,closing:g.closing};
 if(g.shortfall){changeWelfare(p,'stability',-2);changeWelfare(p,'loyalty',-1);}
 return q;
}

export function validateResourceSettlement(p,turn=Infinity) {
 const r=p.resourceSettlement;if(r===undefined)return;
 const fail=()=>{throw Error('州郡资源快照无效');};
 if(r.developmentBalanceVersion!==undefined&&(r.developmentBalanceVersion!==2||!balanced(p)))fail();
 if(!r||r.version!==1||r.provinceId!==p.id||!Number.isSafeInteger(r.turn)||r.turn<1||r.turn>turn||
  !r.production||!r.civilian||!r.grain||!r.cash||!r.rates)fail();
 for(const [group,keys] of [[r.production,['produced']],[r.civilian,['need','available','shortfall','surplus']],
  [r.grain,['opening','tax','officialNeed','reliefNeed','need','consumed','storageLoss','shortfall','closing']],
  [r.cash,['tax','expense']]])if(keys.some(k=>!nonnegative(group[k])))fail();
 if(![r.production.developed,r.production.cultivated].every(n=>Number.isFinite(n)&&n>=0)||
  r.production.cultivated>r.production.developed||!Object.values(r.rates).every(n=>Number.isFinite(n)&&n>=0&&n<=.5))fail();
 const sources=r.production.foodSources;
 if(sources!==undefined){if(!sources||Object.keys(sources).length!==2||!['agriculture','pastoral'].every(key=>sources[key]&&['base','produced'].every(k=>nonnegative(sources[key][k])))||sources.agriculture.produced+sources.pastoral.produced!==r.production.produced)fail();const multiplier=1+(r.officers?.productionRate??0);for(const row of Object.values(sources))if(row.produced!==Math.round(row.base*multiplier))fail();}
 if(r.officers||r.officialImpact){
  validateOfficialProductionSnapshot(r.officers,p.id,r.turn);
  const i=r.officialImpact;if(!r.officers||!i||!['baseProduction','grainAssessed','grainLoss','cashBase','cashAssessed','cashLoss'].every(k=>nonnegative(i[k]))||!Number.isSafeInteger(i.productionDelta)||i.baseProduction+i.productionDelta!==r.production.produced||i.grainAssessed-i.grainLoss!==r.grain.tax||i.cashAssessed-i.cashLoss!==r.cash.tax||Math.abs(i.productionDelta)>Math.ceil(i.baseProduction*.1)+(sources?1:0)||(sources?i.baseProduction!==sources.agriculture.base+sources.pastoral.base:r.production.produced!==Math.round(i.baseProduction*(1+r.officers.productionRate))))fail();
 const grain=officialCollection({officialProduction:r.officers},assessedFoodTax(r, r.production.produced,r.rates.grain,r.civilian.need),Math.max(0,r.production.produced-r.civilian.need)),cash=officialCollection({officialProduction:r.officers},i.cashBase);if(grain.gross!==i.grainAssessed||grain.loss!==i.grainLoss||cash.gross!==i.cashAssessed||cash.loss!==i.cashLoss)fail();
 }
 const g=r.grain,c=r.civilian;
 if((g.nationalIn!==undefined&&(!nonnegative(g.nationalIn)||!nonnegative(g.nationalOut)))||g.opening-g.storageLoss+g.tax+(g.nationalIn??0)-(g.nationalOut??0)-g.consumed!==g.closing||g.need!==g.officialNeed+g.reliefNeed||
  g.need-g.consumed!==g.shortfall||c.available!==r.production.produced-g.tax-(r.officialImpact?.grainLoss??0)||
  c.shortfall!==Math.max(0,c.need-c.available)||g.reliefNeed!==c.shortfall||
  c.surplus!==Math.max(0,c.available-c.need)||r.cash.net!==r.cash.tax-r.cash.expense)fail();
}
