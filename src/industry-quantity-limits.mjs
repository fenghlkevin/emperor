import {industryOverview} from './industry.mjs';
import {industryLandAvailable} from './terrain-economy.mjs';
import {productionLaborLimit,laborProfile} from './labor.mjs';
import {planManpower} from './manpower.mjs';
import {projectLaborOverview,developmentLaborCapacity} from './project-labor.mjs';
import {developmentRate} from './difficulty.mjs';
import {affordableMaximum} from './quantity-controls.mjs';
export function industryQuantityLimit(state,p,kind,industry,fromIndustry,rates,input,targets){
 if(input.dataset.rate)return 50;
 const overview=industryOverview(p,state.turn),key=input.dataset.value;
 if(input.matches('[data-industry-area]')||key==='area'){
  const land=kind==='convert'?Math.max(0,p.economy[fromIndustry].developedArea-(p.development.activation?.industry===fromIndustry&&p.development.activation.effectiveTurn>state.turn?p.development.activation.area:0)-(fromIndustry==='agriculture'&&p.civic?.localInvestment?.effectiveTurn>state.turn?p.civic.localInvestment.area:0)):overview.land.available;
  return Math.min(kind==='plan'?50000:developmentLaborCapacity(state.domestic,p),land,industryLandAvailable(p,industry),kind==='plan'?Infinity:Math.floor(state.stats.treasury/developmentRate(state.domestic)));
 }
 if(input.matches('[data-militia-amount]')||key==='amount'){
  if(kind==='release-militia')return projectLaborOverview(state.domestic,p).available;
  return affordableMaximum(p.population.total,n=>{try{planManpower(state.domestic,[p],n,rates);return true;}catch{return false;}});
 }
 const job=input.dataset.industryTarget??input.dataset.target;
 if(job){const others=Object.entries(targets??{}).filter(([id])=>id!==job).reduce((n,[,v])=>n+(Number(v)||0),0);return Math.max(0,productionLaborLimit(p)-others);}
}
