import {cityPopulation} from './city-capacity.mjs';
import {laborProfile} from './labor.mjs';
import {INDUSTRY_JOBS,industryStaffing} from './industry-labor.mjs';
// Remove central soldiers and settle every released person in friendly territory.
// The same routine runs on the quote clone and the execution clone.
export function demobilizeCentral(d,amount,turn){
 const capital=d.provinces.find(p=>p.id===d.centralArmy.sourceProvinceId),allocations=new Map();
 capital.population.professions.soldiers-=amount;d.centralArmy.soldiers-=amount;
 const settle=(p,n,job)=>{
  if(!n)return; if(p!==capital){capital.population.total-=n;p.population.total+=n;}
  allocations.set(p.id,(allocations.get(p.id)??0)+n);
  if(job){const key=Object.keys(INDUSTRY_JOBS).find(k=>INDUSTRY_JOBS[k]===job);p.population.professions[job]+=Math.min(n,industryStaffing(p,key,turn).vacant,laborProfile(p).available);}
 };
 let untracked=amount,left=amount;
 for(const r of d.manpower?.drafts??[]){
  if(r.stationId!=='central'||r.role!=='soldiers'||!left)continue;
  const n=Math.min(left,r.count);r.count-=n;left-=n;
  const home=d.provinces.find(p=>p.id===r.originId&&p.countryId===d.playerCountryId);
  const back=home?Math.min(n,home===capital?n:cityPopulation(home).available):0;
  settle(home,back,r.job);untracked-=back;
 }
 if(d.manpower)d.manpower.drafts=d.manpower.drafts.filter(r=>r.count);
 let places=d.provinces.filter(p=>p.countryId===d.playerCountryId&&p!==capital&&cityPopulation(p).available>0);
 while(untracked&&places.length){
  const share=Math.max(1,Math.floor(untracked/places.length));
  for(const p of places){const n=Math.min(untracked,share,cityPopulation(p).available);settle(p,n);untracked-=n;if(!untracked)break;}
  places=places.filter(p=>cityPopulation(p).available>0);
 }
 // Existing residents need no incoming capacity when remaining in the capital.
 settle(capital,untracked);
 return [...allocations].map(([provinceId,count])=>({provinceId,count}));
}
