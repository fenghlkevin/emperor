import {resourceShortage} from './action-feedback.mjs';
import {workOfficerEffect,effectiveWorkMode} from './official-effects.mjs';
import {activeDisaster} from './disasters.mjs';
import {welfareValue} from './building-effects.mjs';
import {CONSTRUCTION_PLANS} from './construction.mjs';
import {SPECIAL_PLANS} from './special-buildings.mjs';
import {projectWorkers,projectLaborOverview} from './project-labor.mjs';
export function findProject(d,p,kind){return kind==='construction'?p.construction.project:kind==='development'?p.development.project:kind==='special'&&d.specialWorks.project?.provinceId===p.id?d.specialWorks.project:null;}
export function projectTotal(kind,r){return kind==='construction'?CONSTRUCTION_PLANS[r.building].turns:kind==='development'?1:SPECIAL_PLANS[r.building].turns;}
export function configureProjectWork(state,provinceId,kind,{mode=0,duration=1,comfort=false}={}){
 const s=structuredClone(state),d=s.domestic,p=d.provinces.find(p=>p.id===provinceId&&p.countryId===d.playerCountryId);
 if(!p||p.resourceRulesVersion!==1)throw Error('仅新制本国工程可调整投入');
 if(typeof comfort!=='boolean')throw Error('待遇选项无效');
 if(!Number.isInteger(mode)||mode<0||mode>2||!Number.isInteger(duration)||duration<1||duration>3)throw Error('施工档位为0–2，授权期限为1–3旬');
 const r=findProject(d,p,kind);if(!r)throw Error('项目不存在');
 mode=effectiveWorkMode(d,p,mode,kind);
 if(mode&&projectTotal(kind,r)-r.progress<=1+(workOfficerEffect(d,p,kind)?.bonus??0))throw Error('剩余工期不足以通过赶工提前，不必增加费用');
 const workers=projectWorkers(kind,r,d),available=projectLaborOverview(d,p).available;
 if(mode&&available<Math.ceil(workers*mode/2))throw Error(resourceShortage('增派施工','可用民夫',Math.ceil(workers*mode/2),available,'人'));
 r.workOrder={mode,untilTurn:state.turn+duration,comfort:mode>0&&comfort};
 return {state:s,message:`已设置${['常规','增派','赶工'][mode]}，最多执行${duration}旬；每旬复验人力、钱粮与民心，不足自动降档。`};
}
export function quoteProjectWork(state,provinceId,kind,options={}){
 const candidate=configureProjectWork(state,provinceId,kind,options),p=candidate.state.domestic.provinces.find(p=>p.id===provinceId),r=findProject(candidate.state.domestic,p,kind),mode=effectiveWorkMode(candidate.state.domestic,p,options.mode??0,kind);
 const base=projectWorkers(kind,r,candidate.state.domestic),remaining=projectTotal(kind,r)-r.progress,officer=workOfficerEffect(candidate.state.domestic,p,kind),normalSpeed=1+(officer?.bonus??0),speed=Math.min(2,remaining,1+mode/2+(officer?.bonus??0));
 return {workers:Math.ceil(base*(1+mode/2)),speed,mode,officer,perTurn:mode?Math.ceil(base*(mode===2?.5:.2))+(options.comfort?Math.ceil(base*.1):0):0,
  remaining,normalTurns:Math.ceil(remaining/normalSpeed),fastTurns:Math.min(options.duration??1,Math.ceil(remaining/speed))+Math.ceil(Math.max(0,remaining-Math.min(options.duration??1,Math.ceil(remaining/speed))*speed)/normalSpeed),untilTurn:r.workOrder.untilTurn,
  blockedReason:activeDisaster(p,state.turn)?'当前受灾，工程暂停':p.foodRelief?.lastSettlement?.shortfall>0?'当前缺粮，不执行赶工':welfareValue(p,'loyalty')<40?'当前民心低于40，不执行赶工':null,
  warning:'按现状估算；每旬复验钱粮、人数和民心。缺粮、灾情、民心低于40时恢复常规；钱人不足降档。'};
}
export function cancelProjectWork(state,provinceId,kind,id){
 const s=structuredClone(state),d=s.domestic,p=d.provinces.find(p=>p.id===provinceId&&p.countryId===d.playerCountryId);
 if(!p||p.resourceRulesVersion!==1||!['construction','development'].includes(kind))throw Error('请选择新制本国普通工程或开垦项目');
 if(id!==d.industryActions.nextId)throw Error('停建指令已执行或状态已更新');
 const r=findProject(d,p,kind);if(!r)throw Error('没有可停建的项目');
 if(r.ownerId&&r.ownerId!==d.playerCountryId)throw Error('不能停建其他国家的工程');
 p[kind].project=null;d.industryActions.nextId++;
 return {state:s,message:'工程已停建，已付费用不退，后续旬不再占用民夫；当旬已使用的人手不重复复用。'};
}
