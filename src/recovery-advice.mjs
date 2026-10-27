import {countrySummary} from './domestic.mjs';
import {nationalFoodForecast} from './national-resources.mjs';

// A current-output comparison, not a future-income promise or a policy order.
export function recoveryAdvice(state){
 const d=state.domestic,current=countrySummary(d,undefined,state.turn),food=nationalFoodForecast(d,state.turn+1);
 const taxOptions=[20,22,24].map(rate=>{
  const preview={...d,provinces:d.provinces.map(p=>p.countryId===d.playerCountryId?{...p,budget:{...p.budget,taxRate:rate/100}}:p)};
  return {rate,net:countrySummary(preview,undefined,state.turn).net};
 });
 return {net:current.net,debt:current.country.fiscal.debt,grain:current.country.fiscal.grain,foodNeed:food.need,foodShortfall:food.shortfall,taxOptions};
}
