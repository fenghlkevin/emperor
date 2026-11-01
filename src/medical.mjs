import {difficultyFactor} from './difficulty.mjs';
import {postTreasury} from './finance.mjs';

// Outpatient care and the old emergency action share one saved per-turn quota.
export function medicalQuote(s,{emergency=false}={}){
 const cost=Math.ceil(1000*difficultyFactor(s,'medicalCostFactor'));
 const country=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId);
 const healthGain=Math.min(25,100-s.stats.health);
 const energyLoss=Math.min(10,Math.max(0,s.stats.energy-1));
 const happinessLoss=Math.min(5,s.stats.happiness);
 const block=s.stats.life<=0||s.reignResult?'本朝已终，不能再行诊治':
  s.domestic.war?.battle||s.domestic.strategy?.pending?.defender===s.domestic.playerCountryId||s.domestic.collapse?.pending?'请先处理当前战事':
  s.endings.lastTreatmentTurn===s.turn?'本旬已诊治，请遵医嘱静养，下旬可再来':
  emergency&&s.stats.health>30?'目前无须紧急诊治，可前往太医院调养':
  healthGain<=0?'龙体安康，暂不必服药':
  country.fiscal.treasury<cost?`诊金需${cost}两，国库尚缺${cost-country.fiscal.treasury}两`:'';
 return {cost,healthGain,energyLoss,happinessLoss,block};
}
export function treatEmperor(state,options={}){
 const quote=medicalQuote(state,options);
 if(quote.block)throw Error(quote.block);
 const s=structuredClone(state),a=s.stats;
 postTreasury(s.domestic,s.domestic.playerCountryId,{turn:s.turn,expense:quote.cost,key:`imperial-treatment:${s.turn}`,reason:options.emergency?'太医紧急诊治':'太医院诊治'});
 a.health+=quote.healthGain;a.happiness-=quote.happinessLoss;a.energy-=quote.energyLoss;
 // Treatment fatigue never causes an exhaustion penalty. Even zero-stamina patients can be treated.
 s.endings.lastTreatmentTurn=s.turn;s.endings.criticalTurns=0;
 a.treasury=s.domestic.countries.find(c=>c.id===s.domestic.playerCountryId).fiscal.treasury;
 const message=`太医院诊治已毕，健康增加${quote.healthGain}（${state.stats.health}→${a.health}），药后体力减少${quote.energyLoss}、快乐减少${quote.happinessLoss}，诊金${quote.cost}两。本旬请安心静养。`;
 s.endings.history.unshift({turn:s.turn,message});s.endings.history=s.endings.history.slice(0,100);
 return {state:s,message,quote};
}
