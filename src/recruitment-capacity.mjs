import {laborProfile} from './labor.mjs';
import {planManpower} from './manpower.mjs';
import {cityPopulation} from './city-capacity.mjs';
import {recruitRate} from './difficulty.mjs';
// Use the execution planner, including its province order and shared draft limits.
export function recruitmentCapacity(state,stationId,rates={}){
 const d=state.domestic,central=stationId==='central',station=d.provinces.find(p=>p.id===(central?d.centralArmy.sourceProvinceId:stationId));
 const provinces=d.provinces.filter(p=>central?p.countryId===d.playerCountryId:p.id===stationId);
 const idle=provinces.reduce((n,p)=>n+laborProfile(p).available,0);
 const manpowerCeiling=provinces.reduce((n,p)=>n+laborProfile(p).available+Object.entries(rates).reduce((s,[job,rate])=>s+Math.floor((p.population.professions[job]??0)*rate/100),0),0);
 const room=cityPopulation(station).available;
 const planFits=n=>{try{const plan=planManpower(d,provinces,n,rates);return !central||plan.filter(r=>r.provinceId!==station.id).reduce((s,r)=>s+r.count,0)<=room;}catch{return false;}};
 const search=ceiling=>{let lo=0,hi=ceiling;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(planFits(mid))lo=mid;else hi=mid-1;}return lo;};
 const personnel=search(manpowerCeiling),treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;
 const max=Math.min(personnel,Math.max(0,Math.floor(treasury/recruitRate(d))));
 const plan=max?planManpower(d,provinces,max,rates):[];
 return {max,idle,personnel,industry:plan.filter(r=>r.job).reduce((s,r)=>s+r.count,0),plan};
}
