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

// Rank actual card strength, then spread available troops across melee and ranged roles.
export function intelligentKitFormation(available,leaders,catalog){
 const officers=[...leaders].sort((a,b)=>(b.leadership*2+b.martial)-(a.leadership*2+a.martial)||String(a.id).localeCompare(String(b.id)));
 const strength=kind=>{const cards=catalog.cards.filter(c=>c.type==='troop'&&c.kind===kind&&c.equipment!=='unarmed');return cards.length?cards.reduce((sum,c)=>sum+(c.attack??0)+(c.health??0)+(c.tags?.length??0),0)/cards.length:0;};
 const kits=TROOP_KITS.filter(k=>available.kits[k.id]?.available>0).sort((a,b)=>strength(b.id)-strength(a.id)||a.id.localeCompare(b.id));
 const ranged=k=>['archers','crossbows','horse-archers'].includes(k.id);
 const choices=[...new Set([kits.find(k=>!ranged(k)),kits.find(ranged),...kits].filter(Boolean))].slice(0,Math.min(7,officers.length));
 if(!choices.length||available.soldiers.available<choices.length)return automaticKitFormation(available,officers);
 let left=available.soldiers.available;const gear=Object.fromEntries(kits.map(k=>[k.id,available.kits[k.id].available]));
 const rows=choices.map((k,i)=>{const count=Math.min(MAX_SQUAD_SOLDIERS,gear[k.id],Math.floor(left/(choices.length-i)));left-=count;gear[k.id]-=count;return {kind:k.id,count,generalId:officers[i].id};});
 for(const row of rows){const extra=Math.min(left,gear[row.kind],MAX_SQUAD_SOLDIERS-row.count);row.count+=extra;gear[row.kind]-=extra;left-=extra;}
 const [guard,...squads]=rows;return {generalId:guard.generalId,commanderSquad:{kind:guard.kind,count:guard.count},squads,reserve:left};
}
