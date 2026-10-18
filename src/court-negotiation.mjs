import {requireEnvoyAudience} from './envoy-visits.mjs';
import {executeDiplomacy,quoteNegotiation,relationBetween,treatyLabel} from './diplomacy.mjs';
export function courtNegotiationPlan(state,proposal){
 const visit=requireEnvoyAudience(state),command={...proposal,countryId:visit.countryId};
 if(!['treaty','cancel','trade','tribute','demand','marryIn','marryOut'].includes(command.kind))throw Error('请选择有效的国书提案');
 const quote=quoteNegotiation(state,command),result=executeDiplomacy(state,command),r=relationBetween(result.state.domestic,state.domestic.playerCountryId,visit.countryId),before=relationBetween(state.domestic,state.domestic.playerCountryId,visit.countryId);
 const text=command.kind==='trade'?`每旬出口收银 ${command.exports} 两、进口付银 ${command.imports} 两；净约定 ${command.exports-command.imports} 两/旬。`:command.kind==='treaty'?`国约：${treatyLabel(before,state.domestic.playerCountryId)} → ${treatyLabel(r,state.domestic.playerCountryId)}。`:command.kind==='cancel'?'解除国约；贸易、贡银与婚姻单独保留。':command.kind==='tribute'||command.kind==='demand'?`每年正月上旬 ${command.kind==='tribute'?'我国支付':'对方支付'} ${command.amount} 两，替换原贡银方向。`:command.kind==='marryIn'?'迎来访国公主入宫；每国仅一位。':`送${state.domestic.royalFamily.find(p=>p.id===command.personId)?.name??'所选皇嗣'}和亲，出嫁后离宫。`;
 const warning=command.kind==='trade'?'条款每旬结算，不是当下收银。敌对暂停；不足按现银支付、友善−5，不额外借债。':command.kind==='tribute'||command.kind==='demand'?'贡银在正月上旬结算；不足按现银支付、友善−10。0表示取消。':command.kind==='marryIn'||command.kind==='marryOut'?'婚姻会写入真实宗室及婚姻记录，不能重复和亲。':'互不侵犯、防御及保护条约约束出征；解约友善−10。';
 return {command,quote,text,warning,accepted:result.accepted,message:result.message,friendshipBefore:before.friendship,friendshipAfter:r.friendship,agreement:structuredClone(r.agreement)};
}
