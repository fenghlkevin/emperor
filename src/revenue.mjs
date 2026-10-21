import {quoteShortage} from './action-feedback.mjs';
import {quoteDisasterSubsidy,applyDisasterSubsidy} from './disasters.mjs';
import {assignArrivalJobs} from './labor.mjs';
import {admittedPopulation} from './city-capacity.mjs';
import {changeWelfare} from './building-effects.mjs';
import {postTreasury} from './finance.mjs';
import {countrySummary,provinceBudget,validateDomestic,INDUSTRIES} from './domestic.mjs';
export const CENSUS_COST=5000;
export const REVENUE_TABS=[['census','招纳流民入籍'],['purchase','武装购买'],['subsidy','中央补助'],['tax','各州税率']];
const integer=(n,min=0,max=1000000000)=>{if(!Number.isSafeInteger(n)||n<min||n>max)throw Error('请输入范围内的整数');return n;};
const owned=state=>{const d=state.domestic,c=d.countries.find(c=>c.id===d.playerCountryId);return c.provinceIds.map(id=>d.provinces.find(p=>p.id===id&&p.countryId===c.id));};
function checkedEntries(values,provinces,all=false){
 if(!values||typeof values!=='object'||Array.isArray(values))throw Error('缺少各州设置');
 const ids=new Set(provinces.map(p=>p.id));if(Object.keys(values).some(id=>!ids.has(id))||(all&&Object.keys(values).length!==ids.size))throw Error('只能设置本国各州');
 return provinces.filter(p=>Object.hasOwn(values,p.id)).map(p=>[p,values[p.id]]);
}
export function quoteRevenue(state,command){
 const provinces=owned(state),s=countrySummary(state.domestic),kind=command.kind;
 if(kind==='levy')throw Error('全国钱粮统一结算，已取消地方拨款与府库加征');
 let cost=0,income=0,lines=[],changes=[];
 if(kind==='census'){
  cost=CENSUS_COST;changes=provinces.map(p=>({provinceId:p.id,added:admittedPopulation(p,Math.max(1,Math.floor(p.population.total*.01)))}));
  if(!changes.some(r=>r.added))throw Error('各州已达人口超载上限，请先扩建或迁出人口');
  lines=changes.map(r=>`${provinces.find(p=>p.id===r.provinceId).name}：新登记 ${r.added.toLocaleString('zh-CN')} 人`);
 }else if(kind==='subsidy'){
  changes=checkedEntries(command.amounts,provinces).map(([p,n])=>{
   const requested=integer(n),before=p.status.livingStandard;
   const relief=quoteDisasterSubsidy(p,state.turn,requested);
   if(relief){const amount=relief.shortened?relief.minimum:0;return {provinceId:p.id,amount,before,after:before,disaster:quoteDisasterSubsidy(p,state.turn,amount)};}
   // Explicit project adaptation: 0.01 liang per resident raises living by one point.
   const beforeHundredths=Math.round(before*100),population=BigInt(p.population.total);
   const limit=Number((BigInt(10000-beforeHundredths)*population+9999n)/10000n),amount=Math.min(requested,limit);
   const after=Math.min(100,(beforeHundredths+Math.round(amount*10000/p.population.total))/100);
   return {provinceId:p.id,amount,before,after,disaster:quoteDisasterSubsidy(p,state.turn,amount)};
  }).filter(r=>r.amount>0&&(r.after>r.before||r.disaster?.shortened));
  if(!changes.length){
   const entry=checkedEntries(command.amounts,provinces).find(([,n])=>n>0);
   if(!entry)throw Error('请设置有效补助：先选择州郡并填写大于0的补助金额。');
   const [p,n]=entry,relief=quoteDisasterSubsidy(p,state.turn,n),fmt=n=>n.toLocaleString('zh-CN');
   const reason=relief?(relief.before<=1?'灾期仅剩1旬，不能再缩短。':p.disaster.lastReliefTurn===state.turn?'本旬已赈灾，每州每旬仅可办理一次。':`赈灾至少需${fmt(relief.minimum)}两，已填${fmt(n)}两，缺${fmt(relief.minimum-n)}两。`):p.status.livingStandard>=100?'生活水平已达100，不能继续提高。':`提高生活水平至少需${fmt(Math.max(1,Math.ceil(p.population.total/20000)))}两，已填${fmt(n)}两。`;
   throw Error(`未形成有效补助：${p.name}${reason}`);
  }
  cost=changes.reduce((n,r)=>n+r.amount,0);
  lines=changes.map(r=>`${provinces.find(p=>p.id===r.provinceId).name}：国库支银${r.amount}两${r.disaster?`，灾期${r.disaster.before} → ${r.disaster.after}旬；生活水平不变`:`，生活水平${r.before} → ${r.after}；直接惠民，不形成地方库存`}`);
 }else if(kind==='tax'){
  changes=checkedEntries(command.rates,provinces,true).map(([p,n])=>({provinceId:p.id,before:p.budget.taxRate,rate:integer(n,0,50)/100})).filter(r=>Math.abs(r.rate-r.before)>1e-9);
  if(!changes.length)throw Error('各州税率与原来相同');
  lines=changes.map(r=>`${provinces.find(p=>p.id===r.provinceId).name}：税率由 ${Math.round(r.before*100)}% 调为 ${Math.round(r.rate*100)}%`);
 }else throw Error('户部政令无效');
 if(!Number.isSafeInteger(cost)||!Number.isSafeInteger(income))throw Error('金额超出范围');
 return {kind,title:REVENUE_TABS.find(([key])=>key===kind)[1],cost,income,lines,changes,treasuryBefore:s.country.fiscal.treasury,treasuryAfter:s.country.fiscal.treasury-cost+income,canAfford:s.country.fiscal.treasury>=cost};
}
export function executeRevenue(state,command){
 integer(command.id,1,Number.MAX_SAFE_INTEGER);if(command.id!==state.domestic.fiscalActions.nextId)throw Error('政令已执行或数据已更新，请重新拟旨');
 const quote=quoteRevenue(state,command);if(!quote.canAfford)throw Error(quoteShortage(quote,quote.title??'户部政令'));
 const next=structuredClone(state),d=next.domestic,c=d.countries.find(c=>c.id===d.playerCountryId),provinces=owned(next);
 const byId=id=>provinces.find(p=>p.id===id);
 if(command.kind==='census')for(const r of quote.changes){
  const p=byId(r.provinceId);p.population.total+=r.added;
  // Register new productive residents without changing existing soldiers/militia.
  const keys=INDUSTRIES.map(([, ,job])=>job),total=keys.reduce((n,k)=>n+p.population.professions[k],0);let remaining=r.added;
  keys.forEach((key,i)=>{const n=i===keys.length-1?remaining:Math.floor(r.added*(total?p.population.professions[key]/total:1/keys.length));if(p.industryLabor)assignArrivalJobs(p,{[key]:n});else p.population.professions[key]+=n;remaining-=n;});
 }
 else if(command.kind==='subsidy')for(const r of quote.changes){const p=byId(r.provinceId);p.status.livingStandard=r.after;applyDisasterSubsidy(d,p,state.turn,r.disaster);}
 else if(command.kind==='tax')for(const r of quote.changes)byId(r.provinceId).budget.taxRate=r.rate;

 postTreasury(d,c.id,{turn:state.turn,income:quote.income,expense:quote.cost,category:'oneOff',reason:quote.title,key:`revenue:${command.id}`});next.stats.treasury=c.fiscal.treasury;
 const receipt={id:command.id,turn:state.turn,kind:quote.kind,title:quote.title,cost:quote.cost,income:quote.income,treasuryBefore:quote.treasuryBefore,treasuryAfter:quote.treasuryAfter,lines:quote.lines};
 d.fiscalActions.nextId++;d.fiscalActions.records.unshift(receipt);d.fiscalActions.records=d.fiscalActions.records.slice(0,100);
 validateDomestic(d);return {state:next,receipt};
}
export function projectedTax(p,country,percent){const copy={...p,budget:{...p.budget,taxRate:percent/100}};return provinceBudget(copy,country).tax;}
