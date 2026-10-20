import {HISTORICAL_POTENTIAL,POTENTIAL_PRIMARY_SOURCES} from './historical-potential.mjs';
import {HISTORICAL_PEOPLE} from './historical-people.mjs';
import {ORIGINAL_OFFICIAL_TEMPLATES} from './original-officials.mjs';
export const GROWTH_KEYS=['intelligence','martial','leadership','politics','integrity'];
export const STUDY_KEYS=['intelligence','martial','leadership','politics'];
export const GROWTH_LABELS={intelligence:'智力',martial:'武力',leadership:'统率',politics:'政务',integrity:'清廉'};
const historical=new Map(HISTORICAL_PEOPLE.map(p=>[p.id,p]));
const originals=new Map(ORIGINAL_OFFICIAL_TEMPLATES.map(p=>[`original-${p.index}`,p]));
const integer=n=>Number.isSafeInteger(n)&&n>=0&&n<=100;
function sourceBase(p){const id=p.id?.replace(/^recruit-/,''),h=historical.get(id),o=originals.get(id);
 if(h)return h;
 if(o){const [,intelligence,martial,integrity]=o.u16_fields;return {intelligence,martial,integrity,leadership:martial,politics:intelligence};}
 return null;
}
function potentialRoll(p,key){
 const identity=p.id?.replace(/^recruit-/,'')??p.name??'';
 let n=2166136261;for(const c of identity+':'+key)n=Math.imul(n^c.charCodeAt(0),16777619)>>>0;
 n=Math.imul(n^(n>>>16),0x7feb352d);n=Math.imul(n^(n>>>15),0x846ca68b);return ((n^(n>>>16))>>>0)/4294967296;
}
export function randomPotentialTier(p,version=p.potential?.version??3){const roll=potentialRoll(p,'tier');return version>=3&&roll<.001?'legendary':roll<.01?'exceptional':roll<.10?'talented':'ordinary';}
function randomPotentialCaps(base,p,version){
 const tier=randomPotentialTier(p,version),skills=[...STUDY_KEYS].sort((a,b)=>base[b]-base[a]||STUDY_KEYS.indexOf(a)-STUDY_KEYS.indexOf(b)),primary=skills[0],eliteCount=potentialRoll(p,'elite-count')<.2?3:2;
 return Object.fromEntries(GROWTH_KEYS.map(key=>{
  const v=base[key],roll=potentialRoll(p,key),margin=5+Math.floor(roll*11);
  if(key==='integrity')return [key,v];
  let cap=Math.min(70,v+margin);
  if(tier==='talented')cap=Math.min(key===primary?85:75,v+10+Math.floor(roll*16));
  if(tier==='exceptional')cap=key===primary?90+Math.floor(roll*6):Math.min(85,v+15+Math.floor(roll*16));
  if(tier==='legendary')cap=skills.indexOf(key)<eliteCount?95+Math.floor(roll*6):Math.min(85,v+15+Math.floor(roll*16));
  return [key,Math.max(v,cap)];
 }));
}
function potentialFrom(base,p,version=1){
 if(version>=2&&p.generated&&!sourceBase(p))return randomPotentialCaps(base,p,version);
 const max=p.generated?95:100,identity=p.id?.replace(/^recruit-/,'')??p.name??'';
 const margin=key=>5+[...identity+':'+key].reduce((n,c)=>(Math.imul(n,31)+c.charCodeAt(0))>>>0,0)%16;
 if(sourceBase(p)){const reviewed=HISTORICAL_POTENTIAL.get(p.name);return reviewed?{...reviewed.caps}:{...base};}
 const caps=Object.fromEntries(GROWTH_KEYS.map(k=>{const v=base[k],ceiling=v<40?Math.min(50,v+margin(k)):v<70?Math.min(80,v+margin(k)):Math.min(100,v+margin(k));return [k,Math.max(v,Math.min(max,ceiling))];}));
 return caps;
}
// Potential is fixed at creation/migration, never recalculated from trained values.
export function ensureOfficialGrowth(p){
 if(p.potential!==undefined)return p.potential;
 const source=sourceBase(p),base=Object.fromEntries(GROWTH_KEYS.map(k=>[k,Math.max(0,Math.min(100,Math.round(source?.[k]??p[k]??0)))]));
 const version=p.generated&&!source?3:1;
 p.potential={version,base,caps:potentialFrom(base,p,version)};return p.potential;
}
export function abilityCap(p,key){const potential=p.potential??{caps:potentialFrom(Object.fromEntries(GROWTH_KEYS.map(k=>[k,sourceBase(p)?.[k]??p[k]??0])),p,p.generated?3:1)};return potential.caps[key];}
export function gainOfficialAbility(p,key,amount=1,systemCap=100){
 if(key==='experience')return gainOfficialExperience(p,Math.max(0,Math.min(amount,systemCap-(p.experience??0))));
 if(!STUDY_KEYS.includes(key))throw Error('官员成长科目无效');
 ensureOfficialGrowth(p);const current=p[key]??0,gain=Math.max(0,Math.min(amount,abilityCap(p,key)-current,systemCap-current));
 if(gain){p[key]=current+gain;p.growthVersion=1;}return gain;
}
export function gainOfficialExperience(p,amount=1){const before=p.experience??0,gain=Math.max(0,Math.min(amount,100-before));if(gain){p.experience=before+gain;p.growthVersion=1;}return gain;}
export function validateOfficialGrowth(p){
 const g=p.potential;if(g===undefined)return;
 if(![1,2,3].includes(g.version)||!g.base||!g.caps||GROWTH_KEYS.some(k=>!integer(g.base[k])||!integer(g.caps[k])))throw Error('官员个人潜力无效');
 const source=sourceBase(p);if(source&&GROWTH_KEYS.some(k=>g.base[k]!==source[k]))throw Error('历史官员潜力基准无效');
 if(g.version>=2&&(!p.generated||source))throw Error('官员个人潜力版本无效');
 const caps=potentialFrom(g.base,p,g.version);if(GROWTH_KEYS.some(k=>g.caps[k]!==caps[k]))throw Error('官员能力上限无效');
 const progress=p.studyProgress;if(progress!==undefined&&(!Number.isSafeInteger(progress.experience)||progress.experience<0||progress.experience>=600||!Number.isSafeInteger(progress.lastTurn)||progress.lastTurn<0||!progress.abilities||GROWTH_KEYS.some(k=>!Number.isSafeInteger(progress.abilities[k])||progress.abilities[k]<0||progress.abilities[k]>=3600)))throw Error('官员研习进度无效');
}

export function potentialExplanation(p){
 if(p.generated&&p.potential?.version>=2)return {basis:`当前潜力：${{ordinary:'普通',talented:'优秀',exceptional:'奇才',legendary:'百年一遇奇才'}[randomPotentialTier(p)]}。随机人才潜力在生成时固定：普通90%，四项上限最高70；优秀9%，最擅长一项最高85；${p.potential.version>=3?'奇才0.9%，最擅长一项可达90–95；百年一遇奇才0.1%，两项潜力95–100，另有20%概率第三项也达95–100':'奇才1%，最擅长一项可达90–95'}。各项仍结合初始禀赋，已有能力不降低，清廉不可学习。`,source:'',sourceTitle:'分层个人潜力生成规则'};
 if(!sourceBase(p))return {basis:'随机或本朝人物：生成时按五项初始禀赋固定个人潜力，成长后不重算；旧档只补一次。',source:'',sourceTitle:'个人潜力生成规则'};
 const row=HISTORICAL_POTENTIAL.get(p.name),source=sourceBase(p);
 return row?{basis:row.basis+'。封顶数值是据史实作出的游戏设定，不是史料直接测量值。',source:POTENTIAL_PRIMARY_SOURCES[p.name]??source.source??'',sourceTitle:row.sourceTitle??({'诸葛亮':'《三国志》卷35·诸葛亮传','吕布':'《三国志》卷07·吕布传'}[p.name])??source.sourceTitle??'既有逐人史事与能力审定'}:{basis:'尚未完成可靠史实核对，暂以原模板五项值封顶，不编造额外成长空间。',source:'',sourceTitle:'原作模板，史实待考'};
}
