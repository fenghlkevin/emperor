import {spyBusy} from './espionage.mjs';
import {officialEffectSource} from './official-effects.mjs';
import {centralOfficeSource} from './central-office-effects.mjs';
import {GROWTH_KEYS,STUDY_KEYS,GROWTH_LABELS,ensureOfficialGrowth,abilityCap,gainOfficialAbility,gainOfficialExperience} from './official-growth.mjs';
import {postTreasury} from './finance.mjs';
export const HANLIN_FEE=20,HANLIN_ABILITY_CAP=80,HANLIN_EXPERIENCE_STEP=600;
const waiting=p=>p?.status==='serving'&&(p.positionId===null||p.positionId===undefined&&p.office==='待命')&&!p.provinceId;
export function hanlinEffect(d){const minister=officialEffectSource(d,'personnel-minister'),deputy=centralOfficeSource(d,'personnel-deputy');return {minister,deputy,capacity:minister.active?1+Math.floor(minister.ability/40):0,rate:100+Math.floor(deputy.ability/4)};}
export function initializeHanlin(d){d.personnel.hanlin??={version:1,lastTurn:0,students:[],history:[]};return d.personnel.hanlin;}
export function hanlinAttributeStep(p,key){return (p[key]??0)>=70?3600:1800;}
export function hanlinEligible(d){return d.justice.officials.filter(p=>waiting(p)&&!spyBusy(d,p.id));}
const log=(h,turn,message)=>{h.history.unshift({turn,message});h.history=h.history.slice(0,100);};
export function cancelInvalidStudies(d,turn){const h=d.personnel.hanlin;if(!h)return;h.students=h.students.filter(r=>{const p=d.justice.officials.find(p=>p.id===r.officialId);if(waiting(p))return true;log(h,turn,`${p?.name??'离院人员'}已任职或离开待命名册，停止研习，不再扣费`);return false;});}
export function configureHanlin(d,c,turn){const h=initializeHanlin(d),p=d.justice.officials.find(p=>p.id===c.officialId),row=h.students.find(r=>r.officialId===c.officialId);
 if(c.kind==='hanlin-stop'){if(!row)throw Error('该人员未在翰林院研习');h.students=h.students.filter(r=>r!==row);log(h,turn,`${p?.name??'该人员'}停止研习，保留已积累进度`);return '已停止研习，后续不再扣费';}
 if(c.kind!=='hanlin-enroll'||!STUDY_KEYS.includes(c.attribute)||(!waiting(p)||spyBusy(d,p.id)))throw Error('请选择没有官职的待命官员及有效研习科目');
 const effect=hanlinEffect(d);if(!effect.capacity)throw Error('吏部尚书空缺，翰林院暂停招生');
 cancelInvalidStudies(d,turn);if(!row&&h.students.length>=effect.capacity)throw Error(`翰林院当前最多${effect.capacity}人，请先安排出院`);
 if(row?.attribute===c.attribute)throw Error('该人员已在研习此科目');
 ensureOfficialGrowth(p);if((p[c.attribute]??0)>=Math.min(HANLIN_ABILITY_CAP,abilityCap(p,c.attribute))&&(p.experience??0)>=100)throw Error('该科目及经验均已达到培养上限');
 if(row)row.attribute=c.attribute;else h.students.push({officialId:p.id,attribute:c.attribute,admittedTurn:turn});
 log(h,turn,`${p.name}入翰林院研习${GROWTH_LABELS[c.attribute]}，每个实际研习旬支银${HANLIN_FEE}两`);
 return `${p.name}研习${GROWTH_LABELS[c.attribute]}已安排，下旬开始；每个实际研习旬${HANLIN_FEE}两，个人上限${abilityCap(p,c.attribute)}、院内上限${HANLIN_ABILITY_CAP}，已满科目只积累经验`;
}
export function settleHanlin(d,turn){const h=d.personnel.hanlin;if(!h||h.lastTurn>=turn)return;h.lastTurn=turn;cancelInvalidStudies(d,turn);const effect=hanlinEffect(d),home=d.countries.find(c=>c.id===d.playerCountryId);
 for(const [i,row]of h.students.entries()){
  if(row.admittedTurn>=turn)continue;
  const p=d.justice.officials.find(p=>p.id===row.officialId);ensureOfficialGrowth(p);
  if(i>=effect.capacity){log(h,turn,`${p.name}暂停：吏部尚书空缺或研习名额不足，未扣费`);continue;}
  const canAbility=(p[row.attribute]??0)<Math.min(HANLIN_ABILITY_CAP,abilityCap(p,row.attribute)),canExperience=(p.experience??0)<100;
  if(!canAbility&&!canExperience){log(h,turn,`${p.name}经验及本科目均已达到上限，停止计费`);continue;}
  if(home.fiscal.treasury-HANLIN_FEE<(d.governance?.reserve??0)){log(h,turn,`${p.name}暂停：国库保留线不足，未扣费`);continue;}
  const progress=p.studyProgress??={experience:0,abilities:Object.fromEntries(GROWTH_KEYS.map(k=>[k,0])),lastTurn:0};if(progress.lastTurn>=turn)continue;
  postTreasury(d,home.id,{turn,expense:HANLIN_FEE,reason:`翰林院${p.name}研习${GROWTH_LABELS[row.attribute]}`,key:`hanlin:${turn}:${p.id}`});progress.lastTurn=turn;
  let experience=0,ability=0;if(canExperience){progress.experience+=effect.rate;if(progress.experience>=HANLIN_EXPERIENCE_STEP){progress.experience-=HANLIN_EXPERIENCE_STEP;experience=gainOfficialExperience(p);}}
  if(canAbility){const step=hanlinAttributeStep(p,row.attribute);progress.abilities[row.attribute]+=effect.rate;if(progress.abilities[row.attribute]>=step){progress.abilities[row.attribute]-=step;ability=gainOfficialAbility(p,row.attribute,1,HANLIN_ABILITY_CAP);}}
  log(h,turn,`${p.name}研习${GROWTH_LABELS[row.attribute]}，支银${HANLIN_FEE}两；经验＋${experience}、${GROWTH_LABELS[row.attribute]}＋${ability}；进度＋${effect.rate}（吏部侍郎${effect.deputy.name}加成${effect.rate-100}%）`);
 }
}
export function validateHanlin(d,turn=Infinity){const h=d.personnel.hanlin;if(h===undefined)return;const int=n=>Number.isSafeInteger(n)&&n>=0;
 if(h.version!==1||!int(h.lastTurn)||h.lastTurn>turn||!Array.isArray(h.students)||h.students.length>3||new Set(h.students.map(r=>r.officialId)).size!==h.students.length||!Array.isArray(h.history)||h.history.length>100)throw Error('翰林院记录无效');
 for(const r of h.students)if(!d.justice.officials.some(p=>p.id===r.officialId)||!STUDY_KEYS.includes(r.attribute)||!int(r.admittedTurn)||r.admittedTurn<1||r.admittedTurn>turn)throw Error('翰林院人员或科目无效');
 for(const r of h.history)if(!int(r.turn)||r.turn<1||r.turn>turn||typeof r.message!=='string'||r.message.length>300)throw Error('翰林院履历无效');
 for(const p of d.justice.officials)if(p.studyProgress?.lastTurn>turn)throw Error('研习进度旬序无效');
}
