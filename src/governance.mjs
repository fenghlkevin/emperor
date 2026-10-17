import {foodForecast,executeRelief} from './food-relief.mjs';
import {executeIndustry} from './industry.mjs';
import {startConstruction,CONSTRUCTION_PLANS} from './construction.mjs';
import {buildingMarginal,newRecruitTraining,welfareValue} from './building-effects.mjs';
import {activeDisaster} from './disasters.mjs';
import {postTreasury} from './finance.mjs';
export function governorProfile(d,p){
 const o=d.justice.officials.find(o=>o.status==='serving'&&o.provinceId===p.id&&(o.positionId===undefined?o.id:o.positionId)===`${p.id}-governor`);
 const ability=o?Math.round(((o.politics??o.intelligence??50)+(o.intelligence??50)+(o.experience??0))/3):30;
 return {id:o?.id??null,name:o?.name??'署理官',ability,integrity:o?.integrity??50,efficiency:.7+ability/100,lossRate:(100-(o?.integrity??50))/500};
}
export function initializeGovernance(d){d.governance??={version:1,reserve:2000,budget:2000,turnBudget:2000,lastTurn:0,spent:0,records:[]};d.governance.turnBudget??=d.governance.budget;return d;}
export function validateGovernance(d,turn=Infinity){const g=d.governance;if(!g||g.version!==1||!['reserve','budget','turnBudget','lastTurn','spent'].every(k=>Number.isSafeInteger(g[k])&&g[k]>=0)||g.turnBudget>1000000||g.budget>1000000||g.reserve>1000000||g.lastTurn>turn||g.spent>g.turnBudget||!Array.isArray(g.records)||g.records.length>100)throw Error('地方治理记录无效');for(const r of g.records)if(!Number.isSafeInteger(r.turn)||r.turn<1||r.turn>turn||!d.provinces.some(p=>p.id===r.provinceId)||!Number.isSafeInteger(r.cost)||r.cost<0||typeof r.reason!=='string'||r.reason.length>500)throw Error('地方治理记录无效');}
export function settleGovernance(d,turn){
 initializeGovernance(d);const g=d.governance;if(g.lastTurn>=turn)return;if(d.personnel.delegations.length)g.lastTurn=turn;g.spent=0;g.turnBudget=g.budget;
 const home=()=>d.countries.find(c=>c.id===d.playerCountryId),record=(p,reason,cost=0)=>{g.records.unshift({turn,provinceId:p.id,cost,reason});g.records=g.records.slice(0,100);d.personnel.history.unshift(`第${turn}旬：${p.name}委任：${reason}`);d.personnel.history=d.personnel.history.slice(0,100);};
 const cities=d.provinces.filter(p=>p.countryId===d.playerCountryId&&d.personnel.delegations.includes(p.id)).sort((a,b)=>foodForecast(b,turn).shortfall-foodForecast(a,turn).shortfall||welfareValue(a,'stability')-welfareValue(b,'stability')||a.id.localeCompare(b.id));
 for(const city of cities){
  const profile=governorProfile(d,city),f=foodForecast(city,turn),available=()=>Math.max(0,Math.min(g.budget-g.spent,home().fiscal.treasury-g.reserve));
  const apply=(cost,label,fn)=>{const loss=Math.ceil(cost*profile.lossRate),total=cost+loss;if(total>available()){record(city,`${label}暂缓：全国预算或国库保留线不足`);return false;}fn();if(loss)postTreasury(d,d.playerCountryId,{turn,expense:loss,reason:`${city.name}治理损耗`,key:`governance:${turn}:${city.id}:loss:${label}`});g.spent+=total;record(city,`${label}；${profile.name}能力${profile.ability}、清廉${profile.integrity}，实支${total}两（损耗${loss}）`,total);return true;};
  // Existing command handlers operate on a private state; publish only their validated domestic data.
  const publish=result=>{const updated=result.state.domestic;const entry=updated.countries.find(c=>c.id===d.playerCountryId).ledger[0]?.entries.at(-1);if(entry&&entry.reason.endsWith('开工'))entry.reason='委任营建：'+entry.reason; for(const key of Object.keys(updated))if(key!=='governance'&&key!=='personnel'){if(key==='provinces'||key==='countries'){for(const row of updated[key])Object.assign(d[key].find(x=>x.id===row.id),row);}else d[key]=updated[key];}};
  const current=()=>d.provinces.find(p=>p.id===city.id),state=()=>({turn,domestic:d,stats:{treasury:home().fiscal.treasury}});
  if(f.shortfall){const amount=Math.min(f.shortfall,f.purchaseRemaining,Math.floor(available()/(2*(1+profile.lossRate))));if(amount>0)apply(amount*2,`缺粮${f.shortfall}石，购粮${amount}石`,()=>publish(executeRelief(state(),{id:d.foodRelief.nextId,kind:'purchase',targetId:city.id,amount})));else record(city,'缺粮救济暂缓：额度或全国预算不足');continue;}
  if(activeDisaster(city,turn)){record(city,'灾情未退：暂停新工程和军事支出，优先保粮');continue;}
  if(welfareValue(city,'stability')<60||welfareValue(city,'security')<60||welfareValue(city,'loyalty')<60){
   const key=welfareValue(city,'security')<60?'yamen':welfareValue(city,'stability')<60?'temples':'palaces';if(!city.construction.project&&buildingMarginal(city,key,turn)>0)apply(CONSTRUCTION_PLANS[key].cost,'民生不足，兴建'+CONSTRUCTION_PLANS[key].name,()=>publish(startConstruction(state(),city.id,key)));
   else if(city.construction.project){record(city,'民生恢复中：等待现有工程和建筑收益');continue;}
   if(buildingMarginal(city,key,turn)>0)continue;
  }
  if(!city.development.project){const e=city.economy.agriculture,area=Math.min(Math.min(500,Math.round(400*profile.efficiency)),e.capacityArea-e.developedArea,Math.floor(available()/(2*(1+profile.lossRate))));if(area>0&&f.produced<f.need*1.2)apply(area*2,'口粮余量偏低，农业开发'+area+'亩',()=>publish(executeIndustry(state(),{id:d.industryActions.nextId,kind:'develop',provinceId:city.id,industry:'agriculture',area})));}
  if(!current().construction.project){const key=Object.keys(CONSTRUCTION_PLANS).filter(k=>k!=='palaces'&&(k!=='granaries'||current().buildings.granaries<8)&&buildingMarginal(current(),k,turn)>0).sort((a,b)=>current().buildings[a]-current().buildings[b])[0];if(key)apply(CONSTRUCTION_PLANS[key].cost,'补齐地方设施：'+CONSTRUCTION_PLANS[key].name,()=>publish(startConstruction(state(),city.id,key)));}
  if(current().population.professions.soldiers>0&&current().military.training<80)apply(100,'驻军训练不足，练兵',()=>{postTreasury(d,d.playerCountryId,{turn,expense:100,reason:`${city.name}委任练兵`,key:`delegation:${turn}:${city.id}:train`});current().military.training=Math.min(100,current().military.training+Math.max(1,Math.round(3*profile.efficiency)));});
  else if(current().population.professions.soldiers<current().population.total*.01){const p=current(),spare=p.population.total-Object.values(p.population.professions).reduce((a,b)=>a+b,0),n=Math.min(100,spare);if(n>0)apply(n*4,'驻军不足，征兵'+n+'人',()=>{postTreasury(d,d.playerCountryId,{turn,expense:n*4,reason:`${city.name}委任征兵`,key:`delegation:${turn}:${city.id}:recruit`});const old=p.population.professions.soldiers;p.military.training=Math.floor((old*p.military.training+n*newRecruitTraining(p))/(old+n));p.population.professions.soldiers+=n;});}
 }
}
