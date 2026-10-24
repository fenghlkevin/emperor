import {landmarkSelectionIds} from './card-battle-landmarks.mjs';
import {secretSelectionIds} from './card-battle-secrets.mjs';
import {weaponSelectionIds} from './card-battle-weapons.mjs';
import {CARD_RULES} from './card-battle.mjs';
// A public draft estimate of the existing engine capacity, excluding the commander escort.
// Exact troop/person splits depend on each selected leader and parcel size at battle creation.
export function formationCardSummary(formation){
 const n=formation.squads.reduce((sum,u)=>sum+(Number(u.count)||0),0),r=CARD_RULES;
 const k=n?Math.min(r.troopCap+(r.reserveDeckGrowth??0),Math.min(r.troopCap,Math.max(1,Math.floor(n/(r.compactArmy?25:r.unitSize))))+(r.reserveDeckGrowth?Math.floor(Math.max(0,n-1800)/900):0)):0;
 const landmarks=landmarkSelectionIds(formation.cardLandmarks).length,weapons=weaponSelectionIds(formation.cardWeapons).length,secrets=secretSelectionIds(formation.cardSecrets).length;
 return `预计部队／人物 ${k} 张 · 计策 ${r.deckSize-k-weapons-secrets-landmarks} 张${weapons?' · 武器 '+weapons+' 张':''}${secrets?' · 奥秘 '+secrets+' 张':''}${landmarks?' · 地标 '+landmarks+' 张':''}`+(k<12?'；部队牌较少，可增加子队兵力（亲卫不计入）':'；亲卫单独计算，人物随所率部队入牌');
}
