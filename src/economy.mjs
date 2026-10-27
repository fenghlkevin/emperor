import {balanced,economicEffort,disasterProduction} from './development-balance.mjs';
import {terrainMultiplier} from './terrain-economy.mjs';
import {effectiveIndustryArea,industryStaffing} from './industry-labor.mjs';
import {officialProductionMultiplier,officialCollection} from './official-production.mjs';
import {commerceMultiplier} from './building-effects.mjs';
import {laborProfile} from './labor.mjs';
import {RESOURCE_RULES} from './resource-rules.mjs';
// Shared industry definitions, base production and the trial market modifier.
export const INDUSTRIES=[['agriculture','农业','farmers','石'],['pastoral','牧业','herders','石'],['commerce','商业','merchants','两'],['industry','工业','workers','两']];
export const JOBS=[['farmers','农人'],['herders','牧人'],['merchants','商人'],['workers','工人'],['soldiers','士兵'],['militia','民伕']];
export function unallocatedPopulation(p){return laborProfile(p).available;}
export const productiveArea=effectiveIndustryArea;
export function outputFor(p,key,turn){
  if(p.resourceRulesVersion===1&&['agriculture','pastoral'].includes(key))return foodSectorProduction(p,key,turn).produced;
  const sector=p.economy[key],job=INDUSTRIES.find(([id])=>id===key)?.[2];
  if(!sector||!job)throw Error('产业无效');
  const scale={agriculture:.075,pastoral:.012,commerce:.16,industry:.09}[key];
  const staffing=industryStaffing(p,key,turn);
  const development=(p.industryLabor?p.industryLabor.base[key].area:productiveArea(p,key,turn))/sector.capacityArea;
  const base=Math.round((p.industryLabor?Math.min(staffing.workers,staffing.required):p.population.professions[job])*scale*development*sector.productivity/100*terrainMultiplier(p,key));
  const resourceBase=key==='pastoral'?base*2:key==='industry'?Math.round(base*.8):base;
  return Math.round((key==='commerce'?resourceBase*commerceMultiplier(p,turn)*(1+(p.specialCommerceBonus??0)/100):resourceBase)*officialProductionMultiplier(p)*economicEffort(p)*disasterProduction(p,key,turn));
}
export function fullOutputFor(p,key,turn){
 if(!p.industryLabor)return outputFor(p,key,turn);
 const job=INDUSTRIES.find(([id])=>id===key)?.[2],required=industryStaffing(p,key,turn).required;
 return outputFor({...p,population:{...p.population,professions:{...p.population.professions,[job]:required}}},key,turn);
}
export function industryTax(p,turn){
  return nonAgriculturalTax(p,p.budget.taxRate,turn);
}
export function foodSectorProduction(p,key,turn){
 if(!['agriculture','pastoral'].includes(key))throw Error('粮食产业无效');
 const job=key==='agriculture'?'farmers':'herders',developed=Math.max(0,productiveArea(p,key,turn));
 const staffing=industryStaffing(p,key,turn),b=p.industryLabor?.base[key];
 const areaPerWorker=balanced(p)&&key==='pastoral'?.6:RESOURCE_RULES.areaPerFarmer;
 const cultivated=b?developed*Math.min(1,b.workers*areaPerWorker/b.area)*staffing.ratio:Math.min(developed,p.population.professions[job]*areaPerWorker);
 const yieldPerMu=key==='agriculture'?RESOURCE_RULES.grainPerMu:RESOURCE_RULES.pastoralGrainPerMu;
 const base=Math.round(cultivated*yieldPerMu*p.economy[key].productivity/100*terrainMultiplier(p,key)*disasterProduction(p,key,turn));
 return {developed,cultivated,base,produced:Math.round(base*officialProductionMultiplier(p))};
}
export function agriculturalProduction(p,turn){return foodSectorProduction(p,'agriculture',turn);}
export function nonAgriculturalTaxDetail(p,rate,turn){
 const base=outputFor(p,'commerce',turn)+outputFor(p,'industry',turn);
 const tax=Math.round(base*rate*(p.status.situation==='unrest'?.65:1)*(1-Math.max(0,40-p.welfare.security)/100));return p.officialProduction?officialCollection(p,tax):{base:tax,gross:tax,loss:0,net:tax};
}

export function nonAgriculturalTax(p,rate,turn){return nonAgriculturalTaxDetail(p,rate,turn).net;}

// Livestock products are counted as food equivalents; industry is counted in silver.
// Equal worked area and productivity: agriculture .18 shi/mu, pastoral .06 shi/mu.
export function foodProduction(p,turn){
 const agriculture=agriculturalProduction(p,turn),pasture=foodSectorProduction(p,'pastoral',turn),pastoralBase=pasture.base,pastoral=pasture.produced;
 return {...agriculture,base:agriculture.base+pastoralBase,produced:agriculture.produced+pastoral,
  foodSources:{agriculture:{base:agriculture.base,produced:agriculture.produced},pastoral:{base:pastoralBase,produced:pastoral}}};
}
export function legacyFoodOutput(p,turn){return outputFor(p,'agriculture',turn)+outputFor(p,'pastoral',turn);}
