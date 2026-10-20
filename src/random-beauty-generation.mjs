import {BEAUTY_REGIONS,CULTURES} from './beauties.mjs';
import {BEAUTY_CITIES} from './beauty-cities.mjs';
import {RANDOM_BEAUTY_ART} from './random-beauties-data.mjs';
// Appearance and innate ability are rolled independently; ranges are inclusive.
export const RANDOM_BEAUTY_TIERS=[
 {name:'一般般',weight:450,appearance:[30,49],ability:[20,39]},
 {name:'一般',weight:350,appearance:[50,64],ability:[40,69]},
 {name:'较好',weight:150,appearance:[65,79],ability:[70,109]},
 {name:'美人',weight:45,appearance:[80,94],ability:[110,159]},
 {name:'绝世美人',weight:5,appearance:[95,100],ability:[160,200]}
];
const pick=(xs,random)=>xs[Math.floor(random()*xs.length)];
export function rollBeautyStat(key,random){
 let roll=random()*1000;
 const tier=RANDOM_BEAUTY_TIERS.find(t=>(roll-=t.weight)<0)??RANDOM_BEAUTY_TIERS.at(-1);
 const [min,max]=tier[key];return min+Math.floor(random()*(max-min+1));
}
export const isGeneratedBeautyId=id=>typeof id==='string'&&/^random-beauty-(?:tour-)?[0-9]+-[0-9]+$/.test(id);
export function generateBeauty({id,cityId='guannei',random}){
 const city=BEAUTY_CITIES.find(c=>c.id===cityId);if(!city)throw Error('佳人籍贯州无效');
 const r=BEAUTY_REGIONS.find(r=>r.id===city.regionId),c=CULTURES[r.culture];
 const given=pick(c.first,random),extra=pick(Array.from('清月云雪兰芷玉锦秋春若映舒宁婉瑶'),random);
 const name=r.id==='sheng'?pick(c.last,random)+(random()<.5?given:extra+pick(Array.from('华音微荷晴霜溪棠柔烟'),random)):['japan','korea','nanzhao'].includes(r.culture)?pick(c.last,random)+given:given+'·'+pick(c.last,random);
 const localArt=RANDOM_BEAUTY_ART.filter(a=>r.id==='sheng'?!a.regionId||a.regionId==='sheng':a.regionId===r.id);
 const specific=localArt.filter(a=>a.id===cityId);
 const provincial=r.id==='sheng'?localArt.filter((a,i)=>i%10===city.style):[];
 const art=(specific.length?specific:provincial.length?provincial:localArt);const randomPortraitAsset=art.length?pick(art,random).asset:undefined;
 const appearance=rollBeautyStat('appearance',random),baseAbility=rollBeautyStat('ability',random);
 const personality=pick(['沉静细致','爽朗坦诚','机敏好学','温和坚韧','自信果决','风趣健谈','独立洒脱','好奇敏锐'],random),specialty=pick(c.skills,random);
 const background=pick(['书香门第','商贾之家','工匠之家','医者之家','乡野人家','地方艺坊'],random);
 return {id,name,origin:'原创',regionId:r.id,region:r.name,culture:r.culture,dress:r.dress,portrait:r.portrait,cityId,age:18+Math.floor(random()*8),appearance,baseAbility,ability:baseAbility,experience:0,personality,specialty,biography:`出身${city.name}${background}，${personality}，擅长${specialty}。`,rank:null,randomBeauty:true,...(randomPortraitAsset?{randomPortraitAsset}:{regionalPortrait:true})};
}
