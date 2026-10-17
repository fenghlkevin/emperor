import {changeWelfare} from './building-effects.mjs';
import {postTreasury} from './finance.mjs';
import {countrySummary,provinceBudget,validateDomestic,INDUSTRIES} from './domestic.mjs';
export const CENSUS_COST=5000;
export const REVENUE_TABS=[['census','户口普查'],['purchase','武装购买'],['subsidy','中央补助地方'],['tax','各州税率'],['levy','强行征税']];
const integer=(n,min=0,max=1000000000)=>{if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('请输入范围内的整数');return n;};
const owned=state=>{const d=state.domestic,c=d.countries.find(c=>c.id===d.playerCountryId);return c.provinceIds.map(id=>d.provinces.find(p=>p.id===id&&p.countryId===c.id));};
function checkedEntries(values,provinces,all=false){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('缺少各州设置');
 const ids=new Set(provinces.map(p=>p.id));if(Object.keys(values).some(id=>!ids.has(id))||(all&&Object.keys(values).length!==ids.size))throw Error('只能设置本国各州');
 return provinces.filter(p=>Object.hasOwn(values,p.id)).map(p=>[p,values[p.id]]);
}
export function quoteRevenue(state,command){
 const provinces=owned(state),s=countrySummary(state.domestic),kind=command.kind;
 let cost=0,income=0,lines=[],changes=[];
 if(kind==='census'){
  cost=CENSUS_COST;changes=provinces.map(p=>({provinceId:p.id,added:Math.max(1,Math.floor(p.population.total*.01))}));
  lines=changes.map(r=>`${provinces.find(p=>p.id===r.provinceId).name}：新登记 ${r.added.toLocaleString('zh-CN')} 人`);
 }else if(kind==='subsidy'){
  changes=checkedEntries(command.amounts,provinces).map(([p,n])=>({provinceId:p.id,amount:integer(n)})).filter(r=>r.amount);
  if(!changes.length)throw Error('请至少设置一州补助');cost=changes.reduce((n,r)=>n+r.amount,0);
  lines=changes.map(r=>`${provinces.find(p=>p.id===r.provinceId).name}：中央拨银 ${r.amount.toLocaleString('zh-CN')} 两，充实地方现金`);
 }else if(kind==='tax'){
  changes=checkedEntries(command.rates,provinces,true).map(([p,n])=>({provinceId:p.id,before:p.budget.taxRate,rate:integer(n,0,50)/100})).filter(r=>Math.abs(r.rate-r.before)>1e-9);
  if(!changes.length)throw Error('各州税率与原来相同');
  lines=changes.map(r=>`${provinces.find(p=>p.id===r.provinceId).name}：税率由 ${Math.round(r.before*100)}% 调为 ${Math.round(r.rate*100)}%`);
 }else if(kind==='levy'){
  // Modern cash-based implementation: never subtract more money than a province holds.
  changes=provinces.map(p=>({provinceId:p.id,amount:Math.floor(Math.max(0,p.status.cash)*.1)})).filter(r=>r.amount>0);
  income=changes.reduce((n,r)=>n+r.amount,0);if(!income)throw Error('地方已无可征现金');
  lines=changes.map(r=>`${provinces.find(p=>p.id===r.provinceId).name}：加征 ${r.amount.toLocaleString('zh-CN')} 两，民忠 −5、安定 −3`);
 }else throw Error('户部政令无效');
 if(!Number.isSafeInteger(cost)||!Number.isSafeInteger(income))throw Error('金额超出范围');
 return {kind,title:REVENUE_TABS.find(([key])=>key===kind)[1],cost,income,lines,changes,treasuryBefore:s.country.fiscal.treasury,treasuryAfter:s.country.fiscal.treasury-cost+income,canAfford:s.country.fiscal.treasury>=cost};
}
export function executeRevenue(state,command){
 integer(command.id,1,Number.MAX_SAFE_INTEGER);if(command.id!==state.domestic.fiscalActions.nextId)throw Error('政令已执行或数据已更新，请重新拟旨');
 const quote=quoteRevenue(state,command);if(!quote.canAfford)throw Error('国库不足，无法执行本次政令');
 const next=structuredClone(state),d=next.domestic,c=d.countries.find(c=>c.id===d.playerCountryId),provinces=owned(next);
 const byId=id=>provinces.find(p=>p.id===id);
 if(command.kind==='census')for(const r of quote.changes){
  const p=byId(r.provinceId);p.population.total+=r.added;
  // Register new productive residents without changing existing soldiers/militia.
  const keys=INDUSTRIES.map(([, ,job])=>job),total=keys.reduce((n,k)=>n+p.population.professions[k],0);let remaining=r.added;
  keys.forEach((key,i)=>{const n=i===keys.length-1?remaining:Math.floor(r.added*(total?p.population.professions[key]/total:1/keys.length));p.population.professions[key]+=n;remaining-=n;});
 }else if(command.kind==='subsidy')for(const r of quote.changes)byId(r.provinceId).status.cash+=r.amount;
 else if(command.kind==='tax')for(const r of quote.changes)byId(r.provinceId).budget.taxRate=r.rate;
 else if(command.kind==='levy')for(const r of quote.changes){const p=byId(r.provinceId);p.status.cash-=r.amount;changeWelfare(p,'loyalty',-5);changeWelfare(p,'stability',-3);}
 postTreasury(d,c.id,{turn:state.turn,income:quote.income,expense:quote.cost,category:['subsidy','levy'].includes(command.kind)?'transfer':'oneOff',reason:quote.title,key:`revenue:${command.id}`});next.stats.treasury=c.fiscal.treasury;
 const receipt={id:command.id,turn:state.turn,kind:quote.kind,title:quote.title,cost:quote.cost,income:quote.income,treasuryBefore:quote.treasuryBefore,treasuryAfter:quote.treasuryAfter,lines:quote.lines};
 d.fiscalActions.nextId++;d.fiscalActions.records.unshift(receipt);d.fiscalActions.records=d.fiscalActions.records.slice(0,100);
 validateDomestic(d);return {state:next,receipt};
}
export function projectedTax(p,country,percent){const copy={...p,budget:{...p.budget,taxRate:percent/100}};return provinceBudget(copy,country).tax;}
