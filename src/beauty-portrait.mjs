import {cityForBeauty} from './beauty-cities.mjs';
export function portraitHash(value){let h=2166136261;for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return h>>>0;}
export function portraitRandom(seed){let n=seed>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
import {rasterRecipe} from './beauty-raster-portrait.mjs';
export function createPortraitRecipe(person,salt=''){const city=cityForBeauty(person);return rasterRecipe(person,{seed:portraitHash(`${salt}|${person.id}|${city?.id}`),cityId:city.id,culture:city.culture,cityStyle:city.style});}
export function ensurePortrait(person,salt=''){person.cityId??=cityForBeauty(person)?.id;if(!person.portraitRecipe)person.portraitRecipe=createPortraitRecipe(person,salt);else if(person.portraitRecipe.version<3)person.portraitRecipe=rasterRecipe(person,person.portraitRecipe);return person;}
export function validatePortrait(person){const p=person.portraitRecipe;if(!p||p.version!==3||p.artVersion!==1||p.compositeVersion!==1||p.cityId!==person.cityId||p.culture!==cityForBeauty(person)?.culture||cityForBeauty(person)?.regionId!==person.regionId)throw Error('人物立绘组合无效');for(const [k,max]of Object.entries({seed:4294967295,body:9,face:9,hair:9,clothes:9,shoes:9,item:9,ornament:9,secondary:9,cityStyle:42}))if(!Number.isInteger(p[k])||p[k]<0||p[k]>max)throw Error('人物立绘部件无效');}
