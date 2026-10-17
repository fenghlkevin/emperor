import {SPECIAL_PLANS,quoteSpecial,executeSpecial,specialStage,specialActive} from './special-buildings.mjs';
import {executeNational} from './national-actions.mjs';
import {activeDisaster} from './disasters.mjs';
export function courtSpecialStatus(state){const d=state.domestic,r=d.specialWorks.project;if(!r)return null;const p=d.provinces.find(p=>p.id===r.provinceId),plan=SPECIAL_PLANS[r.building],reasons=[];if(p.countryId!==r.ownerId)reasons.push('失地');if(activeDisaster(p,state.turn))reasons.push('灾情');if(p.population.professions.militia<plan.workers)reasons.push('民伕不足');return {...r,name:plan.name,provinceName:p.name,workers:plan.workers,turns:plan.turns,stage:specialStage(plan,r.progress),paused:reasons.length>0,reasons};}
export function courtSpecialPlan(state,proposal){
 if(proposal.kind==='cancel-special'){const command={kind:'cancel-special',id:state.domestic.stateDevelopment.nextId},result=executeNational(state,command);return {command,cost:0,message:result.message,warning:'停建不退款，已完成进度丢弃；征用民伕不被删除，释放全国工程名额。'};}
 if(proposal.kind!=='special')throw Error('请选择有效特殊工程政令');
 const command={...proposal,id:state.domestic.specialWorks.nextId},q=quoteSpecial(state,command);if(!q.canAfford)throw Error('国库不足');const result=executeSpecial(state,command);return {command,cost:q.cost,message:result.message,turns:q.turns,workers:q.workers,effect:q.effect,warning:'全国同时仅施工一项，每种全地图仅一处。灾情、失地或民伕不足时暂停；全线竣工下一旬启用，竣工后每座维护20两/旬。'};
}
export {SPECIAL_PLANS,specialActive};
