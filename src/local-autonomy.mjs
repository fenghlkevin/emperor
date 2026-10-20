import {servingEffectOfficial} from './official-effects.mjs';
export const LOCAL_PRIORITIES=['food','economy','security'];
export const LOCAL_JOBS=['farmers','herders','merchants','workers'];
export function localOfficer(d,p,kind){return servingEffectOfficial(d,`${p.id}-${kind}`,p.id);}
export function localPolicy(p){return p.localPolicy??{version:1,civil:true,military:true,budget:500,priority:'food',locks:[]};}
export function localAuthority(d,p){const policy=localPolicy(p),delegated=p.resourceRulesVersion!==1||d.personnel.delegations.includes(p.id);return {civil:delegated&&policy.civil&&Boolean(localOfficer(d,p,'governor')),military:delegated&&policy.military&&Boolean(localOfficer(d,p,'general'))};}
export function onLocalAppointment(d,p,kind){if(p.resourceRulesVersion!==1)return;p.localPolicy??={version:1,civil:false,military:false,budget:500,priority:'food',locks:[]};p.localPolicy[kind==='governor'?'civil':'military']=true;if(!d.personnel.delegations.includes(p.id))d.personnel.delegations.push(p.id);}
export function updateLocalPolicy(d,c){
 const p=d.provinces.find(p=>p.id===c.provinceId&&p.countryId===d.playerCountryId);if(!p||p.resourceRulesVersion!==1)throw Error('请选择新制本国州郡');
 if(typeof c.civil!=='boolean'||typeof c.military!=='boolean'||!Number.isSafeInteger(c.budget)||c.budget<0||c.budget>1000000||!LOCAL_PRIORITIES.includes(c.priority)||!Array.isArray(c.locks)||new Set(c.locks).size!==c.locks.length||c.locks.some(k=>!LOCAL_JOBS.includes(k)))throw Error('地方授权、预算、优先级或锁定设置无效');
 p.localPolicy={version:1,civil:c.civil,military:c.military,budget:c.budget,priority:c.priority,locks:[...c.locks],...(p.localPolicy?.lastLaborTurn?{lastLaborTurn:p.localPolicy.lastLaborTurn}:{})};
 d.personnel.delegations=d.personnel.delegations.filter(id=>id!==p.id);if(c.civil||c.military)d.personnel.delegations.push(p.id);
 return `${p.name}授权已更新：文政${c.civil?'委任州牧':'皇帝亲理'}、军务${c.military?'委任将军':'皇帝亲理'}，每旬上限${c.budget}两；生产保粮先于偏好，锁定岗位不自动修改。`;
}
export function validateLocalPolicies(d,turn=Infinity){for(const p of d.provinces){const c=p.localPolicy;if(c===undefined)continue;if(p.resourceRulesVersion!==1||c.version!==1||(c.lastLaborTurn!==undefined&&(!Number.isSafeInteger(c.lastLaborTurn)||c.lastLaborTurn<1||c.lastLaborTurn>turn))||typeof c.civil!=='boolean'||typeof c.military!=='boolean'||!Number.isSafeInteger(c.budget)||c.budget<0||c.budget>1000000||!LOCAL_PRIORITIES.includes(c.priority)||!Array.isArray(c.locks)||new Set(c.locks).size!==c.locks.length||c.locks.some(k=>!LOCAL_JOBS.includes(k)))throw Error('地方授权存档无效');}}

// Called only while creating a new dynasty, never while loading an existing save.
export function initializeNewLocalAutonomy(d){
 for(const p of d.provinces.filter(p=>p.resourceRulesVersion===1&&p.countryId===d.playerCountryId)){
  if(p.localPolicy)continue;
  const civil=Boolean(localOfficer(d,p,'governor')),military=Boolean(localOfficer(d,p,'general'));
  p.localPolicy={version:1,civil,military,budget:500,priority:'food',locks:[]};
  if((civil||military)&&!d.personnel.delegations.includes(p.id))d.personnel.delegations.push(p.id);
 }
 return d;
}
