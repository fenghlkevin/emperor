import {balanced} from './development-balance.mjs';
import {executeJustice,prisonLoyaltyDelta,PRISON_PERSONALITIES} from './justice.mjs';
export function courtJusticeCases(state,view='investigate'){
 const d=state.domestic;
 return d.justice.officials.filter(o=>view==='prison'?o.status==='imprisoned':view==='history'?['released','executed','rebel'].includes(o.status):o.status==='serving'&&o.discovered&&!o.caseDismissed&&(!o.provinceId||d.provinces.some(p=>p.id===o.provinceId&&p.countryId===d.playerCountryId))).map(o=>({official:o,evidence:o.discovered?`第${o.discoveredTurn}旬密查发现；当前忠诚 ${o.loyalty}%。此记录不包含贪污、口供或物证。`:'未有密查记录；仅列真实在押记录。',prison:o.prison,delta:o.status==='imprisoned'?prisonLoyaltyDelta(o):null,personality:PRISON_PERSONALITIES[o.personality]}));
}
export function courtJusticePlan(state,proposal){
 if(!['funding','amnesty','imprison','execute','release','dismiss','reinstate'].includes(proposal.kind))throw Error('请选择有效刑部政令');
 const command={...proposal,id:state.domestic.justice.nextId},result=executeJustice(state,command),before=state.domestic.justice,after=result.state.domestic.justice;
 return {command,message:result.message,cost:state.stats.treasury-result.state.stats.treasury,funding:after.funding,newCases:after.officials.filter(o=>o.discovered&&!before.officials.find(p=>p.id===o.id)?.discovered).map(o=>o.id),warning:command.kind==='reinstate'?'出狱转为待命，保留当前忠诚，由吏部另行任职。':command.kind==='dismiss'?'保留官职与当前忠诚，仍有叛乱风险。':command.kind==='execute'?'处斩不可撤销，官员永久退出任职。':command.kind==='release'?'释放为民，不会恢复官职。':command.kind==='imprison'?'收押后原职空缺；服刑忠诚按真实性格逐旬变化，不保证归顺。':command.kind==='amnesty'?(balanced(state.domestic)?'特赦间隔十二旬，需实付复核费用；同年收益3、1、0递减，不能消除苛税积怨；不释放天牢官员。':'各州治安降低5（最低0），每旬限一次；不释放天牢官员。'):after.funding?`本次支银 ${after.funding} 两，此后每旬另拨同额；不足时自动停止。`:'停止后续调查支出，已发现记录仍保留。'};
}
