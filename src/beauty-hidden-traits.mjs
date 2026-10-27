import {portraitHash,portraitRandom} from './beauty-portrait.mjs';

export const HIDDEN_TRAITS={longevity:'舒心延年',care:'调养有方',harmony:'琴瑟和鸣',education:'教子有方',advice:'贤妃劝谏'};
export const HIDDEN_TRAIT_RULES={rareChance:.4,secondChance:.3};
export function beautyTraitSource(p){
 if(p.travelOrigin)return 'event';
 if(p.randomBeauty||p.foreignRoyal)return 'random';
 return p.featured||/历史|传说|原作/.test(p.origin??'')?'historical':'random';
}
export function ensureBeautyTraits(p,salt=''){
 if(p.hiddenTraits!==undefined)return p;
 const source=beautyTraitSource(p),random=portraitRandom(portraitHash(`${salt}|hidden-traits-v1|${source}|${p.id}`));
 const kinds=[];
 if(source==='historical'||random()<HIDDEN_TRAIT_RULES.rareChance){
  const count=random()<HIDDEN_TRAIT_RULES.secondChance?2:1,pool=Object.keys(HIDDEN_TRAITS);
  for(let i=0;i<count;i++)kinds.push(pool.splice(Math.floor(random()*pool.length),1)[0]);
 }
 p.hiddenTraits={version:1,source,kinds};return p;
}
export function hasBeautyTrait(p,kind){return p.hiddenTraits?.kinds?.includes(kind)===true;}
export function validateBeautyTraits(p){
 const t=p.hiddenTraits;
 if(!t||t.version!==1||t.source!==beautyTraitSource(p)||!Array.isArray(t.kinds)||t.kinds.length>2||
  (t.source==='historical'&&t.kinds.length<1)||new Set(t.kinds).size!==t.kinds.length||t.kinds.some(k=>!Object.hasOwn(HIDDEN_TRAITS,k)))throw Error('后宫隐藏特性无效');
}
