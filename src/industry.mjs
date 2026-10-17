import {INDUSTRIES,outputFor,industryTax,unallocatedPopulation} from './economy.mjs';
import {activeDisaster} from './disasters.mjs';
import {postTreasury} from './finance.mjs';

export const DEVELOPMENT_COST=2,DEVELOPMENT_MAX_AREA=500,DEVELOPMENT_TURNS=1;
const jobs=INDUSTRIES.map(([, ,job])=>job);
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const invalid=()=>{throw Error('产业开发或职业调配存档无效');};
const blank=turn=>({lastTurn:turn,project:null,activation:null,lastAllocationTurn:null});
export function initializeIndustry(d,turn=1){
  if(d.industryActions!==undefined)return d;
  // Missing global data is a legacy save only if no province holds active new-format work.
  if(d.provinces.some(p=>p.development&&(p.development.project||p.development.activation||p.development.lastAllocationTurn!==null)))invalid();
  d.industryActions={version:1,nextId:1,history:[]};
  for(const p of d.provinces)p.development=blank(turn);
  return d;
}
function owned(state,id){
  const d=state.domestic,p=d.provinces.find(p=>p.id===id&&p.countryId===d.playerCountryId);
  if(!p)throw Error('只能操作本国州郡');
  return p;
}
export function industryOverview(p,turn){
  const project=p.development.project,activation=p.development.activation;
  return {unallocated:unallocatedPopulation(p),project,activation,
    disaster:activeDisaster(p,turn),industries:INDUSTRIES.map(([key,name,job,unit])=>({key,name,job,unit,
      workers:p.population.professions[job],area:p.economy[key].developedArea,capacity:p.economy[key].capacityArea,
      remaining:p.economy[key].capacityArea-p.economy[key].developedArea,
      output:outputFor(p,key),perWorker:p.population.professions[job]?p.economy[key].developedArea/p.population.professions[job]:null}))};
}
export function quoteIndustry(state,c){
  const p=owned(state,c.provinceId),d=state.domestic,home=d.countries.find(c=>c.id===d.playerCountryId);
  let cost=0,preview=structuredClone(p),title;
  if(c.kind==='develop'){
    if(!INDUSTRIES.some(([key])=>key===c.industry))throw Error('请选择有效产业');
    if(!Number.isSafeInteger(c.area)||c.area<1||c.area>DEVELOPMENT_MAX_AREA)throw Error('开发面积须为1至500亩的整数');
    if(activeDisaster(p,state.turn))throw Error('该州受灾，不能新开工；已有开发将在灾退后复工');
    if(p.development.project)throw Error('该州已有产业开发项目');
    if(c.area>p.economy[c.industry].capacityArea-p.economy[c.industry].developedArea)throw Error('开发面积超过剩余容量');
    cost=c.area*DEVELOPMENT_COST;preview.economy[c.industry].developedArea+=c.area;
    title=`${p.name}${INDUSTRIES.find(([key])=>key===c.industry)[1]}开发`;
  }else if(c.kind==='allocate'){
    if(p.development.lastAllocationTurn===state.turn)throw Error('该州本旬已完成职业调配，请待下一旬');
    if(!c.targets||typeof c.targets!=='object'||Array.isArray(c.targets)||Object.keys(c.targets).length!==jobs.length||
      Object.keys(c.targets).some(k=>!jobs.includes(k))||jobs.some(k=>!integer(c.targets[k])))throw Error('请一次填写四业的非负整数目标人数，不可修改士兵或民伕');
    const allowed=p.population.total-p.population.professions.soldiers-p.population.professions.militia;
    const assigned=jobs.reduce((n,k)=>n+c.targets[k],0);
    if(!Number.isSafeInteger(assigned)||assigned>allowed)throw Error('目标职业人数超过本州可分配人口');
    if(jobs.every(k=>c.targets[k]===p.population.professions[k]))throw Error('职业人数未改变，无需提交');
    for(const key of jobs)preview.population.professions[key]=c.targets[key];
    title=`${p.name}职业人口调配`;
  }else throw Error('产业政令无效');
  const outputs=INDUSTRIES.map(([key,name,job,unit])=>({key,name,unit,workersBefore:p.population.professions[job],workersAfter:preview.population.professions[job],
    before:outputFor(p,key),after:outputFor(preview,key)}));
  return {title,cost,canAfford:home.fiscal.treasury>=cost,treasuryAfter:home.fiscal.treasury-cost,
    taxBefore:industryTax(p),taxAfter:industryTax(preview),unallocatedBefore:unallocatedPopulation(p),unallocatedAfter:unallocatedPopulation(preview),outputs,
    earliestCompleteTurn:c.kind==='develop'?state.turn+DEVELOPMENT_TURNS:null,
    earliestEffectiveTurn:c.kind==='develop'?state.turn+DEVELOPMENT_TURNS+1:state.turn+1};
}
function record(d,item){d.industryActions.history.unshift(item);d.industryActions.history=d.industryActions.history.slice(0,100);}
export function executeIndustry(state,c){
  const next=structuredClone(state),d=initializeIndustry(next.domestic,state.turn),a=d.industryActions;
  if(!Number.isSafeInteger(c.id)||c.id<1||c.id!==a.nextId)throw Error('产业政令已执行或状态已更新，请重新拟令');
  const q=quoteIndustry(next,c);if(!q.canAfford)throw Error('国库不足');
  const p=owned(next,c.provinceId);
  postTreasury(d,d.playerCountryId,{turn:state.turn,expense:q.cost,reason:q.title,key:`industry:${c.id}`});
  if(c.kind==='develop'){
    p.development.project={id:c.id,industry:c.industry,area:c.area,cost:q.cost,progress:0,startedTurn:state.turn,ownerId:d.playerCountryId};
    p.development.lastTurn=state.turn;
  }else{
    for(const key of jobs)p.population.professions[key]=c.targets[key];
    p.development.lastAllocationTurn=state.turn;
  }
  a.nextId++;
  const message=c.kind==='develop'?`${q.title}已开工，预付${q.cost}两；需1个正常施工旬，完工后下一旬增加产出。`:
    `${q.title}已登记，不另收银两；未分配人口${q.unallocatedAfter}人，下次旬结算按新职业生产。`;
  const receipt={id:c.id,turn:state.turn,kind:c.kind,provinceId:p.id,cost:q.cost,message};
  record(d,receipt);next.stats.treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;
  validateIndustry(d);return {state:next,receipt,message};
}
export function settleIndustry(d,turn){
  initializeIndustry(d,turn);
  for(const p of d.provinces){
    const a=p.development;if(a.lastTurn>=turn)continue;a.lastTurn=turn;
    if(a.activation&&a.activation.effectiveTurn<=turn)a.activation=null;
    const project=a.project;if(!project||project.startedTurn>=turn||activeDisaster(p,turn))continue;
    project.progress++;
    if(project.progress<DEVELOPMENT_TURNS)continue;
    p.economy[project.industry].developedArea+=project.area;
    a.activation={industry:project.industry,area:project.area,completedTurn:turn,effectiveTurn:turn+1};
    a.project=null;
    record(d,{id:project.id,turn,kind:'complete',provinceId:p.id,cost:0,message:`${p.name}${INDUSTRIES.find(([key])=>key===project.industry)[1]}开发${project.area}亩已完工，第${turn+1}旬起增加产出。`});
  }
}
export function validateIndustry(d,currentTurn=Infinity){
  const a=d.industryActions;
  if(!a||a.version!==1||!integer(a.nextId)||a.nextId<1||!Array.isArray(a.history)||a.history.length>100)invalid();
  const records=new Set();let previous=Infinity;
  for(const r of a.history){
    if(!r||!integer(r.id)||r.id<1||r.id>=a.nextId||!integer(r.turn)||r.turn<1||r.turn>currentTurn||r.turn>previous||
      !['develop','allocate','complete'].includes(r.kind)||!d.provinces.some(p=>p.id===r.provinceId)||!integer(r.cost)||
      (r.kind==='develop'?(r.cost<2||r.cost>1000||r.cost%2!==0):r.cost!==0)||typeof r.message!=='string'||r.message.length>250||records.has(`${r.kind}:${r.id}`))invalid();
    records.add(`${r.kind}:${r.id}`);previous=r.turn;
  }
  for(const p of d.provinces){
    const s=p.development;
    if(!s||!integer(s.lastTurn)||s.lastTurn<1||s.lastTurn>currentTurn||!(s.lastAllocationTurn===null||integer(s.lastAllocationTurn)&&s.lastAllocationTurn>=1&&s.lastAllocationTurn<=currentTurn))invalid();
    const r=s.project;
    if(r!==null){
      if(!r||!integer(r.id)||r.id<1||r.id>=a.nextId||!INDUSTRIES.some(([key])=>key===r.industry)||!integer(r.area)||r.area<1||r.area>DEVELOPMENT_MAX_AREA||
        r.cost!==r.area*DEVELOPMENT_COST||r.progress!==0||!integer(r.startedTurn)||r.startedTurn<1||r.startedTurn>s.lastTurn||
        !d.countries.some(c=>c.id===r.ownerId)||p.economy[r.industry].developedArea+r.area>p.economy[r.industry].capacityArea)invalid();
    }
    const v=s.activation;
    if(v!==null&&(!v||!INDUSTRIES.some(([key])=>key===v.industry)||!integer(v.area)||v.area<1||v.area>DEVELOPMENT_MAX_AREA||
      !integer(v.completedTurn)||v.completedTurn<1||v.completedTurn>s.lastTurn||v.effectiveTurn!==v.completedTurn+1||p.economy[v.industry].developedArea<v.area))invalid();
  }
}
