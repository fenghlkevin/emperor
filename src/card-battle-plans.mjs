import {landmarkSelectionIds} from './card-battle-landmarks.mjs';
import {secretSelectionIds} from './card-battle-secrets.mjs';
import {weaponKitCounts,weaponSelectionIds} from './card-battle-weapons.mjs';
import {CARD_RULES} from './card-battle.mjs';
import {armyCardCount,normalizeTacticSelection} from './card-battle-tactics.mjs';
import {battlePlans} from './card-battle-plan-data.mjs';
import {worldKitSummary} from './troop-kit-world.mjs';
import {kitDefenseSources,quoteKitDefense} from './kit-defense.mjs';
import {generals} from './war.mjs';
import {courtCampaignPlan} from './court-campaign.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
export function inspectBattlePlan(state,kind,id,current={}){
 const record=battlePlans(state,kind).find(p=>p.id===id);if(!record)throw Error('方案不存在，请重新选择');
 const formation={...(kind==='campaign'?{targetId:current.targetId??''}:{}),...structuredClone(record.formation)},defense=kind==='defense',errors=[],leaders=generals(state.domestic),used=new Set();
 const sources=defense?kitDefenseSources(state.domestic):worldKitSummary(state.domestic).filter(s=>s.id==='central').map(s=>({sourceId:s.id,name:s.name??'中央禁军',soldiers:s.soldiers.available,kits:Object.fromEntries(Object.entries(s.kits).map(([k,v])=>[k,v.available]))}));
 const rows=[{...formation[defense?'commander':'commanderSquad'],generalId:formation.generalId},...formation.squads],needs=new Map();
 rows.forEach((row,index)=>{
  const who=index===0?'主将亲卫':'第'+index+'子队',sourceId=defense?row.sourceId:'central';
  if(!row.generalId&&!defense||row.generalId&&!leaders.some(g=>g.id===row.generalId))errors.push(who+'将领不可用：'+(row.generalId||'未指定'));
  if(row.generalId&&used.has(row.generalId))errors.push(who+'将领重复：'+row.generalId);if(row.generalId)used.add(row.generalId);
  const source=sources.find(s=>s.sourceId===sourceId);if(!source){errors.push(who+'兵源不可用：'+sourceId);return;}
  const need=needs.get(sourceId)??{soldiers:0,kits:{}};need.soldiers+=row.count;if(row.equipped!==false)need.kits[row.kind]=(need.kits[row.kind]??0)+row.count;needs.set(sourceId,need);
 });
 if(formation.cardWeapons){const need=needs.get(defense?formation.commander.sourceId:'central');if(need)for(const [kind,n]of Object.entries(weaponKitCounts(formation.cardWeapons)))need.kits[kind]=(need.kits[kind]??0)+n;}
 for(const [id,need]of needs){const s=sources.find(s=>s.sourceId===id);if(need.soldiers>s.soldiers)errors.push(s.name+'缺少兵员'+(need.soldiers-s.soldiers)+'人（需'+need.soldiers+'，可用'+s.soldiers+'）');for(const [kind,n]of Object.entries(need.kits))if(n>(s.kits[kind]??0))errors.push(s.name+'缺少'+(TROOP_KITS.find(k=>k.id===kind)?.name??kind)+'装备'+(n-(s.kits[kind]??0))+'份（需'+n+'，可用'+(s.kits[kind]??0)+'）');}
 if(!errors.length)try{if(defense)quoteKitDefense(state,formation);else{normalizeTacticSelection(formation.cardTactics,CARD_RULES.deckSize-landmarkSelectionIds(formation.cardLandmarks).length-weaponSelectionIds(formation.cardWeapons).length-secretSelectionIds(formation.cardSecrets).length-armyCardCount(formation.squads.reduce((n,u)=>n+u.count,0),CARD_RULES));if(formation.targetId)courtCampaignPlan(state,formation);}}catch(e){errors.push(e.message);}
 return {name:record.name,formation,errors};
}
