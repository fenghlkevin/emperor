import {BUILDINGS,countrySummary,grainSecurity,INDUSTRIES,outputFor} from './domestic.mjs';
// Display order follows the works register; values come from the shared ledger.
export const WORKS_BUILDINGS=['temples','yamen','trainingGrounds','markets','granaries','walls','palaces'].map(key=>BUILDINGS.find(([id])=>id===key));
export function worksSummary(domestic,countryId=domestic.playerCountryId){
 const s=countrySummary(domestic,countryId);
 const specialBuildings=s.provinces.flatMap(p=>p.specialBuildings.map(b=>({...b,provinceId:p.id,provinceName:p.name})));
 return {...s,buildingTotal:Object.values(s.buildings).reduce((n,count)=>n+count,0),specialBuildings,specialTotal:specialBuildings.reduce((n,b)=>n+b.count,0)};
}
export function worksProvince(province,domestic){
 return {province,grainSecurity:grainSecurity(province,domestic),industries:INDUSTRIES.map(([key,name,job,unit])=>({key,name,unit,workers:province.population.professions[job],developedArea:province.economy[key].developedArea,developmentRate:Math.round(province.economy[key].developedArea/province.cityCapacity.land*100),output:outputFor(province,key)}))};
}
