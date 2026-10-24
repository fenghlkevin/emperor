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

// A starting draft for a normal 30-card battle: 100 escort + up to 450 field soldiers.
// The existing automatic formation still supplies only available equipment and serving leaders.
export function initialCardFormation(available,leaders){
 const result=automaticKitFormation(available,leaders),rows=result.squads,total=rows.reduce((n,u)=>n+u.count,0);
 const wanted=Math.min(450,total),caps=rows.map(u=>u.count);let left=wanted;
 // Share the draft across equipped types so archers/infantry cannot consume all room before cavalry.
 for(const row of rows)row.count=0;
 while(left){let changed=false;for(let i=0;i<rows.length&&left;i++)if(rows[i].count<caps[i]){rows[i].count++;left--;changed=true;}if(!changed)break;}
 result.squads=rows.filter(u=>u.count);result.reserve=available.soldiers.available-result.commanderSquad.count-wanted;
 return result;
}
