import {developmentRate} from './difficulty.mjs';
import {constructionPlan} from './construction.mjs';
import {recoveryGovernanceBudget,recoveryGovernanceReserve} from './army-recovery.mjs';
import {balanced} from './development-balance.mjs';
import {industryLandAvailable} from './terrain-economy.mjs';
import {outputFor,industryTax} from './economy.mjs';
import {reassignDevelopedLand} from './industry-labor.mjs';
import {prepareCoordination,coordinatedBudget,validateCoordination} from './prime-coordination.mjs';
import {procurementEffect,purchaseCost} from './central-office-effects.mjs';
import {cityLand} from './city-capacity.mjs';
import {officialEffectSource} from './official-effects.mjs';
import {trackLocalObstruction,validateLocalObstructions} from './local-obstructions.mjs';
import {proposeLocalRecruitment,validateLocalMilitaryPetitions} from './local-military-petitions.mjs';
import {requestLocalConstruction,validateLocalPetitions,palacePetitionReady} from './local-petitions.mjs';
import {executeKitCommand,quoteKitCommand,worldKitDepot} from './troop-kit-world.mjs';
import {localPolicy,localAuthority} from './local-autonomy.mjs';
import {requireProjectLabor} from './project-labor.mjs';
import {foodForecast,executeRelief,grainSellers,quoteRelief} from './food-relief.mjs';
import {executeIndustry} from './industry.mjs';
import {startConstruction,CONSTRUCTION_PLANS} from './construction.mjs';
import {buildingMarginal,newRecruitTraining,welfareValue} from './building-effects.mjs';
import {activeDisaster} from './disasters.mjs';
import {postTreasury} from './finance.mjs';
import {laborProfile} from './labor.mjs';
export function governorProfile(d,p){return officialEffectSource(d,`${p.id}-governor`,{provinceId:p.id,role:'governor',fallbackAbility:30,fallbackName:'署理官'});}
export function initializeGovernance(d){d.governance??={version:1,reserve:2000,budget:2000,turnBudget:2000,lastTurn:0,spent:0,records:[]};d.governance.turnBudget??=d.governance.budget;return d;}
export function validateGovernance(d,turn=Infinity){validateCoordination(d,turn);validateLocalObstructions(d,turn);validateLocalPetitions(d,turn);validateLocalMilitaryPetitions(d,turn);const g=d.governance;if(!g||g.version!==1||!['reserve','budget','turnBudget','lastTurn','spent'].every(k=>Number.isSafeInteger(g[k])&&g[k]>=0)||g.turnBudget>1000000||g.budget>1000000||g.reserve>1000000||g.lastTurn>turn||g.spent>g.turnBudget||(g.reliefTurn!==undefined&&(!Number.isSafeInteger(g.reliefTurn)||g.reliefTurn<0||g.reliefTurn>turn))||!Array.isArray(g.records)||g.records.length>100)throw Error('地方治理记录无效');for(const r of g.records)if(!Number.isSafeInteger(r.turn)||r.turn<1||r.turn>turn||!d.provinces.some(p=>p.id===r.provinceId)||!Number.isSafeInteger(r.cost)||r.cost<0||typeof r.reason!=='string'||r.reason.length>500)throw Error('地方治理记录无效');}
export function settleGovernance(d,turn,{reliefOnly=false}={}){
 initializeGovernance(d);const g=d.governance;if(g.lastTurn>=turn||(reliefOnly&&g.reliefTurn>=turn))return;
 const rescued=g.reliefTurn===turn,protectedReserve=reliefOnly?0:recoveryGovernanceReserve(d,0,turn);
 if(!rescued){g.spent=0;g.turnBudget=reliefOnly?g.budget:recoveryGovernanceBudget(d,g.budget,turn);}
 if(rescued&&!reliefOnly)g.turnBudget=Math.max(g.spent,recoveryGovernanceBudget(d,g.budget,turn));
 if(reliefOnly){if(!d.personnel.delegations.length)return;g.reliefTurn=turn;}else if(d.personnel.delegations.length)g.lastTurn=turn;
 const forecast=p=>foodForecast(p,turn,reliefOnly?turn:turn+1,d);
 const home=()=>d.countries.find(c=>c.id===d.playerCountryId),record=(p,reason,cost=0)=>{g.records.unshift({turn,provinceId:p.id,cost,reason});g.records=g.records.slice(0,100);d.personnel.history.unshift(`第${turn}旬：${p.name}委任：${reason}`);d.personnel.history=d.personnel.history.slice(0,100);};
 const cities=d.provinces.filter(p=>p.countryId===d.playerCountryId&&d.personnel.delegations.includes(p.id)).sort((a,b)=>forecast(b).shortfall-forecast(a).shortfall||welfareValue(a,'stability')-welfareValue(b,'stability')||a.id.localeCompare(b.id));
 prepareCoordination(d,turn,cities,forecast);
 for(const city of cities){
  const policy=localPolicy(city),authority=city.resourceRulesVersion===1?localAuthority(d,city):{civil:true,military:true};
  const localSpent=()=>g.records.filter(r=>r.turn===turn&&r.provinceId===city.id).reduce((n,r)=>n+r.cost,0);
  const profile=governorProfile(d,city),f=forecast(city),available=(recovery=false)=>Math.max(0,Math.min(g.turnBudget-g.spent,home().fiscal.treasury-Math.max(protectedReserve,(recovery?Math.min(g.reserve,1000):g.reserve)+(balanced(d)&&!recovery?Math.max(0,(home().ledger[0]?.categories.regular?.expenditure??0)-(home().ledger[0]?.categories.regular?.income??0))*6:0)),city.localPolicy?coordinatedBudget(d,city,turn)-localSpent():Infinity));
  const apply=(cost,label,fn,actor=profile,recovery=false)=>{const loss=Math.ceil(cost*actor.lossRate),total=cost+loss;if(total>available(recovery)){record(city,`${label}暂缓：全国预算或国库保留线不足`);return false;}fn();if(loss)postTreasury(d,d.playerCountryId,{turn,expense:loss,recurring:true,reason:`${city.name}治理损耗`,key:`governance:${turn}:${city.id}:loss:${label}`});g.spent+=total;record(city,`${label}；${actor.name}能力${actor.ability}、清廉${actor.integrity}，实支${total}两（损耗${loss}）`,total);return true;};
  // Existing command handlers operate on a private state; publish only their validated domestic data.
  const publish=result=>{const updated=result.state.domestic;const entry=updated.countries.find(c=>c.id===d.playerCountryId).ledger[0]?.entries.at(-1);if(entry&&entry.reason.endsWith('开工'))entry.reason='委任营建：'+entry.reason; for(const key of Object.keys(updated))if(key!=='governance'&&key!=='personnel'){if(key==='provinces'||key==='countries'){for(const row of updated[key])Object.assign(d[key].find(x=>x.id===row.id),row);}else d[key]=updated[key];}};
  const canStaff=(kind,project={})=>{try{requireProjectLabor(d,d.provinces.find(p=>p.id===city.id),kind,project);return true;}catch(error){record(city,'工程暂缓：'+error.message);return false;}};
  const current=()=>d.provinces.find(p=>p.id===city.id),state=()=>({turn,domestic:d,stats:{treasury:home().fiscal.treasury}});
  const build=(key,label,critical=false)=>{
   if(balanced(d)&&home().fiscal.debt){record(city,'偿债恢复中：暂停非救急营建，先保口粮与偿还本金');return false;}
   if(balanced(d)){const regular=home().ledger[0]?.categories.regular;if(regular&&regular.income-regular.expenditure<10){record(city,'营建暂缓：常规收支尚不足承担后续维护');return false;}}
   if(key==='palaces'&&!palacePetitionReady(d,turn))return false;
   const escalate=()=>{if(trackLocalObstruction(d,city,turn,key,true)>=3){requestLocalConstruction(d,city,turn,key,'同一必要工程连续三旬受阻，呈请专项协调钱粮与民夫');record(city,label+'连续三旬受阻，已呈请协调');}};
   if(!canStaff('construction')){escalate();return false;}
   const cost=constructionPlan(current(),key).cost,total=cost+Math.ceil(cost*profile.lossRate),major=['walls','palaces'].includes(key);
   if(city.resourceRulesVersion===1&&(major||(critical&&total>available()))){requestLocalConstruction(d,city,turn,key,major?'重大工程须陛下专项核准':'民生工程超出日常可用预算，须专项请旨');record(city,label+'已呈请，未开工扣款');return false;}
   const done=apply(cost,label,()=>publish(startConstruction(state(),city.id,key)));
   if(done)trackLocalObstruction(d,city,turn,key,false);else escalate();return done;
  };
  if(!authority.civil&&!authority.military){record(city,'地方官职空缺或已收权，暂停自动办理');continue;}
  if(f.national?.shortfall??f.shortfall){const shortage=f.national?.shortfall??f.shortfall;if(!authority.civil){record(city,'缺粮须州牧或陛下办理，暂停军务支出');continue;}if(rescued){record(city,'本旬救急已处理；仍有粮食风险，暂停其他支出');continue;}const seller=grainSellers(state()).find(c=>c.grain>0);if(!seller){record(city,'缺粮购粮暂缓：没有接壤且已开互市的售粮邻国');continue;}const procurement=procurementEffect(d),limit=Math.min(shortage,seller.grain);let low=0,high=limit;while(low<high){const mid=Math.ceil((low+high)/2),cost=quoteRelief(state(),{kind:'purchase',sellerCountryId:seller.id,targetId:city.id,amount:mid},{settlementTurn:reliefOnly?turn:turn+1}).cost;if(cost+Math.ceil(cost*profile.lossRate)<=available())low=mid;else high=mid-1;}const amount=low;if(amount>0)apply(quoteRelief(state(),{kind:'purchase',sellerCountryId:seller.id,targetId:city.id,amount},{settlementTurn:reliefOnly?turn:turn+1}).cost,`全国缺粮${shortage}石，购粮${amount}石`,()=>publish(executeRelief(state(),{id:d.foodRelief.nextId,kind:'purchase',sellerCountryId:seller.id,targetId:city.id,amount},{settlementTurn:reliefOnly?turn:turn+1})));else record(city,'缺粮救济暂缓：额度或全国预算不足');continue;}
  if(reliefOnly)continue;
  if(activeDisaster(city,turn)){record(city,'灾情未退：暂停新工程和军事支出，优先保粮');continue;}
  let civilRecoveryPending=false;
  if(authority.civil&&(welfareValue(city,'stability')<60||welfareValue(city,'security')<60||welfareValue(city,'loyalty')<60)){
   const key=welfareValue(city,'security')<60?'yamen':welfareValue(city,'stability')<60?'temples':'palaces';if(authority.civil&&!city.construction.project&&buildingMarginal(city,key,turn)>0)build(key,'民生不足，兴建'+CONSTRUCTION_PLANS[key].name,true);
   else if(city.construction.project){record(city,'民生恢复中：等待现有工程和建筑收益');civilRecoveryPending=true;}
   if(buildingMarginal(city,key,turn)>0&&(key!=='palaces'||palacePetitionReady(d,turn)))civilRecoveryPending=true;
   if(civilRecoveryPending&&city.resourceRulesVersion!==1)continue;
  }
  if(!balanced(d)&&authority.civil&&!civilRecoveryPending&&!city.development.project){const e=city.economy.agriculture,area=Math.min(Math.min(500,Math.round(400*profile.efficiency)),cityLand(city).available,Math.floor(available()/(developmentRate(d)*(1+profile.lossRate))));if(area>0&&f.produced<f.need*1.2&&canStaff('development',{area}))apply(Math.ceil(area*developmentRate(d)),'口粮余量偏低，农业开发'+area+'亩',()=>publish(executeIndustry(state(),{id:d.industryActions.nextId,kind:'develop',provinceId:city.id,industry:'agriculture',area})));}
  if(balanced(d)&&(!home().fiscal.debt||(home().ledger[0]?.categories.regular?.income??0)<(home().ledger[0]?.categories.regular?.expenditure??0))&&authority.civil&&!city.development.project&&!city.development.plan&&laborProfile(city).available>0){
   const national=f.national??f,foodPriority=national.produced<national.need*1.25;
   const keys=foodPriority?['agriculture','pastoral']:policy.priority==='food'?['agriculture','commerce','industry']:['commerce','industry','agriculture','pastoral'];
   const proposals=keys.map(key=>{const area=Math.min(500,cityLand(city).available,industryLandAvailable(city,key),Math.floor(available(Boolean(home().fiscal.debt&&!foodPriority))/(developmentRate(d)*(1+profile.lossRate))));if(area<50)return null;const preview=structuredClone(city);preview.economy[key].developedArea+=area;reassignDevelopedLand(preview,key,undefined,turn);const gain=foodPriority?outputFor(preview,key,turn)-outputFor(city,key,turn):industryTax(preview,turn)-industryTax(city,turn);return {key,area,gain};}).filter(q=>q&&q.gain>0).sort((a,b)=>b.gain/b.area-a.gain/a.area);
   const plan=proposals[0];if(plan&&canStaff('development',{area:plan.area}))apply(Math.ceil(plan.area*developmentRate(d)),`${foodPriority?'保障粮源':'按收益发展产业'}：${plan.key} ${plan.area}亩`,()=>publish(executeIndustry(state(),{id:d.industryActions.nextId,kind:'develop',provinceId:city.id,industry:plan.key,area:plan.area})),profile,Boolean(home().fiscal.debt&&!foodPriority));
  }
  if(authority.civil&&!civilRecoveryPending&&!current().construction.project&&(!balanced(d)||turn%6===0)){let key=Object.keys(CONSTRUCTION_PLANS).filter(k=>k!=='palaces'&&(k!=='granaries'||current().buildings.granaries<8)&&buildingMarginal(current(),k,turn)>0).sort((a,b)=>current().buildings[a]-current().buildings[b])[0];if(policy.priority==='economy'&&buildingMarginal(current(),'markets',turn)>0)key='markets';if(policy.priority==='security'&&buildingMarginal(current(),'yamen',turn)>0)key='yamen';if(key)build(key,'补齐地方设施：'+CONSTRUCTION_PLANS[key].name);}
  if(!authority.military||balanced(d)&&home().fiscal.debt)continue;
  proposeLocalRecruitment(d,current(),turn);
  const militaryProfile=city.resourceRulesVersion===1?officialEffectSource(d,`${city.id}-general`,{provinceId:city.id,role:'general'}):profile;
  if(city.resourceRulesVersion===1&&d.troopKits){
   const depot=worldKitDepot(d,city.id),stock=Object.values(depot.stock).reduce((sum,n)=>sum+n,0),missing=Math.max(0,depot.soldiers-stock);
   const command=amount=>({id:d.troopKits.nextId,kind:'purchase',sourceId:city.id,quantities:{infantry:amount}});
   // Reserve and record the same discounted price that the command actually pays.
   // Governance loss is consistently based on that net procurement expense.
   let low=0,high=Math.min(missing,100);while(low<high){const mid=Math.ceil((low+high)/2),cost=quoteKitCommand(state(),command(mid)).cost;if(cost+Math.ceil(cost*militaryProfile.lossRate)<=available())low=mid;else high=mid-1;}
   if(low>0)apply(quoteKitCommand(state(),command(low)).cost,`补充现有驻军刀盾兵装${low}人份`,()=>publish(executeKitCommand(state(),command(low))),militaryProfile);
   else if(missing>0)record(city,`驻军缺装${missing}人份：剩余预算不足，暂缓补充`);
  }
  if(current().population.professions.soldiers>0&&current().military.training<80)apply(100,'驻军训练不足，练兵',()=>{postTreasury(d,d.playerCountryId,{turn,expense:100,recurring:true,reason:`${city.name}委任练兵`,key:`delegation:${turn}:${city.id}:train`});current().military.training=Math.min(100,current().military.training+Math.max(1,Math.round(3*(.7+militaryProfile.ability/100))));},militaryProfile);
  else if(city.resourceRulesVersion!==1&&current().population.professions.soldiers<current().population.total*.01){const p=current(),spare=laborProfile(p).available,n=Math.min(100,spare);if(n>0)apply(n*4,'驻军不足，征兵'+n+'人',()=>{postTreasury(d,d.playerCountryId,{turn,expense:n*4,reason:`${city.name}委任征兵`,key:`delegation:${turn}:${city.id}:recruit`});const old=p.population.professions.soldiers;p.military.training=Math.floor((old*p.military.training+n*newRecruitTraining(p))/(old+n));p.population.professions.soldiers+=n;});}
 }
}
