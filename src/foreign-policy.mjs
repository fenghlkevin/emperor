import {balanced,REALM_ECONOMIC_TIERS,REALM_TEMPLATES} from './development-balance.mjs';
import {countrySummary} from './domestic.mjs';
// Political aims are explicit; spelling a realm's ID never determines aggression.
export const STRATEGIC_PROFILES={
 expansionist:{aggression:.75,militaryPremium:.002},
 regional:{aggression:.4,militaryPremium:.001},
 cautious:{aggression:.15,militaryPremium:0}
};
const expansionist=['steppe','east-turk','west-turk','tubo','khitan','rome','arabia','franks'];
const regional=['persia','india','nanzhao','korea','japan','uyghur','xi','champa','chenla','srivijaya','slavs','maghreb'];
export const realmProfile=id=>expansionist.includes(id)?'expansionist':regional.includes(id)?'regional':'cautious';
export function foreignOutlook(d,c,turn){
 const q=countrySummary(d,c.id,turn),rows=c.ledger.filter(r=>!r.legacy).slice(0,12);
 const recurring=rows.reduce((n,r)=>n+(r.recurring?.expense??0)-(r.recurring?.income??0),0)/Math.max(1,rows.length);
 const net=q.net-recurring,reserve=Math.max(3000,q.expenditure*12),food=c.foodSettlement;
 return {net,expense:q.expenditure,reserve,grainRecruitLimit:food?Math.max(0,Math.floor((c.fiscal.grain-food.need*12)/.06)):0,grainSafe:!food||food.shortfall===0&&c.fiscal.grain>=food.need*12,
  militaryBudget:net>=25&&!c.fiscal.debt?Math.max(0,Math.min(net*3,c.fiscal.treasury-reserve)):0,
  recoveryBudget:Math.max(0,c.fiscal.treasury-Math.max(1000,q.expenditure*3))};
}
export function foreignMilitaryTarget(d,p){
 const n=d.strategy?.nations[p.countryId],profile=STRATEGIC_PROFILES[n?.profile??realmProfile(p.countryId)],base=REALM_TEMPLATES[REALM_ECONOMIC_TIERS[p.countryId]??'frontier'].soldiers;
 return Math.floor(p.population.total*(base+profile.militaryPremium));
}
export function mayExpand(d,c,turn){
 if(!balanced(d))return true;
 const q=foreignOutlook(d,c,turn);return q.net>25&&!c.fiscal.debt&&q.grainSafe&&c.fiscal.treasury>=q.reserve;
}
