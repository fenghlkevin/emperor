import {facingOf} from './battle.mjs';
import {sprites as troopSprites} from './battle-sprite-data.mjs';
import {battleGeneral,generalSprites} from './battle-general-art.mjs';
import {escortSprites} from './battle-escort-art.mjs';
const sprites={...troopSprites,...generalSprites,...escortSprites};
export const spriteKind=u=>battleGeneral(u.general)?.key??u.kind;
function singlePiece(u){const kind=u.escortKind??spriteKind(u),s=sprites[kind],clipId=`sprite-frame-${String(u.id??kind).replace(/[^a-z0-9_-]/gi,'')}-${u.side}`,ranged=['archers','crossbows'].includes(kind),mounted=s.mounted||['cavalry','heavy-cavalry','camel','elephant','horse-archers'].includes(kind);return `<g transform="scale(${[2,3,4].includes(facingOf(u))?-1:1},1)" class="painted-unit ${u.side}"><g class="unit-idle" data-idle-kind="${mounted?'mounted':kind.startsWith('general-')?'infantry':kind}"><svg class="unit-sprite" data-sprite-kind="${kind}" data-frame="0" x="${s.displayWidth?-s.displayWidth/2:mounted?-54:ranged?-50:-42}" y="${s.displayHeight?24-s.displayHeight:mounted?-91:-88}" width="${s.displayWidth??(mounted?108:ranged?100:84)}" height="${s.displayHeight??112}" viewBox="${s.walk[0].join(' ')}" preserveAspectRatio="xMidYMax meet" overflow="hidden"><defs><clipPath id="${clipId}" clipPathUnits="userSpaceOnUse"><path data-sprite-silhouette d="${s.clipPaths?.[s.walk[0].join(',')]??''}"/><rect display="${s.clipPaths?'none':'inline'}" data-sprite-clip x="${s.walk[0][0]}" y="${s.walk[0][1]}" width="${s.walk[0][2]}" height="${s.walk[0][3]}"/></clipPath></defs><image href="${s.asset}" width="${s.width}" height="${s.height}" clip-path="url(#${clipId})"/></svg></g></g>`;}
export function piece(u){
 const general=battleGeneral(u.general);
 if(!general)return singlePiece(u);
 const mirrored=[2,3,4].includes(facingOf(u)),forward={...u,facing:0};
 const escort=(index,x,y)=>`<g class="unit-escort" data-troop-kind="${u.kind}" transform="translate(${x},${y}) scale(.9)">${singlePiece({...forward,id:`${u.id}-escort-${index}`,general:null,escortKind:escortSprites[`escort-${u.kind}`]?`escort-${u.kind}`:undefined})}</g>`;
 return `<g class="unit-formation painted-unit ${u.side}" transform="scale(${mirrored?-1:1},1)">${escort(0,-48,-2)}<g class="unit-leader" transform="translate(0,4) scale(.88)">${singlePiece(forward)}</g></g>`;

}
export function playFormation(element,action,speed=1){
 const elements=element?.querySelectorAll('.unit-sprite')??[];
 const stops=[...elements].map(sprite=>playSprite(sprite,action,speed));
 return()=>stops.forEach(stop=>stop());
}

function setFrame(element,frame){element.setAttribute('viewBox',frame.join(' '));const clip=element.querySelector?.('[data-sprite-clip]'),clipWidth=sprites[element.dataset.spriteKind]?.clipWidths?.[frame.join(',')];const silhouette=element.querySelector?.('[data-sprite-silhouette]');if(silhouette)silhouette.setAttribute('d',sprites[element.dataset.spriteKind]?.clipPaths?.[frame.join(',')]??'');if(clip)for(const [i,key]of ['x','y','width','height'].entries())clip.setAttribute(key,key==='width'&&clipWidth?clipWidth:frame[i]);}
// Root movement stays continuous; only the painted pose advances at 24 fps.
// A queued RAF timestamp may predate action start; clamp it before indexing frames.
export function playSprite(element,action,speed=1){const s=sprites[element?.dataset.spriteKind];if(!s)return()=>{};element.dataset.animation=action;element.closest('.unit-idle')?.removeAttribute('transform');const poseAction=action==='melee'&&s.clipPaths?'attack':action,frames=poseAction==='melee'?[s.walk[0]]:s[poseAction],fps=s.fps?.[poseAction]??24,start=performance.now();let raf,previous=-1,stopped=false;function tick(now){if(stopped)return;const raw=Math.max(0,Math.floor((now-start)*fps*speed/1000)),i=poseAction==='attack'&&s.attackTimes?s.attackTimes.findLastIndex(t=>Math.max(0,(now-start)*speed/s.attackMs)>=t):action==='walk'?raw%frames.length:Math.min(raw,frames.length-1);if(i!==previous){setFrame(element,frames[Math.max(0,i)]);element.dataset.frame=String(i);element.dataset.animation=action;previous=i;}raf=requestAnimationFrame(tick);}raf=requestAnimationFrame(tick);return()=>{stopped=true;cancelAnimationFrame(raf);setFrame(element,s.walk[0]);element.dataset.frame='0';delete element.dataset.animation;};}
export const attackDuration=u=>{const s=sprites[spriteKind(u)];return s.attackMs??s.attack.length/(s.fps?.attack??24)*1000;};
export const weaponStyle=u=>sprites[spriteKind(u)]?.weapon??null;
