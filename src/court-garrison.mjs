import {quoteKitCommand,executeKitCommand,worldKitSummary} from './troop-kit-world.mjs';
export function courtGarrisonPlan(state,proposal){
 if(!['purchase','recruit','dismiss','transfer'].includes(proposal.kind))throw Error('请选择有效营务军令');
 const command={...proposal,id:state.domestic.troopKits.nextId},q=quoteKitCommand(state,command);
 if(!q.canAfford)throw Error('国库不足');
 const next=executeKitCommand(state,command).state,find=(s,id)=>worldKitSummary(s.domestic).find(r=>r.id===id),before=find(state,command.sourceId),after=find(next,command.sourceId);
 return {command,cost:q.cost,lines:q.lines,before,after,targetBefore:command.kind==='transfer'?find(state,command.targetId):null,targetAfter:command.kind==='transfer'?find(next,command.targetId):null,warning:command.kind==='purchase'?'只购完整装备，不附赠士兵；特种装备仅在真实稳定产地采购。':command.kind==='recruit'?'每人4两；不附赠装备，新兵训练按来源体能加权，后续增加兵饷与粮耗。':command.kind==='dismiss'?'只解散空闲兵员；装备留营，征兵费用不退还。':'兵员与所选装备一起调动；只可动用空闲库存，调出与调入兵装守恒。'};
}
