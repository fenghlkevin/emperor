import {resourceShortage} from './action-feedback.mjs';
import {initializeTerrainEconomy,validateTerrainEconomy} from './terrain-economy.mjs';
// Capacity is persisted once; loading a save must never raise its limits.
const sectors=['agriculture','pastoral','commerce','industry'];
const MAX=1e12;
export const CITY_EXPANSION_PEOPLE=10000,CITY_EXPANSION_COST=5000,CITY_EXPANSION_LAND=5000;
export const populationLimit=normal=>Math.floor(normal*1.2);
export function initializeCityCapacity(d,options={}){
 if(d.capacityRulesVersion!==undefined){if(d.capacityRulesVersion!==1||d.provinces.some(p=>!p.cityCapacity))throw Error('城州容量记录不完整');initializeTerrainEconomy(d,options);return d;}
 if(d.provinces.some(p=>p.cityCapacity!==undefined))throw Error('城州容量记录不完整');
 for(const p of d.provinces){
  const used=sectors.reduce((n,k)=>n+p.economy[k].developedArea,0),reserved=p.development?.project?.fromIndustry?0:(p.development?.project?.area??0);
  const land=Math.min(p.area,Math.max(used+reserved,sectors.reduce((n,k)=>n+p.economy[k].capacityArea,0)));
  p.cityCapacity={version:1,land,population:Math.min(Math.floor(MAX/1.2),Math.ceil(p.population.total*1.25))};
 }
 d.capacityRulesVersion=1;initializeTerrainEconomy(d,options);return d;
}
export function cityLand(p){
 const used=sectors.reduce((n,k)=>n+p.economy[k].developedArea,0),project=p.development?.project;
 const reserved=project&&!project.fromIndustry?project.area:0;
 return {total:p.cityCapacity.land,used,reserved,available:Math.max(0,p.cityCapacity.land-used-reserved)};
}
export function cityPopulation(p){
 const normal=p.cityCapacity.population,limit=populationLimit(normal),total=p.population.total;
 return {normal,limit,total,available:Math.max(0,limit-total),overload:Math.max(0,total-normal),
  pressure:total>normal?Math.ceil((total-normal)/normal*10):0};
}
export function admittedPopulation(p,wanted){return Math.min(wanted,cityPopulation(p).available);}
export function requirePopulationRoom(p,n){if(n>cityPopulation(p).available)throw Error(resourceShortage('接收迁入人口',p.name+'人口超载上限余量',n,cityPopulation(p).available,'人')+'请先扩建或迁出人口。');}
export function validateCityCapacity(d){
 if(d.capacityRulesVersion!==1)throw Error('城州容量规则版本无效');
 validateTerrainEconomy(d);
 for(const p of d.provinces){const c=p.cityCapacity;
  if(!c||c.version!==1||!Number.isSafeInteger(c.land)||c.land<1||c.land>p.area||!Number.isSafeInteger(c.population)||c.population<1||populationLimit(c.population)>MAX)throw Error('城州容量无效');
  const land=cityLand(p);if(land.used+land.reserved>land.total)throw Error('四业占地超过城州可开发土地');
  if(p.population.total>populationLimit(c.population))throw Error('人口超过城州超载上限');
 }
}
