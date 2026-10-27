import {laborProfile} from './labor.mjs';
export const INDUSTRY_JOBS=Object.freeze({agriculture:'farmers',pastoral:'herders',commerce:'merchants',industry:'workers'});
export function effectiveIndustryArea(p,key,turn){
 const a=p.development?.activation;
 return Math.max(0,p.economy[key].developedArea+(a?.fromIndustry===key&&turn!==undefined&&turn<a.effectiveTurn?a.area:0)-(a?.industry===key&&turn!==undefined&&turn<a.effectiveTurn?a.area:0)-(key==='agriculture'&&p.civic?.localInvestment&&turn!==undefined&&turn<p.civic.localInvestment.effectiveTurn?p.civic.localInvestment.area:0));
}
// Keep starting jobs and starting output. These densities are saved once, never
// recalculated after drafting, development or reload.
export function initializeIndustryLabor(d){
 if(d.resourceRulesVersion!==1)return d;
 if(d.industryLaborVersion!==undefined){if(d.industryLaborVersion!==1||d.provinces.some(p=>!p.industryLabor))throw Error('产业用工记录不完整');return d;}
 if(d.provinces.some(p=>p.industryLabor!==undefined))throw Error('产业用工记录不完整');
 for(const p of d.provinces)p.industryLabor={version:1,base:Object.fromEntries(Object.entries(INDUSTRY_JOBS).map(([key,job])=>{const area=Math.max(1,p.economy[key].developedArea);return [key,{area,workers:Math.max(1,p.population.professions[job]||Math.ceil(area/.2))}];})),pending:[]};
 d.industryLaborVersion=1;return d;
}
export function industryStaffing(p,key,turn){
 const job=INDUSTRY_JOBS[key],workers=p.population.professions[job],area=effectiveIndustryArea(p,key,turn),base=p.industryLabor?.base[key];
 if(!base)return {workers,required:workers,vacant:0,ratio:workers?1:0,area};
 const required=Math.ceil(area*base.workers/base.area);
 return {workers,required,vacant:Math.max(0,required-workers),ratio:required?Math.min(1,workers/required):0,area};
}
export function fillIndustry(p,key,turn){
 if(!p.industryLabor)return 0;
 if(p.localPolicy?.locks?.includes(INDUSTRY_JOBS[key]))return 0;
 const q=industryStaffing(p,key,turn),n=Math.min(q.vacant,laborProfile(p).available);
 p.population.professions[INDUSTRY_JOBS[key]]+=n;return n;
}
export function reassignDevelopedLand(p,key,fromKey,turn){
 if(!p.industryLabor)return {hired:0,released:0};
 let released=0;
 if(fromKey){const q=industryStaffing(p,fromKey,turn);released=Math.max(0,q.workers-q.required);p.population.professions[INDUSTRY_JOBS[fromKey]]-=released;}
 return {released,hired:fillIndustry(p,key,turn)};
}
export function scheduleIndustryHiring(p,key,effectiveTurn,fromKey){
 if(p.industryLabor)p.industryLabor.pending.push({industry:key,effectiveTurn,...(fromKey?{fromIndustry:fromKey}:{})});
}
export function settleIndustryHiring(d,turn){
 initializeIndustryLabor(d);
 for(const p of d.provinces){if(!p.industryLabor)continue;for(const task of p.industryLabor.pending.filter(x=>x.effectiveTurn<=turn))reassignDevelopedLand(p,task.industry,task.fromIndustry,turn);p.industryLabor.pending=p.industryLabor.pending.filter(x=>x.effectiveTurn>turn);}
}
export function validateIndustryLabor(d,turn=Infinity){
 if(d.industryLaborVersion===undefined){if(d.provinces.some(p=>p.industryLabor!==undefined))throw Error('产业用工记录不完整');return;}
 if(d.industryLaborVersion!==1)throw Error('产业用工版本无效');
 for(const p of d.provinces){const s=p.industryLabor;
  if(!s||s.version!==1||!s.base||Object.keys(s.base).length!==4||!Array.isArray(s.pending)||s.pending.length>3)throw Error('产业用工记录无效');
  for(const key of Object.keys(INDUSTRY_JOBS)){const b=s.base[key];if(!b||!['area','workers'].every(k=>Number.isSafeInteger(b[k])&&b[k]>0&&b[k]<=1e12))throw Error('产业用工基准无效');}
  for(const t of s.pending)if(!Object.hasOwn(INDUSTRY_JOBS,t.industry)||t.fromIndustry!==undefined&&(!Object.hasOwn(INDUSTRY_JOBS,t.fromIndustry)||t.fromIndustry===t.industry)||!Number.isSafeInteger(t.effectiveTurn)||t.effectiveTurn<1||t.effectiveTurn>turn+1)throw Error('产业招工时点无效');
 }
}
