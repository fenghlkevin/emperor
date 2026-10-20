import {resourceShortage} from './action-feedback.mjs';
// Actual inventory ledger. Old saves acquire a baseline on their first real
// grain movement; no past receipt or opening balance is reconstructed.
const integer=n=>Number.isSafeInteger(n)&&n>=0;
const categories=new Set(['tax','production','consumption','storage','purchase','transfer','disaster','event']);
export function postGrain(p,{turn,income=0,expense=0,category,reason,key}) {
 if(!integer(turn)||turn<1||!integer(income)||!integer(expense)||!categories.has(category)||
  typeof reason!=='string'||!reason||reason.length>160||typeof key!=='string'||!key||key.length>200)
  throw Error('粮食流水参数无效');
 const before=p.welfare.grainReserve,closing=before+income-expense;
 if(!integer(before)||closing>1e12)throw Error('粮食库存超出有效范围');
 if(closing<0)throw Error(resourceShortage(reason,'粮食库存',expense,before+income,'石'));
 validateGrainAccount(p,turn);
 const account=p.grainAccounting??{version:1,periods:[]};
 let row=account.periods[0];
 if(row?.turn>turn)throw Error('不能改写已封存粮食旬账');
 if(row?.turn===turn&&row.keys.includes(key))throw Error('粮食交易已入账');
 if(row?.turn===turn&&row.keys.length>=4096)throw Error('本旬粮食交易已达上限');
 if(!row||row.turn!==turn){row={turn,opening:before,income:0,expense:0,net:0,closing:before,keys:[],entries:[],carried:{income:0,expense:0}};account.periods.unshift(row);account.periods=account.periods.slice(0,36);}
 const entry={key,category,reason,income,expense,before,after:closing};
 row.keys.push(key);row.entries.push(entry);row.income+=income;row.expense+=expense;row.net=row.income-row.expense;row.closing=closing;
 if(row.entries.length>100){const old=row.entries.shift();row.carried.income+=old.income;row.carried.expense+=old.expense;}
 p.grainAccounting=account;p.welfare.grainReserve=closing;return entry;
}
export function validateGrainAccount(p,turn=Infinity) {
 const a=p.grainAccounting;if(a===undefined)return;
 const fail=()=>{throw Error('粮食流水与库存不一致');};
 if(a?.version!==1||!Array.isArray(a.periods)||!a.periods.length||a.periods.length>36)fail();
 let newer=null;
 for(const r of a.periods){
  if(!r||!['turn','opening','income','expense','closing'].every(k=>integer(r[k]))||r.turn<1||r.turn>turn||
   r.net!==r.income-r.expense||r.opening+r.net!==r.closing||!Array.isArray(r.keys)||r.keys.length>4096||
   new Set(r.keys).size!==r.keys.length||r.keys.some(k=>typeof k!=='string'||!k||k.length>200)||
   !Array.isArray(r.entries)||r.entries.length>100||!r.carried||!integer(r.carried.income)||!integer(r.carried.expense))fail();
  let income=r.carried.income,expense=r.carried.expense,balance=r.opening+income-expense;
  const seen=new Set();
  for(const e of r.entries){
   if(!e||!categories.has(e.category)||typeof e.reason!=='string'||!e.reason||e.reason.length>160||
    !r.keys.includes(e.key)||seen.has(e.key)||!['income','expense','before','after'].every(k=>integer(e[k]))||
    e.before!==balance||e.after!==e.before+e.income-e.expense)fail();
   seen.add(e.key);income+=e.income;expense+=e.expense;balance=e.after;
  }
  if(income!==r.income||expense!==r.expense||balance!==r.closing)fail();
  if(newer&&(newer.turn<=r.turn||newer.opening!==r.closing))fail();newer=r;
 }
 if(a.periods[0].closing!==p.welfare.grainReserve)fail();
}
