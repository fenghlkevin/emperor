import {difficultyRules} from './difficulty.mjs';
import {ensureOfficialGrowth} from './official-growth.mjs';
import {selectionEffect} from './central-office-effects.mjs';
import {ability100} from './emperor-rules.mjs';
import {HISTORICAL_PEOPLE} from './historical-people.mjs';
import {ORIGINAL_OFFICIAL_TEMPLATES} from './original-officials.mjs';
import {HISTORICAL_IDENTITY_OVERRIDES} from './historical-identity-overrides.mjs';
const aliases={'刘伯温':'刘基','苏东坡':'苏轼','公孙侨':'子产','晏平仲':'晏婴','陶士行':'陶侃','王阳明':'王守仁','孙子':'孙武','秦叔宝':'秦琼','刘罗锅':'刘墉'};
export const ACTIVE_HISTORICAL_PEOPLE=ORIGINAL_OFFICIAL_TEMPLATES.map(t=>{
 const reviewed=HISTORICAL_IDENTITY_OVERRIDES[`original-${t.index}`];
 if(reviewed)return {...reviewed,originalName:t.name};
 const p=HISTORICAL_PEOPLE.find(p=>p.name===(aliases[t.name]??t.name));
 if(p)return {...p,originalName:t.name};
 const [age,intelligence,martial,integrity,loyalty,experience]=t.u16_fields;
 return {id:`original-${t.index}`,name:t.name,dynasty:'原作',role:martial>intelligence?'武将':'文职',intelligence,martial,integrity,leadership:martial,politics:intelligence,initialAge:age,initialLoyalty:loyalty,initialExperience:experience,tags:['原作人物'],biography:'原作特殊人物表收录，未匹配到现有人物史料。',ratingStatus:'原作模板',ratingMethod:'原作模板',biographyStatus:'原作人物',ratingBasis:'智力、武力、清廉取原作模板；统率与政务分别沿用武力与智力作为游戏设定。',source:'',sourceTitle:'原作反汇编人物表',personality:'composed',characterTraits:['审慎自守']};
});
export const ABILITY_KEYS=['intelligence','martial','leadership','politics','integrity'];
export const RANDOM_ABILITY_CAPS=Object.fromEntries(ABILITY_KEYS.map(k=>[k,Math.floor(Math.max(...ACTIVE_HISTORICAL_PEOPLE.map(p=>p[k]))*.95)]));
const surnames='赵钱孙李周吴郑王冯陈褚卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞熊纪舒屈项祝董梁杜阮蓝闵席季麻强贾路娄危江童颜郭梅盛林刁钟徐邱骆高夏蔡田樊胡凌霍虞万支柯管卢莫经房裘缪干解应宗丁宣邓郁单杭洪包诸左石崔吉龚程邢裴陆荣翁荀羊甄曲封芮储靳段巫焦巴侯宁仇栾甘厉戎祖武符刘景詹束龙叶幸司韶黎乔苍双闻莘党翟谭贡劳姬申冉宰郦雍桑桂濮牛寿通边燕浦尚农温庄晏瞿茹习艾容向古易慎戈廖庾终暨居衡步都耿满弘匡国文寇广禄阙东欧殳沃利蔚越夔隆师巩厍聂晁勾敖融冷訾辛阚那简饶空曾毋沙乜养鞠须丰巢关蒯相查后荆红游竺权逯盖益桓公'.split('');
surnames.push('欧阳','司马','上官','诸葛','夏侯','东方','皇甫','尉迟','公孙','慕容','司徒','司空');
const given=[...'文明德安远志怀景行守正思元承彦子仲伯季云松柏清修仁义礼智信忠宁致宏毅达谦和诚勇威杰俊贤良允成泽平康泰绍庭岳川海林山启兴昌荣华'];
const pick=(a,r)=>a[Math.floor(r()*a.length)];
export function historicalChance(stats={}){const v=k=>ability100(stats?.[k]??250);return .05+.35*(v('charm')+v('wisdom'))/200;}
export function examSelection(d,stats){const e=selectionEffect(d),t=difficultyRules(d);return {...e,highChance:Math.min(1,e.highChance*t.talentFactor),historicalChance:Math.min(1,(historicalChance(stats)+e.historicalBonus)*t.historicalFactor),minCount:t.examMin+e.extra,maxCount:t.examMax+e.extra};}
// Ordinary recruits have modest, middle-weighted abilities; a rare specialist is not an all-round master.
export function randomExamAbilities(random,role,talentChance){
 const skills=['intelligence','martial','leadership','politics'];
 const abilities=Object.fromEntries(skills.map(key=>[key,10+Math.floor((random()+random())/2*56)]));
 abilities.integrity=Math.floor(random()*(RANDOM_ABILITY_CAPS.integrity+1));
 if(random()<talentChance){const [primary,secondary]=role==='武将'?['martial','leadership']:['intelligence','politics'];abilities[primary]=70+Math.floor(random()*16);abilities[secondary]=Math.max(abilities[secondary],50+Math.floor(random()*21));}
 return abilities;
}
export function createExamCandidates(d,turn,random,stats){
 const excluded=new Set([...d.justice.officials.map(o=>o.name),...d.personnel.retired]);
 const pool=ACTIVE_HISTORICAL_PEOPLE.filter(o=>!excluded.has(o.name));
 const forbidden=new Set([...HISTORICAL_PEOPLE.map(p=>p.name),...ACTIVE_HISTORICAL_PEOPLE.map(p=>p.name),...excluded]);
 const selection=examSelection(d,stats),count=selection.minCount+Math.floor(random()*(selection.maxCount-selection.minCount+1)),result=[];
 for(let i=0;i<count;i++){
  if(i<count-1&&pool.length&&(i===0&&(d.difficulty?.examMisses??0)>=3&&difficultyRules(d).id==='novice'||random()<selection.historicalChance)){
   const o=pool.splice(Math.floor(random()*pool.length),1)[0];const {dimensionEvidence,ratingBasis,...profile}=o;
   result.push({...profile,age:o.initialAge,loyalty:o.initialLoyalty,experience:o.initialExperience});
  }else{
   let name=pick(surnames,random)+pick(given,random)+(random()<.7?pick(given,random):'');
   // Deterministic fallback also terminates when a supplied RNG always returns the same value.
   if(forbidden.has(name)){let n=0;do{name=surnames[n%surnames.length]+given[Math.floor(n/surnames.length)%given.length]+given[Math.floor(n/(surnames.length*given.length))%given.length];n++;}while(forbidden.has(name));}
   const role=i===0?'武将':i===1?'文职':random()<.5?'武将':'文职';
   const abilities=randomExamAbilities(random,role,i===0&&!pool.length&&(d.difficulty?.examMisses??0)>=3&&difficultyRules(d).id==='novice'?1:selection.highChance);
   result.push({id:`random-${turn}-${i}`,name,generated:true,dynasty:'本朝',role,...abilities,age:18+Math.floor(random()*28),loyalty:40+Math.floor(random()*51),experience:Math.floor(random()*51),tags:['制举新秀'],biography:'本朝制举选出的新秀。',personality:'composed'});
  }
  ensureOfficialGrowth(result.at(-1));
  forbidden.add(result.at(-1).name);
 }
 if(!result.some(p=>p.role==='武将'))result.at(-1).role='武将';
 if(!result.some(p=>p.role==='文职'))result.at(-1).role='文职';
 if(d.difficulty?.id==='novice')d.difficulty.examMisses=result.some(p=>!p.generated)?0:d.difficulty.examMisses+1;
 return result;
}
