// Game balance estimates for broad regions, not historical land surveys.
export const TERRAIN_SECTORS=['agriculture','pastoral','commerce','industry'];
export const TERRAIN_RULES=Object.freeze({
 '平原型':{land:.60,opening:1,shares:[.70,.35,.35,.35],bonus:{agriculture:.10}},
 '河海型':{land:.50,opening:.95,shares:[.55,.25,.60,.40],bonus:{commerce:.15}},
 '丘陵型':{land:.35,opening:.80,shares:[.40,.60,.35,.50],bonus:{pastoral:.15}},
 '高山型':{land:.20,opening:.65,shares:[.20,.50,.35,.65],bonus:{industry:.20}}
});
export function economicTerrain(p){return p.terrain;}
export function terrainRule(p){
 const rule=TERRAIN_RULES[p.terrain];if(!rule)throw Error('经济地形无效');return rule;
}
export function terrainMultiplier(p,key){return p.terrainCapacity?1+(terrainRule(p).bonus[key]??0):1;}
export function terrainLandLimit(p){return p.terrainCapacity?.landLimit??p.area;}
export function industryLandLimit(p,key){
 if(!p.terrainCapacity)return p.cityCapacity.land;
 return Math.max(p.terrainCapacity.legacySectors[key],Math.floor(p.cityCapacity.land*terrainRule(p).shares[TERRAIN_SECTORS.indexOf(key)]));
}
export function industryLandAvailable(p,key){
 const project=p.development?.project,reserved=project?.industry===key?project.area:0;
 return Math.max(0,industryLandLimit(p,key)-p.economy[key].developedArea-reserved);
}
export function initializeTerrainEconomy(d,{fresh=false}={}){
 if(d.terrainEconomyVersion!==undefined){if(d.terrainEconomyVersion!==1||d.provinces.some(p=>!p.terrainCapacity))throw Error('地形经济记录不完整');return;}
 if(d.provinces.some(p=>p.terrainCapacity!==undefined))throw Error('地形经济记录不完整');
 for(const p of d.provinces){
  const rule=terrainRule(p),legacyLand=fresh?0:p.cityCapacity.land;
  const landLimit=Math.min(p.area,Math.max(1,Math.floor(p.area*rule.land),legacyLand));
  if(fresh){
   p.cityCapacity.land=Math.max(1,Math.min(landLimit,Math.floor(p.cityCapacity.land*rule.opening)));
   for(const [i,k]of TERRAIN_SECTORS.entries())p.economy[k].developedArea=Math.min(p.economy[k].developedArea,Math.floor(p.cityCapacity.land*rule.shares[i]));
   const used=TERRAIN_SECTORS.reduce((n,k)=>n+p.economy[k].developedArea,0);
   if(used>p.cityCapacity.land)for(const k of TERRAIN_SECTORS)p.economy[k].developedArea=Math.floor(p.economy[k].developedArea*p.cityCapacity.land/used);
  }
  p.terrainCapacity={version:1,kind:economicTerrain(p),landLimit,legacyLand,legacySectors:Object.fromEntries(TERRAIN_SECTORS.map(k=>[k,fresh?0:p.economy[k].developedArea+(p.development?.project?.industry===k?p.development.project.area:0)]))};
 }
 d.terrainEconomyVersion=1;
}
export function validateTerrainEconomy(d){
 if(d.terrainEconomyVersion!==1)throw Error('地形经济版本无效');
 const integer=n=>Number.isSafeInteger(n)&&n>=0;
 for(const p of d.provinces){
  const t=p.terrainCapacity,r=terrainRule(p);
  if(!t||t.version!==1||t.kind!==economicTerrain(p)||!integer(t.legacyLand)||t.legacyLand>p.area||!integer(t.landLimit)||t.landLimit!==Math.min(p.area,Math.max(1,Math.floor(p.area*r.land),t.legacyLand))||p.cityCapacity.land>t.landLimit||!t.legacySectors||Object.keys(t.legacySectors).length!==4)throw Error('地形土地容量上限无效');
  for(const k of TERRAIN_SECTORS){if(!integer(t.legacySectors[k])||t.legacySectors[k]>t.legacyLand||p.economy[k].developedArea+(p.development?.project?.industry===k?p.development.project.area:0)>industryLandLimit(p,k))throw Error('产业用地超过地形上限');}
 }
}
