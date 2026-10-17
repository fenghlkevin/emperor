import {militarySummary} from './military.mjs';
import {countrySummary} from './domestic.mjs';
import {palaceAction} from './emperor.mjs';
const clamp=n=>Math.max(0,Math.min(100,Number.isFinite(n)?n:0));
// Population-weighted welfare prevents small rich provinces masking widespread hardship.
export function observationReport(state){
 if(state.observation?.turn===state.turn)return structuredClone(state.observation);
 const s=countrySummary(state.domestic),military=militarySummary(state.domestic),coverage=military.soldiers?Math.min(100,Object.values(military.stock).reduce((n,v)=>n+v,0)/military.soldiers*100):0;
 const factors=[['民忠',clamp(s.loyalty),.25],['民生',clamp(s.livingStandard),.20],['安定',clamp((s.welfare.stability+s.welfare.security)/2),.20],['粮足',clamp(s.grainSecurity),.15],['财政',clamp(s.country.fiscal.treasury/Math.max(1,s.expenditure)/6*100),.10],['军备',clamp((military.training+coverage)/2),.10]];
 const score=Math.round(factors.reduce((n,[,v,w])=>n+v*w,0));
 const count=s.total>0?Math.min(Math.floor(s.total),Math.round(20+5980*(score/100)**2)):0;
 const tier=score<25?'国势艰危':score<45?'百业待兴':score<65?'国运平稳':score<80?'国富民安':'盛世朝仪';
 return {turn:state.turn,score,count,tier,factors:factors.map(([name,value,weight])=>({name,value:Math.round(value),weight}))};
}
export function observe(state){
 const report=observationReport(state);
 if(state.observation?.turn===state.turn)return {state:structuredClone(state),report,message:'本旬已登台，御街朝仪如故。'};
 const result=palaceAction(state,'view');result.state.observation=report;
 const message=`御街 ${report.count.toLocaleString('zh-CN')} 人朝拜，${report.tier}。快乐增加 ${result.state.stats.happiness-state.stats.happiness}，体力减少 ${state.stats.energy-result.state.stats.energy}。`;
 result.state.harem.history[0]=`第${state.turn}旬：登观景台，${message}`;
 return {state:result.state,report,message};
}
