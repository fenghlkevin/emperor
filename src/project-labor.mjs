import {resourceShortage} from './action-feedback.mjs';
import {laborOrganization,validOfficeSource} from './central-office-effects.mjs';
import {workOfficerEffect,effectiveWorkMode} from './official-effects.mjs';
import {postTreasury} from './finance.mjs';
import {activeDisaster} from './disasters.mjs';
import {changeWelfare,welfareValue} from './building-effects.mjs';
import {findProject,projectTotal} from './project-work-orders.mjs';
// Trial staffing: existing militia are the shared construction workforce.
// No automatic withdrawal from farming; unstaffed work pauses instead.
import {SPECIAL_PROJECT_WORKERS} from './project-work-rules.mjs';
export {SPECIAL_PROJECT_WORKERS} from './project-work-rules.mjs';
export function baseProjectWorkers(kind,project){
 if(kind==='construction')return 100;
 if(kind==='expansion')return 250;
 if(kind==='development')return Math.max(20,Math.ceil(project.area/5));
 return SPECIAL_PROJECT_WORKERS[project.building];
}
export function projectWorkers(kind,project,d){const base=baseProjectWorkers(kind,project);return d?laborOrganization(d,kind,base).workers:base;}
function projects(d,p){
 const rows=[];
 for(const [kind,r]of [['construction',p.construction?.project],['development',p.development?.project],['expansion',p.cityCapacity?.expansion],['special',d.specialWorks?.project?.provinceId===p.id?d.specialWorks.project:null]])if(r)
  rows.push({kind,key:`${kind}:${r.startedTurn}:${r.building??r.id}`,startedTurn:r.startedTurn,workers:projectWorkers(kind,r,p.countryId===d.playerCountryId?d:null),laborEffect:p.countryId===d.playerCountryId?laborOrganization(d,kind,baseProjectWorkers(kind,r)):undefined});
 return rows.sort((a,b)=>a.startedTurn-b.startedTurn||a.kind.localeCompare(b.kind));
}
export function projectLaborOverview(d,p){
 const commitments=projects(d,p),reserved=commitments.reduce((n,r)=>n+r.workers,0),capacity=p.population.professions.militia;
 return {capacity,reserved,available:Math.max(0,capacity-reserved),shortage:Math.max(0,reserved-capacity),commitments};
}
export function requireProjectLabor(d,p,kind,project){
 if(p.resourceRulesVersion!==1)return;
 const needed=projectWorkers(kind,project,d),q=projectLaborOverview(d,p);
 if(q.available<needed)throw Error(resourceShortage('工程开工','本州可用民夫',needed,q.available,'人')+`在建工程占用${q.reserved}人；请先征调或等待完工。`);
 return needed;
}
export function beginProjectLabor(d,turn){
 for(const p of d.provinces){if(p.resourceRulesVersion!==1||p.projectLabor?.turn>=turn)continue;
  const capacity=p.population.professions.militia;let left=capacity;
  const allocations=projects(d,p).filter(r=>r.startedTurn<turn).map(r=>{const granted=Math.min(left,r.workers);left-=granted;return {...r,granted};});
  const home=d.countries.find(c=>c.id===p.countryId);let intensity=0,mitigation=0;
  for(const row of allocations){const r=findProject(d,p,row.kind),officer=workOfficerEffect(d,p,row.kind),wanted=r.workOrder?.untilTurn>=turn?effectiveWorkMode(d,p,r.workOrder.mode,row.kind):0;
   row.comfort=false;row.speed=row.granted>=row.workers?1:0;row.expense=0;row.mode=0;row.reason=row.speed?'常规施工':'民夫不足停工';
   const remaining=projectTotal(row.kind,r)-r.progress;
   if(r.ownerId&&r.ownerId!==p.countryId){row.speed=0;row.reason='失地停工';continue;}
   if(!row.speed||activeDisaster(p,turn)){row.speed=0;row.reason=activeDisaster(p,turn)?'受灾停工':'民夫不足停工';continue;}
   if(!wanted||remaining<=1+(officer?.bonus??0))continue;
   if(welfareValue(p,'loyalty')<40||p.foodRelief?.lastSettlement?.shortfall>0){row.reason='粮食或民心不足，恢复常规';continue;}
   row.reason='钱人不足，恢复常规';
   for(let mode=wanted;mode>0;mode--){const extra=Math.ceil(row.workers*mode/2),cost=Math.ceil(row.workers*(mode===2?.5:.2))+(r.workOrder.comfort?Math.ceil(row.workers*.1):0);
    if(extra>left||cost>home.fiscal.treasury)continue;
    left-=extra;row.granted+=extra;row.mode=mode;row.speed=Math.min(2,remaining,1+mode/2);row.expense=cost;row.reason=mode===wanted?'按批准投入施工':'钱人不足，自动降档';
    postTreasury(d,home.id,{turn,expense:cost,reason:`${p.name}额外施工投入`,key:`project-work:${turn}:${p.id}:${row.key}`});intensity+=mode;row.comfort=Boolean(r.workOrder.comfort);if(row.comfort)mitigation++;break;
   }
  }
  for(const row of allocations){const officer=workOfficerEffect(d,p,row.kind);if(!officer)continue;const remaining=projectTotal(row.kind,findProject(d,p,row.kind))-findProject(d,p,row.kind).progress,baseSpeed=Math.min(row.speed,remaining);row.speed=baseSpeed>0?Math.min(2,remaining,baseSpeed+officer.bonus):0;row.officerEffect={...officer,remaining,baseSpeed,applied:row.speed-baseSpeed};if(row.officerEffect.applied)row.reason+=row.kind==='development'?'；刺史组织效率增进':'；工部组织效率增进';}
  const previous=p.projectLaborPressure?.streak??0,streak=intensity?previous+1:Math.max(0,previous-1);
  const ratio=allocations.reduce((n,r)=>n+(r.speed>0?r.granted:0),0)/Math.max(1,Math.floor(p.population.total*.75));
  const ratioPressure=Math.max(0,Math.ceil((ratio-.1)*10));
  const loss=intensity?Math.min(10,Math.max(1,Math.ceil(intensity*.75)+Math.floor(streak/3)+ratioPressure-mitigation)):0;
  if(loss)changeWelfare(p,'loyalty',-loss);
  p.projectLaborPressure={turn,streak,loss};
  p.projectLabor={turn,capacity,allocations};
 }
}
export function projectIsStaffed(d,p,kind,project,turn){
 if(p.resourceRulesVersion!==1)return true;
 beginProjectLabor(d,turn);
 const key=`${kind}:${project.startedTurn}:${project.building??project.id}`;
 const row=p.projectLabor.allocations.find(r=>r.key===key);
 return Boolean(row&&row.speed!==0&&row.granted>=row.workers);
}
export function validateProjectLabor(d,turn=Infinity){
 const int=n=>Number.isSafeInteger(n)&&n>=0;
 for(const p of d.provinces){for(const row of projects(d,p)){const o=findProject(d,p,row.kind).workOrder;if(o&&(!int(o.mode)||o.mode>2||!int(o.untilTurn)||o.untilTurn<1||o.untilTurn>turn+3||(o.comfort!==undefined&&typeof o.comfort!=='boolean')))throw Error('施工投入授权无效');}
 const pressure=p.projectLaborPressure;if(pressure&&(!int(pressure.turn)||pressure.turn>turn||!int(pressure.streak)||!int(pressure.loss)||pressure.loss>10))throw Error('劳役压力记录无效');
 const w=p.projectLabor;if(w===undefined)continue;
  if(p.resourceRulesVersion!==1||!int(w.turn)||w.turn<1||w.turn>turn||!int(w.capacity)||!Array.isArray(w.allocations)||w.allocations.length>4)throw Error('工程劳力记录无效');
  let total=0;const keys=new Set();for(const r of w.allocations){if(!['construction','development','special','expansion'].includes(r.kind)||typeof r.key!=='string'||r.key.length>100||keys.has(r.key)||!int(r.startedTurn)||r.startedTurn<1||r.startedTurn>=w.turn||!int(r.workers)||r.workers<1||r.workers>1000||!int(r.granted)||r.granted>r.workers*2)throw Error('工程劳力记录无效');const live=projects(d,p).find(x=>x.key===r.key);if(r.laborEffect){const e=r.laborEffect,base=live?baseProjectWorkers(r.kind,findProject(d,p,r.kind)):e.baseWorkers;if(!validOfficeSource(e.source)||!int(e.baseWorkers)||e.baseWorkers<1||e.baseWorkers!==base||e.rate!==(r.kind==='development'?0:Math.floor(e.source.ability/10)/100)||e.workers!==Math.max(1,Math.ceil(e.baseWorkers*(1-e.rate)))||r.workers!==e.workers)throw Error('工程劳力官效无效');}else if(live&&baseProjectWorkers(r.kind,findProject(d,p,r.kind))!==r.workers)throw Error('工程劳力需求被篡改');if(r.speed!==undefined&&(![0,.5,1,1.5,2].includes(r.speed)||!int(r.expense)||!int(r.mode)||r.mode>2||(r.comfort!==undefined&&typeof r.comfort!=='boolean')||typeof r.reason!=='string'))throw Error('施工实绩无效');const officer=r.officerEffect;if(officer&&(![0,.5].includes(officer.bonus)||!Number.isSafeInteger(officer.ability)||officer.ability<0||officer.ability>100||typeof officer.name!=='string'||officer.name.length>80||!(officer.id===null||typeof officer.id==='string')||officer.bonus!==(officer.id!==null&&officer.ability>=75?.5:0)||(!Number.isFinite(officer.remaining)||officer.remaining<=0||officer.remaining>540||officer.remaining*2%1!==0)||![0,.5,1,1.5,2].includes(officer.baseSpeed)||officer.baseSpeed>officer.remaining||officer.applied!==r.speed-officer.baseSpeed||r.speed!==(officer.baseSpeed>0?Math.min(2,officer.remaining,officer.baseSpeed+officer.bonus):0)))throw Error('施工官效来源或限速无效');if(r.mode>0){const expected=Math.ceil(r.workers*(r.mode===2?.5:.2))+(r.comfort?Math.ceil(r.workers*.1):0);if(r.granted<Math.ceil(r.workers*(1+r.mode/2))||(officer?officer.baseSpeed:r.speed)>1+r.mode/2||r.expense!==expected)throw Error('赶工人数费用与速度不符');
 const account=d.countries.find(c=>c.id===p.countryId)?.ledger.find(x=>!x.legacy&&x.turn===w.turn),key=`project-work:${w.turn}:${p.id}:${r.key}`;
 if(account&&!account.keys.includes(key))throw Error('赶工支出没有实际过账');
 }else if(r.expense||r.speed>(officer?Math.min(2,1+officer.bonus):1))throw Error('未赶工却收取额外费用或超速');total+=r.granted;keys.add(r.key);}
  if(total>w.capacity)throw Error('工程劳力重复占用');
 }
}

export function projectSpeed(d,p,kind,project,turn){if(p.resourceRulesVersion!==1)return 1;beginProjectLabor(d,turn);return p.projectLabor.allocations.find(r=>r.key===`${kind}:${project.startedTurn}:${project.building??project.id}`)?.speed??0;}
