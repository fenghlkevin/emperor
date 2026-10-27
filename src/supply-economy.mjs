import {balanced} from './development-balance.mjs';
import {outputFor} from './economy.mjs';
// Capacity benefits, not a second inventory: equipment still costs silver and
// every acquired/lost kit remains in the existing sole depot ledger.
export function industrialProcurement(d,id=d.playerCountryId){
 if(!balanced(d))return 0;
 const ps=d.provinces.filter(p=>p.countryId===id),population=ps.reduce((n,p)=>n+p.population.total,0);
 const output=ps.reduce((n,p)=>n+outputFor(p,'industry'),0);
 return Math.min(.2,output/Math.max(1,population*.015)*.2);
}
export function pastoralLogistics(d,id=d.playerCountryId){
 if(!balanced(d))return 0;
 const ps=d.provinces.filter(p=>p.countryId===id),population=ps.reduce((n,p)=>n+p.population.total,0);
 const output=ps.reduce((n,p)=>n+outputFor(p,'pastoral'),0);
 return Math.min(.15,output/Math.max(1,population*.003)*.15);
}
