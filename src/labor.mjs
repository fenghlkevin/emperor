// Simple game ratio, no age/sex simulation. 75% keeps default starting jobs
// intact. Existing over-capacity jobs are reported, never silently deleted.
import {laborRatio} from './development-balance.mjs';
export const LABOR_RATIO=.75;
export function laborProfile(p) {
 const total=p.population.total;
 const assigned=Object.values(p.population.professions).reduce((a,b)=>a+b,0);
 const ratio=laborRatio(p),capacity=Math.floor(total*ratio);
 return {ratio,total,capacity,nonLabor:total-capacity,assigned,
  available:Math.max(0,capacity-assigned),overCapacity:Math.max(0,assigned-capacity)};
}
// Automatic employment leaves 5% of the labor force available for public works.
// Existing jobs are retained; manual allocation and drafting can use the reserve.
export function laborReserve(p) {
 const l=laborProfile(p);
 const target=p.resourceRulesVersion===1?Math.ceil(l.capacity*.05):0;
 const service=p.population.professions.militia;
 return {target,needed:Math.max(0,target-service),hiringAvailable:Math.max(0,l.available-Math.max(0,target-service))};
}
export function productionLaborLimit(p) {
 const l=laborProfile(p),jobs=p.population.professions;
 // Legacy/war-induced excess may be redistributed, but cannot be expanded.
 return Math.max(l.capacity,l.assigned)-jobs.soldiers-jobs.militia;
}
// Call after adding real arrivals to total population. Events may suggest jobs,
// but new-rule arrivals cannot create jobs beyond the shared labor capacity.
export function assignArrivalJobs(p,targets) {
 const assigned={};
 for(const [job,wanted] of Object.entries(targets)){
  const key=({farmers:'agriculture',herders:'pastoral',merchants:'commerce',workers:'industry'})[job],base=p.industryLabor?.base[key];
  const room=base?Math.max(0,Math.ceil(p.economy[key].developedArea*base.workers/base.area)-p.population.professions[job]):Infinity;
  const n=p.resourceRulesVersion===1?Math.min(wanted,laborReserve(p).hiringAvailable,room):wanted;
  p.population.professions[job]+=n;assigned[job]=n;
 }
 return assigned;
}
