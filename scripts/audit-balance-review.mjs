import {quoteArmyRecovery,executeArmyRecovery} from '../src/army-recovery.mjs';
// Additional v2 design review: legal policy routes plus labelled counterfactuals.
import {mkdirSync,writeFileSync,readFileSync,readdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import {quoteIndustry} from '../src/industry.mjs';
import {terrainLandLimit} from '../src/terrain-economy.mjs';
import {quoteGeneral} from '../src/general.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executeJustice} from '../src/justice.mjs';
import {executeGeneral} from '../src/general.mjs';
import {executeNational} from '../src/national-actions.mjs';
import {palaceAction,spendEnergy,courtBlock} from '../src/emperor.mjs';
import {quoteKitWar} from '../src/kit-war.mjs';
import {generals,borderingCountries} from '../src/war.mjs';
import {quoteKitCommand,worldKitSummary,executeKitCommand} from '../src/troop-kit-world.mjs';
import {loseForceKits,growForeignKitArmy} from '../src/kit-strategy.mjs';
import {campaignSupply} from '../src/military-costs.mjs';
import {fiscalHealth} from '../src/fiscal-health.mjs';
import {postTreasury} from '../src/finance.mjs';
import {laborProfile} from '../src/labor.mjs';
import {cityLand} from '../src/city-capacity.mjs';
import {outputFor} from '../src/economy.mjs';
import {industryStaffing,reassignDevelopedLand} from '../src/industry-labor.mjs';
import {industryLandAvailable} from '../src/terrain-economy.mjs';
import {serviceTarget} from '../src/development-balance.mjs';
import {settleBuildingEffects,welfareValue} from '../src/building-effects.mjs';
import {realmProfile,STRATEGIC_PROFILES} from '../src/foreign-policy.mjs';
import {autoDefense} from '../src/foreign-strategy.mjs';
import {resolveCapital,refugeProvinces} from '../src/capital-crisis.mjs';
import {quoteSpecial,SPECIAL_PLANS} from '../src/special-buildings.mjs';
const output=resolve(process.argv.find(a=>a.startsWith('--output-dir='))?.slice(13)??'outputs/balance-complete-review-2026-10-21');mkdirSync(output,{recursive:true});
const seed=Number(process.argv.find(a=>a.startsWith('--seed='))?.slice(7)??1),part=process.argv.find(a=>a.startsWith('--part='))?.slice(7)??'probes';
const authorizeRecovery=process.argv.includes('--authorize-recovery');
const home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId),sum=a=>a.reduce((n,v)=>n+v,0);
const fingerprint=()=>createHash('sha256').update(readdirSync('src').filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync('src/'+f,'utf8')).join('\n')).digest('hex');
const report={part,seed,sourceFingerprint:fingerprint(),scenarios:[],probes:{},errors:[]};
const save=()=>writeFileSync(resolve(output,`review-${part}${authorizeRecovery?'-recovery':''}-${seed}.json`),JSON.stringify(report,null,2)+'\n');
function start(){const s=createPlayableGame('全面平衡复查');s.createdAt='2026-10-21T00:00:00.000Z';s.domestic.disasters.seed=seed;return s;}
function random(seed){let n=seed;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);}
function metrics(s){const q=countrySummary(s.domestic,undefined,s.turn),f=nationalFoodForecast(s.domestic,s.turn+1);return {turn:s.turn,cash:home(s).fiscal.treasury,debt:home(s).fiscal.debt,regularNet:q.net,grain:home(s).fiscal.grain,foodTax:f.produced,foodNeed:f.need,provinces:q.provinces.length,population:q.total,living:q.livingStandard,welfare:q.welfare,unrest:q.provinces.filter(p=>p.status.situation==='unrest').length,idle:sum(q.provinces.map(p=>laborProfile(p).available)),fiscalHealth:fiscalHealth(s.domestic)};}
function order(s,fn){const block=courtBlock(s);if(block)throw Error(block);const next=fn(s).state;spendEnergy(next,true);return next;}
const tax=(s,rate)=>order(s,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home(x).provinceIds.map(id=>[id,rate]))}));
function step(s,{peace=true}={}){const act=kind=>{const d=s.domestic;s=palaceAction({...s,domestic:undefined},kind).state;s.domestic=d;};s.phase=1;act('view');s.phase=2;act('sleep');if(peace)s.domestic.strategy.lastTurn=s.turn+1;advance(s);return s;}
if(part==='probes'){
 const initial=start(),d=initial.domestic,ps=countrySummary(d).provinces;
 report.probes.taxEquilibrium=Array.from({length:36},(_,i)=>i+15).map(rate=>{const s=structuredClone(initial);for(const p of countrySummary(s.domestic).provinces){p.budget.taxRate=rate/100;p.civic.taxPressure=Math.min(100,(18/.08)*Math.max(0,rate/100-.18));}return {fixture:'Static tax-pressure equilibrium, unchanged jobs, buildings and welfare; not a played route',rate,...metrics(s)};});
 const leaders=generals(d),target=borderingCountries(d)[0],command=kind=>({id:d.war.nextId,kitVersion:1,kind:'war',targetId:target.id,generalId:leaders[0].id,commanderSquad:{kind,count:100},squads:[{kind,count:100,generalId:leaders[1].id}]});
 report.probes.deployedComposition=['infantry','cavalry'].map(kind=>{const q=quoteKitWar(initial,command(kind));return {kind,fielded:q.details.friendly.map(u=>({kind:u.kind,count:u.count})),supply:q.supply};});
 const stock=worldKitSummary(d).find(p=>p.id==='central');report.probes.centralInventory=Object.fromEntries(Object.entries(stock.kits).map(([k,v])=>[k,v.total]));
 report.probes.idleGearSensitivity=[0,10000].map(extra=>{const s=structuredClone(initial);s.domestic.troopKits.depots.central.stock.spears+=extra;return {fixture:'Unfielded extra infantry equipment added for price-formula counterfactual only',extraSpears:extra,supply:quoteKitWar(s,command('cavalry')).supply};});
 report.probes.expansionBoundary=ps.map(p=>{const s=structuredClone(initial),x=s.domestic.provinces.find(x=>x.id===p.id);x.cityCapacity.land=terrainLandLimit(x);try{return {province:p.id,normalPopulation:x.cityCapacity.population,quote:quoteIndustry(s,{kind:'expand',provinceId:x.id})};}catch(e){return {fixture:'Land capacity at geographic maximum, population capacity unchanged',province:p.id,normalPopulation:x.cityCapacity.population,error:e.message};}});
 report.probes.foreignAggression=d.countries.filter(c=>c.id!=='sheng').map(c=>({id:c.id,profile:realmProfile(c.id),aggression:STRATEGIC_PROFILES[realmProfile(c.id)].aggression,neutralWarEligible:true,bordersPlayer:borderingCountries(d,c.id).some(x=>x.id==='sheng')}));
 report.probes.ongoingTrainingQuote=quoteGeneral(initial,{kind:'ongoing',enabled:true});
 report.probes.amnesty={before:metrics(initial)};let a=order(initial,x=>executeJustice(x,{id:x.domestic.justice.nextId,kind:'amnesty'}));report.probes.amnesty.after=metrics(a);report.probes.amnesty.silverCost=home(initial).fiscal.treasury-home(a).fiscal.treasury;
 report.probes.zeroFacilities=ps.map(p=>{const q=structuredClone(p);for(const key of ['temples','yamen','markets','trainingGrounds','palaces'])q.buildings[key]=0;for(const k of ['stability','security','activity','fitness','loyalty']){q.welfare[k]=20;q.buildingEffects.carry[k]=0;}settleBuildingEffects(q,2,true,false);return {fixture:'Zero facilities and low welfare, static settlement counterfactual',province:p.id,target:serviceTarget(q,'temples',2),gains:q.buildingEffects.last.gains,baseGains:q.buildingEffects.last.baseGains,facilityGains:q.buildingEffects.last.facilityGains};});
 report.probes.industryMarginal=ps.flatMap(p=>['agriculture','pastoral','commerce','industry'].map(key=>{const q=structuredClone(p),area=Math.min(500,cityLand(p).available,industryLandAvailable(p,key));q.economy[key].developedArea+=area;reassignDevelopedLand(q,key,undefined,1);return {province:p.id,key,area,cost:area*2,outputBefore:outputFor(p,key,1),outputAfter:outputFor(q,key,1),workersBefore:industryStaffing(p,key,1).workers,workersAfter:industryStaffing(q,key,1).workers,remainingIdle:laborProfile(q).available};}));
 report.probes.foreignProfiles=d.countries.filter(c=>c.id!=='sheng').map(c=>{const q=countrySummary(d,c.id,1),f=nationalFoodForecast(d,2,c.id);return {id:c.id,population:q.total,silverNet:q.net,grainNet:f.produced-f.need,cash:c.fiscal.treasury,grain:c.fiscal.grain};});
 report.probes.special=Object.keys(SPECIAL_PLANS).map(building=>{try{return {building,...quoteSpecial(initial,{building,provinceId:'guannei'})};}catch(e){return {building,error:e.message};}});
 report.probes.lossRecovery=['central25','central100','national25'].map(scope=>{const s=start(),before=worldKitSummary(s.domestic),targets=scope==='national25'?before:before.filter(r=>r.id==='central');let deaths=0;for(const r of targets){const n=Math.floor(r.soldiers.total*(scope==='central100'?1:.25));deaths+=n;loseForceKits(s.domestic,{countryId:'sheng',sourceId:r.id,soldiers:r.soldiers.total,training:r.training},n);}const after=worldKitSummary(s.domestic);let kitCost=0,recruitCost=0;const errors=[];for(const r of targets){const x=after.find(x=>x.id===r.id),quantities=Object.fromEntries(Object.keys(r.kits).map(k=>[k,r.kits[k].total-x.kits[k].total]));try{kitCost+=quoteKitCommand(s,{kind:'purchase',sourceId:r.id,quantities}).cost;recruitCost+=quoteKitCommand(s,{kind:'recruit',sourceId:r.id,amount:r.soldiers.total-x.soldiers.total}).cost;}catch(e){errors.push({source:r.id,error:e.message});}}return {fixture:'Paid-price counterfactual after actual domain loss; not a battle or played recovery route',scope,deaths,kitCost,recruitCost,total:kitCost+recruitCost,initialTreasury:home(s).fiscal.treasury,errors};});
 report.probes.ledgerWindow={retainedDetailedTurns:36,archivedOperatingTurns:72,turnsPerYear:36,maxYearsCovered:3};
 // Income is cash-backed. This labelled fixture isolates the effect of recurring one-off spending on operating score.
 let f=start();for(let turn=1;turn<=36;turn++){postTreasury(f.domestic,'sheng',{turn,income:1000,expense:900,category:'regular',reason:'财政评价对照',key:`review:regular:${turn}`});postTreasury(f.domestic,'sheng',{turn,expense:100,recurring:true,reason:'每旬治理投入对照',key:`review:governance:${turn}`});}
 report.probes.regularVsAllSpending={fixture:'Labelled 36-period accounting fixture; each period regular surplus100 and recurring one-off cost100, total surplus0',fiscalHealth:fiscalHealth(f.domestic),totalNet:sum(home(f).ledger.map(r=>r.net))};
 save();console.log(JSON.stringify({part,probes:Object.keys(report.probes)}));
}else if(part==='policies'){
 for(const mode of ['amnesty20','amnesty27','amnesty29','recovery50to20','recovery50to20reform','temporary30to20','temporary50to20'].filter(mode=>!process.argv.some(a=>a.startsWith('--mode='))||process.argv.includes('--mode='+mode))){let s=start();const original=Math.random;Math.random=random(seed);const row={mode,seed,orders:0,firstDebt:null,firstUnrest:null,firstZeroLoyalty:null,shortfall:0,rows:[metrics(s)]};try{
  if(mode!=='amnesty20')s=tax(s,mode==='amnesty27'?27:mode==='amnesty29'?29:mode==='temporary30to20'?30:50);
  for(let i=0;i<720;i++){
   if((mode.startsWith('recovery50to20')||mode==='temporary30to20')&&i===36||mode==='temporary50to20'&&i===18){row.beforeTaxCut=metrics(s);s=tax(s,20);}
   if(mode.startsWith('amnesty')&&(!s.domestic.justice.lastAmnesty||s.turn-s.domestic.justice.lastAmnesty>=12)&&!courtBlock(s)&&home(s).fiscal.treasury>=Math.max(100,Math.ceil(countrySummary(s.domestic).total*.0001))){s=order(s,x=>executeJustice(x,{id:x.domestic.justice.nextId,kind:'amnesty'}));row.orders++;}
   if(mode==='recovery50to20reform'&&i>=36&&!courtBlock(s)){row.demobilized??=[];const r=worldKitSummary(s.domestic).find(r=>!row.demobilized.includes(r.id)&&r.soldiers.available>=4);if(r){s=order(s,x=>executeKitCommand(x,{id:x.domestic.troopKits.nextId,kind:'dismiss',sourceId:r.id,amount:Math.floor(r.soldiers.available*.5)}));row.demobilized.push(r.id);}}
   if(mode==='recovery50to20reform'&&i>=72&&!courtBlock(s)&&home(s).fiscal.treasury>=6500){const p=countrySummary(s.domestic).provinces.find(p=>(p.civic.taxGrievance??0)<15&&!p.disaster&&(p.foodRelief.lastSettlement?.shortfall??0)===0&&(p.welfare.stability<50||p.status.situation==='unrest'));if(p){s=order(s,x=>executeNational(x,{id:x.domestic.stateDevelopment.nextId,kind:'pacify',provinceId:p.id}));row.pacifications??=[];row.pacifications.push({turn:s.turn,provinceId:p.id,cost:500});row.orders++;}}
   s=step(s);const m=metrics(s);if(m.debt&&!row.firstDebt)row.firstDebt=s.turn;if(m.unrest&&!row.firstUnrest)row.firstUnrest=s.turn;if(m.welfare.loyalty===0&&!row.firstZeroLoyalty)row.firstZeroLoyalty=s.turn;row.shortfall+=nationalFoodForecast(s.domestic,s.turn+1).shortfall;
   if((i+1)%36===0){s=validateSave(JSON.parse(JSON.stringify(s)));if([36,108,360,720].includes(i+1))row.rows.push(metrics(s));}
  }
  if(mode==='recovery50to20reform'&&!courtBlock(s)&&home(s).fiscal.debt>0){const amount=Math.min(home(s).fiscal.debt,Math.max(0,home(s).fiscal.treasury-(s.domestic.governance?.reserve??5000)));if(amount){row.beforeFinalManualRepayment=metrics(s);s=order(s,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'repay',amount}));row.finalManualRepayment=amount;row.orders++;row.rows[row.rows.length-1]=metrics(s);}}
  row.final=metrics(s);
 }catch(e){row.error={turn:s.turn,message:e.message};report.errors.push({mode,...row.error});}finally{Math.random=original;report.scenarios.push(row);save();console.log(JSON.stringify({mode,seed,final:row.final,error:row.error}));}}
}else if(part==='world'){
 let s=start();const original=Math.random;Math.random=random(seed);const row={mode:authorizeRecovery?'recovery-live-world':'default-live-world',seed,battles:0,capitalEvents:0,rows:[metrics(s)],steps:0};try{for(let i=0;i<720&&s.stats.life>0;i++){
  if(s.domestic.strategy.pending?.defender===s.domestic.playerCountryId){s=autoDefense(s).state;if(s.stats.life>0&&!s.domestic.collapse?.pending&&!courtBlock(s))spendEnergy(s,true);row.battles++;}
  if(s.domestic.collapse?.pending){s=resolveCapital(s,{kind:'relocate',provinceId:refugeProvinces(s)[0]?.id}).state;row.capitalEvents++;}
  if(s.domestic.collapse?.ended)break;if(authorizeRecovery&&!courtBlock(s)&&!s.domestic.strategy.pending&&!s.domestic.collapse?.pending){const a=s.domestic.armyRecovery;if(a?.plan?.active&&a.plan.waitingCap){s=order(s,x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'cancel'}));row.recoveryCancellations=(row.recoveryCancellations??0)+1;}else if(a?.offer&&!a.plan?.active){const q=quoteArmyRecovery(s);if(q.gaps.soldiers||Object.values(q.gaps.kits).some(n=>n)||q.gaps.training){s=order(s,x=>executeArmyRecovery(x,{id:x.domestic.armyRecovery.nextId,kind:'start',cap:q.suggestedCap,train:true,draft:true}));row.recoveryAuthorizations=(row.recoveryAuthorizations??0)+1;}}}s=step(s,{peace:false});row.steps++;if(i===359){row.at10=metrics(s);row.foreignAt10=s.domestic.countries.filter(c=>c.id!=='sheng').map(c=>({id:c.id,cash:c.fiscal.treasury,debt:c.fiscal.debt,net:countrySummary(s.domestic,c.id,s.turn).net}));}if((i+1)%36===0){s=validateSave(JSON.parse(JSON.stringify(s)));row.rows.push(metrics(s));}}
 row.final=metrics(s);row.foreign=s.domestic.countries.filter(c=>c.id!=='sheng').map(c=>{const q=countrySummary(s.domestic,c.id,s.turn);return {id:c.id,provinces:c.provinceIds.length,population:q.total,cash:c.fiscal.treasury,debt:c.fiscal.debt,net:q.net,grain:c.fiscal.grain};});
 }catch(e){row.error={turn:s.turn,message:e.message};report.errors.push(row.error);}finally{Math.random=original;report.scenarios.push(row);save();console.log(JSON.stringify({part,seed,final:row.final,battles:row.battles,error:row.error}));}
}else if(part==='foreign-control'){
 for(const growth of [false,true]){let s=start(),p=s.domestic.provinces.find(p=>p.countryId==='cape');const initial={soldiers:p.population.professions.soldiers,net:countrySummary(s.domestic,'cape',1).net,cash:s.domestic.countries.find(c=>c.id==='cape').fiscal.treasury};const row={mode:'cape-no-disaster-no-war',growth,initial};try{for(let i=0;i<360;i++){s.domestic.disasters.lastTurn=s.turn+1;s=step(s);p=s.domestic.provinces.find(p=>p.countryId==='cape');if(growth&&s.turn%6===0){const c=s.domestic.countries.find(c=>c.id==='cape'),budget=Math.min(800,Math.max(0,c.fiscal.treasury-3000));if(budget>=100)growForeignKitArmy(s.domestic,p,budget,s.turn);}if((i+1)%36===0)s=validateSave(JSON.parse(JSON.stringify(s)));}const c=s.domestic.countries.find(c=>c.id==='cape');row.final={turn:s.turn,soldiers:p.population.professions.soldiers,net:countrySummary(s.domestic,'cape',s.turn).net,cash:c.fiscal.treasury,debt:c.fiscal.debt};}catch(e){row.error=e.message;report.errors.push(row.error);}report.scenarios.push(row);save();console.log(JSON.stringify(row));}
}else throw Error('Unknown part');
if(report.errors.length)process.exitCode=1;
