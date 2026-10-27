import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
// Complementary counterfactual / stress fixtures, NOT ordinary new-game runs.
import {mkdirSync,writeFileSync} from 'node:fs';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy} from '../src/province-resources.mjs';
import {initializeNewLocalAutonomy} from '../src/local-autonomy.mjs';
import {enableOfficialProduction} from '../src/official-production.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import {outputFor,foodProduction} from '../src/economy.mjs';
import {laborProfile} from '../src/labor.mjs';
import {cityPopulation,cityLand} from '../src/city-capacity.mjs';
import {quoteIndustry} from '../src/industry.mjs';
import {quoteRevenue} from '../src/revenue.mjs';
import {quoteKitCommand,executeKitCommand} from '../src/troop-kit-world.mjs';
import {executeGeneral,centralTrainingEffect} from '../src/general.mjs';
import {spendEnergy} from '../src/emperor.mjs';
import {executeDiplomacy} from '../src/diplomacy.mjs';
import {quoteRelief,executeRelief} from '../src/food-relief.mjs';
import {settleStrategy} from '../src/foreign-strategy.mjs';
const sum=xs=>xs.reduce((a,b)=>a+b,0),home=s=>s.domestic.countries.find(c=>c.id==='sheng');
function start(){const s=createPlayableGame('资源边界审计');s.createdAt='2026-10-21T00:00:00.000Z';initializeResourceEconomy(s.domestic);initializeNewLocalAutonomy(s.domestic);enableOfficialProduction(s.domestic,1);return s;}
const report={methodology:'Labelled static counterfactuals and stress fixtures; never interpreted as ordinary starts.',probes:{}};
const s=start(),ps=countrySummary(s.domestic).provinces;
let trained=start();let trainingOrders=0,trainingFees=0,repeatedRejected=false;
while(trained.domestic.centralArmy.training<100){const before=home(trained).fiscal.treasury;trained=executeGeneral(trained,{id:trained.domestic.general.nextId,kind:'train'}).state;spendEnergy(trained,true);trainingFees+=before-home(trained).fiscal.treasury;trainingOrders++;try{executeGeneral(trained,{id:trained.domestic.general.nextId,kind:'train'});}catch(e){repeatedRejected=/本旬已训练|训练值已满/.test(e.message);}if(trained.domestic.centralArmy.training<100){trained.domestic.strategy.lastTurn=trained.turn+1;advance(trained);}}
trained=executeGeneral(trained,{id:trained.domestic.general.nextId,kind:'ongoing',enabled:true}).state;spendEnergy(trained,true);
trained=executeKitCommand(trained,{id:trained.domestic.troopKits.nextId,kind:'recruit',sourceId:'central',amount:1000}).state;spendEnergy(trained,true);
const diluted=trained.domestic.centralArmy.training;
trained.domestic.strategy.lastTurn=trained.turn+1;advance(trained);validateSave(trained);
report.probes.centralTraining={fixture:'Paid legal manual training across separate turns, then ongoing + 1000 paid recruits; foreign strategy skipped',manualTrainingOrders:trainingOrders,sameTurnRepeatRejected:repeatedRejected,trainingSilverCost:trainingFees,ongoingGain:centralTrainingEffect(trained.domestic,2).gain,afterRecruitTraining:diluted,trainingFloor:trained.domestic.general.trainingFloor,afterOneTurnTraining:trained.domestic.centralArmy.training};
report.probes.world=s.domestic.countries.map(c=>{const q=countrySummary(s.domestic,c.id,1),f=nationalFoodForecast(s.domestic,2,c.id);return {id:c.id,name:c.name,population:q.total,soldiers:q.military,cash:c.fiscal.treasury,grain:c.fiscal.grain,net:q.net,foodTax:f.produced,foodNeed:f.need,foodBalance:f.produced-f.need};});
report.probes.openingWorkforce=ps.map(p=>({id:p.id,labor:laborProfile(p),population:cityPopulation(p),land:cityLand(p),growthYearsToNormal:Math.log(p.cityCapacity.population/p.population.total)/Math.log(1.008),expansion:quoteIndustry(s,{kind:'expand',provinceId:p.id})}));
report.probes.disasterProduction=ps.map(p=>{const after={...p,disaster:{kind:'flood',startTurn:1,endTurn:7},status:{...p.status,situation:'disaster'}};return {id:p.id,before:Object.fromEntries(['agriculture','pastoral','commerce','industry'].map(k=>[k,outputFor(p,k,2)])),during:Object.fromEntries(['agriculture','pastoral','commerce','industry'].map(k=>[k,outputFor(after,k,2)]))};});
report.probes.taxAtSameWelfare=[20,21,25,26,30,31,50].map(rate=>{const t=start();for(const p of countrySummary(t.domestic).provinces)p.budget.taxRate=rate/100;const q=countrySummary(t.domestic,undefined,2);return {rate,net:q.net,tax:q.tax,income:q.income,expense:q.expenditure};});
try{report.probes.census=quoteRevenue(s,{kind:'census'});}catch(e){report.probes.census={accepted:false,reason:e.message};}
report.probes.draftBeyondIdle=quoteKitCommand(s,{kind:'recruit',sourceId:'hebei',amount:20000,draftRates:{farmers:50,herders:50,merchants:50,workers:50}});
try{quoteKitCommand(s,{kind:'recruit',sourceId:'central',amount:210000,draftRates:{farmers:50,herders:50,merchants:50,workers:50}});}catch(e){report.probes.centralMigrationGate=e.message;}
// Demonstrate free loyalty from office swaps without publishing any game save.
const a=s.domestic.justice.officials.find(o=>o.id==='henan-governor');report.probes.loyaltyAlternative={initialLoyalty:a.loyalty,assignmentGain:5,assignmentSilver:0,honorGain:10,firstHonorSilver:100,firstHonorSalaryPerTurn:2};
// Advertised old ration quota is deliberately exceeded in a funded fixture.
let market=start();market.domestic.countries.find(c=>c.id==='nanzhao').fiscal.grain=100000;home(market).fiscal.treasury=200000;
const negotiation=executeDiplomacy(market,{kind:'trade',countryId:'nanzhao',exports:0,imports:1000000});report.probes.millionQuota={accepted:negotiation.accepted,message:negotiation.message};market=negotiation.state;
const mq=quoteRelief(market,{kind:'purchase',sellerCountryId:'nanzhao',targetId:'hebei',amount:50000});
try{market=executeRelief(market,{id:1,kind:'purchase',sellerCountryId:'nanzhao',targetId:'hebei',amount:50000}).state;validateSave(market);report.probes.purchaseQuota={fixture:'200000 silver and 100000 seller grain before any ledger opens',advertisedLimit:mq.targetForecast.purchaseLimit,requested:50000,actualBought:market.domestic.foodRelief.history[0].amount,accepted:true,cost:mq.cost};}catch(e){report.probes.purchaseQuota={error:e.message};}
// Foreign AI's domestic emergency procurement bypasses bilateral market stocks.
const ai=start();ai.turn=6;const p=ai.domestic.provinces.find(p=>p.countryId==='nanzhao');p.disaster={kind:'flood',startTurn:6,endTurn:12};p.status.situation='disaster';
const grainBefore=sum(ai.domestic.countries.map(c=>c.fiscal.grain)),cashBefore=ai.domestic.countries.find(c=>c.id==='nanzhao').fiscal.treasury;
settleStrategy(ai.domestic,6);
report.probes.aiEmergencyPurchase={fixture:'Force one foreign flood, call only foreign-strategy turn 6',globalGrainCreated:sum(ai.domestic.countries.map(c=>c.fiscal.grain))-grainBefore,cost:cashBefore-ai.domestic.countries.find(c=>c.id==='nanzhao').fiscal.treasury,playerSellersAtStart:s.domestic.diplomacy.filter(r=>r.countryIds.includes('sheng')&&r.agreement.imports>0).length};
// Persistent total food failure: natural death/population response, not a playable route.
let famine=start();home(famine).fiscal.grain=0;
for(const o of famine.domestic.justice.officials)o.loyalty=Math.max(40,o.loyalty);
for(const p of countrySummary(famine.domestic).provinces){p.population.professions.farmers=0;p.population.professions.herders=0;p.localPolicy.civil=false;p.localPolicy.military=false;}
famine.domestic.personnel.delegations=[];
const populationBefore=countrySummary(famine.domestic).total;let shortage=0;
for(let i=0;i<180;i++){famine.domestic.strategy.lastTurn=famine.turn+1;advance(famine);shortage+=home(famine).foodSettlement.shortfall;}
try{validateSave(famine);const q=countrySummary(famine.domestic);report.probes.famine180={fixture:'Zero starting grain, zero farmers and herders, disabled delegations, loyalty floor40; foreign AI skipped',populationBefore,populationAfter:q.total,populationLossRatio:1-q.total/populationBefore,unrest:q.provinces.filter(p=>p.status.situation==='unrest').length,stability:q.welfare.stability,loyalty:q.loyalty,accumulatedShortfall:shortage,debt:home(famine).fiscal.debt,ended:famine.stats.life===0};}catch(e){report.probes.famine180={error:e.message};}
const requestedOutput=process.argv.find(a=>a.startsWith('--output-dir='))?.slice(13);const output=requestedOutput?pathToFileURL(resolve(requestedOutput)+'/'):new URL('../outputs/development-balance-v2-2026-10-21/',import.meta.url);mkdirSync(output,{recursive:true});writeFileSync(new URL('edge-cases.json',output),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({purchaseQuota:report.probes.purchaseQuota,aiEmergencyPurchase:report.probes.aiEmergencyPurchase,famine:report.probes.famine180},null,2));
