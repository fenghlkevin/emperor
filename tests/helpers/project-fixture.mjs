import {planMilitia,applyManpower} from '../../src/manpower.mjs';
// Allocate real residents to a test project's workforce; never fabricate people.
export function staffProject(state,provinceId,count){
 const d=state.domestic,p=d.provinces.find(p=>p.id===provinceId),extra=Math.max(0,count-p.population.professions.militia);
 if(extra)applyManpower(d,planMilitia(d,[p],extra,{farmers:50,herders:50,workers:50,merchants:50}),'militia',p.id);
 return state;
}
