import {worldKitSummary} from './troop-kit-world.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
// Soldiers have a single population register; all equipment is measured in whole kits.
export function militarySummary(d,countryId=d.playerCountryId){
 const country=d.countries.find(c=>c.id===countryId),rows=worldKitSummary(d,countryId).map(r=>({...r,soldiers:r.soldiers.total,stock:Object.fromEntries(TROOP_KITS.map(k=>[k.id,r.kits[k.id].total]))})),soldiers=rows.reduce((n,r)=>n+r.soldiers,0),training=soldiers?Math.round(rows.reduce((n,r)=>n+r.training*r.soldiers,0)/soldiers):0;
 return {country,rows,soldiers,training,stock:Object.fromEntries(TROOP_KITS.map(k=>[k.id,rows.reduce((n,r)=>n+r.stock[k.id],0)]))};
}
