import {balanced} from './development-balance.mjs';
import {outputFor} from './economy.mjs';
import {borderingCountries} from './war.mjs';
import {nationalGrain,postNationalGrain,nationalFoodForecast} from './national-resources.mjs';
import {transferTreasury} from './finance.mjs';
export const MARKET_SURCHARGE_RATE=.5;
export function marketCapacity(d,a,b){
 const capacity=id=>d.provinces.filter(p=>p.countryId===id).reduce((n,p)=>n+outputFor(p,'commerce')+p.buildings.markets*120,0);
 return Math.max(100,Math.round(Math.min(capacity(a),capacity(b))*1.5));
}
export function grainMarketAccess(d,a,b,turn){
 const relation=d.diplomacy.find(r=>r.countryIds.includes(a)&&r.countryIds.includes(b)&&a!==b),agreedQuota=(relation?.agreement?.exports??0)+(relation?.agreement?.imports??0),quota=balanced(d)?Math.min(agreedQuota,marketCapacity(d,a,b)):agreedQuota;
 const adjacent=borderingCountries(d,a).some(c=>c.id===b),open=Boolean(relation&&relation.relation!=='hostile'&&quota>0);
 const spent=relation?.trade?.grainMarket?.turn===turn?relation.trade.grainMarket.spent:0;
 return {relation,adjacent,open,allowed:adjacent&&open,quota,agreedQuota,spent,remaining:Math.max(0,quota-spent)};
}
export function quoteMarketPrice(d,buyer,seller,turn,baseCost){
 const access=grainMarketAccess(d,buyer,seller,turn);
 if(!access.adjacent)throw Error('粮食互市只限接壤邻国');
 if(!access.open)throw Error('双方尚未开放互市，请先由礼部订立互市额度');
 const excess=Math.max(0,baseCost-access.remaining),surcharge=Math.ceil(excess*MARKET_SURCHARGE_RATE);
 return {quota:access.quota,spent:access.spent,remaining:access.remaining,baseCost,excess,surcharge,cost:baseCost+surcharge};
}
export function recordMarketTrade(d,{buyer,seller,turn,amount,cost,baseCost,surcharge,quota,spent,remaining,key}){
 const {relation}=grainMarketAccess(d,buyer,seller,turn);if(!relation)throw Error('互市协议不存在');
 if(relation.trade.grainMarket?.turn!==turn)relation.trade.grainMarket={turn,spent:0,records:[]};
 const m=relation.trade.grainMarket;if(m.records.some(r=>r.key===key))throw Error('互市交易已入账');
 m.spent+=cost;m.records.push({buyer,seller,amount,cost,baseCost,surcharge,quota,spent,remaining,key});
 const a=relation.agreement;if(a.lastPerformance?.turn!==turn)a.lastPerformance={turn,exportsDue:0,exportsPaid:0,importsDue:0,importsPaid:0};
 const prefix=seller===d.playerCountryId?'exports':'imports';a.lastPerformance[prefix+'Due']+=cost;a.lastPerformance[prefix+'Paid']+=cost;
 relation.trade.quota=(relation.agreement.exports??0)+(relation.agreement.imports??0);
 relation.trade.income+=seller===d.playerCountryId?cost:0;
}
// Foreign countries buy only to cover an actual food shortage, never empty the
// player's reserve. The pair's shared turnover includes both trade directions.
export function settleForeignGrainPurchases(d,turn){
 if(balanced(d)){for(const c of d.countries.filter(c=>c.id!==d.playerCountryId&&c.provinceIds.length))purchaseForeignRelief(d,c.id,turn);return;}
 const home=d.playerCountryId;
 for(const other of borderingCountries(d,home).toSorted((a,b)=>a.id.localeCompare(b.id))){
  const access=grainMarketAccess(d,home,other.id,turn);if(!access.allowed)continue;
  const a=access.relation.agreement;if(a.lastGrainPurchaseTurn>=turn)continue;a.lastGrainPurchaseTurn=turn;
  const supply=nationalFoodForecast(d,turn+1,home),need=nationalFoodForecast(d,turn+1,other.id),reserve=supply.need*2;
  const available=Math.max(0,nationalGrain(d,home)-reserve),wanted=Math.min(available,need.shortfall,1000000);
  if(wanted<1)continue;
  let lo=0,hi=wanted;while(lo<hi){const mid=Math.ceil((lo+hi)/2),q=quoteMarketPrice(d,other.id,home,turn,mid*2);if(q.cost<=other.fiscal.treasury)lo=mid;else hi=mid-1;}
  if(!lo)continue;
  const q=quoteMarketPrice(d,other.id,home,turn,lo*2),key=`grain-export:${turn}:${other.id}`;
  transferTreasury(d,other.id,home,q.cost,{turn,key,reason:'互市购粮',allowDebt:false});
  postNationalGrain(d,home,{turn,expense:lo,category:'transfer',reason:'互市售粮',key:key+':out'});
  postNationalGrain(d,other.id,{turn,income:lo,category:'purchase',reason:'互市购粮',key:key+':in'});
  recordMarketTrade(d,{buyer:other.id,seller:home,turn,amount:lo,...q,key});

 }
}
export function purchaseForeignRelief(d,buyer,turn,budget=1000){
 const buyerCountry=d.countries.find(c=>c.id===buyer),need=nationalFoodForecast(d,turn+1,buyer);
 if(!need.shortfall)return 0;
 const sellers=borderingCountries(d,buyer).filter(c=>grainMarketAccess(d,buyer,c.id,turn).allowed).sort((a,b)=>nationalGrain(d,b.id)-nationalGrain(d,a.id));
 for(const seller of sellers){const relation=grainMarketAccess(d,buyer,seller.id,turn).relation,key=`foreign-relief:${turn}:${buyer}:${seller.id}`;if(relation.trade.grainMarket?.turn===turn&&relation.trade.grainMarket.records.some(r=>r.key===key))continue;const f=nationalFoodForecast(d,turn+1,seller.id),available=Math.max(0,nationalGrain(d,seller.id)-f.need*6),limit=Math.min(need.shortfall,available);
  let lo=0,hi=limit;while(lo<hi){const mid=Math.ceil((lo+hi)/2),q=quoteMarketPrice(d,buyer,seller.id,turn,mid*2);if(q.cost<=Math.min(budget,buyerCountry.fiscal.treasury))lo=mid;else hi=mid-1;}
  if(!lo)continue;const q=quoteMarketPrice(d,buyer,seller.id,turn,lo*2);
  transferTreasury(d,buyer,seller.id,q.cost,{turn,key,reason:'互市救急购粮'});postNationalGrain(d,seller.id,{turn,expense:lo,category:'transfer',reason:'互市售粮',key:key+':out'});postNationalGrain(d,buyer,{turn,income:lo,category:'purchase',reason:'互市救济购粮',key:key+':in'});recordMarketTrade(d,{buyer,seller:seller.id,turn,amount:lo,...q,key});return lo;
 }
 return 0;
}
export function validateGrainMarkets(d){
 for(const r of d.diplomacy){const m=r.trade.grainMarket;if(!m)continue;
  if(!Number.isSafeInteger(m.turn)||m.turn<1||!Number.isSafeInteger(m.spent)||m.spent<0||!Array.isArray(m.records))throw Error('互市成交记录无效');
  let spent=0;const keys=new Set();for(const e of m.records){if(!r.countryIds.includes(e.buyer)||!r.countryIds.includes(e.seller)||e.buyer===e.seller||!['amount','cost','baseCost','surcharge','quota','spent','remaining'].every(k=>Number.isSafeInteger(e[k])&&e[k]>=0)||e.amount<1||e.cost!==e.baseCost+e.surcharge||e.spent!==spent||e.remaining!==Math.max(0,e.quota-e.spent)||e.surcharge!==Math.ceil(Math.max(0,e.baseCost-e.remaining)*.5)||typeof e.key!=='string'||keys.has(e.key))throw Error('互市交易明细无效');keys.add(e.key);spent+=e.cost;}
  if(spent!==m.spent)throw Error('互市成交额不符');
  if(r.agreement.lastGrainPurchaseTurn!==undefined&&(!Number.isSafeInteger(r.agreement.lastGrainPurchaseTurn)||r.agreement.lastGrainPurchaseTurn<1))throw Error('互市结算旬无效');
 }
}
