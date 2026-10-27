import {cardStatuses} from './card-battle-status.mjs';
// Presentation only: persistent layers derive from already committed card state.
export function cardStateEffects(x){
 const effects=[];if(x.buffAttack>0||x.buffHealth>0||x.tags?.some(t=>!x.definition?.tags?.includes(t)&&t!=='shield'))effects.push('enhance');
 if(x.tempAttack)effects.push('temporary');if(x.buffAttack<0||x.buffHealth<0)effects.push('weaken');if(x.frozen)effects.push('freeze');if(x.tags?.includes('shield'))effects.push('shield');if(x.silenced)effects.push('silence');return effects;
}
const negative=s=>s.negative??['weakened','frozen','silenced'].includes(s.tone);
export function cardStateBorders(statuses){return [...(statuses.some(s=>!negative(s))?['positive']:[]),...(statuses.some(negative)?['negative']:[])];}
export function cardSurfaceState(statuses){
 return statuses.flatMap(s=>{const key=s.key.replace(/-negative$/,'');const id=key==='attack'?(negative(s)?'weak':'attack'):key==='health'?(negative(s)?'frail':'health'):key==='temporary-attack'?(negative(s)?'temp-weak':'temp'):({'granted-taunt':'guard','granted-rush':'rush','granted-stealth':'stealth','granted-anti':'anti','granted-anti_horse':'horse','granted-pierce':'pierce',freeze:'freeze',silence:'silence',shield:'shield'})[key];return id?[{id,value:s.value??0}]:[];});
}
export function cardStateEffectMarkup(x,statuses=cardStatuses(x)){
 const states=cardSurfaceState(statuses);return cardStateBorders(statuses).map(kind=>`<i class="cb-state-border cb-state-${kind}" data-state-border="${kind}"></i>`).join('')+(states.length?`<canvas class="cb-state-canvas" aria-hidden="true" data-state-effects="${states.map(s=>s.id).join(' ')}" data-state-values="${states.map(s=>s.id+':'+s.value).join(' ')}"></canvas>`:'');
}
