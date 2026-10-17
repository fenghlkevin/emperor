import {commerceMultiplier} from './building-effects.mjs';
// Shared industry definitions, base production and the trial market modifier.
export const INDUSTRIES=[['agriculture','农业','farmers','石'],['pastoral','牧业','herders','头'],['commerce','商业','merchants','两'],['industry','工业','workers','件']];
export const JOBS=[['farmers','农人'],['herders','牧人'],['merchants','商人'],['workers','工人'],['soldiers','士兵'],['militia','民伕']];
export function unallocatedPopulation(p){return p.population.total-JOBS.reduce((n,[key])=>n+p.population.professions[key],0);}
export function productiveArea(p,key,turn){
  const activation=p.development?.activation;
  return p.economy[key].developedArea-(activation?.industry===key&&turn!==undefined&&turn<activation.effectiveTurn?activation.area:0)-(key==='agriculture'&&p.civic?.localInvestment&&turn!==undefined&&turn<p.civic.localInvestment.effectiveTurn?p.civic.localInvestment.area:0);
}
export function outputFor(p,key,turn){
  const sector=p.economy[key],job=INDUSTRIES.find(([id])=>id===key)?.[2];
  if(!sector||!job)throw Error('产业无效');
  const scale={agriculture:.075,pastoral:.012,commerce:.16,industry:.09}[key];
  const development=productiveArea(p,key,turn)/sector.capacityArea;
  const base=Math.round(p.population.professions[job]*scale*development*sector.productivity/100);
  return key==='commerce'?Math.round(base*commerceMultiplier(p,turn)*(1+(p.specialCommerceBonus??0)/100)):base;
}
export function industryTax(p,turn){
  const taxable=outputFor(p,'agriculture',turn)*.7+outputFor(p,'pastoral',turn)*4+outputFor(p,'commerce',turn)+outputFor(p,'industry',turn)*.8;
  return Math.round(taxable*p.budget.taxRate*(p.status.situation==='unrest'?.65:1)*(1-Math.max(0,40-p.welfare.security)/100));
}
