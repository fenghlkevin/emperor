import {INDUSTRY_JOBS,industryStaffing} from './industry-labor.mjs';
import {nationalFoodForecast} from './national-resources.mjs';
import {countrySummary} from './domestic.mjs';
import {foodForecast} from './food-relief.mjs';
import {laborProfile} from './labor.mjs';

// Read-only bridge for phase 1. Never infer a complete grain ledger from a
// supply snapshot: purchases, disasters and transfers can occur outside it.
export function turnEconomyReport(state) {
 const d=state.domestic,summary=countrySummary(d,d.playerCountryId,state.turn+1);
 const country=summary.country;
 const period=country.ledger.find(r=>r.turn===state.turn&&!r.legacy);
 const completed=country.ledger.find(r=>r.turn<state.turn&&!r.legacy);
 const cashRow=row=>row?{turn:row.turn,opening:row.openingTreasury,income:row.income,
  paid:row.expenditure,net:row.net,closing:row.closingTreasury,debtAdded:row.debtAdded}:null;
 const provinces=summary.provinces.map(p=>{
  const forecast=foodForecast(p,state.turn,state.turn+1,d),last=p.foodRelief?.lastSettlement;
  return {id:p.id,name:p.name,population:p.population.total,professions:{...p.population.professions},
   unassigned:laborProfile(p).available,labor:laborProfile(p),staffing:Object.fromEntries(Object.keys(INDUSTRY_JOBS).map(k=>[k,industryStaffing(p,k,state.turn)])),
   resourceForecast:forecast.resource??null,
   resourceActual:p.resourceSettlement?structuredClone(p.resourceSettlement):null,
   forecast:{produced:forecast.produced,need:forecast.need,storageLoss:forecast.storageLoss,
    net:forecast.produced-forecast.need-forecast.storageLoss,shortfall:forecast.shortfall,consumed:forecast.consumed},
   supply:last?{...last}:null};
 });
 const national=nationalFoodForecast(d,state.turn+1);
 return {turn:state.turn,treasury:country.fiscal.treasury,debt:country.fiscal.debt,
  current:cashRow(period),previous:cashRow(completed),grain:country.fiscal.grain,grainPeriod:structuredClone(country.grainAccounting?.periods.find(row=>row.turn===state.turn)??null),
  forecast:{turn:state.turn+1,income:summary.income,due:summary.expenditure,net:summary.net,
   grain:{...national,net:national.closing-national.opening}},
  provinces};
}
