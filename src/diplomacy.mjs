import {initializeDynasty,royalMarriage,admitForeignRoyal} from './dynasty.mjs';
import {quoteNegotiation} from './diplomatic-negotiation.mjs';
export {quoteNegotiation} from './diplomatic-negotiation.mjs';
import {transferTreasury} from './finance.mjs';
export const RELATION_LABELS={none:'无',ally:'同盟',hostile:'敌对',nonaggression:'互不侵犯',defense:'防御同盟',protector:'保护对方',protected:'受对方保护'};
// One canonical record per unordered pair: symmetric diplomatic/trade state.
export function createDiplomacy(countries,playerCountryId){
 const rows=[];
 for(let i=0;i<countries.length;i++)for(let j=i+1;j<countries.length;j++){
  const a=countries[i],b=countries[j],legacy=a.id===playerCountryId?b.relations:b.id===playerCountryId?a.relations:'neutral';
  rows.push({countryIds:[a.id,b.id].sort(),relation:legacy==='ally'?'ally':legacy==='hostile'?'hostile':'none',friendship:50,trade:{years:0,quota:0,income:0}});
 }
 return rows;
}
export function relationBetween(domestic,a,b){return domestic.diplomacy.find(row=>row.countryIds.includes(a)&&row.countryIds.includes(b)&&a!==b);}
export function diplomaticRows(domestic,sourceId=domestic.playerCountryId){
 return domestic.countries.filter(c=>c.id!==sourceId).map(country=>({country,relationship:relationBetween(domestic,sourceId,country.id)}));
}
export function validateDiplomacy(domestic){
 const ids=new Set(domestic.countries.map(c=>c.id)),seen=new Set();
 if(!Array.isArray(domestic.royalFamily)||new Set(domestic.royalFamily.map(p=>p.id)).size!==domestic.royalFamily.length)throw Error('皇室名册无效');
 for(const p of domestic.royalFamily)if(typeof p.id!=='string'||typeof p.name!=='string'||!p.name||!['male','female'].includes(p.sex)||!Number.isInteger(p.age)||p.age<0||p.age>120||!ids.has(p.countryId)||(p.spouseCountryId!==null&&!ids.has(p.spouseCountryId)))throw Error('皇室人物无效');
 if(!Array.isArray(domestic.diplomacy)||domestic.diplomacy.length!==ids.size*(ids.size-1)/2)throw Error('外交记录不完整');
 for(const r of domestic.diplomacy){
  if(!Array.isArray(r.countryIds)||r.countryIds.length!==2||!r.countryIds.every(id=>ids.has(id))||r.countryIds[0]>=r.countryIds[1])throw Error('外交国家标识无效');
  const a=r.agreement;if(!a||!['exports','imports','settledTurns','lastTurn','tribute'].every(k=>Number.isSafeInteger(a[k])&&a[k]>=0)||!Array.isArray(a.marriages)||(a.payerId!==null&&!r.countryIds.includes(a.payerId))||(a.tribute>0&&!a.payerId))throw Error('外交协议无效');
  for(const m of a.marriages)if(typeof m.name!=='string'||!['in','out'].includes(m.direction)||!Number.isSafeInteger(m.turn)||m.turn<1)throw Error('和亲记录无效');
  if(a.lastGiftTurn!==undefined&&(!Number.isSafeInteger(a.lastGiftTurn)||a.lastGiftTurn<1))throw Error('外交赠礼记录无效');
 for(const [field,keys]of [['lastPerformance',['exportsDue','exportsPaid','importsDue','importsPaid']],['lastTribute',['due','paid']]]){const p=a[field];if(p&&(!Number.isSafeInteger(p.turn)||p.turn<1||keys.some(k=>!Number.isSafeInteger(p[k])||p[k]<0)||(field==='lastTribute'?p.paid>p.due:p.exportsPaid>p.exportsDue||p.importsPaid>p.importsDue)))throw Error('外交履约记录无效');}
 const key=r.countryIds.join('/');if(seen.has(key))throw Error('外交记录重复');seen.add(key);
  if(!Object.hasOwn(RELATION_LABELS,r.relation)||!Number.isInteger(r.friendship)||r.friendship<0||r.friendship>100)throw Error('外交关系数值无效');
  for(const key of ['years','quota','income'])if(!Number.isSafeInteger(r.trade?.[key])||r.trade[key]<0)throw Error('贸易统计无效');
 }
}

export const TREATIES={nonaggression:'互不侵犯',defense:'防御同盟',protector:'保护对方',protected:'受对方保护'};
export function initializeRites(d){
 if(!d||!Array.isArray(d.diplomacy))return d;
 d.royalFamily??=[{id:'prince-1',name:'承乾',sex:'male',age:19,countryId:d.playerCountryId,spouseCountryId:null},{id:'princess-1',name:'长乐',sex:'female',age:18,countryId:d.playerCountryId,spouseCountryId:null},{id:'princess-2',name:'永宁',sex:'female',age:16,countryId:d.playerCountryId,spouseCountryId:null}];
 for(const r of d.diplomacy)r.agreement??={exports:0,imports:0,settledTurns:0,lastTurn:0,tribute:0,payerId:null,marriages:[]};
 return d;
}
export function treatyLabel(r,source){const inverse={protector:'受对方保护',protected:'保护对方'};return source===r.countryIds[0]?RELATION_LABELS[r.relation]:(inverse[r.relation]||RELATION_LABELS[r.relation]);}
export function executeDiplomacy(state,command){
 const next=structuredClone(state),d=initializeRites(next.domestic),home=d.playerCountryId,target=command.countryId,r=relationBetween(d,home,target);
 if(!r)throw Error('请选择其他国家');
 initializeDynasty(next);
 const negotiation=quoteNegotiation(next,command);
 if(!negotiation.accepted)return {state:next,accepted:false,message:`对方拒绝：${negotiation.reason}，评议${negotiation.score}，需${negotiation.required}；原协议保留`};
 const a=r.agreement,amount=n=>{if(!Number.isSafeInteger(n)||n<0||n>1000000)throw Error('金额须为 0–1,000,000 的整数');return n;};
 let message='';
 if(command.kind==='treaty'){if(!Object.hasOwn(TREATIES,command.treaty))throw Error('请选择条约');let type=command.treaty;if(home!==r.countryIds[0])type=({protector:'protected',protected:'protector'})[type]||type;r.relation=type;r.friendship=Math.min(100,r.friendship+10);message='条约已缔结';}
 else if(command.kind==='cancel'){if(r.relation==='none')throw Error('当前没有条约');r.relation='none';r.friendship=Math.max(0,r.friendship-10);message='条约已解除';}
 else if(command.kind==='trade'){if(r.relation==='hostile')throw Error('敌对期间不能通商');a.exports=amount(command.exports);a.imports=amount(command.imports);r.trade.quota=a.exports+a.imports;message='贸易约定已更新';}
 else if(command.kind==='tribute'||command.kind==='demand'){a.tribute=amount(command.amount);a.payerId=a.tribute?(command.kind==='tribute'?home:target):null;message=a.tribute?'年度贡银约定已登记':'年度贡银已取消';}
 else if(command.kind==='marryOut'||command.kind==='marryIn'){
 if(r.relation==='hostile')throw Error('敌对期间不能和亲');
 if(command.kind==='marryOut'){const person=royalMarriage(next,command.personId,target);a.marriages.push({name:person.name,personId:person.id,direction:'out',turn:state.turn});}
 else {const person=admitForeignRoyal(next,target);a.marriages.push({name:person.name,personId:person.royalId,direction:'in',turn:state.turn});}
 r.friendship=Math.min(100,r.friendship+15);message='和亲已登记';
 }else throw Error('未知外交事务');
 return {state:next,accepted:true,message};
}
export function settleDiplomacy(d,turn){
 initializeRites(d);
 const byId=id=>d.countries.find(c=>c.id===id);
 function transfer(from,to,amount,key,reason){const cash=byId(from).fiscal.treasury,paid=Math.min(cash,amount);transferTreasury(d,from,to,paid,{turn,key,reason,allowDebt:false});return paid;}
 for(const r of d.diplomacy){const a=r.agreement;if(a.lastTurn>=turn||(!a.exports&&!a.imports&&!a.tribute))continue;a.lastTurn=turn;const home=d.playerCountryId;if(!r.countryIds.includes(home))continue;const other=r.countryIds.find(id=>id!==home);
 if(r.relation!=='hostile'&&(a.exports||a.imports)){const received=transfer(other,home,a.exports,`trade:${turn}:${other}:exports`,'通商出口入账');const paidImports=transfer(home,other,a.imports,`trade:${turn}:${other}:imports`,'通商进口支出');a.lastPerformance={turn,exportsDue:a.exports,exportsPaid:received,importsDue:a.imports,importsPaid:paidImports};if(received<a.exports||paidImports<a.imports)r.friendship=Math.max(0,r.friendship-5);a.settledTurns++;r.trade.quota=a.exports+a.imports;r.trade.income+=received;r.trade.years=Math.floor(a.settledTurns/36);}
 if((turn-1)%36===0&&a.tribute&&a.payerId){const paid=transfer(a.payerId,r.countryIds.find(id=>id!==a.payerId),a.tribute,`tribute:${turn}:${other}`,'年度贡银');a.lastTribute={turn,due:a.tribute,paid};if(paid<a.tribute)r.friendship=Math.max(0,r.friendship-10);}
 }
}
