import {settleIndustryHiring} from './industry-labor.mjs';
import {countrySummary} from './domestic.mjs';
import {outputFor,INDUSTRIES,legacyFoodOutput} from './economy.mjs';
import {nationalFoodForecast} from './national-resources.mjs';
export function manpowerEffects(before,after){
 const id=before.domestic.playerCountryId,turn=before.turn+1;
 const prepare=s=>{const d=structuredClone(s.domestic);settleIndustryHiring(d,turn);return d;};
 const beforeDomestic=prepare(before),afterDomestic=prepare(after);
 const metrics=d=>{const cash=countrySummary(d,id,turn),ps=d.provinces.filter(p=>p.countryId===id),food=nationalFoodForecast(d,turn,id);
  return {production:ps.reduce((n,p)=>n+legacyFoodOutput(p,turn),0),grainTax:food.produced,officialRations:food.provinces.reduce((n,p)=>n+(p.resource?.grain.officialNeed??0),0),grainNet:food.produced-food.need-food.storageLoss,tax:cash.tax,expenses:cash.expenditure,soldierSalaries:cash.expenses.soldierSalaries,militiaSalaries:cash.expenses.militiaSalaries,supplies:cash.expenses.weapons,cashNet:cash.net};};
 const a=metrics(beforeDomestic),b=metrics(afterDomestic),delta=Object.fromEntries(Object.keys(a).map(k=>[k,b[k]-a[k]]));
 const rows=beforeDomestic.provinces.filter(p=>p.countryId===id).flatMap(p=>{const q=afterDomestic.provinces.find(x=>x.id===p.id);return INDUSTRIES.filter(([, ,job])=>q.population.professions[job]!==p.population.professions[job]).map(([key,name,job,unit])=>({province:p.name,industry:name,unit,before:p.population.professions[job],after:q.population.professions[job],outputBefore:outputFor(p,key,turn),outputAfter:outputFor(q,key,turn)}));});
 return {before:a,after:b,delta,rows};
}
export function manpowerEffectLines(q){
 const signed=n=>(n>0?'+':'')+n;
 return [
  `国库银税 ${q.before.tax}→${q.after.tax}两/旬（${signed(q.delta.tax)}），常规开支 ${q.before.expenses}→${q.after.expenses}两/旬（${signed(q.delta.expenses)}）`,
  `民间粮食产量 ${q.before.production}→${q.after.production}石/旬（${signed(q.delta.production)}）`,
  `官府口粮 ${q.before.officialRations}→${q.after.officialRations}石/旬（${signed(q.delta.officialRations)}），农牧粮赋 ${q.before.grainTax}→${q.after.grainTax}石/旬`,
  `军饷 ${q.before.soldierSalaries}→${q.after.soldierSalaries}两/旬；民夫薪俸 ${q.before.militiaSalaries}→${q.after.militiaSalaries}两/旬；军需 ${q.before.supplies}→${q.after.supplies}两/旬`,
  `调整后常规结余：银${q.after.cashNet}两/旬，官粮${q.after.grainNet}石/旬（不含本次一次性费用与未来事件）`,
  ...q.rows.map(r=>`${r.province}${r.industry}从业 ${r.before}→${r.after}人，产出 ${r.outputBefore}→${r.outputAfter}${r.unit}/旬`)
 ];
}
