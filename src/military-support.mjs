import {countrySummary} from './domestic.mjs';
import {nationalFoodForecast} from './national-resources.mjs';
import {laborProfile} from './labor.mjs';

// Conservative recurring budget only: no treasury/warehouse stock, automatic
// purchases, emergency subsidies or assumed growth can finance this estimate.
export function militarySupport(state,sourceId='central'){
 const d=state.domestic;if(d.resourceRulesVersion!==1)return {available:false,reason:'旧资源规则暂不提供新制养兵估算。'};
 const owned=d.provinces.filter(p=>p.countryId===d.playerCountryId),p=owned.find(p=>p.id===(sourceId==='central'?d.centralArmy.sourceProvinceId:sourceId));
 if(!p)return {available:false,reason:'驻地不在本国辖区。'};
 const current=sourceId==='central'?d.centralArmy.soldiers:p.population.professions.soldiers-(p.id===d.centralArmy.sourceProvinceId?d.centralArmy.soldiers:0);
 // Central recruitment may draw from all provinces; limiting the advisory to
 // local spare labor avoids promising transfers before they have been approved.
 const upper=current+laborProfile(p).available;
 const assess=n=>{
  const copy=structuredClone(d),city=copy.provinces.find(x=>x.id===p.id);city.population.professions.soldiers+=n-current;
  const cash=countrySummary(copy,copy.playerCountryId,state.turn+1).net;
  const q=nationalFoodForecast(copy,state.turn+1),grain=q.produced-q.need-q.storageLoss;
  return {cash,grain,foodSafe:grain>=0,shortStates:grain<0?q.provinces.filter(x=>x.need>0).map(x=>x.id):[]};
 };
 const base=assess(current);let low=0,high=upper;
 while(low<high){const mid=Math.ceil((low+high)/2),q=assess(mid);if(q.cash>=0&&q.foodSafe)low=mid;else high=mid-1;}
 const floor=assess(0),feasible=floor.cash>=0&&floor.foodSafe;
 return {available:true,sourceId,current,recommended:feasible?low:0,spareLabor:upper-current,cashNet:base.cash,grainNet:base.grain,
  reasons:[...(base.cash<0?['常规财政入不敷出']:[]),...(!base.foodSafe?['全国官粮持续短支']:[]),...(!feasible?['本营裁至零仍有缺口，需先调整其他开支或生产']:[])],
  assumptions:'按下旬当前生产与常规预算估算，全国统一供粮，不消耗存款/存粮；其他驻军保持不变，只使用本州富余劳力，不抽调农人。建议值不是兵力硬上限，灾情和治理调整后需重估。'};
}
