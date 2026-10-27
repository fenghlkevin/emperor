import {officeAbility} from './office-ability.mjs';
import {gainOfficialExperience} from './official-growth.mjs';
const clamp=(value,fallback=50)=>Math.max(0,Math.min(100,Number.isFinite(value)?value:fallback));
export function servingEffectOfficial(d,office,provinceId){
 if(provinceId&&!d.provinces.some(p=>p.id===provinceId&&p.countryId===d.playerCountryId))return null;
 return d.justice?.officials.find(o=>o.status==='serving'&&(o.positionId===undefined?o.id:o.positionId)===office&&(provinceId?o.provinceId===provinceId:!o.provinceId))??null;
}
// The same source identity and bounded attributes feed rules and explanations.
// Current bonuses share the canonical office-based civil/military ability. Historical snapshots retain their recorded ability.
export function officialEffectSource(d,office,{provinceId,role='central',fallbackAbility=50,fallbackName='署理'}={}){
 const o=servingEffectOfficial(d,office,provinceId),integrity=clamp(o?.integrity);
 const ability=o?officeAbility(o,office,role):fallbackAbility;
 return {id:o?.id??null,name:o?.name??fallbackName,office,provinceId:provinceId??null,role,ability:clamp(ability),integrity,efficiency:.7+clamp(ability)/100,lossRate:(100-integrity)/500,active:Boolean(o)};
}
export function workOfficerEffect(d,p,kind){
 if(d.officialEffectsVersion!==1||p.countryId!==d.playerCountryId)return null;
 const source=kind==='development'?officialEffectSource(d,`${p.id}-governor`,{provinceId:p.id,role:'governor',fallbackAbility:0,fallbackName:'刺史空缺'}):officialEffectSource(d,'works-minister');
 return {id:source.id,name:source.name,ability:source.ability,bonus:source.active&&source.ability>=75?.5:0};
}
export function effectiveWorkMode(d,p,mode,kind){return workOfficerEffect(d,p,kind)?.bonus&&mode===2?1:mode;}

// Award the governor serving when the local task actually succeeds.
export function rewardGovernorExperience(d,p){
 const o=servingEffectOfficial(d,`${p.id}-governor`,p.id);
 if(!o)return;
 gainOfficialExperience(o);
}
