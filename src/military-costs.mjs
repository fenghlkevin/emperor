import {treasuryShortage,resourceShortage} from './action-feedback.mjs';
import {militaryOrganization,purchaseCost} from './central-office-effects.mjs';
// Per-soldier recurring silver; province soldier registers already include central troops.
export const GARRISON_SILVER_PER_SOLDIER=.028;
// One campaign's additional mobilization/provisions, on top of normal ongoing
// garrison expenses. Combat rounds do not represent extra economic turns.
export const CAMPAIGN_SUPPLY=Object.freeze({version:1,silverPerSoldier:.1,grainPerSoldier:.01});
export function campaignSupply(d,count){
 if(!Number.isSafeInteger(count)||count<1)throw Error('出征人数无效');
 if(d.resourceRulesVersion!==1)return null;
 const source=d.provinces.find(p=>p.id===d.centralArmy.sourceProvinceId),home=d.countries.find(c=>c.id===d.playerCountryId);
 const officer=militaryOrganization(d),baseSilver=Math.ceil(count*CAMPAIGN_SUPPLY.silverPerSoldier),silver=purchaseCost(baseSilver,1,officer).cost,grain=Math.ceil(count*CAMPAIGN_SUPPLY.grainPerSoldier);
 if(!source||source.countryId!==home.id)throw Error('出征补给来源无效');
 if(home.fiscal.treasury<silver)throw Error(treasuryShortage(silver,home.fiscal.treasury,`出征${count.toLocaleString('zh-CN')}人整备`));
 if(home.fiscal.grain<grain)throw Error(resourceShortage(`出征${count.toLocaleString('zh-CN')}人补给`,'全国官粮',grain,home.fiscal.grain,'石'));
 return {version:1,count,silver,grain,sourceProvinceId:source.id,officer};
}

export function garrisonSilver(d,count,countryId=d.playerCountryId){const base=Math.round(count*(d.resourceRulesVersion===1?GARRISON_SILVER_PER_SOLDIER:.025));return countryId===d.playerCountryId?purchaseCost(base,1,militaryOrganization(d)).cost:base;}

export function garrisonExpenseDescription(d,count,countryId){
 const effect=militaryOrganization(d);if(countryId!==d.playerCountryId||!effect.source.id)return '每旬财政收支';
 const q=purchaseCost(Math.round(count*GARRISON_SILVER_PER_SOLDIER),1,effect);
 return `每旬财政收支；兵部尚书${effect.source.name}驻军军需：基准${q.baseCost}两、优惠${q.discount}两、损耗${q.loss}两，实计${q.cost}两`;
}
