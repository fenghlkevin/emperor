import {coordinationEffect,procurementEffect,purchaseCost,validOfficeSource} from './central-office-effects.mjs';
import {localAuthority,localPolicy} from './local-autonomy.mjs';
import {welfareValue,buildingMarginal} from './building-effects.mjs';
import {CONSTRUCTION_PLANS} from './construction.mjs';
import {activeDisaster} from './disasters.mjs';
import {officialEffectSource} from './official-effects.mjs';
// Move permissions to spend existing funds, never money or population.
export function prepareCoordination(d,turn,cities,forecast){
 const g=d.governance;if(g.coordination?.turn===turn)return;
 const e=coordinationEffect(d);if(!e.source.id)return;
 const purchase=procurementEffect(d),shortageCity=cities.find(p=>localAuthority(d,p).civil&&forecast(p).shortfall>0);
 const rows=cities.filter(p=>p.localPolicy).map(p=>{
  const authority=localAuthority(d,p),f=forecast(p),budget=localPolicy(p).budget,profile=officialEffectSource(d,`${p.id}-governor`,{provinceId:p.id,role:'governor'});
  let need=0,urgent=false;
  if(f.shortfall){if(p===shortageCity){const cost=purchaseCost(Math.min(f.shortfall,f.purchaseRemaining),2,purchase).cost;need=cost+Math.ceil(cost*profile.lossRate);urgent=true;}}
  else if(!activeDisaster(p,turn)){
   if(authority.civil&&!p.construction.project){const key=welfareValue(p,'security')<60?'yamen':welfareValue(p,'stability')<60?'temples':welfareValue(p,'loyalty')<60?'palaces':null;
    if(key&&buildingMarginal(p,key,turn)>0){const cost=CONSTRUCTION_PLANS[key].cost;need=cost+Math.ceil(cost*profile.lossRate);urgent=!['walls','palaces'].includes(key);}
    else need=1000; // Protect likely routine farming/building expenditure in donor states.
   }
   if(authority.military&&p.population.professions.soldiers>0)need+=1100;
  }
  const spent=g.records.filter(r=>r.turn===turn&&r.provinceId===p.id).reduce((n,r)=>n+r.cost,0);
  return {p,budget,need,urgent,food:p===shortageCity,spare:authority.civil||authority.military?Math.max(0,budget-Math.max(need,spent)):0};
 });
 let left=Math.min(Math.floor(g.turnBudget*e.rate),Math.max(0,g.turnBudget-g.spent)),targets=0;
 const transfers=[];
 for(const row of rows.filter(r=>r.urgent&&r.need>r.budget)){
  if(!left||targets>=e.limit)break;let missing=row.need-row.budget,received=0;
  if(!row.food&&Math.min(left,rows.filter(r=>r!==row&&!r.urgent).reduce((n,r)=>n+r.spare,0))<missing)continue;
  for(const donor of rows){if(donor===row||donor.urgent||donor.spare<=0)continue;const amount=Math.min(left,missing,donor.spare);if(!amount)continue;transfers.push({fromId:donor.p.id,toId:row.p.id,amount});donor.spare-=amount;missing-=amount;left-=amount;received+=amount;if(!missing||!left)break;}
  if(received)targets++;
 }
 g.coordination={turn,budget:g.turnBudget,source:e.source,transfers};
 for(const r of transfers){const from=d.provinces.find(p=>p.id===r.fromId),to=d.provinces.find(p=>p.id===r.toId),reason=`宰相${e.source.name}协调：${from.name}预计闲置额度${r.amount}两调给${to.name}，全国预算不增加`;
  g.records.unshift({turn,provinceId:r.toId,cost:0,reason});d.personnel.history.unshift(`第${turn}旬：${reason}`);
 }
 g.records=g.records.slice(0,100);d.personnel.history=d.personnel.history.slice(0,100);
}
export function coordinatedBudget(d,p,turn){const rows=d.governance.coordination?.turn===turn?d.governance.coordination.transfers:[];return localPolicy(p).budget+rows.reduce((n,r)=>n+(r.toId===p.id?r.amount:0)-(r.fromId===p.id?r.amount:0),0);}
export function validateCoordination(d,turn){const c=d.governance.coordination;if(c===undefined)return;
 if(!Number.isSafeInteger(c.budget)||c.budget<0||c.budget>1000000||!Number.isSafeInteger(c.turn)||c.turn<1||c.turn>turn||!validOfficeSource(c.source)||!c.source.id||!Array.isArray(c.transfers)||c.transfers.length>d.provinces.length*3)throw Error('宰相协调记录无效');
 const keys=new Set();for(const r of c.transfers){const key=r.fromId+':'+r.toId;if(keys.has(key)||r.fromId===r.toId||![r.fromId,r.toId].every(id=>d.provinces.some(p=>p.id===id))||!Number.isSafeInteger(r.amount)||r.amount<1)throw Error('宰相调剂额度无效');keys.add(key);}
 if(new Set(c.transfers.map(r=>r.toId)).size>1+Math.floor(c.source.ability/40)||c.transfers.reduce((n,r)=>n+r.amount,0)>Math.floor(c.budget*(.1+c.source.ability*.002)))throw Error('宰相调剂超出上限');
}
