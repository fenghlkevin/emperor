import {difficultyRules} from './difficulty.mjs';
import {nationalFoodForecast,postNationalGrain} from './national-resources.mjs';
import {postTreasury} from './finance.mjs';
export function leisureAidStatus(s){const d=s.domestic,a=d.difficulty?.aid,c=d.countries.find(c=>c.id===d.playerCountryId),need=nationalFoodForecast(d,s.turn+1).need;let reason='';
 if(difficultyRules(d).id!=='novice'||!a)reason='休养援助仅适用于新帝登基';
 else if(s.stats.life<=0||s.reignResult||d.collapse.pending||d.collapse.ended||d.war.battle||d.strategy.pending)reason='请先处理当前战事或终局';
 else if(a.used>=2)reason='本朝两次援助已用完';
 else if(a.used&&s.turn-a.lastTurn<36)reason=`还需休养${36-(s.turn-a.lastTurn)}旬方可再次领取`;
 else if(c.fiscal.treasury>=10000&&c.fiscal.grain>=need*12)reason='当前钱粮充足，无须援助';
 return {canClaim:!reason,reason,remaining:2-(a?.used??0),silver:10000,grain:need*12};}
export function claimLeisureAid(state){const q=leisureAidStatus(state);if(!q.canClaim)throw Error(q.reason);const s=structuredClone(state),d=s.domestic,a=d.difficulty.aid,key=`leisure-aid:${s.dynasty.reignStartTurn}:${a.used}`;
 postTreasury(d,d.playerCountryId,{turn:s.turn,income:q.silver,category:'oneOff',reason:'休养援助',key});postNationalGrain(d,d.playerCountryId,{turn:s.turn,income:q.grain,category:'purchase',reason:'休养援助',key});a.used++;a.lastTurn=s.turn;a.records.push({turn:s.turn,silver:q.silver,grain:q.grain});s.stats.treasury=d.countries.find(c=>c.id===d.playerCountryId).fiscal.treasury;return s;}
