import {CITY_OPENING,DIFFICULTIES} from './difficulty.mjs';
import {nationalFoodForecast} from './national-resources.mjs';
import {kitTargetMix} from './troop-kits.mjs';
export function applyDifficultyOpening(s,id='standard',seed=184713){
 const d=s.domestic,t=DIFFICULTIES.find(t=>t.id===id),city=CITY_OPENING.tiers.find(t=>t.id===id);
 if(!t||!Number.isSafeInteger(seed)||seed<0||seed>4294967295)throw Error('请选择有效难度与开局种子');
 if(d.difficulty)throw Error('难度和开局资源仅能在新朝创建时设置');
 d.difficulty={version:1,id,legacy:false,openingApplied:true,seed,random:{},examMisses:0,aid:{used:0,lastTurn:0,records:[]},provoked:[]};d.disasters.seed=seed;
 for(const p of d.provinces){p.difficultyId=id;p.difficultyPlayerCountryId=d.playerCountryId;if(p.countryId!==d.playerCountryId)continue;
  if(id==='novice'){p.status.livingStandard=Math.max(p.status.livingStandard,city.openingLivingFloor);for(const [key,field]of [['stability','openingStabilityFloor'],['security','openingSecurityFloor'],['loyalty','openingLoyaltyFloor']])p.welfare[key]=Math.max(p.welfare[key],city[field]);}
  const jobs=p.population.professions,old=jobs.soldiers,target=Math.round(CITY_OPENING.standardLocalTroops[p.id]*city.localFactor/50)*50+(p.id===d.centralArmy.sourceProvinceId?city.central:0);let extra=target-old;
  if(extra<0){jobs.workers-=extra;extra=0;}
  for(const job of ['workers','merchants','herders','farmers']){const take=Math.min(extra,Math.floor(jobs[job]*.2));jobs[job]-=take;extra-=take;if(!extra)break;}if(extra)throw Error('城市转编劳力不足');
  jobs.soldiers=target;p.civic.baselineSoldiers=target;p.budget.expenses.soldierSalaries=Math.round(p.budget.expenses.soldierSalaries*target/old);p.military.training=['hebei','hedong','longyou'].includes(p.id)?60:55;
 }
 d.centralArmy.soldiers=city.central;d.centralArmy.training=city.training;
 for(const id of ['central',...d.provinces.filter(p=>p.countryId===d.playerCountryId).map(p=>p.id)]){const p=d.provinces.find(p=>p.id===(id==='central'?d.centralArmy.sourceProvinceId:id)),count=id==='central'?city.central:p.population.professions.soldiers-(id===d.centralArmy.sourceProvinceId?city.central:0),total=Math.ceil(count*city.kits),stock=d.troopKits.depots[id].stock,mix=kitTargetMix(p);for(const key of Object.keys(stock))stock[key]=Math.floor(total*(mix[key]??0));stock['heavy-cavalry']+=total-Object.values(stock).reduce((n,v)=>n+v,0);}
 const home=d.countries.find(c=>c.id===d.playerCountryId);home.fiscal.treasury=t.silver;home.fiscal.otherIncome+=city.estateIncome-600;home.fiscal.grain=nationalFoodForecast(d,s.turn+1).need*city.foodCoverage;d.governance.reserve=t.reserve;s.stats.treasury=t.silver;return s;
}
