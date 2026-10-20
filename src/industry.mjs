import {quoteShortage,resourceShortage} from './action-feedback.mjs';
import {rewardGovernorExperience} from './official-effects.mjs';
import {terrainLandLimit,industryLandLimit,industryLandAvailable} from './terrain-economy.mjs';
import {projectLaborOverview} from './project-labor.mjs';
import {planManpower,applyManpower,releaseDrafts} from './manpower.mjs';
import {manpowerEffects,manpowerEffectLines} from './manpower-effects.mjs';
import {initializeIndustryLabor,validateIndustryLabor,industryStaffing,reassignDevelopedLand,scheduleIndustryHiring} from './industry-labor.mjs';
import {initializeManpower,validateManpower} from './manpower.mjs';
import {initializeCityCapacity,validateCityCapacity,cityLand,cityPopulation,CITY_EXPANSION_PEOPLE,CITY_EXPANSION_COST,CITY_EXPANSION_LAND} from './city-capacity.mjs';
import {requireProjectLabor,projectIsStaffed,projectSpeed} from './project-labor.mjs';
import {INDUSTRIES,outputFor,fullOutputFor,industryTax,unallocatedPopulation} from './economy.mjs';
import {activeDisaster} from './disasters.mjs';
import {postTreasury} from './finance.mjs';
import {productionLaborLimit} from './labor.mjs';

export const DEVELOPMENT_COST=2,DEVELOPMENT_MAX_AREA=500,DEVELOPMENT_TURNS=1;
const jobs=INDUSTRIES.map(([, ,job])=>job);
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const invalid=()=>{throw Error('产业开发或职业调配存档无效');};
const blank=turn=>({lastTurn:turn,project:null,activation:null,lastAllocationTurn:null});
export function initializeIndustry(d,turn=1){
  initializeCityCapacity(d);initializeIndustryLabor(d);initializeManpower(d);
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
  return {land:cityLand(p),population:cityPopulation(p),unallocated:unallocatedPopulation(p),project,activation,
    disaster:activeDisaster(p,turn),industries:INDUSTRIES.map(([key,name,job,unit])=>({key,name,job,unit,
      ...industryStaffing(p,key,turn),workers:p.population.professions[job],area:p.economy[key].developedArea,capacity:p.economy[key].capacityArea,
      limit:industryLandLimit(p,key),remaining:Math.min(cityLand(p).available,industryLandAvailable(p,key)),
      output:outputFor(p,key,turn),fullOutput:fullOutputFor(p,key,turn),perWorker:p.population.professions[job]?p.economy[key].developedArea/p.population.professions[job]:null}))};
}
export function quoteIndustry(state,c){
  const p=owned(state,c.provinceId),d=state.domestic,home=d.countries.find(c=>c.id===d.playerCountryId);
  let cost=0,preview=structuredClone(p),title,manpowerPlan,impact,impactLines=[];
  if(c.kind==='develop'||c.kind==='convert'){
    if(!INDUSTRIES.some(([key])=>key===c.industry))throw Error('请选择有效产业');
    if(!Number.isSafeInteger(c.area)||c.area<1||c.area>DEVELOPMENT_MAX_AREA)throw Error('开发面积须为1至500亩的整数');
    if(activeDisaster(p,state.turn))throw Error('该州受灾，不能新开工；已有开发将在灾退后复工');
    if(p.development.project)throw Error('该州已有产业开发项目');
    if(c.kind==='convert'){
      if(!INDUSTRIES.some(([key])=>key===c.fromIndustry)||c.fromIndustry===c.industry)throw Error('请选择不同的转出与转入产业');
      const pending=p.development.activation?.industry===c.fromIndustry&&p.development.activation.effectiveTurn>state.turn?p.development.activation.area:0;
      const local=c.fromIndustry==='agriculture'&&p.civic?.localInvestment?.effectiveTurn>state.turn?p.civic.localInvestment.area:0;
      if(c.area>p.economy[c.fromIndustry].developedArea-pending-local)throw Error(resourceShortage('产业转用','转出产业已生效土地',c.area,p.economy[c.fromIndustry].developedArea-pending-local,'亩'));
      preview.economy[c.fromIndustry].developedArea-=c.area;
    }else if(c.area>cityLand(p).available)throw Error(resourceShortage('产业开发','城州剩余土地',c.area,cityLand(p).available,'亩')+'请先扩城或转用土地。');
    if(c.area>industryLandAvailable(p,c.industry))throw Error(resourceShortage('产业开发或转入','地形用地上限余量',c.area,industryLandAvailable(p,c.industry),'亩')+'请扩城或另选产业。');
    requireProjectLabor(d,p,'development',c);
    cost=c.area*DEVELOPMENT_COST;preview.economy[c.industry].developedArea+=c.area;
    title=p.resourceRulesVersion===1&&c.industry==='agriculture'?`${p.name}开垦土地`:`${p.name}${INDUSTRIES.find(([key])=>key===c.industry)[1]}开发`;
    reassignDevelopedLand(preview,c.industry,c.kind==='convert'?c.fromIndustry:undefined);
    if(c.kind==='convert')title=`${p.name}${INDUSTRIES.find(([key])=>key===c.fromIndustry)[1]}土地转为${INDUSTRIES.find(([key])=>key===c.industry)[1]}`;
  }else if(c.kind==='levy-militia'||c.kind==='release-militia'){
    if(state.domestic.war?.battle||state.domestic.collapse?.pending||state.stats.life===0)throw Error('当前不能办理劳役');
    const count=c.amount;if(!Number.isSafeInteger(count)||count<1)throw Error('民夫人数须为正整数');
    const next=structuredClone(state),target=next.domestic.provinces.find(x=>x.id===p.id);
    if(c.kind==='levy-militia'){manpowerPlan=planManpower(d,[p],count,c.draftRates??{});applyManpower(next.domestic,manpowerPlan,'militia',p.id);title=`${p.name}征调民夫`;}
    else{if(count>projectLaborOverview(d,p).available)throw Error(resourceShortage('遣散民夫（工程占用者不可遣散）','空闲民夫',count,projectLaborOverview(d,p).available,'人'));target.population.professions.militia-=count;releaseDrafts(next.domestic,p.id,count,{role:'militia',turn:state.turn});title=`${p.name}遣散民夫`;}
    preview=target;impact=manpowerEffects(state,next);impactLines=manpowerEffectLines(impact);
  }else if(c.kind==='expand'){
    if(p.disaster)throw Error('受灾不能扩建城州');
    if(p.cityCapacity.population+CITY_EXPANSION_PEOPLE>Math.floor(1e12/1.2))throw Error('人口容量已达最大值');
    if(p.cityCapacity.land>=terrainLandLimit(p))throw Error('已达到城州地形土地上限，不能继续扩城');
    cost=CITY_EXPANSION_COST;title=`${p.name}扩建城州`;
  }else if(c.kind==='allocate'){
    if(p.development.lastAllocationTurn===state.turn)throw Error('该州本旬已完成职业调配，请待下一旬');
    if(!c.targets||typeof c.targets!=='object'||Array.isArray(c.targets)||Object.keys(c.targets).length!==jobs.length||
      Object.keys(c.targets).some(k=>!jobs.includes(k))||jobs.some(k=>!integer(c.targets[k])))throw Error('请一次填写四业的非负整数目标人数，不可修改士兵或民伕');
    const allowed=productionLaborLimit(p);
    const assigned=jobs.reduce((n,k)=>n+c.targets[k],0);
    if(!Number.isSafeInteger(assigned)||assigned>allowed)throw Error('目标职业人数超过本州可分配劳动力');
    if(jobs.every(k=>c.targets[k]===p.population.professions[k]))throw Error('职业人数未改变，无需提交');
    for(const [key,,job]of INDUSTRIES){if(p.industryLabor&&c.targets[job]>industryStaffing(p,key,state.turn).required&&c.targets[job]>p.population.professions[job])throw Error('目标人数超过已开发产业岗位，请先开发');preview.population.professions[job]=c.targets[job];}
    title=`${p.name}职业人口调配`;
  }else throw Error('产业政令无效');
  const expandedLand=p.cityCapacity.land+(c.kind==='expand'?Math.min(CITY_EXPANSION_LAND,terrainLandLimit(p)-p.cityCapacity.land):0);
  const outputs=INDUSTRIES.map(([key,name,job,unit])=>({key,name,unit,landLimitBefore:industryLandLimit(p,key),landLimitAfter:industryLandLimit({...p,cityCapacity:{...p.cityCapacity,land:expandedLand}},key),workersBefore:p.population.professions[job],workersAfter:preview.population.professions[job],requiredAfter:industryStaffing(preview,key).required,
    before:outputFor(p,key),after:outputFor(preview,key),fullAfter:fullOutputFor(preview,key)}));
  return {title,cost,manpowerPlan,impact,impactLines,landBefore:cityLand(p),landAfter:{...cityLand(p),total:expandedLand},populationBefore:cityPopulation(p),populationAfter:cityPopulation({...p,cityCapacity:{...p.cityCapacity,population:p.cityCapacity.population+(c.kind==='expand'?CITY_EXPANSION_PEOPLE:0)}}),canAfford:home.fiscal.treasury>=cost,treasuryAfter:home.fiscal.treasury-cost,
    taxBefore:industryTax(p),taxAfter:industryTax(preview),unallocatedBefore:unallocatedPopulation(p),unallocatedAfter:unallocatedPopulation(preview),outputs,
    earliestCompleteTurn:['develop','convert'].includes(c.kind)?state.turn+DEVELOPMENT_TURNS:null,
    earliestEffectiveTurn:['develop','convert'].includes(c.kind)?state.turn+DEVELOPMENT_TURNS+1:state.turn+1};
}
function record(d,item){d.industryActions.history.unshift(item);d.industryActions.history=d.industryActions.history.slice(0,100);}
export function executeIndustry(state,c){
  const next=structuredClone(state),d=initializeIndustry(next.domestic,state.turn),a=d.industryActions;
  if(!Number.isSafeInteger(c.id)||c.id<1||c.id!==a.nextId)throw Error('产业政令已执行或状态已更新，请重新拟令');
  const q=quoteIndustry(next,c);if(!q.canAfford)throw Error(quoteShortage(q,q.title??'工部政令'));
  const p=owned(next,c.provinceId);
  postTreasury(d,d.playerCountryId,{turn:state.turn,expense:q.cost,reason:q.title,key:`industry:${c.id}`});
  if(c.kind==='develop'||c.kind==='convert'){
    p.development.project={id:c.id,industry:c.industry,area:c.area,cost:q.cost,progress:0,startedTurn:state.turn,ownerId:d.playerCountryId,...(c.kind==='convert'?{fromIndustry:c.fromIndustry}:{})};
    p.development.lastTurn=state.turn;
  }else if(c.kind==='expand'){
    p.cityCapacity.population+=CITY_EXPANSION_PEOPLE;
    p.cityCapacity.land+=Math.min(CITY_EXPANSION_LAND,terrainLandLimit(p)-p.cityCapacity.land);
  }else if(c.kind==='levy-militia'){
    applyManpower(d,q.manpowerPlan,'militia',p.id);
  }else if(c.kind==='release-militia'){
    p.population.professions.militia-=c.amount;releaseDrafts(d,p.id,c.amount,{role:'militia',turn:state.turn});
  }else{
    for(const key of jobs)p.population.professions[key]=c.targets[key];
    p.development.lastAllocationTurn=state.turn;
  }
  a.nextId++;
  const message=c.kind==='expand'?`${q.title}已完成，正常人口容量增加${CITY_EXPANSION_PEOPLE}人、可开发土地增加${q.landAfter.total-q.landBefore.total}亩，支银${q.cost}两。`:['levy-militia','release-militia'].includes(c.kind)?`${q.title}${c.amount}人；${q.impactLines.join('；')}`:['develop','convert'].includes(c.kind)?`${q.title}已开工，预付${q.cost}两；需1个正常施工旬，完工后下一旬增加产出并安排招工。`:
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
    if(!projectIsStaffed(d,p,'development',project,turn))continue;
    project.progress+=projectSpeed(d,p,'development',project,turn);
    if(project.progress<DEVELOPMENT_TURNS)continue;
    if(project.fromIndustry)p.economy[project.fromIndustry].developedArea-=project.area;
    p.economy[project.industry].developedArea+=project.area;
    a.activation={industry:project.industry,area:project.area,completedTurn:turn,effectiveTurn:turn+1,...(project.fromIndustry?{fromIndustry:project.fromIndustry}:{})};
    scheduleIndustryHiring(p,project.industry,turn+1,project.fromIndustry);
    rewardGovernorExperience(d,p);
    a.project=null;
    record(d,{id:project.id,turn,kind:'complete',provinceId:p.id,cost:0,message:`${p.name}${INDUSTRIES.find(([key])=>key===project.industry)[1]}${project.fromIndustry?'转用':'开发'}${project.area}亩已完工，第${turn+1}旬起增加产出。`});
  }
}
export function validateIndustry(d,currentTurn=Infinity){
  validateCityCapacity(d);validateIndustryLabor(d,currentTurn);validateManpower(d);
  const a=d.industryActions;
  if(!a||a.version!==1||!integer(a.nextId)||a.nextId<1||!Array.isArray(a.history)||a.history.length>100)invalid();
  const records=new Set();let previous=Infinity;
  for(const r of a.history){
    if(!r||!integer(r.id)||r.id<1||r.id>=a.nextId||!integer(r.turn)||r.turn<1||r.turn>currentTurn||r.turn>previous||
      !['develop','convert','expand','levy-militia','release-militia','allocate','complete'].includes(r.kind)||!d.provinces.some(p=>p.id===r.provinceId)||!integer(r.cost)||
      (['develop','convert'].includes(r.kind)?(r.cost<2||r.cost>1000||r.cost%2!==0):r.kind==='expand'?![2000,CITY_EXPANSION_COST].includes(r.cost):r.cost!==0)||typeof r.message!=='string'||r.message.length>3000||records.has(`${r.kind}:${r.id}`))invalid();
    records.add(`${r.kind}:${r.id}`);previous=r.turn;
  }
  for(const p of d.provinces){
    const s=p.development;
    if(!s||!integer(s.lastTurn)||s.lastTurn<1||s.lastTurn>currentTurn||!(s.lastAllocationTurn===null||integer(s.lastAllocationTurn)&&s.lastAllocationTurn>=1&&s.lastAllocationTurn<=currentTurn))invalid();
    const r=s.project;
    if(r!==null){
      if(!r||!integer(r.id)||r.id<1||r.id>=a.nextId||!INDUSTRIES.some(([key])=>key===r.industry)||!integer(r.area)||r.area<1||r.area>DEVELOPMENT_MAX_AREA||
        r.cost!==r.area*DEVELOPMENT_COST||r.progress!==0||!integer(r.startedTurn)||r.startedTurn<1||r.startedTurn>s.lastTurn||
        !d.countries.some(c=>c.id===r.ownerId))invalid();
      if(r.fromIndustry!==undefined&&(!INDUSTRIES.some(([key])=>key===r.fromIndustry)||r.fromIndustry===r.industry||p.economy[r.fromIndustry].developedArea<r.area))invalid();
    }
    const v=s.activation;
    if(v!==null&&(!v||!INDUSTRIES.some(([key])=>key===v.industry)||!integer(v.area)||v.area<1||v.area>DEVELOPMENT_MAX_AREA||
      !integer(v.completedTurn)||v.completedTurn<1||v.completedTurn>s.lastTurn||v.effectiveTurn!==v.completedTurn+1||p.economy[v.industry].developedArea<v.area||(v.fromIndustry!==undefined&&(!INDUSTRIES.some(([key])=>key===v.fromIndustry)||v.fromIndustry===v.industry))))invalid();
  }
}
