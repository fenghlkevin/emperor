import {DEVELOPMENT_BALANCE_VERSION,PLAYER_CUSHION,balanced,REALM_ECONOMIC_TIERS,REALM_TEMPLATES,publicFoodBuffer} from './development-balance.mjs';
import {initializeTroopKits} from './troop-kit-world.mjs';
import {enableOfficialProduction} from './official-production.mjs';
import {borderingCountries} from './war.mjs';

// Loading only enables future rules. Seed changes are restricted to a fresh dynasty.
export function enableDevelopmentBalance(d,turn=1,{fresh=false}={}){
 if(d.developmentBalanceVersion!==undefined){if(!balanced(d))throw Error('发展平衡规则版本不支持');return d;}
 if(d.resourceRulesVersion!==1)return d;
 d.developmentBalanceVersion=DEVELOPMENT_BALANCE_VERSION;
 for(const p of d.provinces){p.developmentBalanceVersion=DEVELOPMENT_BALANCE_VERSION;p.civic.taxPressure=0;}
 if(!fresh)return d;
 for(const p of d.provinces){
  const own=p.countryId===d.playerCountryId;
  if(!own){
   const tier=REALM_ECONOMIC_TIERS[p.countryId];if(!tier)throw Error('外国经济档位缺失：'+p.countryId);
   const t=REALM_TEMPLATES[tier],n=t.population;p.population.total=n;
   p.population.professions={farmers:Math.round(n*.38),herders:Math.round(n*.065),merchants:Math.round(n*.09),workers:Math.round(n*.13),soldiers:Math.round(n*t.soldiers),militia:Math.round(n*.003)};
   p.cityCapacity.land=Math.min(p.terrainCapacity.landLimit,Math.round(n*.4));
   for(const [i,key]of ['agriculture','pastoral','commerce','industry'].entries()){
    const capacityArea=Math.round(n*(.12+i*.012));
    p.economy[key]={capacityArea,developedArea:Math.round(capacityArea*t.development),productivity:t.productivity??72};
    const shares={'平原型':[.70,.35,.35,.35],'河海型':[.55,.25,.60,.40],'丘陵型':[.40,.60,.35,.50],'高山型':[.20,.50,.35,.65]}[p.terrain];
    p.economy[key].developedArea=Math.min(p.economy[key].developedArea,Math.floor(p.cityCapacity.land*shares[i]));
   }
   p.status.livingStandard=50;
   p.budget.otherIncome=Math.round(n*.0015);
   p.budget.expenses={administration:Math.round(n*.00016),officialSalaries:Math.round(n*.0002),soldierSalaries:Math.round(n*t.soldiers*.04),militiaSalaries:Math.round(n*.003*.015),nobleStipends:10,weapons:0,construction:0,maintenance:12,other:10};
  }else{
   p.population.professions.militia=Math.max(400,Math.round(p.population.total*.002));
   p.budget.expenses.militiaSalaries=Math.round(p.population.professions.militia*.015);
   p.budget.expenses.maintenance=20;
  }
  const n=p.population.total,level=own?(p.id==='guannei'?3:['hebei','henan','huainan'].includes(p.id)?2:1):REALM_ECONOMIC_TIERS[p.countryId]==='great'?3:2;
  p.buildings={temples:level,markets:level,yamen:level+1,granaries:level,trainingGrounds:level,walls:level+1,palaces:own&&p.id==='guannei'?1:0};
  p.cityCapacity.population=Math.ceil(n*(own?PLAYER_CUSHION.populationRoom:1.10));
  Object.assign(p.civic,{baselineSoldiers:p.population.professions.soldiers,baselineMilitia:p.population.professions.militia,baselineBuildings:Object.values(p.buildings).reduce((a,b)=>a+b,0)});
  Object.assign(p.buildingEffects,{baselineWalls:p.buildings.walls,baselineDefense:p.welfare.defense});
  for(const [key,job]of Object.entries({agriculture:'farmers',pastoral:'herders',commerce:'merchants',industry:'workers'}))p.industryLabor.base[key]={area:p.economy[key].developedArea,workers:p.population.professions[job]};
 }
 for(const c of d.countries){const ps=d.provinces.filter(p=>p.countryId===c.id),n=ps.reduce((sum,p)=>sum+p.population.total,0);
  c.fiscal.grain=ps.reduce((sum,p)=>sum+publicFoodBuffer(p)*(c.id===d.playerCountryId?PLAYER_CUSHION.publicFoodTurns:18),0);
  if(c.id===d.playerCountryId){c.fiscal.treasury=PLAYER_CUSHION.openingSilver;c.fiscal.otherIncome+=PLAYER_CUSHION.estateIncome;}
  else{c.fiscal.treasury=Math.round(n*.04);c.fiscal.centralExpenses={administration:REALM_ECONOMIC_TIERS[c.id]==='frontier'?40:70,officialSalaries:REALM_ECONOMIC_TIERS[c.id]==='frontier'?30:50,soldierSalaries:0,militiaSalaries:0,nobleStipends:REALM_ECONOMIC_TIERS[c.id]==='frontier'?10:20,weapons:0,construction:0,maintenance:REALM_ECONOMIC_TIERS[c.id]==='frontier'?10:20,other:0};}
 }
 for(const o of d.justice.officials)o.loyalty=Math.max(45,o.loyalty);
 for(const c of d.countries)for(const other of borderingCountries(d,c.id)){const r=d.diplomacy.find(r=>r.countryIds.includes(c.id)&&r.countryIds.includes(other.id));if(r&&r.relation!=='hostile'){r.agreement.exports=500;r.agreement.imports=500;r.trade.quota=1000;}}
 d.governance.budget=1400;d.governance.turnBudget=1400;d.governance.reserve=PLAYER_CUSHION.reserve;for(const p of d.provinces)if(p.localPolicy)p.localPolicy.budget=1400;
 delete d.troopKits;initializeTroopKits(d);enableOfficialProduction(d,turn);
 return d;
}
