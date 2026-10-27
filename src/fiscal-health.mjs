import {laborRatio} from './development-balance.mjs';
const clamp=n=>Math.max(0,Math.min(100,n));
export function fiscalHealth(d,id=d.playerCountryId){
 const c=d.countries.find(c=>c.id===id),ps=d.provinces.filter(p=>p.countryId===id),rows=[...c.ledger.filter(r=>!r.legacy).map(r=>({turn:r.turn,income:(r.categories.regular?.income??0)+(r.recurring?.income??0),expense:(r.categories.regular?.expenditure??0)+(r.categories.regular?.debtAdded??0)+(r.recurring?.expense??0)})),...(c.fiscal.accounting?.history??[])].slice(0,108);
 const recent=rows.slice(0,36);
 const income=recent.reduce((n,r)=>n+r.income,0),cost=recent.reduce((n,r)=>n+r.expense,0);
 const averageExpense=rows.length?cost/recent.length:ps.reduce((n,p)=>n+Object.values(p.budget.expenses).reduce((a,b)=>a+b,0),0)+310;
 const currentOperations=rows.length?clamp(50+(income-cost)/Math.max(1,income)*200):50;
 const trendIncome=rows.reduce((n,r)=>n+r.income,0),trendCost=rows.reduce((n,r)=>n+r.expense,0),trendOperations=rows.length?clamp(50+(trendIncome-trendCost)/Math.max(1,trendIncome)*200):50;
 const operations=Math.min(currentOperations,currentOperations*.65+trendOperations*.35);
 const liquidity=clamp(c.fiscal.treasury/Math.max(1,averageExpense*12)*100),credit=clamp(100-c.fiscal.debt/Math.max(1,(income/Math.max(1,recent.length))*36)*100);
 const population=ps.reduce((n,p)=>n+p.population.total,0),living=ps.reduce((n,p)=>n+p.status.livingStandard*p.population.total,0)/Math.max(1,population);
 const employment=clamp(ps.reduce((n,p)=>n+Object.values(p.population.professions).reduce((a,b)=>a+b,0),0)/Math.max(1,ps.reduce((n,p)=>n+p.population.total*laborRatio(p),0))*100);
 return {observedTurns:rows.length,annual:[0,1,2].map(i=>{const part=rows.slice(i*36,(i+1)*36);return {turns:part.length,fromTurn:part.at(-1)?.turn??null,toTurn:part[0]?.turn??null,net:part.reduce((n,r)=>n+r.income-r.expense,0)};}),operations,liquidity,credit,employment,living,net:rows.length?(income-cost)/recent.length:0,score:Math.round(operations*.4+liquidity*.2+credit*.2+employment*.1+living*.1)};
}
