import {CENTRAL_ESTATE_INCOME,PUBLIC_SERVICE_STANDARD,PUBLIC_SERVICE_RATE} from './balance-rules.mjs';
import {initializeTroopKits,validateTroopKits} from './troop-kit-world.mjs';
import {initializeCollapse,validateCollapse} from './capital-crisis.mjs';
import {initializeSpecialWorks,settleSpecialWorks,validateSpecialWorks,refreshSpecialBenefits} from './special-buildings.mjs';
import {initializeDevelopment,effectiveExpense,settleStateDevelopment,validateDevelopment,centralPolicy} from './state-development.mjs';
import {initializeObligations,validateObligations} from './treaty-obligations.mjs';
import {settleOccupation,validateOccupation} from './occupation.mjs';
import {validateGovernance} from './governance.mjs';
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
export const PROVINCES=[
 ['hebei','河北','河海型',[116,39],[[112,38],[115,42],[120,41],[121,37],[117,36],[114,36]]],
 ['henan','河南','平原型',[114,34],[[110,33],[114,32],[118,33],[118,36],[114,36],[112,38],[111,36]]],
 ['huainan','淮南','河海型',[119,32],[[118,30],[122,31],[121,34],[121,37],[118,36],[118,33]]],
 ['jiangnan','江南','平原型',[117,27],[[111,26],[117,25],[120,27],[122,31],[118,30],[118,33],[114,32],[110,33]]],
 ['lingnan','岭南','丘陵型',[110,23],[[105,21],[111,21],[117,23],[120,27],[117,25],[111,26],[108,25]]],
 ['hedong','河东','高山型',[110,39],[[103,38],[102,40],[109,42],[115,42],[112,38],[111,36],[107,36],[107,38]]],
 ['guannei','关内','平原型',[106,35],[[101,34],[103,38],[107,38],[107,36],[111,36],[110,33],[105,32]]],
 ['shannan','山南','平原型',[107,31],[[105,29],[108,28],[111,26],[110,33],[105,32],[101,34],[102,32]]],
 ['jiannan','剑南','高山型',[102,28],[[98,26],[102,24],[105,21],[108,25],[111,26],[108,28],[105,29],[102,32],[99,31]]],
 ['longyou','陇右','丘陵型',[99,36],[[94,34],[96,39],[102,40],[103,38],[101,34],[102,32],[99,31],[96,32]]]
].map(([id,name,terrain,center,polygon])=>({id,name,terrain,center,polygon}));
// 参考图中的每个非本国具名区域，均为独立势力。
export const CAMPAIGN_VIEW=[-12,-64,162,66];
export const REALMS=[
 ['sheng','大晟','长安',[109,35],null],
 ['tubo','吐蕃','逻些',[88,29],[[77,26],[82,33],[89,33],[94,34],[96,32],[99,31],[98,26],[95,20],[89,23],[83,24]]],
 ['nanzhao','南诏','太和',[100,22],[[95,20],[98,26],[102,24],[105,21],[103,18],[99,17]]],
 ['korea','高丽','平壤',[127,39],[[124,34],[128,34],[130,42],[127,43],[124,40]]],
 ['japan','日本','平安京',[138,36],[[130,32],[133,32],[137,35],[141,40],[144,44],[142,45],[138,40],[135,36]]],
 ['steppe','铁勒','王庭',[106,52],[[96,48],[96,58],[111,60],[119,55],[117,49],[111,46],[105,45]]],
 ['uyghur','回纥','瀚海',[87,47],[[82,43],[82,50],[91,52],[96,48],[95,43],[92,40],[88,41]]],
 ['persia','波斯','泰西封',[51,30],[[42,23],[45,34],[53,38],[61,34],[60,26],[53,24],[49,20]]],
 ['arabia','大食','巴格达',[36,20],[[26,33],[37,36],[45,34],[42,23],[49,20],[42,12],[34,12],[28,21]]],
 ['rome','罗马','君士坦丁堡',[20,42],[[0,33],[0,54],[20,57],[35,49],[37,36],[26,33],[20,30]]],
 ['india','天竺','曲女城',[77,20],[[68,23],[74,31],[77,26],[83,24],[89,23],[90,20],[82,16],[77,8],[73,17]]],
 ['west-turk','西突厥','王庭',[65,48],[[47,40],[50,57],[70,60],[80,55],[82,50],[82,43],[76,39],[68,37],[62,39],[53,38]]],
 ['gaochang','高昌','高昌',[82,40],[[76,39],[82,43],[88,41],[88,37],[82,36],[79,37]]],
 ['east-turk','东突厥','王庭',[102,44],[[95,43],[96,48],[105,45],[111,46],[115,42],[109,42],[102,40],[96,39],[92,40]]],
 ['khitan','契丹','王庭',[127,49],[[117,49],[119,55],[130,57],[140,54],[140,46],[130,42],[127,43],[125,46]]],
 ['xi','奚','王庭',[122,44],[[117,49],[125,46],[127,43],[124,40],[120,41],[115,42],[111,46]]],
 ['tokhara','吐火罗','王城',[63,35],[[53,38],[62,39],[68,37],[69,33],[65,28],[60,26],[61,34]]],
 ['shule','疏勒','疏勒',[73,36],[[68,37],[76,39],[79,37],[78,34],[74,31],[69,33]]],
 ['kucha','龟兹','龟兹',[84,35],[[79,37],[82,36],[88,37],[91,38],[94,34],[89,33],[82,33],[78,34]]],
 ['tuyuhun','吐谷浑','王城',[93,31],[[89,33],[94,34],[96,32],[99,31],[98,26],[94,28]]],
 ['bolur','小勃律','王城',[74,29],[[65,28],[69,33],[74,31],[78,34],[82,33],[77,26],[74,26],[68,23]]]
 ,['slavs','斯拉夫','王庭',[32,56],null]
 ,['franks','法兰克','王城',[2,49],null]
 ,['siberia','黠戛斯','王庭',[93,60],null]
 ,['mohe','靺鞨','王庭',[140,55],null]
 ,['pyu','骠国','卑谬',[96,18],null]
 ,['chenla','真腊','伊奢那城',[105,13],null]
 ,['srivijaya','室利佛逝','巨港',[104,0],null]
 ,['java','诃陵','王城',[114,-1],null]
 ,['champa','林邑','占城',[110,17],null]
 ,['luzon','吕宋','王城',[123,16],null]
 ,['axum','阿克苏姆','王城',[39,8],null]
 ,['maghreb','柏柏尔','王庭',[9,25],null]
 ,['sinhala','僧伽罗','王城',[81,7],null]
].map(([id,name,capital,center,polygon])=>({id,name,capital,center,polygon}));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
const emptyExpenses=()=>Object.fromEntries(EXPENSES.map(([k])=>[k,0]));
function seedProvince(id,name,terrain,i,countryId){
 const population=160000+i*31000;const professions={farmers:Math.round(population*.38),herders:Math.round(population*.065),merchants:Math.round(population*.09),workers:Math.round(population*.13),soldiers:2600+i*340,militia:1500+i*130};
 const economy=Object.fromEntries(INDUSTRIES.map(([key,,job],j)=>{const capacityArea=30000+i*2100+j*3100;return [key,{developedArea:Math.round(capacityArea*(.38+((i+j)%5)*.08)),capacityArea,productivity:58+((i*7+j*11)%35)}];}));
 return {id,countryId,name,terrain,area:2800000+i*190000,population:{total:population,professions},economy,welfare:{stability:65+i%5*5,security:49+i%6*7,activity:42+i%6*8,fitness:52+i%5*7,defense:30+i%7*8,loyalty:40+i%6*8,grainReserve:17000+i*1700},status:{situation:'stable',livingStandard:38+i%6*8,cash:1200+i*180},military:{training:48+i%6*7},buildings:{temples:2+i%4,markets:3+i%3,palaces:i===6?1:0,yamen:4+i%4,granaries:2+i%5,walls:3+i%4,trainingGrounds:2+i%3},specialBuildings:[],budget:{otherIncome:80+i*12,expenses:{administration:70+i*4,officialSalaries:80+i*5,soldierSalaries:110+i*8,militiaSalaries:45+i*3,nobleStipends:20,weapons:20,construction:35,maintenance:30,other:15}}};
}
export function createDomestic(treasury=10000){
 const provinces=PROVINCES.map((p,i)=>seedProvince(p.id,p.name,p.terrain,i,'sheng'));
 const countries=REALMS.map((r,i)=>({id:r.id,name:r.name,capital:r.capital,prestige:r.id==='sheng'?50:Math.min(95,30+i*3),relations:r.id==='sheng'?'self':'neutral',provinceIds:r.id==='sheng'?PROVINCES.map(p=>p.id):[`${r.id}-core`],fiscal:{treasury:r.id==='sheng'?treasury:6000+i*700,debt:0,taxRate:.12,otherIncome:r.id==='sheng'?CENTRAL_ESTATE_INCOME:0,centralExpenses:{...emptyExpenses(),administration:120,officialSalaries:80,nobleStipends:60,maintenance:50}},ledger:[]}));
 REALMS.slice(1).forEach((r,i)=>provinces.push(seedProvince(`${r.id}-core`,`${r.name}城`,'平原型',i+2,r.id)));
 for(const p of provinces)p.budget.taxRate=countries.find(c=>c.id===p.countryId).fiscal.taxRate;
 const result={schemaVersion:8,fiscalActions:{nextId:1,records:[]},diplomacy:createDiplomacy(countries,'sheng'),playerCountryId:'sheng',countries,provinces,centralArmy:{sourceProvinceId:'guannei',soldiers:1600,training:60}};result.general=generalDefaults(result);initializeTroopKits(result);return initializeExpandedDomestic(initializeRelief(initializeBuildingEffects(initializeIndustry(initializeFinance(initializePersonnel(initializeConstruction(initializeJustice(initializeDisasters(initializeRites(result))))))))));
}
// Same-schema normalization only: older schemas and missing military stocks are rejected.
// Compatibility boundary: docs/save-compatibility.md.
export function migrateDomestic(d,turn=1){
 if(d?.schemaVersion!==8)throw Error('内政存档版本不支持，请开启新王朝');
 return initializeExpandedDomestic(initializeRelief(initializeBuildingEffects(initializeIndustry(initializeFinance(initializePersonnel(initializeConstruction(initializeJustice(initializeDisasters(initializeRites(d)))))),turn),turn)),turn);
}
export function grainSecurity(p){return Math.min(100,Math.round(p.welfare.grainReserve/(p.population.total*.005*12)*100));}
export function provinceBudget(p,country,turn){const tax=industryTax(p,turn),other=p.budget.otherIncome,expenditure=EXPENSES.reduce((n,[k])=>n+(k==='construction'&&p.disaster?0:effectiveExpense(p,k)),0);return {tax,other,income:tax+other,expenditure,net:tax+other-expenditure};}
export function countrySummary(domestic,id=domestic.playerCountryId,turn){const country=domestic.countries.find(c=>c.id===id);const provinces=domestic.provinces.filter(p=>country.provinceIds.includes(p.id));const total=provinces.reduce((n,p)=>n+p.population.total,0);const sum=f=>provinces.reduce((n,p)=>n+f(p),0);const welfare=Object.fromEntries(WELFARE.map(([key])=>[key,Math.round(sum(p=>welfareValue(p,key)*p.population.total)/(total||1))]));const professions=Object.fromEntries(JOBS.map(([key])=>[key,sum(p=>p.population.professions[key])]));const buildings=Object.fromEntries(BUILDINGS.map(([key])=>[key,sum(p=>p.buildings[key])]));const budgets=provinces.map(p=>provinceBudget(p,country,turn));const expenses=Object.fromEntries(EXPENSES.map(([key])=>[key,(provinces.length?country.fiscal.centralExpenses[key]:0)+sum(p=>key==='construction'&&p.disaster?0:effectiveExpense(p,key))]));if(id===domestic.playerCountryId){expenses.officialSalaries+=domestic.justice.officials.filter(o=>o.status==='serving').reduce((n,o)=>n+(o.rank??0)*2+(o.nobilityLevel??0)*5,0);const officer=centralPolicy(domestic,'revenue-minister'),tax=budgets.reduce((n,b)=>n+b.tax,0);expenses.other+=Math.round(tax*Math.max(0,50-officer.integrity)/1000);}
 let income=budgets.reduce((n,b)=>n+b.income,0)+(provinces.length?country.fiscal.otherIncome:0);if(id===domestic.playerCountryId){const officer=centralPolicy(domestic,'revenue-minister');income+=Math.round(budgets.reduce((n,b)=>n+b.tax,0)*(officer.ability-50)/500);}
 // Military supplies and public services scale with actual people, living standards and buildings.
 expenses.weapons+=Math.round(professions.soldiers*.025+professions.militia*.01);const publicServiceCost=Math.round(sum(p=>p.population.total*PUBLIC_SERVICE_RATE*Math.max(0,p.status.livingStandard-PUBLIC_SERVICE_STANDARD)/100));expenses.administration+=Math.round(sum(p=>p.population.total*.0002*(.5+p.status.livingStandard/100)))+publicServiceCost;expenses.maintenance+=sum(p=>Object.values(p.buildings).reduce((a,b)=>a+b,0)*3);
 const expenditure=Object.values(expenses).reduce((a,b)=>a+b,0);return {country,provinces,total,publicServiceCost,area:sum(p=>p.area),professions,dependents:total-Object.values(professions).reduce((a,b)=>a+b,0),welfare,buildings,grainSecurity:Math.round(sum(p=>grainSecurity(p)*p.population.total)/(total||1)),grainReserve:sum(p=>p.welfare.grainReserve),localCash:sum(p=>p.status.cash),income,expenditure,net:income-expenditure,tax:budgets.reduce((n,b)=>n+b.tax,0),otherIncome:budgets.reduce((n,b)=>n+b.other,0)+country.fiscal.otherIncome,expenses,loyalty:welfare.loyalty,military:professions.soldiers,livingStandard:Math.round(sum(p=>p.status.livingStandard*p.population.total)/(total||1))};}
// Ordered sub-pipeline; completion effects and governance timing: docs/turn-settlement.md.
export function settleDomestic(domestic,turn){
 refreshSpecialBenefits(domestic,turn);
 beginReliefTurn(domestic,turn);
 initializeBuildingEffects(domestic,Math.max(1,turn-1));
 settleDisasters(domestic,turn);
 settleGeneral(domestic,turn);
 initializeFinance(domestic);
 for(const country of domestic.countries){if(!country.provinceIds.length)continue;if(country.fiscal.accounting.lastSettledTurn>=turn)continue;const summary=countrySummary(domestic,country.id,turn);postTreasury(domestic,country.id,{turn,income:summary.income,expense:summary.expenditure,allowDebt:true,category:'regular',reason:'每旬财政收支',key:`regular:${turn}`});country.fiscal.accounting.lastSettledTurn=turn;
  for(const p of summary.provinces){const foodNeed=Math.round(p.population.total*.005);const produced=outputFor(p,'agriculture',turn);const supply=recordFoodSettlement(p,turn,p.welfare.grainReserve,produced,foodNeed);const grain=supply.shortfall?-supply.shortfall:supply.closing;if(grain<0){changeWelfare(p,'stability',-2);changeWelfare(p,'loyalty',-1);}p.welfare.grainReserve=Math.max(0,grain);settleBuildingEffects(p,turn,grain>=0,Boolean(p.disaster));if(p.welfare.stability<30&&p.status.situation==='stable')p.status.situation='unrest';}
 }
 settleDiplomacy(domestic,turn);
 settleConstruction(domestic,turn);
 settleIndustry(domestic,turn);
 settleOccupation(domestic,turn);
 settleSpecialWorks(domestic,turn);
 settleStateDevelopment(domestic,turn);
}
function requireNumber(value,min=0,max=1000000000000,integer=true){if(typeof value!=='number'||!Number.isFinite(value)||value<min||value>max||(integer&&!Number.isSafeInteger(value)))throw Error('内政存档含无效数值');}
function requireText(v){if(typeof v!=='string'||!v.trim()||v.length>80)throw Error('内政存档文字格式不正确');}
export function validateDomestic(d,turn){
 validateTroopKits(d);
 if(!d||d.schemaVersion!==8||d.playerCountryId!=='sheng'||!Array.isArray(d.countries)||!Array.isArray(d.provinces)||(d.countries.length<REALMS.length||d.countries.length>REALMS.length+PROVINCES.length)||d.provinces.length!==PROVINCES.length+REALMS.length-1)throw Error('内政存档结构不正确');
 const countryIds=new Set(d.countries.map(c=>c.id)),provinceIds=new Set(d.provinces.map(p=>p.id));if(countryIds.size!==d.countries.length||provinceIds.size!==d.provinces.length||!REALMS.every(r=>countryIds.has(r.id))||!PROVINCES.every(p=>provinceIds.has(p.id))||!REALMS.slice(1).every(r=>provinceIds.has(`${r.id}-core`)))throw Error('国家或州标识无效');
 const g=d.general;if(!g||typeof g.ongoing!=='boolean')throw Error('中央训练计划无效');requireNumber(g.nextId,1,Number.MAX_SAFE_INTEGER);requireNumber(g.lastTrainingTurn);requireNumber(g.trainingFloor,0,100);if(!d.provinces.some(p=>p.id===g.capitalProvinceId&&(p.countryId===d.playerCountryId||d.collapse?.ended)))throw Error('京城归属无效');
 const central=d.centralArmy,source=d.provinces.find(p=>p.id===central?.sourceProvinceId);if(!source||source.countryId!==d.playerCountryId&&!d.collapse?.ended)throw Error('中央军来源无效');requireNumber(central.soldiers,0,source.population.professions.soldiers);requireNumber(central.training,0,100);
 for(const c of d.countries){requireText(c.name);requireText(c.capital);requireNumber(c.prestige,0,500);if(!['self','neutral','ally','hostile'].includes(c.relations)||!Array.isArray(c.provinceIds)||new Set(c.provinceIds).size!==c.provinceIds.length)throw Error('国家关系或领土无效');requireNumber(c.fiscal.treasury);requireNumber(c.fiscal.debt);requireNumber(c.fiscal.taxRate,0,1,false);requireNumber(c.fiscal.otherIncome);for(const [k]of EXPENSES)requireNumber(c.fiscal.centralExpenses[k]);if(!Array.isArray(c.ledger)||c.ledger.length>36)throw Error('收支历史无效');let previousTurn=Infinity;for(const row of c.ledger){if(row.turn>=previousTurn)throw Error('收支历史旬序重复或倒置');previousTurn=row.turn;requireNumber(row.turn,1);for(const key of ['income','expenditure','closingTreasury','closingDebt'])requireNumber(row[key]);requireNumber(row.net,-Number.MAX_SAFE_INTEGER);if(row.net!==row.income-row.expenditure)throw Error('收支历史不平衡');}for(const id of c.provinceIds){const p=d.provinces.find(p=>p.id===id);if(!p||p.countryId!==c.id)throw Error('州与国家归属不一致');}}
 for(const p of d.provinces){if(!countryIds.has(p.countryId)||!d.countries.find(c=>c.id===p.countryId).provinceIds.includes(p.id))throw Error('州归属无效');requireText(p.name);if(!['平原型','河海型','高山型','丘陵型'].includes(p.terrain))throw Error('地形无效');requireNumber(p.area,1);requireNumber(p.population.total,1);for(const [k]of JOBS)requireNumber(p.population.professions[k]);if(JOBS.reduce((a,[k])=>a+p.population.professions[k],0)>p.population.total)throw Error('职业人口超过总人口');for(const [k]of INDUSTRIES){const e=p.economy[k];requireNumber(e.capacityArea,1);requireNumber(e.developedArea,0,e.capacityArea);requireNumber(e.productivity,0,100);}for(const [k]of WELFARE)requireNumber(p.welfare[k],0,100);requireNumber(p.welfare.grainReserve);requireNumber(p.status.cash,-Number.MAX_SAFE_INTEGER);requireNumber(p.status.livingStandard,0,100);if(!['stable','unrest','disaster','war'].includes(p.status.situation))throw Error('情势无效');requireNumber(p.military.training,0,100);for(const [k]of BUILDINGS)requireNumber(p.buildings[k]);if(!Array.isArray(p.specialBuildings)||p.specialBuildings.length>100||new Set(p.specialBuildings.map(b=>b.id)).size!==p.specialBuildings.length)throw Error('特殊建物登记无效');for(const b of p.specialBuildings){requireText(b.id);requireText(b.name);if(typeof b.description!=='string'||b.description.length>500)throw Error('特殊建物说明无效');requireNumber(b.count,1);}requireNumber(p.budget.taxRate,0,1,false);requireNumber(p.budget.otherIncome);for(const [k]of EXPENSES)requireNumber(p.budget.expenses[k]);}
 const actions=d.fiscalActions;if(!actions||!Array.isArray(actions.records)||actions.records.length>100)throw Error('户部政令记录无效');requireNumber(actions.nextId,1,Number.MAX_SAFE_INTEGER);let prior=actions.nextId;for(const r of actions.records){requireNumber(r.id,1,actions.nextId-1);if(r.id>=prior)throw Error('户部政令序号无效');prior=r.id;requireNumber(r.turn,1);if(!['census','purchase','subsidy','tax','levy'].includes(r.kind))throw Error('户部政令类型无效');requireText(r.title);for(const key of ['cost','income','treasuryBefore','treasuryAfter'])requireNumber(r[key]);if(r.treasuryBefore-r.cost+r.income!==r.treasuryAfter||!Array.isArray(r.lines)||r.lines.length>40||r.lines.some(line=>typeof line!=='string'||line.length>200))throw Error('户部政令账目无效');}
 validateCollapse(d,turn);validateFinance(d);
 validateJustice(d);validatePersonnel(d);
 validateDiplomacy(d);
 validateDisasters(d);
 validateConstruction(d);
 validateIndustry(d,turn);
 validateBuildingEffects(d,turn);
 validateRelief(d,turn);
 validateGovernance(d,turn);
 validateOccupation(d,turn);
 validateSpecialWorks(d,turn);validateDevelopment(d,turn);validateObligations(d,turn);
 return d;
}

function initializeExpandedDomestic(d,turn=1){initializeCollapse(d);initializeSpecialWorks(d,turn);initializeDevelopment(d,turn);initializeObligations(d);return d;}
