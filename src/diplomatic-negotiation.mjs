import {diplomaticPreparation} from './central-office-effects.mjs';
import {centralPolicy} from './state-development.mjs';
export function quoteNegotiation(state,c){
 const d=state.domestic,home=d.countries.find(x=>x.id===d.playerCountryId),target=d.countries.find(x=>x.id===c.countryId),r=d.diplomacy.find(r=>r.countryIds.includes(home.id)&&r.countryIds.includes(c.countryId));
 if(!r||!target?.provinceIds.length)throw Error('该国已无领土，不能进行新谈判');
 if(!['treaty','trade','demand','marryIn','marryOut'].includes(c.kind))return {accepted:true,score:0,required:0,reason:'单方事务无需谈判'};
 const prestige=home.prestige-target.prestige,army=id=>d.provinces.filter(p=>p.countryId===id).reduce((n,p)=>n+p.population.professions.soldiers,0),strength=Math.max(-10,Math.min(10,Math.round(5*(army(home.id)/Math.max(1,army(target.id))-1))));
 let score=r.friendship+Math.round(prestige/4)+strength+Math.round((centralPolicy(d,'rites-minister').ability-50)/5),required=0,reason='';
 if(c.kind==='treaty'){score+=diplomaticPreparation(d);required=({nonaggression:40,defense:60,protector:65,protected:35})[c.treaty];if(required===undefined)throw Error('请选择条约');reason='依据友善度与两国威望';if(r.relation==='hostile')score-=30;}
 else if(c.kind==='trade'){for(const k of ['exports','imports'])if(!Number.isSafeInteger(c[k])||c[k]<0||c[k]>1000000)throw Error('金额须为 0–1,000,000 的整数');required=30;score-=Math.ceil(Math.max(0,c.exports-c.imports)/Math.max(1,target.fiscal.treasury)*100);reason='依据友善度、威望与双方约定的互市额度';}
 else if(c.kind==='demand'){if(!Number.isSafeInteger(c.amount)||c.amount<0||c.amount>1000000)throw Error('金额须为 0–1,000,000 的整数');required=c.amount?55:0;score+=Math.round(prestige/2)-Math.ceil(c.amount/Math.max(1,target.fiscal.treasury)*100);reason='依据威望差距与贡银占对方国库比例';}
 else if(['marryIn','marryOut'].includes(c.kind)){required=40;reason='依据友善度与威望';}
 return {accepted:score>=required,score,required,reason:reason||'单方事务无需谈判'};
}
