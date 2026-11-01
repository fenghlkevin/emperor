import {sprites} from './battle-sprite-data.mjs';
export function militaryTroopArt(id){const s=sprites[id],frame=s.walk[0];return `<svg class="military-troop-art" viewBox="${frame.join(' ')}" aria-hidden="true"><image href="${s.asset}" width="${s.width}" height="${s.height}"/></svg>`;}
export function militaryScene(kind){
 const scenes={purchase:['assets/scenes/military/central-arsenal-v1.png','中央武库验收军械','户部采办 · 中央武库'],recruit:['assets/scenes/military/central-recruitment-v1.png','新兵登记入营','新兵入伍'],dismiss:['assets/scenes/tour/sketch-tour-veterans.png','退伍军士返乡','解甲归田'],transfer:['assets/scenes/atlas/sketch-imperial-atlas-v3.png','舆图与军务调度','大将军府 · 调度四方']};
 const [src,alt,title]=scenes[kind];return `<figure class="military-scene-art"><img src="${src}" alt="${alt}"><figcaption>${title}</figcaption></figure>`;
}
