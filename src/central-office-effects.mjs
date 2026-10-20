import {officeAbility} from './office-ability.mjs';
import {officialEffectSource,servingEffectOfficial} from './official-effects.mjs';
const bounded=n=>Math.max(0,Math.min(100,Number.isFinite(n)?n:0));
export function centralOfficeSource(d,office){
 const o=d.officialEffectsVersion===1?servingEffectOfficial(d,office):null;
 return {id:o?.id??null,name:o?.name??'空缺',ability:o?officeAbility(o,office):0,integrity:o?bounded(o.integrity):100};
}
export function selectionEffect(d){const source=centralOfficeSource(d,'personnel-minister');return {source,extra:Math.min(2,Math.floor(source.ability/40)),historicalBonus:source.ability*.0015,highChance:(5+source.ability*.25)/1000};}
// Passive treaty preparation; intentionally absent from player-facing bonus descriptions.
export function diplomaticPreparation(d){const source=centralOfficeSource(d,'rites-deputy');return Math.floor(source.ability/10);}
export function procurementEffect(d){const source=centralOfficeSource(d,'revenue-deputy');return {source,discountRate:source.ability*.0008,lossRate:source.id?Math.max(0,50-source.integrity)/1000:0};}
export function purchaseCost(amount,price,effect){const baseCost=amount*price,discount=Math.floor(baseCost*effect.discountRate),loss=Math.ceil(baseCost*effect.lossRate);return {baseCost,discount,loss,cost:baseCost-discount+loss};}
export function laborOrganization(d,kind,baseWorkers){const source=centralOfficeSource(d,'works-deputy'),rate=kind==='development'?0:Math.floor(source.ability/10)/100;return {source,baseWorkers,rate,workers:Math.max(1,Math.ceil(baseWorkers*(1-rate))) };}
export function militaryOrganization(d){const source=centralOfficeSource(d,'war-minister');return {source,discountRate:source.ability*.0008,lossRate:source.id?Math.max(0,50-source.integrity)/1000:0};}
export function recruitOrganization(d){const source=centralOfficeSource(d,'war-deputy');return {source,bonus:Math.floor(source.ability/10)};}
export function organizedRecruitTraining(d,p,base){return Math.min(40,base+(p.countryId===d.playerCountryId?recruitOrganization(d).bonus:0));}
export function coordinationEffect(d){const source=centralOfficeSource(d,'prime-minister');return {source,limit:source.id?1+Math.floor(source.ability/40):0,rate:source.id ? .1+source.ability*.002 : 0};}
export function validOfficeSource(s){return Boolean(s&&((s.id===null)||(typeof s.id==='string'&&s.id.length>0))&&typeof s.name==='string'&&s.name.length<=80&&Number.isInteger(s.ability)&&s.ability>=0&&s.ability<=100&&Number.isFinite(s.integrity)&&s.integrity>=0&&s.integrity<=100&&(s.id!==null||(s.ability===0&&s.integrity===100)));}
export function validatePurchaseEffect(effect,amount,price,cost,kind='procurement'){
 if(!effect||!validOfficeSource(effect.source))throw Error('官员费用快照无效');
 const expected=effect.source.ability*.0008,loss=effect.source.id?Math.max(0,50-effect.source.integrity)/1000:0;
 const q=purchaseCost(amount,price,effect);
 if(effect.discountRate!==expected||effect.lossRate!==loss||q.cost!==cost)throw Error(`${kind}费用或官效无效`);
}
export function officeEffectDescription(d,office){
 const pct=n=>`${Math.round(n*1000)/10}%`;
 if(office==='personnel-minister'){const e=selectionEffect(d);return `制举额外${e.extra}名候选；名士概率增加${Math.round(e.historicalBonus*1000)/10}个百分点，高能力新秀选拔概率${pct(e.highChance)}；另主持翰林院研习，最多${1+Math.floor(officialEffectSource(d,office).ability/40)}人（空缺暂停）。`;}
 if(office==='revenue-deputy'){const e=procurementEffect(d);return `购粮优惠${pct(e.discountRate)}，采买损耗${pct(e.lossRate)}；预览和实付按整两核算。`;}
 if(office==='works-deputy'){const e=laborOrganization(d,'construction',100);return `普通及特殊建设基础民夫需求减少${pct(e.rate)}，普通工程100→${e.workers}人；土地开垦不享受此减免。`;}
 if(office==='war-minister'){const e=militaryOrganization(d);return `驻军军需及出征整备银优惠${pct(e.discountRate)}，军需损耗${pct(e.lossRate)}；口粮、军饷与装备采购数量不变。`;}
 if(office==='war-deputy'){const e=recruitOrganization(d);return `新兵初始训练额外＋${e.bonus}，最终不超过40；按新旧兵人数加权，不直接提高全军训练。`;}
 if(office==='prime-minister'){const e=coordinationEffect(d);return `每旬最多协调${e.limit}项缺粮或必要工程，最多调剂全国治理预算${pct(e.rate)}；从其他州预计闲置额度调入，遵守授权、国库保留线和重大工程审批。`;}
 if(office==='personnel-deputy'){const e=centralOfficeSource(d,office);return `翰林院经验与能力研习进度加成${Math.floor(e.ability/4)}%，不突破院内培养上限与个人潜力上限。`;}
 if(office==='rites-deputy')return '协助礼部办理通邦事务。';
 const e=officialEffectSource(d,office);
 return ({'revenue-minister':`征收效率调整${Math.round((e.active?(e.ability-50)/500:0)*100)}%，清廉影响征收损耗。`,'works-minister':`普通及特殊建设组织工效＋${e.active&&e.ability>=75?.5:0}，最终上限2倍；特殊工程费用随文职岗位能力与清廉核定。`,'central-general':'武职岗位能力影响中央军手动和长期训练效果。','rites-minister':'文职岗位能力影响外交谈判评议分数。','justice-minister':'文职岗位能力影响调查发现低忠诚官员的范围。'})[office]??'地方任职效果随本州治理与军务结算。';
}

export function assignmentEffectComparison(d,office,person){
 if(!person||office.endsWith('-governor')||office.endsWith('-general')&&office!=='central-general')return null;
 const copy={...d,justice:{...d.justice,officials:d.justice.officials.map(o=>o.id===person.id?{...o,positionId:office,provinceId:null,status:'serving'}:(o.positionId??o.id)===office?{...o,positionId:null}:o)}};
 return {before:officeEffectDescription(d,office),after:officeEffectDescription(copy,office)};
}
