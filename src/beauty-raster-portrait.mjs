import {tourCameo} from './tour-cameos.mjs';
import {featuredBeautyFor} from './beauties.mjs';
import {RANDOM_BEAUTY_ART,RANDOM_PORTRAITS,resolveRandomPortraitAsset} from './random-beauties-data.mjs';
export {RANDOM_PORTRAITS} from './random-beauties-data.mjs';
// Retain deterministic recipe migration for existing saves; rendering uses complete portraits.
const imageCache=new Map();
export function rasterRecipe(person,previous){let n=previous.seed>>>0;const pick=()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return Math.floor(n/4294967296*10);};const recipe={version:3,artVersion:1,compositeVersion:1,seed:previous.seed>>>0,cityId:previous.cityId,culture:previous.culture,cityStyle:previous.cityStyle,body:pick(),face:pick(),hair:pick(),clothes:pick(),shoes:pick(),item:pick(),ornament:pick(),secondary:pick()};const localWardrobes=[[1,5,8],[0,5,7],[2,6,9],[2,6,7],[4,8,6],[1,3,8],[0,5,9],[0,2,6],[3,6,9],[1,4,8]];if(person.regionId==='sheng'){const local=localWardrobes[previous.cityStyle];recipe.clothes=local[recipe.clothes%local.length];}return recipe;}
export function portraitDataUrl(person){const cameo=tourCameo(person.travelOrigin?.easterEgg);if(cameo)return new URL('../'+cameo.portraitAsset,import.meta.url).href;const fixed=featuredBeautyFor(person);if(fixed)return new URL('../'+fixed.portraitAsset,import.meta.url).href;
 let seed=person.portraitRecipe?.seed;
 if(!Number.isInteger(seed)){seed=2166136261;for(const c of String(person.id??'')){seed^=c.charCodeAt(0);seed=Math.imul(seed,16777619)>>>0;}}
 const saved=resolveRandomPortraitAsset(person.randomPortraitAsset);
 const local=RANDOM_BEAUTY_ART.filter(row=>(row.regionId??'sheng')===(person.regionId??'sheng'));
 const pool=local.length?local:RANDOM_BEAUTY_ART;
 return new URL('../'+(saved??pool[(seed>>>0)%pool.length].asset),import.meta.url).href;
}
async function paintFixedBeauty(canvas,person){const url=portraitDataUrl(person),key='fixed:'+url;if(!imageCache.has(key))imageCache.set(key,new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>{imageCache.delete(key);reject(Error('人物专属立绘载入失败'));};im.src=url;}));const im=await imageCache.get(key);if(!canvas.isConnected)return;const pixelRatio=Math.min(2,Math.max(1,globalThis.devicePixelRatio||1));canvas.width=Math.round(480*pixelRatio);canvas.height=Math.round(800*pixelRatio);const ctx=canvas.getContext('2d');ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0);ctx.imageSmoothingQuality='high';if(canvas.dataset.transparent!=='true'){ctx.fillStyle='#f4eddf';ctx.fillRect(0,0,480,800);}const ratio=Math.min(480/im.width,800/im.height),w=im.width*ratio,h=im.height*ratio;ctx.drawImage(im,(480-w)/2,(800-h)/2,w,h);canvas.dataset.ready='true';canvas.dataset.signature=url;}
export async function paintBeauty(canvas,person){return paintFixedBeauty(canvas,person);}
export function paintPortraits(root,people){const byId=new Map(people.map(p=>[p.id,p]));for(const canvas of root.querySelectorAll('canvas[data-beauty]')){const person=byId.get(canvas.dataset.beauty);if(!person)continue;paintBeauty(canvas,person).catch(error=>{canvas.dataset.ready='false';canvas.setAttribute('aria-label',`${person.name}：${error.message}`);const ctx=canvas.getContext('2d');ctx.fillStyle='#eee4d2';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#806c4b';ctx.font='13px serif';ctx.textAlign='center';ctx.fillText('人物立绘暂未载入',canvas.width/2,canvas.height/2);});}}
export const portraitCanvas=p=>`<canvas width="480" height="800" data-beauty="${p.id}" role="img" aria-label="美人专属全身立绘"></canvas>`;
