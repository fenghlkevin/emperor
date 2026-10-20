import {INDUSTRIES,outputFor} from './economy.mjs';
import {industryLandLimit} from './terrain-economy.mjs';
const clamp=n=>Math.max(0,Math.min(100,n));
// Each sector is normalized in its own unit. Keep sector contributions separate even when they share food or silver units.
// This is a derived indicator; it neither changes production nor writes save data.
export function economicProsperity(p,turn){
 const sectors=INDUSTRIES.map(([key,label,job,unit])=>{
  const area=industryLandLimit(p,key),base=p.industryLabor?.base[key];
  const workers=base?Math.ceil(area*base.workers/base.area):Math.max(1,Math.ceil(area/.2));
  const potential={...p,economy:{...p.economy,[key]:{...p.economy[key],developedArea:area,productivity:100}},population:{...p.population,professions:{...p.population.professions,[job]:workers}},development:{},civic:{...p.civic,localInvestment:null}};
  const actual=outputFor(p,key,turn),maximum=outputFor(potential,key,turn),score=maximum>0?clamp(actual/maximum*100):0;
  return {key,label,unit,actual,maximum,score};
 });
 return {value:Math.round(sectors.reduce((n,s)=>n+s.score,0)/sectors.length),sectors};
}
export function nationalProsperity(provinces,turn){const total=provinces.reduce((n,p)=>n+p.population.total,0);return Math.round(provinces.reduce((n,p)=>n+economicProsperity(p,turn).value*p.population.total,0)/(total||1));}
