import fs from 'node:fs';
import {fixture,ROSTERS} from './card-battle-balance-fixture.mjs';
import {CARD_RULES,attachCards,cardAI,actCardsMutable,validateCards,personSeed} from '../src/card-battle.mjs';
const pairs=Number(process.argv.find(x=>x.startsWith('--pairs='))?.split('=')[1]??80);
const scenarios=[
 {id:'mirror',name:'同条件对照'},
 {id:'training30',name:'训练30 对 60',training:30},
 {id:'training90',name:'训练90 对 60',training:90},
 {id:'officers35',name:'带队能力35 对 60',officers:35},
 {id:'officers90',name:'带队能力90 对 60',officers:90},
 {id:'commander35',name:'主将统率35 对 60',commander:35},
 {id:'commander90',name:'主将统率90 对 60',commander:90},
 {id:'army1200',name:'兵力1200 对 1800',roster:{infantry:334,spears:266,cavalry:266,archers:200,'heavy-cavalry':134}},
 {id:'army600',name:'兵力600 对 1800',roster:ROSTERS.mixed_600},
 {id:'army3600',name:'兵力3600 对 1800',roster:ROSTERS.reserve_3600},
 {id:'quality',name:'600精兵良将 对 1800普通军',roster:ROSTERS.mixed_600,training:90,officers:90,commander:90}
];
const rows=[];
for(const version of ['old','new'])for(const scenario of scenarios){
 const saved=CARD_RULES.attributeRules;if(version==='old')delete CARD_RULES.attributeRules;
 let wins=0,draws=0,stepsTotal=0,rounds=0,dead=0,firstScore=0;const paired=[];
 try{for(let i=0;i<pairs;i++){
  let pair=0;
  for(const first of ['home','enemy']){
   const seed=personSeed('attributes-20261026:'+i),seeds={home:personSeed(seed+':a'),enemy:personSeed(seed+':b')};
   const b=fixture({roster:scenario.roster??ROSTERS.mixed_1800,roster2:ROSTERS.mixed_1800,training:scenario.training??60,training2:60,first,seeds,profileSeed:seed});
   // Hold templates, skills and decks fixed: isolate numeric ability effects.
   for(const u of b.units){const abilities=b.cardPeople[u.cardPersonId].abilities;
    if(u.commander){abilities.leadership=u.side==='home'?(scenario.commander??60):60;}
    else for(const key of ['martial','intelligence','leadership'])abilities[key]=u.side==='home'?(scenario.officers??60):60;
   }
   attachCards(b,{first,seeds,seed});validateCards(b);
   let steps=0;while(!b.result&&steps++<2500)actCardsMutable(b,cardAI(b));
   if(!b.result)throw Error('simulation stalled');validateCards(b);
   const score=b.result==='victory'?1:b.result==='draw'?.5:0;wins+=b.result==='victory';draws+=b.result==='draw';pair+=score/2;firstScore+=first==='home'?score:1-score;stepsTotal+=steps;rounds+=b.round;dead+=b.units.filter(u=>u.side==='home').reduce((n,u)=>n+u.dead,0);
  }paired.push(pair);
 }}finally{CARD_RULES.attributeRules=saved;}
 const games=pairs*2,rate=(wins+draws*.5)/games,sd=Math.sqrt(paired.reduce((n,v)=>n+(v-rate)**2,0)/Math.max(1,pairs-1)),error=1.96*sd/Math.sqrt(pairs);
 const row={version,id:scenario.id,name:scenario.name,games,wins,draws,score:rate,ci95:[Math.max(0,rate-error),Math.min(1,rate+error)],firstScore:firstScore/games,meanRounds:rounds/games,meanHomeDeaths:dead/games,actions:stepsTotal};rows.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync('docs/card-battle-attributes-simulation.json',JSON.stringify({date:'2026-10-26',pairs,method:'Production card AI; fixed template profiles, same seed per pair, exchanged first seat; numeric abilities isolated from template and commander-skill selection. Score counts draw as half; CI from paired scores.',attributeRules:CARD_RULES.attributeRules,rows},null,2)+'\n');
