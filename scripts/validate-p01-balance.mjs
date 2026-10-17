import {newGame,advance,validateSave} from '../src/game.mjs';
import {executeIndustry} from '../src/industry.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {foodForecast} from '../src/food-relief.mjs';
import {writeFileSync} from 'node:fs';
function rng(seed){let n=seed;return ()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);}
function step(s,random){const original=Math.random;Math.random=random;try{return advance(s);}finally{Math.random=original;}}
const report={rules:'2026-10-16 P0/P1 trial',scenarios:[],development:[]};
for(const mode of ['manual','delegated','relief-stress'])for(const seed of [1,7,41]){
 let s=newGame('经营验收');s.domestic.disasters.seed=seed;for(const o of s.domestic.justice.officials)o.loyalty=100;
 if(mode!=='manual')s.domestic.personnel.delegations=s.domestic.countries[0].provinceIds.slice();
 if(mode==='relief-stress'){for(const p of s.domestic.provinces.filter(p=>p.countryId==='sheng')){p.welfare.grainReserve=0;p.economy.agriculture.productivity=10;}s.domestic.governance.budget=2000;}
 const random=rng(seed),rows=[];let spent=0,minTreasury=Infinity,totalShortfall=0;for(let n=1;n<=108;n++){step(s,random);const d=s.domestic,home=d.countries[0];spent+=d.governance.spent;minTreasury=Math.min(minTreasury,home.fiscal.treasury);totalShortfall+=d.provinces.filter(p=>p.countryId==='sheng').reduce((a,p)=>a+(p.foodRelief.lastSettlement?.shortfall??0),0);if(d.governance.spent>d.governance.budget)throw Error('治理预算超限');if(n%36===0){s=validateSave(JSON.parse(JSON.stringify(s)));const summary=countrySummary(s.domestic);rows.push({elapsed:n,treasury:home.fiscal.treasury,debt:home.fiscal.debt,grain:summary.grainReserve,stability:summary.welfare.stability,loyalty:summary.loyalty,governanceSpent:spent,totalShortfall});}}
 report.scenarios.push({mode,seed,minTreasury,rows});
}
for(const industry of ['agriculture','commerce']){let a=newGame('开发对照'),b=executeIndustry(a,{id:1,kind:'develop',provinceId:'hebei',industry,area:500}).state;for(const s of [a,b])for(const o of s.domestic.justice.officials)o.loyalty=100;
 const ra=rng(19),rb=rng(19);let breakeven=null;for(let n=1;n<=108;n++){step(a,ra);step(b,rb);if(b.domestic.countries[0].fiscal.treasury>=a.domestic.countries[0].fiscal.treasury&&breakeven===null)breakeven=n;}
 report.development.push({industry,cost:1000,breakevenWithin108:breakeven,treasuryDifference:b.stats.treasury-a.stats.treasury,grainDifference:countrySummary(b.domestic).grainReserve-countrySummary(a.domestic).grainReserve});}
writeFileSync(new URL('../docs/p01-balance-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
