import {quoteWar,borderingProvinces} from './war.mjs';
import {worldKitSummary} from './troop-kit-world.mjs';
export function courtCampaignPlan(state,formation){
 const command={...structuredClone(formation),id:state.domestic.war.nextId,kind:'war',kitVersion:1},q=quoteWar(state,command),source=worldKitSummary(state.domestic).find(r=>r.id==='central'),usage={};
 for(const row of q.details.friendly)usage[row.kind]=(usage[row.kind]??0)+row.count;
 const count=q.details.friendly.reduce((n,r)=>n+r.count,0),province=borderingProvinces(state.domestic,state.domestic.playerCountryId,command.targetId)[0]??state.domestic.provinces.find(p=>p.id===q.details.provinceId);
 return {command,lines:q.lines,count,reserve:source.soldiers.available-count,usage,training:source.training,targetProvince:province.name,enemy:province.population.professions.soldiers,warning:'本令从中央禁军抽调齐装部队，不自动购买或借用地方装备；主将亲卫退场即判负。敌方可能获得真实条约援军。'};
}
