// Isolated QA/demo snapshots. Never write these into the player's real save.
import {newGame} from '../../src/game.mjs';
import {endReign} from '../../src/ending-rules.mjs';
import {settleReignResult} from '../../src/reign-result.mjs';
import {capitalFalls,resolveCapital} from '../../src/capital-crisis.mjs';
import {recordWar} from '../../src/war-records.mjs';
import {executeJustice} from '../../src/justice.mjs';
import {ascensionFixture} from './honors-fixture.mjs';
export function endingFixture(reason='升仙',profile=null){
 let s=reason==='升仙'?ascensionFixture():newGame('景明');s.turn=profile==='unfinished'?1:Math.max(s.turn,721);s.stats.age=40;s.dynasty.heirId='prince-1';
 const home=s.domestic.playerCountryId;
 if(['civilMartial','conqueror'].includes(profile)){
  for(const c of s.domestic.countries)c.provinceIds=[];
  for(const p of s.domestic.provinces){p.countryId=home;s.domestic.countries.find(c=>c.id===home).provinceIds.push(p.id);}
 }
 const value=profile==='tyrant'||profile==='zhou'||profile==='inept'?15:['civilMartial','benevolent','restorer'].includes(profile)||reason==='升仙'?100:['troubled','warmonger'].includes(profile)?40:60;
 for(const p of s.domestic.provinces.filter(p=>p.countryId===home)){p.status.livingStandard=value;for(const k of ['stability','security','loyalty'])p.welfare[k]=value;for(const e of Object.values(p.economy)){e.productivity=value;}}
 if(profile==='keeper')s.stats.prestige=s.domestic.countries.find(c=>c.id===home).prestige=100;
 if(profile==='troubled')s.stats.prestige=s.domestic.countries.find(c=>c.id===home).prestige=0;
 if(profile==='warmonger')for(let i=0;i<10;i++)recordWar(s.domestic,s.domestic.war.nextId++,{win:false,homeDead:100,enemyDead:10});
 if(profile==='restorer'){const old=newGame('先帝');for(const p of old.domestic.provinces.filter(p=>p.countryId===home)){p.status.livingStandard=10;for(const k of ['stability','security','loyalty'])p.welfare[k]=10;}endReign(old,'寿元已尽','隔离先朝记录');settleReignResult(old);s.dynasty.pastReigns=[old.reignResult];}
 if(profile==='civilMartial'){s.stats.wisdom=s.stats.martial=450;for(let i=0;i<3;i++)recordWar(s.domestic,s.domestic.war.nextId++,{win:true,homeDead:20,enemyDead:50});}
 if(profile==='conqueror')for(let i=0;i<5;i++)recordWar(s.domestic,s.domestic.war.nextId++,{win:true,homeDead:20,enemyDead:50});
 if(profile==='benevolent')s.mother.filialPiety=s.dynasty.parenting=90;
 if(['tyrant','zhou'].includes(profile)){
  for(const o of s.domestic.justice.officials.slice(0,profile==='zhou'?5:3)){
   const official=s.domestic.justice.officials.find(p=>p.id===o.id);official.status='imprisoned';official.prison={admittedTurn:1,lastSettledTurn:1,servedTurns:0,lastDelta:0,totalDelta:0,lastReason:'隔离验收囚臣'};
   s=executeJustice(s,{kind:'execute',officialId:official.id,id:s.domestic.justice.nextId}).state;
  }
 }
 if(reason==='亡国'){capitalFalls(s.domestic,'xi',s.turn);return resolveCapital(s,{kind:'surrender',confirm:true}).state;}
 endReign(s,reason,'隔离演出验收');settleReignResult(s);return s;
}
