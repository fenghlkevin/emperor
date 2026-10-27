import {difficultyRules} from './difficulty.mjs';
import {balanced} from './development-balance.mjs';
import {pastoralLogistics} from './supply-economy.mjs';
import {treasuryShortage,resourceShortage} from './action-feedback.mjs';
import {militaryOrganization,purchaseCost} from './central-office-effects.mjs';
// Per-soldier recurring silver; province soldier registers already include central troops.
export const GARRISON_SILVER_PER_SOLDIER=.028;
// One campaign's additional mobilization/provisions, on top of normal ongoing
// garrison expenses. Combat rounds do not represent extra economic turns.
export const CAMPAIGN_SUPPLY=Object.freeze({version:1,silverPerSoldier:.1,grainPerSoldier:.01});
export const campaignRates=d=>balanced(d)?{silverPerSoldier:difficultyRules(d).campaignSilver,grainPerSoldier:difficultyRules(d).campaignGrain}:CAMPAIGN_SUPPLY;
export const MOUNTED_KITS=['cavalry','heavy-cavalry','horse-archers','camel','elephant'];
export function mountedShare(units){const total=units.reduce((n,u)=>n+(u.initial??u.count),0);return units.reduce((n,u)=>n+(MOUNTED_KITS.includes(u.kind)?u.initial??u.count:0),0)/Math.max(1,total);}
export function campaignSupply(d,count,units=[]){
 if(!Number.isSafeInteger(count)||count<1)throw Error('出征人数无效');
 if(d.resourceRulesVersion!==1)return null;
 const source=d.provinces.find(p=>p.id===d.centralArmy.sourceProvinceId),home=d.countries.find(c=>c.id===d.playerCountryId);
 const rates=campaignRates(d),officer=militaryOrganization(d),logistics=pastoralLogistics(d),baseSilver=Math.ceil(count*rates.silverPerSoldier*(1-logistics)),silver=purchaseCost(baseSilver,1,officer).cost;
 if(units.length&&units.reduce((n,u)=>n+u.count,0)!==count)throw Error('出征兵种人数不一致');
 const mounted=mountedShare(units);
 const grain=Math.ceil(count*rates.grainPerSoldier*(balanced(d)?1+mounted*.5:1));
 if(!source||source.countryId!==home.id)throw Error('出征补给来源无效');
 if(home.fiscal.treasury<silver)throw Error(treasuryShortage(silver,home.fiscal.treasury,`出征${count.toLocaleString('zh-CN')}人整备`));
 if(home.fiscal.grain<grain)throw Error(resourceShortage(`出征${count.toLocaleString('zh-CN')}人补给`,'全国官粮',grain,home.fiscal.grain,'石'));
 return {version:balanced(d)?3:1,count,silver,grain,sourceProvinceId:source.id,officer,...(balanced(d)?{logistics,mounted}: {})};
}

export function garrisonSilver(d,count,countryId=d.playerCountryId){const base=Math.round(count*(d.resourceRulesVersion===1?GARRISON_SILVER_PER_SOLDIER:.025));return countryId===d.playerCountryId?purchaseCost(base,1,militaryOrganization(d)).cost:base;}

export function garrisonExpenseDescription(d,count,countryId){
 const effect=militaryOrganization(d);if(countryId!==d.playerCountryId||!effect.source.id)return '每旬财政收支';
 const q=purchaseCost(Math.round(count*GARRISON_SILVER_PER_SOLDIER),1,effect);
 return `每旬财政收支；兵部尚书${effect.source.name}驻军军需：基准${q.baseCost}两、优惠${q.discount}两、损耗${q.loss}两，实计${q.cost}两`;
}
