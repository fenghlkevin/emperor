import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
// Current UI new-game rules, isolated peacetime economy plus military resource probes.
// Run: node scripts/audit-development-balance.mjs [--quick]
import {mkdirSync,writeFileSync,readFileSync,existsSync,readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createPlayableGame,advance,validateSave} from '../src/game.mjs';
import {initializeResourceEconomy,quoteProvinceResources} from '../src/province-resources.mjs';
import {initializeNewLocalAutonomy} from '../src/local-autonomy.mjs';
import {enableOfficialProduction} from '../src/official-production.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import {cityLand,cityPopulation} from '../src/city-capacity.mjs';
import {laborProfile} from '../src/labor.mjs';
import {industryStaffing,reassignDevelopedLand} from '../src/industry-labor.mjs';
import {industryLandAvailable} from '../src/terrain-economy.mjs';
import {INDUSTRIES,outputFor,industryTax,foodProduction} from '../src/economy.mjs';
import {executeIndustry,quoteIndustry} from '../src/industry.mjs';
import {executeRevenue} from '../src/revenue.mjs';
import {executePersonnel} from '../src/personnel-actions.mjs';
import {executeJustice} from '../src/justice.mjs';
import {palaceAction,spendEnergy,courtBlock} from '../src/emperor.mjs';
import {projectWorkers,projectLaborOverview} from '../src/project-labor.mjs';
import {CONSTRUCTION_PLANS} from '../src/construction.mjs';
import {buildingMarginal,RECOVERY} from '../src/building-effects.mjs';
import {SPECIAL_PLANS,executeSpecial,quoteSpecial} from '../src/special-buildings.mjs';
import {holdRitual,disasterRisk} from '../src/disasters.mjs';
import {TROOP_KITS} from '../src/troop-kits.mjs';
import {worldKitSummary,quoteKitCommand,executeKitCommand} from '../src/troop-kit-world.mjs';
import {campaignSupply} from '../src/military-costs.mjs';
import {loseForceKits} from '../src/kit-strategy.mjs';
import {grainSellers,quoteRelief} from '../src/food-relief.mjs';
import {executeDiplomacy} from '../src/diplomacy.mjs';

const requestedOutput=process.argv.find(a=>a.startsWith('--output-dir='))?.slice(13);
const output=requestedOutput?pathToFileURL(resolve(requestedOutput)+'/'):new URL('../outputs/development-balance-v2-2026-10-21/',import.meta.url);
mkdirSync(output,{recursive:true});
const sourceFingerprint=createHash('sha256').update(readdirSync(new URL('../src/',import.meta.url)).filter(f=>f.endsWith('.mjs')).sort().map(f=>readFileSync(new URL('../src/'+f,import.meta.url),'utf8')).join('\n')).digest('hex');
const report={sourceFingerprint,developmentBalanceVersion:2,date:'2026-10-21',revision:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),
 methodology:{initialization:'createPlayableGame, shared with app.mjs',
 isolation:'Before advance, strategy.lastTurn is set to the incoming turn, skipping foreign AI management and battles only. Justice, disasters, domestic, personnel, court and dynasty settlement remain enabled.',
 scenarios:'No injected funds, equipment, population, loyalty or ability. Policy orders use domain APIs and court costs. Fixed createdAt, disaster seed and Math.random. Annual JSON save validation.',
 probes:'Static marginal/full-staff counterfactuals and explicitly labelled military loss / low-resource stress fixtures are distinct from playable scenarios.'},opening:null,probes:{},scenarios:[],errors:[]};
const sum=xs=>xs.reduce((a,b)=>a+b,0),home=s=>s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
function start(seed=1){const s=createPlayableGame('发展审计');s.createdAt='2026-10-21T00:00:00.000Z';initializeResourceEconomy(s.domestic);initializeNewLocalAutonomy(s.domestic);enableOfficialProduction(s.domestic,1);s.domestic.disasters.seed=seed;return validateSave(s);}
function rng(seed){let n=seed;return()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);}
function metrics(s){const q=countrySummary(s.domestic,undefined,s.turn),f=nationalFoodForecast(s.domestic,s.turn+1);return {turn:s.turn,treasury:home(s).fiscal.treasury,debt:home(s).fiscal.debt,income:q.income,expense:q.expenditure,net:q.net,grain:q.grainReserve,foodTax:f.produced,publicFoodNeed:f.need,protectedStock:f.protectedStock,foodShortfall:f.shortfall,provinces:q.provinces.length,population:q.total,living:q.livingStandard,welfare:q.welfare,buildings:sum(Object.values(q.buildings)),landUsed:sum(q.provinces.map(p=>cityLand(p).used)),workers:sum(q.provinces.map(p=>laborProfile(p).assigned)),idle:sum(q.provinces.map(p=>laborProfile(p).available)),serving:s.domestic.justice.officials.filter(o=>o.status==='serving').length,health:s.stats.health,happiness:s.stats.happiness,life:s.stats.life};}
function order(s,fn){const block=courtBlock(s);if(block)throw Error(block);const result=fn(s),next=result.state??result;spendEnergy(next,true);return next;}
const personnel=(s,c)=>order(s,x=>executePersonnel(x,{id:x.domestic.personnel.nextId,...c}));
function setTax(s,rate){return order(s,x=>executeRevenue(x,{id:x.domestic.fiscalActions.nextId,kind:'tax',rates:Object.fromEntries(home(x).provinceIds.map(id=>[id,rate]))}));}
function disableDelegation(s){for(const id of home(s).provinceIds)s=personnel(s,{kind:'delegate',provinceId:id,enabled:false});return s;}
function stabilize(s){for(const o of s.domestic.justice.officials.filter(o=>o.loyalty<40))s=personnel(s,{kind:'honor',honor:'rank',officialId:o.id});return s;}
function step(s,trainTalent=false){
 // One court phase followed by daytime recreation and sleep; no pregnancy-dependent recovery.
 // These palace actions do not read domestic. Exclude that large immutable branch
 // from their private clone; production APIs still compute all stat changes.
 const act=(kind)=>{const domestic=s.domestic;s=palaceAction({...s,domestic:undefined},kind).state;s.domestic=domestic;};
 s.phase=1;act('view');s.phase=2;act('sleep');
 if(trainTalent&&s.stats.talent<300){s.phase=3;act('theatre');}
 s.domestic.strategy.lastTurn=s.turn+1;advance(s);return s;
}
const initial=start(),q=countrySummary(initial.domestic,undefined,1),food=nationalFoodForecast(initial.domestic,2);
report.opening={...metrics(initial),expenses:q.expenses,buildingsByType:q.buildings,stats:initial.stats,
 food:{totalProduction:sum(q.provinces.map(p=>foodProduction(p,1).produced)),civilianSurplus:sum(food.provinces.map(r=>r.resource.civilian.surplus)),totalRation:sum(q.provinces.map(p=>Math.round(p.population.total*.005))),tax:food.produced,publicNeed:food.need,stock:food.opening,stockOverPublicNeed:food.opening/food.need},
 provinces:q.provinces.map(p=>({id:p.id,name:p.name,terrain:p.terrain,population:p.population.total,capacity:cityPopulation(p),land:cityLand(p),labor:laborProfile(p),living:p.status.livingStandard,welfare:p.welfare,buildings:p.buildings,economy:p.economy,
 industries:INDUSTRIES.map(([key,name,job,unit])=>({key,name,unit,...industryStaffing(p,key,1),output:outputFor(p,key,1),terrainRoom:industryLandAvailable(p,key)})),risk:disasterRisk(initial.domestic,p,2).total})),
 officials:initial.domestic.justice.officials.map(o=>({id:o.id,name:o.name,loyalty:o.loyalty,age:o.age,intelligence:o.intelligence,politics:o.politics,experience:o.experience,potential:o.potential}))};

report.probes.development=q.provinces.flatMap(p=>INDUSTRIES.map(([key])=>{
 const next=structuredClone(p);next.economy[key].developedArea+=500;reassignDevelopedLand(next,key,undefined,1);
 const tax=industryTax(next,1)-industryTax(p,1),food=foodProduction(next,1).produced-foodProduction(p,1).produced;
 const unstaffed=structuredClone(p);unstaffed.economy[key].developedArea+=500;
 return {province:p.id,industry:key,allowed:industryLandAvailable(p,key)>=500,cost:1000,hired:sum(Object.values(next.population.professions))-sum(Object.values(p.population.professions)),extraOutput:outputFor(next,key,1)-outputFor(p,key,1),extraOutputWithoutHiring:outputFor(unstaffed,key,1)-outputFor(p,key,1),extraFood:food,extraTax:tax,taxPayback:tax>0?1000/tax:null};
}));
report.probes.buildings=q.provinces.flatMap(p=>Object.entries(CONSTRUCTION_PLANS).map(([key,plan])=>({province:p.id,building:key,...plan,count:p.buildings[key],marginal:buildingMarginal(p,key,1),recurringMaintenance:5,atMaxValue:RECOVERY[key]?p.welfare[RECOVERY[key][0]]>=100:null})));
report.probes.special=Object.entries(SPECIAL_PLANS).map(([key,plan])=>{let actual;try{actual=quoteSpecial(initial,{building:key,provinceId:'guannei'});}catch(e){actual={error:e.message};}return {key,...plan,quote:actual};});
report.probes.taxes=[0,12,20,21,25,26,30,50].map(rate=>{const s=start();for(const p of countrySummary(s.domestic).provinces)p.budget.taxRate=rate/100;return {rate,...metrics(s)};});
report.probes.military={depots:worldKitSummary(initial.domestic).map(r=>({id:r.id,soldiers:r.soldiers.total,training:r.training,stock:Object.fromEntries(Object.entries(r.kits).map(([k,v])=>[k,v.total])),replacementCost:sum(TROOP_KITS.map(k=>r.kits[k.id].total*k.price))})),campaigns:[100,1000,1600,10000,41300].map(n=>campaignSupply(initial.domestic,n)),recruitPrices:TROOP_KITS.map(k=>({kind:k.id,kitPrice:k.price,recruitAndEquip100:(k.price+4)*100}))};
const loss=start();loseForceKits(loss.domestic,{countryId:'sheng',sourceId:'central',soldiers:1600,training:60},400);
const before=worldKitSummary(initial.domestic)[0],after=worldKitSummary(loss.domestic)[0];
report.probes.military.loss25percent={fixture:'400 proportional central losses via loseForceKits, no combat simulation',dead:400,kitReplacementCost:sum(TROOP_KITS.map(k=>(before.kits[k.id].total-after.kits[k.id].total)*k.price)),recruitmentCost:1600,populationBefore:countrySummary(initial.domestic).total,populationAfter:countrySummary(loss.domestic).total,remainingCentral:loss.domestic.centralArmy.soldiers};
report.probes.military.recruit1000=quoteKitCommand(initial,{kind:'recruit',sourceId:'central',amount:1000});
const demobilized=executeKitCommand(initial,{id:1,kind:'dismiss',sourceId:'hebei',amount:1000}).state;
report.probes.military.dismiss1000={before:metrics(initial),after:metrics(demobilized)};
report.probes.military.draft50000=(()=>{try{return quoteKitCommand(initial,{kind:'recruit',sourceId:'central',amount:50000,draftRates:{farmers:50,herders:50,merchants:50,workers:50}});}catch(e){return {error:e.message};}})();

// Market gate, free quota-setting, and the obsolete advertised national purchase limit.
report.probes.market={openingSellers:grainSellers(initial).length};
let market=executeDiplomacy(initial,{kind:'trade',countryId:'nanzhao',exports:0,imports:1000000});
report.probes.market.maxImportNegotiation={accepted:market.accepted,message:market.message};
if(market.accepted){const s=market.state;report.probes.market.sellers=grainSellers(s);try{report.probes.market.overAdvertisedQuota=quoteRelief(s,{kind:'purchase',sellerCountryId:'nanzhao',amount:1,targetId:'hebei'}).targetForecast.purchaseLimit;}catch(e){report.probes.market.error=e.message;}}

const quick=process.argv.includes('--quick');
const shardArg=process.argv.find(a=>a.startsWith('--shard='))?.slice(8),shard=shardArg?.split('/').map(Number);
if(shard&&(!Number.isInteger(shard[0])||!Number.isInteger(shard[1])||shard[1]<1||shard[0]<0||shard[0]>=shard[1]||quick))throw Error('Use --shard=index/count for full audits');
const resultName=quick?'quick.json':shard?`results-${shard[0]}-of-${shard[1]}.json`:'results.json';
const mergeCount=Number(process.argv.find(a=>a.startsWith('--merge-shards='))?.slice(15)??0);
if(mergeCount){
 if(!Number.isInteger(mergeCount)||mergeCount<1||mergeCount>16)throw Error('Invalid merge count');
 const parts=Array.from({length:mergeCount},(_,i)=>JSON.parse(readFileSync(new URL(`results-${i}-of-${mergeCount}.json`,output),'utf8')));
 if(parts.some(p=>p.sourceFingerprint!==parts[0].sourceFingerprint||p.revision!==report.revision))throw Error('Shard source mismatch');
 if(parts[0].sourceFingerprint!==sourceFingerprint){
  if(!process.argv.includes('--allow-portrait-asset-update'))throw Error('Shard source mismatch');
  // A concurrent artwork task may move portrait assets. Never waive numerical changes.
  const artFiles=['beauty-raster-portrait.mjs','random-beauties-data.mjs'];
  const oldArt=Object.fromEntries(artFiles.map(f=>[f,execFileSync('git',['show',`HEAD:src/${f}`],{encoding:'utf8'})]));
  const restored=createHash('sha256').update(readdirSync(new URL('../src/',import.meta.url)).filter(f=>f.endsWith('.mjs')).sort().map(f=>oldArt[f]??readFileSync(new URL('../src/'+f,import.meta.url),'utf8')).join('\n')).digest('hex');
  if(restored!==parts[0].sourceFingerprint)throw Error('Changes beyond portrait assets detected');
  const old=await import('data:text/javascript;base64,'+Buffer.from(oldArt['random-beauties-data.mjs']).toString('base64'));
  const current=await import('../src/random-beauties-data.mjs');
  const identities=a=>JSON.stringify(a.map(p=>[p.id,p.regionId??null]));
  if(identities(old.RANDOM_BEAUTY_ART)!==identities(current.RANDOM_BEAUTY_ART))throw Error('Portrait identities, order or regions changed');
  report.postRunSourceFingerprint=sourceFingerprint;report.sourceFingerprint=parts[0].sourceFingerprint;
  report.concurrentArtworkUpdate={files:artFiles,verification:'Reconstructing only these two files from HEAD exactly matches all shard source fingerprints. Portrait IDs, ordering and region assignments are identical. No numerical runtime file changed.'};
 }

 report.scenarios=parts.flatMap(p=>p.scenarios);report.errors=parts.flatMap(p=>p.errors);
 const expected=['default','manual18','manual20','manual25','delegated25','commerce25','tax50'].flatMap(m=>[1,7,41].map(seed=>m+':'+seed)).concat(['amnesty25','ritual25','shigu25','yingtian25','canal25'].map(m=>m+':1'));
 const actual=report.scenarios.map(r=>r.mode+':'+r.seed);
 if(actual.length!==expected.length||new Set(actual).size!==actual.length||expected.some(k=>!actual.includes(k))||report.scenarios.some(r=>!r.final||r.error)||report.errors.length)throw Error('Incomplete or failed audit shards');
 writeFileSync(new URL('results.json',output),JSON.stringify(report,null,2)+'\n');console.log(`Merged ${actual.length} complete scenarios, 0 errors.`);process.exit(0);
}
let scenarioIndex=0;

if(process.argv.includes('--resume')&&existsSync(new URL('results.json',output))){
 const previous=JSON.parse(readFileSync(new URL('results.json',output),'utf8'));
 if(previous.revision!==report.revision||previous.sourceFingerprint!==sourceFingerprint)throw Error('Cannot resume an audit of another revision');
 report.scenarios=previous.scenarios.filter(r=>r.final&&!r.error);
}
const modes=['default','manual18','manual20','manual25','delegated25','commerce25','tax50','amnesty25','ritual25','shigu25','yingtian25','canal25'];
for(const mode of modes)for(const seed of (quick||['amnesty25','ritual25','shigu25','yingtian25','canal25'].includes(mode)?[1]:[1,7,41])){
 const index=scenarioIndex++;if(shard&&index%shard[1]!==shard[0])continue;
 if(report.scenarios.some(r=>r.mode===mode&&r.seed===seed))continue;
 const originalRandom=Math.random;Math.random=rng(seed);let s=start(seed);
 const row={mode,seed,firstDebt:null,firstLoss:null,firstShortfall:null,firstOverload:null,firstZeroCash:null,extraOrders:0,totalFoodShortfall:0,constructionSpend:0,governanceSpend:0,disasterSilverLoss:0,disasterGrainLoss:0,rows:[],specialStarted:null,specialEffective:null};
 const horizon=quick?36:['shigu25','yingtian25','canal25'].includes(mode)?1080:720;
 try{
  if(mode!=='default')s=stabilize(s);
  if(mode.startsWith('manual')||['commerce25','shigu25','yingtian25','canal25'].includes(mode))s=disableDelegation(s);
  if(mode!=='default'&&mode!=='manual20')s=setTax(s,mode==='tax50'?50:mode==='manual18'?18:25);
  row.rows.push(metrics(s));
  for(let i=0;i<horizon;i++){
   if(mode==='commerce25'&&!courtBlock(s)&&home(s).fiscal.treasury>=4000){
    const candidates=countrySummary(s.domestic).provinces.filter(p=>!p.disaster&&!p.development.project&&cityLand(p).available>=500&&industryLandAvailable(p,'commerce')>=500&&laborProfile(p).available>0);
    candidates.sort((a,b)=>outputFor(b,'commerce',s.turn)/b.economy.commerce.developedArea-outputFor(a,'commerce',s.turn)/a.economy.commerce.developedArea);
    if(candidates[0]){s=order(s,x=>executeIndustry(x,{id:x.domestic.industryActions.nextId,kind:'develop',provinceId:candidates[0].id,industry:'commerce',area:500}));row.extraOrders++;}
   }
   if(mode==='amnesty25'&&home(s).fiscal.treasury>=Math.max(100,Math.ceil(countrySummary(s.domestic).total*.0001))&&(!s.domestic.justice.lastAmnesty||s.turn-s.domestic.justice.lastAmnesty>=12)&&!courtBlock(s)&&countrySummary(s.domestic).provinces.some(p=>cityPopulation(p).available>0)){s=order(s,x=>executeJustice(x,{id:x.domestic.justice.nextId,kind:'amnesty'}));row.extraOrders++;}
   if(mode==='ritual25'&&s.turn>=s.domestic.disasters.ritualUntil&&home(s).fiscal.treasury>=5000&&!courtBlock(s)){s=order(s,holdRitual);row.extraOrders++;}
   if(['shigu25','yingtian25','canal25'].includes(mode)&&!row.specialStarted&&!courtBlock(s)){
    const building=mode.replace('25','');try{const p=s.domestic.provinces.find(p=>p.id==='guannei'),shortage=Math.max(0,projectWorkers('special',{building},s.domestic)-projectLaborOverview(s.domestic,p).available);if(shortage){s=order(s,x=>executeIndustry(x,{id:x.domestic.industryActions.nextId,kind:'levy-militia',provinceId:'guannei',amount:shortage,draftRates:{farmers:10}}));row.extraOrders++;}const z=quoteSpecial(s,{building,provinceId:'guannei'});if(z.canAfford){s=order(s,x=>executeSpecial(x,{id:x.domestic.specialWorks.nextId,building,provinceId:'guannei'}));row.specialStarted=s.turn;}}catch(e){if(!/保留线|才艺|受灾|供粮|国库|可征平民|可征调/.test(e.message))throw e;}
   }
   s=step(s,mode==='canal25');const c=home(s),ps=countrySummary(s.domestic).provinces;
   if(c.fiscal.debt&&!row.firstDebt)row.firstDebt=s.turn;
   if(!c.fiscal.treasury&&!row.firstZeroCash)row.firstZeroCash=s.turn;
   if(ps.length<10&&!row.firstLoss)row.firstLoss=s.turn;
   const shortage=sum(ps.map(p=>p.foodRelief.lastSettlement?.shortfall??0));row.totalFoodShortfall+=shortage;
   if(shortage&&!row.firstShortfall)row.firstShortfall=s.turn;
   if(ps.some(p=>cityPopulation(p).overload>0)&&!row.firstOverload)row.firstOverload=s.turn;
   if(row.specialStarted&&!s.domestic.specialWorks.project&&!row.specialEffective)row.specialEffective=s.turn+1;
   const entries=c.ledger.find(r=>r.turn===s.turn)?.entries??[];
   row.constructionSpend+=sum(entries.filter(e=>/开工|营建/.test(e.reason)).map(e=>e.expenditure));
   row.governanceSpend+=s.domestic.governance.spent;
   const disasters=s.domestic.disasters.history.filter(r=>r.turn===s.turn&&ps.some(p=>p.id===r.provinceId));row.disasterSilverLoss+=sum(disasters.map(r=>r.cashLoss));row.disasterGrainLoss+=sum(disasters.map(r=>r.grainLoss));
   if(i%36===35){s=validateSave(JSON.parse(JSON.stringify(s)));if([36,108,180,360,540,720,1080].includes(i+1))row.rows.push(metrics(s));}
  }
  s=validateSave(JSON.parse(JSON.stringify(s)));row.final=metrics(s);
  row.provinceFinal=countrySummary(s.domestic).provinces.map(p=>({id:p.id,living:p.status.livingStandard,welfare:p.welfare,buildings:p.buildings,population:p.population.total,normalPopulation:p.cityCapacity.population,labor:laborProfile(p)}));
 }catch(e){row.error={turn:s.turn,message:e.message,stack:e.stack};report.errors.push({mode,seed,...row.error});}
 finally{Math.random=originalRandom;report.scenarios.push(row);writeFileSync(new URL(resultName,output),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({mode,seed,firstDebt:row.firstDebt,firstLoss:row.firstLoss,final:row.final,error:row.error}));}
}
if(report.errors.length)process.exitCode=1;
