import {quoteRevenue,executeRevenue} from './revenue.mjs';
import {countrySummary} from './domestic.mjs';

// An ephemeral map draft. Use existing fiscal commands and never publish a preview.
export function courtFiscalCommand(state,kind,edits={}){
 const id=state.domestic.fiscalActions.nextId;
 if(kind==='tax'){
  const rates=Object.fromEntries(countrySummary(state.domestic).provinces.map(p=>[p.id,Math.round(p.budget.taxRate*100)]));
  return {id,kind,rates:{...rates,...edits}};
 }
 if(kind==='subsidy')return {id,kind,amounts:{...edits}};
 if(!['census','levy'].includes(kind))throw Error('请选择有效的财政方案');
 return {id,kind};
}
export function courtFiscalPlan(state,kind,edits={}){
 const command=courtFiscalCommand(state,kind,edits),q=quoteRevenue(state,command),before=countrySummary(state.domestic,undefined,state.turn);
 const after=q.canAfford?countrySummary(executeRevenue(state,command).state.domestic,undefined,state.turn):null;
 const changed=q.changes.map(r=>state.domestic.provinces.find(p=>p.id===r.provinceId).name);
 const places=changed.slice(0,3).join('、')+(changed.length>3?`等${changed.length}州`:'');
 const addedPopulation=kind==='census'?q.changes.reduce((n,r)=>n+r.added,0):0;
 const note=kind==='tax'?'新税率在后续旬结算征收；高于25%会逐旬损害民忠与安定，高于30%也会影响年度生活。':kind==='subsidy'?'国库拨银转为地方现金，不直接变为粮食，也不立即增加民忠或安定。':kind==='census'?'登记各州现有人口的1%，加入四类生产职业；不增加士兵或民伕。':'一次加征各州可用地方现金的10%，受征州民忠−5、安定−3；不改变常规税率。';
 const warning=kind==='levy'?'受征州民忠−5、安定−3；常规税率不变。':kind==='tax'&&q.changes.some(r=>r.rate>.25)?'部分拟定税率高于25%，后续逐旬损害民忠与安定。':'';
 return {warning,command,cost:q.cost,income:q.income,canAfford:q.canAfford,text:`${q.title} · ${places}`,note,lines:q.lines,changes:q.changes,addedPopulation,treasuryBefore:q.treasuryBefore,treasuryAfter:q.treasuryAfter,before:{income:before.income,expenditure:before.expenditure,net:before.net},after:after?{income:after.income,expenditure:after.expenditure,net:after.net}:null};
}
