import {difficultyFactor} from './difficulty.mjs';
// Development balance v2. Pure helpers are shared by quotes and settlement.
export const DEVELOPMENT_BALANCE_VERSION=2;
export const PLAYER_CUSHION=Object.freeze({openingSilver:30000,estateIncome:600,publicFoodTurns:22,populationRoom:1.15,reserve:7000,debtInterestRate:.0005,repaymentShare:.5});
export const debtInterest=debt=>Math.ceil(debt*PLAYER_CUSHION.debtInterestRate);
export const balanced=x=>x?.developmentBalanceVersion===DEVELOPMENT_BALANCE_VERSION;
export const clamp=(n,min=0,max=100)=>Math.max(min,Math.min(max,n));
export const taxPressure=p=>balanced(p)?p.civic?.taxPressure??0:0;
export const economicEffort=p=>balanced(p)?Math.max(.15,(1-taxPressure(p)*.004-(p.civic?.taxGrievance??0)*.003)*(p.status.situation==='unrest'?.9:1)):1;
export const laborRatio=p=>balanced(p) ? .69 : .75;
export function disasterProduction(p,key,turn){
 if(!balanced(p))return 1;
 const a=p.disaster;
 if(!a||(turn!==undefined&&(turn<a.startTurn||turn>=a.endTurn)))return 1;
 const loss={flood:{agriculture:.45,pastoral:.2,commerce:.2,industry:.2},drought:{agriculture:.5,pastoral:.15},landslide:{industry:.5,commerce:.2},epidemic:{agriculture:.25,pastoral:.25,commerce:.3,industry:.3},fire:{commerce:.35,industry:.45},bandits:{commerce:.35,pastoral:.15},riot:{agriculture:.2,commerce:.5,industry:.4}}[a.kind]?.[key]??0;
 return 1-loss*(a.lastReliefTurn!==undefined?.6:1)*difficultyFactor(p,'disasterLossFactor');
}
export function serviceTarget(p,building,turn){
 const pending=p.buildingEffects?.pending;
 const count=p.buildings[building]-(pending?.building===building&&turn!==undefined&&turn<pending.effectiveTurn?1:0);
 const people=Math.max(100000,p.population.total),coverage=count*100000/people;
 return clamp((building==='palaces'?50:45)+coverage*(building==='palaces'?18:16)+(p.specialServiceBonus?.[building]??0));
}
export function publicFoodBuffer(p){
 const jobs=p.population.professions;
 return Math.max(1,Math.round((jobs.soldiers+jobs.militia)*.005+p.population.total*.005*.02));
}
// Explicit identities, never the position of a realm in an array.
export const REALM_ECONOMIC_TIERS={
 rome:'great',persia:'great',arabia:'great',india:'great',franks:'great',
 tubo:'regional',nanzhao:'regional',korea:'regional',japan:'regional',steppe:'regional',uyghur:'regional','east-turk':'regional','west-turk':'regional',khitan:'regional',slavs:'regional',
 gaochang:'small',xi:'small',tokhara:'small',shule:'small',kucha:'small',tuyuhun:'small',bolur:'small',siberia:'small',mohe:'small',pyu:'small',chenla:'small',srivijaya:'small',java:'small',champa:'small',luzon:'small',axum:'small',maghreb:'small',sinhala:'small',
 'north-sea':'frontier',frostland:'frontier',forestland:'frontier','far-east':'frontier','west-south':'frontier',southland:'frontier','east-coast':'frontier',cape:'frontier'
};
export const REALM_TEMPLATES={great:{population:520000,development:.62,soldiers:.016},regional:{population:320000,development:.54,soldiers:.014},small:{population:220000,development:.46,soldiers:.012},frontier:{population:140000,development:.38,soldiers:.010,productivity:78}};
export function validateDevelopmentBalance(d,turn=Infinity){
 if(d.developmentBalanceVersion===undefined){if(d.provinces.some(p=>p.developmentBalanceVersion!==undefined))throw Error('发展平衡标记不完整');return;}
 if(!balanced(d)||d.resourceRulesVersion!==1)throw Error('发展平衡规则版本无效');
 for(const p of d.provinces){if(!balanced(p))throw Error('州郡发展规则不一致');const grievance=p.civic?.taxGrievance;if(grievance!==undefined&&(!Number.isFinite(grievance)||grievance<0||grievance>100))throw Error('苛税积怨记录无效');const pressure=p.civic?.taxPressure;if(!Number.isFinite(pressure)||pressure<0||pressure>100)throw Error('税负压力记录无效');
  for(const [key,r]of Object.entries(p.specialWorkSegments??{}))if(!['canal','greatWall'].includes(key)||!Number.isSafeInteger(r.count)||r.count<1||r.count>3||!Number.isSafeInteger(r.effectiveTurn)||r.effectiveTurn<2||r.effectiveTurn>turn+1)throw Error('分段工程记录无效');
  const e=p.cityCapacity.expansion;if(e&&(!Number.isSafeInteger(e.startedTurn)||e.startedTurn<1||e.startedTurn>turn||(!Number.isFinite(e.progress)||e.progress*2%1!==0)||e.progress<0||e.progress>=6||!Number.isSafeInteger(e.land)||e.land<1||e.land>5000))throw Error('扩城工程记录无效');
 }
}
