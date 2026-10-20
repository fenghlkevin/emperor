import {MAX_SQUAD_SOLDIERS} from './formation-limits.mjs';
import {TROOP_KITS} from './troop-kits.mjs';
// Compose from available stock only. Unselected soldiers and gear stay at camp.
export function automaticKitFormation(available,leaders){
 const gear=Object.fromEntries(TROOP_KITS.map(k=>[k.id,available.kits[k.id]?.available??0]));let left=available.soldiers.available;
 const ranked=TROOP_KITS.filter(k=>gear[k.id]>0).sort((a,b)=>gear[b.id]-gear[a.id]||a.id.localeCompare(b.id));
 const guard=gear.infantry>0?'infantry':ranked[0]?.id??'infantry',count=Math.min(100,Math.max(1,Math.floor(left/4)),gear[guard]);
 const result={generalId:leaders[0]?.id??'',commanderSquad:{kind:guard,count},squads:[]};gear[guard]-=count;left-=count;
 const best=predicate=>ranked.find(k=>gear[k.id]>0&&predicate(k))?.id;
 const kinds=[...new Set([best(k=>!!k.origins),best(k=>['archers','crossbows','horse-archers'].includes(k.id)),best(k=>['infantry','spears','cavalry','heavy-cavalry','camel','elephant'].includes(k.id)),...ranked.map(k=>k.id)].filter(Boolean))];
 for(const kind of kinds){const n=Math.min(MAX_SQUAD_SOLDIERS,left,gear[kind]);if(!n||result.squads.length>=6||!leaders[result.squads.length+1])continue;result.squads.push({kind,count:n,generalId:leaders[result.squads.length+1].id});left-=n;}
 return {...result,reserve:left};
}
