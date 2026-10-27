import test from 'node:test';
import assert from 'node:assert/strict';
import {createPlayableGame,newGame,advance,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {enableDevelopmentBalance} from '../src/new-dynasty-balance.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import {postTreasury,validateFinance} from '../src/finance.mjs';
import {executeRevenue,quoteRevenue} from '../src/revenue.mjs';
import {executeGeneral} from '../src/general.mjs';
import {executeKitCommand} from '../src/troop-kit-world.mjs';
import {executeIndustry,settleIndustry} from '../src/industry.mjs';
import {projectLaborOverview} from '../src/project-labor.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {executeJustice} from '../src/justice.mjs';
import {outputFor} from '../src/economy.mjs';
import {laborProfile} from '../src/labor.mjs';
import {executeDiplomacy} from '../src/diplomacy.mjs';
import {marketCapacity,purchaseForeignRelief} from '../src/grain-market.mjs';
import {executeSpecial,settleSpecialWorks,specialFraction,specialDefenseBonus} from '../src/special-buildings.mjs';
import {drugEffect} from '../src/alchemy.mjs';
import {fiscalHealth} from '../src/fiscal-health.mjs';
import {industrialProcurement,pastoralLogistics} from '../src/supply-economy.mjs';
import {scheduleTravel,beginTravel,travelRule,validateTravel} from '../src/travel.mjs';
import {beginWar,finishWar,generals,borderingCountries} from '../src/war.mjs';
import {automaticKitFormation} from '../src/kit-formation.mjs';
import {worldKitSummary} from '../src/troop-kit-world.mjs';
import {aiAction,actBattle} from '../src/battle.mjs';
import {loseForceKits} from '../src/kit-strategy.mjs';
import {occupyProvince} from '../src/occupation.mjs';
import {campaignSupply} from '../src/military-costs.mjs';
const game=()=>createPlayableGame('第二版验收');
const home=s=>s.domestic.countries.find(c=>c.id==='sheng');
const province=(s,id='hebei')=>s.domestic.provinces.find(p=>p.id===id);
const reload=s=>validateSave(JSON.parse(JSON.stringify(s)));
function peacefulStep(s,{noDisasters=false}={}){s.domestic.strategy.lastTurn=s.turn+1;if(noDisasters)s.domestic.disasters.lastTurn=s.turn+1;advance(s);return s;}
function manual(s){for(const p of s.domestic.provinces)if(p.localPolicy){p.localPolicy.civil=false;p.localPolicy.military=false;}s.domestic.personnel.delegations=[];return s;}

test('playable factory has one complete rule set and solvent initial resources',()=>{
 const s=reload(game()),q=countrySummary(s.domestic),f=nationalFoodForecast(s.domestic,2);
 assert.equal(s.domestic.developmentBalanceVersion,2);assert.equal(s.domestic.personnel.delegations.length,10);assert.equal(s.domestic.officialEffectsVersion,1);
 assert.ok(q.net>0&&q.net<2000);assert.ok(f.opening/f.need>=12&&f.opening/f.need<60);assert.ok(Object.values(q.buildings).reduce((a,b)=>a+b,0)<150);
 assert.ok(q.provinces.reduce((n,p)=>n+laborProfile(p).available,0)<50000);
 assert.equal(s.stats.treasury,q.country.fiscal.treasury);
});
test('enabling future rules never reseeds existing cash, buildings, population, kits or projects',()=>{
 const s=newGame('兼容');initializeResourceEconomy(s.domestic);const before=structuredClone(s.domestic);
 enableDevelopmentBalance(s.domestic,1);enableDevelopmentBalance(s.domestic,1,{fresh:true});
 assert.deepEqual(s.domestic.countries,before.countries);assert.deepEqual(s.domestic.troopKits,before.troopKits);
 for(const p of s.domestic.provinces){const old=before.provinces.find(x=>x.id===p.id);assert.deepEqual(p.population,old.population);assert.deepEqual(p.buildings,old.buildings);assert.deepEqual(p.development,old.development);}
 reload(s);assert.equal(newGame('旧夹具').domestic.resourceRulesVersion,undefined);
});
test('tax pressure takes time to recover and excessive tax causes unrest even with food',()=>{
 let high=manual(game()),normal=manual(game());for(const p of countrySummary(high.domestic).provinces)p.budget.taxRate=.5;
 for(let i=0;i<108;i++){peacefulStep(high,{noDisasters:true});peacefulStep(normal,{noDisasters:true});}
 const h=countrySummary(high.domestic),n=countrySummary(normal.domestic);
 assert.ok(h.provinces.some(p=>p.civic.unrestTurns>=3));assert.ok(h.provinces.every(p=>p.welfare.loyalty<40));assert.ok(h.income<n.income);
 const old=province(high).civic.taxPressure;for(const p of h.provinces)p.budget.taxRate=.18;peacefulStep(high,{noDisasters:true});assert.ok(province(high).civic.taxPressure>0&&province(high).civic.taxPressure<old);reload(high);
});
test('repayment debits cash and principal exactly, including compacted finance entries',()=>{
 let s=game();postTreasury(s.domestic,'sheng',{turn:1,expense:home(s).fiscal.treasury+1000,allowDebt:true,reason:'债务压力夹具',key:'fixture:debt'});
 postTreasury(s.domestic,'sheng',{turn:1,income:30000,reason:'偿债资金夹具',key:'fixture:cash'});
 s=executeRevenue(s,{id:1,kind:'repay',amount:300}).state;assert.equal(home(s).fiscal.debt,700);
 for(let i=0;i<110;i++)postTreasury(s.domestic,'sheng',{turn:1,expense:1,debtRepayment:1,reason:'逐笔偿还夹具',key:`fixture:repay:${i}`});
 assert.equal(home(s).fiscal.debt,590);validateFinance(s.domestic);reload(s);
 assert.throws(()=>postTreasury(s.domestic,'sheng',{turn:1,expense:1000,debtRepayment:1000,reason:'超额偿本',key:'invalid'}));
 const debt=home(s).fiscal.debt;peacefulStep(s,{noDisasters:true});assert.ok(home(s).fiscal.debt<debt);reload(s);
});
test('disasters reduce affected production and supplied national accounts still reconcile',()=>{
 let s=game();const p=province(s),before=outputFor(p,'agriculture',2);p.disaster={kind:'drought',startTurn:1,endTurn:10};p.status.situation='disaster';
 assert.ok(outputFor(p,'agriculture',2)>before*.45&&outputFor(p,'agriculture',2)<before*.55);const pasture=outputFor(p,'pastoral',2);p.disaster.lastReliefTurn=1;p.disaster.reliefTurns=1;p.disaster.endTurn=9;assert.ok(outputFor(p,'pastoral',2)>pasture);
 peacefulStep(s,{noDisasters:true});const f=home(s).foodSettlement;assert.equal(f.opening-f.storageLoss+f.produced-f.consumed,f.closing);reload(s);
});
test('existing facilities no longer automatically maximize civic welfare',()=>{
 const s=manual(game());for(let i=0;i<108;i++)peacefulStep(s,{noDisasters:true});const q=countrySummary(s.domestic);
 assert.ok(q.welfare.security<90);assert.ok(q.welfare.activity<90);assert.ok(q.welfare.fitness<90);reload(s);
});
test('city expansion takes shared labor and cannot apply capacity instantly or repeat',()=>{
 let s=game(),p=province(s),land=p.cityCapacity.land,people=p.cityCapacity.population;
 s=executeIndustry(s,{id:1,kind:'expand',provinceId:p.id}).state;p=province(s);assert.equal(p.cityCapacity.land,land);assert.equal(p.cityCapacity.population,people);
 assert.ok(projectLaborOverview(s.domestic,p).reserved>=200);assert.throws(()=>executeIndustry(s,{id:2,kind:'expand',provinceId:p.id}));
 for(let turn=2;turn<=7;turn++){settleIndustry(s.domestic,turn);s.turn=turn;s=reload(s);}
 assert.equal(province(s).cityCapacity.land,land+5000);assert.equal(province(s).cityCapacity.population,people+10000);assert.equal(province(s).cityCapacity.expansion,undefined);
});
test('a development plan posts only funded batches and obeys its total budget',()=>{
 let s=manual(game()),p=province(s),area=p.economy.commerce.developedArea,cash=home(s).fiscal.treasury;
 s=executeIndustry(s,{id:1,kind:'plan',provinceId:p.id,industry:'commerce',area:2000,budget:1000}).state;assert.equal(home(s).fiscal.treasury,cash);
 for(let turn=2;turn<=6;turn++){settleIndustry(s.domestic,turn);s.turn=turn;reload(s);}
 assert.equal(province(s).economy.commerce.developedArea,area+500);assert.equal(home(s).fiscal.treasury,cash-1000);assert.equal(province(s).development.plan,undefined);
});
test('census requires actual job demand and amnesty has a recovery interval',()=>{
 let s=game();assert.throws(()=>quoteRevenue(s,{kind:'census'}),/岗位/);
 s=executeJustice(s,{id:1,kind:'amnesty'}).state;assert.equal(countrySummary(s.domestic).total,2995000);assert.throws(()=>executeJustice(s,{id:2,kind:'amnesty'}),/十二旬/);reload(s);
});
test('office swaps cannot repeatedly create loyalty within a year',()=>{
 let s=game();const id='henan-governor';s=executePersonnel(s,{id:1,kind:'assign',officialId:id,officeId:'hebei-governor'}).state;
 const loyalty=s.domestic.justice.officials.find(o=>o.id===id).loyalty;s=executePersonnel(s,{id:2,kind:'assign',officialId:id,officeId:'henan-governor'}).state;assert.equal(s.domestic.justice.officials.find(o=>o.id===id).loyalty,loyalty);reload(s);
});
test('central training is paid, once per turn, and recruit dilution is not replaced by a saved floor',()=>{
 let s=game(),cash=home(s).fiscal.treasury;s=executeGeneral(s,{id:1,kind:'train'}).state;assert.ok(home(s).fiscal.treasury<cash);assert.throws(()=>executeGeneral(s,{id:2,kind:'train'}),/本旬已训练/);
 s.domestic.centralArmy.training=100;s=executeGeneral(s,{id:2,kind:'ongoing',enabled:true}).state;s=executeKitCommand(s,{id:1,kind:'recruit',sourceId:'central',amount:1000}).state;
 const diluted=s.domestic.centralArmy.training;assert.ok(diluted<80);peacefulStep(s,{noDisasters:true});assert.ok(s.domestic.centralArmy.training> diluted&&s.domestic.centralArmy.training<75);assert.equal(s.domestic.general.trainingFloor,0);reload(s);
});
test('partial canal benefits persist and activate only after the segment completion turn',()=>{
 let s=game();postTreasury(s.domestic,'sheng',{turn:1,income:30000,reason:'工程边界夹具',key:'fixture:special'});s.stats.talent=500;
 s=executeIndustry(s,{id:1,kind:'levy-militia',provinceId:'guannei',amount:400}).state;s=executeSpecial(s,{id:1,building:'canal',provinceId:'guannei'}).state;
 s.domestic.specialWorks.project.progress=89;settleSpecialWorks(s.domestic,2);s.turn=2;assert.equal(specialFraction(s.domestic,'canal',2),0);assert.equal(specialFraction(s.domestic,'canal',3),1/3);reload(s);
 assert.ok(province(s,'guannei').specialWorkSegments.canal.count===1);assert.equal(specialDefenseBonus(s.domestic,3),0);
});
test('industrial and pastoral investment have distinct procurement and logistics value',()=>{
 const s=game(),i=industrialProcurement(s.domestic),p=pastoralLogistics(s.domestic);assert.ok(i>0&&i<=.2);assert.ok(p>0&&p<=.15);
 const q=executeKitCommand(s,{id:1,kind:'purchase',sourceId:'central',quantities:{infantry:100}});assert.ok(q.receipt.cost<1200);
 const supply=campaignSupply(s.domestic,1600);assert.ok(supply.grain>=128);assert.ok(supply.silver>156);reload(q.state);
});
test('grain market rejects unbacked million-liang quotas and foreign relief conserves all grain and cash',()=>{
 const s=game(),capacity=marketCapacity(s.domestic,'sheng','nanzhao');assert.ok(capacity<1000000);assert.equal(executeDiplomacy(s,{kind:'trade',countryId:'nanzhao',imports:1000000,exports:0}).accepted,false);
 const buyer=s.domestic.countries.find(c=>c.id==='nanzhao'),p=s.domestic.provinces.find(p=>p.countryId===buyer.id);buyer.fiscal.grain=0;p.population.professions.farmers=0;p.population.professions.herders=0;
 const grain=s.domestic.countries.reduce((n,c)=>n+c.fiscal.grain,0),cash=s.domestic.countries.reduce((n,c)=>n+c.fiscal.treasury,0);assert.ok(purchaseForeignRelief(s.domestic,buyer.id,1,600)>0);
 assert.equal(s.domestic.countries.reduce((n,c)=>n+c.fiscal.grain,0),grain);assert.equal(s.domestic.countries.reduce((n,c)=>n+c.fiscal.treasury,0),cash);reload(s);assert.doesNotThrow(()=>purchaseForeignRelief(s.domestic,buyer.id,1,600));
});
test('foreign scale follows named profiles and all starting foreign economies have a sustainable role',()=>{
 const s=game();assert.equal(s.domestic.provinces.find(p=>p.countryId==='rome').population.total,520000);assert.equal(s.domestic.provinces.find(p=>p.countryId==='cape').population.total,140000);
 for(const c of s.domestic.countries.filter(c=>c.id!=='sheng')){const q=countrySummary(s.domestic,c.id),f=nationalFoodForecast(s.domestic,2,c.id);assert.ok(q.net>=0,`${c.id} cash ${q.net}`);assert.ok(f.produced>=f.need,`${c.id} food ${f.produced-f.need}`);}
});
test('more expensive longevity recipes have greater effects and wealth alone does not maximize fiscal evaluation',()=>{
 const s=game();assert.ok(drugEffect(s,'life8').life>drugEffect(s,'life7').life);assert.ok(drugEffect(s,'life7').life>drugEffect(s,'life6').life);
 postTreasury(s.domestic,'sheng',{turn:1,income:1000000,reason:'评价夹具',key:'fixture:wealth'});assert.ok(fiscalHealth(s.domestic).score<90);
});

test('rebalanced tours display and charge the same price and retain valid old travel receipts',()=>{
 let s=game();s.phase=1;assert.equal(travelRule(s,'tour').treasuryCost,8000);assert.match(travelRule(s,'tour').description,/8,000/);
 s=scheduleTravel(s,'tour','guannei').state;s.turn=2;s=beginTravel(s).state;assert.equal(s.travel.pending.reward.treasury,8000);reload(s);
 const legacy=newGame('旧出行');legacy.phase=1;legacy.stats.treasury=30000;legacy.domestic.countries[0].fiscal.treasury=30000;
 let old=scheduleTravel(legacy,'tour','guannei').state;old.turn=2;old=beginTravel(old).state;delete old.travel.pending.rulesVersion;enableDevelopmentBalance(old.domestic,2);assert.equal(old.travel.pending.reward.treasury,20000);validateTravel(old);
});
test('development plans pause without production workers and spend only after workers become available',()=>{
 let s=game();s=executeIndustry(s,{id:1,kind:'plan',provinceId:'hebei',industry:'commerce',area:500,budget:1000}).state;
 const p=province(s),cash=home(s).fiscal.treasury,l=laborProfile(p);p.population.professions.militia+=l.available;
 settleIndustry(s.domestic,2);assert.equal(p.development.project,null);assert.equal(home(s).fiscal.treasury,cash);assert.ok(p.development.plan);
 p.population.professions.militia-=200;settleIndustry(s.domestic,3);assert.ok(p.development.project);assert.ok(home(s).fiscal.treasury<cash);
});

test('playable battle spends actual campaign supply and records losses against real population and kits',()=>{
 let s=game();const army=worldKitSummary(s.domestic).find(p=>p.id==='central'),plan=automaticKitFormation(army,generals(s.domestic)),target=borderingCountries(s.domestic)[0];
 const cash=home(s).fiscal.treasury,grain=home(s).fiscal.grain,pop=countrySummary(s.domestic).total;
 s=beginWar(s,{id:s.domestic.war.nextId,kind:'war',kitVersion:1,targetId:target.id,...plan});assert.ok(home(s).fiscal.treasury<cash);assert.ok(home(s).fiscal.grain<grain);reload(s);
 let b=s.domestic.war.battle,steps=0;while(!b.result&&steps++<15000)b=actBattle(b,aiAction(b));assert.ok(b.result);
 const dead=b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0);s.domestic.war.battle=b;s=finishWar(s).state;
 assert.equal(s.domestic.centralArmy.soldiers,army.soldiers.total-dead);assert.ok(countrySummary(s.domestic).total>=pop-dead);reload(s);
});
test('completed partial works keep derived benefits consistent when their province changes hands',()=>{
 const s=game(),p=province(s,'hebei');p.specialWorkSegments={canal:{count:1,effectiveTurn:1}};
 // A completed segment fixture changes ownership through the real occupation API.
 p.specialWorkSegments.canal.effectiveTurn=2;s.turn=2;occupyProvince(s.domestic,'sheng',2,'nanzhao','hebei');assert.equal(specialFraction(s.domestic,'canal',2,'sheng'),0);assert.equal(specialFraction(s.domestic,'canal',2,'nanzhao'),1/3);reload(s);
});
test('yingtian annually raises eligible martial ability without changing integrity',()=>{
 const s=game(),p=province(s,'guannei'),o=s.domestic.justice.officials.find(o=>o.status==='serving'&&o.martial<70);o.martial=30;
 // The school is a completion fixture; the actual annual settlement applies growth and potential caps.
 p.specialBuildings.push({id:'yingtian',name:'应天书院',description:'培养',count:1,ruleVersion:1,completedTurn:1,effectiveTurn:2});const integrity=o.integrity;
 settleSpecialWorks(s.domestic,37);assert.equal(o.martial,31);assert.equal(o.integrity,integrity);s.turn=37;reload(s);
});

test('a quarter of the starting central force can be rebuilt with paid recruits and matching equipment inside the opening budget',()=>{
 let s=game();const before=worldKitSummary(s.domestic).find(p=>p.id==='central'),cash=home(s).fiscal.treasury;
 loseForceKits(s.domestic,{countryId:'sheng',sourceId:'central',soldiers:1600,training:60},400);
 const after=worldKitSummary(s.domestic).find(p=>p.id==='central'),quantities=Object.fromEntries(Object.keys(before.kits).map(k=>[k,before.kits[k].total-after.kits[k].total]));
 s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'recruit',sourceId:'central',amount:400}).state;
 s=executeKitCommand(s,{id:s.domestic.troopKits.nextId,kind:'purchase',sourceId:'central',quantities}).state;
 const restored=worldKitSummary(s.domestic).find(p=>p.id==='central');assert.equal(restored.soldiers.total,1600);for(const k of Object.keys(before.kits))assert.equal(restored.kits[k].total,before.kits[k].total);
 assert.ok(home(s).fiscal.treasury>=5000);assert.ok(cash-home(s).fiscal.treasury>1600);assert.ok(s.domestic.centralArmy.training<60);reload(s);
});
