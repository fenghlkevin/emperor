import {executeNational} from './national-actions.mjs';
export function courtRoyalPlan(state,proposal){
 if(!['educate','heir','rename'].includes(proposal.kind))throw Error('请选择有效宗室政令');
 const command={...proposal,id:state.domestic.stateDevelopment.nextId},result=executeNational(state,command),person=result.state.domestic.royalFamily.find(p=>p.id===command.personId);
 return {command,message:result.message,cost:state.stats.treasury-result.state.stats.treasury,person:structuredClone(person),parenting:result.state.dynasty.parenting,heirId:result.state.dynasty.heirId,warning:command.kind==='heir'?'册立会替换当前储君；储君不能外嫁。继位另须完成本朝结算、储君未满80岁；亡国不能继位。':command.kind==='educate'?'亲授每人每旬一次，限3至17岁在宫皇嗣；学养最多100，育亲最多100。':'赐名同步真实宗室与皇嗣记录，不改变年龄、学养或婚姻。'};
}
