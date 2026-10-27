import {replacementQuote} from './army-recovery.mjs';
import {laborProfile} from './labor.mjs';
import {quoteWar,borderingProvinces} from './war.mjs';
import {worldKitSummary} from './troop-kit-world.mjs';
export function courtCampaignPlan(state,formation){
 const command={...structuredClone(formation),id:state.domestic.war.nextId,kind:'war',kitVersion:1,...((formation.cardWeapons||formation.cardSecrets||formation.cardLandmarks)?{battleMode:'cards'}:{})},q=quoteWar(state,command),source=worldKitSummary(state.domestic).find(r=>r.id==='central'),usage={};
 for(const row of q.details.friendly)usage[row.kind]=(usage[row.kind]??0)+row.count;
 const count=q.details.friendly.reduce((n,r)=>n+r.count,0),province=state.domestic.provinces.find(p=>p.id===q.details.provinceId);
 let replacement;try{replacement=replacementQuote(state,{soldiers:count,kits:usage});}catch(e){replacement={total:null,blocked:e.message};}
 const enemy=province.population.professions.soldiers,ratio=enemy?Math.round(count/enemy*1000)/10:100;
 const idle=state.domestic.provinces.filter(p=>p.countryId===state.domestic.playerCountryId).reduce((n,p)=>n+laborProfile(p).available,0);
 return {command,lines:q.lines,replacement,supply:q.supply??{silver:0,grain:0},idle,ratio,enemyTraining:province.military.training,riskLabel:ratio<50?'兵力悬殊 · 出征风险很高':ratio<100?'兵力不利 · 请审慎用兵':'核对兵力与补给',count,reserve:source.soldiers.available-count,usage,training:source.training,targetProvince:province.name,enemy:province.population.professions.soldiers,warning:'本令从中央禁军抽调齐装部队，不自动购买或借用地方装备；主将亲卫退场即判负。敌方可能获得真实条约援军。'};
}
