import {balanced} from './development-balance.mjs';
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
 if(!['census'].includes(kind))throw Error('请选择有效的财政方案');
 return {id,kind};
}
export function courtFiscalPlan(state,kind,edits={}){
 const command=courtFiscalCommand(state,kind,edits),q=quoteRevenue(state,command),before=countrySummary(state.domestic,undefined,state.turn);
 const after=q.canAfford?countrySummary(executeRevenue(state,command).state.domestic,undefined,state.turn):null;
 const changed=q.changes.map(r=>state.domestic.provinces.find(p=>p.id===r.provinceId).name);
 const places=changed.slice(0,3).join('、')+(changed.length>3?`等${changed.length}州`:'');
 const addedPopulation=kind==='census'?q.changes.reduce((n,r)=>n+r.added,0):0;
 const note=balanced(state.domestic)&&kind==='tax'?'新税率在后续旬结算计收；税压会逐旬影响产出、生活和民心，高税即使有粮也可能引发动荡，降税后需时间恢复。':balanced(state.domestic)&&kind==='census'?'按实际空缺岗位招纳，现有空闲劳力先就业；费用按实际安置人数计收，受人口容量和岗位限制，不增加士兵或民夫。':kind==='tax'?'新税率在后续旬结算征收；高于25%会逐旬损害民忠与安定，高于30%也会在每三旬检查时降低生活水平。':kind==='subsidy'?'受灾州补助只缩短灾期，不提高生活水平；赈灾费用为人口×0.01两，每州每旬一次、缩短1旬，至少保留1旬。无灾州补助才改善生活水平，每人0.01两提高1点，最高100。不增加粮食。':kind==='census'?'按各州现有人口的1%招纳流民，受人口容量限制，实际增加人口并加入生产职业；不增加士兵或民伕。':'一次加征各州可用地方现金的10%，受征州民忠−5、安定−3；不改变常规税率。';
 const warning=kind==='levy'?'受征州民忠−5、安定−3；常规税率不变。':kind==='tax'&&q.changes.some(r=>r.rate>.25)?'部分拟定税率高于25%，后续逐旬损害民忠与安定。':'';
 return {warning,command,cost:q.cost,income:q.income,canAfford:q.canAfford,text:`${q.title} · ${places}`,note,lines:q.lines,changes:q.changes,addedPopulation,treasuryBefore:q.treasuryBefore,treasuryAfter:q.treasuryAfter,before:{income:before.income,expenditure:before.expenditure,net:before.net},after:after?{income:after.income,expenditure:after.expenditure,net:after.net}:null};
}
