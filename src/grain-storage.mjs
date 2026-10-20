import {effectiveBuildings} from './building-effects.mjs';
import {GRAIN_SAFE_BASE_TURNS,GRAIN_SAFE_BUILDING_TURNS,GRAIN_SAFE_MAX_TURNS,GRAIN_EXCESS_LOSS_RATE} from './balance-rules.mjs';
// Warehouses protect a ration-based turnover reserve. Existing grain is never
// truncated on load or purchase; only excess opening stock decays at settlement.
export function grainStorage(p,turn,opening=p.welfare.grainReserve??0){
 const need=Math.round(p.population.total*.005);
 const protectedTurns=Math.min(GRAIN_SAFE_MAX_TURNS,GRAIN_SAFE_BASE_TURNS+effectiveBuildings(p,turn).granaries*GRAIN_SAFE_BUILDING_TURNS);
 const protectedStock=need*protectedTurns,excess=Math.max(0,opening-protectedStock);
 return {protectedTurns,protectedStock,excess,storageLoss:Math.min(opening,Math.ceil(excess*GRAIN_EXCESS_LOSS_RATE))};
}
