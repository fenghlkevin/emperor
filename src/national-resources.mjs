import {postGrain,validateGrainAccount} from './grain-finance.mjs';
import {postTreasury,validateFinance} from './finance.mjs';
import {GRAIN_EXCESS_LOSS_RATE} from './balance-rules.mjs';
import {quoteProvinceResources} from './province-resources.mjs';
import {grainStorage} from './grain-storage.mjs';
import {outputFor,legacyFoodOutput} from './economy.mjs';
import {changeWelfare} from './building-effects.mjs';

export const nationalCountry=(d,id=d.playerCountryId)=>d.countries.find(c=>c.id===id);
export const nationalGrain=(d,id=d.playerCountryId)=>nationalCountry(d,id).fiscal.grain;
export function postNationalGrain(d,id,entry){
 const c=nationalCountry(d,id),account={welfare:{grainReserve:c.fiscal.grain},grainAccounting:c.grainAccounting};
 const result=postGrain(account,entry);c.fiscal.grain=account.welfare.grainReserve;c.grainAccounting=account.grainAccounting;return result;
}
// Schema-8 saves are consolidated once. Historical local receipts remain historical;
// no accessor or duplicate province inventory survives serialization.
export function initializeNationalResources(d,turn=1){
 if(d.nationalResourcesVersion!==undefined){if(d.nationalResourcesVersion!==1)throw Error('全国钱粮版本不支持');return d;}
 validateFinance(d);
 for(const p of d.provinces){if(!Number.isSafeInteger(p.welfare.grainReserve)||p.welfare.grainReserve<0||p.welfare.grainReserve>1e12||!Number.isSafeInteger(p.status.cash))throw Error('旧档地方钱粮无效');validateGrainAccount(p,turn);}
 for(const c of d.countries){
  const ps=d.provinces.filter(p=>p.countryId===c.id);
  const grain=ps.reduce((n,p)=>n+p.welfare.grainReserve,0),cash=ps.reduce((n,p)=>n+p.status.cash,0);
  if(!Number.isSafeInteger(grain)||grain<0||grain>1e12||!Number.isSafeInteger(cash))throw Error('旧档地方钱粮无效');
  c.fiscal.grain=grain;
  if(cash&&!c.ledger.length){const balance=c.fiscal.treasury+cash;c.fiscal.treasury=Math.max(0,balance);c.fiscal.debt+=Math.max(0,-balance);}
  else if(cash)postTreasury(d,c.id,{turn,income:Math.max(0,cash),expense:Math.max(0,-cash),allowDebt:true,category:'transfer',reason:'地方府库并入全国国库',key:'national-resources:migration'});
 }
 for(const p of d.provinces){delete p.welfare.grainReserve;delete p.status.cash;delete p.grainAccounting;if(p.foodRelief)p.foodRelief.purchase=null;}
 d.nationalResourcesVersion=1;return d;
}
export function validateNationalResources(d,turn=Infinity){
 if(d.nationalResourcesVersion!==1)throw Error('全国钱粮未初始化');
 for(const c of d.countries){if(c.foodSettledTurn!==undefined&&(!Number.isSafeInteger(c.foodSettledTurn)||c.foodSettledTurn<1||c.foodSettledTurn>turn))throw Error('全国供粮旬序无效');if(!Number.isSafeInteger(c.fiscal.grain)||c.fiscal.grain<0||c.fiscal.grain>1e12)throw Error('全国存粮无效');validateGrainAccount({welfare:{grainReserve:c.fiscal.grain},grainAccounting:c.grainAccounting},turn);}
 for(const c of d.countries){const q=c.foodSettlement;if(q===undefined){if(c.foodSettledTurn!==undefined)throw Error('全国供粮记录缺失');continue;}
  const fail=()=>{throw Error('全国供粮记录不平衡');};
  if(!q||q.turn!==c.foodSettledTurn||!['opening','grain','protectedStock','storageLoss','produced','need','consumed','shortfall','closing'].every(k=>Number.isSafeInteger(q[k])&&q[k]>=0)||q.opening!==q.grain||q.storageLoss>q.opening||q.opening-q.storageLoss+q.produced-q.consumed!==q.closing||q.need-q.consumed!==q.shortfall||!Array.isArray(q.provinces)||new Set(q.provinces.map(p=>p.id)).size!==q.provinces.length)fail();
  for(const row of q.provinces){if(!d.provinces.some(p=>p.id===row.id)||!['produced','need','consumed','shortfall'].every(k=>Number.isSafeInteger(row[k])&&row[k]>=0)||row.need-row.consumed!==row.shortfall)fail();}
  for(const key of ['produced','need','consumed','shortfall'])if(q.provinces.reduce((n,row)=>n+row[key],0)!==q[key])fail();
  const allocated=allocateGrain(q.provinces,q.consumed);for(const [i,row] of allocated.entries())if(row.consumed!==q.provinces[i].consumed)fail();
 }
 for(const p of d.provinces)if('grainReserve' in p.welfare||'cash' in p.status||p.grainAccounting!==undefined)throw Error('全国钱粮不能同时保留地方库存');
}
// Largest-remainder allocation is deterministic and conserves every shi.
export function allocateGrain(rows,available){
 const need=rows.reduce((n,r)=>n+r.need,0),supply=Math.min(available,need);
 if(!need)return rows.map(r=>({...r,consumed:0,shortfall:0}));
 const result=rows.map(r=>({...r,consumed:Number(BigInt(supply)*BigInt(r.need)/BigInt(need)),remainder:Number(BigInt(supply)*BigInt(r.need)%BigInt(need))}));
 let left=supply-result.reduce((n,r)=>n+r.consumed,0);
 for(const r of [...result].sort((a,b)=>b.remainder-a.remainder||a.id.localeCompare(b.id)))if(left>0&&r.consumed<r.need){r.consumed++;left--;}
 return result.map(({remainder,...r})=>({...r,shortfall:r.need-r.consumed}));
}
export function nationalFoodForecast(d,turn,id=d.playerCountryId){
 const ps=d.provinces.filter(p=>p.countryId===id),opening=nationalGrain(d,id);
 const rows=ps.map(p=>{const shadow={...p,welfare:{...p.welfare,grainReserve:0}},resource=p.resourceRulesVersion===1?quoteProvinceResources(shadow,{turn}):null;return {id:p.id,name:p.name,resource,produced:resource?resource.grain.tax:legacyFoodOutput(p,turn),need:resource?resource.grain.need:Math.round(p.population.total*.005)};});
 const protectedStock=ps.reduce((n,p)=>n+grainStorage(p,turn,0).protectedStock,0),storageLoss=Math.min(opening,Math.ceil(Math.max(0,opening-protectedStock)*GRAIN_EXCESS_LOSS_RATE));
 const produced=rows.reduce((n,r)=>n+r.produced,0),need=rows.reduce((n,r)=>n+r.need,0),available=opening-storageLoss+produced;
 const provinces=allocateGrain(rows,available).map(row=>{if(row.resource){const g=row.resource.grain;Object.assign(g,{opening:0,storageLoss:0,consumed:row.consumed,shortfall:row.shortfall,closing:0,nationalIn:Math.max(0,row.consumed-g.tax),nationalOut:Math.max(0,g.tax-row.consumed)});}return row;});
 return {turn,opening,grain:opening,protectedStock,storageLoss,produced,need,consumed:Math.min(available,need),shortfall:Math.max(0,need-available),closing:Math.max(0,available-need),provinces};
}
export function settleNationalFood(d,turn,id=d.playerCountryId){
 const c=nationalCountry(d,id);if(c.foodSettledTurn>=turn)return;
 const q=nationalFoodForecast(d,turn,id);
 postNationalGrain(d,id,{turn,expense:q.storageLoss,category:'storage',reason:'全国官粮陈粮损耗',key:`national:${turn}:storage`});
 postNationalGrain(d,id,{turn,income:q.produced,category:'tax',reason:'各州粮赋统一入库',key:`national:${turn}:tax`});
 postNationalGrain(d,id,{turn,expense:q.consumed,category:'consumption',reason:'全国统一供粮与赈济',key:`national:${turn}:supply`});
 for(const row of q.provinces){const p=d.provinces.find(p=>p.id===row.id);
  p.foodRelief.lastSettlement={turn,opening:0,produced:row.consumed,need:row.need,consumed:row.consumed,shortfall:row.shortfall,closing:0,national:true};
  if(row.resource)p.resourceSettlement=structuredClone(row.resource);
  if(row.shortfall){changeWelfare(p,'stability',-2);changeWelfare(p,'loyalty',-1);}
 }
 c.foodSettledTurn=turn;c.foodSettlement=q;return q;
}
