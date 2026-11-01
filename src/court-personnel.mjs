import {executePersonnel,servingOfficials,officeId} from './personnel-actions.mjs';
import {officeRegister} from './personnel.mjs';
import {countrySummary} from './domestic.mjs';

export function personnelSeat(d,officeIdValue){
 const office=officeRegister(d).find(o=>o.id===officeIdValue);
 return {office,incumbent:servingOfficials(d).find(o=>officeId(o)===officeIdValue)??null};
}
// The preview runs only on a private domain copy; no fictional scores or costs.
export function courtPersonnelPlan(state,proposal){
 if(!['personnel-batch','assign-batch','assign','honor','dismiss','delegate','governanceBudget','exam','hanlin-enroll','hanlin-stop'].includes(proposal.kind))throw Error('请选择有效的吏部政令');
 const command={...proposal,id:state.domestic.personnel.nextId},d=state.domestic;
 if(command.kind==='delegate'&&d.personnel.delegations.includes(command.provinceId)===command.enabled)throw Error(command.enabled?'此州已经委任':'此州已由陛下亲理');
 if(command.kind==='governanceBudget'&&command.reserve===d.governance.reserve&&command.budget===d.governance.budget)throw Error('治理预算与保留线未改变');
 const person=servingOfficials(d).find(p=>p.id===command.officialId),seat=personnelSeat(d,command.officeId),before=countrySummary(d,undefined,state.turn);
 const result=executePersonnel(state,command),after=countrySummary(result.state.domestic,undefined,state.turn),changed=result.state.domestic.justice.officials.find(p=>p.id===person?.id);
 const warning=(command.kind==='dismiss'||command.kind==='personnel-batch'&&command.operations.some(r=>r.kind==='dismiss'))?'外调后永久移出在朝名册，不能返回中央。':command.kind==='assign'&&seat.incumbent?`${seat.incumbent.name}转为待命，不会被删除。`:command.kind==='delegate'&&command.enabled?'下旬自动治理会在全国预算与保留线内支银；保留线不保证常规结算后的余额。':'';
 const assignments=command.kind==='assign-batch'?command.assignments.map(row=>{const original=servingOfficials(d).find(p=>p.id===row.officialId),seat=personnelSeat(d,row.officeId),appointed=servingOfficials(result.state.domestic).find(p=>p.id===row.officialId);return {officialId:row.officialId,name:original.name,from:original.office??'待命',to:seat.office.name,incumbent:seat.incumbent?.name??'空缺',loyaltyBefore:original.loyalty,loyaltyAfter:appointed.loyalty};}):null;
 const vacancies=command.kind==='assign-batch'?officeRegister(d).filter(o=>personnelSeat(d,o.id).incumbent&&!personnelSeat(result.state.domestic,o.id).incumbent).map(o=>o.name):[];
 return {messages:result.messages,assignments,vacancies,command,message:assignments?`拟统一任命${assignments.length}人，落印后生效。`:result.message,cost:before.country.fiscal.treasury-after.country.fiscal.treasury,treasuryBefore:before.country.fiscal.treasury,treasuryAfter:after.country.fiscal.treasury,netBefore:before.net,netAfter:after.net,warning,incumbent:seat.incumbent?{id:seat.incumbent.id,name:seat.incumbent.name}:null,personBefore:person?{id:person.id,name:person.name,office:person.office,loyalty:person.loyalty}:null,personAfter:changed?{id:changed.id,name:changed.name,office:changed.office,loyalty:changed.loyalty}:null};
}
