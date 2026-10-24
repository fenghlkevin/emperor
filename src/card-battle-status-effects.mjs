// Presentation only: persistent layers derive from already committed card state.
export function cardStateEffects(x){
 const effects=[];if(x.buffAttack>0||x.buffHealth>0||x.tags?.some(t=>!x.definition?.tags?.includes(t)&&t!=='shield'))effects.push('enhance');
 if(x.tempAttack)effects.push('temporary');if(x.buffAttack<0||x.buffHealth<0)effects.push('weaken');if(x.frozen)effects.push('freeze');if(x.tags?.includes('shield'))effects.push('shield');if(x.silenced)effects.push('silence');return effects;
}
const ice='<svg viewBox="0 0 100 140" preserveAspectRatio="none"><path d="M4 26L13 17 24 25 36 18 52 23 71 17 89 23 96 35 91 57 97 81 91 101 96 126 84 137 64 131 45 138 27 130 9 134 3 116 8 94 3 73 8 52Z"/><path d="M4 26L24 39 11 66M96 35L77 49 91 73M9 134L26 110 16 94M84 137L72 112 88 99M24 25L32 48M71 17L68 38M45 138L48 120"/></svg>';
const mute='<svg viewBox="0 0 32 32"><path d="M7 13h5l7-6v18l-7-6H7Z"/><path d="m22 12 7 8m0-8-7 8"/></svg>';
export function cardStateEffectMarkup(x){return cardStateEffects(x).map(kind=>`<i class="cb-state-effect cb-state-${kind}" data-card-effect="${kind}">${kind==='freeze'?ice:kind==='silence'?mute:''}</i>`).join('');}
