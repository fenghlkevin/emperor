import {officialEffectSource} from './official-effects.mjs';
export const OFFICIAL_PRODUCTION_CAP=.1,OFFICIAL_COLLECTION_CAP=.1,OFFICIAL_LOSS_CAP=.05;
const rate=(source,cap)=>source.active?Math.max(-cap,Math.min(cap,(source.ability-50)/500)):0;
export function refreshOfficialProduction(d,turn){
 if(d.officialEffectsVersion!==1)return d;
 for(const p of d.provinces){if(p.resourceRulesVersion!==1||p.countryId!==d.playerCountryId){delete p.officialProduction;continue;}
  const governor=officialEffectSource(d,`${p.id}-governor`,{provinceId:p.id,role:'governor'}),revenue=officialEffectSource(d,'revenue-minister');
  p.officialProduction={version:1,turn,productionRate:rate(governor,OFFICIAL_PRODUCTION_CAP),collectionRate:rate(revenue,OFFICIAL_COLLECTION_CAP),lossRate:revenue.active?Math.min(OFFICIAL_LOSS_CAP,Math.max(0,50-revenue.integrity)/1000):0,sources:[governor,revenue]};
 }return d;
}
export function enableOfficialProduction(d,turn){if(d.resourceRulesVersion===1){d.officialEffectsVersion=1;refreshOfficialProduction(d,turn);}return d;}
export const officialProductionMultiplier=p=>1+(p.officialProduction?.productionRate??0);
export function officialCollection(p,base,ceiling=Number.MAX_SAFE_INTEGER){const effects=p.officialProduction,gross=Math.min(ceiling,Math.max(0,Math.floor(base*(1+(effects?.collectionRate??0))))),loss=Math.floor(gross*(effects?.lossRate??0));return {base,gross,loss,net:gross-loss};}
export function validateOfficialProductionSnapshot(r,provinceId,turn){
 const fail=()=>{throw Error('官员生产效果无效');};
 if(!r||r.version!==1||!Number.isSafeInteger(r.turn)||r.turn<1||r.turn>turn||!Array.isArray(r.sources)||r.sources.length!==2)fail();
 for(const [index,o] of r.sources.entries())if(!o||typeof o.name!=='string'||o.name.length>80||!(o.id===null||typeof o.id==='string')||typeof o.active!=='boolean'||o.active!==(o.id!==null)||o.office!==(index===0?`${provinceId}-governor`:'revenue-minister')||o.provinceId!==(index===0?provinceId:null)||o.role!==(index===0?'governor':'central')||!Number.isFinite(o.ability)||o.ability<0||o.ability>100||!Number.isFinite(o.integrity)||o.integrity<0||o.integrity>100)fail();
 const [g,c]=r.sources;if(r.productionRate!==rate(g,OFFICIAL_PRODUCTION_CAP)||r.collectionRate!==rate(c,OFFICIAL_COLLECTION_CAP)||r.lossRate!==(c.active?Math.min(OFFICIAL_LOSS_CAP,Math.max(0,50-c.integrity)/1000):0))fail();
}
export function validateOfficialProduction(d,turn){
 if(d.officialEffectsVersion===undefined){if(d.provinces.some(p=>p.officialProduction))throw Error('官员生产规则标记缺失');return;}
 if(d.officialEffectsVersion!==1||d.resourceRulesVersion!==1)throw Error('官员生产规则无效');
 for(const p of d.provinces){if(p.officialProduction)validateOfficialProductionSnapshot(p.officialProduction,p.id,turn);else if(p.countryId===d.playerCountryId)throw Error('官员生产效果缺失');}
}
