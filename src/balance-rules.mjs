// Project balance rules, distinct from recovered DOS training/stat units.
export const BALANCE_RULES_VERSION=1;
export const REST_LIFE_COST=0;
export const EXHAUSTION_LIFE_COST=30;
export const COMMERCE_ACTIVITY_SCALE=600;
export const COMMERCE_GROWTH_CAP=.1;
export const PUBLIC_SERVICE_STANDARD=50;
export const PUBLIC_SERVICE_RATE=.0013;
export const CENTRAL_ESTATE_INCOME=400;
export const GRAIN_SAFE_BASE_TURNS=18;
export const GRAIN_SAFE_BUILDING_TURNS=2;
export const GRAIN_SAFE_MAX_TURNS=36;
export const GRAIN_EXCESS_LOSS_RATE=.08;
export function initializeBalance(s){
 if(s.balanceRulesVersion===undefined)s.balanceRulesVersion=BALANCE_RULES_VERSION;
 if(s.balanceRulesVersion!==BALANCE_RULES_VERSION)throw Error('平衡规则版本不支持');
 return s;
}
