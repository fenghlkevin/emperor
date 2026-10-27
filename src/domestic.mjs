import {difficultyFactor,validateDifficulty} from './difficulty.mjs';
import {validateBattlePlanLibrary} from './card-battle-plan-data.mjs';
import {settleArmyRecovery,validateArmyRecovery} from './army-recovery.mjs';
import {balanced,economicEffort,PLAYER_CUSHION,debtInterest,validateDevelopmentBalance} from './development-balance.mjs';
import {geographicTerrain,initializeProvinceGeography,validateProvinceGeography} from './province-geography.mjs';
import {initializeCityCapacity} from './city-capacity.mjs';
import {settleIndustryHiring} from './industry-labor.mjs';
import {initializeNationalResources,validateNationalResources,settleNationalFood} from './national-resources.mjs';
import {GARRISON_SILVER_PER_SOLDIER,garrisonSilver,garrisonExpenseDescription} from './military-costs.mjs';
import {refreshOfficialProduction,validateOfficialProduction} from './official-production.mjs';
import {prepareLocalLabor} from './local-labor.mjs';
import {validateLocalPolicies} from './local-autonomy.mjs';
import {beginProjectLabor,validateProjectLabor} from './project-labor.mjs';
import {validateResourceSettlement,validateResourceEconomy,settleProvinceGrain} from './province-resources.mjs';
import {validateGrainAccount} from './grain-finance.mjs';
import {CENTRAL_ESTATE_INCOME,PUBLIC_SERVICE_STANDARD,PUBLIC_SERVICE_RATE} from './balance-rules.mjs';
import {initializeTroopKits,validateTroopKits} from './troop-kit-world.mjs';
import {initializeCollapse,validateCollapse} from './capital-crisis.mjs';
import {initializeSpecialWorks,settleSpecialWorks,validateSpecialWorks,refreshSpecialBenefits} from './special-buildings.mjs';
import {initializeDevelopment,effectiveExpense,settleStateDevelopment,validateDevelopment,centralPolicy} from './state-development.mjs';
import {initializeObligations,validateObligations} from './treaty-obligations.mjs';
import {settleOccupation,validateOccupation} from './occupation.mjs';
import {validateGovernance,settleGovernance} from './governance.mjs';
import {initializeRelief,beginReliefTurn,recordFoodSettlement,validateRelief} from './food-relief.mjs';
import {initializeBuildingEffects,settleBuildingEffects,validateBuildingEffects,welfareValue,changeWelfare} from './building-effects.mjs';
import {initializeIndustry,settleIndustry,validateIndustry} from './industry.mjs';
import {INDUSTRIES,JOBS,outputFor,industryTax} from './economy.mjs';
export {INDUSTRIES,JOBS,outputFor} from './economy.mjs';
import {initializeFinance,postTreasury,validateFinance} from './finance.mjs';
import {initializePersonnel,validatePersonnel} from './personnel-actions.mjs';
import {initializeConstruction,settleConstruction,validateConstruction} from './construction.mjs';
import {initializeJustice,validateJustice} from './justice.mjs';
import {initializeDisasters,settleDisasters,validateDisasters} from './disasters.mjs';
import {generalDefaults,settleGeneral} from './general.mjs';
import {createDiplomacy,validateDiplomacy,initializeRites,settleDiplomacy} from './diplomacy.mjs';
// 单位：银两=两，粮食=石，土地=亩，人口=人；所有预算均为每旬。
export const EXPENSES=[['administration','行政开销'],['officialSalaries','官吏薪俸'],['soldierSalaries','士兵薪俸'],['militiaSalaries','民伕薪俸'],['nobleStipends','爵位俸禄'],['weapons','武装购买'],['construction','建设费用'],['maintenance','维护费用'],['other','其他支出']];
export const BUILDINGS=[['temples','寺庙'],['markets','市集'],['palaces','行宫'],['yamen','衙门'],['granaries','义仓'],['walls','城墙'],['trainingGrounds','校场']];
export const WELFARE=[['stability','安定值'],['security','治安值'],['activity','营业值'],['fitness','体能值'],['defense','防御值'],['loyalty','民忠']];
import {PROVINCES,REALMS,CAMPAIGN_VIEW,FRONTIER_IDS} from './scenario-geography.mjs';
export {PROVINCES,REALMS,CAMPAIGN_VIEW} from './scenario-geography.mjs';
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const emptyExpenses=()=>Object.fromEntries(EXPENSES.map(([k])=>[k,0]));
function seedProvince(id,name,terrain,i,countryId){
 const population=160000+i*31000;const professions={farmers:Math.round(population*.38),herders:Math.round(population*.065),merchants:Math.round(population*.09),workers:Math.round(population*.13),soldiers:2600+i*340,militia:1500+i*130};
 const economy=Object.fromEntries(INDUSTRIES.map(([key,,job],j)=>{const capacityArea=30000+i*2100+j*3100;return [key,{developedArea:Math.round(capacityArea*(.38+((i+j)%5)*.08)),capacityArea,productivity:58+((i*7+j*11)%35)}];}));
 return {id,countryId,name,terrain,area:2800000+i*190000,population:{total:population,professions},economy,welfare:{stability:65+i%5*5,security:49+i%6*7,activity:42+i%6*8,fitness:52+i%5*7,defense:30+i%7*8,loyalty:40+i%6*8,grainReserve:17000+i*1700},status:{situation:'stable',livingStandard:38+i%6*8,cash:0},military:{training:48+i%6*7},buildings:{temples:2+i%4,markets:3+i%3,palaces:i===6?1:0,yamen:4+i%4,granaries:2+i%5,walls:3+i%4,trainingGrounds:2+i%3},specialBuildings:[],budget:{otherIncome:80+i*12,expenses:{administration:70+i*4,officialSalaries:80+i*5,soldierSalaries:110+i*8,militiaSalaries:45+i*3,nobleStipends:20,weapons:20,construction:35,maintenance:30,other:15}}};
}
export function createDomestic(treasury=10000){
 const provinces=PROVINCES.map((p,i)=>seedProvince(p.id,p.name,p.terrain,i,'sheng'));
 const countries=REALMS.map((r,i)=>({id:r.id,name:r.name,capital:r.capital,prestige:r.id==='sheng'?50:Math.min(95,30+i*3),relations:r.id==='sheng'?'self':'neutral',provinceIds:r.id==='sheng'?PROVINCES.map(p=>p.id):[`${r.id}-core`],fiscal:{treasury:r.id==='sheng'?treasury:6000+i*700,debt:0,taxRate:.12,otherIncome:r.id==='sheng'?CENTRAL_ESTATE_INCOME:0,centralExpenses:{...emptyExpenses(),administration:120,officialSalaries:80,nobleStipends:60,maintenance:50}},ledger:[]}));
 REALMS.slice(1).forEach((r,i)=>provinces.push(seedProvince(`${r.id}-core`,r.name,geographicTerrain(r.id),i+2,r.id)));
 for(const p of provinces)p.budget.taxRate=countries.find(c=>c.id===p.countryId).fiscal.taxRate;
 const result={schemaVersion:8,worldExpansionVersion:1,geographyVersion:1,fiscalActions:{nextId:1,records:[]},diplomacy:createDiplomacy(countries,'sheng'),playerCountryId:'sheng',countries,provinces,centralArmy:{sourceProvinceId:'guannei',soldiers:1600,training:60}};initializeCityCapacity(result,{fresh:true});result.general=generalDefaults(result);initializeTroopKits(result);return initializeExpandedDomestic(initializeRelief(initializeBuildingEffects(initializeIndustry(initializeFinance(initializePersonnel(initializeConstruction(initializeJustice(initializeDisasters(initializeRites(result))))))))));
}
// Same-schema normalization only: older schemas and missing military stocks are rejected.
// Compatibility boundary: docs/save-compatibility.md.
export function migrateDomestic(d,turn=1){
 if(d?.schemaVersion!==8)throw Error('内政存档版本不支持，请开启新王朝');
 migrateFrontierCountries(d);
 for(const r of REALMS){const p=d.provinces.find(p=>p.id===`${r.id}-core`);if(p?.name===`${r.name}城`)p.name=r.name;}
 initializeProvinceGeography(d);
 return initializeExpandedDomestic(initializeRelief(initializeBuildingEffects(initializeIndustry(initializeFinance(initializePersonnel(initializeConstruction(initializeJustice(initializeDisasters(initializeRites(d)))))),turn),turn)),turn);
}
// Only a complete pre-expansion snapshot is eligible. A partial new-format
// snapshot remains an error rather than silently recreating conquered nations.
function migrateFrontierCountries(d){
 if(d.worldExpansionVersion===1)return;
 if(d.worldExpansionVersion!==undefined)throw Error('外围势力存档版本无效');
 const added=new Set(FRONTIER_IDS),legacy=REALMS.filter(r=>!added.has(r.id));
 if(!Array.isArray(d.countries)||!Array.isArray(d.provinces)||!Array.isArray(d.diplomacy)||
   d.provinces.length!==PROVINCES.length+legacy.length-1||
   !legacy.every(r=>d.countries.some(c=>c.id===r.id))||
   !PROVINCES.every(p=>d.provinces.some(q=>q.id===p.id))||
   !legacy.slice(1).every(r=>d.provinces.some(p=>p.id===r.id+'-core'))||
   d.countries.some(c=>added.has(c.id))||d.provinces.some(p=>added.has(p.id.replace(/-core$/,''))))throw Error('外围势力旧档不完整');
 validateTroopKits(d);
 const fresh=createDomestic();
 d.countries.push(...fresh.countries.filter(c=>added.has(c.id)));
 const provinces=fresh.provinces.filter(p=>added.has(p.countryId));d.provinces.push(...provinces);
 for(const p of provinces){
  d.troopKits.depots[p.id]=fresh.troopKits.depots[p.id];
  // Let the existing local-to-national migration handle older schema-8 saves
  // uniformly, rather than mixing a new national inventory into local stocks.
  if(d.nationalResourcesVersion===undefined){
   const c=d.countries.find(c=>c.id===p.countryId);p.welfare.grainReserve=c.fiscal.grain;p.status.cash=0;
   delete c.fiscal.grain;delete c.grainAccounting;delete c.foodSettlement;delete c.foodSettledTurn;
  }
 }
 d.diplomacy.push(...createDiplomacy(d.countries,d.playerCountryId).filter(r=>r.countryIds.some(id=>added.has(id))));
 d.worldExpansionVersion=1;
}
export function grainSecurity(p,d){if(d?.nationalResourcesVersion===1){const ps=d.provinces.filter(x=>x.countryId===p.countryId),c=d.countries.find(c=>c.id===p.countryId);return Math.min(100,Math.round(c.fiscal.grain/Math.max(1,ps.reduce((n,x)=>n+x.population.total,0)*.005*12)*100));}return 0;}
export function provinceBudget(p,country,turn){const tax=industryTax(p,turn),other=Math.round(p.budget.otherIncome*economicEffort(p)),expenditure=EXPENSES.reduce((n,[k])=>n+(k==='construction'&&p.disaster?0:effectiveExpense(p,k)),0);return {tax,other,income:tax+other,expenditure,net:tax+other-expenditure};}
export function countrySummary(domestic,id=domestic.playerCountryId,turn){const country=domestic.countries.find(c=>c.id===id);const provinces=domestic.provinces.filter(p=>country.provinceIds.includes(p.id));const total=provinces.reduce((n,p)=>n+p.population.total,0);const sum=f=>provinces.reduce((n,p)=>n+f(p),0);const welfare=Object.fromEntries(WELFARE.map(([key])=>[key,Math.round(sum(p=>welfareValue(p,key)*p.population.total)/(total||1))]));const professions=Object.fromEntries(JOBS.map(([key])=>[key,sum(p=>p.population.professions[key])]));const buildings=Object.fromEntries(BUILDINGS.map(([key])=>[key,sum(p=>p.buildings[key])]));const budgets=provinces.map(p=>provinceBudget(p,country,turn));const expenses=Object.fromEntries(EXPENSES.map(([key])=>[key,(provinces.length?country.fiscal.centralExpenses[key]:0)+sum(p=>key==='construction'&&p.disaster?0:effectiveExpense(p,key))]));if(id===domestic.playerCountryId){expenses.officialSalaries+=domestic.justice.officials.filter(o=>o.status==='serving').reduce((n,o)=>n+(balanced(domestic)?2:0)+(o.rank??0)*2+(o.nobilityLevel??0)*5,0);const officer=centralPolicy(domestic,'revenue-minister'),tax=budgets.reduce((n,b)=>n+b.tax,0);if(domestic.officialEffectsVersion!==1)expenses.other+=Math.round(tax*Math.max(0,50-officer.integrity)/1000);}
 let income=budgets.reduce((n,b)=>n+b.income,0)+(provinces.length?country.fiscal.otherIncome:0);if(id===domestic.playerCountryId&&domestic.officialEffectsVersion!==1){const officer=centralPolicy(domestic,'revenue-minister');income+=Math.round(budgets.reduce((n,b)=>n+b.tax,0)*(officer.ability-50)/500);}
 // Military supplies and public services scale with actual people, living standards and buildings.
 expenses.weapons+=Math.round(professions.soldiers*(domestic.resourceRulesVersion===1?GARRISON_SILVER_PER_SOLDIER:.025)+professions.militia*.01)+garrisonSilver(domestic,professions.soldiers,id)-Math.round(professions.soldiers*(domestic.resourceRulesVersion===1?GARRISON_SILVER_PER_SOLDIER:.025));const publicServiceCost=Math.round(sum(p=>p.population.total*(balanced(p)?.0008:PUBLIC_SERVICE_RATE)*Math.max(0,p.status.livingStandard-PUBLIC_SERVICE_STANDARD)/100));expenses.administration+=Math.round(sum(p=>p.population.total*.0002*(.5+(balanced(p)?Math.max(50,p.status.livingStandard):p.status.livingStandard)/100)))+publicServiceCost;expenses.maintenance+=sum(p=>Object.values(p.buildings).reduce((a,b)=>a+b,0)*3);
 if(balanced(domestic)&&country.fiscal.debt)expenses.nobleStipends=Math.ceil(expenses.nobleStipends*.25);
 if(balanced(domestic))expenses.other+=Math.ceil(debtInterest(country.fiscal.debt)*(country.id===domestic.playerCountryId?difficultyFactor(domestic,'debtInterestFactor'):1));
 const expenditure=Object.values(expenses).reduce((a,b)=>a+b,0);return {country,provinces,total,publicServiceCost,area:sum(p=>p.area),professions,dependents:total-Object.values(professions).reduce((a,b)=>a+b,0),welfare,buildings,grainSecurity:Math.round(sum(p=>grainSecurity(p,domestic)*p.population.total)/(total||1)),grainReserve:country.fiscal.grain,income,expenditure,net:income-expenditure,tax:budgets.reduce((n,b)=>n+b.tax,0),otherIncome:budgets.reduce((n,b)=>n+b.other,0)+country.fiscal.otherIncome,expenses,loyalty:welfare.loyalty,military:professions.soldiers,livingStandard:Math.round(sum(p=>p.status.livingStandard*p.population.total)/(total||1))};}
// Ordered sub-pipeline; completion effects and governance timing: docs/turn-settlement.md.
export function settleDomestic(domestic,turn){
 if(domestic.resourceRulesVersion!==1&&domestic.provinces.some(p=>p.resourceSettlement?.turn>=turn))throw Error('试行州本旬已结算，不能混用旧供粮结算');
 refreshOfficialProduction(domestic,turn);
 refreshSpecialBenefits(domestic,turn);
 beginReliefTurn(domestic,turn);
 initializeBuildingEffects(domestic,Math.max(1,turn-1));
 settleDisasters(domestic,turn);
 settleIndustryHiring(domestic,turn);
 prepareLocalLabor(domestic,turn);
 settleGeneral(domestic,turn);
 initializeFinance(domestic);
 for(const country of domestic.countries){if(!country.provinceIds.length)continue;if(country.fiscal.accounting.lastSettledTurn>=turn)continue;const summary=countrySummary(domestic,country.id,turn);postTreasury(domestic,country.id,{turn,income:summary.income,expense:summary.expenditure,allowDebt:true,category:'regular',reason:garrisonExpenseDescription(domestic,summary.military,country.id),key:`regular:${turn}`});country.fiscal.accounting.lastSettledTurn=turn;
  if(balanced(domestic)&&country.fiscal.debt&&summary.net>0){const repayment=Math.min(country.fiscal.debt,Math.floor(summary.net*PLAYER_CUSHION.repaymentShare)+Math.max(0,country.fiscal.treasury-summary.expenditure*6-(country.id===domestic.playerCountryId?(domestic.governance?.reserve??5000):Math.max(1000,summary.expenditure*3))),Math.max(0,country.fiscal.treasury-(country.id===domestic.playerCountryId?(domestic.governance?.reserve??5000):Math.max(1000,summary.expenditure*3))));if(repayment)postTreasury(domestic,country.id,{turn,expense:repayment,debtRepayment:repayment,reason:'财政盈余自动偿还国债本金',key:`repayment:${turn}`});}
  if(domestic.resourceRulesVersion===1&&country.id===domestic.playerCountryId)settleGovernance(domestic,turn,{reliefOnly:true});
  if(domestic.nationalResourcesVersion===1){settleNationalFood(domestic,turn,country.id);for(const p of summary.provinces){settleBuildingEffects(p,turn,p.foodRelief.lastSettlement.shortfall===0,Boolean(p.disaster));if(p.welfare.stability<30&&p.status.situation==='stable')p.status.situation='unrest';}continue;}

 }
 settleDiplomacy(domestic,turn);
 beginProjectLabor(domestic,turn);
 settleConstruction(domestic,turn);
 settleIndustry(domestic,turn);
 settleOccupation(domestic,turn);
 settleSpecialWorks(domestic,turn);
 settleStateDevelopment(domestic,turn);
 refreshOfficialProduction(domestic,turn);
 settleArmyRecovery(domestic,turn);
}
function requireNumber(value,min=0,max=1000000000000,integer=true){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isSafeInteger(value)))throw Error('内政存档含无效数值');}
function requireText(v){if(typeof v!=='string'||!v.trim()||v.length>80)throw Error('内政存档文字格式不正确');}
export function validateDomestic(d,turn){validateDifficulty(d,turn);
 validateBattlePlanLibrary(d.cardBattlePlans);
 validateDevelopmentBalance(d,turn);
 validateArmyRecovery(d,turn);
 if(d?.worldExpansionVersion!==1)throw Error('外围势力存档版本无效');
 validateProvinceGeography(d);
 validateNationalResources(d,turn);
 validateProjectLabor(d,turn);validateLocalPolicies(d,turn);
 validateTroopKits(d);
 if(!d||d.schemaVersion!==8||d.playerCountryId!=='sheng'||!Array.isArray(d.countries)||!Array.isArray(d.provinces)||(d.countries.length<REALMS.length||d.countries.length>REALMS.length+PROVINCES.length)||d.provinces.length!==PROVINCES.length+REALMS.length-1)throw Error('内政存档结构不正确');
 const countryIds=new Set(d.countries.map(c=>c.id)),provinceIds=new Set(d.provinces.map(p=>p.id));if(countryIds.size!==d.countries.length||provinceIds.size!==d.provinces.length||!REALMS.every(r=>countryIds.has(r.id))||!PROVINCES.every(p=>provinceIds.has(p.id))||!REALMS.slice(1).every(r=>provinceIds.has(`${r.id}-core`)))throw Error('国家或州标识无效');
 const training=d.general?.trainingEffect;if(training&&(!Number.isSafeInteger(training.turn)||training.turn<1||training.turn>turn||!['manual','ongoing'].includes(training.mode)||!['before','after','floor'].every(k=>Number.isSafeInteger(training[k])&&training[k]>=0&&training[k]<=100)||training.delta!==training.after-training.before||training.delta<0||!training.source||typeof training.source.name!=='string'||training.source.name.length>80||!(training.source.id===null||typeof training.source.id==='string')||!Number.isSafeInteger(training.source.ability)||training.source.ability<0||training.source.ability>100||training.baseGain!==(training.mode==='manual'?10:2)||training.gainCap!==(training.mode==='manual'?17:3)||!Number.isSafeInteger(training.gain)||training.gain<1||training.gain>training.gainCap||training.delta>training.gain+Math.max(0,training.floor-training.before)))throw Error('中央训练官效记录无效');
 const g=d.general;if(g?.manualTrainingTurn!==undefined&&(!Number.isSafeInteger(g.manualTrainingTurn)||g.manualTrainingTurn<1||g.manualTrainingTurn>turn))throw Error('训练旬序无效');if(!g||typeof g.ongoing!=='boolean')throw Error('中央训练计划无效');requireNumber(g.nextId,1,Number.MAX_SAFE_INTEGER);requireNumber(g.lastTrainingTurn);requireNumber(g.trainingFloor,0,100);if(!d.provinces.some(p=>p.id===g.capitalProvinceId&&(p.countryId===d.playerCountryId||d.collapse?.ended)))throw Error('京城归属无效');
 const central=d.centralArmy,source=d.provinces.find(p=>p.id===central?.sourceProvinceId);if(!source||source.countryId!==d.playerCountryId&&!d.collapse?.ended)throw Error('中央军来源无效');requireNumber(central.soldiers,0,source.population.professions.soldiers);requireNumber(central.training,0,100);
 for(const c of d.countries){requireText(c.name);requireText(c.capital);requireNumber(c.prestige,0,500);if(!['self','neutral','ally','hostile'].includes(c.relations)||!Array.isArray(c.provinceIds)||new Set(c.provinceIds).size!==c.provinceIds.length)throw Error('国家关系或领土无效');requireNumber(c.fiscal.treasury);requireNumber(c.fiscal.debt);requireNumber(c.fiscal.taxRate,0,1,false);requireNumber(c.fiscal.otherIncome);for(const [k]of EXPENSES)requireNumber(c.fiscal.centralExpenses[k]);if(!Array.isArray(c.ledger)||c.ledger.length>36)throw Error('收支历史无效');let previousTurn=Infinity;for(const row of c.ledger){if(row.turn>=previousTurn)throw Error('收支历史旬序重复或倒置');previousTurn=row.turn;requireNumber(row.turn,1);for(const key of ['income','expenditure','closingTreasury','closingDebt'])requireNumber(row[key]);requireNumber(row.net,-Number.MAX_SAFE_INTEGER);if(row.net!==row.income-row.expenditure)throw Error('收支历史不平衡');}for(const id of c.provinceIds){const p=d.provinces.find(p=>p.id===id);if(!p||p.countryId!==c.id)throw Error('州与国家归属不一致');}}
 for(const p of d.provinces){if(!countryIds.has(p.countryId)||!d.countries.find(c=>c.id===p.countryId).provinceIds.includes(p.id))throw Error('州归属无效');requireText(p.name);if(!['平原型','河海型','高山型','丘陵型'].includes(p.terrain))throw Error('地形无效');requireNumber(p.area,1);requireNumber(p.population.total,1);for(const [k]of JOBS)requireNumber(p.population.professions[k]);if(JOBS.reduce((a,[k])=>a+p.population.professions[k],0)>p.population.total)throw Error('职业人口超过总人口');for(const [k]of INDUSTRIES){const e=p.economy[k];requireNumber(e.capacityArea,1);requireNumber(e.developedArea);requireNumber(e.productivity,0,100);}for(const [k]of WELFARE)requireNumber(p.welfare[k],0,100);requireNumber(p.status.livingStandard,0,100,false);if(!['stable','unrest','disaster','war'].includes(p.status.situation))throw Error('情势无效');requireNumber(p.military.training,0,100);for(const [k]of BUILDINGS)requireNumber(p.buildings[k]);if(!Array.isArray(p.specialBuildings)||p.specialBuildings.length>100||new Set(p.specialBuildings.map(b=>b.id)).size!==p.specialBuildings.length)throw Error('特殊建物登记无效');for(const b of p.specialBuildings){requireText(b.id);requireText(b.name);if(typeof b.description!=='string'||b.description.length>500)throw Error('特殊建物说明无效');requireNumber(b.count,1);}requireNumber(p.budget.taxRate,0,1,false);requireNumber(p.budget.otherIncome);for(const [k]of EXPENSES)requireNumber(p.budget.expenses[k]);}
 const actions=d.fiscalActions;if(!actions||!Array.isArray(actions.records)||actions.records.length>100)throw Error('户部政令记录无效');requireNumber(actions.nextId,1,Number.MAX_SAFE_INTEGER);let prior=actions.nextId;for(const r of actions.records){requireNumber(r.id,1,actions.nextId-1);if(r.id>=prior)throw Error('户部政令序号无效');prior=r.id;requireNumber(r.turn,1);if(!['census','purchase','subsidy','tax','levy','repay'].includes(r.kind))throw Error('户部政令类型无效');requireText(r.title);for(const key of ['cost','income','treasuryBefore','treasuryAfter'])requireNumber(r[key]);if(r.treasuryBefore-r.cost+r.income!==r.treasuryAfter||!Array.isArray(r.lines)||r.lines.length>40||r.lines.some(line=>typeof line!=='string'||line.length>200))throw Error('户部政令账目无效');}
 validateCollapse(d,turn);validateFinance(d);
 validateJustice(d);validatePersonnel(d,turn);
 validateDiplomacy(d);
 validateDisasters(d);
 validateConstruction(d);
 validateIndustry(d,turn);
 validateBuildingEffects(d,turn);
 validateRelief(d,turn);
 validateResourceEconomy(d);
 for(const p of d.provinces){validateGrainAccount(p,turn);validateResourceSettlement(p,turn);}
 validateOfficialProduction(d,turn);
 validateGovernance(d,turn);
 validateOccupation(d,turn);
 validateSpecialWorks(d,turn);validateDevelopment(d,turn);validateObligations(d,turn);
 return d;
}

function initializeExpandedDomestic(d,turn=1){initializeCollapse(d);initializeSpecialWorks(d,turn);initializeDevelopment(d,turn);initializeObligations(d);return initializeNationalResources(d,turn);}
