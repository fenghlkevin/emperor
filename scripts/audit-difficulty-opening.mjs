// Design-only opening audit. Production sources and player saves are never written.
import {readFileSync,writeFileSync} from 'node:fs';
import {createPlayableGame,validateSave} from '../src/game.mjs';
import {countrySummary} from '../src/domestic.mjs';
import {nationalFoodForecast} from '../src/national-resources.mjs';
import {worldKitSummary} from '../src/troop-kit-world.mjs';
import {kitTargetMix} from '../src/troop-kits.mjs';
import {laborProfile} from '../src/labor.mjs';
import {garrisonSilver,campaignSupply} from '../src/military-costs.mjs';
const parameters=JSON.parse(readFileSync(new URL('../docs/design/difficulty-v1.json',import.meta.url)));
const originalRandom=Math.random;let n=1;Math.random=()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);
let base;try{base=createPlayableGame('城市开局审计');}finally{Math.random=originalRandom;}
const cityConfig=JSON.parse(readFileSync(new URL('../docs/design/difficulty-city-opening.json',import.meta.url)));
const standard=cityConfig.standardLocalTroops;
const border=new Set(['hebei','hedong','longyou']),economic=new Set(['henan','huainan','jiangnan','jiannan']);
const tiers=cityConfig.tiers;
function snapshot(s){const d=s.domestic,food=nationalFoodForecast(d,s.turn+1),military=worldKitSummary(d),national=countrySummary(d);return {treasury:national.country.fiscal.treasury,grain:food.grain,publicFoodNeed:food.need,publicFoodCoverage:food.grain/Math.max(1,food.need),income:national.income,expenditure:national.expenditure,net:national.net,regularTroops:national.military,centralTroops:d.centralArmy.soldiers,garrisonSilver:garrisonSilver(d,national.military),militia:national.professions.militia,military,cities:d.provinces.map(p=>({id:p.id,name:p.name,countryId:p.countryId,population:p.population.total,professions:p.population.professions,labor:laborProfile(p),localTroops:p.population.professions.soldiers-(p.id===d.centralArmy.sourceProvinceId?d.centralArmy.soldiers:0),training:p.military.training,economy:p.economy,buildings:p.buildings,cityCapacity:p.cityCapacity,living:p.status.livingStandard,welfare:p.welfare,food: nationalFoodForecast(d,s.turn+1,p.countryId).provinces.find(x=>x.id===p.id),kits:d.troopKits.depots[p.id].stock}))};}
const report={date:'2026-10-26',status:'proposal-only',scope:'Actual baseline for all world cities; player-city military proposal and opening fiscal/food quotes only. No turn simulation or combat outcome claim.',baseline:snapshot(base),tiers:[],errors:[]};
for(const t of tiers){const s=structuredClone(base),d=s.domestic,c=d.countries.find(c=>c.id===d.playerCountryId),param=parameters.tiers.find(p=>p.id===t.id);c.fiscal.treasury=param.silver;c.fiscal.otherIncome+=t.estateIncome-600;s.stats.treasury=param.silver;
 for(const p of d.provinces.filter(p=>p.countryId===d.playerCountryId)){
  if(t.id==='novice'){p.status.livingStandard=Math.max(p.status.livingStandard,t.openingLivingFloor);for(const [key,field] of [['stability','openingStabilityFloor'],['security','openingSecurityFloor'],['loyalty','openingLoyaltyFloor']])p.welfare[key]=Math.max(p.welfare[key],t[field]);}
  const jobs=p.population.professions,old=jobs.soldiers,newLocal=Math.round(standard[p.id]*t.localFactor/50)*50,target=newLocal+(p.id===d.centralArmy.sourceProvinceId?t.central:0);let extra=target-old;
  // Smaller local garrisons return people to civilian work; larger ones draw existing civilians.
  if(extra<0){jobs.workers-=extra;extra=0;}
  for(const job of ['workers','merchants','herders','farmers']){const take=Math.min(extra,Math.floor(jobs[job]*.2));jobs[job]-=take;extra-=take;if(!extra)break;}
  if(extra)throw Error(`Insufficient existing civilians in ${p.id}`);
  jobs.soldiers=target;p.civic.baselineSoldiers=target;
  p.budget.expenses.soldierSalaries=Math.round(p.budget.expenses.soldierSalaries*target/old);
  p.military.training=border.has(p.id)?60:55;
  if(laborProfile(p).assigned!==laborProfile(base.domestic.provinces.find(x=>x.id===p.id)).assigned)throw Error('Assigned population changed');
 }
 d.centralArmy.soldiers=t.central;d.centralArmy.training=t.training;
 for(const row of worldKitSummary(d)){const p=d.provinces.find(p=>p.id===(row.id==='central'?d.centralArmy.sourceProvinceId:row.id)),stock=d.troopKits.depots[row.id].stock,mix=kitTargetMix(p),total=Math.ceil(row.soldiers.total*t.kits);for(const key of Object.keys(stock))stock[key]=Math.floor(total*(mix[key]??0));stock['heavy-cavalry']+=total-Object.values(stock).reduce((a,b)=>a+b,0);}
 // Recalculate initial buffer with the actual public-food forecast, not the legacy provision scalar.
 const need=nationalFoodForecast(d,s.turn+1).need,coverage=t.foodCoverage;c.fiscal.grain=need*coverage;
 try{validateSave(s);const row=snapshot(s),rates={silverPerSoldier:param.campaignSilver,grainPerSoldier:param.campaignGrain};row.id=t.id;row.name=param.name;row.centralCampaignCurrentRules=campaignSupply(d,t.central);row.proposedCampaignBase={silver:Math.ceil(t.central*rates.silverPerSoldier),grain:Math.ceil(t.central*rates.grainPerSoldier),beforeOfficerAndLogisticsDiscount:true};row.rules={...t,foodCoverage:coverage,civilianSource:'existing workers first, at most 20 percent per profession; no population increase',salary:'preserve province original soldier-salary rate',localTraining:'border 60, other 55'};report.tiers.push(row);}catch(e){report.errors.push({tier:t.id,error:e.message});}
}
writeFileSync(new URL('../docs/design/difficulty-city-opening-results.json',import.meta.url),JSON.stringify(report,null,2)+'\n');
const h=report.baseline,home=h.cities.filter(p=>p.countryId===base.domestic.playerCountryId),rows=[];
rows.push('# 城市开局资源与兵力设计','', '2026年10月26日。本补充覆盖每座城市实际开局资源，并以城市驻军和中央军重新设计三档军事起点。全部数字属于新开局设计，未写入正式游戏或玩家存档。','', '## 当前开局','',`全国正规军${h.regularTroops}人，其中中央军${h.centralTroops}人；中央军已经包含在关内人口的士兵项中，不能重复相加。地方正规军共${h.regularTroops-h.centralTroops}人，民兵${h.militia}人。中央仅占正规军${(h.centralTroops/h.regularTroops*100).toFixed(1)}%，单独调兵出征时规模明显小于全国总兵力。`,'',`全国统一银库${h.treasury}两、官粮${h.grain}石。钱粮没有独立城市库存，城市表中的粮赋和需求均是下一旬预测，不是府库存量。木材、铁矿和马匹目前没有独立库存；军备库存按每名士兵一人份装备计算，包含坐骑分配。`,'','|州|人口|地方正规军|民兵|训练|下旬粮赋|下旬官粮需求|现有装备人份|','|---|---:|---:|---:|---:|---:|---:|---:|');
for(const p of home)rows.push(`|${p.name}|${p.population}|${p.localTroops}|${p.professions.militia}|${p.training}|${p.food.produced}|${p.food.need}|${Object.values(p.kits).reduce((n,v)=>n+v,0)}|`);
rows.push('','现有中央军1600人对应刀盾480、长枪400、轻骑320、重骑80、弓兵192、弩兵128人份。装备按多个兵种分散，某个兵种可用人数会比中央军总数更少。地方调兵需要同时调装备，并保留必要守军。','','## 三档城市驻军方案','','各州人口总量、民兵、产业开发面积及建筑先沿用现有开局；增加的正规军从现有平民职业转编，避免凭空增加人口。高难保留标准规模地方守军，差异主要来自中央可动兵力、备用装备、补给和敌方行为。','','|州及定位|新帝登基地方军|励精图治地方军|力挽狂澜地方军|','|---|---:|---:|---:|');
for(const p of home){const role=p.id==='guannei'?'京畿':border.has(p.id)?'边防':economic.has(p.id)?'经济腹地':'区域守备';rows.push(`|${p.name} ${role}|${report.tiers[0].cities.find(x=>x.id===p.id).localTroops}|${standard[p.id]}|${standard[p.id]}|`);}
rows.push('','|项目|新帝登基|励精图治|力挽狂澜|','|---|---:|---:|---:|');
for(const [label,fn] of [['中央军',r=>r.centralTroops],['全国正规军',r=>r.regularTroops],['中央军训练',r=>r.rules.training],['装备覆盖含备装',r=>`${Math.round(r.rules.kits*100)}%`],['庄园固定收入参数',r=>r.rules.estateIncome],['全国开局银两',r=>r.treasury],['全国开局官粮',r=>r.grain],['官粮覆盖当前公共需求旬数',r=>r.rules.foodCoverage],['每旬财政净额按现有收费规则',r=>r.net],['每旬驻军军需银两',r=>r.garrisonSilver]])rows.push(`|${label}|${report.tiers.map(fn).join('|')}|`);
rows.push('','中央军独立列出；关内地方军与中央军相加才是关内人口职业中的士兵。标准档关内总兵11000，其中中央6000、地方5000。初级与高难同样遵循这条规则。','','城市装备按实际驻军配置，初级每100兵配125人份，标准115人份，高难105人份。标准中央军6000人按现有兵种比例配装，备用装备随同配置。边防地方军训练60，其余55，中央训练按难度表；民兵不算作可立即出征的正规军。','','## 城市经济资源基线','','下表四业依次为农业、牧业、商业、工业已开发面积；职业转编会降低相关产业可用劳力，因此不能只把新增兵力写进表而维持原产出不变。增加兵力同时按原人均俸饷比例扩大各州士兵薪资，并重算官粮需求。各州完整职业、建筑、容量、民生、产出、装备和所有外国城市快照保存在同名JSON结果中。','','|州|农业面积|牧业面积|商业面积|工业面积|寺庙 市场 衙门 粮仓 校场 城墙|','|---|---:|---:|---:|---:|---|');
for(const p of home)rows.push(`|${p.name}|${['agriculture','pastoral','commerce','industry'].map(k=>p.economy[k].developedArea).join('|')}|${['temples','markets','yamen','granaries','trainingGrounds','walls'].map(k=>p.buildings[k]).join(' / ')}|`);
rows.push('','## 开局核验与后续推演','','本轮用真实引擎生成开局副本，并验证三档存档结构、人口职业总量守恒、装备分配及初始财政和供粮报价。未推进回合，也未证明增兵后长期财政可持续；上一版108旬结果适用于原有41300人的开局，不能用于本版增兵结论。当前报价沿用正式游戏费用，拟定难度下的单次出征基础成本另存JSON，不混作已实施规则。','','初级和标准增加中央军后，可以在保留部分京畿力量的前提下组织数千人出征。具体战役仍受兵种装备、将领、编队与补给限制，中央人数不等于单场必胜能力。正式实施前需重新执行三档108旬经营与攻守战测试，检查多出的薪资、军粮和抽调劳力。','','外国城市本轮保留当前国家模板，逐城输出实际人口与兵力；高难AI若能更频繁集中兵力，必须实际支付费用并保留守军。不能一边加强玩家中央军，一边凭空给敌方补兵。','','本方案替代上一版仅乘开局装备库存系数的做法。初级采用休闲修订：固定收入参数2400、开局银两80000、官粮覆盖120旬，并抬高初始生活、安定、治安和忠诚下限；标准600、高难400。详见 difficulty-novice-leisure.md。银粮继续全国统一管理，城市展示应提供本州产出、公共需求、可用兵力和装备；若以后引入地方库与运输，须另做库存迁移和守恒设计。','','数据：[完整城市资源与三档开局报价](difficulty-city-opening-results.json)。复现：`node scripts/audit-difficulty-opening.mjs`。');
writeFileSync(new URL('../docs/design/difficulty-city-opening.md',import.meta.url),rows.join('\n')+'\n');
console.log(JSON.stringify({baseline:{regularTroops:h.regularTroops,central:h.centralTroops,net:h.net},tiers:report.tiers.map(r=>({id:r.id,troops:r.regularTroops,central:r.centralTroops,net:r.net,grain:r.grain,foodNeed:r.publicFoodNeed})),errors:report.errors}));if(report.errors.length)process.exitCode=1;
