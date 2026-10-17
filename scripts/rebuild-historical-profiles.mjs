// 独立设计缺任何一人就报错，不再回退到通用分档。
import fs from 'node:fs/promises';
import {HISTORICAL_PEOPLE} from '../src/historical-people.mjs';
import {HISTORICAL_RATINGS} from '../src/historical-ratings.mjs';
const facts=JSON.parse(await fs.readFile(new URL('../src/historical-evidence.json',import.meta.url),'utf8'));
const designs=JSON.parse(await fs.readFile(new URL('../src/historical-designs.json',import.meta.url),'utf8'));
const personalities=JSON.parse(await fs.readFile(new URL('../src/historical-personalities.json',import.meta.url),'utf8'));
const originalManual=new Map(HISTORICAL_RATINGS.map(p=>[p.name,p]));
const keys=['intelligence','martial','leadership','politics','integrity'];
if(Object.keys(designs).length!==HISTORICAL_PEOPLE.length)throw Error('独立人物设计数量与名册不一致');
const people=HISTORICAL_PEOPLE.map(old=>{
 const card=designs[old.id],fact=facts[old.id],character=personalities[old.id];
 if(!character||character.name!==old.name)throw Error(old.name+'缺少历史性格设计');
 if(!card||card.name!==old.name||keys.some(k=>!Number.isInteger(card[k])||card[k]<0||card[k]>100||!card.dimensionEvidence[k]?.length))throw Error(`${old.id} ${old.name}缺少逐项人物设计`);
 let biography=originalManual.get(old.name)?.biography??fact?.text;
 const primary=card.designMethod==='逐人史事审定';
 if(primary&&(!biography||fact?.kind==='identity'))biography=card.historySummary??card.designNote;
 if(!biography)throw Error(old.name+'缺少简介');
 const bioStatus=originalManual.has(old.name)||primary&&fact?.kind==='identity'?'史事摘要':fact?.kind==='biography'?'百科导言节录':fact?.kind==='career-record'?'本人任官著述记录':'身份与设定说明';
 return {...old,...character,...Object.fromEntries(keys.map(k=>[k,card[k]])),tags:card.tags,biography,source:card.source,sourceTitle:card.sourceTitle,biographyStatus:bioStatus,ratingStatus:'逐人设定',ratingMethod:card.designMethod,ratingConfidence:card.designConfidence,ratingBasis:card.ratingBasis,designNote:card.designNote,dimensionEvidence:card.dimensionEvidence,designCaveats:card.designCaveats,initialAge:30,initialLoyalty:65,initialExperience:card.initialExperience,ratingVersion:5};
});
await fs.writeFile(new URL('../src/historical-people.mjs',import.meta.url),'// Individually stored historical game designs; see docs/historical-ratings.md.\nexport const HISTORICAL_PEOPLE='+JSON.stringify(people)+';\n');
console.log(JSON.stringify({total:people.length,designed:people.filter(p=>p.ratingStatus==='逐人设定').length,missing:people.filter(p=>!p.dimensionEvidence).length,sourceBased:people.filter(p=>p.ratingMethod==='逐项史料设计').length,individualReview:people.filter(p=>p.ratingMethod==='逐人史事审定').length}));
