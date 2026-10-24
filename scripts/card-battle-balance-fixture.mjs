import {attachCards,createFixedCardPerson,commanderSkill,personSeed} from '../src/card-battle.mjs';
export const ROSTERS={mixed_1800:{infantry:500,spears:400,cavalry:400,archers:300,'heavy-cavalry':200},infantry_1800:{infantry:1800},cavalry_1800:{cavalry:1000,'heavy-cavalry':800},ranged_1800:{archers:900,crossbows:900},heavy_1800:{'heavy-cavalry':1800},exotic_1800:{camel:600,'horse-archers':600,elephant:600},mixed_600:{infantry:200,spears:200,cavalry:100,archers:100},reserve_3600:{infantry:1000,spears:800,cavalry:800,archers:600,'heavy-cavalry':400}};
export function profile(side,index,role,definition,profileSeed=0){
 const person={id:side+'-officer-'+index,name:['沈明远','陆景和','顾文清','韩怀诚','许承礼','陈弘毅'][index%6]+(side==='home'?'':'乙'),martial:role==='martial'?70:role==='command'?50:35,intelligence:role==='intelligence'?70:45,leadership:role==='command'?70:60,role:role==='intelligence'?'文职':'武将'};
 const p=createFixedCardPerson(person,personSeed('fixture-officer-'+index+':'+profileSeed));
 if(definition){p.historicalDefinitionId=definition.person_id;p.definitionId=definition.id;p.name=definition.name;p.portraitId=definition.person_id;}
 return {person,p};
}
export function fixture({roster=ROSTERS.mixed_1800,roster2=roster,training=60,training2=training,hero='martial',hero2=hero,seeds={home:17,enemy:19},first='home',people,people2=people,generals=true,profileSeed=0}={}){
 const b={command:{id:1},round:1,result:null,log:[],units:[],cardPeople:{}};
 for(const [side,map,t,h,defs]of [['home',roster,training,hero,people],['enemy',roster2,training2,hero2,people2]]){
  let i=0;const chunks=Object.entries(map).flatMap(([kind,n])=>{const count=Object.keys(map).length<3?Math.ceil(3/Object.keys(map).length):1;return Array.from({length:count},(_,j)=>[kind,Math.floor(n/count)+(j<n%count?1:0)]);});
  for(const [kind,n]of chunks){
   const {person,p}=profile(side,i,['martial','intelligence','command'][i%3],undefined,profileSeed);
   b.cardPeople[person.id]=p;b.units.push({id:side+'-u'+i,side,kind,initial:n,count:n,dead:0,training:t,equipped:true,equipmentFactor:1,sourceId:side,name:kind,general:person,cardPersonId:generals?person.id:undefined,commander:false,fled:false});i++;
  }
  const stats={martial:h==='martial'?80:50,intelligence:h==='intelligence'?80:50,leadership:h==='command'?80:50},person={id:side+'-commander',name:side==='home'?'沈文远':'陆弘毅',...stats},p=createFixedCardPerson(person,personSeed(person.id));b.cardPeople[person.id]=p;
  b.units.push({id:side+'-leader',side,kind:'cavalry',initial:100,count:100,dead:0,training:t,sourceId:side,name:person.name+'亲卫',general:person,cardPersonId:person.id,commander:true,fled:false});
 }
 attachCards(b,{first,seeds});if(people||people2){for(const [side,definitions]of [['home',people],['enemy',people2]]){if(!definitions)continue;const slots=Object.values(b.cards.catalog).filter(x=>x.side===side&&x.type==='general');definitions.slice(0,slots.length).forEach((definition,i)=>{const u=b.units.find(u=>u.id===slots[i].unitId),p=b.cardPeople[u.cardPersonId];p.historicalDefinitionId=definition.person_id;p.definitionId=definition.id;p.name=definition.name;p.portraitId=definition.person_id;});}attachCards(b,{first,seeds});}return b;
}
